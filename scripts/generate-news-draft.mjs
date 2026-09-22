import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import {
  buildScheduleDates,
  dateInTimeZone,
  formatDisplayDate,
  parseArticleRequests,
} from './news-automation-utils.mjs';

const API_URL = 'https://api.deepseek.com/chat/completions';
const NEWS_DIRECTORY = resolve(process.cwd(), 'src', 'content', 'news');
const SETTINGS_PATH = resolve(process.cwd(), 'src', 'content', 'news-automation', 'settings.json');
const LENGTH_GUIDANCE = {
  short: '2–3 смысловых раздела и примерно 3–5 абзацев',
  medium: '3–5 смысловых разделов и примерно 6–9 абзацев',
  long: '5–8 смысловых разделов и примерно 10–14 абзацев',
};

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

function parsePayload(value) {
  let payload;

  try {
    payload = JSON.parse(value);
  } catch {
    throw new Error('PAGES_CMS_PAYLOAD must be valid JSON.');
  }

  if (!payload || typeof payload !== 'object' || !payload.inputs || typeof payload.inputs !== 'object') {
    throw new Error('Pages CMS payload does not contain an inputs object.');
  }

  return payload.inputs;
}

function cleanInput(value, name, { required = false, maxLength }) {
  if (value !== undefined && value !== null && typeof value !== 'string') {
    throw new Error(`${name} must be a string.`);
  }

  const result = (value ?? '').replaceAll('\r\n', '\n').trim();
  if (required && !result) throw new Error(`${name} is required.`);
  if (result.length > maxLength) throw new Error(`${name} is longer than ${maxLength} characters.`);
  return result;
}

function integerInput(value, name, fallback, minimum, maximum) {
  const result = value === undefined || value === null || value === '' ? fallback : Number(value);
  if (!Number.isInteger(result) || result < minimum || result > maximum) {
    throw new Error(`${name} must be an integer from ${minimum} to ${maximum}.`);
  }
  return result;
}

async function loadSettings() {
  const settings = JSON.parse(await readFile(SETTINGS_PATH, 'utf8'));
  if (!['deepseek-flash', 'deepseek-v4-pro'].includes(settings.model)) {
    throw new Error('The configured DeepSeek model is not supported.');
  }
  if (typeof settings.temperature !== 'number' || settings.temperature < 0 || settings.temperature > 2) {
    throw new Error('temperature must be a number from 0 to 2.');
  }
  if (!Number.isInteger(settings.maxBatchSize) || settings.maxBatchSize < 1 || settings.maxBatchSize > 30) {
    throw new Error('maxBatchSize must be an integer from 1 to 30.');
  }
  if (!Number.isInteger(settings.maxPublicationsPerRun)
    || settings.maxPublicationsPerRun < 1
    || settings.maxPublicationsPerRun > 10) {
    throw new Error('maxPublicationsPerRun must be an integer from 1 to 10.');
  }
  if (typeof settings.defaultCover !== 'string'
    || !/^\/media\/[a-zA-Z0-9._/-]+$/.test(settings.defaultCover)
    || settings.defaultCover.includes('..')) {
    throw new Error('defaultCover must be a local /media/ path.');
  }
  if (typeof settings.editorialPrompt !== 'string' || settings.editorialPrompt.trim().length < 20) {
    throw new Error('editorialPrompt must contain at least 20 characters.');
  }
  return settings;
}

function validateInputs(rawInputs, settings) {
  const length = cleanInput(rawInputs.length, 'length', { maxLength: 20 }) || 'medium';
  if (!(length in LENGTH_GUIDANCE)) throw new Error('length must be short, medium, or long.');

  const scheduleMode = cleanInput(rawInputs.scheduleMode, 'scheduleMode', { maxLength: 20 }) || 'draft';
  const inputs = {
    requests: parseArticleRequests(rawInputs.articleRequests, settings.maxBatchSize),
    sharedContext: cleanInput(rawInputs.sharedContext, 'sharedContext', { maxLength: 8_000 }),
    audience: cleanInput(rawInputs.audience, 'audience', { maxLength: 300 })
      || 'Для людей, которые выбирают деревянный дом или баню',
    length,
    keywords: cleanInput(rawInputs.keywords, 'keywords', { maxLength: 500 }),
    callToAction: cleanInput(rawInputs.callToAction, 'callToAction', { maxLength: 500 }),
    notes: cleanInput(rawInputs.notes, 'notes', { maxLength: 2_000 }),
    scheduleMode,
    startDate: cleanInput(rawInputs.startDate, 'startDate', { maxLength: 10 }),
    intervalDays: integerInput(rawInputs.intervalDays, 'intervalDays', 1, 1, 365),
    articlesPerDay: integerInput(rawInputs.articlesPerDay, 'articlesPerDay', 1, 1, 10),
  };

  inputs.publishDates = buildScheduleDates(inputs.requests.length, inputs, dateInTimeZone());
  return inputs;
}

function buildMessages(settings, inputs, request) {
  const technicalContract = [
    'Верни только один валидный JSON-объект без Markdown и пояснений.',
    'Формат JSON: {"title":"...","description":"...","lead":"...","sections":[{"heading":"...","paragraphs":["..."],"bullets":["..."]}],"conclusion":"..."}.',
    'description должна быть кратким анонсом; sections должно содержать от 2 до 8 разделов.',
    'В каждом разделе должен быть заголовок, от 1 до 4 абзацев и массив bullets. Если список не нужен, bullets должен быть пустым массивом.',
    'Не используй HTML или Markdown. Не добавляй поля, которых нет в примере JSON.',
  ].join(' ');

  const task = {
    topic: request.topic,
    articleFacts: request.facts || 'отдельные факты не указаны',
    sharedVerifiedContext: inputs.sharedContext || 'общий контекст не указан',
    audience: inputs.audience,
    desiredLength: LENGTH_GUIDANCE[inputs.length],
    keywords: inputs.keywords || 'не заданы',
    callToAction: inputs.callToAction || 'мягкое приглашение обратиться за консультацией',
    additionalNotes: inputs.notes || 'нет',
  };

  return [
    { role: 'system', content: `${settings.editorialPrompt.trim()}\n\n${technicalContract}` },
    { role: 'user', content: `Редакционное задание в JSON:\n${JSON.stringify(task, null, 2)}` },
  ];
}

async function requestDraft({ apiKey, settings, messages }) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: settings.model,
          messages,
          thinking: { type: 'disabled' },
          max_tokens: 6_000,
          temperature: settings.temperature,
          stream: false,
          response_format: { type: 'json_object' },
        }),
        signal: AbortSignal.timeout(180_000),
      });

      if (!response.ok) {
        const responseText = (await response.text()).slice(0, 1_000);
        const error = new Error(`DeepSeek returned HTTP ${response.status}: ${responseText}`);
        error.retryable = response.status === 429 || response.status >= 500;
        throw error;
      }

      const body = await response.json();
      const choice = body?.choices?.[0];
      const content = choice?.message?.content;
      if (choice?.finish_reason !== 'stop') {
        throw new Error(`DeepSeek stopped generation with reason: ${choice?.finish_reason ?? 'unknown'}.`);
      }
      if (typeof content !== 'string' || !content.trim()) {
        const error = new Error('DeepSeek returned an empty completion.');
        error.retryable = true;
        throw error;
      }

      return JSON.parse(content);
    } catch (error) {
      lastError = error;
      if (attempt === 3 || error?.retryable === false) break;
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 2_000));
  }

  throw lastError ?? new Error('DeepSeek request failed.');
}

function validateGeneratedText(value, name, maxLength) {
  if (typeof value !== 'string') throw new Error(`Generated ${name} must be a string.`);
  const result = value.replaceAll('\r\n', '\n').trim();
  if (!result) throw new Error(`Generated ${name} is empty.`);
  if (result.length > maxLength) throw new Error(`Generated ${name} is longer than ${maxLength} characters.`);
  if (/<\/?[a-z][^>]*>/i.test(result)) throw new Error(`Generated ${name} contains HTML.`);
  return result;
}

function validateDraft(rawDraft) {
  if (!rawDraft || typeof rawDraft !== 'object' || !Array.isArray(rawDraft.sections)) {
    throw new Error('Generated draft has an invalid structure.');
  }
  if (rawDraft.sections.length < 2 || rawDraft.sections.length > 8) {
    throw new Error('Generated draft must contain from 2 to 8 sections.');
  }

  const sections = rawDraft.sections.map((section, sectionIndex) => {
    if (!section || typeof section !== 'object' || !Array.isArray(section.paragraphs) || !Array.isArray(section.bullets)) {
      throw new Error(`Generated section ${sectionIndex + 1} has an invalid structure.`);
    }
    if (section.paragraphs.length < 1 || section.paragraphs.length > 4 || section.bullets.length > 10) {
      throw new Error(`Generated section ${sectionIndex + 1} has an invalid number of content items.`);
    }

    return {
      heading: validateGeneratedText(section.heading, `section ${sectionIndex + 1} heading`, 160),
      paragraphs: section.paragraphs.map((paragraph, paragraphIndex) => (
        validateGeneratedText(paragraph, `section ${sectionIndex + 1} paragraph ${paragraphIndex + 1}`, 2_000)
      )),
      bullets: section.bullets.map((item, itemIndex) => (
        validateGeneratedText(item, `section ${sectionIndex + 1} list item ${itemIndex + 1}`, 500)
      )),
    };
  });

  return {
    title: validateGeneratedText(rawDraft.title, 'title', 160),
    description: validateGeneratedText(rawDraft.description, 'description', 320),
    lead: validateGeneratedText(rawDraft.lead, 'lead', 2_000),
    sections,
    conclusion: validateGeneratedText(rawDraft.conclusion, 'conclusion', 2_000),
  };
}

function toBlocks(draft) {
  const blocks = [{ type: 'paragraph', text: draft.lead }];

  for (const section of draft.sections) {
    blocks.push({ type: 'heading', text: section.heading });
    blocks.push(...section.paragraphs.map((text) => ({ type: 'paragraph', text })));
    if (section.bullets.length > 0) {
      blocks.push({ type: 'list', ordered: false, items: section.bullets });
    }
  }

  blocks.push({ type: 'paragraph', text: draft.conclusion });
  return blocks;
}

function slugify(value) {
  const transliteration = {
    а: 'a', б: 'b', в: 'v', г: 'g', д: 'd', е: 'e', ё: 'e', ж: 'zh', з: 'z', и: 'i', й: 'i',
    к: 'k', л: 'l', м: 'm', н: 'n', о: 'o', п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f',
    х: 'h', ц: 'c', ч: 'ch', ш: 'sh', щ: 'sch', ъ: '', ы: 'y', ь: '', э: 'e', ю: 'yu', я: 'ya',
  };

  return [...value.toLowerCase()]
    .map((character) => transliteration[character] ?? character)
    .join('')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 70)
    .replace(/-$/g, '') || 'news';
}

async function nextOrder() {
  const fileNames = (await readdir(NEWS_DIRECTORY)).filter((fileName) => fileName.endsWith('.json'));
  const entries = await Promise.all(fileNames.map(async (fileName) => (
    JSON.parse(await readFile(resolve(NEWS_DIRECTORY, fileName), 'utf8'))
  )));
  return entries.reduce((maximum, entry) => (
    Number.isInteger(entry.order) ? Math.max(maximum, entry.order) : maximum
  ), -1) + 1;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex;
      nextIndex += 1;
      results[currentIndex] = await mapper(items[currentIndex], currentIndex);
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, () => worker()));
  return results;
}

async function writeOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const output = Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n');
  await appendFile(process.env.GITHUB_OUTPUT, `${output}\n`, 'utf8');
}

async function main() {
  const apiKey = requiredEnvironment('DEEPSEEK_API_KEY');
  const settings = await loadSettings();
  const inputs = validateInputs(parsePayload(requiredEnvironment('PAGES_CMS_PAYLOAD')), settings);
  const generatedDrafts = await mapWithConcurrency(inputs.requests, 3, async (request, index) => {
    console.log(`Generating article ${index + 1}/${inputs.requests.length}: ${request.topic}`);
    const rawDraft = await requestDraft({
      apiKey,
      settings,
      messages: buildMessages(settings, inputs, request),
    });
    return validateDraft(rawDraft);
  });

  const firstOrder = await nextOrder();
  const today = dateInTimeZone();
  const createdPaths = [];

  for (const [index, draft] of generatedDrafts.entries()) {
    const identifier = randomBytes(5).toString('hex');
    const slug = `${identifier}-${slugify(draft.title)}`;
    const fileName = `${slug}.json`;
    const relativePath = `src/content/news/${fileName}`;
    const publishAt = inputs.publishDates[index];
    const article = {
      order: firstOrder + index,
      status: publishAt ? 'scheduled' : 'draft',
      ...(publishAt ? { publishAt } : {}),
      id: identifier,
      slug,
      route: `/news/tpost/${slug}/`,
      title: draft.title,
      description: draft.description,
      date: publishAt ? formatDisplayDate(publishAt) : formatDisplayDate(today),
      cover: settings.defaultCover,
      blocks: toBlocks(draft),
    };

    await writeFile(resolve(NEWS_DIRECTORY, fileName), `${JSON.stringify(article, null, 2)}\n`, {
      encoding: 'utf8',
      flag: 'wx',
    });
    createdPaths.push(relativePath);
    console.log(`Created ${article.status} article: ${relativePath}`);
  }

  const scheduledDates = inputs.publishDates.filter(Boolean);
  await writeOutputs({
    article_count: createdPaths.length,
    scheduled_count: scheduledDates.length,
    first_publish_at: scheduledDates[0] ?? '',
    last_publish_at: scheduledDates.at(-1) ?? '',
  });
}

await main();

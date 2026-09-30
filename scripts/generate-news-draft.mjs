import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  buildScheduleDates,
  dateInTimeZone,
  formatDisplayDate,
  parseArticleRequests,
  renderPromptTemplate,
  validatePromptTemplate,
} from './news-automation-utils.mjs';

const API_URL = 'https://api.deepseek.com/chat/completions';
const NEWS_DIRECTORY = resolve(process.cwd(), 'src', 'content', 'news');
const SETTINGS_PATH = resolve(process.cwd(), 'src', 'content', 'news-automation', 'settings.json');
const PROMPT_PATH = resolve(process.cwd(), 'prompts', 'news-article-prompt.md');

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
  if (!Number.isInteger(settings.publicationIntervalDays)
    || settings.publicationIntervalDays < 1
    || settings.publicationIntervalDays > 365) {
    throw new Error('publicationIntervalDays must be an integer from 1 to 365.');
  }
  if (typeof settings.defaultCover !== 'string'
    || !/^\/media\/[a-zA-Z0-9._/-]+$/.test(settings.defaultCover)
    || settings.defaultCover.includes('..')) {
    throw new Error('defaultCover must be a local /media/ path.');
  }
  return settings;
}

async function loadPromptTemplate() {
  return validatePromptTemplate(await readFile(PROMPT_PATH, 'utf8'));
}

function validateInputs(rawInputs, settings, today) {
  const scheduleMode = cleanInput(rawInputs.scheduleMode, 'scheduleMode', { maxLength: 20 }) || 'draft';
  const inputs = {
    requests: parseArticleRequests(rawInputs.articleRequests, settings.maxBatchSize),
    scheduleMode,
    startDate: cleanInput(rawInputs.startDate, 'startDate', { maxLength: 10 }),
    intervalDays: settings.publicationIntervalDays,
    articlesPerDay: settings.maxPublicationsPerRun,
  };

  inputs.publishDates = buildScheduleDates(inputs.requests.length, inputs, today);
  return inputs;
}

function buildMessages(promptTemplate, request, index, total, currentDate) {
  const prompt = renderPromptTemplate(promptTemplate, {
    TOPIC: request.topic,
    FACTS: request.facts || 'Отдельные проверенные факты не указаны.',
    CURRENT_DATE: currentDate,
    ARTICLE_NUMBER: index + 1,
    TOTAL_ARTICLES: total,
  });

  return [
    {
      role: 'system',
      content: 'Точно следуй редакционному заданию пользователя и верни только один валидный JSON-объект.',
    },
    { role: 'user', content: prompt },
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
      throw new Error(
        `Generated section ${sectionIndex + 1} must contain 1-4 paragraphs and no more than 10 list items; `
        + `received ${section.paragraphs.length} paragraphs and ${section.bullets.length} list items.`,
      );
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

export async function requestValidatedDraft({ apiKey, settings, messages, maximumAttempts = 3 }) {
  let validationError;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const retryInstruction = validationError
      ? [{
        role: 'user',
        content: [
          `Предыдущий ответ не прошел автоматическую проверку: ${validationError.message}`,
          'Сгенерируй статью заново и строго соблюдай структуру JSON и все количественные ограничения.',
          'Верни только исправленный JSON-объект без пояснений и Markdown.',
        ].join('\n'),
      }]
      : [];
    const rawDraft = await requestDraft({
      apiKey,
      settings,
      messages: [...messages, ...retryInstruction],
    });

    try {
      return validateDraft(rawDraft);
    } catch (error) {
      validationError = error instanceof Error ? error : new Error('Generated draft is invalid.');
      console.warn(
        `Generated draft failed validation on attempt ${attempt}/${maximumAttempts}: ${validationError.message}`,
      );
    }
  }

  throw new Error(
    `DeepSeek returned an invalid article structure after ${maximumAttempts} attempts: ${validationError?.message}`,
  );
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
  const promptTemplate = await loadPromptTemplate();
  const today = dateInTimeZone();
  const inputs = validateInputs(parsePayload(requiredEnvironment('PAGES_CMS_PAYLOAD')), settings, today);
  const generatedDrafts = await mapWithConcurrency(inputs.requests, 3, async (request, index) => {
    console.log(`Generating article ${index + 1}/${inputs.requests.length}: ${request.topic}`);
    return requestValidatedDraft({
      apiKey,
      settings,
      messages: buildMessages(promptTemplate, request, index, inputs.requests.length, today),
    });
  });

  const firstOrder = await nextOrder();
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

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}

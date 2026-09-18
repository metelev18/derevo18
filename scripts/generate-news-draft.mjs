import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { resolve } from 'node:path';

const API_URL = 'https://ai.api.cloud.yandex.net/v1/chat/completions';
const NEWS_DIRECTORY = resolve(process.cwd(), 'src', 'content', 'news');
const DRAFT_COVER = '/media/news-draft-placeholder.svg';
const LENGTH_GUIDANCE = {
  short: '2–3 смысловых раздела и примерно 3–5 абзацев',
  medium: '3–5 смысловых разделов и примерно 6–9 абзацев',
  long: '5–8 смысловых разделов и примерно 10–14 абзацев',
};

const responseSchema = {
  name: 'derevo18_news_draft',
  schema: {
    type: 'object',
    additionalProperties: false,
    properties: {
      title: { type: 'string' },
      description: { type: 'string' },
      lead: { type: 'string' },
      sections: {
        type: 'array',
        minItems: 2,
        maxItems: 8,
        items: {
          type: 'object',
          additionalProperties: false,
          properties: {
            heading: { type: 'string' },
            paragraphs: {
              type: 'array',
              minItems: 1,
              maxItems: 4,
              items: { type: 'string' },
            },
            bullets: {
              type: 'array',
              maxItems: 10,
              items: { type: 'string' },
            },
          },
          required: ['heading', 'paragraphs', 'bullets'],
        },
      },
      conclusion: { type: 'string' },
    },
    required: ['title', 'description', 'lead', 'sections', 'conclusion'],
  },
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

function validateInputs(rawInputs) {
  const length = cleanInput(rawInputs.length, 'length', { maxLength: 20 }) || 'medium';
  if (!(length in LENGTH_GUIDANCE)) throw new Error('length must be short, medium, or long.');

  return {
    topic: cleanInput(rawInputs.topic, 'topic', { required: true, maxLength: 200 }),
    facts: cleanInput(rawInputs.facts, 'facts', { required: true, maxLength: 8_000 }),
    audience: cleanInput(rawInputs.audience, 'audience', { maxLength: 300 })
      || 'Для людей, которые выбирают деревянный дом или баню',
    length,
    keywords: cleanInput(rawInputs.keywords, 'keywords', { maxLength: 500 }),
    callToAction: cleanInput(rawInputs.callToAction, 'callToAction', { maxLength: 500 }),
    notes: cleanInput(rawInputs.notes, 'notes', { maxLength: 2_000 }),
  };
}

function buildMessages(inputs) {
  const system = [
    'Ты редактор русскоязычного сайта строительной компании «ДревМастер».',
    'Подготовь полезный черновик новости или экспертной статьи о деревянных домах и банях.',
    'Используй только факты из задания. Не выдумывай цены, сроки, характеристики, нормы, гарантии, адреса, имена и опыт компании.',
    'Если данных недостаточно, пиши нейтрально и добавляй маркер [НУЖНО УТОЧНИТЬ] вместо догадки.',
    'Не используй HTML, Markdown, эмодзи, капслок, кликбейт и чрезмерно рекламные формулировки.',
    'Текст должен быть понятным, профессиональным и конкретным. Не повторяй ключевые слова искусственно.',
    'Верни только JSON, соответствующий переданной схеме. В bullets передавай пустой массив, если список не нужен.',
  ].join(' ');

  const task = {
    topic: inputs.topic,
    verifiedFacts: inputs.facts,
    audience: inputs.audience,
    desiredLength: LENGTH_GUIDANCE[inputs.length],
    keywords: inputs.keywords || 'не заданы',
    callToAction: inputs.callToAction || 'мягкое приглашение обратиться за консультацией',
    editorialNotes: inputs.notes || 'нет',
  };

  return [
    { role: 'system', content: system },
    { role: 'user', content: `Редакционное задание:\n${JSON.stringify(task, null, 2)}` },
  ];
}

async function requestDraft({ apiKey, folderId, model, messages }) {
  let lastError;

  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          Authorization: `Api-Key ${apiKey}`,
          'Content-Type': 'application/json',
          'OpenAI-Project': folderId,
        },
        body: JSON.stringify({
          model: `gpt://${folderId}/${model}`,
          messages,
          max_tokens: 6_000,
          temperature: 0.3,
          stream: false,
          response_format: { type: 'json_schema', json_schema: responseSchema },
        }),
        signal: AbortSignal.timeout(120_000),
      });

      if (!response.ok) {
        const responseText = (await response.text()).slice(0, 1_000);
        const error = new Error(`Yandex AI Studio returned HTTP ${response.status}: ${responseText}`);
        if (response.status !== 429 && response.status < 500) throw error;
        lastError = error;
      } else {
        const body = await response.json();
        const content = body?.choices?.[0]?.message?.content;
        if (typeof content !== 'string' || !content.trim()) {
          throw new Error('Yandex AI Studio returned an empty completion.');
        }
        return JSON.parse(content);
      }
    } catch (error) {
      lastError = error;
      if (attempt === 3) break;
    }

    await new Promise((resolvePromise) => setTimeout(resolvePromise, attempt * 2_000));
  }

  throw lastError ?? new Error('Yandex AI Studio request failed.');
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

function samaraDate() {
  const parts = new Intl.DateTimeFormat('ru-RU', {
    timeZone: 'Europe/Samara',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.day}.${values.month}.${values.year}`;
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

async function writeOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const output = Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n');
  await appendFile(process.env.GITHUB_OUTPUT, `${output}\n`, 'utf8');
}

async function main() {
  const apiKey = requiredEnvironment('YANDEX_AI_API_KEY');
  const folderId = requiredEnvironment('YANDEX_FOLDER_ID');
  const model = process.env.YANDEX_AI_MODEL?.trim() || 'yandexgpt/latest';
  const inputs = validateInputs(parsePayload(requiredEnvironment('PAGES_CMS_PAYLOAD')));
  const generatedDraft = await requestDraft({ apiKey, folderId, model, messages: buildMessages(inputs) });
  const draft = validateDraft(generatedDraft);
  const identifier = randomBytes(5).toString('hex');
  const slug = `${identifier}-${slugify(draft.title)}`;
  const fileName = `${slug}.json`;
  const relativePath = `src/content/news/${fileName}`;
  const article = {
    order: await nextOrder(),
    status: 'draft',
    id: identifier,
    slug,
    route: `/news/tpost/${slug}/`,
    title: draft.title,
    description: draft.description,
    date: samaraDate(),
    cover: DRAFT_COVER,
    blocks: toBlocks(draft),
  };

  await writeFile(resolve(NEWS_DIRECTORY, fileName), `${JSON.stringify(article, null, 2)}\n`, {
    encoding: 'utf8',
    flag: 'wx',
  });
  await writeOutputs({ draft_path: relativePath, draft_title: draft.title, draft_slug: slug });
  console.log(`Created draft: ${relativePath}`);
}

await main();

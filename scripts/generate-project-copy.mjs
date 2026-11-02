import { appendFile, readFile, writeFile } from 'node:fs/promises';
import { isAbsolute, relative, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { dateInTimeZone } from './news-automation-utils.mjs';

const API_URL = 'https://api.deepseek.com/chat/completions';
const SETTINGS_PATH = resolve(process.cwd(), 'src', 'content', 'news-automation', 'settings.json');
const PROMPT_TOKEN_PATTERN = /{{([A-Z][A-Z0-9_]*)}}/g;

const CONTENT_CONFIG = {
  catalog: {
    directory: resolve(process.cwd(), 'src', 'content', 'catalog'),
    pathPrefix: 'src/content/catalog/',
    promptPath: resolve(process.cwd(), 'prompts', 'catalog-project-prompt.md'),
    promptToken: 'PROJECT_FACTS_JSON',
    label: 'карточка каталога',
  },
  portfolio: {
    directory: resolve(process.cwd(), 'src', 'content', 'portfolio'),
    pathPrefix: 'src/content/portfolio/',
    promptPath: resolve(process.cwd(), 'prompts', 'portfolio-project-prompt.md'),
    promptToken: 'PORTFOLIO_FACTS_JSON',
    label: 'работа в портфолио',
  },
};

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} is not configured.`);
  return value;
}

export function parseEntryContext(value) {
  let payload;

  try {
    payload = JSON.parse(value);
  } catch {
    throw new Error('PAGES_CMS_PAYLOAD must be valid JSON.');
  }

  const context = payload?.context;
  if (!context || context.type !== 'entry' || !CONTENT_CONFIG[context.name]) {
    throw new Error('The action must be started from a catalog or portfolio entry in Pages CMS.');
  }
  if (typeof context.path !== 'string' || /[\r\n\0]/.test(context.path)) {
    throw new Error('Pages CMS did not provide a valid entry path.');
  }

  const kind = context.name;
  const config = CONTENT_CONFIG[kind];
  const entryPath = context.path.replaceAll('\\', '/');
  if (!entryPath.startsWith(config.pathPrefix) || !entryPath.endsWith('.json') || entryPath.includes('..')) {
    throw new Error(`The selected ${kind} entry is outside its content directory.`);
  }

  const absolutePath = resolve(process.cwd(), ...entryPath.split('/'));
  const relativePath = relative(config.directory, absolutePath);
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath)) {
    throw new Error(`The selected ${kind} entry has an unsafe path.`);
  }

  return { kind, config, entryPath, absolutePath };
}

async function loadSettings() {
  const settings = JSON.parse(await readFile(SETTINGS_PATH, 'utf8'));
  if (!['deepseek-flash', 'deepseek-v4-pro'].includes(settings.model)) {
    throw new Error('The configured DeepSeek model is not supported.');
  }
  if (typeof settings.temperature !== 'number' || settings.temperature < 0 || settings.temperature > 2) {
    throw new Error('temperature must be a number from 0 to 2.');
  }
  return settings;
}

export function validateProjectPrompt(value, requiredToken) {
  if (typeof value !== 'string') throw new Error('The project prompt must be a text file.');

  const prompt = value.replaceAll('\r\n', '\n').trim();
  if (prompt.length < 200) throw new Error('The project prompt must contain at least 200 characters.');
  if (prompt.length > 100_000) throw new Error('The project prompt is longer than 100000 characters.');

  const supportedTokens = [requiredToken, 'CURRENT_DATE'];
  const tokens = [...prompt.matchAll(PROMPT_TOKEN_PATTERN)].map((match) => match[1]);
  const unsupportedTokens = [...new Set(tokens.filter((token) => !supportedTokens.includes(token)))];
  if (unsupportedTokens.length > 0) {
    throw new Error(`The project prompt contains unsupported placeholders: ${unsupportedTokens.join(', ')}.`);
  }
  if (!tokens.includes(requiredToken)) {
    throw new Error(`The project prompt must contain {{${requiredToken}}}.`);
  }

  return prompt;
}

export function renderProjectPrompt(value, requiredToken, facts, currentDate) {
  return validateProjectPrompt(value, requiredToken)
    .replaceAll(`{{${requiredToken}}}`, JSON.stringify(facts, null, 2))
    .replaceAll('{{CURRENT_DATE}}', currentDate);
}

function optionalText(value, name, maximumLength = 4_000) {
  if (value === undefined || value === null || value === '') return undefined;
  if (typeof value !== 'string') throw new Error(`${name} must be a string.`);
  const result = value.replaceAll('\r\n', '\n').trim();
  if (result.length > maximumLength) throw new Error(`${name} is longer than ${maximumLength} characters.`);
  return result || undefined;
}

function requiredText(value, name, maximumLength = 500) {
  const result = optionalText(value, name, maximumLength);
  if (!result) throw new Error(`${name} is required before generating text.`);
  return result;
}

function optionalTextList(value, name) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) throw new Error(`${name} must be an array.`);
  return value.map((item, index) => requiredText(item, `${name} item ${index + 1}`, 500));
}

export function buildSourceFacts(kind, entry) {
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
    throw new Error('The selected entry must contain a JSON object.');
  }

  if (kind === 'catalog') {
    return {
      category: requiredText(entry.category, 'category', 20),
      title: requiredText(entry.title, 'title'),
      name: requiredText(entry.name, 'name'),
      area: requiredText(entry.area, 'area'),
      size: requiredText(entry.size, 'size'),
      floors: requiredText(entry.floors, 'floors'),
      rooms: optionalText(entry.rooms, 'rooms'),
      bathrooms: optionalText(entry.bathrooms, 'bathrooms'),
      duration: requiredText(entry.duration, 'duration'),
      material: optionalText(entry.material, 'material'),
      features: optionalTextList(entry.features, 'features'),
      additionalFacts: optionalText(entry.aiFacts, 'aiFacts'),
    };
  }

  if (kind === 'portfolio') {
    const facts = {
      title: requiredText(entry.title, 'title'),
      location: optionalText(entry.location, 'location'),
      buildingType: optionalText(entry.buildingType, 'buildingType'),
      area: optionalText(entry.area, 'area'),
      material: optionalText(entry.material, 'material'),
      completedAt: optionalText(entry.completedAt, 'completedAt'),
      workScope: optionalText(entry.workScope, 'workScope'),
      features: optionalTextList(entry.features, 'features'),
      additionalFacts: optionalText(entry.aiFacts, 'aiFacts'),
    };
    const hasSupportingFacts = Object.entries(facts)
      .filter(([name]) => !['title', 'features'].includes(name))
      .some(([, value]) => Boolean(value)) || facts.features.length > 0;
    if (!hasSupportingFacts) {
      throw new Error('Add at least one verified portfolio fact before generating text.');
    }
    if (!Array.isArray(entry.images) || entry.images.length === 0) {
      throw new Error('Add at least one portfolio image before generating text.');
    }
    return facts;
  }

  throw new Error(`Unsupported content kind: ${kind}.`);
}

function validateGeneratedText(value, name, maximumLength) {
  if (typeof value !== 'string') throw new Error(`Generated ${name} must be a string.`);
  const result = value.replaceAll('\r\n', '\n').trim();
  if (!result) throw new Error(`Generated ${name} is empty.`);
  if (result.length > maximumLength) {
    throw new Error(`Generated ${name} is longer than ${maximumLength} characters.`);
  }
  if (/<\/?[a-z][^>]*>/i.test(result)) throw new Error(`Generated ${name} contains HTML.`);
  if (/\[НУЖНО УТОЧНИТЬ/i.test(result)) {
    throw new Error(`Generated ${name} requires additional verified facts: ${result.slice(0, 300)}`);
  }
  return result;
}

export function validateGeneratedCopy(rawCopy) {
  if (!rawCopy || typeof rawCopy !== 'object' || Array.isArray(rawCopy)) {
    throw new Error('Generated copy has an invalid structure.');
  }
  const allowedFields = ['description', 'seoTitle', 'seoDescription'];
  const unexpectedFields = Object.keys(rawCopy).filter((name) => !allowedFields.includes(name));
  if (unexpectedFields.length > 0) {
    throw new Error(`Generated copy contains unexpected fields: ${unexpectedFields.join(', ')}.`);
  }

  return {
    description: validateGeneratedText(rawCopy.description, 'description', 2_000),
    seoTitle: validateGeneratedText(rawCopy.seoTitle, 'seoTitle', 160),
    seoDescription: validateGeneratedText(rawCopy.seoDescription, 'seoDescription', 320),
  };
}

async function requestCopy({ apiKey, settings, messages }) {
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
          max_tokens: 2_500,
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

export async function requestValidatedCopy({ apiKey, settings, messages, maximumAttempts = 3 }) {
  let validationError;

  for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
    const retryInstruction = validationError
      ? [{
        role: 'user',
        content: [
          `Предыдущий ответ не прошел проверку: ${validationError.message}`,
          'Верни только исправленный JSON-объект и не добавляй неподтвержденные факты.',
        ].join('\n'),
      }]
      : [];
    const rawCopy = await requestCopy({ apiKey, settings, messages: [...messages, ...retryInstruction] });

    try {
      return validateGeneratedCopy(rawCopy);
    } catch (error) {
      validationError = error instanceof Error ? error : new Error('Generated copy is invalid.');
      console.warn(`Generated copy failed validation on attempt ${attempt}/${maximumAttempts}: ${validationError.message}`);
    }
  }

  throw new Error(`DeepSeek returned invalid project copy after ${maximumAttempts} attempts: ${validationError?.message}`);
}

async function writeOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const output = Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n');
  await appendFile(process.env.GITHUB_OUTPUT, `${output}\n`, 'utf8');
}

async function main() {
  const apiKey = requiredEnvironment('DEEPSEEK_API_KEY');
  const context = parseEntryContext(requiredEnvironment('PAGES_CMS_PAYLOAD'));
  const settings = await loadSettings();
  const entry = JSON.parse(await readFile(context.absolutePath, 'utf8'));
  const facts = buildSourceFacts(context.kind, entry);
  const promptTemplate = await readFile(context.config.promptPath, 'utf8');
  const prompt = renderProjectPrompt(
    promptTemplate,
    context.config.promptToken,
    facts,
    dateInTimeZone(),
  );
  const generatedCopy = await requestValidatedCopy({
    apiKey,
    settings,
    messages: [
      {
        role: 'system',
        content: 'Точно следуй редакционному заданию пользователя и верни только один валидный JSON-объект.',
      },
      { role: 'user', content: prompt },
    ],
  });

  const updatedEntry = { ...entry, status: 'draft', ...generatedCopy };
  await writeFile(context.absolutePath, `${JSON.stringify(updatedEntry, null, 2)}\n`, 'utf8');
  await writeOutputs({
    entry_path: context.entryPath,
    entry_title: requiredText(entry.title, 'title').replace(/\s+/g, ' '),
    content_kind: context.kind,
    content_label: context.config.label,
  });
  console.log(`Updated ${context.config.label}: ${context.entryPath}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}

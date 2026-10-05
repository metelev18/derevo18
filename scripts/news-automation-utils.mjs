const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const PROMPT_TOKEN_PATTERN = /{{([A-Z][A-Z0-9_]*)}}/g;
const REQUIRED_PROMPT_TOKENS = ['TOPIC', 'FACTS'];
const SUPPORTED_PROMPT_TOKENS = [
  ...REQUIRED_PROMPT_TOKENS,
  'CURRENT_DATE',
  'ARTICLE_NUMBER',
  'TOTAL_ARTICLES',
];

export function validatePromptTemplate(value) {
  if (typeof value !== 'string') throw new Error('The article prompt must be a text file.');

  const prompt = value.replaceAll('\r\n', '\n').trim();
  if (prompt.length < 200) throw new Error('The article prompt must contain at least 200 characters.');
  if (prompt.length > 100_000) throw new Error('The article prompt is longer than 100000 characters.');

  const tokens = [...prompt.matchAll(PROMPT_TOKEN_PATTERN)].map((match) => match[1]);
  const unsupportedTokens = [...new Set(tokens.filter((token) => !SUPPORTED_PROMPT_TOKENS.includes(token)))];
  if (unsupportedTokens.length > 0) {
    throw new Error(`The article prompt contains unsupported placeholders: ${unsupportedTokens.join(', ')}.`);
  }

  const missingTokens = REQUIRED_PROMPT_TOKENS.filter((token) => !tokens.includes(token));
  if (missingTokens.length > 0) {
    throw new Error(`The article prompt must contain placeholders: ${missingTokens.join(', ')}.`);
  }

  return prompt;
}

export function renderPromptTemplate(value, variables) {
  let prompt = validatePromptTemplate(value);

  for (const token of SUPPORTED_PROMPT_TOKENS) {
    const replacement = variables[token];
    if (replacement === undefined || replacement === null) {
      if (prompt.includes(`{{${token}}}`)) throw new Error(`No value was provided for {{${token}}}.`);
      continue;
    }
    prompt = prompt.replaceAll(`{{${token}}}`, String(replacement));
  }

  return prompt;
}

export function parseIsoDate(value, name = 'date') {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) {
    throw new Error(`${name} must use the YYYY-MM-DD format.`);
  }

  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error(`${name} is not a valid calendar date.`);
  }

  return date;
}

export function addDays(value, days) {
  const date = parseIsoDate(value);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function formatDisplayDate(value) {
  const date = parseIsoDate(value);
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${day}.${month}.${date.getUTCFullYear()}`;
}

export function dateInTimeZone(timeZone = 'Europe/Samara', now = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function parseArticleRequests(value, maximum) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('articleRequests is required.');
  }
  if (!Number.isInteger(maximum) || maximum < 1 || maximum > 30) {
    throw new Error('maximum must be an integer from 1 to 30.');
  }

  const requests = value
    .replaceAll('\r\n', '\n')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const separatorIndex = line.indexOf('|');
      const topic = (separatorIndex < 0 ? line : line.slice(0, separatorIndex)).trim();
      const facts = (separatorIndex < 0 ? '' : line.slice(separatorIndex + 1)).trim();

      if (!topic) throw new Error(`Article request ${index + 1} has no topic.`);
      if (topic.length > 200) throw new Error(`Article request ${index + 1} topic is longer than 200 characters.`);
      if (facts.length > 4_000) throw new Error(`Article request ${index + 1} facts are longer than 4000 characters.`);
      return { topic, facts };
    });

  if (requests.length > maximum) {
    throw new Error(`This run contains ${requests.length} articles, but the configured maximum is ${maximum}.`);
  }

  const normalizedTopics = requests.map(({ topic }) => topic.toLocaleLowerCase('ru-RU'));
  if (new Set(normalizedTopics).size !== normalizedTopics.length) {
    throw new Error('Article topics in one run must be unique.');
  }

  return requests;
}

export function buildScheduleDates(
  count,
  { scheduleMode, startDate, intervalDays, articlesPerDay },
  today = dateInTimeZone(),
) {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer.');
  if (scheduleMode === 'draft') return Array.from({ length: count }, () => undefined);
  if (scheduleMode !== 'daily') throw new Error('scheduleMode must be draft or daily.');
  if (!Number.isInteger(intervalDays) || intervalDays < 1 || intervalDays > 365) {
    throw new Error('intervalDays must be an integer from 1 to 365.');
  }
  if (!Number.isInteger(articlesPerDay) || articlesPerDay < 1 || articlesPerDay > 10) {
    throw new Error('articlesPerDay must be an integer from 1 to 10.');
  }

  parseIsoDate(today, 'today');
  const firstDate = startDate || addDays(today, 1);
  parseIsoDate(firstDate, 'startDate');

  return Array.from({ length: count }, (_, index) => (
    addDays(firstDate, Math.floor(index / articlesPerDay) * intervalDays)
  ));
}

export function getDueScheduledArticles(entries, today) {
  parseIsoDate(today, 'today');

  const scheduledEntries = entries.filter(({ data }) => data.status === 'scheduled');
  for (const { data, fileName } of scheduledEntries) {
    if (!data.publishAt) throw new Error(`Scheduled article ${fileName} has no publishAt date.`);
    parseIsoDate(data.publishAt, `publishAt in ${fileName}`);
  }

  return scheduledEntries
    .filter(({ data }) => data.publishAt <= today)
    .sort((left, right) => (
      left.data.publishAt.localeCompare(right.data.publishAt)
      || (Number.isInteger(left.data.order) ? left.data.order : Number.MAX_SAFE_INTEGER)
        - (Number.isInteger(right.data.order) ? right.data.order : Number.MAX_SAFE_INTEGER)
      || left.fileName.localeCompare(right.fileName)
    ));
}

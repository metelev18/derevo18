import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  dateInTimeZone,
  formatDisplayDate,
  getDueScheduledArticles,
  parseIsoDate,
} from './news-automation-utils.mjs';

const NEWS_DIRECTORY = resolve(process.cwd(), 'src', 'content', 'news');
const SETTINGS_PATH = resolve(process.cwd(), 'src', 'content', 'news-automation', 'settings.json');
const DRAFT_COVER = '/media/news-draft-placeholder.svg';
const UNRESOLVED_MARKER = '[НУЖНО УТОЧНИТЬ]';

async function writeOutputs(values) {
  if (!process.env.GITHUB_OUTPUT) return;
  const output = Object.entries(values).map(([name, value]) => `${name}=${value}`).join('\n');
  await appendFile(process.env.GITHUB_OUTPUT, `${output}\n`, 'utf8');
}

async function loadEntries() {
  const fileNames = (await readdir(NEWS_DIRECTORY))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));

  return Promise.all(fileNames.map(async (fileName) => ({
    fileName,
    data: JSON.parse(await readFile(resolve(NEWS_DIRECTORY, fileName), 'utf8')),
  })));
}

export function getPublicationBlockReason(data) {
  if (data.cover === DRAFT_COVER) {
    return 'служебная обложка черновика не заменена';
  }
  if (typeof data.cover !== 'string'
    || !/^\/media\/[a-zA-Z0-9._/-]+$/.test(data.cover)
    || data.cover.includes('..')) {
    return 'указан некорректный путь к обложке';
  }
  if (JSON.stringify(data).includes(UNRESOLVED_MARKER)) {
    return `в тексте остался маркер ${UNRESOLVED_MARKER}`;
  }
  return undefined;
}

export function planPublications(entries, today) {
  const readyEntries = [];
  const blockedEntries = [];
  const validScheduledEntries = [];

  for (const entry of entries.filter(({ data }) => data.status === 'scheduled')) {
    try {
      parseIsoDate(entry.data.publishAt, `publishAt in ${entry.fileName}`);
      validScheduledEntries.push(entry);
    } catch {
      blockedEntries.push({ ...entry, reason: 'не указана корректная дата публикации' });
    }
  }

  for (const entry of getDueScheduledArticles(validScheduledEntries, today)) {
    const reason = getPublicationBlockReason(entry.data);
    if (reason) {
      blockedEntries.push({ ...entry, reason });
    } else {
      readyEntries.push(entry);
    }
  }

  return {
    selectedEntries: readyEntries,
    blockedEntries,
  };
}

async function main() {
  const settings = JSON.parse(await readFile(SETTINGS_PATH, 'utf8'));
  if (typeof settings.scheduleEnabled !== 'boolean') {
    throw new Error('scheduleEnabled must be a boolean.');
  }
  const today = dateInTimeZone();
  if (!settings.scheduleEnabled) {
    console.log('Scheduled publication is paused in Pages CMS.');
    await writeOutputs({
      published_count: 0,
      blocked_count: 0,
      publication_date: today,
      schedule_paused: true,
    });
    return;
  }

  const { selectedEntries, blockedEntries } = planPublications(
    await loadEntries(),
    today,
  );

  for (const { data, fileName, reason } of blockedEntries) {
    console.warn(`Skipped scheduled article "${data.title}" (${fileName}): ${reason}.`);
  }

  if (selectedEntries.length === 0) {
    if (blockedEntries.length === 0) {
      console.log(`No scheduled articles are due on ${today}.`);
    } else {
      console.log('No ready scheduled articles can be published today.');
    }
    await writeOutputs({
      published_count: 0,
      blocked_count: blockedEntries.length,
      publication_date: today,
      schedule_paused: false,
    });
    return;
  }

  for (const { fileName, data } of selectedEntries) {
    data.status = 'published';
    data.date = formatDisplayDate(data.publishAt);
    await writeFile(
      resolve(NEWS_DIRECTORY, fileName),
      `${JSON.stringify(data, null, 2)}\n`,
      'utf8',
    );
    console.log(`Prepared for publication: ${data.title} (${fileName})`);
  }

  await writeOutputs({
    published_count: selectedEntries.length,
    blocked_count: blockedEntries.length,
    publication_date: today,
    schedule_paused: false,
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  await main();
}

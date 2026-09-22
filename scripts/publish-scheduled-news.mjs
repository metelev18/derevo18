import { appendFile, readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import {
  dateInTimeZone,
  formatDisplayDate,
  selectDueArticles,
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

async function main() {
  const settings = JSON.parse(await readFile(SETTINGS_PATH, 'utf8'));
  if (typeof settings.scheduleEnabled !== 'boolean') {
    throw new Error('scheduleEnabled must be a boolean.');
  }
  if (!Number.isInteger(settings.maxPublicationsPerRun)
    || settings.maxPublicationsPerRun < 1
    || settings.maxPublicationsPerRun > 10) {
    throw new Error('maxPublicationsPerRun must be an integer from 1 to 10.');
  }

  const today = dateInTimeZone();
  if (!settings.scheduleEnabled) {
    console.log('Scheduled publication is paused in Pages CMS.');
    await writeOutputs({ published_count: 0, publication_date: today, schedule_paused: true });
    return;
  }

  const dueEntries = selectDueArticles(
    await loadEntries(),
    today,
    settings.maxPublicationsPerRun,
  );

  if (dueEntries.length === 0) {
    console.log(`No scheduled articles are due on ${today}.`);
    await writeOutputs({ published_count: 0, publication_date: today, schedule_paused: false });
    return;
  }

  for (const { fileName, data } of dueEntries) {
    if (data.cover === DRAFT_COVER) {
      throw new Error(`Scheduled article "${data.title}" still has the draft cover.`);
    }
    if (JSON.stringify(data).includes(UNRESOLVED_MARKER)) {
      throw new Error(`Scheduled article "${data.title}" contains ${UNRESOLVED_MARKER}.`);
    }

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
    published_count: dueEntries.length,
    publication_date: today,
    schedule_paused: false,
  });
}

await main();

import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

interface OrderedContent {
  order: number;
}

export async function loadContentDirectory<T>(directory: string): Promise<T[]> {
  const contentDirectory = resolve(process.cwd(), 'src', 'content', directory);
  const fileNames = (await readdir(contentDirectory))
    .filter((fileName) => fileName.endsWith('.json'));
  const entries = await Promise.all(fileNames.map(async (fileName) => (
    JSON.parse(await readFile(resolve(contentDirectory, fileName), 'utf8')) as T & OrderedContent
  )));

  return entries
    .sort((left, right) => left.order - right.order)
    .map(({ order: _order, ...entry }) => entry as T);
}

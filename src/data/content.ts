import { readdir, readFile } from 'node:fs/promises';
import { basename, extname, resolve } from 'node:path';

interface OrderedContent {
  order: number;
}

export interface ContentFileEntry<T> {
  data: T;
  fileName: string;
  slug: string;
}

export async function loadContentDirectory<T>(
  directory: string,
  orderDirection: 'asc' | 'desc' = 'asc',
): Promise<Array<ContentFileEntry<T>>> {
  const contentDirectory = resolve(process.cwd(), 'src', 'content', directory);
  const fileNames = (await readdir(contentDirectory))
    .filter((fileName) => fileName.endsWith('.json'))
    .sort((left, right) => left.localeCompare(right));
  const entries = await Promise.all(fileNames.map(async (fileName) => (
    {
      fileName,
      stored: JSON.parse(await readFile(resolve(contentDirectory, fileName), 'utf8')) as T & OrderedContent,
    }
  )));

  const orderMultiplier = orderDirection === 'asc' ? 1 : -1;

  return entries
    .sort((left, right) => (
      (left.stored.order - right.stored.order) * orderMultiplier
      || left.fileName.localeCompare(right.fileName)
    ))
    .map(({ fileName, stored }) => {
      const data = { ...stored } as T & Partial<OrderedContent>;
      delete data.order;
      return {
        data,
        fileName,
        slug: basename(fileName, extname(fileName)),
      };
    });
}

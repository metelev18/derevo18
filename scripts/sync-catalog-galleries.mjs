import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const CATALOG_DIRECTORY = resolve(process.cwd(), 'src', 'content', 'catalog');
const MEDIA_DIRECTORY = resolve(process.cwd(), 'public', 'media');
const SITE_ORIGIN = 'https://derevo18.com';

function decodeHtmlAttribute(value) {
  return value
    .replaceAll('&quot;', '"')
    .replaceAll('&#34;', '"')
    .replaceAll('&amp;', '&')
    .replaceAll('&#39;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>');
}

export function extractGalleryUrls(html) {
  const attribute = html.match(/data-field-imgs-value="([^"]+)"/i)?.[1];
  if (!attribute) return [];

  const items = JSON.parse(decodeHtmlAttribute(attribute));
  if (!Array.isArray(items)) return [];

  return items
    .map((item) => item?.li_img)
    .filter((url) => typeof url === 'string' && /^https:\/\/static\.tildacdn\.com\//.test(url));
}

async function downloadImage(url, outputPath) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${url}`);
  const source = Buffer.from(await response.arrayBuffer());
  const output = await sharp(source)
    .rotate()
    .resize({ width: 1800, withoutEnlargement: true })
    .webp({ quality: 84, effort: 5 })
    .toBuffer();
  await writeFile(outputPath, output);
}

async function syncEntry(fileName) {
  const filePath = resolve(CATALOG_DIRECTORY, fileName);
  const data = JSON.parse(await readFile(filePath, 'utf8'));
  const route = data.route ?? (data.category === 'house'
    ? `/catalog-house/${data.slug}/`
    : `/catalog-sauna/${data.slug}/`);
  const response = await fetch(new URL(route, SITE_ORIGIN), {
    headers: { 'user-agent': 'Derevo18 content migration' },
  });
  if (!response.ok) {
    console.warn(`Skipped ${fileName}: source page returned ${response.status}.`);
    return;
  }

  const galleryUrls = extractGalleryUrls(await response.text());
  if (galleryUrls.length === 0) {
    console.warn(`Skipped ${fileName}: source gallery was not found.`);
    return;
  }

  const gallery = [];
  for (const [index, url] of galleryUrls.entries()) {
    const targetName = `catalog-${data.category}-${data.slug}-gallery-${String(index + 1).padStart(2, '0')}.webp`;
    await downloadImage(url, resolve(MEDIA_DIRECTORY, targetName));
    gallery.push(`/media/${targetName}`);
  }

  data.gallery = gallery;
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  console.log(`${fileName}: ${gallery.length} images`);
}

const fileNames = (await readdir(CATALOG_DIRECTORY))
  .filter((fileName) => fileName.endsWith('.json'))
  .sort((left, right) => left.localeCompare(right));

for (const fileName of fileNames) {
  await syncEntry(fileName);
}

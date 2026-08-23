import { expect, test, type Page } from '@playwright/test';
import { newsArticles } from '../src/data/news';

async function openSitePage(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
}

test('renders every news card with local covers and direct links', async ({ page }) => {
  await openSitePage(page, '/news/');
  await expect(page.getByRole('heading', { level: 1, name: 'БЛОГ' })).toBeVisible();
  await expect(page.locator('.news-card')).toHaveCount(20);
  await expect(page.locator('.news-card').first().getByRole('link')).toHaveAttribute('href', newsArticles[0]!.route);
  const sources = await page.locator('.news-card img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/') && !source.includes('tildacdn.com'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders a video publication in the source-compatible reader', async ({ page }) => {
  const article = newsArticles[0]!;
  await page.goto(article.route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: article.title })).toBeVisible();
  await expect(page.locator('.news-article__cover')).toHaveCount(0);
  await expect(page.locator('.news-article__video iframe')).toHaveAttribute('src', 'https://kinescope.io/embed/uJGd7MEsyiyderJtbHBcoM');
  await expect(page.getByRole('link', { name: 'Вернуться к новостям' })).toHaveAttribute('href', '/news/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders a complete illustrated construction article', async ({ page }) => {
  const article = newsArticles.find((item) => item.id === 's6plpy65i1')!;
  await page.goto(article.route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: article.title })).toBeVisible();
  await expect(page.getByText('ВИНТОВЫЕ СВАИ', { exact: true })).toBeVisible();
  await expect(page.locator('.news-article__content figure img')).toHaveCount(17);
  const sources = await page.locator('.news-article img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/'))).toBe(true);
});

test('uses preview SEO policy on the list and article pages', async ({ page }) => {
  await openSitePage(page, '/news/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/news/');

  const article = newsArticles[1]!;
  await page.goto(article.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://derevo18-astro.workers.dev${article.route}`);
});

test('generates every publication route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const article of newsArticles) {
    const response = await page.request.get(article.route);
    expect(response.ok(), article.route).toBe(true);
    expect(await response.text(), article.route).toContain('news-article');
  }
});

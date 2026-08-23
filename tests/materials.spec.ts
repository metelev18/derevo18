import { expect, test, type Page } from '@playwright/test';
import { materialArticles } from '../src/data/materials';

async function openSitePage(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
}

test('renders all material cards with local covers and direct links', async ({ page }) => {
  await openSitePage(page, '/material/');
  await expect(page.getByRole('heading', { level: 1, name: 'Материалы для строительства домов и бань' })).toBeVisible();
  await expect(page.locator('.material-card')).toHaveCount(7);
  await expect(page.locator('.material-card').first().getByRole('link')).toHaveAttribute('href', materialArticles[0]!.route);
  const sources = await page.locator('.material-card img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/material-article-'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders a complete illustrated material article', async ({ page }) => {
  const article = materialArticles.find((item) => item.id === 'sub99rz2n1')!;
  await page.goto(article.route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: article.title })).toBeVisible();
  await expect(page.locator('.material-article__cover')).toHaveAttribute('src', article.cover);
  await expect(page.getByText(/Бревенчатый сруб — это исторически сложившийся/)).toBeVisible();
  await expect(page.locator('.material-article__content figure img')).toHaveCount(4);
});

test('preserves article headings and lists without inventing a cover', async ({ page }) => {
  const profile = materialArticles.find((item) => item.id === 'tdpfx99oc1')!;
  await page.goto(profile.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.material-article__cover')).toHaveCount(0);
  await expect(page.getByRole('heading', { level: 2, name: 'Что означает профилированный брусок?' })).toBeVisible();

  const cedar = materialArticles.find((item) => item.id === 'kg0smn8vd1')!;
  await page.goto(cedar.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('.material-article__content ul')).toHaveCount(1);
  await expect(page.locator('.material-article__content ol')).toHaveCount(1);
});

test('uses preview SEO policy on the list and article pages', async ({ page }) => {
  await openSitePage(page, '/material/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/material/');

  const article = materialArticles[1]!;
  await page.goto(article.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://derevo18-astro.workers.dev${article.route}`);
});

test('generates every material route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const article of materialArticles) {
    const response = await page.request.get(article.route);
    expect(response.ok(), article.route).toBe(true);
    expect(await response.text(), article.route).toContain('material-article');
  }
});

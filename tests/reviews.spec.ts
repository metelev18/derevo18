import { expect, test, type Page } from '@playwright/test';
import { customerReviews } from '../src/data/reviews';

async function openSitePage(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
}

test('renders every review card with local covers and direct links', async ({ page }) => {
  await openSitePage(page, '/rewies/');
  await expect(page.getByRole('heading', { level: 1, name: 'ОТЗЫВЫ' })).toBeVisible();
  await expect(page.locator('.review-card')).toHaveCount(33);
  await expect(page.locator('.review-card').first().getByRole('link')).toHaveAttribute('href', customerReviews[0]!.route);
  const sources = await page.locator('.review-card img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/') && !source.includes('tildacdn.com'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders a complete illustrated customer review', async ({ page }) => {
  const review = customerReviews.find((item) => item.id === 'en7hrrehr1')!;
  await page.goto(review.route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: review.title })).toBeVisible();
  await expect(page.locator('.review-article__cover')).toHaveAttribute('src', review.cover);
  await expect(page.getByText(/давно мечтала о новом,современном доме/)).toBeVisible();
  await expect(page.locator('.review-article__content figure img')).toHaveCount(8);
  const sources = await page.locator('.review-article img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/'))).toBe(true);
});

test('renders a video review in the source-compatible reader', async ({ page }) => {
  const review = customerReviews.find((item) => item.id === '0va26cpud1')!;
  await page.goto(review.route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { level: 1, name: review.title })).toBeVisible();
  await expect(page.locator('.review-article__video iframe')).toHaveAttribute('src', 'https://kinescope.io/embed/6YJnAcRuvDFfSTorzA8jmA');
  await expect(page.getByRole('link', { name: 'Вернуться к отзывам' })).toHaveAttribute('href', '/rewies/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('keeps the two legacy root-level review routes working', async ({ page }) => {
  const review = customerReviews.find((item) => item.id === 'uap5z2d0t1')!;
  expect(review.route).toMatch(/^\/tpost\//);
  const response = await page.goto(review.route, { waitUntil: 'domcontentloaded' });
  expect(response?.ok()).toBe(true);
  await expect(page.getByRole('heading', { level: 1, name: review.title })).toBeVisible();
  await expect(page.locator('.review-article__content figure img')).toHaveCount(2);
});

test('uses preview SEO policy on the list and review pages', async ({ page }) => {
  await openSitePage(page, '/rewies/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/rewies/');

  const review = customerReviews[1]!;
  await page.goto(review.route, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://derevo18-astro.workers.dev${review.route}`);
});

test('generates every review route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const review of customerReviews) {
    const response = await page.request.get(review.route);
    expect(response.ok(), review.route).toBe(true);
    expect(await response.text(), review.route).toContain('review-article');
  }
});

import { expect, test, type Page } from '@playwright/test';
import { portfolioProjects } from '../src/data/portfolio';

async function openSitePage(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
}

async function openGallery(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const galleryIsland = document.querySelector('.portfolio-viewer')?.closest('astro-island');
    return galleryIsland && !galleryIsland.hasAttribute('ssr');
  });
}

test('renders all portfolio works with local covers and direct links', async ({ page }) => {
  await openSitePage(page, '/portfolio/');
  await expect(page.getByRole('heading', { level: 1, name: 'ПОРТФОЛИО' })).toBeVisible();
  await expect(page.locator('.portfolio-list-card')).toHaveCount(36);
  await expect(page.locator('.portfolio-list-card').first().getByRole('link')).toHaveAttribute('href', portfolioProjects[0]!.route);
  const sources = await page.locator('.portfolio-list-card img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources.every((source) => source?.startsWith('/media/portfolio-work-') && !source.includes('tildacdn.com'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('opens an accessible local gallery and changes photographs', async ({ page }) => {
  const project = portfolioProjects[0]!;
  await openGallery(page, project.route);
  await expect(page.getByRole('heading', { level: 1, name: project.title })).toBeVisible();
  await expect(page.locator('.portfolio-viewer__thumbs button')).toHaveCount(project.images.length);
  await expect(page.locator('.portfolio-viewer__stage > img')).toHaveAttribute('src', project.images[0]!);
  await page.getByRole('button', { name: 'Следующая фотография' }).click();
  await expect(page.locator('.portfolio-viewer__stage > img')).toHaveAttribute('src', project.images[1]!);
  await page.keyboard.press('ArrowLeft');
  await expect(page.locator('.portfolio-viewer__stage > img')).toHaveAttribute('src', project.images[0]!);
  await expect(page.getByRole('link', { name: 'Вернуться в портфолио' })).toHaveAttribute('href', '/portfolio/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('uses preview SEO policy on the portfolio and work pages', async ({ page }) => {
  await openSitePage(page, '/portfolio/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/portfolio/');

  const project = portfolioProjects[1]!;
  await openGallery(page, project.route);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', `https://derevo18-astro.workers.dev${project.route}`);
});

test('generates every portfolio work route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const project of portfolioProjects) {
    const response = await page.request.get(project.route);
    expect(response.ok(), project.route).toBe(true);
    expect(await response.text(), project.route).toContain('portfolio-viewer');
  }
});

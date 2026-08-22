import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
});

async function waitForVisibleIsland(page: import('@playwright/test').Page, selector: string) {
  await page.waitForFunction((targetSelector) => {
    const island = document.querySelector(targetSelector)?.closest('astro-island');
    return island && !island.hasAttribute('ssr');
  }, selector);
}

test('renders all key homepage sections without horizontal overflow', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: /деревянные дома и бани/i })).toBeVisible();
  for (const title of ['КАТАЛОГ', 'О КОМПАНИИ', 'НАШИ УНИКАЛЬНЫЕ ТЕХНОЛОГИИ', 'ПОРТФОЛИО', 'ОТЗЫВЫ', 'НОВОСТИ', 'ОСТАВИТЬ ЗАЯВКУ']) {
    await expect(page.getByRole('heading', { name: title, exact: true }).first()).toBeVisible();
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('loads only local image assets', async ({ page }) => {
  const sources = await page.locator('img').evaluateAll((images) => images.map((image) => (image as HTMLImageElement).currentSrc || (image as HTMLImageElement).src));
  expect(sources.length).toBeGreaterThan(20);
  expect(sources.every((source) => !source.includes('tildacdn.com'))).toBe(true);
});

test('form validates locally and never sends a request', async ({ page }) => {
  const writeRequests: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writeRequests.push(`${request.method()} ${request.url()}`);
  });

  await page.getByRole('button', { name: 'Скачать каталог' }).click();
  const dialog = page.getByRole('dialog', { name: 'Скачать каталог' });
  await expect(dialog).toBeVisible();
  await dialog.getByPlaceholder('Имя').fill('Тестовый посетитель');
  await dialog.getByPlaceholder('+7 (___) ___-__-__').fill('8 919 916 80 22');
  await dialog.getByRole('button', { name: 'Заказать каталог' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Демо-режим: данные не отправлены');
  expect(writeRequests).toEqual([]);
});

test('catalog expands and unfinished links use the local placeholder', async ({ page }) => {
  await page.locator('#catalog').scrollIntoViewIfNeeded();
  await waitForVisibleIsland(page, '.catalog__more');
  await expect(page.locator('.project-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Загрузить ещё' }).click();
  await expect(page.locator('.project-card')).toHaveCount(6);
  const href = await page.locator('.project-card .text-link').first().getAttribute('href');
  expect(href).toMatch(/^\/coming-soon\//);
});

test('portfolio opens and closes an accessible lightbox', async ({ page }) => {
  await page.locator('#portfolio').scrollIntoViewIfNeeded();
  await waitForVisibleIsland(page, '.portfolio-card');
  await page.locator('.portfolio-card').first().click();
  await expect(page.getByRole('dialog', { name: /106 кв.м/i })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('.lightbox')).toHaveCount(0);
});

test('uses preview SEO policy and keeps static sections outside React islands', async ({ page }) => {
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/');
  await expect(page.locator('.hero').locator('xpath=ancestor::astro-island')).toHaveCount(0);

  const response = await page.request.get('/robots.txt');
  expect(await response.text()).toContain('Disallow: /');
});

test('mobile navigation opens without moving the page sideways', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Mobile-only behavior');
  await page.getByRole('button', { name: 'Открыть меню' }).click();
  await expect(page.locator('#mobile-menu')).toHaveClass(/mobile-menu--open/);
  await page.getByRole('button', { name: 'Закрыть меню' }).first().click();
  await expect(page.locator('#mobile-menu')).not.toHaveClass(/mobile-menu--open/);
});

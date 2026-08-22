import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/history/');
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
});

test('renders the company history in chronological cards without overflow', async ({ page }) => {
  await expect(page.getByRole('heading', { level: 1, name: 'История компании ДревМастер' })).toBeVisible();
  await expect(page.locator('.history-card')).toHaveCount(3);
  await expect(page.locator('.history-card h2')).toHaveText(['2008–2012 гг.', '2013–2018 гг.', '2019–2021 гг.']);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('uses local images and switches the accessible gallery', async ({ page }) => {
  const gallery = page.getByRole('region', { name: 'Фотографии объектов компании' });
  await gallery.scrollIntoViewIfNeeded();
  await page.waitForFunction(() => {
    const island = document.querySelector('.history-gallery')?.closest('astro-island');
    return island && !island.hasAttribute('ssr');
  });
  await expect(gallery.getByRole('img')).toHaveAttribute('src', '/media/history-house-1.webp');
  await gallery.getByRole('button', { name: 'Следующая фотография' }).click();
  await expect(gallery.getByRole('img')).toHaveAttribute('src', '/media/history-house-2.webp');
  const source = await gallery.getByRole('img').getAttribute('src');
  expect(source).not.toContain('tildacdn.com');
});

test('uses the shared navigation, contacts and preview SEO policy', async ({ page }) => {
  await expect(page.locator('.site-header__nav a[href="/history/"]')).toHaveAttribute('href', '/history/');
  await expect(page.getByRole('heading', { name: 'Контакты', exact: true })).toBeVisible();
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/history/');
});

test('keeps the callback form in local demo mode', async ({ page }, testInfo) => {
  const writeRequests: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writeRequests.push(`${request.method()} ${request.url()}`);
  });
  if (['mobile-390', 'tablet-768'].includes(testInfo.project.name)) {
    await page.getByRole('button', { name: 'Открыть меню' }).click();
    await page.locator('#mobile-menu').getByRole('button', { name: 'Заказать звонок' }).click();
  } else {
    await page.locator('.site-header__callback').click();
  }
  const dialog = page.getByRole('dialog', { name: 'Заказать звонок' });
  await dialog.getByPlaceholder('Имя').fill('Тестовый посетитель');
  await dialog.getByPlaceholder('+7 (___) ___-__-__').fill('8 919 916 80 22');
  await dialog.getByRole('button', { name: 'Заказать звонок' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Демо-режим: данные не отправлены');
  expect(writeRequests).toEqual([]);
});

import { expect, test, type Page } from '@playwright/test';
import { allProjects } from '../src/data/catalog';

async function openReady(page: Page, route: string) {
  await page.goto(route);
  await page.waitForFunction(() => {
    const headerIsland = document.querySelector('.site-header')?.closest('astro-island');
    return document.documentElement.dataset.leadFormsReady === 'true'
      && headerIsland
      && !headerIsland.hasAttribute('ssr');
  });
}

test('renders all house projects with local images and working links', async ({ page }) => {
  await openReady(page, '/catalog-house/');
  await expect(page.getByRole('heading', { level: 1, name: 'Дома' })).toBeVisible();
  await expect(page.locator('.catalog-card')).toHaveCount(27);
  await expect(page.getByRole('link', { name: 'Дома', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.catalog-card').first().getByRole('link', { name: 'Проект дома «Подшивалово»' }).first()).toHaveAttribute('href', '/catalog-house/dom-podshivalovo/');
  const sources = await page.locator('.catalog-card img').evaluateAll((images) => images.map((image) => image.getAttribute('src')));
  expect(sources).toHaveLength(27);
  expect(sources.every((source) => source?.startsWith('/media/') && !source.includes('tildacdn.com'))).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders all sauna projects and switches between catalogs', async ({ page }) => {
  await openReady(page, '/catalog-sauna/');
  await expect(page.getByRole('heading', { level: 1, name: 'Проекты бань' })).toBeVisible();
  await expect(page.locator('.catalog-card')).toHaveCount(14);
  await expect(page.getByRole('link', { name: 'Бани', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.locator('.catalog-tabs').getByRole('link', { name: 'Дома' })).toHaveAttribute('href', '/catalog-house/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('renders a complete project card with preview SEO', async ({ page }) => {
  await openReady(page, '/catalog-house/dom-podshivalovo/');
  await expect(page.getByRole('heading', { level: 1, name: 'Проект дома «Подшивалово»' })).toBeVisible();
  await expect(page.locator('.project-specs')).toContainText('91 кв. м');
  await expect(page.locator('.project-package__grid article')).toHaveCount(6);
  await expect(page.locator('.related-projects .catalog-card')).toHaveCount(3);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18-astro.workers.dev/catalog-house/dom-podshivalovo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('keeps the project presentation form in local demo mode', async ({ page }) => {
  const writeRequests: string[] = [];
  page.on('request', (request) => {
    if (!['GET', 'HEAD', 'OPTIONS'].includes(request.method())) writeRequests.push(`${request.method()} ${request.url()}`);
  });
  await openReady(page, '/catalog-sauna/klassika/');
  await page.getByRole('button', { name: 'Скачать презентацию проекта' }).click();
  const dialog = page.getByRole('dialog', { name: 'Получить проект' });
  await dialog.getByPlaceholder('Имя').fill('Тестовый посетитель');
  await dialog.getByPlaceholder('+7 (___) ___-__-__').fill('8 919 916 80 22');
  await dialog.getByPlaceholder('Ваш e-mail').fill('visitor@example.test');
  await dialog.getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog.getByRole('status')).toHaveText('Демо-режим: данные не отправлены');
  expect(writeRequests).toEqual([]);
});

test('generates every project route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const project of allProjects) {
    const response = await page.request.get(project.route);
    expect(response.ok(), project.route).toBe(true);
    expect(await response.text(), project.route).toContain('project-detail');
  }
});

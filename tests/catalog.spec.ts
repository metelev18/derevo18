import { expect, test, type Page } from '@playwright/test';
import { allProjects, saunaProjects } from '../src/data/catalog';

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
  await expect(page.locator('.project-interior__grid article')).toHaveCount(5);
  await expect(page.getByRole('heading', { name: 'Планировка', exact: true })).toHaveCount(0);
  await expect(page.locator('.related-projects .catalog-card')).toHaveCount(3);
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex, nofollow');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://derevo18.com/catalog-house/dom-podshivalovo/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('switches catalog images and opens the expanded gallery', async ({ page }) => {
  const project = saunaProjects.find(({ slug }) => slug === 'banya-s-hozblokom')!;
  await openReady(page, project.route);
  await page.waitForFunction(() => {
    const island = document.querySelector('.project-gallery')?.closest('astro-island');
    return island && !island.hasAttribute('ssr');
  });

  await expect(page.locator('.project-gallery__thumbs button')).toHaveCount(4);
  await expect(page.locator('.project-gallery__stage img')).toHaveAttribute('src', project.gallery[0]!);
  await page.getByRole('button', { name: 'Следующее изображение' }).first().click();
  await expect(page.locator('.project-gallery__stage img')).toHaveAttribute('src', project.gallery[1]!);

  await page.getByRole('button', { name: 'Открыть фотографию на весь экран' }).click();
  const dialog = page.getByRole('dialog', { name: `Галерея проекта ${project.title}` });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('src', project.gallery[1]!);
  await dialog.getByRole('button', { name: 'Закрыть галерею' }).click();
  await expect(dialog).toHaveCount(0);
});

test('submits the project presentation form with email', async ({ page }) => {
  let payload: Record<string, unknown> | undefined;
  await page.route('**/api/forms', async (route) => {
    payload = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });
  await openReady(page, '/catalog-sauna/klassika/');
  await page.getByRole('button', { name: 'Скачать презентацию проекта' }).click();
  const dialog = page.getByRole('dialog', { name: 'Получить проект' });
  await dialog.getByPlaceholder('Имя').fill('Тестовый посетитель');
  await dialog.getByPlaceholder('+7 (___) ___-__-__').fill('8 919 916 80 22');
  await dialog.getByPlaceholder('Ваш e-mail').fill('visitor@example.test');
  await dialog.getByRole('button', { name: 'Отправить' }).click();
  await expect(dialog.getByRole('status')).toContainText('Заявка отправлена');
  expect(payload).toEqual(expect.objectContaining({
    formId: 'project',
    email: 'visitor@example.test',
  }));
});

test('generates every project route', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-1280', 'Route inventory only needs one browser project');
  for (const project of allProjects) {
    const response = await page.request.get(project.route);
    expect(response.ok(), project.route).toBe(true);
    expect(await response.text(), project.route).toContain('project-detail');
  }
});

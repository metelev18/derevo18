import { expect, test } from '@playwright/test';
import { houseProjects, saunaProjects } from '../src/data/catalog';
import { portfolioProjects } from '../src/data/portfolio';
import { homeContent } from '../src/data/home';

test('catalog photographs fill the stage and restored plans remain whole', async ({ page }) => {
  for (const project of [houseProjects.find(p => p.slug === 'dubrava')!, saunaProjects.find(p => p.slug === 'banya-s-hozblokom')!]) {
    await page.goto(project.route);
    await page.waitForFunction(() => !document.querySelector('.project-gallery')?.closest('astro-island')?.hasAttribute('ssr'));
    const gallery = page.locator('.project-showcase .project-gallery');
    expect(await gallery.locator('img').first().evaluate(img => getComputedStyle(img).objectFit)).toBe('cover');
    await gallery.locator('.project-gallery__thumbs button').last().click();
    await expect(gallery.locator('.project-gallery__stage img')).toHaveAttribute('src', project.floorPlans![0]!);
    expect(await gallery.locator('img').first().evaluate(img => getComputedStyle(img).objectFit)).toBe('contain');
    await gallery.getByRole('button', { name: 'Открыть фотографию на весь экран' }).click();
    await expect(page.getByRole('dialog').getByRole('img')).toHaveAttribute('src', project.floorPlans![0]!);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
  }
});

test('portrait portfolio photographs fit and can be viewed fullscreen', async ({ page }) => {
  const project = portfolioProjects.find(p => p.id === '505135063642')!;
  await page.goto(project.route);
  await page.waitForFunction(() => !document.querySelector('.portfolio-viewer')?.closest('astro-island')?.hasAttribute('ssr'));
  await page.getByRole('button', { name: 'Показать фотографию 7', exact: true }).click();
  const img = page.locator('.portfolio-viewer__stage img');
  await expect(img).toHaveJSProperty('complete', true);
  const size = await img.evaluate(el => {
    const stage = el.closest('.portfolio-viewer__stage')!.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return { height: rect.height, stageHeight: stage.height, fit: getComputedStyle(el).objectFit };
  });
  expect(size.height).toBeLessThanOrEqual(size.stageHeight + 1);
  expect(size.fit).toBe('contain');
  await page.getByRole('button', { name: 'Открыть фотографию на весь экран' }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByRole('img')).toHaveAttribute('src', project.images[6]!);
  await page.keyboard.press('ArrowRight');
  await expect(dialog.getByRole('img')).toHaveAttribute('src', project.images[7]!);
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
});

test('homepage stays at the top and loads the map only on request', async ({ page }) => {
  await page.route('**/map-widget/**', route => route.fulfill({ status: 200, contentType: 'text/html', body: '<p>Карта</p>' }));
  await page.goto('/');
  await page.waitForFunction(() => document.documentElement.dataset.leadFormsReady === 'true');
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => window.scrollY)).toBeLessThan(5);
  await expect(page.locator('iframe[title="ДревМастер на карте"]')).toHaveCount(0);
  const covers = await page.locator('.portfolio-card img').evaluateAll(images => images.map(img => img.getAttribute('src')));
  expect(covers).toEqual(homeContent.portfolio.map(item => item.image));
  expect(new Set(covers).size).toBe(covers.length);
  await page.locator('#contacts').scrollIntoViewIfNeeded();
  await page.waitForFunction(() => !document.querySelector('#contacts')?.closest('astro-island')?.hasAttribute('ssr'));
  await page.getByRole('button', { name: 'Показать карту', exact: true }).click();
  await expect(page.locator('iframe[title="ДревМастер на карте"]')).toHaveCount(1);
});

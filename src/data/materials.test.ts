import { describe, expect, it } from 'vitest';
import { getMaterialArticleSeo, materialArticles, materialsSeo } from './materials';

describe('materials content', () => {
  it('contains every source article and its full content', () => {
    expect(materialArticles).toHaveLength(7);
    expect(materialArticles.filter((article) => article.showCover)).toHaveLength(4);
    expect(materialArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'paragraph')).toHaveLength(40);
    expect(materialArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'heading')).toHaveLength(11);
    expect(materialArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'list')).toHaveLength(2);
    expect(materialArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'image')).toHaveLength(19);
  });

  it('uses unique source-compatible routes and local images', () => {
    const routes = materialArticles.map((article) => article.route);
    const images = materialArticles.flatMap((article) => [
      article.cover,
      ...article.blocks.filter((block) => block.type === 'image').map((block) => block.src),
    ]);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => route.startsWith('/material/tpost/') && route.endsWith('/'))).toBe(true);
    expect(images.every((image) => image.startsWith('/media/material-article-'))).toBe(true);
    expect(new Set(images).size).toBe(23);
    expect(JSON.stringify(materialArticles)).not.toContain('tildacdn.com');
  });

  it('defines list and article metadata', () => {
    expect(materialsSeo.canonicalPath).toBe('/material/');
    expect(materialArticles.every((article) => article.description.length > 40)).toBe(true);
    expect(getMaterialArticleSeo(materialArticles[0]!).canonicalPath).toBe(materialArticles[0]!.route);
  });
});

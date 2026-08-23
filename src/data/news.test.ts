import { describe, expect, it } from 'vitest';
import { getNewsArticleSeo, getRelatedNewsArticles, newsArticles, newsSeo } from './news';

describe('news content', () => {
  it('contains every source publication and content block', () => {
    expect(newsArticles).toHaveLength(20);
    expect(newsArticles.reduce((sum, article) => sum + article.blocks.length, 0)).toBe(318);
    expect(newsArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'image')).toHaveLength(98);
    expect(newsArticles.flatMap((article) => article.blocks).filter((block) => block.type === 'video')).toHaveLength(6);
  });

  it('uses unique source-compatible routes and local image assets', () => {
    const routes = newsArticles.map((article) => article.route);
    const images = newsArticles.flatMap((article) => [article.cover, ...article.blocks.filter((block) => block.type === 'image').map((block) => block.src)]);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => route.startsWith('/news/tpost/') && route.endsWith('/'))).toBe(true);
    expect(images.every((image) => image.startsWith('/media/'))).toBe(true);
    expect(JSON.stringify(newsArticles)).not.toContain('tildacdn.com');
  });

  it('keeps video embeds narrowly scoped and defines metadata', () => {
    const videos = newsArticles.flatMap((article) => article.blocks.filter((block) => block.type === 'video'));
    expect(videos.every((video) => video.src.startsWith('https://kinescope.io/embed/'))).toBe(true);
    expect(newsSeo.canonicalPath).toBe('/news/');
    expect(getNewsArticleSeo(newsArticles[0]!).canonicalPath).toBe(newsArticles[0]!.route);
    expect(getRelatedNewsArticles(newsArticles[0]!.id, 3)).toHaveLength(3);
  });
});

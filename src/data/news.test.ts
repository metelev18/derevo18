import { describe, expect, it } from 'vitest';
import {
  getNewsArticleSeo,
  getNewsArticlesForEnvironment,
  getRelatedNewsArticles,
  NEWS_DRAFT_COVER,
  newsArticles,
  newsSeo,
  type NewsArticle,
} from './news';

describe('news content', () => {
  it('loads every current publication without relying on fixed content totals', () => {
    expect(newsArticles.length).toBeGreaterThan(0);
    expect(newsArticles.every((article) => (
      article.id.trim().length > 0
      && article.title.trim().length > 0
      && article.date.trim().length > 0
      && Array.isArray(article.blocks)
    ))).toBe(true);
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

  it('keeps unpublished articles in preview and excludes them from production', () => {
    const draft: NewsArticle = {
      ...newsArticles[0]!,
      id: 'draft-test',
      slug: 'draft-test',
      route: '/news/tpost/draft-test/',
      status: 'draft',
    };
    const scheduled: NewsArticle = {
      ...newsArticles[0]!,
      id: 'scheduled-test',
      slug: 'scheduled-test',
      route: '/news/tpost/scheduled-test/',
      status: 'scheduled',
      publishAt: '2026-09-22',
    };
    const articles = [draft, scheduled, newsArticles[1]!];

    expect(getNewsArticlesForEnvironment(articles, 'preview')).toContain(draft);
    expect(getNewsArticlesForEnvironment(articles, 'preview')).toContain(scheduled);
    expect(getNewsArticlesForEnvironment(articles, 'production')).not.toContain(draft);
    expect(getNewsArticlesForEnvironment(articles, 'production')).not.toContain(scheduled);
    expect(getNewsArticleSeo(draft).noindex).toBe(true);
    expect(getNewsArticleSeo(scheduled).noindex).toBe(true);
  });

  it('blocks production when a published article still has the draft cover', () => {
    const incompleteArticle: NewsArticle = {
      ...newsArticles[0]!,
      status: 'published',
      cover: NEWS_DRAFT_COVER,
    };

    expect(() => getNewsArticlesForEnvironment([incompleteArticle], 'production')).toThrow(
      'published with the draft cover',
    );
  });
});

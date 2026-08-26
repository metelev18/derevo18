import newsSeoJson from '../content/news-settings/index.json' with { type: 'json' };
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export type NewsBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string };

export interface NewsArticle {
  id: string;
  slug: string;
  route: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  blocks: NewsBlock[];
}

export const newsArticles = await loadContentDirectory<NewsArticle>('news');
export const newsSeo = newsSeoJson as SeoSettings;

export function getNewsArticleSeo(article: NewsArticle): SeoSettings {
  return {
    title: article.title,
    description: article.description || `Публикация компании «ДревМастер»: ${article.title}`,
    canonicalPath: article.route,
    ogImage: article.cover,
  };
}

export function getRelatedNewsArticles(articleId: string, count = 3) {
  const currentIndex = newsArticles.findIndex((article) => article.id === articleId);
  if (currentIndex < 0) return newsArticles.slice(0, count);

  return Array.from({ length: Math.min(count, newsArticles.length - 1) }, (_, offset) =>
    newsArticles[(currentIndex + offset + 1) % newsArticles.length]
  );
}

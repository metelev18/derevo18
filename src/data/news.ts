import newsSeoJson from '../content/news-settings/index.json' with { type: 'json' };
import { isProductionDeploy } from '../lib/deployment';
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export type PublicationStatus = 'draft' | 'published';
export const NEWS_DRAFT_COVER = '/media/news-draft-placeholder.svg';

export type NewsBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'quote'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string }
  | { type: 'video'; src: string };

export interface NewsArticle {
  status: PublicationStatus;
  id: string;
  slug: string;
  route: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  blocks: NewsBlock[];
}

type StoredNewsArticle = Omit<NewsArticle, 'id' | 'slug' | 'route' | 'status'> & {
  status?: PublicationStatus;
  id?: string;
  slug?: string;
  route?: string;
};

const newsEntries = await loadContentDirectory<StoredNewsArticle>('news');

const allNewsArticles: NewsArticle[] = newsEntries.map(({ data, slug }) => ({
  ...data,
  status: data.status ?? 'published',
  id: data.id ?? slug,
  slug,
  route: data.route ?? `/news/tpost/${slug}/`,
}));

export function getNewsArticlesForEnvironment(
  articles: NewsArticle[],
  environment: string | undefined,
): NewsArticle[] {
  if (!isProductionDeploy(environment)) return articles;

  const publishedArticles = articles.filter((article) => article.status === 'published');
  const incompleteArticle = publishedArticles.find((article) => article.cover === NEWS_DRAFT_COVER);

  if (incompleteArticle) {
    throw new Error(
      `News article "${incompleteArticle.title}" is published with the draft cover. Add a cover before production deployment.`,
    );
  }

  return publishedArticles;
}

export const newsArticles = getNewsArticlesForEnvironment(
  allNewsArticles,
  process.env.PUBLIC_DEPLOY_ENV,
);
export const newsSeo = newsSeoJson as SeoSettings;

export function getNewsArticleSeo(article: NewsArticle): SeoSettings {
  return {
    title: article.title,
    description: article.description || `Публикация компании «ДревМастер»: ${article.title}`,
    canonicalPath: article.route,
    ogImage: article.cover,
    noindex: article.status === 'draft',
  };
}

export function getRelatedNewsArticles(articleId: string, count = 3) {
  const currentIndex = newsArticles.findIndex((article) => article.id === articleId);
  if (currentIndex < 0) return newsArticles.slice(0, count);

  return Array.from({ length: Math.min(count, newsArticles.length - 1) }, (_, offset) =>
    newsArticles[(currentIndex + offset + 1) % newsArticles.length]
  );
}

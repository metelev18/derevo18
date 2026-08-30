import materialsSeoJson from '../content/materials-settings/index.json' with { type: 'json' };
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export type MaterialArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'image'; src: string; alt: string };

export interface MaterialArticle {
  id: string;
  slug: string;
  route: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  blocks: MaterialArticleBlock[];
  showCover: boolean;
}

type StoredMaterialArticle = Omit<MaterialArticle, 'id' | 'slug' | 'route'> & {
  id?: string;
  slug?: string;
  route?: string;
};

const materialEntries = await loadContentDirectory<StoredMaterialArticle>('materials');

export const materialArticles: MaterialArticle[] = materialEntries.map(({ data, slug }) => ({
  ...data,
  id: data.id ?? slug,
  slug,
  route: data.route ?? `/material/tpost/${slug}/`,
}));
export const materialsSeo = materialsSeoJson as SeoSettings;

export function getMaterialArticleSeo(article: MaterialArticle): SeoSettings {
  return {
    title: article.title,
    description: article.description,
    canonicalPath: article.route,
    ogImage: article.cover,
  };
}

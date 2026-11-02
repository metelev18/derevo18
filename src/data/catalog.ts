import catalogSettingsJson from '../content/catalog-settings/index.json' with { type: 'json' };
import { isProductionDeploy } from '../lib/deployment';
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export type ProjectCategory = 'house' | 'sauna';
export type ProjectStatus = 'draft' | 'published';

export interface CatalogProject {
  status: ProjectStatus;
  slug: string;
  route: string;
  category: ProjectCategory;
  title: string;
  name: string;
  area: string;
  size: string;
  floors: string;
  rooms?: string;
  bathrooms?: string;
  duration: string;
  material?: string;
  features?: string[];
  aiFacts?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  image: string;
  gallery: string[];
}

type StoredCatalogProject = Omit<CatalogProject, 'slug' | 'route' | 'status'> & {
  status?: ProjectStatus;
  slug?: string;
  route?: string;
};

export interface PackageSection {
  title: string;
  items: string[];
}

export interface InteriorSection {
  title: string;
  description: string;
  image: string;
}

const catalogEntries = await loadContentDirectory<StoredCatalogProject>('catalog');

const loadedProjects: CatalogProject[] = catalogEntries.map(({ data, slug }) => ({
  ...data,
  status: data.status ?? 'published',
  slug,
  route: data.route ?? (data.category === 'house' ? `/catalog-house/${slug}/` : `/catalog-sauna/${slug}/`),
}));

export function getCatalogProjectsForEnvironment(
  projects: CatalogProject[],
  environment: string | undefined,
): CatalogProject[] {
  return isProductionDeploy(environment)
    ? projects.filter((project) => project.status === 'published')
    : projects;
}

export const allProjects = getCatalogProjectsForEnvironment(loadedProjects, process.env.PUBLIC_DEPLOY_ENV);
export const houseProjects = allProjects.filter((project) => project.category === 'house');
export const saunaProjects = allProjects.filter((project) => project.category === 'sauna');

const catalogSettings = catalogSettingsJson as {
  seo: Record<ProjectCategory, SeoSettings>;
  packageSections: PackageSection[];
  interiorSections: InteriorSection[];
};

export const catalogSeo = catalogSettings.seo;
export const basePackageSections = catalogSettings.packageSections;
export const interiorSections = catalogSettings.interiorSections;

export function getProjectSeo(project: CatalogProject): SeoSettings {
  return {
    title: project.seoTitle ?? `${project.title} от компании «ДревМастер»`,
    description: project.seoDescription
      ?? `${project.title}: ${project.area}, ${project.size}, ${project.floors}. Проект можно адаптировать под ваш участок и пожелания.`,
    canonicalPath: project.route,
    ogImage: project.image,
    noindex: project.status !== 'published',
  };
}

export function getProjectDescription(project: CatalogProject): string {
  if (project.description) return project.description;
  const building = project.category === 'house' ? 'деревянного дома' : 'деревянной бани';
  return `${project.title} площадью ${project.area} — продуманное решение для загородной жизни и отдыха. Размер ${project.size} позволяет удобно разместить проект на участке, а планировку и материалы можно адаптировать под ваши пожелания. При строительстве ${building} учитываются особенности древесины, сезонная усадка и прокладка инженерных коммуникаций.`;
}

export function getRelatedProjects(project: CatalogProject, limit = 3): CatalogProject[] {
  const source = project.category === 'house' ? houseProjects : saunaProjects;
  return source.filter((candidate) => candidate.route !== project.route).slice(0, limit);
}

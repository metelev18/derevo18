import catalogSettingsJson from '../content/catalog-settings/index.json' with { type: 'json' };
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export type ProjectCategory = 'house' | 'sauna';

export interface CatalogProject {
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
  image: string;
}

export interface PackageSection {
  title: string;
  items: string[];
}

export const allProjects = await loadContentDirectory<CatalogProject>('catalog');
export const houseProjects = allProjects.filter((project) => project.category === 'house');
export const saunaProjects = allProjects.filter((project) => project.category === 'sauna');

const catalogSettings = catalogSettingsJson as {
  seo: Record<ProjectCategory, SeoSettings>;
  packageSections: PackageSection[];
};

export const catalogSeo = catalogSettings.seo;
export const basePackageSections = catalogSettings.packageSections;

export function getProjectSeo(project: CatalogProject): SeoSettings {
  return {
    title: `${project.title} от компании «ДревМастер»`,
    description: `${project.title}: ${project.area}, ${project.size}, ${project.floors}. Проект можно адаптировать под ваш участок и пожелания.`,
    canonicalPath: project.route,
    ogImage: project.image,
  };
}

export function getProjectDescription(project: CatalogProject): string {
  const building = project.category === 'house' ? 'деревянного дома' : 'деревянной бани';
  return `${project.title} площадью ${project.area} — продуманное решение для загородной жизни и отдыха. Размер ${project.size} позволяет удобно разместить проект на участке, а планировку и материалы можно адаптировать под ваши пожелания. При строительстве ${building} учитываются особенности древесины, сезонная усадка и прокладка инженерных коммуникаций.`;
}

export function getRelatedProjects(project: CatalogProject, limit = 3): CatalogProject[] {
  const source = project.category === 'house' ? houseProjects : saunaProjects;
  return source.filter((candidate) => candidate.route !== project.route).slice(0, limit);
}

import portfolioSeoJson from '../content/portfolio-settings/index.json' with { type: 'json' };
import { isProductionDeploy } from '../lib/deployment';
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export interface PortfolioProject {
  status: 'draft' | 'published';
  id: string;
  slug: string;
  route: string;
  title: string;
  buildingType?: string;
  location?: string;
  area?: string;
  material?: string;
  completedAt?: string;
  workScope?: string;
  features?: string[];
  aiFacts?: string;
  description?: string;
  seoTitle?: string;
  seoDescription?: string;
  cover: string;
  images: string[];
}

type StoredPortfolioProject = Omit<PortfolioProject, 'id' | 'slug' | 'route' | 'status'> & {
  status?: 'draft' | 'published';
  id?: string;
  slug?: string;
  route?: string;
};

const portfolioEntries = await loadContentDirectory<StoredPortfolioProject>('portfolio');

const loadedPortfolioProjects: PortfolioProject[] = portfolioEntries.map(({ data, slug }) => ({
  ...data,
  status: data.status ?? 'published',
  id: data.id ?? slug,
  slug,
  route: data.route ?? `/portfolio/tproduct/${slug}/`,
}));

export function getPortfolioProjectsForEnvironment(
  projects: PortfolioProject[],
  environment: string | undefined,
): PortfolioProject[] {
  return isProductionDeploy(environment)
    ? projects.filter((project) => project.status === 'published')
    : projects;
}

export const portfolioProjects = getPortfolioProjectsForEnvironment(
  loadedPortfolioProjects,
  process.env.PUBLIC_DEPLOY_ENV,
);
export const portfolioSeo = portfolioSeoJson as SeoSettings;

export function getPortfolioProjectSeo(project: PortfolioProject): SeoSettings {
  return {
    title: project.seoTitle ?? project.title,
    description: project.seoDescription
      ?? `Фотогалерея выполненной работы компании «ДревМастер»: ${project.title}`,
    canonicalPath: project.route,
    ogImage: project.cover,
    noindex: project.status !== 'published',
  };
}

export function getRelatedPortfolioProjects(projectId: string, count = 3) {
  const currentIndex = portfolioProjects.findIndex((project) => project.id === projectId);
  if (currentIndex < 0) return portfolioProjects.slice(0, count);

  return Array.from({ length: Math.min(count, portfolioProjects.length - 1) }, (_, offset) =>
    portfolioProjects[(currentIndex + offset + 1) % portfolioProjects.length]
  );
}

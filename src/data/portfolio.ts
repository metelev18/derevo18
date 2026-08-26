import portfolioSeoJson from '../content/portfolio-settings/index.json' with { type: 'json' };
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export interface PortfolioProject {
  id: string;
  slug: string;
  route: string;
  title: string;
  cover: string;
  images: string[];
}

export const portfolioProjects = await loadContentDirectory<PortfolioProject>('portfolio');
export const portfolioSeo = portfolioSeoJson as SeoSettings;

export function getPortfolioProjectSeo(project: PortfolioProject): SeoSettings {
  return {
    title: project.title,
    description: `Фотогалерея выполненной работы компании «ДревМастер»: ${project.title}`,
    canonicalPath: project.route,
    ogImage: project.cover,
  };
}

export function getRelatedPortfolioProjects(projectId: string, count = 3) {
  const currentIndex = portfolioProjects.findIndex((project) => project.id === projectId);
  if (currentIndex < 0) return portfolioProjects.slice(0, count);

  return Array.from({ length: Math.min(count, portfolioProjects.length - 1) }, (_, offset) =>
    portfolioProjects[(currentIndex + offset + 1) % portfolioProjects.length]
  );
}

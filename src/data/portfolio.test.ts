import { describe, expect, it } from 'vitest';
import { getPortfolioProjectSeo, getRelatedPortfolioProjects, portfolioProjects, portfolioSeo } from './portfolio';

describe('portfolio content', () => {
  it('contains every source work and its complete local gallery', () => {
    expect(portfolioProjects).toHaveLength(36);
    expect(portfolioProjects.reduce((sum, project) => sum + project.images.length, 0)).toBe(340);
    expect(portfolioProjects.every((project) => project.images.length > 0)).toBe(true);
  });

  it('uses unique source-compatible routes and local images', () => {
    const routes = portfolioProjects.map((project) => project.route);
    const images = portfolioProjects.flatMap((project) => project.images);
    expect(new Set(routes).size).toBe(routes.length);
    expect(new Set(images).size).toBe(images.length);
    expect(routes.every((route) => route.startsWith('/portfolio/tproduct/') && route.endsWith('/'))).toBe(true);
    expect(images.every((image) => image.startsWith('/media/portfolio-work-'))).toBe(true);
    expect(portfolioProjects.every((project) => project.cover === project.images[0])).toBe(true);
    expect(JSON.stringify(portfolioProjects)).not.toContain('tildacdn.com');
  });

  it('defines metadata and related work selections', () => {
    const project = portfolioProjects[0]!;
    expect(portfolioSeo.canonicalPath).toBe('/portfolio/');
    expect(getPortfolioProjectSeo(project).canonicalPath).toBe(project.route);
    expect(getRelatedPortfolioProjects(project.id, 3)).toHaveLength(3);
  });
});

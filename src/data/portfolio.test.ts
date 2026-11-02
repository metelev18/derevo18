import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  getPortfolioProjectSeo,
  getPortfolioProjectsForEnvironment,
  getRelatedPortfolioProjects,
  portfolioProjects,
  portfolioSeo,
} from './portfolio';

function isSafeLocalMediaPath(path: string) {
  return /^\/media\/[a-zA-Z0-9._/-]+$/.test(path) && !path.includes('..');
}

function mediaFileExists(path: string) {
  return existsSync(resolve(process.cwd(), 'public', path.replace(/^\/+/, '')));
}

describe('portfolio content', () => {
  it('contains every source work and its complete local gallery', () => {
    expect(portfolioProjects.length).toBeGreaterThan(0);
    expect(portfolioProjects.every((project) => project.images.length > 0)).toBe(true);
    expect(portfolioProjects.every((project) => project.status === 'published')).toBe(true);
  });

  it('uses unique source-compatible routes and local images', () => {
    const routes = portfolioProjects.map((project) => project.route);
    const images = portfolioProjects.flatMap((project) => [project.cover, ...project.images]);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => route.startsWith('/portfolio/tproduct/') && route.endsWith('/'))).toBe(true);
    expect(images.every(isSafeLocalMediaPath)).toBe(true);
    expect(images.every(mediaFileExists)).toBe(true);
    expect(JSON.stringify(portfolioProjects)).not.toContain('tildacdn.com');
  });

  it('defines metadata and related work selections', () => {
    const project = portfolioProjects[0]!;
    expect(portfolioSeo.canonicalPath).toBe('/portfolio/');
    expect(getPortfolioProjectSeo(project).canonicalPath).toBe(project.route);
    expect(getRelatedPortfolioProjects(project.id, 3)).toHaveLength(3);

    const generatedProject = {
      ...project,
      seoTitle: 'Индивидуальный SEO-заголовок',
      seoDescription: 'Индивидуальное SEO-описание.',
    };
    expect(getPortfolioProjectSeo(generatedProject)).toMatchObject({
      title: generatedProject.seoTitle,
      description: generatedProject.seoDescription,
    });
    const draftProject = { ...generatedProject, status: 'draft' as const };
    expect(getPortfolioProjectsForEnvironment([generatedProject, draftProject], 'production'))
      .toEqual([generatedProject]);
    expect(getPortfolioProjectsForEnvironment([generatedProject, draftProject], 'preview'))
      .toHaveLength(2);
    expect(getPortfolioProjectSeo(draftProject).noindex).toBe(true);
  });
});

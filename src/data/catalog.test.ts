import { describe, expect, it } from 'vitest';
import {
  allProjects,
  basePackageSections,
  catalogSeo,
  getRelatedProjects,
  houseProjects,
  interiorSections,
  saunaProjects,
} from './catalog';

describe('catalog content', () => {
  it('contains every visible project from both source catalogs', () => {
    expect(houseProjects).toHaveLength(27);
    expect(saunaProjects).toHaveLength(14);
    expect(allProjects).toHaveLength(41);
  });

  it('uses unique local routes and local images', () => {
    expect(new Set(allProjects.map((project) => project.route)).size).toBe(allProjects.length);
    expect(allProjects.every((project) => project.route.startsWith('/') && project.route.endsWith('/'))).toBe(true);
    expect(allProjects.every((project) => project.image.startsWith('/media/'))).toBe(true);
    expect(allProjects.every((project) => project.gallery.length > 0)).toBe(true);
    expect(allProjects.flatMap((project) => project.gallery).every((image) => image.startsWith('/media/catalog-'))).toBe(true);
    expect(JSON.stringify(allProjects)).not.toContain('tildacdn.com');
  });

  it('defines indexable local catalog metadata and related projects', () => {
    expect(catalogSeo.house.canonicalPath).toBe('/catalog-house/');
    expect(catalogSeo.sauna.canonicalPath).toBe('/catalog-sauna/');
    expect(getRelatedProjects(houseProjects[0]!, 3)).toHaveLength(3);
  });

  it('defines the complete package and house interior sections', () => {
    expect(basePackageSections).toHaveLength(6);
    expect(interiorSections).toHaveLength(5);
    expect(interiorSections.every((section) => section.image.startsWith('/media/catalog-interior-'))).toBe(true);
  });
});

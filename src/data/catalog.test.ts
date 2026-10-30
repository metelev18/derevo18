import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
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

function isSafeLocalMediaPath(path: string) {
  return /^\/media\/[a-zA-Z0-9._/-]+$/.test(path) && !path.includes('..');
}

function mediaFileExists(path: string) {
  return existsSync(resolve(process.cwd(), 'public', path.replace(/^\/+/, '')));
}

describe('catalog content', () => {
  it('contains projects from both catalogs and keeps the combined list complete', () => {
    expect(houseProjects.length).toBeGreaterThan(0);
    expect(saunaProjects.length).toBeGreaterThan(0);
    expect(allProjects).toHaveLength(houseProjects.length + saunaProjects.length);
    expect(allProjects.every((project) => project.category === 'house' || project.category === 'sauna')).toBe(true);
  });

  it('uses unique local routes and local images', () => {
    const mediaPaths = allProjects.flatMap((project) => [project.image, ...project.gallery]);

    expect(new Set(allProjects.map((project) => project.route)).size).toBe(allProjects.length);
    expect(allProjects.every((project) => project.route.startsWith('/') && project.route.endsWith('/'))).toBe(true);
    expect(allProjects.every((project) => project.gallery.length > 0)).toBe(true);
    expect(mediaPaths.every(isSafeLocalMediaPath)).toBe(true);
    expect(mediaPaths.every(mediaFileExists)).toBe(true);
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

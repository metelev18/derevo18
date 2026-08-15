import { describe, expect, it } from 'vitest';
import { homeContent } from './home';

describe('home content', () => {
  it('contains the homepage collections', () => {
    expect(homeContent.projects).toHaveLength(6);
    expect(homeContent.portfolio).toHaveLength(6);
    expect(homeContent.reviews).toHaveLength(6);
    expect(homeContent.news).toHaveLength(6);
  });

  it('uses local media for all content images', () => {
    const serialized = JSON.stringify(homeContent);
    expect(serialized).not.toContain('tildacdn.com');
    expect(serialized).not.toContain('static.tilda');
    expect(homeContent.hero.background).toMatch(/^\/media\//);
  });

  it('routes unfinished product pages to a local stub target', () => {
    expect(homeContent.projects.every((project) => !project.target.startsWith('http'))).toBe(true);
  });
});

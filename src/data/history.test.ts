import { describe, expect, it } from 'vitest';
import { historyContent } from './history';

describe('history content', () => {
  it('keeps the company periods in chronological order', () => {
    expect(historyContent.periods.map((period) => period.title)).toEqual([
      '2008–2012 гг.',
      '2013–2018 гг.',
      '2019–2021 гг.',
    ]);
    expect(historyContent.periods.every((period) => period.milestones.length > 0)).toBe(true);
  });

  it('uses only local media and a canonical local route', () => {
    expect(historyContent.gallery).toHaveLength(2);
    expect(historyContent.gallery.every((image) => image.src.startsWith('/media/'))).toBe(true);
    expect(JSON.stringify(historyContent)).not.toContain('tildacdn.com');
    expect(historyContent.seo.canonicalPath).toBe('/history/');
  });
});

import { describe, expect, it } from 'vitest';
import { formIds, isFormId, siteContent } from './site';

describe('site content', () => {
  it('keeps shared navigation usable from nested pages', () => {
    expect(siteContent.navigation).toHaveLength(7);
    expect(siteContent.navigation.every((item) => item.href.startsWith('/'))).toBe(true);
    expect(siteContent.navigation[0]?.href).toBe('/history/');
    expect(siteContent.navigation[1]?.href).toBe('/catalog-house/');
    expect(siteContent.navigation[2]?.href).toBe('/portfolio/');
    expect(siteContent.navigation[3]?.href).toBe('/rewies/');
    expect(siteContent.navigation[4]?.href).toBe('/material/');
    expect(siteContent.navigation[5]?.href).toBe('/news/');
  });

  it('defines every demo form exactly once', () => {
    expect(Object.keys(siteContent.forms)).toEqual(formIds);
    expect(Object.values(siteContent.forms).map((form) => form.id)).toEqual(formIds);
    expect(isFormId('catalog')).toBe(true);
    expect(isFormId('unknown')).toBe(false);
  });

  it('does not depend on Tilda assets', () => {
    const serialized = JSON.stringify(siteContent);
    expect(serialized).not.toContain('tildacdn.com');
    expect(serialized).not.toContain('static.tilda');
  });
});

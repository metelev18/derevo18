import { describe, expect, it } from 'vitest';
import { buildRobotsTxt, isProductionDeploy } from './deployment';

describe('deployment helpers', () => {
  it('allows indexing only for an explicit production deployment', () => {
    expect(isProductionDeploy('production')).toBe(true);
    expect(isProductionDeploy('preview')).toBe(false);
    expect(isProductionDeploy(undefined)).toBe(false);
  });

  it('builds environment-specific robots policies', () => {
    expect(buildRobotsTxt('production')).toContain('Allow: /');
    expect(buildRobotsTxt('preview')).toContain('Disallow: /');
    expect(buildRobotsTxt(undefined)).toContain('Disallow: /');
  });
});

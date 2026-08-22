export type DeployEnvironment = 'preview' | 'production';

export function isProductionDeploy(value: string | undefined): boolean {
  return value === 'production';
}

export function buildRobotsTxt(environment: string | undefined): string {
  return isProductionDeploy(environment)
    ? 'User-agent: *\nAllow: /\n'
    : 'User-agent: *\nDisallow: /\n';
}

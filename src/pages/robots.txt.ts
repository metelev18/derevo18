import type { APIRoute } from 'astro';
import { buildRobotsTxt } from '../lib/deployment';

export const prerender = true;

export const GET: APIRoute = () => new Response(buildRobotsTxt(import.meta.env.PUBLIC_DEPLOY_ENV), {
  headers: { 'Content-Type': 'text/plain; charset=utf-8' },
});

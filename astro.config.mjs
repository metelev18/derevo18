import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

const siteUrl = process.env.PUBLIC_SITE_URL ?? 'https://derevo18-astro.workers.dev';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: siteUrl,
  trailingSlash: 'always',
  vite: {
    build: {
      cssMinify: true,
    },
  },
});

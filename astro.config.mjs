import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

export default defineConfig({
  integrations: [react()],
  output: 'static',
  site: 'https://derevo18-astro.workers.dev',
  trailingSlash: 'always',
  vite: {
    build: {
      cssMinify: true,
    },
  },
});

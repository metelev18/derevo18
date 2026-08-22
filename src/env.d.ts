/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_DEPLOY_ENV?: 'preview' | 'production';
  readonly PUBLIC_SITE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

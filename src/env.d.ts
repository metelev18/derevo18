/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_DEPLOY_ENV?: 'preview' | 'production';
  readonly PUBLIC_SITE_URL?: string;
  readonly PUBLIC_FORMS_ENDPOINT?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

import siteContentJson from '../content/site/index.json' with { type: 'json' };

export interface NavigationItem {
  label: string;
  href: string;
}

export interface Contact {
  phoneLabel: string;
  phoneHref: string;
  email: string;
  address: string;
  company: string;
}

export interface SocialLink {
  label: string;
  href: string;
  kind: 'vk' | 'telegram' | 'whatsapp';
}

export const formIds = ['callback', 'catalog', 'application', 'project'] as const;

export type FormId = (typeof formIds)[number];

export interface FormDefinition {
  id: FormId;
  title: string;
  description: string;
  button: string;
  showEmail?: boolean;
}

export interface SeoSettings {
  title: string;
  description: string;
  canonicalPath: string;
  ogImage: string;
  noindex?: boolean;
}

export interface SiteContent {
  navigation: NavigationItem[];
  contact: Contact;
  socials: SocialLink[];
  forms: Record<FormId, FormDefinition>;
  mapEmbedUrl: string;
  copyright: string;
}

export const siteContent = siteContentJson as SiteContent;

export function isFormId(value: string | undefined): value is FormId {
  return formIds.some((formId) => formId === value);
}

export const comingSoon = (target: string) => `/coming-soon/?target=${encodeURIComponent(target)}`;

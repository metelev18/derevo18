import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

const seoSchema = z.object({
  title: z.string(),
  description: z.string(),
  canonicalPath: z.string(),
  ogImage: z.string(),
  noindex: z.boolean().optional(),
});

const orderedEntrySchema = z.object({
  order: z.number().int().nonnegative(),
});

const catalog = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/catalog' }),
  schema: orderedEntrySchema.extend({
    slug: z.string().optional(),
    route: z.string().optional(),
    category: z.enum(['house', 'sauna']),
    title: z.string(),
    name: z.string(),
    area: z.string(),
    size: z.string(),
    floors: z.string(),
    rooms: z.string().optional(),
    bathrooms: z.string().optional(),
    duration: z.string(),
    image: z.string(),
  }),
});

const materialBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string()) }),
  z.object({ type: z.literal('image'), src: z.string(), alt: z.string() }),
]);

const materials = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/materials' }),
  schema: orderedEntrySchema.extend({
    id: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    cover: z.string(),
    blocks: z.array(materialBlockSchema),
    showCover: z.boolean(),
  }),
});

const newsBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: z.string() }),
  z.object({ type: z.literal('heading'), text: z.string() }),
  z.object({ type: z.literal('quote'), text: z.string() }),
  z.object({ type: z.literal('list'), ordered: z.boolean(), items: z.array(z.string()) }),
  z.object({ type: z.literal('image'), src: z.string(), alt: z.string() }),
  z.object({ type: z.literal('video'), src: z.string() }),
]);

const news = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/news' }),
  schema: orderedEntrySchema.extend({
    status: z.enum(['draft', 'published']).default('published'),
    id: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    cover: z.string(),
    blocks: z.array(newsBlockSchema),
  }),
});

const portfolio = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/portfolio' }),
  schema: orderedEntrySchema.extend({
    id: z.string().optional(),
    slug: z.string().optional(),
    route: z.string().optional(),
    title: z.string(),
    cover: z.string(),
    images: z.array(z.string()),
  }),
});

const reviews = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/reviews' }),
  schema: orderedEntrySchema.extend({
    id: z.string().optional(),
    route: z.string().optional(),
    title: z.string(),
    description: z.string(),
    date: z.string(),
    cover: z.string(),
    text: z.string(),
    images: z.array(z.string()),
    videos: z.array(z.string()),
  }),
});

const formIdSchema = z.enum(['callback', 'catalog', 'application', 'project']);
const formSchema = z.object({
  id: formIdSchema,
  title: z.string(),
  description: z.string(),
  button: z.string(),
  showEmail: z.boolean().optional(),
});

const site = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/site' }),
  schema: z.object({
    navigation: z.array(z.object({ label: z.string(), href: z.string() })),
    contact: z.object({
      phoneLabel: z.string(),
      phoneHref: z.string(),
      email: z.string(),
      address: z.string(),
      company: z.string(),
    }),
    socials: z.array(z.object({
      label: z.string(),
      href: z.string(),
      kind: z.enum(['vk', 'telegram', 'whatsapp']),
    })),
    forms: z.object({
      callback: formSchema,
      catalog: formSchema,
      application: formSchema,
      project: formSchema,
    }),
    contactsEyebrow: z.string(),
    mapEmbedUrl: z.string(),
    copyright: z.string(),
  }),
});

const home = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/home' }),
  schema: z.object({
    hero: z.object({
      eyebrow: z.string(),
      title: z.string(),
      background: z.string(),
      materials: z.array(z.object({ title: z.string(), image: z.string(), href: z.string() })),
    }),
    about: z.object({
      eyebrow: z.string(),
      title: z.string(),
      lead: z.string(),
      servicesTitle: z.string(),
      services: z.array(z.string()),
      detailsHref: z.string(),
      mainImage: z.string(),
      mainImageAlt: z.string(),
      secondaryImage: z.string(),
      secondaryImageAlt: z.string(),
      badgeTitle: z.string(),
      badgeText: z.string(),
      features: z.array(z.object({ title: z.string(), text: z.string() })),
    }),
    promo: z.object({
      background: z.string(),
      cards: z.array(z.object({ eyebrow: z.string(), title: z.string(), button: z.string(), href: z.string() })),
    }),
    video: z.object({ src: z.string(), title: z.string() }),
    technology: z.object({
      eyebrow: z.string(),
      title: z.string(),
      image: z.string(),
      imageAlt: z.string(),
      items: z.array(z.object({ number: z.string(), text: z.string() })),
    }),
    director: z.object({
      image: z.string(),
      imageAlt: z.string(),
      quote: z.string(),
      text: z.string(),
      name: z.string(),
      role: z.string(),
    }),
    projects: z.array(z.object({
      title: z.string(),
      image: z.string(),
      area: z.string(),
      size: z.string(),
      floors: z.string(),
      rooms: z.string(),
      target: z.string(),
    })),
    portfolio: z.array(z.object({ title: z.string(), image: z.string() })),
    reviews: z.array(z.object({
      title: z.string(),
      excerpt: z.string().optional(),
      date: z.string(),
      image: z.string(),
      href: z.string().optional(),
    })),
    news: z.array(z.object({
      title: z.string(),
      excerpt: z.string().optional(),
      date: z.string(),
      image: z.string(),
      href: z.string().optional(),
    })),
    seo: seoSchema,
  }),
});

const history = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/history' }),
  schema: z.object({
    title: z.string(),
    lead: z.array(z.string()),
    periods: z.array(z.object({
      title: z.string(),
      milestones: z.array(z.object({ year: z.string().optional(), text: z.string() })),
    })),
    gallery: z.array(z.object({ src: z.string(), alt: z.string() })),
    seo: seoSchema,
  }),
});

const catalogSettings = defineCollection({
  loader: glob({ pattern: '**/*.json', base: './src/content/catalog-settings' }),
  schema: z.object({
    seo: z.object({ house: seoSchema, sauna: seoSchema }),
    packageSections: z.array(z.object({ title: z.string(), items: z.array(z.string()) })),
  }),
});

function seoSettingsCollection(base: string) {
  return defineCollection({
    loader: glob({ pattern: '**/*.json', base }),
    schema: seoSchema,
  });
}

const materialsSettings = seoSettingsCollection('./src/content/materials-settings');
const newsSettings = seoSettingsCollection('./src/content/news-settings');
const portfolioSettings = seoSettingsCollection('./src/content/portfolio-settings');
const reviewsSettings = seoSettingsCollection('./src/content/reviews-settings');

export const collections = {
  catalog,
  materials,
  news,
  portfolio,
  reviews,
  site,
  home,
  history,
  catalogSettings,
  materialsSettings,
  newsSettings,
  portfolioSettings,
  reviewsSettings,
};

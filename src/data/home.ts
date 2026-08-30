import homeContentJson from '../content/home/index.json' with { type: 'json' };
import type { SeoSettings } from './site';

export interface ProjectCard {
  title: string;
  image: string;
  area: string;
  size: string;
  floors: string;
  rooms: string;
  target: string;
}

export interface PortfolioItem {
  title: string;
  image: string;
}

export interface FeedItem {
  title: string;
  excerpt?: string;
  date: string;
  image: string;
  href?: string;
}

export interface HomeContent {
  hero: {
    eyebrow: string;
    title: string;
    background: string;
    materials: Array<{ title: string; image: string; href: string }>;
  };
  about: {
    eyebrow: string;
    title: string;
    lead: string;
    servicesTitle: string;
    services: string[];
    detailsHref: string;
    mainImage: string;
    mainImageAlt: string;
    secondaryImage: string;
    secondaryImageAlt: string;
    badgeTitle: string;
    badgeText: string;
    features: Array<{ title: string; text: string }>;
  };
  promo: {
    background: string;
    cards: Array<{ eyebrow: string; title: string; button: string; href: string }>;
  };
  video: { src: string; title: string };
  technology: {
    eyebrow: string;
    title: string;
    image: string;
    imageAlt: string;
    items: Array<{ number: string; text: string }>;
  };
  director: {
    image: string;
    imageAlt: string;
    quote: string;
    text: string;
    name: string;
    role: string;
  };
  projects: ProjectCard[];
  portfolio: PortfolioItem[];
  reviews: FeedItem[];
  news: FeedItem[];
  seo: SeoSettings;
}

export const homeContent = homeContentJson as HomeContent;

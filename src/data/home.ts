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
  projects: ProjectCard[];
  portfolio: PortfolioItem[];
  reviews: FeedItem[];
  news: FeedItem[];
  seo: SeoSettings;
}

export const homeContent = homeContentJson as HomeContent;

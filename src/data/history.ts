import historyContentJson from '../content/history/index.json' with { type: 'json' };
import type { SeoSettings } from './site';

export interface HistoryMilestone {
  year?: string;
  text: string;
}

export interface HistoryPeriod {
  title: string;
  milestones: HistoryMilestone[];
}

export interface HistoryImage {
  src: string;
  alt: string;
}

export interface HistoryContent {
  title: string;
  lead: string[];
  periods: HistoryPeriod[];
  gallery: HistoryImage[];
  seo: SeoSettings;
}

export const historyContent = historyContentJson as HistoryContent;

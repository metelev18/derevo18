import reviewsSeoJson from '../content/reviews-settings/index.json' with { type: 'json' };
import { loadContentDirectory } from './content';
import type { SeoSettings } from './site';

export interface CustomerReview {
  id: string;
  route: string;
  title: string;
  description: string;
  date: string;
  cover: string;
  text: string;
  images: string[];
  videos: string[];
}

type StoredCustomerReview = Omit<CustomerReview, 'id' | 'route'> & {
  id?: string;
  route?: string;
};

const reviewEntries = await loadContentDirectory<StoredCustomerReview>('reviews');

export const customerReviews: CustomerReview[] = reviewEntries.map(({ data, slug }) => ({
  ...data,
  id: data.id ?? slug,
  route: data.route ?? `/rewies/tpost/${slug}/`,
}));
export const reviewsSeo = reviewsSeoJson as SeoSettings;

export function getCustomerReviewSeo(review: CustomerReview): SeoSettings {
  const description = review.text || review.description || 'Отзыв заказчика о работе компании Древмастер.';
  return {
    title: review.title,
    description: description.replace(/\s+/g, ' ').trim().slice(0, 180),
    canonicalPath: review.route,
    ogImage: review.cover,
  };
}

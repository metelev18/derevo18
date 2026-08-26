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

export const customerReviews = await loadContentDirectory<CustomerReview>('reviews');
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

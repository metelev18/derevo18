import { describe, expect, it } from 'vitest';
import { customerReviews, getCustomerReviewSeo, reviewsSeo } from './reviews';

describe('reviews content', () => {
  it('contains every source review and its detailed media', () => {
    expect(customerReviews).toHaveLength(33);
    expect(customerReviews.filter((review) => review.text).length).toBe(31);
    expect(customerReviews.reduce((sum, review) => sum + review.images.length, 0)).toBe(102);
    expect(customerReviews.reduce((sum, review) => sum + review.videos.length, 0)).toBe(3);
  });

  it('uses unique source-compatible routes and local images', () => {
    const routes = customerReviews.map((review) => review.route);
    const images = customerReviews.flatMap((review) => [review.cover, ...review.images]);
    expect(new Set(routes).size).toBe(routes.length);
    expect(routes.every((route) => (route.startsWith('/rewies/tpost/') || route.startsWith('/tpost/')) && route.endsWith('/'))).toBe(true);
    expect(images.every((image) => image.startsWith('/media/'))).toBe(true);
    expect(new Set(images).size).toBe(128);
    expect(JSON.stringify(customerReviews)).not.toContain('tildacdn.com');
  });

  it('keeps video embeds scoped and defines metadata', () => {
    const videos = customerReviews.flatMap((review) => review.videos);
    expect(videos.every((video) => video.startsWith('https://kinescope.io/embed/'))).toBe(true);
    expect(reviewsSeo.canonicalPath).toBe('/rewies/');
    expect(getCustomerReviewSeo(customerReviews[0]!).canonicalPath).toBe(customerReviews[0]!.route);
  });
});

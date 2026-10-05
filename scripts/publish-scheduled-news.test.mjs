import { describe, expect, it } from 'vitest';
import {
  getPublicationBlockReason,
  planPublications,
} from './publish-scheduled-news.mjs';

const readyArticle = {
  status: 'scheduled',
  publishAt: '2026-10-01',
  order: 2,
  title: 'Готовая статья',
  cover: '/media/news-ready.webp',
  blocks: [{ type: 'paragraph', text: 'Проверенный текст.' }],
};

describe('scheduled news publication', () => {
  it('skips an incomplete article without blocking the next ready article', () => {
    const entries = [
      {
        fileName: 'blocked.json',
        data: { ...readyArticle, order: 1, cover: '/media/news-draft-placeholder.svg' },
      },
      { fileName: 'ready.json', data: readyArticle },
      {
        fileName: 'draft.json',
        data: { ...readyArticle, status: 'draft', order: 3 },
      },
    ];

    const plan = planPublications(entries, '2026-10-01');

    expect(plan.selectedEntries.map(({ fileName }) => fileName)).toEqual(['ready.json']);
    expect(plan.blockedEntries).toHaveLength(1);
    expect(plan.blockedEntries[0].reason).toContain('обложка');
  });

  it('publishes every ready article due on the same day in one run', () => {
    const plan = planPublications([
      { fileName: 'second.json', data: { ...readyArticle, order: 2 } },
      { fileName: 'first.json', data: { ...readyArticle, order: 1 } },
      {
        fileName: 'future.json',
        data: { ...readyArticle, publishAt: '2026-10-02', order: 3 },
      },
    ], '2026-10-01');

    expect(plan.selectedEntries.map(({ fileName }) => fileName)).toEqual([
      'first.json',
      'second.json',
    ]);
  });

  it('blocks unresolved editorial markers', () => {
    expect(getPublicationBlockReason({
      ...readyArticle,
      blocks: [{ type: 'paragraph', text: 'Значение: [НУЖНО УТОЧНИТЬ]' }],
    })).toContain('[НУЖНО УТОЧНИТЬ]');
  });

  it('skips a scheduled article without a valid date', () => {
    const plan = planPublications([
      {
        fileName: 'missing-date.json',
        data: { ...readyArticle, publishAt: undefined },
      },
      { fileName: 'ready.json', data: readyArticle },
    ], '2026-10-01');

    expect(plan.selectedEntries.map(({ fileName }) => fileName)).toEqual(['ready.json']);
    expect(plan.blockedEntries[0].reason).toContain('дата');
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildScheduleDates,
  formatDisplayDate,
  parseArticleRequests,
  renderPromptTemplate,
  selectDueArticles,
  validatePromptTemplate,
} from './news-automation-utils.mjs';

describe('news automation utilities', () => {
  it('parses a batch of topic and fact pairs', () => {
    expect(parseArticleRequests('Первая тема | Факт 1\nВторая тема | Факт 2', 30)).toEqual([
      { topic: 'Первая тема', facts: 'Факт 1' },
      { topic: 'Вторая тема', facts: 'Факт 2' },
    ]);
  });

  it('builds one publication date per day by default', () => {
    expect(buildScheduleDates(3, {
      scheduleMode: 'daily',
      startDate: '2026-09-22',
      intervalDays: 1,
      articlesPerDay: 1,
    }, '2026-09-21')).toEqual(['2026-09-22', '2026-09-23', '2026-09-24']);
    expect(formatDisplayDate('2026-09-22')).toBe('22.09.2026');
  });

  it('validates and renders the reusable article prompt', () => {
    const template = `${'Редакционные правила. '.repeat(12)}\nТема: {{TOPIC}}\nФакты: {{FACTS}}\nДата: {{CURRENT_DATE}}`;
    expect(validatePromptTemplate(template)).toContain('{{TOPIC}}');
    expect(renderPromptTemplate(template, {
      TOPIC: 'Как выбрать проект бани',
      FACTS: 'Площадь зависит от состава помещений',
      CURRENT_DATE: '2026-09-22',
    })).toContain('Тема: Как выбрать проект бани');
  });

  it('rejects a prompt without required or with unknown placeholders', () => {
    expect(() => validatePromptTemplate('Текст '.repeat(40))).toThrow(/TOPIC, FACTS/);
    expect(() => validatePromptTemplate(`${'Текст '.repeat(40)}{{TOPIC}} {{FACTS}} {{UNKNOWN}}`))
      .toThrow(/UNKNOWN/);
  });

  it('selects only due scheduled articles in a stable order', () => {
    const entries = [
      { fileName: 'future.json', data: { status: 'scheduled', publishAt: '2026-09-23', order: 1 } },
      { fileName: 'second.json', data: { status: 'scheduled', publishAt: '2026-09-21', order: 2 } },
      { fileName: 'first.json', data: { status: 'scheduled', publishAt: '2026-09-21', order: 1 } },
      { fileName: 'draft.json', data: { status: 'draft', order: 0 } },
    ];

    expect(selectDueArticles(entries, '2026-09-21', 1).map(({ fileName }) => fileName)).toEqual(['first.json']);
  });
});

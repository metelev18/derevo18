import { afterEach, describe, expect, it, vi } from 'vitest';
import { nextArticleOrder, requestValidatedDraft } from './generate-news-draft.mjs';

const validDraft = {
  title: 'Фундамент деревянного дома',
  description: 'Как выбрать фундамент с учетом участка и проекта.',
  lead: 'Выбор начинается с исследования участка и расчета нагрузок.',
  sections: [
    {
      heading: 'Исходные данные',
      paragraphs: ['До выбора конструкции необходимо изучить грунты и рельеф участка.'],
      bullets: [],
    },
    {
      heading: 'Работа с проектировщиком',
      paragraphs: ['Окончательное решение принимают по результатам изысканий и расчета нагрузок.'],
      bullets: ['Уточнить конструкцию дома', 'Проверить глубину промерзания'],
    },
  ],
  conclusion: 'Фундамент следует выбирать по расчету, а не только по типовым рекомендациям.',
};

function completion(draft) {
  return new Response(JSON.stringify({
    choices: [{
      finish_reason: 'stop',
      message: { content: JSON.stringify(draft) },
    }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('DeepSeek draft generation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('regenerates an article when the first response violates the content limits', async () => {
    const invalidDraft = structuredClone(validDraft);
    invalidDraft.sections[1].paragraphs = [];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completion(invalidDraft))
      .mockResolvedValueOnce(completion(validDraft));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await requestValidatedDraft({
      apiKey: 'test-key',
      settings: { model: 'deepseek-flash', temperature: 0.4 },
      messages: [{ role: 'user', content: 'Подготовь статью и верни JSON.' }],
    });

    expect(result.title).toBe(validDraft.title);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    const retryBody = JSON.parse(fetchMock.mock.calls[1][1].body);
    expect(retryBody.messages.at(-1).content).toContain('received 0 paragraphs');
  });

  it('assigns the next ascending order to a generated batch', () => {
    expect(nextArticleOrder([])).toBe(0);
    expect(nextArticleOrder([0, 1, 2])).toBe(3);
    expect(nextArticleOrder([4, 1, 7, 2])).toBe(8);
  });
});

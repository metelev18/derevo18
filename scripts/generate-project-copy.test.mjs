import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  buildSourceFacts,
  parseEntryContext,
  renderProjectPrompt,
  requestValidatedCopy,
  validateGeneratedCopy,
} from './generate-project-copy.mjs';

const validCopy = {
  description: 'Проект компактного одноэтажного дома площадью 80 кв. м с тремя комнатами.',
  seoTitle: 'Проект дома «Компакт 80» — «ДревМастер»',
  seoDescription: 'Одноэтажный дом площадью 80 кв. м: размеры, планировка и срок строительства.',
};

function completion(copy) {
  return new Response(JSON.stringify({
    choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(copy) } }],
  }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}

describe('project copy generation', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('accepts only entry actions inside the selected content directory', () => {
    const context = parseEntryContext(JSON.stringify({
      context: { type: 'entry', name: 'catalog', path: 'src/content/catalog/dom-kompakt.json' },
    }));
    expect(context.kind).toBe('catalog');
    expect(context.entryPath).toBe('src/content/catalog/dom-kompakt.json');

    expect(() => parseEntryContext(JSON.stringify({
      context: { type: 'entry', name: 'catalog', path: 'src/content/catalog/../../../package.json' },
    }))).toThrow(/outside/);
  });

  it('builds an allowlisted fact set and requires portfolio evidence', () => {
    expect(buildSourceFacts('catalog', {
      category: 'house',
      title: 'Проект дома',
      name: 'Компакт',
      area: '80 кв. м',
      size: '8×10 м',
      floors: '1 этаж',
      duration: 'от 60 дней',
      description: 'Старый текст',
    })).not.toHaveProperty('description');

    expect(() => buildSourceFacts('portfolio', {
      title: 'Готовый дом',
      images: ['/media/house.jpg'],
    })).toThrow(/verified portfolio fact/);
  });

  it('renders the editable prompt without allowing unknown placeholders', () => {
    const template = `${'Редакционные правила. '.repeat(12)}\n{{PROJECT_FACTS_JSON}}\n{{CURRENT_DATE}}`;
    expect(renderProjectPrompt(template, 'PROJECT_FACTS_JSON', { title: 'Дом' }, '2026-11-01'))
      .toContain('"title": "Дом"');
    expect(() => renderProjectPrompt(`${template}\n{{UNKNOWN}}`, 'PROJECT_FACTS_JSON', {}, '2026-11-01'))
      .toThrow(/UNKNOWN/);
  });

  it('rejects unexpected fields, HTML and clarification markers', () => {
    expect(validateGeneratedCopy(validCopy)).toEqual(validCopy);
    expect(() => validateGeneratedCopy({ ...validCopy, route: '/changed/' })).toThrow(/unexpected fields/);
    expect(() => validateGeneratedCopy({ ...validCopy, description: '<b>Текст</b>' })).toThrow(/HTML/);
    expect(() => validateGeneratedCopy({
      ...validCopy,
      description: '[НУЖНО УТОЧНИТЬ: материал]',
    })).toThrow(/additional verified facts/);
  });

  it('asks DeepSeek to regenerate an invalid response', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(completion({ ...validCopy, seoTitle: '' }))
      .mockResolvedValueOnce(completion(validCopy));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);

    const result = await requestValidatedCopy({
      apiKey: 'test-key',
      settings: { model: 'deepseek-flash', temperature: 0.4 },
      messages: [{ role: 'user', content: 'Верни JSON.' }],
    });

    expect(result).toEqual(validCopy);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

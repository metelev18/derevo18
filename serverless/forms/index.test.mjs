// @vitest-environment node

import { createRequire } from 'node:module';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const require = createRequire(import.meta.url);
const { handler } = require('./index.js');

const origin = 'https://derevo18.com';
const context = { token: { access_token: 'test-iam-token' } };
const validBody = {
  formId: 'estimate',
  name: 'Тестовый посетитель',
  phone: '+7 (919) 916-80-22',
  consent: true,
  page: `${origin}/`,
  website: '',
};

function event(body = validBody, overrides = {}) {
  return {
    httpMethod: 'POST',
    headers: { origin, 'content-type': 'application/json' },
    body: JSON.stringify(body),
    ...overrides,
  };
}

describe('Yandex Cloud lead form handler', () => {
  beforeEach(() => {
    process.env.ALLOWED_ORIGINS = origin;
    process.env.POSTBOX_FROM = 'forms@derevo18.com';
    process.env.POSTBOX_TO = '59286@mail.ru';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    delete process.env.ALLOWED_ORIGINS;
    delete process.env.POSTBOX_FROM;
    delete process.env.POSTBOX_TO;
  });

  it('validates and forwards a lead through Postbox without returning personal data', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{"MessageId":"test"}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);
    vi.spyOn(console, 'info').mockImplementation(() => undefined);

    const response = await handler(event(), context);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe(origin);
    expect(JSON.parse(response.body)).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, request] = fetchMock.mock.calls[0];
    expect(url).toBe('https://postbox.cloud.yandex.net/v2/email/outbound-emails');
    expect(request.headers['X-YaCloud-SubjectToken']).toBe('test-iam-token');
    const message = JSON.parse(request.body);
    expect(message.FromEmailAddress).toBe('forms@derevo18.com');
    expect(message.Destination.ToAddresses).toEqual(['59286@mail.ru']);
    expect(message.Content.Simple.Body.Text.Data).toContain('Рассчитать стоимость');
    expect(message.Content.Simple.Body.Text.Data).toContain('+7 (919) 916-80-22');
  });

  it('rejects requests from an unknown origin before delivery', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(event(validBody, { headers: { origin: 'https://attacker.example', 'content-type': 'application/json' } }), context);
    expect(response.statusCode).toBe(403);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('silently accepts the honeypot without forwarding spam', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const response = await handler(event({ ...validBody, website: 'spam.example' }), context);
    expect(response.statusCode).toBe(204);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('rejects incomplete submissions and project requests without email', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    expect((await handler(event({ ...validBody, phone: '+7 123' }), context)).statusCode).toBe(400);
    expect((await handler(event({ ...validBody, formId: 'project' }), context)).statusCode).toBe(400);
  });

  it('fails safely when the service account token or Postbox settings are missing', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    vi.stubGlobal('fetch', vi.fn());
    expect((await handler(event(), {})).statusCode).toBe(502);
    delete process.env.POSTBOX_FROM;
    expect((await handler(event(), context)).statusCode).toBe(502);
  });

  it('answers preflight requests for an allowed site', async () => {
    const response = await handler(event(undefined, { httpMethod: 'OPTIONS', body: undefined }), context);
    expect(response.statusCode).toBe(204);
    expect(response.headers['Access-Control-Allow-Methods']).toContain('POST');
  });
});

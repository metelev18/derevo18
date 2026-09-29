'use strict';

const FORM_LABELS = {
  callback: 'Заказать звонок',
  catalog: 'Скачать каталог',
  application: 'Оставить заявку',
  project: 'Получить проект',
  estimate: 'Рассчитать стоимость',
};

function jsonResponse(statusCode, body, origin) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...(origin ? {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        Vary: 'Origin',
      } : {}),
    },
    body: statusCode === 204 ? '' : JSON.stringify(body),
  };
}

function normalizeHeaders(headers = {}) {
  return Object.fromEntries(Object.entries(headers).map(([name, value]) => [name.toLowerCase(), value]));
}

function allowedOrigin(origin) {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  return Boolean(origin && allowed.includes(origin));
}

function parseBody(event) {
  const raw = event.isBase64Encoded
    ? Buffer.from(event.body ?? '', 'base64').toString('utf8')
    : event.body;
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > 12_000) {
    throw new Error('invalid-body');
  }
  const value = JSON.parse(raw);
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('invalid-body');
  return value;
}

function cleanText(value, minimum, maximum) {
  if (typeof value !== 'string') throw new Error('invalid-field');
  const result = value.replaceAll('\r\n', '\n').trim();
  if (result.length < minimum || result.length > maximum || /[<>]/.test(result)) throw new Error('invalid-field');
  return result;
}

function validateSubmission(raw, origin) {
  if (typeof raw.formId !== 'string' || !Object.hasOwn(FORM_LABELS, raw.formId)) {
    throw new Error('invalid-form');
  }
  const name = cleanText(raw.name, 2, 100);
  const phone = cleanText(raw.phone, 10, 30);
  const digits = phone.replace(/\D/g, '');
  if (!/^[78]\d{10}$/.test(digits)) throw new Error('invalid-phone');
  if (raw.consent !== true) throw new Error('consent-required');

  const email = raw.email === undefined || raw.email === '' ? undefined : cleanText(raw.email, 5, 150);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('invalid-email');
  if (raw.formId === 'project' && !email) throw new Error('email-required');

  const page = cleanText(raw.page, 1, 500);
  let pageUrl;
  try {
    pageUrl = new URL(page);
  } catch {
    throw new Error('invalid-page');
  }
  if (pageUrl.origin !== origin) throw new Error('invalid-page');

  return { formId: raw.formId, name, phone, email, page };
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function emailSubject(submission) {
  return `Новая заявка: ${FORM_LABELS[submission.formId]}`;
}

function emailText(submission) {
  return [
    'Новая заявка с derevo18.com',
    '',
    `Форма: ${FORM_LABELS[submission.formId]}`,
    `Имя: ${submission.name}`,
    `Телефон: ${submission.phone}`,
    ...(submission.email ? [`Email: ${submission.email}`] : []),
    `Страница: ${submission.page}`,
    `Получено: ${new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Samara',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date())}`,
  ].join('\n');
}

function emailHtml(submission) {
  const row = (label, value) => `<tr><th align="left" style="padding:6px 14px 6px 0">${label}</th><td style="padding:6px 0">${escapeHtml(value)}</td></tr>`;
  return [
    '<h2>Новая заявка с derevo18.com</h2>',
    '<table>',
    row('Форма', FORM_LABELS[submission.formId]),
    row('Имя', submission.name),
    row('Телефон', submission.phone),
    ...(submission.email ? [row('Email', submission.email)] : []),
    row('Страница', submission.page),
    row('Получено', new Intl.DateTimeFormat('ru-RU', {
      timeZone: 'Europe/Samara',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }).format(new Date())),
    '</table>',
  ].join('');
}

function postboxSettings(context) {
  const from = process.env.POSTBOX_FROM?.trim();
  const recipients = (process.env.POSTBOX_TO ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
  const iamToken = context?.token?.access_token;
  if (!from || recipients.length === 0 || recipients.length > 10 || !iamToken) {
    throw new Error('postbox-not-configured');
  }
  return { from, recipients, iamToken };
}

async function sendViaPostbox(submission, context) {
  const { from, recipients, iamToken } = postboxSettings(context);

  const response = await fetch('https://postbox.cloud.yandex.net/v2/email/outbound-emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-YaCloud-SubjectToken': iamToken,
    },
    body: JSON.stringify({
      FromEmailAddress: from,
      Destination: { ToAddresses: recipients },
      Content: {
        Simple: {
          Subject: { Data: emailSubject(submission), Charset: 'UTF-8' },
          Body: {
            Text: { Data: emailText(submission), Charset: 'UTF-8' },
            Html: { Data: emailHtml(submission), Charset: 'UTF-8' },
          },
        },
      },
    }),
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`postbox-http-${response.status}`);
}

module.exports.handler = async function handler(event, context) {
  const headers = normalizeHeaders(event?.headers);
  const origin = headers.origin;
  const method = event?.httpMethod ?? event?.requestContext?.http?.method;

  if (!allowedOrigin(origin)) return jsonResponse(403, { ok: false }, undefined);
  if (method === 'OPTIONS') return jsonResponse(204, { ok: true }, origin);
  if (method !== 'POST') return jsonResponse(405, { ok: false }, origin);
  if (!headers['content-type']?.toLowerCase().startsWith('application/json')) {
    return jsonResponse(415, { ok: false }, origin);
  }

  try {
    const raw = parseBody(event);
    if (typeof raw.website === 'string' && raw.website.trim()) {
      return jsonResponse(204, { ok: true }, origin);
    }
    const submission = validateSubmission(raw, origin);
    await sendViaPostbox(submission, context);
    console.info(JSON.stringify({ event: 'lead-delivered', formId: submission.formId }));
    return jsonResponse(200, { ok: true }, origin);
  } catch (error) {
    const clientError = ['invalid-body', 'invalid-field', 'invalid-form', 'invalid-phone', 'consent-required', 'invalid-email', 'email-required', 'invalid-page']
      .includes(error instanceof Error ? error.message : '');
    if (!clientError) console.error('Lead delivery failed without logging personal data.');
    return jsonResponse(clientError ? 400 : 502, { ok: false }, origin);
  }
};

module.exports._test = { emailHtml, emailText, escapeHtml, validateSubmission };

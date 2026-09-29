import type { FormId } from '../data/site';

export interface LeadSubmission {
  formId: FormId;
  name: string;
  phone: string;
  email?: string;
  consent: true;
  page: string;
  website: string;
}

interface SubmitOptions {
  endpoint?: string;
  fetcher?: typeof fetch;
  timeoutMs?: number;
}

export class FormSubmissionError extends Error {
  constructor(public readonly code: 'not-configured' | 'network' | 'rejected') {
    super(code);
  }
}

export async function submitLead(
  submission: LeadSubmission,
  {
    endpoint = import.meta.env.PUBLIC_FORMS_ENDPOINT?.trim(),
    fetcher = fetch,
    timeoutMs = 12_000,
  }: SubmitOptions = {},
) {
  if (!endpoint) throw new FormSubmissionError('not-configured');

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetcher(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
      signal: controller.signal,
    });
    if (!response.ok) throw new FormSubmissionError('rejected');
  } catch (error) {
    if (error instanceof FormSubmissionError) throw error;
    throw new FormSubmissionError('network');
  } finally {
    window.clearTimeout(timeout);
  }
}

import { describe, expect, it, vi } from 'vitest';
import { submitLead, type LeadSubmission } from './formSubmission';

const submission: LeadSubmission = {
  formId: 'callback',
  name: 'Тестовый посетитель',
  phone: '+7 (919) 916-80-22',
  consent: true,
  page: 'https://derevo18.com/',
  website: '',
};

describe('lead form submission', () => {
  it('posts only the expected JSON payload', async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 204 }));
    await submitLead(submission, { endpoint: 'https://forms.example.test/submit', fetcher });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher).toHaveBeenCalledWith('https://forms.example.test/submit', expect.objectContaining({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    }));
  });

  it('fails safely when the endpoint is not configured', async () => {
    await expect(submitLead(submission, { endpoint: '' }))
      .rejects.toEqual(expect.objectContaining({ code: 'not-configured' }));
  });
});

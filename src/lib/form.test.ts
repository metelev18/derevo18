import { describe, expect, it } from 'vitest';
import { formatPhone, isPhoneComplete } from './form';

describe('phone form helpers', () => {
  it('formats a Russian phone number', () => {
    expect(formatPhone('8 919 916 80 22')).toBe('+7 (919) 916-80-22');
  });

  it('limits input to ten national digits', () => {
    expect(formatPhone('+7 919 916 80 22123')).toBe('+7 (919) 916-80-22');
  });

  it('recognizes only a complete number', () => {
    expect(isPhoneComplete('+7 (919) 916-80-22')).toBe(true);
    expect(isPhoneComplete('+7 (919) 91')).toBe(false);
  });
});

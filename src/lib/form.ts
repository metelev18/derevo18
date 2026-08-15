export const DEMO_MESSAGE = 'Демо-режим: данные не отправлены';

export function formatPhone(value: string): string {
  const digits = value.replace(/\D/g, '').replace(/^[78]/, '').slice(0, 10);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10),
  ];
  let result = '+7';
  if (parts[0]) result += ` (${parts[0]}`;
  if (parts[0]?.length === 3) result += ')';
  if (parts[1]) result += ` ${parts[1]}`;
  if (parts[2]) result += `-${parts[2]}`;
  if (parts[3]) result += `-${parts[3]}`;
  return result;
}

export function isPhoneComplete(value: string): boolean {
  return value.replace(/\D/g, '').length === 11;
}

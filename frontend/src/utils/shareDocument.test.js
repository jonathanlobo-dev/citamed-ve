import { describe, test, expect, vi, beforeAll } from 'vitest';

let normalizePhone58;
beforeAll(async () => {
  vi.stubGlobal('window', { location: { origin: 'https://app.citamedve.app' } });
  ({ normalizePhone58 } = await import('./shareDocument.js'));
});

describe('normalizePhone58 (enlace de WhatsApp)', () => {
  test.each([
    ['+58 412-1234567', '584121234567'],
    ['+584121234567', '584121234567'],
    ['584121234567', '584121234567'],
    ['0412-1234567', '584121234567'],
    ['04121234567', '584121234567'],
    ['4121234567', '584121234567'],
    ['(0414) 123 45 67', '584141234567'],
    ['0212-5551234', '582125551234'],
    [4121234567, '584121234567']
  ])('%p => %p', (input, expected) => {
    expect(normalizePhone58(input)).toBe(expected);
  });
  test.each([[''], [null], [undefined]])('%p => vacío', (v) => {
    expect(normalizePhone58(v)).toBe('');
  });
});

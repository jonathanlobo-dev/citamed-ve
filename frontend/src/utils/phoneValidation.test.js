import { describe, test, expect } from 'vitest';
import { phoneError } from './phoneValidation';

describe('Teléfono venezolano', () => {
  test('acepta celulares de 11 dígitos, incluido 0422', () => {
    for (const p of ['04141234567', '04221234567', '0424-1234567']) expect(phoneError(p)).toBeNull();
  });
  test('dice cuántos números faltan', () => {
    expect(phoneError('0424598074')).toMatch(/falta 1 número/);
    expect(phoneError('042459')).toMatch(/faltan 5 números/);
  });
  test('avisa si sobran números', () => {
    expect(phoneError('042459807411')).toMatch(/Sobran/);
  });
  test('avisa si el código no es de celular', () => {
    expect(phoneError('02121234567')).toMatch(/Debe empezar/);
    expect(phoneError('02121234567', { allowLandline: true })).toBeNull();
  });
  test('vacío', () => {
    expect(phoneError('')).toBe('Escribe tu teléfono');
  });
});

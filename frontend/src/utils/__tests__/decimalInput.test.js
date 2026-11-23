import { describe, it, expect } from 'vitest';
import { toDecimalInput } from '../decimalInput';

describe('decimales en signos vitales', () => {
  it('acepta coma o punto y guarda punto', () => {
    expect(toDecimalInput('36,5')).toBe('36.5');
    expect(toDecimalInput('70.5')).toBe('70.5');
  });
  it('ignora letras y un segundo separador', () => {
    expect(toDecimalInput('7a0,5,2')).toBe('70.52');
    expect(toDecimalInput('')).toBe('');
  });
});

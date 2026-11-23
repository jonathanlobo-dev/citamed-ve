import { describe, it, expect } from 'vitest';
import { typesToValue, valueToTypes } from '../../../utils/consultationTypes';

describe('tipo de consulta con varias opciones', () => {
  it('uno solo se guarda tal cual y varios se guardan como mixto', () => {
    expect(typesToValue(['telemedicina'])).toBe('telemedicina');
    expect(typesToValue(['presencial', 'domicilio'])).toBe('mixto');
  });
  it('al cargar, mixto marca todas las opciones', () => {
    expect(valueToTypes('mixto')).toEqual(['presencial', 'telemedicina', 'domicilio']);
    expect(valueToTypes('presencial')).toEqual(['presencial']);
  });
});

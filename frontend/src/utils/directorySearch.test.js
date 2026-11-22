import { describe, it, expect } from 'vitest';
import { normalizeText, lowestPrice } from './directorySearch';

describe('normalizeText', () => {
  it('ignora acentos, mayúsculas y espacios exteriores', () => {
    expect(normalizeText('MARÍA')).toBe('maria');
    expect(normalizeText('  María  ')).toBe('maria');
    expect(normalizeText('Cardiología')).toBe(normalizeText('cardiologia'));
  });
  it('tolera valores vacíos', () => {
    expect(normalizeText(null)).toBe('');
    expect(normalizeText(undefined)).toBe('');
  });
});

describe('lowestPrice', () => {
  it('usa la modalidad más barata', () => {
    expect(lowestPrice({ consultation_price_in_person: '40', consultation_price_online: '20' })).toBe(20);
  });
  it('ignora modalidades sin precio', () => {
    expect(lowestPrice({ consultation_price_in_person: '40', consultation_price_online: null })).toBe(40);
    expect(lowestPrice({})).toBe(0);
  });
});

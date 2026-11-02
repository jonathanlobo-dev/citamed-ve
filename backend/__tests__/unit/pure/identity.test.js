const { normalizeCedula, normalizePhoneVE, formatCedula } = require('../../../src/utils/identity');

describe('normalizeCedula', () => {
  test.each([
    ['V', '20111222', 'V-20111222'],
    ['v', '20111222', 'V-20111222'],
    ['E', '81234567', 'E-81234567'],
    ['V', '20.111.222', 'V-20111222'],
    ['V', 20111222, 'V-20111222'],
    ['V', '123456', 'V-123456'],
    ['V', '123456789', 'V-123456789'],
    [' V ', ' 20111222 ', 'V-20111222']
  ])('%s + %s => %s', (type, number, expected) => {
    expect(normalizeCedula(type, number)).toBe(expected);
  });

  test.each([['J'], ['X'], [''], [null], [undefined]])('rechaza el tipo %p', (type) => {
    expect(() => normalizeCedula(type, '20111222')).toThrow(/Tipo de documento/);
  });

  test.each([['12345'], ['1234567890'], [''], [null], ['abc']])('rechaza el número %p', (n) => {
    expect(() => normalizeCedula('V', n)).toThrow(/Cédula inválida/);
  });

  test('el error trae statusCode 400', () => {
    try { normalizeCedula('Z', '1'); } catch (e) { expect(e.statusCode).toBe(400); }
  });
});

describe('normalizePhoneVE', () => {
  test.each([
    ['04141234567', '+584141234567'],
    ['0414-123-4567', '+584141234567'],
    ['(0414) 123 4567', '+584141234567'],
    ['+584141234567', '+584141234567'],
    ['584141234567', '+584141234567'],
    ['4141234567', '+584141234567'],
    ['0424.123.4567', '+584241234567'],
    ['02121234567', '+582121234567']
  ])('%s => %s', (input, expected) => {
    expect(normalizePhoneVE(input)).toBe(expected);
  });

  test.each([[''], [null], [undefined]])('rechaza vacío %p', (p) => {
    expect(() => normalizePhoneVE(p)).toThrow(/Teléfono no válido/);
  });

  test.each([['+14155552671'], ['+34612345678']])('rechaza otro país %s', (p) => {
    expect(() => normalizePhoneVE(p)).toThrow(/venezolano/);
  });

  test.each([['0414123'], ['041412345678901'], ['abcdefghij']])('rechaza longitud o formato %s', (p) => {
    expect(() => normalizePhoneVE(p)).toThrow(/Teléfono no válido/);
  });
});

describe('formatCedula', () => {
  test.each([
    ['V-18222333', 'V-18222333'],
    ['V18222333', 'V-18222333'],
    ['v-18.222.333', 'V-18222333'],
    ['E-81234567', 'E-81234567'],
    ['J-12345678', 'J-12345678'],
    ['18222333', 'V-18222333'],
    ['18.222.333', 'V-18222333'],
    ['  V-1 ', 'V-1'],
    ['PASAPORTE123', 'PASAPORTE123']
  ])('%s => %s', (input, expected) => {
    expect(formatCedula(input)).toBe(expected);
  });

  test.each([[null], [undefined], ['']])('devuelve null con %p', (v) => {
    expect(formatCedula(v)).toBeNull();
  });
});

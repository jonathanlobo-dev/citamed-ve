import { describe, test, expect } from 'vitest';
import { ADULT_VITAL_RANGES, isVitalAbnormal, calculateBMI } from './vitalRanges';

describe('isVitalAbnormal', () => {
  describe.each(Object.entries(ADULT_VITAL_RANGES))('%s', (key, range) => {
    test('los límites del rango son normales', () => {
      expect(isVitalAbnormal(key, range.min)).toBe(false);
      expect(isVitalAbnormal(key, range.max)).toBe(false);
    });
    test('justo fuera del rango es anormal', () => {
      expect(isVitalAbnormal(key, range.min - 0.1)).toBe(true);
      expect(isVitalAbnormal(key, range.max + 0.1)).toBe(true);
    });
    test('acepta el valor como texto', () => {
      expect(isVitalAbnormal(key, String(range.max + 1))).toBe(true);
      expect(isVitalAbnormal(key, String(range.min))).toBe(false);
    });
  });

  test.each([[''], [null], [undefined], ['abc']])('valor vacío o inválido (%p) no se marca', (v) => {
    expect(isVitalAbnormal('heartRate', v)).toBe(false);
  });
  test('una clave desconocida no se marca (el servidor la descartaría)', () => {
    expect(isVitalAbnormal('pulse', 300)).toBe(false);
  });
  test('en menores de 18 no se resalta (los rangos son de adultos)', () => {
    expect(isVitalAbnormal('heartRate', 140, 8)).toBe(false);
    expect(isVitalAbnormal('heartRate', 140, 17)).toBe(false);
  });
  test('desde los 18 sí, y sin edad también', () => {
    expect(isVitalAbnormal('heartRate', 140, 18)).toBe(true);
    expect(isVitalAbnormal('heartRate', 140)).toBe(true);
    expect(isVitalAbnormal('heartRate', 140, null)).toBe(true);
  });
  test('casos clínicos típicos', () => {
    expect(isVitalAbnormal('systolic', 150)).toBe(true);
    expect(isVitalAbnormal('oxygenSaturation', 92)).toBe(true);
    expect(isVitalAbnormal('temperature', 38.5)).toBe(true);
    expect(isVitalAbnormal('glucose', 100)).toBe(false);
  });
});

describe('calculateBMI', () => {
  test.each([
    [70, 175, 22.9, 'Peso normal'],
    [73.6, 200, 18.4, 'Bajo peso'],
    [74, 200, 18.5, 'Peso normal'],
    [99.6, 200, 24.9, 'Peso normal'],
    [100, 200, 25, 'Sobrepeso'],
    [120, 200, 30, 'Obesidad grado I'],
    [140, 200, 35, 'Obesidad grado II'],
    [160, 200, 40, 'Obesidad grado III']
  ])('%d kg y %d cm => IMC %d (%s)', (w, h, bmi, category) => {
    const r = calculateBMI(w, h);
    expect(r.bmi).toBe(bmi);
    expect(r.category).toBe(category);
    expect(r.color.length).toBeGreaterThan(0);
  });
  test('acepta texto', () => {
    expect(calculateBMI('70', '175').bmi).toBe(22.9);
  });
  test.each([[0, 170], [70, 0], ['', ''], [null, 170], [-5, 170], [70, -170], ['abc', 170]])('datos inválidos (%p, %p) no dan IMC', (w, h) => {
    expect(calculateBMI(w, h)).toEqual({ bmi: null, category: '', color: '' });
  });
});

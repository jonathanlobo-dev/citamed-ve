import { describe, test, expect } from 'vitest';
import {
  currentMonthCaracas, todayCaracas, shiftMonth, monthLabel, formatUsd, formatVes,
  periodParams, isRangeReady, expenseCategoryLabel, consultationTypeLabel
} from './financeLabels';

describe('fechas de Caracas', () => {
  test('la medianoche UTC del 1 de diciembre sigue siendo noviembre en Caracas', () => {
    const d = new Date('2026-12-01T01:00:00Z');
    expect(currentMonthCaracas(d)).toBe('2026-11');
    expect(todayCaracas(d)).toBe('2026-11-30');
  });
  test('a las 04:00 UTC ya es el día nuevo', () => {
    expect(todayCaracas(new Date('2026-12-01T04:00:00Z'))).toBe('2026-12-01');
  });
});

describe('meses', () => {
  test('retroceder y avanzar cruza el año', () => {
    expect(shiftMonth('2026-01', -1)).toBe('2025-12');
    expect(shiftMonth('2026-12', 1)).toBe('2027-01');
    expect(shiftMonth('2026-11', 0)).toBe('2026-11');
    expect(shiftMonth('2026-03', -14)).toBe('2025-01');
  });
  test('nombre del mes en español', () => {
    expect(monthLabel('2026-11')).toBe('noviembre de 2026');
    expect(monthLabel('2027-01')).toBe('enero de 2027');
  });
});

describe('montos y etiquetas', () => {
  test('formato de bolívares y monto vacío', () => {
    expect(formatVes(null)).toBe('');
    expect(formatVes(36.5)).toContain('36,50');
    expect(formatUsd(1234.5)).toMatch(/^\$.*,50$/);
  });
  test('etiquetas conocidas y desconocidas', () => {
    expect(expenseCategoryLabel('alquiler')).toBe('Alquiler del consultorio');
    expect(expenseCategoryLabel('algo_nuevo')).toBe('algo_nuevo');
    expect(consultationTypeLabel('follow_up')).toBe('Seguimiento');
  });
});

describe('período', () => {
  test('según el modo se manda el mes o el rango', () => {
    expect(periodParams({ mode: 'month', month: '2026-11', from: 'x', to: 'y' })).toEqual({ month: '2026-11' });
    expect(periodParams({ mode: 'range', month: '2026-11', from: '2026-11-01', to: '2026-11-15' })).toEqual({ from: '2026-11-01', to: '2026-11-15' });
  });
  test('un rango listo tiene las dos fechas en orden', () => {
    expect(isRangeReady('2026-11-01', '2026-11-15')).toBe(true);
    expect(isRangeReady('2026-11-15', '2026-11-01')).toBe(false);
    expect(isRangeReady('', '2026-11-01')).toBe(false);
  });
});

const f = require('../../../src/utils/financeReport');

describe('período del reporte', () => {
  test('un mes se convierte en su primer y último día', () => {
    expect(f.resolvePeriod({ month: '2026-11' })).toEqual({ from: '2026-11-01', to: '2026-11-30' });
    expect(f.resolvePeriod({ month: '2026-12' })).toEqual({ from: '2026-12-01', to: '2026-12-31' });
  });
  test('febrero respeta los años bisiestos', () => {
    expect(f.resolvePeriod({ month: '2028-02' }).to).toBe('2028-02-29');
    expect(f.resolvePeriod({ month: '2027-02' }).to).toBe('2027-02-28');
  });
  test('un rango válido pasa tal cual', () => {
    expect(f.resolvePeriod({ from: '2026-10-15', to: '2026-11-05' })).toEqual({ from: '2026-10-15', to: '2026-11-05' });
  });
  test.each([
    [{ month: '2026-13' }],
    [{ month: '26-11' }],
    [{ from: '2026-11-10', to: '2026-11-01' }],
    [{ from: '2026-02-30', to: '2026-03-01' }],
    [{ from: '2025-01-01', to: '2026-11-01' }],
    [{}]
  ])('rechaza %p', (q) => {
    expect(() => f.resolvePeriod(q)).toThrow();
    try { f.resolvePeriod(q); } catch (e) { expect(e.statusCode).toBe(400); }
  });
  test('los límites son el día completo en hora de Caracas', () => {
    const { start, end } = f.caracasBounds({ from: '2026-11-01', to: '2026-11-30' });
    expect(start.toISOString()).toBe('2026-11-01T04:00:00.000Z');
    expect(end.toISOString()).toBe('2026-12-01T03:59:59.999Z');
  });
});

describe('egresos', () => {
  const base = { description: 'Alquiler del consultorio', category: 'alquiler', amount: 300, currency: 'USD', method: 'zelle', expenseDate: '2026-11-05' };

  test('un egreso correcto se limpia y se acepta', () => {
    const out = f.validateExpenseInput({ ...base, description: '  Alquiler   del  consultorio ', notes: '  ' }, { today: '2026-11-20' });
    expect(out).toMatchObject({ description: 'Alquiler del consultorio', category: 'alquiler', currency: 'USD', amount: 300, notes: null });
  });
  test.each([
    [{ description: 'ab' }],
    [{ category: 'viajes' }],
    [{ amount: 0 }],
    [{ amount: -5 }],
    [{ amount: 'mucho' }],
    [{ amount: 10.123 }],
    [{ currency: 'EUR' }],
    [{ method: 'bitcoin' }],
    [{ expenseDate: '2026-02-31' }],
    [{ expenseDate: '2026-12-01' }]
  ])('rechaza %p', (over) => {
    expect(() => f.validateExpenseInput({ ...base, ...over }, { today: '2026-11-20' })).toThrow();
  });
  test('moneda y método tienen valor por defecto', () => {
    const { currency, method } = f.validateExpenseInput({ ...base, currency: undefined, method: undefined });
    expect(currency).toBe('USD');
    expect(method).toBe('efectivo');
  });
  test('en dólares el monto no cambia; en bolívares se divide entre la tasa', () => {
    expect(f.expenseAmountUsd(45.5, 'USD', null)).toBe(45.5);
    expect(f.expenseAmountUsd(3650, 'VES', 36.5)).toBe(100);
    expect(f.expenseAmountUsd(100, 'VES', 33)).toBe(3.03);
  });
  test('un egreso en bolívares sin tasa falla con 503', () => {
    try { f.expenseAmountUsd(100, 'VES', null); throw new Error('no falló'); } catch (e) { expect(e.statusCode).toBe(503); }
  });
});

describe('reporte', () => {
  const payments = [
    { amountUsd: 40, method: 'efectivo_usd' },
    { amountUsd: 60.5, method: 'pago_movil' },
    { amountUsd: 20, method: 'efectivo_usd' }
  ];
  const expenses = [
    { amountUsd: 30, category: 'alquiler' },
    { amountUsd: 10, category: 'insumos' },
    { amountUsd: 10, category: 'alquiler' }
  ];

  test('ingresos, egresos y utilidad con su equivalente en Bs', () => {
    const r = f.buildReport({ payments, expenses, rate: 40 });
    expect(r.income.totalUsd).toBe(120.5);
    expect(r.income.totalVes).toBe(4820);
    expect(r.expenses.totalUsd).toBe(50);
    expect(r.profit.totalUsd).toBe(70.5);
    expect(r.profit.totalVes).toBe(2820);
    expect(r.profit.marginPercent).toBe(58.5);
  });
  test('ingresos por método, mayor primero', () => {
    const r = f.buildReport({ payments });
    expect(r.income.byMethod).toEqual([
      { method: 'pago_movil', totalUsd: 60.5, count: 1 },
      { method: 'efectivo_usd', totalUsd: 60, count: 2 }
    ]);
  });
  test('egresos por categoría con su porcentaje', () => {
    const r = f.buildReport({ expenses });
    expect(r.expenses.byCategory).toEqual([
      { category: 'alquiler', totalUsd: 40, count: 2, percent: 80 },
      { category: 'insumos', totalUsd: 10, count: 1, percent: 20 }
    ]);
  });
  test('la utilidad puede ser negativa', () => {
    const r = f.buildReport({ payments: [{ amountUsd: 20, method: 'zelle' }], expenses });
    expect(r.profit.totalUsd).toBe(-30);
    expect(r.profit.marginPercent).toBe(-150);
  });
  test('por cobrar y por validar no cuentan como ingreso', () => {
    const r = f.buildReport({
      payments,
      receivable: [{ consultationFee: 25 }, { consultationFee: '30.50' }],
      pendingPayments: [{ amountUsd: 15 }],
      rate: 36
    });
    expect(r.income.totalUsd).toBe(120.5);
    expect(r.receivable).toMatchObject({ totalUsd: 55.5, count: 2, totalVes: 1998 });
    expect(r.pendingValidation).toMatchObject({ totalUsd: 15, count: 1 });
  });
  test('consultas atendidas por tipo', () => {
    const r = f.buildReport({
      attended: [{ appointmentType: 'follow_up' }, { appointmentType: 'first_consultation' }, { appointmentType: 'follow_up' }, {}]
    });
    expect(r.consultations).toEqual({
      total: 4,
      byType: [{ type: 'follow_up', count: 2 }, { type: 'first_consultation', count: 2 }]
    });
  });
  test('sin datos todo da cero y sin tasa no hay bolívares', () => {
    const r = f.buildReport();
    expect(r.income.totalUsd).toBe(0);
    expect(r.income.totalVes).toBeNull();
    expect(r.profit.marginPercent).toBeNull();
    expect(r.expenses.byCategory).toEqual([]);
  });
  test('evita errores de decimales al sumar', () => {
    const r = f.buildReport({ payments: [{ amountUsd: 0.1 }, { amountUsd: 0.2 }] });
    expect(r.income.totalUsd).toBe(0.3);
  });
});

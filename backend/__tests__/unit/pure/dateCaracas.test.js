const { todayCaracas, nowMinutesCaracas, nowTimeCaracas, getCaracasParts } = require('../../../src/utils/dateCaracas');

// Caracas es UTC-4 todo el año (sin horario de verano).
describe('hora de Caracas', () => {
  test('medianoche UTC sigue siendo el día anterior en Caracas', () => {
    expect(todayCaracas(new Date('2026-11-02T00:00:00Z'))).toBe('2026-11-01');
    expect(nowTimeCaracas(new Date('2026-11-02T00:00:00Z'))).toBe('20:00');
  });

  test('03:59 UTC aún es el día anterior; 04:00 UTC ya es el nuevo', () => {
    expect(todayCaracas(new Date('2026-11-02T03:59:00Z'))).toBe('2026-11-01');
    expect(todayCaracas(new Date('2026-11-02T04:00:00Z'))).toBe('2026-11-02');
  });

  test('minutos desde la medianoche', () => {
    expect(nowMinutesCaracas(new Date('2026-11-02T04:00:00Z'))).toBe(0);
    expect(nowMinutesCaracas(new Date('2026-11-02T16:30:00Z'))).toBe(12 * 60 + 30);
    expect(nowMinutesCaracas(new Date('2026-11-03T03:59:00Z'))).toBe(23 * 60 + 59);
  });

  test('formato HH:mm con ceros', () => {
    expect(nowTimeCaracas(new Date('2026-11-02T09:05:00Z'))).toBe('05:05');
  });

  test('acepta una cadena ISO', () => {
    expect(todayCaracas('2026-01-01T02:00:00Z')).toBe('2025-12-31');
  });

  test('cambio de año y de mes', () => {
    expect(todayCaracas(new Date('2026-03-01T01:00:00Z'))).toBe('2026-02-28');
    expect(todayCaracas(new Date('2024-03-01T01:00:00Z'))).toBe('2024-02-29');
  });

  test('getCaracasParts devuelve números en hora, minuto y segundo', () => {
    const p = getCaracasParts(new Date('2026-11-02T16:30:45Z'));
    expect(p).toMatchObject({ year: '2026', month: '11', day: '02', hour: 12, minute: 30, second: 45 });
  });
});

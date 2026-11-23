const { expiryHours, expiryCutoff } = require('../../../src/jobs/expirePendingAppointments');

describe('vencimiento de pre-citas (DEC-01)', () => {
  test('por defecto vencen a las 24 horas', () => {
    expect(expiryHours({})).toBe(24);
    expect(expiryHours({ PENDING_EXPIRY_HOURS: '' })).toBe(24);
  });
  test('se puede cambiar o apagar con PENDING_EXPIRY_HOURS', () => {
    expect(expiryHours({ PENDING_EXPIRY_HOURS: '48' })).toBe(48);
    expect(expiryHours({ PENDING_EXPIRY_HOURS: '0' })).toBe(0);
  });
  test('un valor inválido usa 24 horas', () => {
    expect(expiryHours({ PENDING_EXPIRY_HOURS: 'abc' })).toBe(24);
    expect(expiryHours({ PENDING_EXPIRY_HOURS: '-5' })).toBe(24);
  });
  test('el corte es exactamente N horas antes', () => {
    const now = new Date('2026-11-23T12:00:00Z');
    expect(expiryCutoff(now, 24).toISOString()).toBe('2026-11-22T12:00:00.000Z');
  });
});

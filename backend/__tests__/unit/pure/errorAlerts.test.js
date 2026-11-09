const {
  ErrorAlertService, isIgnoredPath, normalizePath, recipients, buildAlertEmail
} = require('../../../src/services/errorAlertService');
const { serverErrorAlerts } = require('../../../src/middleware/errorAlerts');

jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const env = (over = {}) => ({ ERROR_ALERT_EMAIL: 'soporte@citamedve.app', NODE_ENV: 'production', ...over });

function servicio({ send, options, e } = {}) {
  let t = 1_700_000_000_000;
  const svc = new ErrorAlertService({ send: send || jest.fn().mockResolvedValue({ success: true }), now: () => t, env: e || env(), options });
  svc.avanzar = (ms) => { t += ms; };
  return svc;
}

describe('ayudas', () => {
  test.each([
    ['/api/appointments/123/start', '/api/appointments/:id/start'],
    ['/api/appointments/123', '/api/appointments/:id'],
    ['/api/doctors/7/patients/88', '/api/doctors/:id/patients/:id'],
    ['/api/payments?x=1', '/api/payments'],
    ['/api/cita/9f86d081884c7d659a2feaa0c55ad015a3bf4f1b', '/api/cita/:token'],
    ['/api/auth/login', '/api/auth/login']
  ])('normalizePath %s', (p, e) => { expect(normalizePath(p)).toBe(e); });

  test.each([['/api/health'], ['/api/health/redis'], ['/api/db-test'], ['/api/metrics'], ['/']])('%s se ignora', (p) => {
    expect(isIgnoredPath(p)).toBe(true);
  });
  test('una ruta normal no se ignora', () => {
    expect(isIgnoredPath('/api/appointments')).toBe(false);
    expect(isIgnoredPath('/api/healthcheck-falso/otro')).toBe(false);
  });

  test('destinatarios: varios, con espacios y solo válidos', () => {
    expect(recipients({ ERROR_ALERT_EMAIL: ' a@b.com , c@d.org,malo, ' })).toEqual(['a@b.com', 'c@d.org']);
    expect(recipients({})).toEqual([]);
    expect(recipients({ ERROR_ALERT_EMAIL: '' })).toEqual([]);
  });

  test('el correo describe el error sin datos de pacientes y no inyecta HTML', () => {
    const m = buildAlertEmail({ signature: 's', status: 500, method: 'POST', path: '/api/x', message: '<script>alert(1)</script>', userId: 7, count: 3, environment: 'producción', at: 1_700_000_000_000 });
    expect(m.subject).toBe('[CitaMed producción] Error 500 en POST /api/x x3');
    expect(m.html).not.toContain('<script>');
    expect(m.html).toContain('se repitió 3 veces');
    expect(m.text).toContain('Usuario: 7');
    expect(m.text).toContain('Entorno: producción');
  });
});

describe('ErrorAlertService', () => {
  test('apagado sin ERROR_ALERT_EMAIL: no envía nada', async () => {
    const send = jest.fn();
    const svc = servicio({ send, e: { NODE_ENV: 'production' } });
    expect(svc.enabled()).toBe(false);
    expect(await svc.notify({ status: 500, method: 'GET', path: '/api/x' })).toBe('disabled');
    expect(send).not.toHaveBeenCalled();
  });

  test('el primer fallo avisa', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const svc = servicio({ send });
    expect(await svc.notify({ status: 500, method: 'POST', path: '/api/appointments/5/start', message: 'boom', userId: 2 })).toBe('sent');
    expect(send).toHaveBeenCalledWith(expect.objectContaining({ to: ['soporte@citamedve.app'], subject: expect.stringContaining('POST /api/appointments/:id/start') }));
  });

  test('el mismo error dentro de 15 minutos no vuelve a avisar, aunque cambie el número de la ruta', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const svc = servicio({ send });
    await svc.notify({ status: 500, method: 'POST', path: '/api/appointments/5/start' });
    svc.avanzar(60_000);
    expect(await svc.notify({ status: 500, method: 'POST', path: '/api/appointments/6/start' })).toBe('throttled');
    expect(send).toHaveBeenCalledTimes(1);
  });

  test('pasada la ventana avisa otra vez y resume las repeticiones', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const svc = servicio({ send });
    await svc.notify({ status: 500, method: 'GET', path: '/api/x' });
    for (let i = 0; i < 4; i += 1) { svc.avanzar(10_000); await svc.notify({ status: 500, method: 'GET', path: '/api/x' }); }
    svc.avanzar(16 * 60_000);
    expect(await svc.notify({ status: 500, method: 'GET', path: '/api/x' })).toBe('sent');
    expect(send).toHaveBeenCalledTimes(2);
    expect(send.mock.calls[1][0].subject).toContain('x5');
  });

  test('errores distintos avisan por separado', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const svc = servicio({ send });
    await svc.notify({ status: 500, method: 'GET', path: '/api/a' });
    await svc.notify({ status: 500, method: 'GET', path: '/api/b' });
    await svc.notify({ status: 503, method: 'GET', path: '/api/a' });
    expect(send).toHaveBeenCalledTimes(3);
  });

  test('tope por hora: una tormenta de errores distintos no llena la bandeja', async () => {
    const send = jest.fn().mockResolvedValue({ success: true });
    const svc = servicio({ send, options: { maxPerHour: 3 } });
    const r = [];
    for (let i = 0; i < 6; i += 1) r.push(await svc.notify({ status: 500, method: 'GET', path: `/api/ruta${i}` }));
    expect(r.filter((x) => x === 'sent')).toHaveLength(3);
    expect(r.filter((x) => x === 'capped')).toHaveLength(3);
    svc.avanzar(61 * 60_000);
    expect(await svc.notify({ status: 500, method: 'GET', path: '/api/ruta9' })).toBe('sent');
  });

  test('un fallo al enviar el aviso nunca lanza', async () => {
    const svc = servicio({ send: jest.fn().mockRejectedValue(new Error('correo caído')) });
    await expect(svc.notify({ status: 500, method: 'GET', path: '/api/x' })).resolves.toBe('sent');
  });

  test('la comprobación de salud no avisa', async () => {
    const send = jest.fn();
    expect(await servicio({ send }).notify({ status: 500, method: 'GET', path: '/api/health' })).toBe('ignored');
    expect(send).not.toHaveBeenCalled();
  });

  test('la memoria no crece sin límite', async () => {
    const svc = servicio({ options: { maxPerHour: 100000 } });
    for (let i = 0; i < 700; i += 1) await svc.notify({ status: 500, method: 'GET', path: `/api/r${i}` });
    expect(svc.seen.size).toBeLessThanOrEqual(501);
  });
});

describe('middleware serverErrorAlerts', () => {
  test('deja pasar la petición sin tocarla', () => {
    const next = jest.fn();
    const res = { on: jest.fn() };
    serverErrorAlerts({ method: 'GET', url: '/x' }, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
  });
  test('una respuesta 200 o 404 no genera ningún aviso', () => {
    let finish;
    const res = { on: (_e, fn) => { finish = fn; }, statusCode: 404 };
    serverErrorAlerts({ method: 'GET', url: '/x' }, res, () => {});
    expect(() => finish()).not.toThrow();
  });
});

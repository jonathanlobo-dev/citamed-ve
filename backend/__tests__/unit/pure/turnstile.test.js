const fs = require('fs');
const path = require('path');

jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const { createTurnstileMiddleware, verifyToken, enabled, VERIFY_URL } = require('../../../src/middleware/turnstile');

const ENV_ON = { TURNSTILE_SECRET_KEY: 'secreto-de-prueba' };

function ejecutar(mw, { headers = {}, ip = '1.2.3.4' } = {}) {
  const req = { headers, ip, originalUrl: '/api/auth/login' };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return mw(req, res, next).then(() => ({ req, res, next }));
}

const respuesta = (body, ok = true) => jest.fn().mockResolvedValue({ ok, json: async () => body });

describe('interruptor', () => {
  test.each([[{}, false], [{ TURNSTILE_SECRET_KEY: '' }, false], [{ TURNSTILE_SECRET_KEY: '   ' }, false], [ENV_ON, true]])('%j => %s', (env, esperado) => {
    expect(enabled(env)).toBe(esperado);
  });

  test('apagado: todo pasa sin tocar la red', async () => {
    const f = jest.fn();
    const { next, res } = await ejecutar(createTurnstileMiddleware({ fetchImpl: f, env: {} }));
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });
});

describe('encendido', () => {
  test('sin token se rechaza y no se pregunta a Cloudflare', async () => {
    const f = jest.fn();
    const { res, next } = await ejecutar(createTurnstileMiddleware({ fetchImpl: f, env: ENV_ON }));
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'CAPTCHA_FAILED' }));
    expect(next).not.toHaveBeenCalled();
    expect(f).not.toHaveBeenCalled();
  });

  test('un token absurdamente largo se rechaza sin preguntar', async () => {
    const f = jest.fn();
    const { res } = await ejecutar(createTurnstileMiddleware({ fetchImpl: f, env: ENV_ON }), { headers: { 'x-turnstile-token': 'a'.repeat(3000) } });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(f).not.toHaveBeenCalled();
  });

  test('token válido: pasa, y a Cloudflare se le manda el secreto, el token y la IP', async () => {
    const f = respuesta({ success: true });
    const { next, res } = await ejecutar(createTurnstileMiddleware({ fetchImpl: f, env: ENV_ON }), { headers: { 'x-turnstile-token': 'tok123', 'cf-connecting-ip': '9.9.9.9' } });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
    const [url, opts] = f.mock.calls[0];
    expect(url).toBe(VERIFY_URL);
    expect(opts.method).toBe('POST');
    expect(opts.body.get('secret')).toBe('secreto-de-prueba');
    expect(opts.body.get('response')).toBe('tok123');
    expect(opts.body.get('remoteip')).toBe('9.9.9.9');
  });

  test('token rechazado por Cloudflare: 403', async () => {
    const { res, next } = await ejecutar(createTurnstileMiddleware({ fetchImpl: respuesta({ success: false, 'error-codes': ['invalid-input-response'] }), env: ENV_ON }), { headers: { 'x-turnstile-token': 'malo' } });
    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([
    ['Cloudflare responde error 500', () => respuesta({}, false)],
    ['la red falla', () => jest.fn().mockRejectedValue(new Error('sin red'))],
    ['se agota el tiempo', () => jest.fn().mockRejectedValue(Object.assign(new Error('timeout'), { name: 'TimeoutError' }))]
  ])('si %s, se deja pasar (disponibilidad antes que bloqueo)', async (_n, make) => {
    const { next, res } = await ejecutar(createTurnstileMiddleware({ fetchImpl: make(), env: ENV_ON }), { headers: { 'x-turnstile-token': 'tok' } });
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  test('success distinto de true (por ejemplo "true" como texto) no cuenta como válido', async () => {
    const { res } = await ejecutar(createTurnstileMiddleware({ fetchImpl: respuesta({ success: 'true' }), env: ENV_ON }), { headers: { 'x-turnstile-token': 'tok' } });
    expect(res.status).toHaveBeenCalledWith(403);
  });
});

describe('verifyToken', () => {
  test.each([[{ success: true }, 'ok'], [{ success: false }, 'rejected'], [{}, 'rejected']])('%j => %s', async (body, esperado) => {
    expect(await verifyToken('t', undefined, { fetchImpl: respuesta(body), env: ENV_ON })).toBe(esperado);
  });
});

describe('las rutas correctas están protegidas', () => {
  const routes = path.join(__dirname, '../../../src/routes');
  const auth = fs.readFileSync(path.join(routes, 'auth.js'), 'utf8');

  test.each(['/login', '/register', '/register/patient', '/register/doctor', '/register/provider'])('POST %s exige la verificación antes que nada', (ruta) => {
    const i = auth.indexOf(`router.post("${ruta}",`);
    expect(i).toBeGreaterThan(-1);
    const siguiente = auth.slice(i + `router.post("${ruta}",`.length).trim().split('\n')[0].trim();
    expect(siguiente).toBe('requireTurnstile,');
  });

  test('recuperar la clave también', () => {
    const rec = fs.readFileSync(path.join(routes, 'passwordRecovery.js'), 'utf8');
    expect(rec).toMatch(/router\.post\('\/request',\s*requireTurnstile,/);
  });

  test('la cabecera nueva está permitida en CORS (si falta, el navegador bloquea el inicio de sesión)', () => {
    const cors = fs.readFileSync(path.join(__dirname, '../../../src/config/cors.config.js'), 'utf8');
    expect(cors).toContain("'X-Turnstile-Token'");
  });
});

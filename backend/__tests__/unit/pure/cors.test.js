// Quién puede hablar con la API desde un navegador. Un error aquí deja el sistema "muerto" para el usuario.

function load(env = {}) {
  jest.resetModules();
  const saved = {};
  for (const k of ['NODE_ENV', 'ALLOWED_ORIGINS']) saved[k] = process.env[k];
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  const mod = require('../../../src/config/cors.config');
  for (const [k, v] of Object.entries(saved)) {
    if (v === undefined) delete process.env[k]; else process.env[k] = v;
  }
  return mod;
}

const verify = (mod, origin) => new Promise((resolve) => {
  mod.corsOptions.origin(origin, (err, ok) => resolve(err ? 'bloqueado' : ok ? 'permitido' : 'bloqueado'));
});

let warn;
let log;
beforeEach(() => {
  warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  log = jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterEach(() => { warn.mockRestore(); log.mockRestore(); });

describe('producción (sin ALLOWED_ORIGINS: los dominios propios deben funcionar igual)', () => {
  let cors;
  beforeEach(() => { cors = load({ NODE_ENV: 'production', ALLOWED_ORIGINS: undefined }); });

  test.each([
    'https://citamedve.app',
    'https://app.citamedve.app',
    'https://citamed-ve.pages.dev',
    'https://dev.citamed-ve.pages.dev',
    'https://cualquier-rama.pages.dev'
  ])('permite %s', async (origin) => {
    expect(await verify(cors, origin)).toBe('permitido');
  });

  test.each([
    'https://sitio-malicioso.com',
    'https://citamedve.app.evil.com',
    'http://citamedve.app',
    'https://evilcitamedve.app',
    'http://localhost:5173'
  ])('bloquea %s', async (origin) => {
    expect(await verify(cors, origin)).toBe('bloqueado');
  });

  test('permite llamadas sin origen (curl, apps móviles, servidor a servidor)', async () => {
    expect(await verify(cors, undefined)).toBe('permitido');
  });
});

describe('ALLOWED_ORIGINS', () => {
  afterEach(() => { delete process.env.ALLOWED_ORIGINS; });

  test('suma orígenes extra sin quitar los fijos', () => {
    const cors = load({ NODE_ENV: 'production', ALLOWED_ORIGINS: undefined });
    process.env.ALLOWED_ORIGINS = ' https://extra.com , https://otro.com ';
    const list = cors.getAllowedOrigins();
    expect(list).toEqual(expect.arrayContaining(['https://extra.com', 'https://otro.com', 'https://app.citamedve.app']));
  });
  test('no repite orígenes', () => {
    const cors = load({ NODE_ENV: 'production', ALLOWED_ORIGINS: undefined });
    process.env.ALLOWED_ORIGINS = 'https://app.citamedve.app';
    const list = cors.getAllowedOrigins();
    expect(list.filter((o) => o === 'https://app.citamedve.app')).toHaveLength(1);
  });
});

describe('desarrollo', () => {
  test('permite localhost en cualquier puerto', async () => {
    const cors = load({ NODE_ENV: 'development', ALLOWED_ORIGINS: undefined });
    expect(await verify(cors, 'http://localhost:5174')).toBe('permitido');
    expect(await verify(cors, 'http://127.0.0.1:4000')).toBe('permitido');
  });
});

describe('configuración general', () => {
  const cors = load({ NODE_ENV: 'production', ALLOWED_ORIGINS: undefined });
  test('la cabecera de la asistente está permitida (si falta, la asistente no puede trabajar)', () => {
    expect(cors.corsOptions.allowedHeaders).toContain('X-Acting-Doctor');
    expect(cors.corsOptions.allowedHeaders).toEqual(expect.arrayContaining(['Authorization', 'Content-Type']));
  });
  test('permite credenciales y los métodos que usa la app', () => {
    expect(cors.corsOptions.credentials).toBe(true);
    expect(cors.corsOptions.methods).toEqual(expect.arrayContaining(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']));
  });
  test('la política estricta exige origen y rechaza desconocidos', () => {
    const strict = cors.strictCorsOptions.origin;
    const run = (o) => new Promise((resolve) => strict(o, (err, ok) => resolve(err ? 'bloqueado' : ok ? 'permitido' : 'bloqueado')));
    return Promise.all([run(undefined), run('https://evil.com'), run('https://app.citamedve.app')]).then(([a, b, c]) => {
      expect(a).toBe('bloqueado');
      expect(b).toBe('bloqueado');
      expect(c).toBe('permitido');
    });
  });
});

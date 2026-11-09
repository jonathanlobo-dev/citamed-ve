import { describe, test, expect, vi, afterEach } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const ROOT = join(SRC, '../..');

async function load(siteKey) {
  vi.resetModules();
  vi.unstubAllEnvs();
  if (siteKey !== undefined) vi.stubEnv('VITE_TURNSTILE_SITE_KEY', siteKey);
  vi.stubGlobal('window', { dispatchEvent: vi.fn() });
  vi.stubGlobal('Event', class { constructor(type) { this.type = type; } });
  return import('./turnstile.js');
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

describe('rutas protegidas', () => {
  test.each([
    'http://localhost:5000/api/auth/login',
    'https://api.citamedve.app/api/auth/login',
    '/auth/login',
    '/auth/register',
    '/auth/register/patient',
    '/auth/register/doctor',
    '/auth/register/provider',
    '/password-recovery/request',
    '/password/request',
    '/auth/login?x=1'
  ])('%s se protege', async (url) => {
    const t = await load('clave');
    expect(t.isProtectedUrl(url)).toBe(true);
  });

  test.each([
    '/auth/login/2fa', '/auth/profile', '/auth/logout', '/appointments', '/password-recovery/reset',
    '/password-recovery/verify-code', '/auth/register/otro', '/account/password', '/auth/check-email', ''
  ])('%s no se protege', async (url) => {
    const t = await load('clave');
    expect(t.isProtectedUrl(url)).toBe(false);
  });

  test('las mismas rutas que protege el servidor están protegidas aquí (paridad)', async () => {
    const t = await load('clave');
    const auth = readFileSync(join(ROOT, 'backend/src/routes/auth.js'), 'utf8');
    const rutas = [...auth.matchAll(/router\.post\("([^"]+)",\s*requireTurnstile/g)].map((m) => `/auth${m[1]}`);
    expect(rutas.length).toBe(5);
    rutas.forEach((r) => expect(t.isProtectedUrl(r)).toBe(true));
    const rec = readFileSync(join(ROOT, 'backend/src/routes/passwordRecovery.js'), 'utf8');
    expect(rec).toMatch(/router\.post\('\/request',\s*requireTurnstile/);
    expect(t.isProtectedUrl('/password-recovery/request')).toBe(true);
  });
});

describe('apagado (sin llave en el build)', () => {
  test('no hace nada', async () => {
    const t = await load(undefined);
    expect(t.turnstileEnabled()).toBe(false);
    t.setTurnstileToken('abc');
    const cfg = t.withTurnstileHeader({ url: '/auth/login', headers: {} });
    expect(cfg.headers['X-Turnstile-Token']).toBeUndefined();
    t.afterProtectedRequest({ url: '/auth/login' });
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });
});

describe('encendido', () => {
  test('agrega la cabecera solo a las rutas protegidas y con token', async () => {
    const t = await load('1x00000000000000000000AA');
    expect(t.turnstileEnabled()).toBe(true);

    expect(t.withTurnstileHeader({ url: '/auth/login', headers: {} }).headers['X-Turnstile-Token']).toBeUndefined(); // sin token aún
    t.setTurnstileToken('token-123');
    expect(t.withTurnstileHeader({ url: '/auth/login', headers: {} }).headers['X-Turnstile-Token']).toBe('token-123');
    expect(t.withTurnstileHeader({ url: '/appointments', headers: {} }).headers['X-Turnstile-Token']).toBeUndefined();
  });

  test('crea los encabezados si no existen', async () => {
    const t = await load('k');
    t.setTurnstileToken('x');
    expect(t.withTurnstileHeader({ url: '/auth/register' }).headers['X-Turnstile-Token']).toBe('x');
  });

  test('después de una petición protegida el token se descarta (es de un solo uso) y se pide otro desafío', async () => {
    const t = await load('k');
    t.setTurnstileToken('x');
    t.afterProtectedRequest({ url: '/auth/login' });
    expect(t.getTurnstileToken()).toBe('');
    expect(window.dispatchEvent).toHaveBeenCalledTimes(1);
    expect(window.dispatchEvent.mock.calls[0][0].type).toBe(t.RESET_EVENT);
  });

  test('una petición cualquiera no gasta el token', async () => {
    const t = await load('k');
    t.setTurnstileToken('x');
    t.afterProtectedRequest({ url: '/appointments' });
    expect(t.getTurnstileToken()).toBe('x');
    expect(window.dispatchEvent).not.toHaveBeenCalled();
  });

  test('tolera peticiones sin configuración', async () => {
    const t = await load('k');
    expect(() => t.afterProtectedRequest(undefined)).not.toThrow();
    expect(() => t.withTurnstileHeader(undefined)).not.toThrow();
  });
});

describe('conexión en las pantallas', () => {
  const leer = (f) => readFileSync(join(SRC, f), 'utf8');

  test.each([
    'pages/LoginPage.jsx',
    'pages/auth/ForgotPasswordPage.jsx',
    'components/auth/DoctorWizard/DoctorStep6Confirmation.jsx',
    'components/auth/PatientWizard/PatientStep4Confirmation.jsx',
    'components/auth/ProviderWizard/ProviderStep5Confirmation.jsx'
  ])('%s muestra el desafío', (f) => {
    const t = leer(f);
    expect(t).toContain('<TurnstileWidget />');
    expect(t).toMatch(/import TurnstileWidget from/);
  });

  test('las dos vías de peticiones (axios con instancia y axios global) mandan la cabecera y descartan el token', () => {
    for (const f of ['services/api.js', 'context/AuthContext.jsx']) {
      const t = leer(f);
      expect(t).toContain('withTurnstileHeader(config)');
      expect(t).toContain('afterProtectedRequest(response.config)');
      expect(t).toContain('afterProtectedRequest(error.config)');
    }
  });
});

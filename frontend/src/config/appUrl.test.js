import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';

// Simula estar abierto en una dirección y con ciertas variables de build
async function load({ href, env = {} }) {
  vi.resetModules();
  vi.unstubAllEnvs();
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  const url = new URL(href);
  const location = { origin: url.origin, href };
  vi.stubGlobal('window', { location });
  const mod = await import('./appUrl.js');
  return { mod, location };
}

const APP = { VITE_APP_URL: 'https://app.citamedve.app' };

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('sin VITE_APP_URL (local y pruebas)', () => {
  test('todo se queda en el mismo sitio', async () => {
    const { mod } = await load({ href: 'http://localhost:5173/login' });
    const navigate = vi.fn();
    expect(mod.isAppHost()).toBe(false);
    expect(mod.homeUrl()).toBe('/');
    mod.goToHome(navigate);
    expect(navigate).toHaveBeenCalledWith('/');
    mod.goToApp(navigate, '/login');
    expect(navigate).toHaveBeenCalledWith('/login');
  });
});

describe('desde el sistema (app.citamedve.app)', () => {
  let ctx;
  beforeEach(async () => { ctx = await load({ href: 'https://app.citamedve.app/login', env: APP }); });

  test('se reconoce como el sistema', () => {
    expect(ctx.mod.isAppHost()).toBe(true);
  });
  test('la presentación se deduce quitando "app."', () => {
    expect(ctx.mod.landingOrigin()).toBe('https://citamedve.app');
    expect(ctx.mod.homeUrl()).toBe('https://citamedve.app/');
  });
  test('"Volver al inicio" sale a la presentación y NO navega dentro del sistema (ahí "/" solo lleva al login)', () => {
    const navigate = vi.fn();
    ctx.mod.goToHome(navigate);
    expect(ctx.location.href).toBe('https://citamedve.app/');
    expect(navigate).not.toHaveBeenCalled();
  });
  test('goToApp se queda dentro del sistema', () => {
    const navigate = vi.fn();
    ctx.mod.goToApp(navigate, '/registro');
    expect(navigate).toHaveBeenCalledWith('/registro');
  });
});

describe('desde la presentación (citamedve.app)', () => {
  let ctx;
  beforeEach(async () => { ctx = await load({ href: 'https://citamedve.app/', env: APP }); });

  test('no es el sistema', () => {
    expect(ctx.mod.isAppHost()).toBe(false);
  });
  test('inicio se queda en la presentación', () => {
    const navigate = vi.fn();
    ctx.mod.goToHome(navigate);
    expect(navigate).toHaveBeenCalledWith('/');
    expect(ctx.mod.homeUrl()).toBe('/');
  });
  test.each(['/login', '/registro', '/registro?role=doctor'])('goToApp(%s) salta a app.citamedve.app', (path) => {
    const navigate = vi.fn();
    ctx.mod.goToApp(navigate, path);
    expect(ctx.location.href).toBe(`https://app.citamedve.app${path}`);
    expect(navigate).not.toHaveBeenCalled();
  });
});

describe('VITE_LANDING_URL explícita', () => {
  test('manda a esa dirección aunque el dominio no empiece con app.', async () => {
    const { mod, location } = await load({
      href: 'https://sistema.ejemplo.com/login',
      env: { VITE_APP_URL: 'https://sistema.ejemplo.com/', VITE_LANDING_URL: 'https://www.ejemplo.com/' }
    });
    mod.goToHome(vi.fn());
    expect(location.href).toBe('https://www.ejemplo.com/');
  });
  test('dominio sin "app." y sin VITE_LANDING_URL: no se inventa nada, usa "/"', async () => {
    const { mod } = await load({ href: 'https://sistema.ejemplo.com/login', env: { VITE_APP_URL: 'https://sistema.ejemplo.com' } });
    const navigate = vi.fn();
    expect(mod.landingOrigin()).toBe('');
    mod.goToHome(navigate);
    expect(navigate).toHaveBeenCalledWith('/');
  });
  test('una VITE_APP_URL mal escrita no rompe nada', async () => {
    const { mod } = await load({ href: 'http://localhost:5173/', env: { VITE_APP_URL: 'no-es-url' } });
    expect(mod.isAppHost()).toBe(false);
    expect(mod.landingOrigin()).toBe('');
  });
});

const {
  checkStagingTarget, isProductionUrl, hostOf, STAGING_PROJECT_REF, DEFAULT_STAGING_API
} = require('../../../scripts/lib/stagingGuard');
const { FLOWS } = require('../../../scripts/run-all-flows');
const fs = require('fs');
const path = require('path');

const stagingEnv = (over = {}) => ({ DB_USER: `postgres.${STAGING_PROJECT_REF}`, ...over });

describe('guarda de los recorridos completos (solo Pruebas)', () => {
  test('por defecto apunta al servidor de Pruebas y acepta la base de Pruebas', () => {
    expect(checkStagingTarget(stagingEnv())).toEqual({ ok: true, apiUrl: DEFAULT_STAGING_API });
  });

  test.each([
    'https://api.citamedve.app/api',
    'https://api.citamedve.app',
    'https://citamed-api.onrender.com/api',
    'https://app.citamedve.app',
    'https://citamedve.app',
    'https://citamed-ve.pages.dev',
    'HTTPS://API.CITAMEDVE.APP/api'
  ])('rechaza producción: %s', (url) => {
    const r = checkStagingTarget(stagingEnv({ API_URL: url }));
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/producción/);
  });

  test.each([
    'http://localhost:5000/api',
    'https://citamed-api-dev.onrender.com/api',
    'https://citamed-api-dev.onrender.com/api/'
  ])('acepta %s', (url) => {
    expect(checkStagingTarget(stagingEnv({ API_URL: url })).ok).toBe(true);
  });

  test('no confunde un servidor de Pruebas con producción por parecerse en el nombre', () => {
    expect(isProductionUrl('https://citamed-api-dev.onrender.com')).toBe(false);
    expect(isProductionUrl('https://api.citamedve.app.evil.com')).toBe(false);
  });

  test('rechaza una base de datos que no es la de Pruebas, aunque la API sea la de Pruebas', () => {
    const r = checkStagingTarget({ DB_USER: 'postgres.bkrazdkdnpqgqgjrmmyy' });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/base de Pruebas/);
  });

  test.each([[undefined], [''], ['postgres']])('sin base de Pruebas configurada (%p) no corre', (user) => {
    expect(checkStagingTarget({ DB_USER: user }).ok).toBe(false);
  });

  test('una dirección inválida no corre', () => {
    expect(checkStagingTarget(stagingEnv({ API_URL: 'esto no es una url' })).ok).toBe(false);
  });

  test('hostOf', () => {
    expect(hostOf('https://Api.CitaMedVe.app/x')).toBe('api.citamedve.app');
    expect(hostOf('nada')).toBe('');
  });
});

describe('recorridos incluidos', () => {
  test('son los seis del producto y cada archivo existe', () => {
    expect(FLOWS).toHaveLength(6);
    FLOWS.forEach(([name, file]) => {
      expect(name.length).toBeGreaterThan(3);
      expect(fs.existsSync(path.join(__dirname, '../../../scripts', file))).toBe(true);
    });
  });

  test('ninguno de los scripts incluidos apunta a producción por defecto', () => {
    FLOWS.forEach(([, file]) => {
      const text = fs.readFileSync(path.join(__dirname, '../../../scripts', file), 'utf8');
      expect(text).not.toMatch(/api\.citamedve\.app|citamed-api\.onrender\.com/);
    });
  });
});

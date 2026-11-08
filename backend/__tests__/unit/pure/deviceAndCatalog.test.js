const {
  parseUserAgent, generateDeviceFingerprint, isSameDevice, getDeviceIcon, formatLastActivity
} = require('../../../src/utils/deviceDetector');
const LAB_CATALOG = require('../../../src/utils/labCatalog');

const UA = {
  chromeWin: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  android: 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36'
};

describe('parseUserAgent', () => {
  test.each([[''], [null], [undefined]])('sin dato (%p) es desconocido', (ua) => {
    expect(parseUserAgent(ua)).toMatchObject({ deviceType: 'unknown', deviceName: 'Dispositivo desconocido', browser: null, os: null });
  });
  test('Chrome en Windows es escritorio', () => {
    const r = parseUserAgent(UA.chromeWin);
    expect(r).toMatchObject({ deviceType: 'desktop', browser: 'Chrome', os: 'Windows' });
    expect(r.deviceName).toMatch(/^Chrome 120 en Windows/);
  });
  test('iPhone es móvil', () => {
    expect(parseUserAgent(UA.iphone)).toMatchObject({ deviceType: 'mobile', os: 'iOS' });
  });
  test('iPad es tableta', () => {
    expect(parseUserAgent(UA.ipad).deviceType).toBe('tablet');
  });
  test('Android es móvil', () => {
    expect(parseUserAgent(UA.android)).toMatchObject({ deviceType: 'mobile', os: 'Android' });
  });
  test('un texto cualquiera no revienta', () => {
    expect(parseUserAgent('esto no es un user agent').deviceType).toBe('desktop');
  });
});

describe('huella e igualdad de dispositivo', () => {
  test('la huella es estable y de 32 caracteres', () => {
    const a = generateDeviceFingerprint(UA.chromeWin, '1.2.3.4');
    expect(a).toMatch(/^[0-9a-f]{32}$/);
    expect(generateDeviceFingerprint(UA.chromeWin, '1.2.3.4')).toBe(a);
  });
  test('cambia con la IP o con el navegador', () => {
    const a = generateDeviceFingerprint(UA.chromeWin, '1.2.3.4');
    expect(generateDeviceFingerprint(UA.chromeWin, '1.2.3.5')).not.toBe(a);
    expect(generateDeviceFingerprint(UA.iphone, '1.2.3.4')).not.toBe(a);
  });
  test('sin datos no falla', () => {
    expect(generateDeviceFingerprint()).toMatch(/^[0-9a-f]{32}$/);
  });
  test('mismo IP, navegador y sistema es el mismo dispositivo', () => {
    const d = { ipAddress: '1.1.1.1', browser: 'Chrome', os: 'Windows' };
    expect(isSameDevice(d, { ...d })).toBe(true);
  });
  test.each([
    [{ ipAddress: '1.1.1.1', browser: 'Chrome', os: 'Windows' }, { ipAddress: '2.2.2.2', browser: 'Chrome', os: 'Windows' }],
    [{ ipAddress: '1.1.1.1', browser: 'Chrome', os: 'Windows' }, { ipAddress: '1.1.1.1', browser: 'Firefox', os: 'Windows' }],
    [{ ipAddress: '1.1.1.1', browser: 'Chrome', os: 'Windows' }, { ipAddress: '1.1.1.1', browser: 'Chrome', os: 'macOS' }],
    [{ browser: 'Chrome', os: 'Windows' }, { browser: 'Chrome', os: 'Windows' }]
  ])('distintos o sin IP: %j', (a, b) => {
    expect(isSameDevice(a, b)).toBe(false);
  });
});

describe('getDeviceIcon', () => {
  test.each([['desktop', 'monitor'], ['mobile', 'smartphone'], ['tablet', 'tablet'], ['unknown', 'help-circle'], ['raro', 'help-circle'], [undefined, 'help-circle']])('%p => %s', (t, icon) => {
    expect(getDeviceIcon(t)).toBe(icon);
  });
});

describe('formatLastActivity', () => {
  beforeEach(() => { jest.useFakeTimers().setSystemTime(new Date('2026-11-08T15:00:00Z')); });
  afterEach(() => { jest.useRealTimers(); });
  const ago = (ms) => new Date(Date.now() - ms);

  test.each([[null], [undefined], ['']])('sin fecha (%p)', (v) => {
    expect(formatLastActivity(v)).toBe('Desconocido');
  });
  test.each([
    [20 * 1000, 'Ahora mismo'],
    [60 * 1000, 'Hace 1 minuto'],
    [5 * 60 * 1000, 'Hace 5 minutos'],
    [59 * 60 * 1000, 'Hace 59 minutos'],
    [60 * 60 * 1000, 'Hace 1 hora'],
    [3 * 60 * 60 * 1000, 'Hace 3 horas'],
    [24 * 60 * 60 * 1000, 'Hace 1 día'],
    [6 * 24 * 60 * 60 * 1000, 'Hace 6 días']
  ])('hace %i ms => %s', (ms, text) => {
    expect(formatLastActivity(ago(ms))).toBe(text);
  });
  test('después de una semana muestra la fecha', () => {
    expect(formatLastActivity(ago(10 * 24 * 60 * 60 * 1000))).toMatch(/2026/);
  });
});

describe('catálogo de exámenes', () => {
  test('tiene exámenes de laboratorio y de imágenes', () => {
    const cats = new Set(LAB_CATALOG.map((i) => i.category));
    expect(cats).toEqual(new Set(['Laboratorio', 'Imágenes y estudios']));
  });
  test('todos tienen nombre y categoría, y no se repiten', () => {
    LAB_CATALOG.forEach((i) => {
      expect(i.name.trim().length).toBeGreaterThan(2);
      expect(i.category.trim().length).toBeGreaterThan(2);
    });
    const names = LAB_CATALOG.map((i) => i.name.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });
  test('incluye los exámenes más pedidos', () => {
    const names = LAB_CATALOG.map((i) => i.name);
    expect(names).toEqual(expect.arrayContaining(['Hematología completa', 'Glicemia en ayunas', 'Electrocardiograma']));
  });
});

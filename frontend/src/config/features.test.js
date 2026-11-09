import { describe, test, expect, vi, afterEach } from 'vitest';

// Qué ve cada entorno. Si una función se libera a producción, se cambia aquí a propósito.
async function load(branch, env = {}) {
  vi.resetModules();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  if (branch) vi.stubGlobal('__BUILD_BRANCH__', branch);
  for (const [k, v] of Object.entries(env)) vi.stubEnv(k, v);
  return (await import('./features.js')).FEATURES;
}

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

const ALL = ['ai', 'superadmin', 'pwa', 'assistant', 'publicPage', 'waConfirm', 'aiPatientInstructions', 'excelImport'];

describe('producción (rama master)', () => {
  test.each(['master', 'main'])('%s: solo está encendido lo que ya se entregó', async (branch) => {
    const f = await load(branch);
    expect(f.ai).toBe(true);
    expect(f.superadmin).toBe(true);
    expect(f.pwa).toBe(false);
    expect(f.assistant).toBe(false);
    expect(f.publicPage).toBe(false);
    expect(f.waConfirm).toBe(false);
    expect(f.aiPatientInstructions).toBe(false);
    expect(f.excelImport).toBe(false);
  });
});

describe('pruebas y local muestran todo', () => {
  test.each([['dev'], ['local'], ['feature-x'], [undefined]])('rama %p', async (branch) => {
    const f = await load(branch);
    ALL.forEach((k) => expect(f[k]).toBe(true));
  });
});

describe('forzar con variables del build', () => {
  test('encender una función en producción', async () => {
    const f = await load('master', { VITE_FEATURE_ASSISTANT: 'true' });
    expect(f.assistant).toBe(true);
    expect(f.pwa).toBe(false);
  });
  test('apagar una función en pruebas', async () => {
    const f = await load('dev', { VITE_FEATURE_AI: 'false' });
    expect(f.ai).toBe(false);
    expect(f.superadmin).toBe(true);
  });
  test('un valor raro no cambia nada', async () => {
    const f = await load('master', { VITE_FEATURE_PWA: 'quizas' });
    expect(f.pwa).toBe(false);
  });
});

test('todas las funciones tienen interruptor', async () => {
  const f = await load('master');
  expect(Object.keys(f).sort()).toEqual([...ALL].sort());
});

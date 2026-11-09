import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Cloudflare Pages lee este archivo y agrega las cabeceras de seguridad a todo el sitio.
const archivo = join(dirname(fileURLToPath(import.meta.url)), '../../public/_headers');
const texto = readFileSync(archivo, 'utf8');

function bloque(ruta) {
  const lineas = texto.split(/\r?\n/);
  const i = lineas.findIndex((l) => l.trim() === ruta);
  if (i < 0) return {};
  const out = {};
  for (let j = i + 1; j < lineas.length && /^\s+\S/.test(lineas[j]); j += 1) {
    const [k, ...v] = lineas[j].trim().split(':');
    out[k.toLowerCase()] = v.join(':').trim();
  }
  return out;
}

describe('cabeceras de seguridad del sitio web', () => {
  const todas = bloque('/*');

  test('bloquea la incrustación en otros sitios', () => {
    expect(todas['x-frame-options']).toBe('SAMEORIGIN');
  });
  test('HSTS por al menos un año, con subdominios', () => {
    expect(todas['strict-transport-security']).toMatch(/max-age=(\d+)/);
    expect(Number(todas['strict-transport-security'].match(/max-age=(\d+)/)[1])).toBeGreaterThanOrEqual(31536000);
    expect(todas['strict-transport-security']).toContain('includeSubDomains');
  });
  test('nosniff y política de referencia', () => {
    expect(todas['x-content-type-options']).toBe('nosniff');
    expect(todas['referrer-policy']).toBe('strict-origin-when-cross-origin');
  });
  test('permisos del navegador: micrófono (dictado) y ubicación solo del propio sitio, sin cámara ni pagos', () => {
    const p = todas['permissions-policy'];
    expect(p).toContain('microphone=(self)');
    expect(p).toContain('geolocation=(self)');
    expect(p).toContain('camera=()');
    expect(p).toContain('payment=()');
  });
  test('el service worker nunca se queda en caché (si no, una versión vieja de la app se queda pegada)', () => {
    expect(bloque('/sw.js')['cache-control']).toBe('no-cache');
  });
  test('los archivos con huella en el nombre se guardan un año', () => {
    expect(bloque('/assets/*')['cache-control']).toContain('immutable');
  });
});

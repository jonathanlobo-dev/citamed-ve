// Cada dirección que el frontend le pide a la API debe tener dueño en el servidor.
// Nació de un fallo real: "¿Olvidaste tu contraseña?" llamaba a /api/password-recovery y el servidor
// solo tenía /api/password, así que la recuperación de clave devolvía 404 desde la pantalla.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../../../..');
const server = fs.readFileSync(path.join(ROOT, 'backend/src/server.js'), 'utf8');

const mounted = [...server.matchAll(/app\.use\(\s*["'](\/api[^"']*)["']/g)].map((m) => m[1]);
const direct = [...server.matchAll(/app\.(?:get|post|put|delete|patch)\(\s*["'](\/api[^"']*)["']/g)].map((m) => m[1]);

function walk(dir) {
  return fs.readdirSync(dir).flatMap((name) => {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) return walk(p);
    return /\.jsx?$/.test(name) && !/\.test\./.test(name) ? [p] : [];
  });
}

const calls = [];
for (const file of walk(path.join(ROOT, 'frontend/src'))) {
  const text = fs.readFileSync(file, 'utf8');
  for (const m of text.matchAll(/\bapi\.(?:get|post|put|patch|delete)\(\s*[`'"](\/[A-Za-z0-9_-]+)/g)) {
    calls.push({ prefix: `/api${m[1]}`, file: path.relative(ROOT, file).split(path.sep).join('/') });
  }
}

const owned = (prefix) => [...mounted, ...direct].some((r) => r === prefix || r.startsWith(`${prefix}/`));

describe('el frontend y el servidor hablan de las mismas direcciones', () => {
  test('se encontraron llamadas del frontend para revisar', () => {
    expect(calls.length).toBeGreaterThan(50);
  });

  test('toda dirección que el frontend usa está montada en el servidor', () => {
    const sinDueno = [...new Set(calls.filter((c) => !owned(c.prefix)).map((c) => `${c.prefix} (${c.file})`))];
    expect(sinDueno).toEqual([]);
  });

  test('la recuperación de clave responde en las dos direcciones', () => {
    expect(mounted).toEqual(expect.arrayContaining(['/api/password', '/api/password-recovery']));
  });
});

import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

// Los días de la semana se muestran con una inicial corta. Martes y miércoles empiezan igual,
// por eso van como "Ma" y "Mi": dos días distintos nunca deben verse con la misma letra.
const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (f) => readFileSync(join(SRC, f), 'utf8');

function iniciales(texto, clave) {
  return [...texto.matchAll(new RegExp(`${clave}: '([^']+)'`, 'g'))].map((m) => m[1]);
}

describe.each([
  ['registro del médico (paso de ubicación)', 'components/auth/DoctorWizard/DoctorStep4Location.jsx', 'short', /value: '(\w+)', label: '([^']+)', short: '([^']+)'/g],
  ['calendario de disponibilidad', 'components/common/media/ScheduleCalendar.jsx', 'initial', /name: '([^']+)', short: '[^']+', initial: '([^']+)'/g]
])('%s', (_nombre, archivo, clave) => {
  const texto = leer(archivo);
  const lista = iniciales(texto, clave).slice(-7);

  test('hay siete días', () => {
    expect(lista).toHaveLength(7);
  });
  test('ninguna inicial se repite', () => {
    expect(new Set(lista).size).toBe(7);
  });
  test('el martes es "Ma" y el miércoles es "Mi"', () => {
    expect(lista).toEqual(expect.arrayContaining(['Ma', 'Mi']));
    expect(lista).not.toContain('M');
  });
});

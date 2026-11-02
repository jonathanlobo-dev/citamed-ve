import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

// Guarda contra el fallo "Volver al inicio no hace nada": dentro de app.citamedve.app la ruta "/"
// redirige al login, así que un navigate('/') o <Link to="/"> directo se queda dando vueltas.
// Todo enlace a "inicio" debe pasar por goToHome() o homeUrl().

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    return statSync(p).isDirectory() ? walk(p) : /\.jsx?$/.test(n) && !/\.test\./.test(n) ? [p] : [];
  });
}
const files = walk(SRC).map((p) => ({ rel: relative(SRC, p).split('\\').join('/'), text: readFileSync(p, 'utf8') }));

// Usos de "/" que sí son correctos (cierre de sesión y scroll dentro de la presentación)
const PERMITIDOS = { 'components/common/Navbar/Navbar.jsx': 2, 'config/appUrl.js': 1 };

describe('enlaces a inicio', () => {
  test("ningún navigate('/') ni <Link to=\"/\"> directo fuera de la lista permitida", () => {
    const malos = [];
    for (const { rel, text } of files) {
      const n = (text.match(/navigate\(\s*['"]\/['"]\s*\)/g) || []).length + (text.match(/<Link\s+to=["']\/["']/g) || []).length;
      if (n > (PERMITIDOS[rel] || 0)) malos.push(`${rel}: ${n} uso(s)`);
    }
    expect(malos).toEqual([]);
  });

  test('todo archivo que usa goToHome/homeUrl los importa de config/appUrl', () => {
    const malos = files
      .filter(({ rel, text }) => rel !== 'config/appUrl.js' && /\b(goToHome|homeUrl)\b/.test(text) && !/import\s*\{[^}]*\b(goToHome|homeUrl)\b[^}]*\}\s*from\s*['"][./]+\/config\/appUrl['"]/.test(text))
      .map((f) => f.rel);
    expect(malos).toEqual([]);
  });
});

import { describe, test, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TERMS, PRIVACY, ETHICS, LEGAL_UPDATED } from './legalContent';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '../../..');

function walk(dir) {
  return readdirSync(dir).flatMap((n) => {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) return walk(p);
    return /\.jsx$/.test(n) ? [p] : [];
  });
}

describe.each([['Términos', TERMS], ['Privacidad', PRIVACY], ['Código de ética', ETHICS]])('%s', (_n, doc) => {
  test('tiene título, fecha, introducción y secciones con contenido', () => {
    expect(doc.title.length).toBeGreaterThan(5);
    expect(doc.updated).toBe(LEGAL_UPDATED);
    expect(doc.intro.length).toBeGreaterThan(40);
    expect(doc.sections.length).toBeGreaterThanOrEqual(5);
    doc.sections.forEach((s) => {
      expect(s.title.length).toBeGreaterThan(3);
      expect((s.paragraphs?.length || 0) + (s.items?.length || 0)).toBeGreaterThan(0);
    });
  });
  test('los títulos de sección no se repiten (se usan como clave en pantalla)', () => {
    const titles = doc.sections.map((s) => s.title);
    expect(new Set(titles).size).toBe(titles.length);
  });
  test('no usa guiones largos ni voseo', () => {
    const text = JSON.stringify(doc);
    expect(text).not.toMatch(/[\u2013\u2014]/);
    expect(text).not.toMatch(/\b(tenés|podés|querés|sos|vos)\b/i);
  });
});

describe('contenido que debe decir el documento correcto', () => {
  const all = (d) => [d.title, d.intro, ...d.sections.flatMap((s) => [s.title, ...(s.paragraphs || []), ...(s.items || [])])].join('\n').toLowerCase();

  test('los términos dejan claro que CitaMed no presta atención médica ni toca el dinero', () => {
    const t = all(TERMS);
    expect(t).toContain('no presta servicios médicos');
    expect(t).toContain('no cobra ni toca el dinero');
  });
  test('los términos dicen que el médico no atiende hasta ser verificado', () => {
    expect(all(TERMS)).toContain('hasta que un administrador verifique');
  });
  test('la privacidad promete lo que el sistema hace: la asistente no ve datos clínicos y los documentos no se borran', () => {
    const p = all(PRIVACY);
    expect(p).toContain('nunca ve datos clínicos');
    expect(p).toContain('no se borran');
    expect(p).toContain('no vendemos tus datos');
  });
  test('la privacidad dice cómo cambiar el nombre, la cédula y el MPPS', () => {
    expect(all(PRIVACY)).toContain('solicitud en "mi cuenta"');
  });
  test('el código de ética menciona el secreto profesional y la habilitación legal', () => {
    const e = all(ETHICS);
    expect(e).toContain('secreto profesional');
    expect(e).toContain('legalmente habilitado');
  });
  test('todos dan un contacto de soporte', () => {
    // el pie común de la página muestra soporte@citamedve.app; el texto también lo cita donde corresponde
    expect(all(PRIVACY)).toContain('soporte@citamedve.app');
    expect(all(TERMS)).toContain('soporte@citamedve.app');
  });
});

describe('enlaces internos escritos a mano', () => {
  const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
  const routes = [...app.matchAll(/path="([^"]+)"/g)].map((m) => m[1]);

  const matches = (href) => routes.some((r) => {
    const re = new RegExp(`^${r.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')}$`);
    return re.test(href);
  });

  const hrefs = [];
  for (const file of walk(SRC)) {
    const text = readFileSync(file, 'utf8');
    for (const m of text.matchAll(/href="(\/[^"#?{}$]*)"/g)) hrefs.push({ href: m[1] || '/', file: file.replace(SRC, '').split('\\').join('/') });
  }

  test('se encontraron enlaces para revisar', () => {
    expect(hrefs.length).toBeGreaterThan(5);
  });

  test('todo href="/ruta" escrito en una pantalla existe como ruta de la aplicación', () => {
    const rotos = [...new Set(hrefs.filter((h) => h.href !== '/' && !matches(h.href)).map((h) => `${h.href} (${h.file})`))];
    expect(rotos).toEqual([]);
  });

  test('los tres documentos legales tienen ruta', () => {
    ['/terminos', '/privacidad', '/codigo-etica'].forEach((r) => expect(matches(r)).toBe(true));
  });
});

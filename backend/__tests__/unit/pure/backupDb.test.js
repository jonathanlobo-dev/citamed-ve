const fs = require('fs');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { encrypt, decrypt, verify, sha256, stamp } = require('../../../scripts/backup-db');

function carpeta() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'citamed-backup-'));
}

function escribirCopia(dir, { passphrase = '', tablas = { users: ['{"id":1}', '{"id":2}'], vacia: [] } } = {}) {
  const manifest = { encrypted: !!passphrase, tables: {} };
  for (const [t, lines] of Object.entries(tablas)) {
    const raw = zlib.gzipSync(Buffer.from(lines.join('\n'), 'utf8'));
    const out = passphrase ? encrypt(raw, passphrase) : raw;
    const file = `${t}.ndjson.gz${passphrase ? '.enc' : ''}`;
    fs.writeFileSync(path.join(dir, file), out);
    manifest.tables[t] = { file, rows: lines.length, sha256: sha256(out) };
  }
  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest));
  return manifest;
}

afterEach(() => { delete process.env.BACKUP_PASSPHRASE; });

describe('cifrado de la copia', () => {
  test('ida y vuelta', () => {
    const datos = Buffer.from('historia clínica ñandú 🔑 '.repeat(100));
    expect(decrypt(encrypt(datos, 'clave larga y segura'), 'clave larga y segura').equals(datos)).toBe(true);
  });
  test('con otra clave no se puede abrir', () => {
    expect(() => decrypt(encrypt(Buffer.from('secreto'), 'una'), 'otra')).toThrow();
  });
  test('si alguien altera el archivo, se detecta', () => {
    const c = encrypt(Buffer.from('secreto'), 'k');
    c[c.length - 1] ^= 0xff;
    expect(() => decrypt(c, 'k')).toThrow();
  });
  test('el mismo texto cifrado dos veces da archivos distintos', () => {
    expect(encrypt(Buffer.from('x'), 'k').equals(encrypt(Buffer.from('x'), 'k'))).toBe(false);
  });
  test('el archivo cifrado no contiene el texto original', () => {
    expect(encrypt(Buffer.from('DATO-SENSIBLE'), 'k').toString('latin1')).not.toContain('DATO-SENSIBLE');
  });
});

describe('verificación de una copia', () => {
  test('una copia completa sin cifrar es íntegra', () => {
    const dir = carpeta();
    escribirCopia(dir);
    expect(verify(dir)).toEqual({ ok: true, tables: 2, rows: 2, problems: [] });
  });

  test('una copia cifrada se verifica con su clave y pide la clave si falta', () => {
    const dir = carpeta();
    escribirCopia(dir, { passphrase: 'abc' });
    expect(() => verify(dir)).toThrow(/BACKUP_PASSPHRASE/);
    process.env.BACKUP_PASSPHRASE = 'abc';
    expect(verify(dir).ok).toBe(true);
  });

  test('con la clave equivocada, la verificación lo avisa', () => {
    const dir = carpeta();
    escribirCopia(dir, { passphrase: 'abc' });
    process.env.BACKUP_PASSPHRASE = 'zzz';
    const r = verify(dir);
    expect(r.ok).toBe(false);
    expect(r.problems[0]).toMatch(/no se pudo leer/);
  });

  test('un archivo que falta se detecta', () => {
    const dir = carpeta();
    const m = escribirCopia(dir);
    fs.unlinkSync(path.join(dir, m.tables.users.file));
    expect(verify(dir).problems).toEqual([expect.stringContaining('falta el archivo')]);
  });

  test('un archivo alterado se detecta por su huella', () => {
    const dir = carpeta();
    const m = escribirCopia(dir);
    const f = path.join(dir, m.tables.users.file);
    const b = fs.readFileSync(f);
    b[b.length - 5] ^= 0x01;
    fs.writeFileSync(f, b);
    expect(verify(dir).problems[0]).toMatch(/huella no coincide/);
  });

  test('si el conteo de filas no coincide con el manifiesto, se detecta', () => {
    const dir = carpeta();
    const m = escribirCopia(dir);
    m.tables.users.rows = 5;
    fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(m));
    expect(verify(dir).problems[0]).toMatch(/tiene 2 filas y el manifiesto dice 5/);
  });

  test('una carpeta sin manifiesto no es una copia', () => {
    expect(() => verify(carpeta())).toThrow(/manifest/);
  });
});

test('el nombre de la carpeta lleva fecha y hora ordenables', () => {
  expect(stamp(new Date(2026, 10, 8, 9, 5, 7))).toBe('2026-11-08_090507');
});

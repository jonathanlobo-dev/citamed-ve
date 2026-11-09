/**
 * backup-db.js - CITAMED.VE
 * Copia de seguridad lógica de la base de datos: cada tabla del esquema public en un archivo
 * comprimido (una fila por línea, en JSON), más un manifiesto con el conteo de filas y su huella.
 *
 *   node scripts/backup-db.js                    -> backend/backups/AAAA-MM-DD_HHMMSS/
 *   node scripts/backup-db.js --verify <carpeta> -> comprueba que la copia está completa e intacta
 *
 * Solo LEE de la base de datos (SELECT). Usa las variables DB_* de backend/.env (o del entorno).
 *
 * Los datos de salud son sensibles: si BACKUP_PASSPHRASE está definida, cada archivo se cifra con
 * AES-256-GCM. La carpeta backend/backups/ está fuera del repositorio. Guarda la copia en un lugar
 * privado del cliente (nunca en GitHub, en un chat ni en un correo).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const { Client } = require('pg');

const BACKUPS_ROOT = process.env.BACKUP_DIR || path.resolve(__dirname, '../backups');
const BATCH = 1000;

function key(passphrase, salt) {
  return crypto.scryptSync(passphrase, salt, 32);
}

/** Cifra un buffer: salt(16) + iv(12) + etiqueta(16) + datos */
function encrypt(buf, passphrase) {
  const salt = crypto.randomBytes(16);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key(passphrase, salt), iv);
  const data = Buffer.concat([cipher.update(buf), cipher.final()]);
  return Buffer.concat([salt, iv, cipher.getAuthTag(), data]);
}

function decrypt(buf, passphrase) {
  const salt = buf.subarray(0, 16);
  const iv = buf.subarray(16, 28);
  const tag = buf.subarray(28, 44);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key(passphrase, salt), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(buf.subarray(44)), decipher.final()]);
}

const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');

function stamp(d = new Date()) {
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

function connect() {
  return new Client({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : undefined
  });
}

async function backup() {
  const passphrase = process.env.BACKUP_PASSPHRASE || '';
  const dir = path.join(BACKUPS_ROOT, stamp());
  fs.mkdirSync(dir, { recursive: true });

  const client = connect();
  await client.connect();
  const tables = (await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
  )).rows.map((r) => r.table_name);

  const manifest = { createdAt: new Date().toISOString(), database: process.env.DB_USER || '', encrypted: !!passphrase, tables: {} };
  console.log(`\nCopia de ${tables.length} tablas en ${dir}${passphrase ? ' (cifrada)' : ' (SIN cifrar: define BACKUP_PASSPHRASE)'}\n`);

  for (const table of tables) {
    const lines = [];
    let offset = 0;
    // Lectura por lotes con un orden estable para no saltarse ni repetir filas
    for (;;) {
      const { rows } = await client.query(
        `SELECT row_to_json(t) AS r FROM (SELECT * FROM "${table}" ORDER BY 1 LIMIT ${BATCH} OFFSET ${offset}) t`
      );
      if (rows.length === 0) break;
      rows.forEach((x) => lines.push(JSON.stringify(x.r)));
      offset += rows.length;
      if (rows.length < BATCH) break;
    }
    const raw = zlib.gzipSync(Buffer.from(lines.join('\n'), 'utf8'));
    const out = passphrase ? encrypt(raw, passphrase) : raw;
    const file = `${table}.ndjson.gz${passphrase ? '.enc' : ''}`;
    fs.writeFileSync(path.join(dir, file), out);
    manifest.tables[table] = { file, rows: lines.length, sha256: sha256(out) };
    console.log(`  ${table.padEnd(32)} ${String(lines.length).padStart(7)} filas`);
  }
  await client.end();

  fs.writeFileSync(path.join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2));
  const total = Object.values(manifest.tables).reduce((a, t) => a + t.rows, 0);
  console.log(`\nListo: ${total} filas en ${tables.length} tablas.\nComprueba la copia con:  node scripts/backup-db.js --verify "${dir}"\n`);
  return dir;
}

/** Comprueba que cada archivo existe, que su huella coincide y que el conteo de filas es el anotado */
function verify(dir) {
  const manifestPath = path.join(dir, 'manifest.json');
  if (!fs.existsSync(manifestPath)) throw new Error(`No hay manifest.json en ${dir}`);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  const passphrase = process.env.BACKUP_PASSPHRASE || '';
  if (manifest.encrypted && !passphrase) throw new Error('La copia está cifrada: define BACKUP_PASSPHRASE para verificarla');

  const problems = [];
  let rows = 0;
  for (const [table, info] of Object.entries(manifest.tables)) {
    const file = path.join(dir, info.file);
    if (!fs.existsSync(file)) { problems.push(`${table}: falta el archivo ${info.file}`); continue; }
    const buf = fs.readFileSync(file);
    if (sha256(buf) !== info.sha256) { problems.push(`${table}: la huella no coincide (archivo alterado o dañado)`); continue; }
    try {
      const raw = manifest.encrypted ? decrypt(buf, passphrase) : buf;
      const text = zlib.gunzipSync(raw).toString('utf8');
      const lines = text === '' ? [] : text.split('\n');
      lines.forEach((l) => JSON.parse(l));
      if (lines.length !== info.rows) problems.push(`${table}: tiene ${lines.length} filas y el manifiesto dice ${info.rows}`);
      rows += lines.length;
    } catch (error) {
      problems.push(`${table}: no se pudo leer (${error.message})`);
    }
  }
  return { ok: problems.length === 0, tables: Object.keys(manifest.tables).length, rows, problems };
}

async function main() {
  const args = process.argv.slice(2);
  if (args[0] === '--verify') {
    if (!args[1]) { console.error('Uso: node scripts/backup-db.js --verify <carpeta>'); process.exit(1); }
    let r;
    try {
      r = verify(path.resolve(args[1]));
    } catch (error) {
      console.error(`\n${error.message}\n`);
      process.exit(1);
    }
    console.log(r.ok ? `\nCopia íntegra: ${r.tables} tablas, ${r.rows} filas.\n` : `\nCopia con problemas:\n- ${r.problems.join('\n- ')}\n`);
    process.exit(r.ok ? 0 : 1);
  }
  try {
    await backup();
  } catch (error) {
    console.error(`\nLa copia falló: ${error.message}\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { encrypt, decrypt, verify, sha256, stamp };

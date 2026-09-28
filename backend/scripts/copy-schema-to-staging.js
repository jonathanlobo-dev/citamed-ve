/**
 * copy-schema-to-staging.js - CITAMED.VE
 *
 * Copia la ESTRUCTURA de la base de producción (backend/.env.production) a la base de pruebas
 * (backend/.env.staging): tipos, secuencias, tablas, restricciones, índices, funciones,
 * disparadores y seguridad a nivel de fila. De datos solo copia las tablas de referencia
 * (especialidades, permisos) y la cuenta admin@citamed.ve. Nunca escribe en producción:
 * la conexión a producción solo ejecuta SELECT.
 *
 * Uso: node scripts/copy-schema-to-staging.js            (falla si staging ya tiene tablas)
 *      node scripts/copy-schema-to-staging.js --reset    (borra el esquema public de STAGING y lo recrea)
 */

const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');
const { Client } = require('pg');

const RESET = process.argv.includes('--reset');
const REFERENCE_TABLES = ['specialties', 'permissions', 'role_permissions', 'SequelizeMeta'];
const COPY_USERS = ['admin@citamed.ve'];

function loadEnv(file) {
  const full = path.join(__dirname, '..', file);
  if (!fs.existsSync(full)) throw new Error(`No existe ${file}`);
  return dotenv.parse(fs.readFileSync(full));
}

function clientFrom(env) {
  return new Client({
    host: env.DB_HOST,
    port: Number(env.DB_PORT || 5432),
    database: env.DB_NAME,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    ssl: env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  });
}

const DDL_QUERIES = {
  enums: `select coalesce(string_agg(format('CREATE TYPE public.%I AS ENUM (%s);', t.typname,
      (select string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder) from pg_enum e where e.enumtypid = t.oid)), E'\\n' order by t.typname), '') s
    from pg_type t join pg_namespace n on n.oid = t.typnamespace where n.nspname = 'public' and t.typtype = 'e'`,
  sequences: `select coalesce(string_agg(format('CREATE SEQUENCE IF NOT EXISTS public.%I;', sequencename), E'\\n' order by sequencename), '') s
    from pg_sequences where schemaname = 'public'`,
  tables: `select coalesce(string_agg(format('CREATE TABLE public.%I (%s);', c.relname,
      (select string_agg(format('%I %s%s%s', a.attname, format_type(a.atttypid, a.atttypmod),
          case when ad.adbin is not null then ' DEFAULT ' || pg_get_expr(ad.adbin, ad.adrelid) else '' end,
          case when a.attnotnull then ' NOT NULL' else '' end), ', ' order by a.attnum)
       from pg_attribute a left join pg_attrdef ad on ad.adrelid = a.attrelid and ad.adnum = a.attnum
       where a.attrelid = c.oid and a.attnum > 0 and not a.attisdropped)), E'\\n' order by c.relname), '') s
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'`,
  owned: `select coalesce(string_agg(format('ALTER SEQUENCE public.%I OWNED BY public.%I.%I;', s.relname, t.relname, a.attname), E'\\n'), '') s
    from pg_depend d join pg_class s on s.oid = d.objid and s.relkind = 'S' join pg_class t on t.oid = d.refobjid
    join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid join pg_namespace n on n.oid = s.relnamespace
    where n.nspname = 'public' and d.deptype = 'a'`,
  constraints: `select coalesce(string_agg(format('ALTER TABLE public.%I ADD CONSTRAINT %I %s;', cl.relname, co.conname, pg_get_constraintdef(co.oid)), E'\\n'
      order by case co.contype when 'p' then 1 when 'u' then 2 when 'c' then 3 else 4 end, cl.relname, co.conname), '') s
    from pg_constraint co join pg_class cl on cl.oid = co.conrelid join pg_namespace n on n.oid = cl.relnamespace
    where n.nspname = 'public' and co.contype in ('p', 'u', 'c', 'f')`,
  indexes: `select coalesce(string_agg(pg_get_indexdef(i.indexrelid) || ';', E'\\n' order by ic.relname), '') s
    from pg_index i join pg_class ic on ic.oid = i.indexrelid join pg_class tc on tc.oid = i.indrelid join pg_namespace n on n.oid = tc.relnamespace
    where n.nspname = 'public' and not exists (select 1 from pg_constraint co where co.conindid = i.indexrelid)`,
  functions: `select coalesce(string_agg(pg_get_functiondef(p.oid) || ';', E'\\n'), '') s
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace left join pg_depend d on d.objid = p.oid and d.deptype = 'e'
    where n.nspname = 'public' and d.objid is null`,
  triggers: `select coalesce(string_agg(pg_get_triggerdef(t.oid) || ';', E'\\n'), '') s
    from pg_trigger t join pg_class c on c.oid = t.tgrelid join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and not t.tgisinternal`,
  rls: `select coalesce(string_agg(format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', c.relname), E'\\n'), '') s
    from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity`
};

const ORDER = ['enums', 'sequences', 'tables', 'owned', 'constraints', 'indexes', 'functions', 'triggers', 'rls'];

async function copyRows(prod, staging, table, where = '', params = []) {
  const { rows, fields } = await prod.query(`SELECT * FROM public."${table}" ${where}`, params);
  if (rows.length === 0) return 0;
  const cols = Object.keys(rows[0]);
  const colList = cols.map(c => `"${c}"`).join(', ');
  // json (114) y jsonb (3802) se envían como texto; los arreglos de Postgres se pasan tal cual
  const jsonCols = new Set(fields.filter(f => f.dataTypeID === 114 || f.dataTypeID === 3802).map(f => f.name));
  for (const row of rows) {
    const values = cols.map(c => (jsonCols.has(c) && row[c] !== null ? JSON.stringify(row[c]) : row[c]));
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    await staging.query(`INSERT INTO public."${table}" (${colList}) VALUES (${placeholders})`, values);
  }
  return rows.length;
}

async function main() {
  const prodEnv = loadEnv('.env.production');
  const stagingEnv = loadEnv('.env.staging');

  if (prodEnv.DB_HOST === stagingEnv.DB_HOST && prodEnv.DB_USER === stagingEnv.DB_USER) {
    throw new Error('.env.staging apunta a la misma base que .env. Se cancela para no tocar producción.');
  }
  if (!stagingEnv.DB_PASSWORD || stagingEnv.DB_PASSWORD.startsWith('PEGA_AQUI')) {
    throw new Error('Falta DB_PASSWORD en backend/.env.staging');
  }

  const prod = clientFrom(prodEnv);
  const staging = clientFrom(stagingEnv);
  await prod.connect();
  await staging.connect();
  console.log('Conectado a producción (solo lectura) y a staging.');

  try {
    const { rows: existing } = await staging.query(
      `select count(*)::int n from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relkind = 'r'`
    );
    if (existing[0].n > 0 && !RESET) {
      throw new Error(`Staging ya tiene ${existing[0].n} tablas. Usa --reset para recrearlo.`);
    }

    await prod.query('BEGIN READ ONLY');
    const ddl = {};
    for (const key of ORDER) {
      const { rows } = await prod.query(DDL_QUERIES[key]);
      ddl[key] = rows[0].s;
    }
    await prod.query('COMMIT');

    await staging.query('BEGIN');
    if (RESET) {
      await staging.query('DROP SCHEMA public CASCADE');
      await staging.query('CREATE SCHEMA public');
      await staging.query('GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role');
      await staging.query('GRANT ALL ON SCHEMA public TO postgres, service_role');
    }
    for (const key of ORDER) {
      if (!ddl[key]) continue;
      await staging.query(ddl[key]);
      console.log(`  Estructura aplicada: ${key}`);
    }

    for (const table of REFERENCE_TABLES) {
      const n = await copyRows(prod, staging, table);
      console.log(`  Datos de referencia: ${table} (${n} filas)`);
    }
    const n = await copyRows(prod, staging, 'users', 'WHERE email = ANY($1)', [COPY_USERS]);
    console.log(`  Cuentas copiadas: ${n} (${COPY_USERS.join(', ')})`);

    // Ajusta cada secuencia al máximo id existente
    const { rows: owned } = await staging.query(`
      select s.relname seq, t.relname tbl, a.attname col
      from pg_depend d join pg_class s on s.oid = d.objid and s.relkind = 'S' join pg_class t on t.oid = d.refobjid
      join pg_attribute a on a.attrelid = t.oid and a.attnum = d.refobjsubid join pg_namespace n on n.oid = s.relnamespace
      where n.nspname = 'public' and d.deptype = 'a'`);
    for (const o of owned) {
      await staging.query(
        `select setval('public."${o.seq}"', coalesce((select max("${o.col}") from public."${o.tbl}"), 0) + 1, false)`
      );
    }
    await staging.query('COMMIT');

    // Verificación: mismas tablas y columnas en ambas bases
    const colsQuery = `select table_name || '.' || column_name || ':' || data_type c from information_schema.columns where table_schema = 'public' order by 1`;
    const [a, b] = await Promise.all([prod.query(colsQuery), staging.query(colsQuery)]);
    const prodCols = new Set(a.rows.map(r => r.c));
    const stagingCols = new Set(b.rows.map(r => r.c));
    const missing = [...prodCols].filter(c => !stagingCols.has(c));
    const extra = [...stagingCols].filter(c => !prodCols.has(c));
    console.log(`\nColumnas en producción: ${prodCols.size}. En staging: ${stagingCols.size}.`);
    if (missing.length || extra.length) {
      console.log('DIFERENCIAS:', { missing, extra });
      process.exitCode = 1;
    } else {
      console.log('Estructura idéntica.');
    }
  } catch (err) {
    try { await staging.query('ROLLBACK'); } catch { /* sin transacción abierta */ }
    console.error('ERROR:', err.message);
    process.exitCode = 1;
  } finally {
    await prod.end();
    await staging.end();
  }
}

main();

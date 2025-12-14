#!/usr/bin/env node

/**
 * Database Query Benchmark Script
 * CITAMED.VE - Performance Testing
 *
 * Este script mide el tiempo de ejecución de queries críticas
 * ANTES y DESPUÉS de aplicar indexes para calcular % de mejora.
 *
 * Uso:
 *   node scripts/benchmark-queries.js           # Run all benchmarks
 *   node scripts/benchmark-queries.js --explain # Show EXPLAIN ANALYZE
 *
 * @see docs/DATABASE_INDEXES.md para documentación completa
 */

require('dotenv').config();
const { Sequelize } = require('sequelize');

// Configuración de conexión
const sequelize = new Sequelize(
  process.env.DB_NAME || 'citamed_development',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Queries críticas a medir
const QUERIES = [
  {
    name: 'Login - Email Lookup',
    description: 'Buscar usuario por email para login',
    sql: `SELECT * FROM users WHERE email = 'test@example.com'`,
    targetMs: 50
  },
  {
    name: 'Doctor - By Specialty',
    description: 'Buscar médicos por especialidad',
    sql: `SELECT dp.* FROM doctor_profiles dp WHERE dp."specialtyId" = 1`,
    targetMs: 100
  },
  {
    name: 'Doctor - By City',
    description: 'Buscar médicos por ciudad',
    sql: `SELECT * FROM doctor_profiles WHERE city = 'Caracas'`,
    targetMs: 100
  },
  {
    name: 'Doctor - Specialty + City',
    description: 'Buscar médicos por especialidad y ciudad',
    sql: `SELECT * FROM doctor_profiles WHERE "specialtyId" = 1 AND city = 'Caracas'`,
    targetMs: 80
  },
  {
    name: 'Doctor - Verified Only',
    description: 'Filtrar solo médicos verificados',
    sql: `SELECT * FROM doctor_profiles WHERE "isVerified" = true`,
    targetMs: 100
  },
  {
    name: 'Appointments - Doctor Today',
    description: 'Agenda del médico para hoy',
    sql: `SELECT * FROM appointments WHERE "doctorId" = 1 AND DATE("appointmentDate") = CURRENT_DATE`,
    targetMs: 80
  },
  {
    name: 'Appointments - Patient History',
    description: 'Historial de citas del paciente',
    sql: `SELECT * FROM appointments WHERE "patientId" = 1 ORDER BY "appointmentDate" DESC`,
    targetMs: 100
  },
  {
    name: 'Appointments - By Status',
    description: 'Filtrar citas por estado',
    sql: `SELECT * FROM appointments WHERE status = 'scheduled'`,
    targetMs: 100
  },
  {
    name: 'Specialties - Search',
    description: 'Buscar especialidad por nombre',
    sql: `SELECT * FROM specialties WHERE name ILIKE '%cardio%'`,
    targetMs: 50
  },
  {
    name: 'Specialties - Active Only',
    description: 'Listar especialidades activas',
    sql: `SELECT * FROM specialties WHERE "isActive" = true ORDER BY name`,
    targetMs: 50
  }
];

/**
 * Ejecutar query y medir tiempo
 */
async function measureQuery(sql, iterations = 10) {
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const start = process.hrtime.bigint();
    try {
      await sequelize.query(sql, { type: Sequelize.QueryTypes.SELECT });
    } catch (error) {
      // Ignorar errores de tablas que no existen
      if (!error.message.includes('does not exist')) {
        throw error;
      }
      return { avg: -1, min: -1, max: -1, error: 'Table not found' };
    }
    const end = process.hrtime.bigint();
    times.push(Number(end - start) / 1000000); // Convert to ms
  }

  return {
    avg: Math.round(times.reduce((a, b) => a + b, 0) / times.length * 100) / 100,
    min: Math.round(Math.min(...times) * 100) / 100,
    max: Math.round(Math.max(...times) * 100) / 100
  };
}

/**
 * Ejecutar EXPLAIN ANALYZE
 */
async function explainQuery(sql) {
  try {
    const result = await sequelize.query(`EXPLAIN ANALYZE ${sql}`, {
      type: Sequelize.QueryTypes.SELECT
    });
    return result.map(r => r['QUERY PLAN']).join('\n');
  } catch (error) {
    return `Error: ${error.message}`;
  }
}

/**
 * Verificar si un index existe
 */
async function checkIndexExists(indexName) {
  try {
    const result = await sequelize.query(`
      SELECT indexname FROM pg_indexes
      WHERE indexname = '${indexName}'
    `, { type: Sequelize.QueryTypes.SELECT });
    return result.length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Listar todos los indexes de CITAMED
 */
async function listIndexes() {
  try {
    const result = await sequelize.query(`
      SELECT
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      ORDER BY tablename, indexname
    `, { type: Sequelize.QueryTypes.SELECT });
    return result;
  } catch (error) {
    return [];
  }
}

/**
 * Ejecutar benchmarks
 */
async function runBenchmarks(showExplain = false) {
  console.log('');
  console.log('='.repeat(70));
  console.log('  CITAMED.VE - Database Query Benchmark');
  console.log('='.repeat(70));
  console.log('');

  // Verificar conexión
  try {
    await sequelize.authenticate();
    console.log('[OK] Connected to PostgreSQL');
  } catch (error) {
    console.error('[ERROR] Cannot connect to database:', error.message);
    process.exit(1);
  }

  // Verificar indexes existentes
  console.log('');
  console.log('Checking indexes...');
  const indexes = await listIndexes();
  console.log(`Found ${indexes.length} custom indexes (idx_*)`);

  if (indexes.length > 0) {
    console.log('');
    console.log('Existing indexes:');
    indexes.forEach(idx => {
      console.log(`  - ${idx.indexname} on ${idx.tablename}`);
    });
  }

  // Ejecutar benchmarks
  console.log('');
  console.log('-'.repeat(70));
  console.log('  Running Benchmarks (10 iterations each)');
  console.log('-'.repeat(70));
  console.log('');

  const results = [];

  for (const query of QUERIES) {
    process.stdout.write(`Testing: ${query.name}... `);

    const timing = await measureQuery(query.sql);

    if (timing.error) {
      console.log(`SKIP (${timing.error})`);
      continue;
    }

    const status = timing.avg <= query.targetMs ? '✓' : '✗';
    const improvement = timing.avg <= query.targetMs
      ? `${Math.round((1 - timing.avg / query.targetMs) * 100)}% under target`
      : `${Math.round((timing.avg / query.targetMs - 1) * 100)}% over target`;

    console.log(`${timing.avg}ms (target: ${query.targetMs}ms) ${status}`);

    results.push({
      ...query,
      timing,
      status: timing.avg <= query.targetMs ? 'PASS' : 'FAIL',
      improvement
    });

    // Mostrar EXPLAIN si se solicita
    if (showExplain) {
      console.log('');
      console.log('EXPLAIN ANALYZE:');
      const explain = await explainQuery(query.sql);
      console.log(explain);
      console.log('');
    }
  }

  // Resumen
  console.log('');
  console.log('='.repeat(70));
  console.log('  SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;

  console.log(`Queries tested: ${total}`);
  console.log(`Passed (under target): ${passed} (${Math.round(passed/total*100)}%)`);
  console.log(`Failed (over target): ${failed} (${Math.round(failed/total*100)}%)`);
  console.log('');

  // Tabla de resultados
  console.log('Detailed Results:');
  console.log('-'.repeat(70));
  console.log('| Query                      | Avg (ms) | Target | Status |');
  console.log('-'.repeat(70));

  results.forEach(r => {
    const name = r.name.padEnd(26).substring(0, 26);
    const avg = r.timing.avg.toString().padStart(8);
    const target = r.targetMs.toString().padStart(6);
    const status = r.status.padStart(6);
    console.log(`| ${name} | ${avg} | ${target} | ${status} |`);
  });

  console.log('-'.repeat(70));
  console.log('');

  // Cerrar conexión
  await sequelize.close();

  // Exit code basado en resultados
  process.exit(failed > 0 ? 1 : 0);
}

// Main
const showExplain = process.argv.includes('--explain');
runBenchmarks(showExplain).catch(console.error);

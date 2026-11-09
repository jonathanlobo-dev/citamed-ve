/**
 * load-test.js - CITAMED.VE
 * Prueba de carga de SOLO LECTURA: varios usuarios a la vez pidiendo las pantallas públicas
 * (salud del servidor, especialidades y directorio de médicos). No crea ni cambia datos.
 *
 *   npm run test:load                         (contra el servidor de Pruebas)
 *   API_URL=http://localhost:5000/api npm run test:load
 *   npm run test:load -- --connections 50 --seconds 20
 *
 * Nunca apunta a producción: la guarda es la misma de los recorridos completos.
 * El servidor de Pruebas es gratuito y pequeño: sirve para encontrar cuellos de botella y comparar
 * antes y después de un cambio, no para predecir exactamente el rendimiento de producción.
 */

const autocannon = require('autocannon');
const { isProductionUrl, hostOf, DEFAULT_STAGING_API } = require('./lib/stagingGuard');

const SCENARIOS = [
  ['Salud del servidor', '/health'],
  ['Especialidades', '/specialties'],
  ['Directorio de médicos', '/doctors?limit=20'],
  ['Búsqueda por especialidad', '/doctors?limit=20&city=Caracas']
];

function parseArgs(argv) {
  const out = { connections: 20, seconds: 10 };
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--connections') out.connections = Number(argv[i + 1]);
    if (argv[i] === '--seconds') out.seconds = Number(argv[i + 1]);
  }
  return out;
}

function run(opts) {
  return new Promise((resolve, reject) => {
    autocannon(opts, (err, result) => (err ? reject(err) : resolve(result)));
  });
}

const fmt = (n, d = 0) => Number(n).toFixed(d);

async function main() {
  const apiUrl = (process.env.API_URL || DEFAULT_STAGING_API).replace(/\/$/, '');
  if (!hostOf(apiUrl)) { console.error(`\nAPI_URL no es válida: ${apiUrl}\n`); process.exit(1); }
  if (isProductionUrl(apiUrl)) {
    console.error(`\nNo se corre: ${hostOf(apiUrl)} es producción. La prueba de carga solo corre contra Pruebas o local.\n`);
    process.exit(1);
  }

  const { connections, seconds } = parseArgs(process.argv.slice(2));
  if (!(connections > 0 && connections <= 200) || !(seconds > 0 && seconds <= 120)) {
    console.error('\nUsa --connections entre 1 y 200 y --seconds entre 1 y 120.\n');
    process.exit(1);
  }

  console.log(`\nPrueba de carga sobre ${apiUrl}\n${connections} usuarios a la vez, ${seconds} s por escenario\n`);

  // Despertar el servidor de Pruebas antes de medir
  for (let i = 0; i < 12; i += 1) {
    try {
      const r = await fetch(`${apiUrl}/health`, { signal: AbortSignal.timeout(20000) });
      if (r.ok) break;
    } catch { /* se duerme: se espera */ }
    await new Promise((r) => setTimeout(r, 10000));
  }

  const rows = [];
  for (const [name, route] of SCENARIOS) {
    const result = await run({ url: `${apiUrl}${route}`, connections, duration: seconds, timeout: 20 });
    const non2xx = result.non2xx || 0;
    rows.push({
      name,
      reqs: Math.round(result.requests.average),
      p50: result.latency.p50,
      p97: result.latency.p97_5 ?? result.latency.p99,
      p99: result.latency.p99,
      max: result.latency.max,
      errors: result.errors + result.timeouts + non2xx,
      total: result.requests.total
    });
  }

  console.log('Escenario                    Peticiones/s   p50 ms   p99 ms   máx ms   Fallos');
  console.log('-----------------------------------------------------------------------------');
  for (const r of rows) {
    console.log(`${r.name.padEnd(28)} ${String(r.reqs).padStart(10)} ${String(fmt(r.p50)).padStart(8)} ${String(fmt(r.p99)).padStart(8)} ${String(fmt(r.max)).padStart(8)} ${String(r.errors).padStart(8)}`);
  }
  const fallos = rows.reduce((a, r) => a + r.errors, 0);
  const total = rows.reduce((a, r) => a + r.total, 0);
  console.log(`\n${total} peticiones en total, ${fallos} con fallo (${total ? fmt((fallos / total) * 100, 2) : 0} %).\n`);
  process.exit(fallos > total * 0.01 ? 1 : 0);
}

if (require.main === module) {
  main().catch((e) => { console.error(`\nLa prueba de carga falló: ${e.message}\n`); process.exit(1); });
}

module.exports = { SCENARIOS, parseArgs };

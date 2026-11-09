/**
 * run-all-flows.js - CITAMED.VE
 * Corre, uno tras otro, los recorridos completos contra el servidor y la base de datos de PRUEBAS.
 *
 *   npm run test:flows                 (desde backend o desde la raíz)
 *   API_URL=https://... npm run test:flows
 *
 * Antes de empezar comprueba que el destino es Pruebas (nunca producción), despierta el servidor de
 * Pruebas (se duerme por inactividad) y al final muestra una tabla con el resultado de cada recorrido.
 * Termina con código 1 si alguno falla.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { spawn } = require('child_process');
const path = require('path');
const { checkStagingTarget } = require('./lib/stagingGuard');

// test-ai-flow y test-full-journey no entran: el primero depende de las llaves de IA y de un consentimiento
// que ya no se exige, y el segundo crea datos masivos. Los demás son los recorridos del producto.
const FLOWS = [
  ['Récipes y expediente', 'test-prescription-flow.js'],
  ['Historia clínica', 'test-clinical-record-flow.js'],
  ['Sala de espera', 'test-waiting-room-flow.js'],
  ['Superadmin y suspensión', 'test-superadmin-flow.js'],
  ['Asistentes del médico', 'test-assistants-flow.js'],
  ['Cobros y recibos', 'test-payments-flow.js']
];

const strip = (s) => s.replace(/\x1b\[[0-9;]*m/g, '');

async function wakeUp(apiUrl) {
  const healthUrl = `${apiUrl}/health`;
  for (let i = 1; i <= 12; i += 1) {
    try {
      const res = await fetch(healthUrl, { signal: AbortSignal.timeout(20000) });
      if (res.ok) return true;
    } catch {
      // el servidor gratis tarda cerca de un minuto en despertar
    }
    console.log(`  esperando al servidor de Pruebas (intento ${i}/12)...`);
    await new Promise((r) => setTimeout(r, 10000));
  }
  return false;
}

function runFlow(file, apiUrl) {
  return new Promise((resolve) => {
    const started = Date.now();
    let tail = [];
    const child = spawn(process.execPath, [path.join(__dirname, file)], {
      env: { ...process.env, API_URL: apiUrl },
      cwd: path.resolve(__dirname, '..')
    });
    const keep = (chunk) => {
      for (const line of strip(chunk.toString()).split(/\r?\n/)) {
        if (line.trim()) tail.push(line);
      }
      tail = tail.slice(-8);
    };
    child.stdout.on('data', keep);
    child.stderr.on('data', keep);
    child.on('close', (code) => resolve({ code, seconds: Math.round((Date.now() - started) / 1000), tail }));
    child.on('error', (err) => resolve({ code: 1, seconds: 0, tail: [err.message] }));
  });
}

async function main() {
  const target = checkStagingTarget(process.env);
  if (!target.ok) {
    console.error(`\nNo se corre nada: ${target.reason}\n`);
    process.exit(1);
  }

  console.log(`\nRecorridos completos contra PRUEBAS: ${target.apiUrl}\n`);
  if (!(await wakeUp(target.apiUrl))) {
    console.error('El servidor de Pruebas no respondió. Revisa Render antes de volver a intentar.');
    process.exit(1);
  }

  const results = [];
  for (const [name, file] of FLOWS) {
    console.log(`> ${name} (${file})`);
    const r = await runFlow(file, target.apiUrl);
    results.push({ name, file, ...r });
    console.log(`  ${r.code === 0 ? 'PASÓ' : 'FALLÓ'} en ${r.seconds} s`);
    if (r.code !== 0) r.tail.forEach((l) => console.log(`    ${l}`));
  }

  console.log('\nResumen');
  console.log('-------');
  for (const r of results) console.log(`${r.code === 0 ? 'PASÓ ' : 'FALLÓ'}  ${r.name.padEnd(26)} ${String(r.seconds).padStart(4)} s`);
  const failed = results.filter((r) => r.code !== 0);
  console.log(`\n${results.length - failed.length} de ${results.length} recorridos pasaron.\n`);
  process.exit(failed.length ? 1 : 0);
}

if (require.main === module) {
  main();
}

module.exports = { FLOWS };

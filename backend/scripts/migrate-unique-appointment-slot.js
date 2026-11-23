/**
 * migrate-unique-appointment-slot.js - CITAMED.VE
 * Impide a nivel de base que existan dos citas activas del mismo médico en el mismo día y hora
 * (reserva doble por peticiones simultáneas). Las consultas sin cita (isWalkIn) quedan fuera.
 * Si ya hay duplicados, los lista y NO crea el índice: hay que resolverlos primero.
 *
 *   node scripts/migrate-unique-appointment-slot.js              (base de backend/.env)
 *   ENV_FILE=.env.production node scripts/migrate-unique-appointment-slot.js
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', process.env.ENV_FILE || '.env') });
const { Client } = require('pg');

const ACTIVE = `status NOT IN ('cancelled_patient','cancelled_doctor','no_show','rescheduled') AND "isWalkIn" IS NOT TRUE`;

(async () => {
  const c = new Client({
    host: process.env.DB_HOST, port: process.env.DB_PORT, user: process.env.DB_USER,
    password: process.env.DB_PASSWORD, database: process.env.DB_NAME, ssl: { rejectUnauthorized: false }
  });
  await c.connect();
  console.log(`Base: ...${(process.env.DB_USER || '').slice(-20)}`);
  const dup = await c.query(`SELECT "doctorProfileId", "appointmentDate", "appointmentTime", array_agg(id ORDER BY id) ids
    FROM appointments WHERE ${ACTIVE} GROUP BY 1,2,3 HAVING count(*) > 1`);
  if (dup.rows.length) {
    console.error('Hay citas duplicadas; resuélvelas antes de crear el índice:');
    console.table(dup.rows);
    await c.end();
    process.exit(1);
  }
  await c.query(`CREATE UNIQUE INDEX CONCURRENTLY IF NOT EXISTS uq_appointments_active_slot
    ON appointments ("doctorProfileId", "appointmentDate", "appointmentTime") WHERE ${ACTIVE}`);
  const ok = await c.query(`SELECT indexdef FROM pg_indexes WHERE indexname = 'uq_appointments_active_slot'`);
  console.log(ok.rows[0] ? 'Índice listo.' : 'No se creó el índice.');
  await c.end();
})().catch((e) => { console.error('Error:', e.message); process.exit(1); });

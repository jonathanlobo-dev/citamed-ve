/**
 * migrate-payments.js - CITAMED.VE
 * M05 / Semana 8 - Cobros por reporte y validación, recibos y métodos de cobro
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    // Verificación de seguridad: abortar si no es la base de Pruebas
    const host = process.env.DB_HOST || '';
    const user = process.env.DB_USER || '';
    if (!user.endsWith('bvdjfxihcohexgvtyhto')) {
      console.error('❌ ABORTADO: Esta migración solo debe ejecutarse contra la base de Pruebas (bvdjfxihcohexgvtyhto).');
      console.error(`DB_HOST: ${host}, DB_USER: ${user.slice(-20)}`);
      process.exit(1);
    }

    await db.sequelize.authenticate();
    console.log('Connected to database. Running migration...');

    // 1. Columna paymentSettings en doctor_profiles
    await db.sequelize.query(`
      ALTER TABLE doctor_profiles 
      ADD COLUMN IF NOT EXISTS "paymentSettings" JSONB DEFAULT '{}'::jsonb;
    `);
    console.log('  ✅ Column doctor_profiles."paymentSettings" created/verified');

    // 2. Tabla payments
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER NOT NULL REFERENCES appointments(id) ON DELETE RESTRICT,
        doctor_id INTEGER NOT NULL REFERENCES users(id),
        patient_id INTEGER NOT NULL REFERENCES users(id),
        amount_usd NUMERIC(10, 2) NOT NULL CHECK (amount_usd > 0),
        exchange_rate NUMERIC(14, 4) NOT NULL CHECK (exchange_rate > 0),
        amount_ves NUMERIC(16, 2),
        method VARCHAR(20) NOT NULL CHECK (method IN ('pago_movil', 'transferencia', 'zelle', 'efectivo_usd', 'efectivo_ves')),
        reference VARCHAR(60),
        payer_bank VARCHAR(60),
        payer_note VARCHAR(200),
        status VARCHAR(12) NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'approved', 'rejected', 'voided')),
        reported_by INTEGER REFERENCES users(id),
        reported_at TIMESTAMPTZ DEFAULT NOW(),
        reviewed_by INTEGER REFERENCES users(id),
        reviewed_at TIMESTAMPTZ,
        review_note VARCHAR(300),
        verification_code VARCHAR(16) UNIQUE,
        receipt_number VARCHAR(20) UNIQUE,
        idempotency_key UUID,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✅ Table payments created/verified');

    // 3. Índices estándar
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS payments_doctor_status_idx 
        ON payments (doctor_id, status);
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS payments_patient_id_idx 
        ON payments (patient_id);
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS payments_appointment_id_idx 
        ON payments (appointment_id);
    `);
    console.log('  ✅ Standard indexes created/verified');

    // 4. Índice único para idempotency_key parcial
    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payments_idempotency_key_idx 
        ON payments (idempotency_key) WHERE idempotency_key IS NOT NULL;
    `);

    // 5. Índice único parcial: un cobro vigente por cita ('reported' o 'approved')
    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payments_active_appointment_idx 
        ON payments (appointment_id) WHERE status IN ('reported', 'approved');
    `);

    // 6. Índice único parcial: referencia única por médico y método mientras esté vigente
    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS payments_active_reference_idx 
        ON payments (doctor_id, method, reference) 
        WHERE status IN ('reported', 'approved') AND reference IS NOT NULL;
    `);
    console.log('  ✅ Partial unique indexes created/verified');

    // 7. Habilitar RLS
    await db.sequelize.query(`ALTER TABLE payments ENABLE ROW LEVEL SECURITY;`);
    console.log('  ✅ Row Level Security enabled for payments');

    console.log('✅ Migration for payments completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

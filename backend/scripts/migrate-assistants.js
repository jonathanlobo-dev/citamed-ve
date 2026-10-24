/**
 * migrate-assistants.js - CITAMED.VE
 * Semana 9 / Bloque A - Migración para tabla doctor_assistants y rol assistant
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
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
    console.log(`Connected to database (${user.slice(-20)}). Running migration...`);

    // 1. Agregar 'assistant' al enum_users_role (fuera de transacción)
    console.log('  -> Adding assistant value to enum_users_role...');
    await db.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'assistant';
    `);
    console.log('  ✅ Role "assistant" added/verified in enum_users_role');

    // 2. Crear tabla doctor_assistants
    console.log('  -> Creating table doctor_assistants...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_assistants (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        assistant_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'revoked')),
        can_agenda BOOLEAN NOT NULL DEFAULT true,
        can_payments BOOLEAN NOT NULL DEFAULT true,
        can_void_receipts BOOLEAN NOT NULL DEFAULT false,
        invited_at TIMESTAMPTZ DEFAULT NOW(),
        accepted_at TIMESTAMPTZ,
        revoked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✅ Table doctor_assistants created/verified');

    // 3. Índice único parcial: un médico y una asistente solo pueden tener un vínculo no revocado
    console.log('  -> Creating partial unique index for active/pending link...');
    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS doctor_assistants_active_unique_idx
        ON doctor_assistants (doctor_id, assistant_id)
        WHERE status <> 'revoked';
    `);
    console.log('  ✅ Partial unique index created/verified');

    // 4. Índices para búsquedas frecuentes
    console.log('  -> Creating indexes on doctor_id and assistant_id...');
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS doctor_assistants_doctor_id_idx 
        ON doctor_assistants (doctor_id);
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS doctor_assistants_assistant_id_idx 
        ON doctor_assistants (assistant_id);
    `);
    console.log('  ✅ Standard indexes created/verified');

    // 5. Habilitar RLS
    console.log('  -> Enabling Row Level Security...');
    await db.sequelize.query(`ALTER TABLE doctor_assistants ENABLE ROW LEVEL SECURITY;`);
    console.log('  ✅ Row Level Security enabled for doctor_assistants');

    console.log('✅ Migration for assistants completed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error executing migration:', err.message);
    if (err.original) {
      console.error('  Detail:', err.original.message);
    }
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

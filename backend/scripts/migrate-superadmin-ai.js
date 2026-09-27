/**
 * migrate-superadmin-ai.js - CITAMED.VE
 * M01 / M03 / Semana 7 - Migración para Superadministración, Configuración e IA
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Creating table platform_settings if not exists...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(100) PRIMARY KEY,
        value JSONB NOT NULL,
        updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table platform_settings created / verified.');

    console.log('Enabling Row Level Security on platform_settings...');
    await db.sequelize.query(`
      ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;
    `);
    console.log('Row Level Security enabled on platform_settings.');

    console.log('Creating table ai_usage if not exists...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS ai_usage (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        mode VARCHAR(20) NOT NULL,
        provider VARCHAR(20),
        model VARCHAR(100),
        success BOOLEAN NOT NULL,
        latency_ms INTEGER,
        input_chars INTEGER,
        audio_seconds INTEGER,
        error_code VARCHAR(50),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table ai_usage created / verified.');

    console.log('Creating indexes on ai_usage if not exists...');
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS ai_usage_user_created_idx ON ai_usage (user_id, created_at);
      CREATE INDEX IF NOT EXISTS ai_usage_created_idx ON ai_usage (created_at);
    `);
    console.log('Indexes created / verified on ai_usage.');

    console.log('Enabling Row Level Security on ai_usage...');
    await db.sequelize.query(`
      ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
    `);
    console.log('Row Level Security enabled on ai_usage.');

    console.log('Adding column aiConsentAt to appointments if not exists...');
    await db.sequelize.query(`
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "aiConsentAt" TIMESTAMPTZ;
    `);
    console.log('Column aiConsentAt verified on appointments.');

    console.log('Adding columns suspendedAt and suspensionReason to users if not exists...');
    await db.sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspendedAt" TIMESTAMPTZ;
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "suspensionReason" VARCHAR(500);
    `);
    console.log('Columns suspendedAt and suspensionReason verified on users.');

    console.log('✅ Migration for superadmin and AI completed successfully!');
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

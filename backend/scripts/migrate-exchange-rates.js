/**
 * migrate-exchange-rates.js - CITAMED.VE
 * M05 / Semana 8 - Historial de la tasa oficial BCV (USD/VES y EUR/VES)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS exchange_rates (
        id SERIAL PRIMARY KEY,
        currency_pair VARCHAR(10) NOT NULL,
        rate NUMERIC(14,4) NOT NULL CHECK (rate > 0),
        source VARCHAR(30) NOT NULL,
        is_manual BOOLEAN NOT NULL DEFAULT false,
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        raw_payload JSONB,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS exchange_rates_pair_created_idx
        ON exchange_rates (currency_pair, created_at DESC);
    `);
    await db.sequelize.query(`ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;`);

    console.log('✅ Migration for exchange_rates completed successfully!');
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

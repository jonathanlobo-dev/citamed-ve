/**
 * migrate-walk-in.js - CITAMED.VE
 * M03 / Semana 7 - Migración para Consulta sin Cita (Walk-in) y Reclamo de Cuenta
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Adding column isWalkIn to appointments if not exists...');
    await db.sequelize.query(`
      ALTER TABLE "appointments" ADD COLUMN IF NOT EXISTS "isWalkIn" BOOLEAN DEFAULT false;
    `);
    console.log('Column isWalkIn verified on appointments.');

    console.log('Adding column accountClaimed to users if not exists...');
    await db.sequelize.query(`
      ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "accountClaimed" BOOLEAN DEFAULT true;
    `);
    console.log('Column accountClaimed verified on users.');

    console.log('✅ Migration for walk-in and account claiming completed successfully!');
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

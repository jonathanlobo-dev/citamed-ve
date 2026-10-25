/**
 * migrate-assistant-invites.js - CITAMED.VE
 * M01 / Semana 9 - Enlace de invitación de la asistente (definir su clave desde el correo)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  try {
    await db.sequelize.authenticate();

    await db.sequelize.query(`
      ALTER TABLE doctor_assistants ADD COLUMN IF NOT EXISTS invite_token_hash VARCHAR(64);
    `);
    await db.sequelize.query(`
      ALTER TABLE doctor_assistants ADD COLUMN IF NOT EXISTS invite_expires_at TIMESTAMPTZ;
    `);
    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS doctor_assistants_invite_token_idx
        ON doctor_assistants (invite_token_hash) WHERE invite_token_hash IS NOT NULL;
    `);

    console.log('✅ Migration for assistant invites completed successfully!');
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

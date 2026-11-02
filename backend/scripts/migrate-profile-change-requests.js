/**
 * migrate-profile-change-requests.js - CITAMED.VE
 * Mi cuenta - Solicitudes de cambio de datos protegidos (nombre, cédula, MPPS)
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS profile_change_requests (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        field VARCHAR(40) NOT NULL,
        current_value VARCHAR(255),
        requested_value VARCHAR(255) NOT NULL,
        reason TEXT NOT NULL,
        status VARCHAR(12) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
        reviewed_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        reviewed_at TIMESTAMPTZ,
        review_note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS profile_change_requests_user_idx ON profile_change_requests (user_id, created_at DESC);
    `);
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS profile_change_requests_status_idx ON profile_change_requests (status, created_at);
    `);
    await db.sequelize.query(`ALTER TABLE profile_change_requests ENABLE ROW LEVEL SECURITY;`);

    console.log('✅ Migration for profile_change_requests completed successfully!');
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

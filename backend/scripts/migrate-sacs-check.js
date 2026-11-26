/**
 * migrate-sacs-check.js - CITAMED.VE
 * Verificación del médico por el SACS: guarda en cada solicitud el último resultado de la
 * consulta al SACS (columna verification_requests.sacs_check).
 * Solo corre contra la base de Pruebas. En producción se aplica su SQL a mano al liberar:
 *   ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS sacs_check JSONB;
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  try {
    const user = process.env.DB_USER || '';
    if (!user.endsWith('bvdjfxihcohexgvtyhto')) {
      console.error('ABORTADO: Esta migración solo debe ejecutarse contra la base de Pruebas (bvdjfxihcohexgvtyhto).');
      process.exit(1);
    }
    await db.sequelize.authenticate();
    await db.sequelize.query('ALTER TABLE verification_requests ADD COLUMN IF NOT EXISTS sacs_check JSONB;');
    console.log('  Columna verification_requests.sacs_check creada/verificada');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

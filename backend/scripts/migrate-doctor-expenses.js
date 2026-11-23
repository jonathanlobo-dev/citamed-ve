/**
 * migrate-doctor-expenses.js - CITAMED.VE
 * Reportes del médico - Tabla de egresos del consultorio (doctor_expenses)
 * Solo corre contra la base de Pruebas. En producción se aplica su SQL a mano al liberar.
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
      console.error('ABORTADO: Esta migración solo debe ejecutarse contra la base de Pruebas (bvdjfxihcohexgvtyhto).');
      console.error(`DB_HOST: ${host}, DB_USER: ${user.slice(-20)}`);
      process.exit(1);
    }

    await db.sequelize.authenticate();
    console.log('Connected to database. Running migration...');

    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_expenses (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES users(id),
        description VARCHAR(150) NOT NULL,
        category VARCHAR(30) NOT NULL CHECK (category IN ('alquiler', 'servicios_publicos', 'insumos', 'nomina', 'equipos', 'mantenimiento', 'impuestos', 'marketing', 'otro')),
        amount NUMERIC(14, 2) NOT NULL CHECK (amount > 0),
        currency VARCHAR(3) NOT NULL DEFAULT 'USD' CHECK (currency IN ('USD', 'VES')),
        exchange_rate NUMERIC(14, 4) CHECK (exchange_rate IS NULL OR exchange_rate > 0),
        amount_usd NUMERIC(12, 2) NOT NULL CHECK (amount_usd >= 0),
        method VARCHAR(20) NOT NULL DEFAULT 'efectivo' CHECK (method IN ('efectivo', 'pago_movil', 'transferencia', 'zelle', 'tarjeta', 'otro')),
        expense_date DATE NOT NULL,
        notes VARCHAR(300),
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  Table doctor_expenses created/verified');

    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS doctor_expenses_doctor_date_idx
        ON doctor_expenses (doctor_id, expense_date);
    `);
    console.log('  Index doctor_expenses_doctor_date_idx created/verified');

    // Toda tabla nueva con RLS (el servidor entra con rol propietario, no la afecta)
    await db.sequelize.query('ALTER TABLE doctor_expenses ENABLE ROW LEVEL SECURITY;');
    console.log('  Row Level Security enabled for doctor_expenses');

    console.log('Migration for doctor_expenses completed successfully!');
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

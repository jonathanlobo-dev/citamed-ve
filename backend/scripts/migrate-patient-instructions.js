/**
 * migrate-patient-instructions.js - CITAMED.VE
 * Semana 9 / Bloque D: Agregar columna patient_instructions a la tabla prescriptions
 *
 * REGLAS DE SEGURIDAD OBLIGATORIAS:
 * - NO se ejecuta en producción.
 * - Verifica que DB_USER termine exactamente en 'bvdjfxihcohexgvtyhto' (Pruebas).
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Sequelize } = require('sequelize');

const EXPECTED_USER_SUFFIX = 'bvdjfxihcohexgvtyhto';

async function runMigration() {
  const dbUser = process.env.DB_USER || '';
  console.log('----------------------------------------------------');
  console.log('Verificando base de datos de destino...');
  console.log(`DB_USER actual: ...${dbUser.slice(-20)}`);

  if (!dbUser.endsWith(EXPECTED_USER_SUFFIX)) {
    console.error(`ABORTANDO: La base de datos no es la de Pruebas (sufijo no coincide con ${EXPECTED_USER_SUFFIX}).`);
    process.exit(1);
  }

  console.log('Confirmado: Base de datos de Pruebas (bvdjfxihcohexgvtyhto).');
  console.log('----------------------------------------------------');

  const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 5432,
      dialect: 'postgres',
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      },
      logging: console.log
    }
  );

  try {
    await sequelize.authenticate();
    console.log('Conexión establecida con PostgreSQL.');

    const sql = `ALTER TABLE "prescriptions" ADD COLUMN IF NOT EXISTS "patient_instructions" TEXT;`;

    console.log('\nEjecutando SQL:');
    console.log(sql);
    await sequelize.query(sql);

    console.log('\nMigración completada con éxito.');
  } catch (error) {
    console.error('Error durante la migración:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

if (require.main === module) {
  runMigration();
}

module.exports = { runMigration };

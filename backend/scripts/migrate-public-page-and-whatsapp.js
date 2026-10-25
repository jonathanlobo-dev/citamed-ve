/**
 * migrate-public-page-and-whatsapp.js - CITAMED.VE
 * Semana 9 / Bloques B y C - Página pública del médico (publicSlug) y confirmación de citas (confirmationToken, confirmedVia)
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const db = require('../src/models');

function generateSlug(firstName, lastName) {
  const clean = `${firstName || ''} ${lastName || ''}`
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Quitar tildes
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-') // Reemplazar caracteres no alfanuméricos por guion
    .replace(/^-+|-+$/g, ''); // Quitar guiones al inicio o final
  return clean || 'medico';
}

async function migrate() {
  console.log('Verificando conexión con la base de datos...');
  try {
    const user = process.env.DB_USER || '';
    const userSuffix = user.slice(-20);
    console.log(`[Seguridad] Verificando sufijo de DB_USER: ...${userSuffix}`);

    if (!user.endsWith('bvdjfxihcohexgvtyhto')) {
      console.error('❌ ABORTADO: Esta migración solo debe ejecutarse contra la base de Pruebas (bvdjfxihcohexgvtyhto).');
      process.exit(1);
    }

    await db.sequelize.authenticate();
    console.log('Conexión con Postgres Pruebas verificada. Ejecutando migración...');

    // 1. Columna publicSlug en doctor_profiles (Bloque B)
    await db.sequelize.query(`
      ALTER TABLE "doctor_profiles" 
      ADD COLUMN IF NOT EXISTS "publicSlug" VARCHAR(60) UNIQUE;
    `);
    console.log('  ✅ Columna doctor_profiles."publicSlug" creada o verificada');

    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_doctor_profiles_public_slug" 
      ON "doctor_profiles" ("publicSlug");
    `);
    console.log('  ✅ Índice único idx_doctor_profiles_public_slug creado o verificado');

    // 2. Columnas confirmationToken y confirmedVia en appointments (Bloque C)
    await db.sequelize.query(`
      ALTER TABLE "appointments" 
      ADD COLUMN IF NOT EXISTS "confirmationToken" VARCHAR(40) UNIQUE;
    `);
    console.log('  ✅ Columna appointments."confirmationToken" creada o verificada');

    await db.sequelize.query(`
      ALTER TABLE "appointments" 
      ADD COLUMN IF NOT EXISTS "confirmedVia" VARCHAR(20);
    `);
    console.log('  ✅ Columna appointments."confirmedVia" creada o verificada');

    await db.sequelize.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "idx_appointments_confirmation_token" 
      ON "appointments" ("confirmationToken");
    `);
    console.log('  ✅ Índice único idx_appointments_confirmation_token creado o verificado');

    // 3. Backfill de publicSlug para perfiles existentes que no lo tengan
    const [doctors] = await db.sequelize.query(`
      SELECT id, "firstName", "lastName", "publicSlug" 
      FROM "doctor_profiles" 
      WHERE "publicSlug" IS NULL;
    `);

    console.log(`  🔍 Encontrados ${doctors.length} perfiles médicos sin publicSlug`);
    for (const doc of doctors) {
      const baseSlug = generateSlug(doc.firstName, doc.lastName);
      let candidate = baseSlug;
      let counter = 1;

      // Verificar unicidad
      while (true) {
        const [existing] = await db.sequelize.query(
          `SELECT id FROM "doctor_profiles" WHERE "publicSlug" = :slug AND id != :id;`,
          { replacements: { slug: candidate, id: doc.id } }
        );
        if (existing.length === 0) break;
        counter++;
        candidate = `${baseSlug}-${counter}`;
      }

      await db.sequelize.query(
        `UPDATE "doctor_profiles" SET "publicSlug" = :slug WHERE id = :id;`,
        { replacements: { slug: candidate, id: doc.id } }
      );
      console.log(`     -> Doctor Profile ID ${doc.id} (${doc.firstName} ${doc.lastName}) asignado slug: "${candidate}"`);
    }

    console.log('✅ Migración de Bloques B y C completada exitosamente.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error ejecutando migración:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  migrate();
}

module.exports = { migrate, generateSlug };

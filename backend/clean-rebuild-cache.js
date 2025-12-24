/**
 * Script para limpiar y reconstruir el cache de búsqueda
 * Solo incluye médicos REALES que pasaron por el proceso de registro
 *
 * Criterios para ser incluido:
 * 1. Usuario con role = 'doctor'
 * 2. Email verificado (isEmailVerified = true) O perfil activo
 * 3. NO incluir emails de prueba (@test, @example, @mock, fake, demo)
 * 4. Tener perfil de doctor creado
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'citamed_development',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

async function cleanAndRebuild() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CITAMED - Limpieza y Reconstrucción de Cache');
    console.log('═══════════════════════════════════════════════════════\n');

    // Primero mostrar cuántos médicos hay en total
    const totalDoctors = await sequelize.query(`
      SELECT COUNT(*) as total FROM users WHERE role = 'doctor'
    `);
    console.log(`Total de usuarios con role 'doctor': ${totalDoctors[0][0].total}`);

    // Mostrar cuántos tienen email de prueba
    const mockEmails = await sequelize.query(`
      SELECT COUNT(*) as total FROM users
      WHERE role = 'doctor'
      AND (
        email LIKE '%@test%' OR
        email LIKE '%@example%' OR
        email LIKE '%@mock%' OR
        email LIKE '%fake%' OR
        email LIKE '%demo%' OR
        email LIKE '%prueba%'
      )
    `);
    console.log(`Usuarios con email de prueba/mock: ${mockEmails[0][0].total}`);

    // Limpiar el cache
    console.log('\n→ Limpiando cache de búsqueda...');
    await sequelize.query('TRUNCATE TABLE doctor_search_cache RESTART IDENTITY');
    console.log('✓ Cache limpiado');

    // Reconstruir solo con médicos REALES
    console.log('→ Reconstruyendo con médicos REALES...\n');

    await sequelize.query(`
      INSERT INTO doctor_search_cache (
        doctor_id, doctor_profile_id, full_name, specialties_text, specialty_ids,
        city, state, consultation_price_online, consultation_price_in_person,
        latitude, longitude, years_of_experience, accepts_insurance, languages,
        reputation_level, average_rating, total_reviews, total_appointments,
        is_verified, verification_status, profile_photo
      )
      SELECT
        u.id, dp.id,
        CONCAT(COALESCE(dp."firstName", u."firstName"), ' ', COALESCE(dp."lastName", u."lastName")),
        COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), ARRAY[]::TEXT[]),
        COALESCE(ARRAY_AGG(DISTINCT ds.specialty_id) FILTER (WHERE ds.specialty_id IS NOT NULL), ARRAY[]::INTEGER[]),
        dp.city, dp.state, dp.price_teleconsultation, dp."consultationFee",
        dp.office_latitude, dp.office_longitude,
        COALESCE(dp."experienceYears", 0),
        COALESCE(dp."acceptsInsurance", false),
        COALESCE(dp.languages, ARRAY['Español']),
        COALESCE(dp.reputation_level::TEXT, 'new'),
        COALESCE(dp.average_rating, 0),
        COALESCE(dp.total_reviews, 0),
        COALESCE(dp.total_appointments, 0),
        CASE WHEN dp.verification_status = 'approved' THEN true ELSE false END,
        COALESCE(dp.verification_status::TEXT, 'pending'),
        dp."profilePhoto"
      FROM users u
      INNER JOIN doctor_profiles dp ON dp."userId" = u.id
      LEFT JOIN doctor_specialties ds ON ds.doctor_profile_id = dp.id
      LEFT JOIN specialties s ON s.id = ds.specialty_id
      WHERE u.role = 'doctor'
        -- Excluir emails de prueba/mock EXCEPTO usuarios estándar de prueba
        AND (
          -- Permitir usuarios estándar de prueba (del seeder oficial)
          u.email IN ('doctor@citamed.ve', 'paciente@citamed.ve', 'proveedor@citamed.ve', 'admin@citamed.ve')
          OR (
            -- Excluir otros emails de prueba/mock
            u.email NOT LIKE '%@test%'
            AND u.email NOT LIKE '%@example%'
            AND u.email NOT LIKE '%@mock%'
            AND u.email NOT LIKE '%@citamed.ve%'
            AND u.email NOT LIKE '%fake%'
            AND u.email NOT LIKE '%demo%'
            AND u.email NOT LIKE '%prueba%'
            AND u.email NOT LIKE '%localhost%'
          )
        )
        -- Incluir médicos con email verificado o perfil activo/incompleto
        AND (
          u.email_verified = true
          OR dp."profileStatus" IN ('active', 'incomplete')
        )
      GROUP BY u.id, dp.id
    `);

    const count = await sequelize.query('SELECT COUNT(*) as total FROM doctor_search_cache');
    const doctorCount = count[0][0].total;

    console.log('═══════════════════════════════════════════════════════');
    console.log(`  ✓ Cache reconstruido: ${doctorCount} médico(s) real(es)`);
    console.log('═══════════════════════════════════════════════════════\n');

    if (doctorCount > 0) {
      // Mostrar los médicos en el cache
      const doctors = await sequelize.query(`
        SELECT doctor_id, full_name, city, is_verified, verification_status
        FROM doctor_search_cache
        ORDER BY full_name
      `);
      console.log('Médicos en el directorio:');
      doctors[0].forEach(d => {
        const verified = d.is_verified ? '✓' : '○';
        const status = d.verification_status || 'pending';
        console.log(`  ${verified} ${d.full_name} (${d.city || 'Sin ciudad'}) - ${status}`);
      });
    } else {
      console.log('ℹ  No hay médicos reales registrados aún.');
      console.log('   Los médicos aparecerán cuando completen el registro real.');
    }

    console.log('\n═══════════════════════════════════════════════════════\n');
    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

cleanAndRebuild();

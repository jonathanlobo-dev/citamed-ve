/**
 * Migration Script: Doctor Search Cache
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Creates doctor_search_cache table for optimized search
 *
 * Run: node create-search-cache-table.js
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
    logging: console.log
  }
);

async function runMigration() {
  try {
    console.log('Starting Search Cache Migration...\n');
    await sequelize.authenticate();
    console.log('Database connection established\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Create doctor_search_cache table
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 1: Creating doctor_search_cache table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_search_cache (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        doctor_profile_id INTEGER REFERENCES doctor_profiles(id) ON DELETE CASCADE,

        -- Datos denormalizados para busqueda rapida
        full_name TEXT,
        specialties_text TEXT[],
        specialty_ids INTEGER[],
        city TEXT,
        state TEXT,
        country TEXT DEFAULT 'Venezuela',

        -- Precios
        consultation_price_online DECIMAL(10,2),
        consultation_price_in_person DECIMAL(10,2),

        -- Geolocalizacion
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),

        -- Metadatos del medico
        years_of_experience INTEGER DEFAULT 0,
        accepts_insurance BOOLEAN DEFAULT false,
        insurance_names TEXT[],
        languages TEXT[] DEFAULT ARRAY['Espanol'],
        gender TEXT,

        -- Reputacion
        reputation_level TEXT DEFAULT 'new',
        average_rating DECIMAL(3,2) DEFAULT 0,
        total_reviews INTEGER DEFAULT 0,
        total_appointments INTEGER DEFAULT 0,

        -- Disponibilidad
        has_availability BOOLEAN DEFAULT true,
        next_available_date DATE,
        accepts_new_patients BOOLEAN DEFAULT true,

        -- Verificacion
        is_verified BOOLEAN DEFAULT false,
        verification_status TEXT DEFAULT 'unverified',

        -- Foto de perfil
        profile_photo TEXT,

        -- Timestamps
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(doctor_id)
      );
    `);
    console.log('  doctor_search_cache table created');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Create indexes for optimized search
    // ═══════════════════════════════════════════════════════════════
    console.log('\nStep 2: Creating indexes...');

    // GIN index for specialties array
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_specialties
      ON doctor_search_cache USING GIN(specialties_text);
    `);
    console.log('  idx_search_specialties index created');

    // Location indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_city
      ON doctor_search_cache(LOWER(city));
    `);
    console.log('  idx_search_city index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_state
      ON doctor_search_cache(LOWER(state));
    `);
    console.log('  idx_search_state index created');

    // Geographic index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_geo
      ON doctor_search_cache(latitude, longitude);
    `);
    console.log('  idx_search_geo index created');

    // Price indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_price_online
      ON doctor_search_cache(consultation_price_online);
    `);
    console.log('  idx_search_price_online index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_price_in_person
      ON doctor_search_cache(consultation_price_in_person);
    `);
    console.log('  idx_search_price_in_person index created');

    // Rating and experience indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_rating
      ON doctor_search_cache(average_rating DESC);
    `);
    console.log('  idx_search_rating index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_experience
      ON doctor_search_cache(years_of_experience DESC);
    `);
    console.log('  idx_search_experience index created');

    // Reputation level index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_reputation
      ON doctor_search_cache(reputation_level);
    `);
    console.log('  idx_search_reputation index created');

    // Insurance index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_insurance
      ON doctor_search_cache(accepts_insurance);
    `);
    console.log('  idx_search_insurance index created');

    // Verification index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_verified
      ON doctor_search_cache(is_verified);
    `);
    console.log('  idx_search_verified index created');

    // Full text search index
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_search_fullname
      ON doctor_search_cache USING GIN(to_tsvector('spanish', COALESCE(full_name, '')));
    `);
    console.log('  idx_search_fullname index created');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create function to update search cache
    // ═══════════════════════════════════════════════════════════════
    console.log('\nStep 3: Creating update function...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_doctor_search_cache(p_doctor_id INTEGER)
      RETURNS VOID AS $$
      BEGIN
        INSERT INTO doctor_search_cache (
          doctor_id,
          doctor_profile_id,
          full_name,
          specialties_text,
          specialty_ids,
          city,
          state,
          consultation_price_online,
          consultation_price_in_person,
          latitude,
          longitude,
          years_of_experience,
          accepts_insurance,
          languages,
          reputation_level,
          average_rating,
          total_reviews,
          total_appointments,
          is_verified,
          verification_status,
          profile_photo,
          last_updated
        )
        SELECT
          u.id as doctor_id,
          dp.id as doctor_profile_id,
          CONCAT(COALESCE(dp."firstName", u."firstName"), ' ', COALESCE(dp."lastName", u."lastName")) as full_name,
          COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), ARRAY[]::TEXT[]) as specialties_text,
          COALESCE(ARRAY_AGG(DISTINCT ds.specialty_id) FILTER (WHERE ds.specialty_id IS NOT NULL), ARRAY[]::INTEGER[]) as specialty_ids,
          dp.city,
          dp.state,
          dp.price_teleconsultation,
          dp."consultationFee",
          dp.office_latitude,
          dp.office_longitude,
          COALESCE(dp."experienceYears", 0),
          COALESCE(dp."acceptsInsurance", false),
          COALESCE(dp.languages, ARRAY['Espanol']),
          COALESCE(dp.reputation_level::TEXT, 'new'),
          COALESCE(dp.average_rating, 0),
          COALESCE(dp.total_reviews, 0),
          COALESCE(dp.total_appointments, 0),
          CASE WHEN dp.verification_status = 'approved' THEN true ELSE false END,
          dp.verification_status::TEXT,
          dp."profilePhoto",
          CURRENT_TIMESTAMP
        FROM users u
        INNER JOIN doctor_profiles dp ON dp."userId" = u.id
        LEFT JOIN doctor_specialties ds ON ds.doctor_profile_id = dp.id
        LEFT JOIN specialties s ON s.id = ds.specialty_id
        WHERE u.id = p_doctor_id
          AND u.role = 'doctor'
        GROUP BY u.id, dp.id, u."firstName", u."lastName", dp."firstName", dp."lastName",
                 dp.city, dp.state, dp.price_teleconsultation, dp."consultationFee",
                 dp.office_latitude, dp.office_longitude, dp."experienceYears", dp."acceptsInsurance",
                 dp.languages, dp.reputation_level, dp.average_rating,
                 dp.total_reviews, dp.total_appointments, dp.verification_status, dp."profilePhoto"
        ON CONFLICT (doctor_id) DO UPDATE SET
          doctor_profile_id = EXCLUDED.doctor_profile_id,
          full_name = EXCLUDED.full_name,
          specialties_text = EXCLUDED.specialties_text,
          specialty_ids = EXCLUDED.specialty_ids,
          city = EXCLUDED.city,
          state = EXCLUDED.state,
          consultation_price_online = EXCLUDED.consultation_price_online,
          consultation_price_in_person = EXCLUDED.consultation_price_in_person,
          latitude = EXCLUDED.latitude,
          longitude = EXCLUDED.longitude,
          years_of_experience = EXCLUDED.years_of_experience,
          accepts_insurance = EXCLUDED.accepts_insurance,
          languages = EXCLUDED.languages,
          reputation_level = EXCLUDED.reputation_level,
          average_rating = EXCLUDED.average_rating,
          total_reviews = EXCLUDED.total_reviews,
          total_appointments = EXCLUDED.total_appointments,
          is_verified = EXCLUDED.is_verified,
          verification_status = EXCLUDED.verification_status,
          profile_photo = EXCLUDED.profile_photo,
          last_updated = CURRENT_TIMESTAMP;
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('  update_doctor_search_cache function created');

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Create trigger to auto-update cache
    // ═══════════════════════════════════════════════════════════════
    console.log('\nStep 4: Creating triggers...');

    await sequelize.query(`
      CREATE OR REPLACE FUNCTION trigger_update_search_cache()
      RETURNS TRIGGER AS $$
      DECLARE
        v_doctor_id INTEGER;
      BEGIN
        IF TG_TABLE_NAME = 'doctor_profiles' THEN
          v_doctor_id := COALESCE(NEW."userId", OLD."userId");
        ELSIF TG_TABLE_NAME = 'doctor_specialties' THEN
          -- Get userId from doctor_profiles using doctor_profile_id
          SELECT "userId" INTO v_doctor_id
          FROM doctor_profiles
          WHERE id = COALESCE(NEW.doctor_profile_id, OLD.doctor_profile_id);
        ELSE
          v_doctor_id := COALESCE(NEW.id, OLD.id);
        END IF;

        IF v_doctor_id IS NOT NULL THEN
          PERFORM update_doctor_search_cache(v_doctor_id);
        END IF;

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('  trigger_update_search_cache function created');

    // Trigger on doctor_profiles
    await sequelize.query(`
      DROP TRIGGER IF EXISTS trg_doctor_profiles_search_cache ON doctor_profiles;
    `);
    await sequelize.query(`
      CREATE TRIGGER trg_doctor_profiles_search_cache
      AFTER INSERT OR UPDATE ON doctor_profiles
      FOR EACH ROW
      EXECUTE FUNCTION trigger_update_search_cache();
    `);
    console.log('  trigger on doctor_profiles created');

    // Trigger on doctor_specialties
    await sequelize.query(`
      DROP TRIGGER IF EXISTS trg_doctor_specialties_search_cache ON doctor_specialties;
    `);
    await sequelize.query(`
      CREATE TRIGGER trg_doctor_specialties_search_cache
      AFTER INSERT OR UPDATE OR DELETE ON doctor_specialties
      FOR EACH ROW
      EXECUTE FUNCTION trigger_update_search_cache();
    `);
    console.log('  trigger on doctor_specialties created');

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Populate initial cache
    // ═══════════════════════════════════════════════════════════════
    console.log('\nStep 5: Populating initial cache...');

    await sequelize.query(`
      INSERT INTO doctor_search_cache (
        doctor_id,
        doctor_profile_id,
        full_name,
        specialties_text,
        specialty_ids,
        city,
        state,
        consultation_price_online,
        consultation_price_in_person,
        latitude,
        longitude,
        years_of_experience,
        accepts_insurance,
        languages,
        reputation_level,
        average_rating,
        total_reviews,
        total_appointments,
        is_verified,
        verification_status,
        profile_photo
      )
      SELECT
        u.id as doctor_id,
        dp.id as doctor_profile_id,
        CONCAT(COALESCE(dp."firstName", u."firstName"), ' ', COALESCE(dp."lastName", u."lastName")) as full_name,
        COALESCE(ARRAY_AGG(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), ARRAY[]::TEXT[]) as specialties_text,
        COALESCE(ARRAY_AGG(DISTINCT ds.specialty_id) FILTER (WHERE ds.specialty_id IS NOT NULL), ARRAY[]::INTEGER[]) as specialty_ids,
        dp.city,
        dp.state,
        dp.price_teleconsultation,
        dp."consultationFee",
        dp.office_latitude,
        dp.office_longitude,
        COALESCE(dp."experienceYears", 0),
        COALESCE(dp."acceptsInsurance", false),
        COALESCE(dp.languages, ARRAY['Espanol']),
        COALESCE(dp.reputation_level::TEXT, 'new'),
        COALESCE(dp.average_rating, 0),
        COALESCE(dp.total_reviews, 0),
        COALESCE(dp.total_appointments, 0),
        CASE WHEN dp.verification_status = 'approved' THEN true ELSE false END,
        dp.verification_status::TEXT,
        dp."profilePhoto"
      FROM users u
      INNER JOIN doctor_profiles dp ON dp."userId" = u.id
      LEFT JOIN doctor_specialties ds ON ds.doctor_profile_id = dp.id
      LEFT JOIN specialties s ON s.id = ds.specialty_id
      WHERE u.role = 'doctor'
      GROUP BY u.id, dp.id, u."firstName", u."lastName", dp."firstName", dp."lastName",
               dp.city, dp.state, dp.price_teleconsultation, dp."consultationFee",
               dp.office_latitude, dp.office_longitude, dp."experienceYears", dp."acceptsInsurance",
               dp.languages, dp.reputation_level, dp.average_rating,
               dp.total_reviews, dp.total_appointments, dp.verification_status, dp."profilePhoto"
      ON CONFLICT (doctor_id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        specialties_text = EXCLUDED.specialties_text,
        last_updated = CURRENT_TIMESTAMP;
    `);

    const result = await sequelize.query('SELECT COUNT(*) as count FROM doctor_search_cache');
    console.log(`  Cache populated with ${result[0][0].count} doctors`);

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('SEARCH CACHE MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nCreated:');
    console.log('  - doctor_search_cache table');
    console.log('  - 11 indexes for optimized search');
    console.log('  - update_doctor_search_cache function');
    console.log('  - Auto-update triggers on doctor_profiles and doctor_specialties');
    console.log('\n');

  } catch (error) {
    console.error('Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();

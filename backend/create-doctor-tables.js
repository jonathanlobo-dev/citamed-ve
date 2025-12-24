/**
 * CITAMED.VE - M02 Sub-Partida 3.1
 * Script de creación de tablas para Perfil Médico Completo
 *
 * Tablas: doctor_specialties, doctor_education, doctor_experience, doctor_availability
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function createDoctorTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!\n');

    // ═══════════════════════════════════════════════════════════════
    // TABLA 1: doctor_specialties (Many-to-Many doctors <-> specialties)
    // ═══════════════════════════════════════════════════════════════
    console.log('Creating doctor_specialties table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_specialties (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        specialty_id INTEGER NOT NULL REFERENCES specialties(id) ON DELETE CASCADE,
        is_primary BOOLEAN DEFAULT false,
        certification_date DATE,
        certification_number VARCHAR(100),
        certification_institution VARCHAR(200),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(doctor_profile_id, specialty_id)
      );
    `);

    // Índices para doctor_specialties
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_specialties_doctor ON doctor_specialties(doctor_profile_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_specialties_specialty ON doctor_specialties(specialty_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_specialties_primary ON doctor_specialties(doctor_profile_id, is_primary) WHERE is_primary = true;
    `);
    console.log('✅ doctor_specialties table ready');

    // ═══════════════════════════════════════════════════════════════
    // TABLA 2: doctor_education (Historial educativo)
    // ═══════════════════════════════════════════════════════════════
    console.log('Creating doctor_education table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_education (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        degree VARCHAR(200) NOT NULL,
        field_of_study VARCHAR(200),
        institution VARCHAR(200) NOT NULL,
        institution_city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Venezuela',
        start_year INTEGER NOT NULL,
        end_year INTEGER,
        is_in_progress BOOLEAN DEFAULT false,
        description TEXT,
        document_url VARCHAR(500),
        is_verified BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Índices para doctor_education
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_education_doctor ON doctor_education(doctor_profile_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_education_year ON doctor_education(end_year DESC NULLS FIRST);
    `);
    console.log('✅ doctor_education table ready');

    // ═══════════════════════════════════════════════════════════════
    // TABLA 3: doctor_experience (Experiencia laboral)
    // ═══════════════════════════════════════════════════════════════
    console.log('Creating doctor_experience table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_experience (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        position VARCHAR(200) NOT NULL,
        institution VARCHAR(200) NOT NULL,
        institution_type VARCHAR(50),
        city VARCHAR(100),
        country VARCHAR(100) DEFAULT 'Venezuela',
        start_date DATE NOT NULL,
        end_date DATE,
        is_current BOOLEAN DEFAULT false,
        description TEXT,
        achievements TEXT[],
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);

    // Índices para doctor_experience
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_experience_doctor ON doctor_experience(doctor_profile_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_experience_current ON doctor_experience(doctor_profile_id, is_current) WHERE is_current = true;
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_experience_dates ON doctor_experience(start_date DESC, end_date DESC NULLS FIRST);
    `);
    console.log('✅ doctor_experience table ready');

    // ═══════════════════════════════════════════════════════════════
    // TABLA 4: doctor_availability (Horarios de disponibilidad)
    // ═══════════════════════════════════════════════════════════════
    console.log('Creating doctor_availability table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_availability (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
        start_time TIME NOT NULL,
        end_time TIME NOT NULL,
        slot_duration INTEGER DEFAULT 30 CHECK (slot_duration > 0),
        is_active BOOLEAN DEFAULT true,
        location_name VARCHAR(200),
        location_address VARCHAR(300),
        consultation_type VARCHAR(50) DEFAULT 'presencial',
        max_patients INTEGER,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        CHECK (start_time < end_time)
      );
    `);

    // Índices para doctor_availability
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON doctor_availability(doctor_profile_id);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_availability_day ON doctor_availability(doctor_profile_id, day_of_week);
    `);
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_availability_active ON doctor_availability(doctor_profile_id, is_active) WHERE is_active = true;
    `);
    console.log('✅ doctor_availability table ready');

    // ═══════════════════════════════════════════════════════════════
    // EXPANDIR doctor_profiles con campos adicionales
    // ═══════════════════════════════════════════════════════════════
    console.log('Expanding doctor_profiles table...');

    // Agregar office_photos si no existe
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS office_photos JSONB DEFAULT '[]';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Agregar average_wait_time si no existe
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS average_wait_time INTEGER;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Agregar office_latitude si no existe (para búsquedas geoespaciales)
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS office_latitude DECIMAL(10,8);
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Agregar office_longitude si no existe
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles ADD COLUMN IF NOT EXISTS office_longitude DECIMAL(11,8);
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);

    // Índice geoespacial
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_location ON doctor_profiles(office_latitude, office_longitude)
      WHERE office_latitude IS NOT NULL AND office_longitude IS NOT NULL;
    `);

    // Índice por ciudad
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_city ON doctor_profiles(city);
    `);

    // Índice por tarifa
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_fee ON doctor_profiles(consultation_fee);
    `);

    console.log('✅ doctor_profiles expanded');

    // ═══════════════════════════════════════════════════════════════
    // CREAR FUNCIONES AUXILIARES
    // ═══════════════════════════════════════════════════════════════
    console.log('Creating helper functions...');

    // Función para calcular distancia (Haversine formula)
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION calculate_distance(
        lat1 DECIMAL, lon1 DECIMAL,
        lat2 DECIMAL, lon2 DECIMAL
      ) RETURNS DECIMAL AS $$
      DECLARE
        R DECIMAL := 6371; -- Radio de la Tierra en km
        dLat DECIMAL;
        dLon DECIMAL;
        a DECIMAL;
        c DECIMAL;
      BEGIN
        IF lat1 IS NULL OR lon1 IS NULL OR lat2 IS NULL OR lon2 IS NULL THEN
          RETURN NULL;
        END IF;

        dLat := radians(lat2 - lat1);
        dLon := radians(lon2 - lon1);

        a := sin(dLat/2) * sin(dLat/2) +
             cos(radians(lat1)) * cos(radians(lat2)) *
             sin(dLon/2) * sin(dLon/2);
        c := 2 * atan2(sqrt(a), sqrt(1-a));

        RETURN R * c;
      END;
      $$ LANGUAGE plpgsql IMMUTABLE;
    `);
    console.log('✅ calculate_distance function created');

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ All doctor profile tables created successfully!');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Mostrar resumen
    const tables = ['doctor_specialties', 'doctor_education', 'doctor_experience', 'doctor_availability'];
    for (const table of tables) {
      const [result] = await sequelize.query(`SELECT COUNT(*) as count FROM ${table}`);
      console.log(`📊 ${table}: ${result[0].count} records`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

createDoctorTables();

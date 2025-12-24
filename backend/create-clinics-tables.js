/**
 * CITAMED.VE - M02 Sub-Partida 3.6
 * Sistema de Clínicas y Organizaciones Médicas
 *
 * Script de migración para crear las tablas del sistema de clínicas
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

async function createClinicsTables() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CITAMED - Sistema de Clínicas y Organizaciones');
    console.log('  M02 Sub-Partida 3.6');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Tabla clinics (Organizaciones principales)
    console.log('→ Creando tabla clinics...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clinics (
        id SERIAL PRIMARY KEY,

        -- Información legal
        legal_name VARCHAR(255) NOT NULL,
        commercial_name VARCHAR(255) NOT NULL,
        tax_id VARCHAR(50) UNIQUE NOT NULL,

        -- Tipo de organización
        organization_type VARCHAR(50) NOT NULL CHECK (
          organization_type IN (
            'hospital',
            'clinica_privada',
            'centro_diagnostico',
            'laboratorio',
            'centro_especializado',
            'consultorio_multiple'
          )
        ),

        -- Contacto principal
        email VARCHAR(255) NOT NULL UNIQUE,
        phone VARCHAR(20),
        website VARCHAR(255),

        -- Administrador de la cuenta
        admin_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,

        -- Descripción
        description TEXT,
        mission TEXT,
        vision TEXT,

        -- Logo y branding
        logo_url VARCHAR(500),
        cover_image_url VARCHAR(500),
        primary_color VARCHAR(7),

        -- Verificación
        is_verified BOOLEAN DEFAULT false,
        verification_date TIMESTAMP,
        verified_by INTEGER REFERENCES users(id) ON DELETE SET NULL,

        -- Metadata
        total_locations INTEGER DEFAULT 0,
        total_doctors INTEGER DEFAULT 0,
        total_services INTEGER DEFAULT 0,

        -- Estado
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clinics_admin ON clinics(admin_user_id);
      CREATE INDEX IF NOT EXISTS idx_clinics_verified ON clinics(is_verified, is_active);
      CREATE INDEX IF NOT EXISTS idx_clinics_type ON clinics(organization_type);
    `);
    console.log('  ✓ Tabla clinics creada');

    // 2. Tabla clinic_locations (Sedes físicas)
    console.log('→ Creando tabla clinic_locations...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clinic_locations (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,

        -- Identificación de la sede
        name VARCHAR(255) NOT NULL,
        is_main BOOLEAN DEFAULT false,

        -- Dirección completa
        address_line1 VARCHAR(255) NOT NULL,
        address_line2 VARCHAR(255),
        city VARCHAR(100) NOT NULL,
        state VARCHAR(100) NOT NULL,
        postal_code VARCHAR(20),
        country VARCHAR(100) DEFAULT 'Venezuela',

        -- Geolocalización
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),

        -- Información de contacto
        phone VARCHAR(20),
        whatsapp VARCHAR(20),
        email VARCHAR(255),

        -- Horarios de atención (JSON)
        opening_hours JSONB,

        -- Instalaciones y servicios
        has_parking BOOLEAN DEFAULT false,
        has_emergency BOOLEAN DEFAULT false,
        has_pharmacy BOOLEAN DEFAULT false,
        has_laboratory BOOLEAN DEFAULT false,
        has_imaging BOOLEAN DEFAULT false,
        wheelchair_accessible BOOLEAN DEFAULT false,

        -- Capacidad
        total_consultation_rooms INTEGER,
        total_beds INTEGER,

        -- Estado
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clinic_locations_clinic ON clinic_locations(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_locations_city ON clinic_locations(city, state);
      CREATE INDEX IF NOT EXISTS idx_clinic_locations_geo ON clinic_locations(latitude, longitude);
      CREATE INDEX IF NOT EXISTS idx_clinic_locations_active ON clinic_locations(is_active);
    `);
    console.log('  ✓ Tabla clinic_locations creada');

    // 3. Tabla clinic_services (Servicios por sede)
    console.log('→ Creando tabla clinic_services...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clinic_services (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        location_id INTEGER REFERENCES clinic_locations(id) ON DELETE CASCADE,

        -- Información del servicio
        service_name VARCHAR(255) NOT NULL,
        service_category VARCHAR(100),
        description TEXT,

        -- Precio
        price DECIMAL(10,2),
        price_currency VARCHAR(10) DEFAULT 'USD',

        -- Duración estimada (en minutos)
        duration_minutes INTEGER,

        -- Requiere cita previa
        requires_appointment BOOLEAN DEFAULT true,

        -- Estado
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clinic_services_clinic ON clinic_services(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_services_location ON clinic_services(location_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_services_category ON clinic_services(service_category);
    `);
    console.log('  ✓ Tabla clinic_services creada');

    // 4. Tabla clinic_doctors (Médicos por sede)
    console.log('→ Creando tabla clinic_doctors...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clinic_doctors (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        location_id INTEGER REFERENCES clinic_locations(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Relación laboral
        employment_type VARCHAR(50) CHECK (
          employment_type IN ('staff', 'visiting', 'partner', 'affiliated')
        ),

        -- Horarios de atención en esta sede (JSON)
        schedule JSONB,

        -- Consultorio asignado
        consultation_room VARCHAR(50),

        -- Servicios que ofrece en esta sede
        services_offered TEXT[],

        -- Estado
        is_active BOOLEAN DEFAULT true,
        start_date DATE,
        end_date DATE,

        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

        UNIQUE(clinic_id, doctor_id, location_id)
      );

      CREATE INDEX IF NOT EXISTS idx_clinic_doctors_clinic ON clinic_doctors(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_doctors_location ON clinic_doctors(location_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_doctors_doctor ON clinic_doctors(doctor_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_doctors_active ON clinic_doctors(is_active);
    `);
    console.log('  ✓ Tabla clinic_doctors creada');

    // 5. Tabla clinic_images (Galería)
    console.log('→ Creando tabla clinic_images...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS clinic_images (
        id SERIAL PRIMARY KEY,
        clinic_id INTEGER NOT NULL REFERENCES clinics(id) ON DELETE CASCADE,
        location_id INTEGER REFERENCES clinic_locations(id) ON DELETE CASCADE,

        -- Imagen
        image_url VARCHAR(500) NOT NULL,
        image_type VARCHAR(50) CHECK (
          image_type IN (
            'exterior',
            'reception',
            'consultation_room',
            'waiting_room',
            'equipment',
            'staff',
            'other'
          )
        ),

        -- Metadata
        title VARCHAR(255),
        description TEXT,
        display_order INTEGER DEFAULT 0,

        -- Estado
        is_featured BOOLEAN DEFAULT false,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_clinic_images_clinic ON clinic_images(clinic_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_images_location ON clinic_images(location_id);
      CREATE INDEX IF NOT EXISTS idx_clinic_images_order ON clinic_images(display_order);
    `);
    console.log('  ✓ Tabla clinic_images creada');

    // Verificar tablas creadas
    const tables = await sequelize.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name LIKE 'clinic%'
      ORDER BY table_name
    `);

    console.log('\n═══════════════════════════════════════════════════════');
    console.log('  ✅ SISTEMA DE CLÍNICAS CREADO EXITOSAMENTE');
    console.log('═══════════════════════════════════════════════════════');
    console.log('\nTablas creadas:');
    tables[0].forEach(t => console.log(`  - ${t.table_name}`));
    console.log('\n');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

createClinicsTables();

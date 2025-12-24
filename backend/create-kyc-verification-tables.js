/**
 * Migration Script: KYC Verification System
 * M02 Sub-Partida 3.3 - VERIFICACIÓN KYC MÉDICOS
 *
 * Creates tables and fields for doctor verification system:
 * - Adds verification fields to doctor_profiles
 * - Creates doctor_documents table
 * - Creates verification_requests table
 * - Creates necessary ENUMs
 *
 * Run: node create-kyc-verification-tables.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

// Debug: verificar variables
console.log('📋 Configuración de BD:');
console.log('  DB_HOST:', process.env.DB_HOST);
console.log('  DB_PORT:', process.env.DB_PORT);
console.log('  DB_NAME:', process.env.DB_NAME);
console.log('  DB_USER:', process.env.DB_USER);
console.log('  DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(vacío)');

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
    console.log('🚀 Starting KYC Verification Migration...\n');
    await sequelize.authenticate();
    console.log('✅ Database connection established\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Create ENUMs
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 1: Creating ENUMs...');

    // Verification Status ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE verification_status AS ENUM (
          'unverified',
          'pending',
          'approved',
          'rejected',
          'documents_incomplete'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ verification_status ENUM created');

    // Document Type ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE document_type AS ENUM (
          'medical_degree',
          'mpps_certificate',
          'professional_id',
          'national_id',
          'specialty_certificate',
          'other'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ document_type ENUM created');

    // Document Status ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE document_status AS ENUM (
          'pending',
          'approved',
          'rejected',
          'expired'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ document_status ENUM created');

    // Verification Request Status ENUM
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE verification_request_status AS ENUM (
          'submitted',
          'in_review',
          'approved',
          'rejected',
          'on_hold'
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  ✅ verification_request_status ENUM created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Add verification fields to doctor_profiles
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 2: Adding verification fields to doctor_profiles...');

    // Add verification_status column
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN verification_status verification_status NOT NULL DEFAULT 'unverified';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ verification_status column added');

    // Add verification_requested_at column
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN verification_requested_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ verification_requested_at column added');

    // Add verified_at column
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ verified_at column added');

    // Add verified_by column (FK to users)
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN verified_by INTEGER REFERENCES users(id);
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ verified_by column added');

    // Add verification_notes column
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN verification_notes TEXT;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ verification_notes column added');

    // Add rejection_reason column
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN rejection_reason TEXT;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  ✅ rejection_reason column added');

    // Create index on verification_status
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verification_status
      ON doctor_profiles(verification_status);
    `);
    console.log('  ✅ verification_status index created');

    // Create index on verified_at
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_verified_at
      ON doctor_profiles(verified_at);
    `);
    console.log('  ✅ verified_at index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create doctor_documents table
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 3: Creating doctor_documents table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS doctor_documents (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        document_type document_type NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size BIGINT,
        mime_type VARCHAR(100),
        uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        status document_status NOT NULL DEFAULT 'pending',
        reviewed_at TIMESTAMP WITH TIME ZONE,
        reviewed_by INTEGER REFERENCES users(id),
        review_notes TEXT,
        expiration_date DATE,
        metadata JSONB,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✅ doctor_documents table created');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_documents_doctor
      ON doctor_documents(doctor_profile_id);
    `);
    console.log('  ✅ doctor_profile_id index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_documents_type
      ON doctor_documents(doctor_profile_id, document_type);
    `);
    console.log('  ✅ document_type composite index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_documents_status
      ON doctor_documents(status);
    `);
    console.log('  ✅ status index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_documents_expiration
      ON doctor_documents(expiration_date);
    `);
    console.log('  ✅ expiration_date index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Create verification_requests table
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 4: Creating verification_requests table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS verification_requests (
        id SERIAL PRIMARY KEY,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        request_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        status verification_request_status NOT NULL DEFAULT 'submitted',
        assigned_to INTEGER REFERENCES users(id),
        priority INTEGER NOT NULL DEFAULT 0,
        completed_at TIMESTAMP WITH TIME ZONE,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  ✅ verification_requests table created');

    // Create indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_requests_doctor
      ON verification_requests(doctor_profile_id);
    `);
    console.log('  ✅ doctor_profile_id index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_requests_status
      ON verification_requests(status);
    `);
    console.log('  ✅ status index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_requests_assigned
      ON verification_requests(assigned_to);
    `);
    console.log('  ✅ assigned_to index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_verification_requests_priority
      ON verification_requests(priority DESC);
    `);
    console.log('  ✅ priority index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Migrate existing isVerified data (if column exists)
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 5: Migrating existing verification data...');

    try {
      // Check if is_verified column exists before trying to migrate
      const [columns] = await sequelize.query(`
        SELECT column_name FROM information_schema.columns
        WHERE table_name = 'doctor_profiles' AND column_name = 'is_verified';
      `);

      if (columns.length > 0) {
        await sequelize.query(`
          UPDATE doctor_profiles
          SET
            verification_status = 'approved',
            verified_at = COALESCE(verification_date, NOW())
          WHERE is_verified = true
            AND verification_status = 'unverified';
        `);
        console.log('  ✅ Migrated existing verified doctors');
      } else {
        console.log('  ⏭️  Column is_verified not found, skipping migration');
      }
    } catch (migrationError) {
      console.log('  ⏭️  Skipping migration step (column may not exist):', migrationError.message);
    }
    console.log('');

    // ═══════════════════════════════════════════════════════════════
    // STEP 6: Create uploads directory
    // ═══════════════════════════════════════════════════════════════
    console.log('📦 Step 6: Creating uploads directory...');

    const fs = require('fs');
    const path = require('path');

    const uploadsDir = path.join(__dirname, 'uploads', 'doctor-documents');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('  ✅ Created uploads/doctor-documents directory');
    } else {
      console.log('  ⏭️  uploads/doctor-documents directory already exists');
    }

    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ KYC VERIFICATION MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nCreated:');
    console.log('  - 4 ENUMs: verification_status, document_type, document_status, verification_request_status');
    console.log('  - 6 new columns in doctor_profiles');
    console.log('  - doctor_documents table with 4 indexes');
    console.log('  - verification_requests table with 4 indexes');
    console.log('  - uploads/doctor-documents directory');
    console.log('\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

runMigration();

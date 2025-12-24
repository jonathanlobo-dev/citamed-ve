/**
 * Migration Script: Sistema de Reputacion y Reviews
 * M02 Sub-Partida 3.4 - SISTEMA DE REPUTACION CON ESTRELLAS
 *
 * Creates tables and fields for doctor reputation system:
 * - Adds reputation fields to doctor_profiles
 * - Creates reviews table
 * - Creates review_helpful_votes table
 * - Creates necessary ENUMs and indexes
 *
 * Run: node create-reviews-tables.js
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
    console.log('Starting Reviews & Reputation Migration...\n');
    await sequelize.authenticate();
    console.log('Database connection established\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 1: Create reputation_level ENUM
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 1: Creating reputation_level ENUM...');

    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE reputation_level AS ENUM (
          'new',      -- 0-50 citas, sin requisitos
          'bronze',   -- 51-200 citas, rating >= 4.0
          'silver',   -- 201-500 citas, rating >= 4.3
          'gold',     -- 501-1000 citas, rating >= 4.5
          'platinum'  -- 1000+ citas, rating >= 4.7
        );
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  reputation_level ENUM created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 2: Add reputation fields to doctor_profiles
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 2: Adding reputation fields to doctor_profiles...');

    // averageRating - ya puede existir, verificar
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) NOT NULL DEFAULT 0.00;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  average_rating column added/verified');

    // totalReviews
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS total_reviews INTEGER NOT NULL DEFAULT 0;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  total_reviews column added/verified');

    // totalAppointments - para calcular nivel
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS total_appointments INTEGER NOT NULL DEFAULT 0;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  total_appointments column added/verified');

    // reputationLevel
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS reputation_level reputation_level NOT NULL DEFAULT 'new';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  reputation_level column added/verified');

    // levelUpdatedAt
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS level_updated_at TIMESTAMP WITH TIME ZONE;
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  level_updated_at column added/verified');

    // ratingBreakdown JSONB
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE doctor_profiles
        ADD COLUMN IF NOT EXISTS rating_breakdown JSONB DEFAULT '{"overall":{"1":0,"2":0,"3":0,"4":0,"5":0},"punctuality":{"1":0,"2":0,"3":0,"4":0,"5":0},"treatment":{"1":0,"2":0,"3":0,"4":0,"5":0},"clarity":{"1":0,"2":0,"3":0,"4":0,"5":0},"facilities":{"1":0,"2":0,"3":0,"4":0,"5":0}}';
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('  rating_breakdown column added/verified');

    // Indexes for doctor_profiles reputation
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_rating
      ON doctor_profiles(average_rating DESC);
    `);
    console.log('  idx_doctor_profiles_rating index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_level
      ON doctor_profiles(reputation_level);
    `);
    console.log('  idx_doctor_profiles_level index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_doctor_profiles_total_reviews
      ON doctor_profiles(total_reviews DESC);
    `);
    console.log('  idx_doctor_profiles_total_reviews index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 3: Create reviews table
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 3: Creating reviews table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
        doctor_profile_id INTEGER NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
        patient_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,

        -- Calificaciones por dimension (1-5)
        overall_rating SMALLINT NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
        punctuality_rating SMALLINT NOT NULL CHECK (punctuality_rating >= 1 AND punctuality_rating <= 5),
        treatment_rating SMALLINT NOT NULL CHECK (treatment_rating >= 1 AND treatment_rating <= 5),
        clarity_rating SMALLINT NOT NULL CHECK (clarity_rating >= 1 AND clarity_rating <= 5),
        facilities_rating SMALLINT NOT NULL CHECK (facilities_rating >= 1 AND facilities_rating <= 5),

        -- Comentarios
        comment TEXT,
        would_recommend BOOLEAN NOT NULL DEFAULT true,

        -- Verificacion
        is_verified BOOLEAN NOT NULL DEFAULT true,
        was_edited BOOLEAN NOT NULL DEFAULT false,
        edited_at TIMESTAMP WITH TIME ZONE,

        -- Respuesta del medico
        doctor_reply TEXT,
        doctor_replied_at TIMESTAMP WITH TIME ZONE,

        -- Moderacion
        is_flagged BOOLEAN NOT NULL DEFAULT false,
        flag_reason TEXT,
        is_hidden BOOLEAN NOT NULL DEFAULT false,

        -- Timestamps
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('  reviews table created');

    // Unique constraint on appointment_id (solo 1 review por cita)
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE reviews
        ADD CONSTRAINT reviews_appointment_unique UNIQUE (appointment_id);
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('  unique constraint on appointment_id added');

    // Indexes for reviews
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_doctor
      ON reviews(doctor_profile_id);
    `);
    console.log('  idx_reviews_doctor index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_patient
      ON reviews(patient_id);
    `);
    console.log('  idx_reviews_patient index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_rating
      ON reviews(overall_rating);
    `);
    console.log('  idx_reviews_rating index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_created
      ON reviews(created_at DESC);
    `);
    console.log('  idx_reviews_created index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_reviews_verified_visible
      ON reviews(doctor_profile_id, is_verified, is_hidden)
      WHERE is_hidden = false;
    `);
    console.log('  idx_reviews_verified_visible index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 4: Create review_helpful_votes table
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 4: Creating review_helpful_votes table...');

    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS review_helpful_votes (
        id SERIAL PRIMARY KEY,
        review_id INTEGER NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        is_helpful BOOLEAN NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

        -- Un usuario solo puede votar una vez por review
        UNIQUE (review_id, user_id)
      );
    `);
    console.log('  review_helpful_votes table created');

    // Indexes
    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_helpful_votes_review
      ON review_helpful_votes(review_id);
    `);
    console.log('  idx_helpful_votes_review index created');

    await sequelize.query(`
      CREATE INDEX IF NOT EXISTS idx_helpful_votes_user
      ON review_helpful_votes(user_id, review_id);
    `);
    console.log('  idx_helpful_votes_user index created\n');

    // ═══════════════════════════════════════════════════════════════
    // STEP 5: Create helper functions
    // ═══════════════════════════════════════════════════════════════
    console.log('Step 5: Creating helper functions...');

    // Function to update doctor rating after review
    await sequelize.query(`
      CREATE OR REPLACE FUNCTION update_doctor_rating()
      RETURNS TRIGGER AS $$
      DECLARE
        doc_id INTEGER;
        avg_rating DECIMAL(3,2);
        review_count INTEGER;
      BEGIN
        -- Get doctor_profile_id
        IF TG_OP = 'DELETE' THEN
          doc_id := OLD.doctor_profile_id;
        ELSE
          doc_id := NEW.doctor_profile_id;
        END IF;

        -- Calculate new average and count
        SELECT
          COALESCE(AVG(overall_rating), 0),
          COUNT(*)
        INTO avg_rating, review_count
        FROM reviews
        WHERE doctor_profile_id = doc_id
          AND is_hidden = false
          AND is_verified = true;

        -- Update doctor_profiles
        UPDATE doctor_profiles
        SET
          average_rating = avg_rating,
          total_reviews = review_count,
          updated_at = NOW()
        WHERE id = doc_id;

        RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);
    console.log('  update_doctor_rating function created');

    // Create trigger
    await sequelize.query(`
      DROP TRIGGER IF EXISTS trigger_update_doctor_rating ON reviews;
    `);
    await sequelize.query(`
      CREATE TRIGGER trigger_update_doctor_rating
      AFTER INSERT OR UPDATE OR DELETE ON reviews
      FOR EACH ROW
      EXECUTE FUNCTION update_doctor_rating();
    `);
    console.log('  trigger_update_doctor_rating trigger created\n');

    // ═══════════════════════════════════════════════════════════════
    // SUMMARY
    // ═══════════════════════════════════════════════════════════════
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('REVIEWS & REPUTATION MIGRATION COMPLETED SUCCESSFULLY!');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('\nCreated:');
    console.log('  - 1 ENUM: reputation_level (new, bronze, silver, gold, platinum)');
    console.log('  - 6 new columns in doctor_profiles');
    console.log('  - reviews table with 5 rating dimensions');
    console.log('  - review_helpful_votes table');
    console.log('  - Trigger for automatic rating updates');
    console.log('  - Multiple indexes for performance');
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

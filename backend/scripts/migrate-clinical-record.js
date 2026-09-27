require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Adding columns to appointments if not exist...');
    await db.sequelize.query(`
      ALTER TABLE "appointments"
        ADD COLUMN IF NOT EXISTS "soapNote" JSONB,
        ADD COLUMN IF NOT EXISTS "vitalSigns" JSONB,
        ADD COLUMN IF NOT EXISTS "physicalExam" JSONB,
        ADD COLUMN IF NOT EXISTS "clinicalNoteSavedAt" TIMESTAMPTZ;
    `);
    console.log('Columns added to appointments.');

    console.log('Creating table medical_documents if not exists...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "medical_documents" (
        "id" SERIAL PRIMARY KEY,
        "type" VARCHAR(30) NOT NULL,
        "appointment_id" INTEGER REFERENCES "appointments"("id") ON DELETE RESTRICT,
        "patient_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "doctor_id" INTEGER REFERENCES "users"("id") ON DELETE RESTRICT,
        "uploaded_by" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "title" VARCHAR(200) NOT NULL,
        "content" JSONB,
        "verification_code" VARCHAR(16) UNIQUE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "storage_path" TEXT,
        "mime_type" VARCHAR(100),
        "size_bytes" INTEGER,
        "created_at" TIMESTAMPTZ DEFAULT NOW(),
        "updated_at" TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('Table medical_documents created / verified.');

    console.log('Creating indexes if not exists...');
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_medical_documents_patient_id" ON "medical_documents"("patient_id");
      CREATE INDEX IF NOT EXISTS "idx_medical_documents_appointment_id" ON "medical_documents"("appointment_id");
      CREATE INDEX IF NOT EXISTS "idx_medical_documents_doctor_id" ON "medical_documents"("doctor_id");
    `);
    console.log('Indexes created / verified.');

    console.log('Enabling Row Level Security on medical_documents...');
    await db.sequelize.query(`
      ALTER TABLE "medical_documents" ENABLE ROW LEVEL SECURITY;
    `);
    console.log('Row Level Security enabled.');

    console.log('✅ Migration of clinical record completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    await db.sequelize.close();
  }
}

if (require.main === module) {
  migrate();
}

module.exports = migrate;

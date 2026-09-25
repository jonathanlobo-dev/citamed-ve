require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Creating table prescriptions if not exists...');
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS "prescriptions" (
        "id" SERIAL PRIMARY KEY,
        "appointment_id" INTEGER NOT NULL REFERENCES "appointments"("id") ON DELETE RESTRICT,
        "doctor_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "patient_id" INTEGER NOT NULL REFERENCES "users"("id") ON DELETE RESTRICT,
        "items" JSONB NOT NULL,
        "indications" TEXT,
        "verification_code" VARCHAR(32) NOT NULL UNIQUE,
        "status" VARCHAR(20) NOT NULL DEFAULT 'active',
        "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Table prescriptions created / verified.');

    console.log('Creating indexes if not exists...');
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "idx_prescriptions_appointment_id" ON "prescriptions"("appointment_id");
      CREATE INDEX IF NOT EXISTS "idx_prescriptions_doctor_id" ON "prescriptions"("doctor_id");
      CREATE INDEX IF NOT EXISTS "idx_prescriptions_patient_id" ON "prescriptions"("patient_id");
    `);
    console.log('Indexes created / verified.');

    console.log('Enabling Row Level Security on prescriptions...');
    await db.sequelize.query(`
      ALTER TABLE "prescriptions" ENABLE ROW LEVEL SECURITY;
    `);
    console.log('Row Level Security enabled.');

    console.log('✅ Migration of prescriptions completed successfully!');
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

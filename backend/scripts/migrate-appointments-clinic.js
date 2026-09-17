require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const db = require('../src/models');

async function migrate() {
  console.log('Connecting to database...');
  try {
    await db.sequelize.authenticate();
    console.log('Database connected successfully.');

    // Verificar columnas existentes en appointments
    const [columns] = await db.sequelize.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'appointments'
    `);
    
    console.log('Current columns count in appointments:', columns.length);
    const colNames = columns.map(c => c.column_name);

    if (!colNames.includes('clinicId')) {
      console.log('Adding "clinicId" column to appointments table...');
      await db.sequelize.query(`
        ALTER TABLE "appointments" 
        ADD COLUMN IF NOT EXISTS "clinicId" INTEGER REFERENCES "clinics"("id") ON DELETE SET NULL;
      `);
      console.log('Column "clinicId" added.');
    } else {
      console.log('Column "clinicId" already exists.');
    }

    if (!colNames.includes('locationId')) {
      console.log('Adding "locationId" column to appointments table...');
      await db.sequelize.query(`
        ALTER TABLE "appointments" 
        ADD COLUMN IF NOT EXISTS "locationId" INTEGER REFERENCES "clinic_locations"("id") ON DELETE SET NULL;
      `);
      console.log('Column "locationId" added.');
    } else {
      console.log('Column "locationId" already exists.');
    }

    // Also check index
    await db.sequelize.query(`
      CREATE INDEX IF NOT EXISTS "appointments_clinic_id_idx" ON "appointments"("clinicId");
      CREATE INDEX IF NOT EXISTS "appointments_location_id_idx" ON "appointments"("locationId");
    `);
    console.log('Indexes created/verified.');

    // Ensure 'scheduled' is in enum_appointments_status if enum is used
    try {
      await db.sequelize.query(`ALTER TYPE "enum_appointments_status" ADD VALUE IF NOT EXISTS 'scheduled';`);
      console.log('Added "scheduled" to enum_appointments_status successfully.');
    } catch (enumErr) {
      console.log('enum_appointments_status note:', enumErr.message);
    }

    console.log('✅ Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await db.sequelize.close();
  }
}

migrate();

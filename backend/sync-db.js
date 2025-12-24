require('dotenv').config();
const db = require('./src/models');

async function syncDatabase() {
  try {
    console.log('Connecting to database...');
    await db.sequelize.authenticate();
    console.log('Connected. Syncing tables...');

    // Sync all models with alter (safe update)
    await db.sequelize.sync({ alter: true });

    console.log('Database synced successfully!');

    // Check if audit_logs table exists
    const [results] = await db.sequelize.query(
      "SELECT table_name FROM information_schema.tables WHERE table_name = 'audit_logs'"
    );

    if (results.length > 0) {
      console.log('✅ audit_logs table exists');
    } else {
      console.log('❌ audit_logs table does NOT exist');
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

syncDatabase();

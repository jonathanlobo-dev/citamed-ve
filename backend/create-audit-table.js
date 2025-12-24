require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

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

async function createMissingTables() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Connected!\n');

    // === USER_SESSIONS TABLE ===
    console.log('Checking user_sessions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash VARCHAR(255) NOT NULL,
        device_type VARCHAR(20),
        device_name VARCHAR(100),
        browser VARCHAR(50),
        os VARCHAR(50),
        ip_address VARCHAR(45),
        location VARCHAR(100),
        user_agent TEXT,
        last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        revoked_at TIMESTAMP WITH TIME ZONE,
        revoked_reason VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ user_sessions table ready');

    // === LOGIN_HISTORY TABLE ===
    console.log('Checking login_history table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        device_type VARCHAR(20),
        browser VARCHAR(50),
        os VARCHAR(50),
        location VARCHAR(100),
        success BOOLEAN NOT NULL DEFAULT false,
        failure_reason VARCHAR(100),
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ login_history table ready');

    // === VERIFICATION_TOKENS TABLE ===
    console.log('Checking verification_tokens table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS verification_tokens (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) NOT NULL UNIQUE,
        code VARCHAR(10),
        type VARCHAR(20) NOT NULL,
        contact_value VARCHAR(255),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        verified_at TIMESTAMP WITH TIME ZONE,
        attempts INTEGER DEFAULT 0,
        max_attempts INTEGER DEFAULT 5,
        ip_address VARCHAR(45),
        user_agent TEXT,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ verification_tokens table ready');

    // === TWO_FACTOR_ATTEMPTS TABLE ===
    console.log('Checking two_factor_attempts table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS two_factor_attempts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        method VARCHAR(20) NOT NULL,
        success BOOLEAN NOT NULL DEFAULT false,
        ip_address VARCHAR(45),
        user_agent TEXT,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ two_factor_attempts table ready');

    // === PERMISSIONS TABLE ===
    console.log('Checking permissions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS permissions (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        resource VARCHAR(50) NOT NULL,
        action VARCHAR(50) NOT NULL,
        description TEXT,
        is_system BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ permissions table ready');

    // === ROLE_PERMISSIONS TABLE ===
    console.log('Checking role_permissions table...');
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS role_permissions (
        id SERIAL PRIMARY KEY,
        role VARCHAR(50) NOT NULL,
        permission_id INTEGER NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        UNIQUE(role, permission_id)
      );
    `);
    // Add updated_at column if missing (for existing tables)
    await sequelize.query(`
      DO $$ BEGIN
        ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW();
      EXCEPTION
        WHEN duplicate_column THEN null;
      END $$;
    `);
    console.log('✅ role_permissions table ready');

    // === AUDIT_LOGS TABLE ===
    console.log('Checking audit_logs table...');
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE audit_severity AS ENUM ('info', 'warning', 'error', 'critical');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(100) NOT NULL,
        resource VARCHAR(50),
        resource_id VARCHAR(100),
        method VARCHAR(10),
        endpoint VARCHAR(255),
        status_code INTEGER,
        ip_address VARCHAR(45),
        user_agent TEXT,
        changes_before JSONB,
        changes_after JSONB,
        metadata JSONB DEFAULT '{}',
        severity audit_severity NOT NULL DEFAULT 'info',
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `);
    console.log('✅ audit_logs table ready');

    console.log('\n✅ All tables created successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createMissingTables();

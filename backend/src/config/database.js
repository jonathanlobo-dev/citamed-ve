// src/config/database.js
// Configuración de la conexión a PostgreSQL

const { Sequelize } = require('sequelize');

// ✅ NO cargar dotenv aquí - ya se carga en server.js

const sequelize = new Sequelize(
  process.env.DB_NAME || 'citamed_development',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',  // ✅ CORREGIDO: DB_PASSWORD (no DB_PASS)
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    dialectOptions: process.env.DB_SSL === 'true'
      ? { ssl: { require: true, rejectUnauthorized: false } }
      : {},
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

module.exports = sequelize;
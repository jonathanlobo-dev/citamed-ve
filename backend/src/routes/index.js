const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const profileRoutes = require('./profiles'); 
const protectedRoutes = require('./protected');

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/protected', protectedRoutes);

// Ruta de prueba de base de datos
router.get('/db-test', async (req, res) => {
  try {
    const { sequelize } = require('../models/index.js');
    await sequelize.authenticate();
    res.json({ 
      success: true, 
      message: 'Conexión a PostgreSQL exitosa' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error conectando a la base de datos',
      error: error.message 
    });
  }
});

module.exports = router;

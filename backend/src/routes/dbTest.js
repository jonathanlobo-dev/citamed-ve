const express = require('express');
const { testConnection } = require('../config/database');
const router = express.Router();

// Test de conexión a la base de datos
router.get('/', async (req, res) => {
  try {
    const result = await testConnection();
    res.status(200).json({
      success: true,
      message: 'Conexión a la base de datos exitosa',
      database: result
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error de conexión a la base de datos',
      error: error.message
    });
  }
});

module.exports = router;

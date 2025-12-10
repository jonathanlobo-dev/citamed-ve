const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

// Ruta protegida - Perfil del usuario
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Perfil del usuario',
    data: {
      user: req.user
    }
  });
});

// Ruta solo para administradores
router.get('/admin', authenticateToken, requireRole(['admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Panel de administración',
    data: {
      user: req.user,
      adminData: 'Información confidencial para administradores'
    }
  });
});

// Ruta para médicos y administradores
router.get('/medical', authenticateToken, requireRole(['doctor', 'admin']), (req, res) => {
  res.json({
    success: true,
    message: 'Panel médico',
    data: {
      user: req.user,
      medicalData: 'Información médica confidencial'
    }
  });
});

module.exports = router;

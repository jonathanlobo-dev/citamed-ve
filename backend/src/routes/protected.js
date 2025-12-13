const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * /api/protected/profile:
 *   get:
 *     tags: [Protected]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autorizado
 */
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    message: 'Perfil del usuario',
    data: {
      user: req.user
    }
  });
});

/**
 * @swagger
 * /api/protected/admin:
 *   get:
 *     tags: [Protected]
 *     summary: Panel de administración (solo admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panel de administración
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
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

/**
 * @swagger
 * /api/protected/medical:
 *   get:
 *     tags: [Protected]
 *     summary: Panel médico (doctor o admin)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Panel médico
 *       401:
 *         description: No autorizado
 *       403:
 *         description: Acceso denegado
 */
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

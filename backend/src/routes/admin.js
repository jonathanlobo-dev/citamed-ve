/**
 * admin.js - CITAMED.VE
 * M01 / Semana 7 - Rutas del panel de Superadministración
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken, requireRoles(['admin']));

// Resumen y métricas de plataforma
router.get('/overview', adminController.getOverview.bind(adminController));

// Gestión de usuarios
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put('/users/:id/status', adminController.updateUserStatus.bind(adminController));

// Listado de médicos para el superadmin
router.get('/doctors', adminController.getDoctors.bind(adminController));

module.exports = router;

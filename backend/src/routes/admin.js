/**
 * admin.js - CITAMED.VE
 * M01 / Semana 7 - Rutas del panel de Superadministración
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const exchangeRateService = require('../services/exchangeRateService');
const auditService = require('../services/auditService');

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticateToken, requireRoles(['admin']));

// Tasa oficial BCV: vigente, historial, actualización inmediata y corrección manual
router.get('/exchange-rate', async (req, res) => {
  try {
    const [current, history] = await Promise.all([
      exchangeRateService.getAll(),
      exchangeRateService.getHistory({ pair: 'USD/VES', days: 30 })
    ]);
    return res.json({ success: true, data: { current, history } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error al obtener la tasa BCV' });
  }
});

router.post('/exchange-rate/sync', async (req, res) => {
  try {
    const result = await exchangeRateService.sync({ force: true });
    const current = await exchangeRateService.getAll();
    return res.json({ success: true, data: { result, current } });
  } catch (error) {
    return res.status(500).json({ success: false, message: 'No se pudo actualizar la tasa BCV' });
  }
});

router.post('/exchange-rate/manual', async (req, res) => {
  try {
    const row = await exchangeRateService.setManual({
      pair: req.body.pair || 'USD/VES',
      rate: req.body.rate,
      userId: req.user.id
    });
    try {
      await auditService.log({
        userId: req.user.id,
        action: 'exchange_rate_manual',
        entityType: 'exchange_rate',
        entityId: null,
        details: { pair: row.pair, rate: row.rate }
      });
    } catch (e) { /* la auditoría no debe impedir la corrección */ }
    return res.json({ success: true, data: row });
  } catch (error) {
    return res.status(error.status || 500).json({ success: false, message: error.message });
  }
});

// Resumen y métricas de plataforma
router.get('/overview', adminController.getOverview.bind(adminController));

// Gestión de usuarios
router.get('/users', adminController.getUsers.bind(adminController));
router.get('/users/:id', adminController.getUserById.bind(adminController));
router.put('/users/:id/status', adminController.updateUserStatus.bind(adminController));

// Listado de médicos para el superadmin
router.get('/doctors', adminController.getDoctors.bind(adminController));

// Configuración y monitoreo de IA
router.get('/ai/config', adminController.getAiConfig.bind(adminController));
router.put('/ai/config', adminController.updateAiConfig.bind(adminController));
router.post('/ai/test', adminController.testAiConnection.bind(adminController));
router.get('/ai/models', adminController.getAiModels.bind(adminController));
router.post('/ai/models', adminController.getAiModels.bind(adminController));
router.get('/ai/usage', adminController.getAiUsage.bind(adminController));

module.exports = router;

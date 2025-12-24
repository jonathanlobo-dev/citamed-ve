// src/routes/audit.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Rutas de administración de logs de auditoría

const express = require('express');
const router = express.Router();

// Controllers
const auditController = require('../controllers/auditController');

// Middleware
const { authMiddleware } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/rbacMiddleware');

// Validators
const {
  validateGetLogs,
  validateGetLogById,
  validateGetResourceHistory,
  validateGetSecurityAlerts,
  validateGetStats,
  validateExportLogs
} = require('../validators/auditValidator');

// ========================================
// TODAS LAS RUTAS REQUIEREN ADMIN
// ========================================

// Autenticación y verificación de admin para todas las rutas
router.use(authMiddleware);
router.use(requireAdmin());

// ========================================
// RUTAS DE CONSULTA
// ========================================

/**
 * @route   GET /api/audit/logs
 * @desc    Lista logs de auditoría con filtros
 * @access  Admin only
 */
router.get('/logs', validateGetLogs, auditController.getLogs);

/**
 * @route   GET /api/audit/logs/:logId
 * @desc    Obtiene un log específico por ID
 * @access  Admin only
 */
router.get('/logs/:logId', validateGetLogById, auditController.getLogById);

/**
 * @route   GET /api/audit/logs/resource/:resource/:resourceId
 * @desc    Obtiene historial de un recurso específico
 * @access  Admin only
 */
router.get(
  '/logs/resource/:resource/:resourceId',
  validateGetResourceHistory,
  auditController.getResourceHistory
);

/**
 * @route   GET /api/audit/security-alerts
 * @desc    Obtiene alertas de seguridad recientes
 * @access  Admin only
 */
router.get(
  '/security-alerts',
  validateGetSecurityAlerts,
  auditController.getSecurityAlerts
);

/**
 * @route   GET /api/audit/stats
 * @desc    Obtiene estadísticas de auditoría
 * @access  Admin only
 */
router.get('/stats', validateGetStats, auditController.getAuditStats);

/**
 * @route   GET /api/audit/actions
 * @desc    Lista acciones disponibles para filtrar
 * @access  Admin only
 */
router.get('/actions', auditController.getAvailableActions);

// ========================================
// RUTAS DE EXPORTACIÓN
// ========================================

/**
 * @route   POST /api/audit/export
 * @desc    Exporta logs a archivo (CSV o JSON)
 * @access  Admin only
 */
router.post('/export', validateExportLogs, auditController.exportLogs);

/**
 * @route   GET /api/audit/download/:filename
 * @desc    Descarga un archivo de exportación
 * @access  Admin only
 */
router.get('/download/:filename', auditController.downloadExport);

module.exports = router;

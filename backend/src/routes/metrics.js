/**
 * Metrics Routes - CITAMED.VE
 *
 * Rutas para monitoreo y métricas:
 * - /api/metrics - Dashboard completo (admin)
 * - /api/metrics/health - Health check público
 * - /api/metrics/requests - Métricas de requests (admin)
 * - /api/metrics/errors - Métricas de errores (admin)
 * - /api/metrics/database - Métricas de DB (admin)
 */

const express = require('express');
const router = express.Router();

const {
  getMetrics,
  getHealthCheck,
  getRequestMetrics,
  getErrorMetrics,
  getDatabaseMetrics,
  resetMetrics
} = require('../controllers/metricsController');

const { authenticate } = require('../middleware/auth');

/**
 * Middleware para verificar rol admin
 * Solo administradores pueden ver métricas detalladas
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      error: 'Access denied. Admin role required.'
    });
  }
  next();
};

/**
 * Health check - Público
 * GET /api/metrics/health
 */
router.get('/health', getHealthCheck);

/**
 * Dashboard completo - Solo Admin
 * GET /api/metrics
 */
router.get('/', authenticate, requireAdmin, getMetrics);

/**
 * Métricas de requests - Solo Admin
 * GET /api/metrics/requests
 */
router.get('/requests', authenticate, requireAdmin, getRequestMetrics);

/**
 * Métricas de errores - Solo Admin
 * GET /api/metrics/errors
 */
router.get('/errors', authenticate, requireAdmin, getErrorMetrics);

/**
 * Métricas de base de datos - Solo Admin
 * GET /api/metrics/database
 */
router.get('/database', authenticate, requireAdmin, getDatabaseMetrics);

/**
 * Reset de métricas - Solo Admin, Solo Desarrollo
 * POST /api/metrics/reset
 */
router.post('/reset', authenticate, requireAdmin, resetMetrics);

module.exports = router;

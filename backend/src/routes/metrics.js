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

// Lazy load to avoid circular dependency issues
let metricsController = null;
const getController = () => {
  if (!metricsController) {
    metricsController = require('../controllers/metricsController');
  }
  return metricsController;
};

const { authMiddleware: authenticate } = require('../middleware/auth');

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
router.get('/health', (req, res) => getController().getHealthCheck(req, res));

/**
 * Dashboard completo - Solo Admin
 * GET /api/metrics
 */
router.get('/', authenticate, requireAdmin, (req, res) => getController().getMetrics(req, res));

/**
 * Métricas de requests - Solo Admin
 * GET /api/metrics/requests
 */
router.get('/requests', authenticate, requireAdmin, (req, res) => getController().getRequestMetrics(req, res));

/**
 * Métricas de errores - Solo Admin
 * GET /api/metrics/errors
 */
router.get('/errors', authenticate, requireAdmin, (req, res) => getController().getErrorMetrics(req, res));

/**
 * Métricas de base de datos - Solo Admin
 * GET /api/metrics/database
 */
router.get('/database', authenticate, requireAdmin, (req, res) => getController().getDatabaseMetrics(req, res));

/**
 * Reset de métricas - Solo Admin, Solo Desarrollo
 * POST /api/metrics/reset
 */
router.post('/reset', authenticate, requireAdmin, (req, res) => getController().resetMetrics(req, res));

module.exports = router;

/**
 * Metrics Controller - CITAMED.VE
 *
 * Endpoints para monitoreo y métricas:
 * - Dashboard de métricas
 * - Health check mejorado
 * - Query stats de base de datos
 */

const metricsStore = require('../utils/metricsStore');
const { getSlowQueries, getQueryStats } = require('../config/sequelizeLogger');
const { sequelize } = require('../models');

/**
 * GET /api/metrics
 * Dashboard completo de métricas
 * Solo accesible por admin
 */
const getMetrics = async (req, res) => {
  try {
    // Métricas de requests
    const requestMetrics = metricsStore.getSummary();

    // Métricas de base de datos
    const dbMetrics = {
      slowQueries: getSlowQueries(10),
      queryStats: getQueryStats()
    };

    // Métricas de sistema
    const memUsage = process.memoryUsage();
    const systemMetrics = {
      memory: {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024),
        rss: Math.round(memUsage.rss / 1024 / 1024)
      },
      uptime: Math.floor(process.uptime()),
      nodeVersion: process.version,
      pid: process.pid,
      platform: process.platform
    };

    res.json({
      success: true,
      data: {
        timestamp: new Date().toISOString(),
        requests: requestMetrics,
        database: dbMetrics,
        system: systemMetrics
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving metrics',
      message: error.message
    });
  }
};

/**
 * GET /api/metrics/health
 * Health check mejorado con detalles
 */
const getHealthCheck = async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database connection
    let dbStatus = 'healthy';
    let dbLatency = 0;

    try {
      const dbStart = Date.now();
      await sequelize.authenticate();
      dbLatency = Date.now() - dbStart;

      if (dbLatency > 100) {
        dbStatus = 'degraded';
      }
    } catch {
      dbStatus = 'unhealthy';
    }

    // Determinar estado general
    const overallStatus = dbStatus === 'unhealthy' ? 'unhealthy' :
                          dbStatus === 'degraded' ? 'degraded' : 'healthy';

    const statusCode = overallStatus === 'healthy' ? 200 :
                       overallStatus === 'degraded' ? 200 : 503;

    res.status(statusCode).json({
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      version: process.env.npm_package_version || '1.0.0',
      checks: {
        database: {
          status: dbStatus,
          latency: `${dbLatency}ms`
        },
        memory: {
          status: process.memoryUsage().heapUsed < 500 * 1024 * 1024 ? 'healthy' : 'warning',
          heapUsed: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`
        }
      },
      uptime: Math.floor(process.uptime())
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
};

/**
 * GET /api/metrics/requests
 * Métricas de requests únicamente
 */
const getRequestMetrics = async (req, res) => {
  try {
    const summary = metricsStore.getSummary();

    res.json({
      success: true,
      data: {
        total: summary.totalRequests,
        errors: summary.totalErrors,
        errorRate: summary.errorRate,
        last5Minutes: summary.requestsLast5Min,
        slowEndpoints: summary.slowEndpoints,
        topEndpoints: summary.topEndpoints
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving request metrics'
    });
  }
};

/**
 * GET /api/metrics/errors
 * Métricas de errores
 */
const getErrorMetrics = async (req, res) => {
  try {
    const summary = metricsStore.getSummary();

    res.json({
      success: true,
      data: {
        totalErrors: summary.totalErrors,
        errorRate: summary.errorRate,
        errorsByHour: summary.errorsByHour
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving error metrics'
    });
  }
};

/**
 * GET /api/metrics/database
 * Métricas de base de datos
 */
const getDatabaseMetrics = async (req, res) => {
  try {
    const slowQueries = getSlowQueries(20);
    const stats = getQueryStats();

    res.json({
      success: true,
      data: {
        slowQueries,
        statistics: stats
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error retrieving database metrics'
    });
  }
};

/**
 * POST /api/metrics/reset
 * Reset de métricas (solo admin, solo desarrollo)
 */
const resetMetrics = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({
      success: false,
      error: 'Cannot reset metrics in production'
    });
  }

  try {
    metricsStore.reset();

    res.json({
      success: true,
      message: 'Metrics reset successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error resetting metrics'
    });
  }
};

module.exports = {
  getMetrics,
  getHealthCheck,
  getRequestMetrics,
  getErrorMetrics,
  getDatabaseMetrics,
  resetMetrics
};

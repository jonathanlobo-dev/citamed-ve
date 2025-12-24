// src/controllers/auditController.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Controlador para endpoints de auditoría

const auditService = require('../services/auditService');
const { logger } = require('../config/logger');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/audit/logs
 * Lista logs de auditoría con filtros y paginación
 */
async function getLogs(req, res) {
  try {
    const {
      page = 1,
      limit = 50,
      userId,
      action,
      resource,
      resourceId,
      severity,
      startDate,
      endDate,
      ipAddress,
      search
    } = req.query;

    // Parsear severity si viene como string separado por comas
    let parsedSeverity = severity;
    if (typeof severity === 'string' && severity.includes(',')) {
      parsedSeverity = severity.split(',').map(s => s.trim());
    }

    const result = await auditService.getLogs({
      page: parseInt(page),
      limit: parseInt(limit),
      userId: userId ? parseInt(userId) : undefined,
      action,
      resource,
      resourceId,
      severity: parsedSeverity,
      startDate,
      endDate,
      ipAddress,
      search
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error obteniendo logs de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener logs de auditoría',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/logs/:logId
 * Obtiene un log específico por ID
 */
async function getLogById(req, res) {
  try {
    const { logId } = req.params;

    const log = await auditService.getLogById(logId);

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Log de auditoría no encontrado',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: { log }
    });
  } catch (error) {
    logger.error('Error obteniendo log de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener log de auditoría',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/logs/resource/:resource/:resourceId
 * Obtiene historial de un recurso específico
 */
async function getResourceHistory(req, res) {
  try {
    const { resource, resourceId } = req.params;
    const { limit = 50 } = req.query;

    const logs = await auditService.getLogsByResource(
      resource,
      resourceId,
      parseInt(limit)
    );

    res.json({
      success: true,
      data: {
        resource,
        resourceId,
        logs,
        count: logs.length
      }
    });
  } catch (error) {
    logger.error('Error obteniendo historial de recurso:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener historial del recurso',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/security-alerts
 * Obtiene alertas de seguridad recientes
 */
async function getSecurityAlerts(req, res) {
  try {
    const { since = 24 } = req.query;

    const alerts = await auditService.getSecurityAlerts(parseInt(since));

    // Agrupar por tipo de evento
    const grouped = {};
    for (const alert of alerts) {
      const type = alert.action;
      if (!grouped[type]) {
        grouped[type] = [];
      }
      grouped[type].push(alert);
    }

    res.json({
      success: true,
      data: {
        alerts,
        grouped,
        count: alerts.length,
        since: `${since} horas`
      }
    });
  } catch (error) {
    logger.error('Error obteniendo alertas de seguridad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener alertas de seguridad',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/stats
 * Obtiene estadísticas de auditoría
 */
async function getAuditStats(req, res) {
  try {
    const { startDate, endDate } = req.query;

    const stats = await auditService.getAuditStats(startDate, endDate);

    res.json({
      success: true,
      data: {
        stats,
        period: {
          start: startDate || 'última semana',
          end: endDate || 'ahora'
        }
      }
    });
  } catch (error) {
    logger.error('Error obteniendo estadísticas de auditoría:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
}

/**
 * POST /api/audit/export
 * Exporta logs a archivo (CSV o JSON)
 */
async function exportLogs(req, res) {
  try {
    const { format = 'csv' } = req.query;
    const filters = req.body.filters || {};

    // Log de la acción de exportación (auditar la auditoría)
    auditService.log({
      userId: req.user?.id,
      action: 'audit.exported',
      resource: 'audit',
      metadata: {
        format,
        filters,
        exportedBy: req.user?.email
      },
      severity: 'info'
    }).catch(err => logger.error('Failed to log export:', err.message));

    const exportResult = await auditService.exportLogs(filters, format);

    res.json({
      success: true,
      message: 'Exportación generada correctamente',
      data: {
        filename: exportResult.filename,
        format: exportResult.format,
        recordCount: exportResult.recordCount,
        expiresAt: exportResult.expiresAt,
        downloadUrl: `/api/audit/download/${exportResult.filename}`
      }
    });
  } catch (error) {
    logger.error('Error exportando logs:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar logs',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/download/:filename
 * Descarga un archivo de exportación
 */
async function downloadExport(req, res) {
  try {
    const { filename } = req.params;

    // Validar que el filename es seguro
    if (!filename.match(/^audit-logs-\d+\.(csv|json)$/)) {
      return res.status(400).json({
        success: false,
        message: 'Nombre de archivo inválido',
        error: 'INVALID_FILENAME'
      });
    }

    const exportDir = process.env.AUDIT_EXPORT_TEMP_DIR || '/tmp/audit-exports';
    const filepath = path.join(exportDir, filename);

    // Verificar que el archivo existe
    if (!fs.existsSync(filepath)) {
      return res.status(404).json({
        success: false,
        message: 'Archivo no encontrado o expirado',
        error: 'FILE_NOT_FOUND'
      });
    }

    // Determinar content-type
    const ext = path.extname(filename);
    const contentTypes = {
      '.csv': 'text/csv',
      '.json': 'application/json'
    };

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', contentTypes[ext] || 'application/octet-stream');

    const fileStream = fs.createReadStream(filepath);
    fileStream.pipe(res);
  } catch (error) {
    logger.error('Error descargando exportación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al descargar archivo',
      error: error.message
    });
  }
}

/**
 * GET /api/audit/actions
 * Lista todas las acciones disponibles para filtrar
 */
async function getAvailableActions(req, res) {
  try {
    const actions = {
      auth: [
        'auth.login.success',
        'auth.login.failed',
        'auth.logout',
        'auth.password.changed',
        'auth.password.reset.requested',
        'auth.password.reset.completed',
        'auth.2fa.enabled',
        'auth.2fa.disabled',
        'auth.unauthorized',
        'auth.forbidden'
      ],
      user: [
        'user.created',
        'user.updated',
        'user.deleted',
        'user.role.changed',
        'user.permission.granted',
        'user.permission.revoked',
        'user.suspended',
        'user.reactivated'
      ],
      session: [
        'session.created',
        'session.revoked',
        'session.expired',
        'session.suspicious'
      ],
      security: [
        'security.rate_limit_exceeded',
        'security.brute_force_detected',
        'security.suspicious_activity'
      ],
      admin: [
        'admin.doctor.verified',
        'admin.doctor.rejected',
        'admin.provider.approved',
        'admin.settings.changed'
      ],
      audit: [
        'audit.exported'
      ]
    };

    res.json({
      success: true,
      data: { actions }
    });
  } catch (error) {
    logger.error('Error obteniendo acciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener acciones',
      error: error.message
    });
  }
}

module.exports = {
  getLogs,
  getLogById,
  getResourceHistory,
  getSecurityAlerts,
  getAuditStats,
  exportLogs,
  downloadExport,
  getAvailableActions
};

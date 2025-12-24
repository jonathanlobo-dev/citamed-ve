// src/routes/sessions.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Rutas de gestión de sesiones

const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');
const { authenticateToken } = require('../middleware/auth');
const { validateSessionId, validateHistoryParams } = require('../validators/sessionValidator');
const { validationErrorHandler } = require('../middleware/validationErrorHandler');
const { generalLimiter } = require('../middleware/rateLimiter');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');

// Rate limiter específico para sesiones (más restrictivo)
const sessionLimiter = generalLimiter; // Usar el mismo por ahora

// Todas las rutas requieren autenticación
router.use(authenticateToken);

/**
 * @swagger
 * /api/sessions/active:
 *   get:
 *     summary: Obtener sesiones activas
 *     description: Retorna todas las sesiones activas del usuario autenticado
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones activas
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessions:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Session'
 *                 count:
 *                   type: integer
 */
router.get('/active', sessionLimiter, requirePermission('sessions.read.own'), sessionController.getActiveSessions);

/**
 * @swagger
 * /api/sessions/{sessionId}:
 *   delete:
 *     summary: Cerrar sesión específica
 *     description: Revoca una sesión específica (no puede ser la actual)
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sessionId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       400:
 *         description: No se puede cerrar la sesión actual o sesión no encontrada
 */
router.delete(
  '/:sessionId',
  sessionLimiter,
  requirePermission('sessions.revoke.own'),
  validateSessionId,
  validationErrorHandler,
  auditLog({ action: 'session.revoked', resource: 'session', severity: 'warning' }),
  sessionController.revokeSession
);

/**
 * @swagger
 * /api/sessions/revoke-all:
 *   delete:
 *     summary: Cerrar todas las sesiones
 *     description: Revoca todas las sesiones excepto la actual
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesiones cerradas exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 revokedCount:
 *                   type: integer
 *                 message:
 *                   type: string
 */
router.delete('/revoke-all',
  sessionLimiter,
  requirePermission('sessions.revoke.own'),
  auditLog({ action: 'session.revoked_all', resource: 'session', severity: 'warning' }),
  sessionController.revokeAllSessions
);

/**
 * @swagger
 * /api/sessions/login-history:
 *   get:
 *     summary: Obtener historial de logins
 *     description: Retorna el historial de intentos de inicio de sesión
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *     responses:
 *       200:
 *         description: Historial de logins
 */
router.get(
  '/login-history',
  sessionLimiter,
  requirePermission('sessions.read.own'),
  validateHistoryParams,
  validationErrorHandler,
  sessionController.getLoginHistory
);

/**
 * @swagger
 * /api/sessions/suspicious:
 *   get:
 *     summary: Detectar sesiones sospechosas
 *     description: Identifica sesiones desde IPs o ubicaciones inusuales
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de sesiones sospechosas
 */
router.get('/suspicious', sessionLimiter, requirePermission('sessions.read.own'), sessionController.detectSuspicious);

/**
 * @swagger
 * /api/sessions/stats:
 *   get:
 *     summary: Estadísticas de login
 *     description: Retorna estadísticas de inicio de sesión del usuario
 *     tags: [Sessions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Estadísticas de login
 */
router.get('/stats', sessionLimiter, requirePermission('sessions.read.own'), sessionController.getLoginStats);

module.exports = router;

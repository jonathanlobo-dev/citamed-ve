/**
 * Two-Factor Authentication Routes - CITAMED.VE
 * M01 Sub-Partida 2.4.1
 *
 * Rutas para endpoints de 2FA
 */

const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const twoFactorController = require('../controllers/twoFactorController');
const twoFactorValidator = require('../validators/twoFactorValidator');
const { authMiddleware } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbacMiddleware');
const { auditLog } = require('../middleware/auditMiddleware');

// ============================================================
// RATE LIMITERS
// ============================================================

/**
 * Rate limiter para generar secrets
 * 5 requests por 15 minutos
 */
const generateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5,
  message: {
    success: false,
    message: 'Demasiadas solicitudes. Intenta en 15 minutos.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * Rate limiter para verificación de códigos
 * 10 requests por 15 minutos (previene fuerza bruta)
 */
const verifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10,
  message: {
    success: false,
    message: 'Demasiados intentos de verificación. Intenta en 15 minutos.',
    code: 'RATE_LIMITED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ============================================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================================

/**
 * @route   POST /api/2fa/generate
 * @desc    Genera secret y QR para configurar 2FA
 * @access  Private (requiere auth)
 */
router.post(
  '/generate',
  authMiddleware,
  requirePermission('2fa.enable'),
  generateLimiter,
  twoFactorController.generateSecret
);

/**
 * @route   POST /api/2fa/enable
 * @desc    Activa 2FA después de verificar primer código
 * @access  Private (requiere auth)
 */
router.post(
  '/enable',
  authMiddleware,
  requirePermission('2fa.enable'),
  twoFactorValidator.validateEnable,
  auditLog({ action: 'auth.2fa.enabled', resource: 'user', severity: 'warning', trackChanges: true }),
  twoFactorController.enable
);

/**
 * @route   POST /api/2fa/disable
 * @desc    Desactiva 2FA (requiere contraseña)
 * @access  Private (requiere auth)
 */
router.post(
  '/disable',
  authMiddleware,
  requirePermission('2fa.disable'),
  twoFactorValidator.validateDisable,
  auditLog({ action: 'auth.2fa.disabled', resource: 'user', severity: 'warning', trackChanges: true }),
  twoFactorController.disable
);

/**
 * @route   POST /api/2fa/regenerate-backup-codes
 * @desc    Regenera códigos de respaldo (requiere contraseña)
 * @access  Private (requiere auth)
 */
router.post(
  '/regenerate-backup-codes',
  authMiddleware,
  requirePermission('2fa.enable'),
  twoFactorValidator.validateRegenerateBackupCodes,
  twoFactorController.regenerateBackupCodes
);

/**
 * @route   GET /api/2fa/status
 * @desc    Obtiene estado de 2FA del usuario
 * @access  Private (requiere auth)
 */
router.get(
  '/status',
  authMiddleware,
  twoFactorController.getStatus
);

/**
 * @route   GET /api/2fa/history
 * @desc    Obtiene historial de intentos 2FA
 * @access  Private (requiere auth)
 */
router.get(
  '/history',
  authMiddleware,
  twoFactorValidator.validateGetHistory,
  twoFactorController.getHistory
);

// ============================================================
// RUTAS PÚBLICAS (durante login)
// ============================================================

/**
 * @route   POST /api/2fa/verify
 * @desc    Verifica código 2FA (durante login)
 * @access  Public (llamado durante el proceso de login)
 */
router.post(
  '/verify',
  verifyLimiter,
  twoFactorValidator.validateVerify,
  twoFactorController.verify
);

module.exports = router;

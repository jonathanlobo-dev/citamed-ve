// routes/verification.js
// CITAMED.VE - Rutas de Verificación de Profesionales

const express = require('express');
const router = express.Router();
const verificationController = require('../controllers/verificationController');
const { authMiddleware, requireRole } = require('../middleware/auth');

// ============================================================
// RUTAS PARA MÉDICOS (requiere autenticación como doctor)
// ============================================================

// Obtener estado de verificación del médico actual
router.get(
  '/status',
  authMiddleware,
  requireRole(['doctor']),
  verificationController.getVerificationStatus
);

// Solicitar verificación
router.post(
  '/request',
  authMiddleware,
  requireRole(['doctor']),
  verificationController.requestVerification
);

// ============================================================
// RUTAS ADMINISTRATIVAS (requiere rol admin)
// ============================================================

// Obtener médicos pendientes de verificación
router.get(
  '/pending',
  authMiddleware,
  requireRole(['admin']),
  verificationController.getPendingVerifications
);

// Obtener estadísticas de verificación
router.get(
  '/stats',
  authMiddleware,
  requireRole(['admin']),
  verificationController.getVerificationStats
);

// Aprobar verificación de médico
router.post(
  '/approve/:doctorProfileId',
  authMiddleware,
  requireRole(['admin']),
  verificationController.approveVerification
);

// Rechazar verificación de médico
router.post(
  '/reject/:doctorProfileId',
  authMiddleware,
  requireRole(['admin']),
  verificationController.rejectVerification
);

// Suspender médico
router.post(
  '/suspend/:doctorProfileId',
  authMiddleware,
  requireRole(['admin']),
  verificationController.suspendDoctor
);

module.exports = router;

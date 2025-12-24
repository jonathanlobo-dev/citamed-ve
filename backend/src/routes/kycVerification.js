/**
 * KYC Verification Routes - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Rutas para verificación con documentos de doctores
 */

const express = require('express');
const router = express.Router();
const kycController = require('../controllers/kycVerificationController');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { uploadDocument, requireFile, addFileMetadata } = require('../middleware/uploadMiddleware');

// ═══════════════════════════════════════════════════════════════
// RUTAS PARA DOCTORES (requiere autenticación como doctor)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/kyc/status
 * Obtiene estado de verificación KYC del doctor autenticado
 */
router.get(
  '/status',
  authMiddleware,
  requireRole(['doctor']),
  kycController.getMyVerificationStatus
);

/**
 * GET /api/kyc/document-types
 * Obtiene tipos de documentos disponibles y configuración de upload
 */
router.get(
  '/document-types',
  authMiddleware,
  requireRole(['doctor']),
  kycController.getDocumentTypes
);

/**
 * POST /api/kyc/documents
 * Sube un documento de verificación
 */
router.post(
  '/documents',
  authMiddleware,
  requireRole(['doctor']),
  uploadDocument,
  requireFile,
  addFileMetadata,
  kycController.uploadDocument
);

/**
 * DELETE /api/kyc/documents/:id
 * Elimina un documento de verificación
 */
router.delete(
  '/documents/:id',
  authMiddleware,
  requireRole(['doctor']),
  kycController.deleteDocument
);

/**
 * POST /api/kyc/submit
 * Envía solicitud de verificación KYC
 */
router.post(
  '/submit',
  authMiddleware,
  requireRole(['doctor']),
  kycController.submitVerification
);

// ═══════════════════════════════════════════════════════════════
// RUTAS ADMINISTRATIVAS (requiere rol admin)
// ═══════════════════════════════════════════════════════════════

/**
 * GET /api/kyc/admin/queue
 * Obtiene cola de verificaciones pendientes
 */
router.get(
  '/admin/queue',
  authMiddleware,
  requireRole(['admin']),
  kycController.getVerificationQueue
);

/**
 * GET /api/kyc/admin/stats
 * Obtiene estadísticas de verificación
 */
router.get(
  '/admin/stats',
  authMiddleware,
  requireRole(['admin']),
  kycController.getVerificationStats
);

/**
 * GET /api/kyc/admin/requests/:id
 * Obtiene detalles de una solicitud específica
 */
router.get(
  '/admin/requests/:id',
  authMiddleware,
  requireRole(['admin']),
  kycController.getRequestDetails
);

/**
 * POST /api/kyc/admin/requests/:id/assign
 * Asigna solicitud a un admin
 */
router.post(
  '/admin/requests/:id/assign',
  authMiddleware,
  requireRole(['admin']),
  kycController.assignRequest
);

/**
 * PUT /api/kyc/admin/requests/:id/priority
 * Actualiza prioridad de una solicitud
 */
router.put(
  '/admin/requests/:id/priority',
  authMiddleware,
  requireRole(['admin']),
  kycController.updateRequestPriority
);

/**
 * POST /api/kyc/admin/requests/:id/hold
 * Pone solicitud en espera
 */
router.post(
  '/admin/requests/:id/hold',
  authMiddleware,
  requireRole(['admin']),
  kycController.holdRequest
);

/**
 * POST /api/kyc/admin/requests/:id/approve
 * Aprueba verificación completa del doctor
 */
router.post(
  '/admin/requests/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  kycController.approveVerification
);

/**
 * POST /api/kyc/admin/requests/:id/reject
 * Rechaza verificación del doctor
 */
router.post(
  '/admin/requests/:id/reject',
  authMiddleware,
  requireRole(['admin']),
  kycController.rejectVerification
);

/**
 * POST /api/kyc/admin/documents/:id/approve
 * Aprueba un documento individual
 */
router.post(
  '/admin/documents/:id/approve',
  authMiddleware,
  requireRole(['admin']),
  kycController.approveDocument
);

/**
 * POST /api/kyc/admin/documents/:id/reject
 * Rechaza un documento individual
 */
router.post(
  '/admin/documents/:id/reject',
  authMiddleware,
  requireRole(['admin']),
  kycController.rejectDocument
);

module.exports = router;

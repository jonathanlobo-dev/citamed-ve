/**
 * medicalDocuments.js - CITAMED.VE
 * M03 / Semana 6 - Rutas de documentos médicos
 */

const express = require('express');
const router = express.Router();
const medicalDocumentController = require('../controllers/medicalDocumentController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');
const { uploadAttachmentFile } = require('../middleware/uploadMiddleware');
const LAB_CATALOG = require('../utils/labCatalog');

// ==========================================
// RUTA PÚBLICA (Verificación QR / Web)
// IMPORTANTE: Registrar ANTES de rutas con /:id
// ==========================================
router.get('/verify/:code', generalLimiter, medicalDocumentController.verify.bind(medicalDocumentController));

// ==========================================
// RUTAS AUTENTICADAS
// ==========================================

router.get('/lab-catalog', authenticateToken, (req, res) => {
  res.json({ success: true, data: LAB_CATALOG });
});

// Subir archivo adjunto privado (multipart, campo 'file')
// IMPORTANTE: Registrar antes de rutas con /:id
router.post(
  '/attachments',
  authenticateToken,
  uploadAttachmentFile,
  medicalDocumentController.uploadAttachment.bind(medicalDocumentController)
);

// Emitir documento médico (médico o admin)
router.post(
  '/',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  medicalDocumentController.create.bind(medicalDocumentController)
);

// Obtener documentos de un paciente con filtrado de privacidad
router.get(
  '/patient/:patientId',
  authenticateToken,
  medicalDocumentController.getByPatient.bind(medicalDocumentController)
);

// Descargar documento médico en PDF
router.get(
  '/:id/pdf',
  authenticateToken,
  medicalDocumentController.downloadPdf.bind(medicalDocumentController)
);

// Anular documento médico (médico emisor o admin)
router.put(
  '/:id/void',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  medicalDocumentController.void.bind(medicalDocumentController)
);

// Obtener URL firmada de archivo adjunto privado
router.get(
  '/:id/file',
  authenticateToken,
  medicalDocumentController.getFileSignedUrl.bind(medicalDocumentController)
);

// Eliminar archivo adjunto privado (solo uploader o admin)
router.delete(
  '/:id/file',
  authenticateToken,
  medicalDocumentController.deleteAttachmentFile.bind(medicalDocumentController)
);

module.exports = router;

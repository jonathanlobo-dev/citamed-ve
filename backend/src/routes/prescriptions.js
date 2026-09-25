/**
 * Prescription Routes - CITAMED.VE
 * M03 / Semana 5 - Rutas para emisión, descarga y verificación de récipes
 */

const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { generalLimiter } = require('../middleware/rateLimiter');

// ==========================================
// RUTA PÚBLICA (Verificación QR / Web)
// ==========================================
// Importante: registrar antes de rutas parametrizadas genéricas
router.get('/verify/:code', generalLimiter, prescriptionController.verify);

// ==========================================
// RUTAS AUTENTICADAS
// ==========================================
// Emitir récipe médico (médico o admin)
router.post(
  '/',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  prescriptionController.create
);

// Obtener récipes de una cita específica (médico dueño, paciente dueño o admin)
router.get(
  '/appointment/:appointmentId',
  authenticateToken,
  prescriptionController.getByAppointment
);

// Descargar récipe médico en PDF
router.get(
  '/:id/pdf',
  authenticateToken,
  prescriptionController.downloadPdf
);

// Anular récipe médico (médico dueño o admin)
router.put(
  '/:id/void',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  prescriptionController.voidPrescription
);

module.exports = router;

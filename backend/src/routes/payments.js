/**
 * payments.js - CITAMED.VE
 * M05 / Semana 8 - Rutas de cobros, métodos de pago del médico y recibos
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { creationLimiter, generalLimiter } = require('../middleware/rateLimiter');

// ==========================================
// CONFIGURACIÓN Y CATÁLOGOS
// ==========================================

// Lista oficial de bancos venezolanos (autenticado)
router.get('/banks', authenticateToken, paymentController.getBanks.bind(paymentController));

// Métodos de cobro del médico autenticado
router.get(
  '/settings',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.getSettings.bind(paymentController)
);

router.put(
  '/settings',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.updateSettings.bind(paymentController)
);

// ==========================================
// CONSULTAS Y RESÚMENES
// ==========================================

// Resumen de pago de una consulta (paciente o médico de la cita)
router.get(
  '/appointment/:appointmentId',
  authenticateToken,
  paymentController.getAppointmentSummary.bind(paymentController)
);

// Cobros pendientes de validar por el médico
router.get(
  '/pending',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.listPending.bind(paymentController)
);

// Consultas atendidas por cobrar (médico)
router.get(
  '/receivable',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.listReceivable.bind(paymentController)
);

// Historial de cobros con filtros y totales (médico)
router.get(
  '/history',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.listHistory.bind(paymentController)
);

// Mis pagos reportados / realizados (paciente)
router.get(
  '/mine',
  authenticateToken,
  requireRoles(['patient', 'admin']),
  paymentController.listMine.bind(paymentController)
);

// ==========================================
// TRANSACCIONES Y OPERACIONES
// ==========================================

// Reporte de pago (paciente) con rate limiting
router.post(
  '/report',
  authenticateToken,
  requireRoles(['patient', 'admin']),
  creationLimiter,
  paymentController.reportPayment.bind(paymentController)
);

// Registro de cobro en consultorio (médico) con rate limiting
router.post(
  '/record',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  creationLimiter,
  paymentController.recordPayment.bind(paymentController)
);

// Validación: Aprobar pago reportado
router.put(
  '/:id/approve',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.approve.bind(paymentController)
);

// Validación: Rechazar pago reportado
router.put(
  '/:id/reject',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.reject.bind(paymentController)
);

// Anulación de cobro aprobado
router.put(
  '/:id/void',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  paymentController.voidPayment.bind(paymentController)
);

// ==========================================
// DOCUMENTOS
// ==========================================

// Descarga de recibo oficial en PDF
router.get(
  '/:id/receipt',
  authenticateToken,
  paymentController.downloadReceipt.bind(paymentController)
);

module.exports = router;

/**
 * payments.js - CITAMED.VE
 * M05 / Semana 8 - Rutas de cobros, métodos de pago del médico y recibos
 */

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');
const { allowAssistant } = require('../middleware/assistantAccess');
const { creationLimiter, generalLimiter } = require('../middleware/rateLimiter');

// ==========================================
// CONFIGURACIÓN Y CATÁLOGOS
// ==========================================

// Lista oficial de bancos venezolanos (autenticado)
router.get('/banks', authenticateToken, allowAssistant('payments'), paymentController.getBanks.bind(paymentController));

// Métodos de cobro del médico autenticado
router.get(
  '/settings',
  authenticateToken,
  allowAssistant('payments'),
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
  allowAssistant('payments'),
  paymentController.getAppointmentSummary.bind(paymentController)
);

// Cobros pendientes de validar por el médico
router.get(
  '/pending',
  authenticateToken,
  allowAssistant('payments'),
  requireRoles(['doctor', 'admin']),
  paymentController.listPending.bind(paymentController)
);

// Consultas atendidas por cobrar (médico)
router.get(
  '/receivable',
  authenticateToken,
  allowAssistant('payments'),
  requireRoles(['doctor', 'admin']),
  paymentController.listReceivable.bind(paymentController)
);

// Historial de cobros con filtros y totales (médico)
router.get(
  '/history',
  authenticateToken,
  allowAssistant('payments'),
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
router.post(
  '/appointments/:appointmentId/report',
  authenticateToken,
  requireRoles(['patient', 'admin']),
  creationLimiter,
  paymentController.reportPayment.bind(paymentController)
);

// Registro de cobro en consultorio (médico) con rate limiting
router.post(
  '/record',
  authenticateToken,
  allowAssistant('payments'),
  requireRoles(['doctor', 'admin']),
  creationLimiter,
  paymentController.recordPayment.bind(paymentController)
);
router.post(
  '/appointments/:appointmentId/record',
  authenticateToken,
  allowAssistant('payments'),
  requireRoles(['doctor', 'admin']),
  creationLimiter,
  paymentController.recordPayment.bind(paymentController)
);

// Validación: Aprobar pago reportado (PUT o POST)
router.route('/:id/approve')
  .all(authenticateToken, allowAssistant('payments'), requireRoles(['doctor', 'admin']))
  .put(paymentController.approve.bind(paymentController))
  .post(paymentController.approve.bind(paymentController));

// Validación: Rechazar pago reportado (PUT o POST)
router.route('/:id/reject')
  .all(authenticateToken, allowAssistant('payments'), requireRoles(['doctor', 'admin']))
  .put(paymentController.reject.bind(paymentController))
  .post(paymentController.reject.bind(paymentController));

// Anulación de cobro aprobado (PUT o POST) - REQUIERE PERMISO voidReceipts
router.route('/:id/void')
  .all(authenticateToken, allowAssistant('voidReceipts'), requireRoles(['doctor', 'admin']))
  .put(paymentController.voidPayment.bind(paymentController))
  .post(paymentController.voidPayment.bind(paymentController));

// ==========================================
// DOCUMENTOS
// ==========================================

// Descarga de recibo oficial en PDF
router.get(
  '/:id/receipt',
  authenticateToken,
  allowAssistant('payments'),
  paymentController.downloadReceipt.bind(paymentController)
);

module.exports = router;

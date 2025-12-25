/**
 * Appointment Routes - CITAMED.VE
 * M03 - Gestion de Citas
 */

const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { authenticateToken } = require('../middleware/auth');
const { requirePermission } = require('../middleware/rbacMiddleware');

// ==========================================
// RUTAS PUBLICAS (requieren autenticacion basica)
// ==========================================

/**
 * @swagger
 * /api/appointments/available-slots:
 *   get:
 *     tags: [Appointments]
 *     summary: Obtener slots disponibles
 *     parameters:
 *       - in: query
 *         name: doctorProfileId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 */
router.get(
  '/available-slots',
  authenticateToken,
  appointmentController.getAvailableSlots.bind(appointmentController)
);

// ==========================================
// RUTAS DE PACIENTE
// ==========================================

/**
 * @swagger
 * /api/appointments:
 *   post:
 *     tags: [Appointments]
 *     summary: Crear una nueva cita
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authenticateToken,
  requirePermission('appointments.create'),
  appointmentController.create.bind(appointmentController)
);

/**
 * @swagger
 * /api/appointments/my:
 *   get:
 *     tags: [Appointments]
 *     summary: Obtener mis citas
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/my',
  authenticateToken,
  appointmentController.getMyAppointments.bind(appointmentController)
);

/**
 * @swagger
 * /api/appointments/{id}:
 *   get:
 *     tags: [Appointments]
 *     summary: Obtener detalle de una cita
 */
router.get(
  '/:id',
  authenticateToken,
  appointmentController.getById.bind(appointmentController)
);

/**
 * @swagger
 * /api/appointments/{id}/cancel:
 *   put:
 *     tags: [Appointments]
 *     summary: Cancelar una cita
 */
router.put(
  '/:id/cancel',
  authenticateToken,
  appointmentController.cancel.bind(appointmentController)
);

/**
 * @swagger
 * /api/appointments/{id}/reschedule:
 *   put:
 *     tags: [Appointments]
 *     summary: Reprogramar una cita
 */
router.put(
  '/:id/reschedule',
  authenticateToken,
  appointmentController.reschedule.bind(appointmentController)
);

// ==========================================
// RUTAS DE DOCTOR
// ==========================================

/**
 * @swagger
 * /api/appointments/{id}/confirm:
 *   put:
 *     tags: [Appointments]
 *     summary: Confirmar una cita
 */
router.put(
  '/:id/confirm',
  authenticateToken,
  requirePermission('appointments.update'),
  appointmentController.confirm.bind(appointmentController)
);

/**
 * @swagger
 * /api/appointments/doctor/today:
 *   get:
 *     tags: [Appointments]
 *     summary: Obtener citas del dia para el doctor
 */
router.get(
  '/doctor/today',
  authenticateToken,
  requirePermission('appointments.read'),
  appointmentController.getDoctorToday.bind(appointmentController)
);

module.exports = router;

/**
 * Waiting Room Routes - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * LA JOYA DE LA CORONA
 */

const express = require('express');
const router = express.Router();
const waitingRoomController = require('../controllers/waitingRoomController');
const { authenticateToken } = require('../middleware/auth');
const { requireRoles } = require('../middleware/rbacMiddleware');

// ==========================================
// RUTAS DE PACIENTE
// ==========================================

/**
 * @swagger
 * /api/waiting-room/check-in:
 *   post:
 *     tags: [WaitingRoom]
 *     summary: Check-in del paciente (entrar a la cola)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/check-in',
  authenticateToken,
  waitingRoomController.checkIn.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/my-position:
 *   get:
 *     tags: [WaitingRoom]
 *     summary: Obtener mi posicion en la cola
 */
router.get(
  '/my-position',
  authenticateToken,
  waitingRoomController.getMyPosition.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/queue/{doctorId}:
 *   get:
 *     tags: [WaitingRoom]
 *     summary: Ver cola de un doctor (vista publica)
 */
router.get(
  '/queue/:doctorId',
  authenticateToken,
  waitingRoomController.getQueueByDoctor.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/chairs/{doctorId}:
 *   get:
 *     tags: [WaitingRoom]
 *     summary: Visualizacion de "las sillitas"
 */
router.get(
  '/chairs/:doctorId',
  authenticateToken,
  waitingRoomController.getChairs.bind(waitingRoomController)
);

// ==========================================
// RUTAS DE DOCTOR
// ==========================================

/**
 * @swagger
 * /api/waiting-room/queue:
 *   get:
 *     tags: [WaitingRoom]
 *     summary: Obtener cola del doctor actual
 */
router.get(
  '/queue',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.getDoctorQueue.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/call-next:
 *   post:
 *     tags: [WaitingRoom]
 *     summary: Llamar al siguiente paciente
 */
router.post(
  '/call-next',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.callNext.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/call/{queueEntryId}:
 *   post:
 *     tags: [WaitingRoom]
 *     summary: Llamar a un paciente especifico
 */
router.post(
  '/call/:queueEntryId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.callPatient.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/physical-check-in/{queueEntryId}:
 *   put:
 *     tags: [WaitingRoom]
 *     summary: Registrar check-in fisico
 */
router.put(
  '/physical-check-in/:queueEntryId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.physicalCheckIn.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/start-consultation/{queueEntryId}:
 *   post:
 *     tags: [WaitingRoom]
 *     summary: Iniciar consulta
 */
router.post(
  '/start-consultation/:queueEntryId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.startConsultation.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/end-consultation/{queueEntryId}:
 *   post:
 *     tags: [WaitingRoom]
 *     summary: Finalizar consulta
 */
router.post(
  '/end-consultation/:queueEntryId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.endConsultation.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/no-show/{queueEntryId}:
 *   put:
 *     tags: [WaitingRoom]
 *     summary: Marcar paciente como no-show
 */
router.put(
  '/no-show/:queueEntryId',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.markNoShow.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/stats:
 *   get:
 *     tags: [WaitingRoom]
 *     summary: Estadisticas del dia
 */
router.get(
  '/stats',
  authenticateToken,
  requireRoles(['doctor', 'admin']),
  waitingRoomController.getDayStats.bind(waitingRoomController)
);

/**
 * @swagger
 * /api/waiting-room/cancel/{queueEntryId}:
 *   delete:
 *     tags: [WaitingRoom]
 *     summary: Cancelar turno
 */
router.delete(
  '/cancel/:queueEntryId',
  authenticateToken,
  waitingRoomController.cancelTurn.bind(waitingRoomController)
);

module.exports = router;

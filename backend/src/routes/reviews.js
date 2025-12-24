/**
 * Reviews Routes - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Rutas para gestion de reviews y reputacion
 */

const express = require('express');
const router = express.Router();

const reviewsController = require('../controllers/reviewsController');
const reviewsValidator = require('../validators/reviewsValidator');
const { authenticate, authorize } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validateRequest');

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PUBLICAS (sin autenticacion requerida)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/doctor/:doctorProfileId
 * Obtener reviews de un medico (publico)
 */
router.get(
  '/doctor/:doctorProfileId',
  reviewsValidator.doctorProfileIdParam,
  reviewsValidator.reviewsQuery,
  validateRequest,
  reviewsController.getPublicReviews
);

/**
 * GET /api/reviews/doctor/:doctorProfileId/stats
 * Obtener estadisticas de un medico (publico)
 */
router.get(
  '/doctor/:doctorProfileId/stats',
  reviewsValidator.doctorProfileIdParam,
  validateRequest,
  reviewsController.getPublicStats
);

/**
 * GET /api/reviews/doctor/:doctorProfileId/reputation
 * Obtener reputacion de un medico (publico)
 */
router.get(
  '/doctor/:doctorProfileId/reputation',
  reviewsValidator.doctorProfileIdParam,
  validateRequest,
  reviewsController.getPublicReputation
);

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA PACIENTES (requiere autenticacion)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/reviews
 * Crear un nuevo review
 */
router.post(
  '/',
  authenticate,
  authorize('patient'),
  reviewsValidator.createReview,
  validateRequest,
  reviewsController.createReview
);

/**
 * GET /api/reviews/my-reviews
 * Obtener mis reviews como paciente
 */
router.get(
  '/my-reviews',
  authenticate,
  authorize('patient'),
  reviewsValidator.reviewsQuery,
  validateRequest,
  reviewsController.getMyReviews
);

/**
 * GET /api/reviews/can-review/:appointmentId
 * Verificar si puedo dejar review para una cita
 */
router.get(
  '/can-review/:appointmentId',
  authenticate,
  authorize('patient'),
  reviewsValidator.appointmentIdParam,
  validateRequest,
  reviewsController.canLeaveReview
);

/**
 * PUT /api/reviews/:reviewId
 * Actualizar mi review (solo dentro de 7 dias)
 */
router.put(
  '/:reviewId',
  authenticate,
  authorize('patient'),
  reviewsValidator.updateReview,
  validateRequest,
  reviewsController.updateReview
);

/**
 * DELETE /api/reviews/:reviewId
 * Eliminar mi review (solo dentro de 7 dias)
 */
router.delete(
  '/:reviewId',
  authenticate,
  authorize('patient'),
  reviewsValidator.reviewIdParam,
  validateRequest,
  reviewsController.deleteReview
);

/**
 * POST /api/reviews/:reviewId/vote
 * Votar si un review fue util
 */
router.post(
  '/:reviewId/vote',
  authenticate,
  reviewsValidator.voteHelpful,
  validateRequest,
  reviewsController.voteHelpful
);

/**
 * DELETE /api/reviews/:reviewId/vote
 * Eliminar mi voto
 */
router.delete(
  '/:reviewId/vote',
  authenticate,
  reviewsValidator.reviewIdParam,
  validateRequest,
  reviewsController.removeVote
);

/**
 * POST /api/reviews/:reviewId/flag
 * Reportar un review inapropiado
 */
router.post(
  '/:reviewId/flag',
  authenticate,
  reviewsValidator.flagReview,
  validateRequest,
  reviewsController.flagReview
);

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA MEDICOS (requiere autenticacion y rol doctor)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/doctor-dashboard/my-reviews
 * Obtener reviews recibidos como medico
 */
router.get(
  '/doctor-dashboard/my-reviews',
  authenticate,
  authorize('doctor'),
  reviewsValidator.reviewsQuery,
  validateRequest,
  reviewsController.getDoctorReviews
);

/**
 * GET /api/reviews/doctor-dashboard/stats
 * Obtener mis estadisticas como medico
 */
router.get(
  '/doctor-dashboard/stats',
  authenticate,
  authorize('doctor'),
  reviewsController.getDoctorStats
);

/**
 * GET /api/reviews/doctor-dashboard/reputation
 * Obtener mi progreso de reputacion
 */
router.get(
  '/doctor-dashboard/reputation',
  authenticate,
  authorize('doctor'),
  reviewsController.getReputationProgress
);

/**
 * POST /api/reviews/:reviewId/reply
 * Responder a un review
 */
router.post(
  '/:reviewId/reply',
  authenticate,
  authorize('doctor'),
  reviewsValidator.replyToReview,
  validateRequest,
  reviewsController.replyToReview
);

// ═══════════════════════════════════════════════════════════════════════════
// RUTAS PARA ADMIN (requiere autenticacion y rol admin)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/admin/flagged
 * Obtener reviews reportados
 */
router.get(
  '/admin/flagged',
  authenticate,
  authorize('admin'),
  reviewsValidator.flaggedReviewsQuery,
  validateRequest,
  reviewsController.getFlaggedReviews
);

/**
 * POST /api/reviews/:reviewId/moderate
 * Moderar un review
 */
router.post(
  '/:reviewId/moderate',
  authenticate,
  authorize('admin'),
  reviewsValidator.moderateReview,
  validateRequest,
  reviewsController.moderateReview
);

/**
 * POST /api/reviews/admin/recalculate/:doctorProfileId
 * Recalcular ratings de un medico
 */
router.post(
  '/admin/recalculate/:doctorProfileId',
  authenticate,
  authorize('admin'),
  reviewsValidator.doctorProfileIdParam,
  validateRequest,
  reviewsController.recalculateRatings
);

module.exports = router;

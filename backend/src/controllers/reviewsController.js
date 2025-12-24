/**
 * Reviews Controller - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Endpoints para gestion de reviews y reputacion
 */

const reputationService = require('../services/reputationService');
const logger = require('../config/logger');

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS PARA PACIENTES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/reviews
 * Crear un nuevo review para una cita completada
 */
exports.createReview = async (req, res) => {
  try {
    const patientId = req.user.id;
    const reviewData = req.body;

    const review = await reputationService.createReview(patientId, reviewData);

    logger.info(`Review creado por paciente ${patientId} para cita ${reviewData.appointmentId}`);

    res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente',
      data: review
    });
  } catch (error) {
    logger.error('Error creando review:', error);

    if (error.message.includes('no encontrada') ||
        error.message.includes('No tienes permiso') ||
        error.message.includes('completada') ||
        error.message.includes('ya existe')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al crear la reseña'
    });
  }
};

/**
 * PUT /api/reviews/:reviewId
 * Actualizar un review propio (solo dentro de 7 dias)
 */
exports.updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const patientId = req.user.id;
    const updates = req.body;

    const review = await reputationService.updateReview(
      parseInt(reviewId),
      patientId,
      updates
    );

    logger.info(`Review ${reviewId} actualizado por paciente ${patientId}`);

    res.json({
      success: true,
      message: 'Reseña actualizada exitosamente',
      data: review
    });
  } catch (error) {
    logger.error('Error actualizando review:', error);

    if (error.message.includes('no encontrado') ||
        error.message.includes('No tienes permiso') ||
        error.message.includes('7 días')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al actualizar la reseña'
    });
  }
};

/**
 * DELETE /api/reviews/:reviewId
 * Eliminar un review propio (solo dentro de 7 dias)
 */
exports.deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const patientId = req.user.id;

    await reputationService.deleteReview(parseInt(reviewId), patientId);

    logger.info(`Review ${reviewId} eliminado por paciente ${patientId}`);

    res.json({
      success: true,
      message: 'Reseña eliminada exitosamente'
    });
  } catch (error) {
    logger.error('Error eliminando review:', error);

    if (error.message.includes('no encontrado') ||
        error.message.includes('No tienes permiso') ||
        error.message.includes('7 días')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al eliminar la reseña'
    });
  }
};

/**
 * GET /api/reviews/my-reviews
 * Obtener todos los reviews del paciente autenticado
 */
exports.getMyReviews = async (req, res) => {
  try {
    const patientId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const result = await reputationService.getPatientReviews(patientId, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error obteniendo reviews del paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reseñas'
    });
  }
};

/**
 * GET /api/reviews/can-review/:appointmentId
 * Verificar si el paciente puede dejar review para una cita
 */
exports.canLeaveReview = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const patientId = req.user.id;

    const result = await reputationService.canLeaveReview(
      parseInt(appointmentId),
      patientId
    );

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error verificando si puede dejar review:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar'
    });
  }
};

/**
 * POST /api/reviews/:reviewId/vote
 * Votar si un review fue util o no
 */
exports.voteHelpful = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isHelpful } = req.body;
    const userId = req.user.id;

    const result = await reputationService.voteReviewHelpful(
      parseInt(reviewId),
      userId,
      isHelpful
    );

    res.json({
      success: true,
      message: result.created ? 'Voto registrado' : 'Voto actualizado',
      data: result
    });
  } catch (error) {
    logger.error('Error votando review:', error);

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al registrar el voto'
    });
  }
};

/**
 * DELETE /api/reviews/:reviewId/vote
 * Eliminar voto de un review
 */
exports.removeVote = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const userId = req.user.id;

    const removed = await reputationService.removeVote(
      parseInt(reviewId),
      userId
    );

    res.json({
      success: true,
      message: removed ? 'Voto eliminado' : 'No existía voto previo'
    });
  } catch (error) {
    logger.error('Error eliminando voto:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el voto'
    });
  }
};

/**
 * POST /api/reviews/:reviewId/flag
 * Reportar un review inapropiado
 */
exports.flagReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    const review = await reputationService.flagReview(
      parseInt(reviewId),
      reason,
      userId
    );

    logger.info(`Review ${reviewId} reportado por usuario ${userId}`);

    res.json({
      success: true,
      message: 'Reseña reportada para revisión',
      data: review
    });
  } catch (error) {
    logger.error('Error reportando review:', error);

    if (error.message.includes('no encontrado')) {
      return res.status(404).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al reportar la reseña'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS PARA MEDICOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/doctor/my-reviews
 * Obtener reviews recibidos por el medico autenticado
 */
exports.getDoctorReviews = async (req, res) => {
  try {
    const doctorId = req.user.id;
    const { page = 1, limit = 10, rating, sortBy } = req.query;

    // Primero obtener el doctorProfileId
    const { DoctorProfile } = require('../models');
    const profile = await DoctorProfile.findOne({
      where: { userId: doctorId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de médico no encontrado'
      });
    }

    const filters = {};
    if (rating) filters.rating = parseInt(rating);
    if (sortBy) filters.sortBy = sortBy;

    const result = await reputationService.getReviews(profile.id, filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error obteniendo reviews del médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reseñas'
    });
  }
};

/**
 * POST /api/reviews/:reviewId/reply
 * Responder a un review como medico
 */
exports.replyToReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { reply } = req.body;
    const doctorId = req.user.id;

    // Obtener el doctorProfileId
    const { DoctorProfile } = require('../models');
    const profile = await DoctorProfile.findOne({
      where: { userId: doctorId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de médico no encontrado'
      });
    }

    const review = await reputationService.replyToReview(
      parseInt(reviewId),
      profile.id,
      reply
    );

    logger.info(`Doctor ${doctorId} respondió a review ${reviewId}`);

    res.json({
      success: true,
      message: 'Respuesta agregada exitosamente',
      data: review
    });
  } catch (error) {
    logger.error('Error respondiendo review:', error);

    if (error.message.includes('no encontrado') ||
        error.message.includes('No puedes responder')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al responder la reseña'
    });
  }
};

/**
 * GET /api/reviews/doctor/stats
 * Obtener estadisticas de reviews del medico autenticado
 */
exports.getDoctorStats = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Obtener el doctorProfileId
    const { DoctorProfile } = require('../models');
    const profile = await DoctorProfile.findOne({
      where: { userId: doctorId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de médico no encontrado'
      });
    }

    const stats = await reputationService.getReviewStats(profile.id);

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo stats del médico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
};

/**
 * GET /api/reviews/doctor/reputation
 * Obtener progreso de reputacion del medico
 */
exports.getReputationProgress = async (req, res) => {
  try {
    const doctorId = req.user.id;

    // Obtener el doctorProfileId
    const { DoctorProfile } = require('../models');
    const profile = await DoctorProfile.findOne({
      where: { userId: doctorId }
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de médico no encontrado'
      });
    }

    const insights = await reputationService.getDoctorReputationInsights(profile.id);

    res.json({
      success: true,
      data: insights
    });
  } catch (error) {
    logger.error('Error obteniendo progreso de reputación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el progreso de reputación'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS PUBLICOS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/reviews/doctor/:doctorProfileId
 * Obtener reviews de un medico (publico)
 */
exports.getPublicReviews = async (req, res) => {
  try {
    const { doctorProfileId } = req.params;
    const { page = 1, limit = 10, rating, sortBy, hasComment } = req.query;

    const filters = {};
    if (rating) filters.rating = parseInt(rating);
    if (sortBy) filters.sortBy = sortBy;
    if (hasComment === 'true') filters.hasComment = true;

    const result = await reputationService.getReviews(
      parseInt(doctorProfileId),
      filters,
      {
        page: parseInt(page),
        limit: parseInt(limit)
      }
    );

    // Agregar información de votos para usuario autenticado
    if (req.user) {
      const { ReviewHelpfulVote } = require('../models');
      for (const review of result.reviews) {
        const voteStatus = await ReviewHelpfulVote.hasVoted(review.id, req.user.id);
        review.dataValues.userVote = voteStatus;
      }
    }

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error obteniendo reviews públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reseñas'
    });
  }
};

/**
 * GET /api/reviews/doctor/:doctorProfileId/stats
 * Obtener estadisticas de un medico (publico)
 */
exports.getPublicStats = async (req, res) => {
  try {
    const { doctorProfileId } = req.params;

    const stats = await reputationService.getReviewStats(parseInt(doctorProfileId));

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    logger.error('Error obteniendo stats públicos:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las estadísticas'
    });
  }
};

/**
 * GET /api/reviews/doctor/:doctorProfileId/reputation
 * Obtener info de reputacion de un medico (publico)
 */
exports.getPublicReputation = async (req, res) => {
  try {
    const { doctorProfileId } = req.params;

    const { DoctorProfile } = require('../models');
    const profile = await DoctorProfile.findByPk(parseInt(doctorProfileId), {
      attributes: [
        'id', 'averageRating', 'totalReviews', 'totalAppointments',
        'reputationLevel', 'levelUpdatedAt', 'ratingBreakdown'
      ]
    });

    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    const badge = profile.getReputationBadge();
    const levelRequirements = DoctorProfile.getAllLevelRequirements();

    res.json({
      success: true,
      data: {
        averageRating: profile.averageRating,
        totalReviews: profile.totalReviews,
        totalAppointments: profile.totalAppointments,
        reputationLevel: profile.reputationLevel,
        badge,
        ratingBreakdown: profile.ratingBreakdown,
        levelRequirements
      }
    });
  } catch (error) {
    logger.error('Error obteniendo reputación pública:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la reputación'
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ENDPOINTS PARA ADMIN
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/reviews/:reviewId/moderate
 * Moderar un review (aprobar/ocultar/eliminar)
 */
exports.moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { action, reason } = req.body;
    const adminId = req.user.id;

    const review = await reputationService.moderateReview(
      parseInt(reviewId),
      action,
      reason
    );

    logger.info(`Review ${reviewId} moderado (${action}) por admin ${adminId}`);

    res.json({
      success: true,
      message: `Reseña ${action === 'approve' ? 'aprobada' : action === 'hide' ? 'ocultada' : 'eliminada'}`,
      data: review
    });
  } catch (error) {
    logger.error('Error moderando review:', error);

    if (error.message.includes('no encontrado') ||
        error.message.includes('no válida')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al moderar la reseña'
    });
  }
};

/**
 * GET /api/reviews/admin/flagged
 * Obtener reviews reportados para moderacion
 */
exports.getFlaggedReviews = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const result = await reputationService.getFlaggedReviews({
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    logger.error('Error obteniendo reviews reportados:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las reseñas reportadas'
    });
  }
};

/**
 * POST /api/reviews/admin/recalculate/:doctorProfileId
 * Recalcular ratings de un medico
 */
exports.recalculateRatings = async (req, res) => {
  try {
    const { doctorProfileId } = req.params;
    const adminId = req.user.id;

    await reputationService.recalculateRatings(parseInt(doctorProfileId));

    logger.info(`Ratings recalculados para doctor ${doctorProfileId} por admin ${adminId}`);

    res.json({
      success: true,
      message: 'Ratings recalculados exitosamente'
    });
  } catch (error) {
    logger.error('Error recalculando ratings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al recalcular ratings'
    });
  }
};

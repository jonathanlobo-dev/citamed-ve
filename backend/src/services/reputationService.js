/**
 * Reputation Service - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Servicio para gestionar reviews, calificaciones y niveles de reputacion
 */

const { Review, ReviewHelpfulVote, DoctorProfile, Appointment, User, sequelize } = require('../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE REVIEWS
// ═══════════════════════════════════════════════════════════════

/**
 * Crea un nuevo review para una cita completada
 */
async function createReview(appointmentId, patientId, reviewData) {
  const transaction = await sequelize.transaction();

  try {
    // 1. Verificar que la cita existe y esta completada
    const appointment = await Appointment.findByPk(appointmentId, { transaction });
    if (!appointment) {
      throw new Error('Cita no encontrada');
    }

    // 2. Verificar que el paciente es el de la cita
    if (appointment.patientId !== patientId) {
      throw new Error('No tienes permiso para calificar esta cita');
    }

    // 3. Verificar que la cita esta completada
    if (appointment.status !== 'completed') {
      throw new Error('Solo puedes calificar citas completadas');
    }

    // 4. Verificar que la cita ya ocurrio
    if (new Date(appointment.appointmentDate) > new Date()) {
      throw new Error('La cita aun no ha ocurrido');
    }

    // 5. Verificar que no existe review para esta cita
    const existingReview = await Review.findOne({
      where: { appointmentId },
      transaction
    });
    if (existingReview) {
      throw new Error('Ya existe una resena para esta cita');
    }

    // 6. Crear el review
    const review = await Review.create({
      appointmentId,
      doctorProfileId: appointment.doctorProfileId,
      patientId,
      overallRating: reviewData.overallRating,
      punctualityRating: reviewData.punctualityRating,
      treatmentRating: reviewData.treatmentRating,
      clarityRating: reviewData.clarityRating,
      facilitiesRating: reviewData.facilitiesRating,
      comment: reviewData.comment || null,
      wouldRecommend: reviewData.wouldRecommend,
      isVerified: true
    }, { transaction });

    // 7. Actualizar rating breakdown del doctor
    await updateRatingBreakdown(appointment.doctorProfileId, reviewData, 'add', transaction);

    // 8. Verificar y actualizar nivel de reputacion
    await updateReputationLevel(appointment.doctorProfileId, transaction);

    await transaction.commit();

    // Cargar review con datos completos
    const fullReview = await Review.findByPk(review.id, {
      include: [
        { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
        { model: DoctorProfile, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
      ]
    });

    return {
      success: true,
      review: fullReview,
      message: 'Resena creada exitosamente'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Actualiza un review existente (solo dentro de 7 dias)
 */
async function updateReview(reviewId, patientId, reviewData) {
  const transaction = await sequelize.transaction();

  try {
    const review = await Review.findByPk(reviewId, { transaction });

    if (!review) {
      throw new Error('Resena no encontrada');
    }

    if (review.patientId !== patientId) {
      throw new Error('No tienes permiso para editar esta resena');
    }

    // Verificar que esta dentro de 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (review.createdAt < sevenDaysAgo) {
      throw new Error('Solo puedes editar resenas dentro de los primeros 7 dias');
    }

    // Guardar ratings anteriores para actualizar breakdown
    const oldRatings = {
      overallRating: review.overallRating,
      punctualityRating: review.punctualityRating,
      treatmentRating: review.treatmentRating,
      clarityRating: review.clarityRating,
      facilitiesRating: review.facilitiesRating
    };

    // Actualizar review
    await review.update({
      overallRating: reviewData.overallRating,
      punctualityRating: reviewData.punctualityRating,
      treatmentRating: reviewData.treatmentRating,
      clarityRating: reviewData.clarityRating,
      facilitiesRating: reviewData.facilitiesRating,
      comment: reviewData.comment,
      wouldRecommend: reviewData.wouldRecommend,
      wasEdited: true,
      editedAt: new Date()
    }, { transaction });

    // Actualizar breakdown: restar antiguo y sumar nuevo
    await updateRatingBreakdown(review.doctorProfileId, oldRatings, 'subtract', transaction);
    await updateRatingBreakdown(review.doctorProfileId, reviewData, 'add', transaction);

    await transaction.commit();

    return {
      success: true,
      review,
      message: 'Resena actualizada exitosamente'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Elimina un review (solo dentro de 7 dias)
 */
async function deleteReview(reviewId, patientId) {
  const transaction = await sequelize.transaction();

  try {
    const review = await Review.findByPk(reviewId, { transaction });

    if (!review) {
      throw new Error('Resena no encontrada');
    }

    if (review.patientId !== patientId) {
      throw new Error('No tienes permiso para eliminar esta resena');
    }

    // Verificar que esta dentro de 7 dias
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    if (review.createdAt < sevenDaysAgo) {
      throw new Error('Solo puedes eliminar resenas dentro de los primeros 7 dias');
    }

    const doctorProfileId = review.doctorProfileId;
    const ratings = {
      overallRating: review.overallRating,
      punctualityRating: review.punctualityRating,
      treatmentRating: review.treatmentRating,
      clarityRating: review.clarityRating,
      facilitiesRating: review.facilitiesRating
    };

    // Eliminar review
    await review.destroy({ transaction });

    // Actualizar breakdown
    await updateRatingBreakdown(doctorProfileId, ratings, 'subtract', transaction);

    // Verificar nivel
    await updateReputationLevel(doctorProfileId, transaction);

    await transaction.commit();

    return {
      success: true,
      message: 'Resena eliminada exitosamente'
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Respuesta del doctor a un review
 */
async function replyToReview(reviewId, doctorProfileId, replyText) {
  const review = await Review.findByPk(reviewId);

  if (!review) {
    throw new Error('Resena no encontrada');
  }

  if (review.doctorProfileId !== doctorProfileId) {
    throw new Error('No tienes permiso para responder a esta resena');
  }

  if (review.doctorReply) {
    throw new Error('Ya has respondido a esta resena');
  }

  await review.update({
    doctorReply: replyText,
    doctorRepliedAt: new Date()
  });

  return {
    success: true,
    review,
    message: 'Respuesta enviada exitosamente'
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE CONSULTA
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene reviews de un doctor con filtros y paginacion
 */
async function getReviews(doctorProfileId, filters = {}, pagination = {}) {
  const { rating, verified, hasComment, sortBy = 'recent' } = filters;
  const { page = 1, limit = 10 } = pagination;

  const where = {
    doctorProfileId,
    isHidden: false
  };

  if (rating) where.overallRating = rating;
  if (verified !== undefined) where.isVerified = verified;
  if (hasComment) where.comment = { [Op.ne]: null };

  let order;
  switch (sortBy) {
    case 'rating_high':
      order = [['overall_rating', 'DESC'], ['created_at', 'DESC']];
      break;
    case 'rating_low':
      order = [['overall_rating', 'ASC'], ['created_at', 'DESC']];
      break;
    case 'helpful':
      order = [['created_at', 'DESC']];
      break;
    case 'recent':
    default:
      order = [['created_at', 'DESC']];
  }

  const { count, rows } = await Review.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName']
      }
    ],
    order,
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  // Obtener conteo de votos para cada review
  const reviewsWithVotes = await Promise.all(rows.map(async (review) => {
    const votes = await ReviewHelpfulVote.getVoteCount(review.id);
    return {
      ...review.toJSON(),
      helpfulVotes: votes
    };
  }));

  // Obtener stats
  const stats = await getReviewStats(doctorProfileId);

  return {
    success: true,
    reviews: reviewsWithVotes,
    stats,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    }
  };
}

/**
 * Obtiene estadisticas de reviews de un doctor
 */
async function getReviewStats(doctorProfileId) {
  const reviews = await Review.findAll({
    where: {
      doctorProfileId,
      isHidden: false,
      isVerified: true
    },
    attributes: [
      'overallRating',
      'punctualityRating',
      'treatmentRating',
      'clarityRating',
      'facilitiesRating',
      'wouldRecommend'
    ]
  });

  if (reviews.length === 0) {
    return {
      average: 0,
      total: 0,
      breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
      dimensions: {
        punctuality: 0,
        treatment: 0,
        clarity: 0,
        facilities: 0
      },
      wouldRecommendPercent: 0
    };
  }

  const totals = reviews.reduce((acc, r) => {
    acc.overall += r.overallRating;
    acc.punctuality += r.punctualityRating;
    acc.treatment += r.treatmentRating;
    acc.clarity += r.clarityRating;
    acc.facilities += r.facilitiesRating;
    acc.recommend += r.wouldRecommend ? 1 : 0;
    acc.breakdown[r.overallRating]++;
    return acc;
  }, {
    overall: 0, punctuality: 0, treatment: 0, clarity: 0, facilities: 0,
    recommend: 0, breakdown: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 }
  });

  const count = reviews.length;

  return {
    average: parseFloat((totals.overall / count).toFixed(2)),
    total: count,
    breakdown: totals.breakdown,
    dimensions: {
      overall: parseFloat((totals.overall / count).toFixed(2)),
      punctuality: parseFloat((totals.punctuality / count).toFixed(2)),
      treatment: parseFloat((totals.treatment / count).toFixed(2)),
      clarity: parseFloat((totals.clarity / count).toFixed(2)),
      facilities: parseFloat((totals.facilities / count).toFixed(2))
    },
    wouldRecommendPercent: Math.round((totals.recommend / count) * 100)
  };
}

/**
 * Verifica si un paciente puede dejar review
 */
async function canLeaveReview(appointmentId, patientId) {
  const appointment = await Appointment.findByPk(appointmentId);

  if (!appointment) {
    return { canReview: false, reason: 'Cita no encontrada' };
  }

  if (appointment.patientId !== patientId) {
    return { canReview: false, reason: 'No tienes permiso para esta cita' };
  }

  if (appointment.status !== 'completed') {
    return { canReview: false, reason: 'La cita aun no ha sido completada' };
  }

  if (new Date(appointment.appointmentDate) > new Date()) {
    return { canReview: false, reason: 'La cita aun no ha ocurrido' };
  }

  const existingReview = await Review.findOne({ where: { appointmentId } });
  if (existingReview) {
    return { canReview: false, reason: 'Ya existe una resena para esta cita' };
  }

  return { canReview: true, reason: null };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE VOTOS UTILES
// ═══════════════════════════════════════════════════════════════

/**
 * Vota si un review fue util
 */
async function voteReviewHelpful(reviewId, userId, isHelpful) {
  // Verificar que el usuario no es autor del review
  const review = await Review.findByPk(reviewId);
  if (!review) {
    throw new Error('Resena no encontrada');
  }

  if (review.patientId === userId) {
    throw new Error('No puedes votar tu propia resena');
  }

  const { vote, created } = await ReviewHelpfulVote.vote(reviewId, userId, isHelpful);
  const counts = await ReviewHelpfulVote.getVoteCount(reviewId);

  return {
    success: true,
    vote: {
      isHelpful: vote.isHelpful,
      isNew: created
    },
    counts
  };
}

/**
 * Elimina voto de un review
 */
async function removeVote(reviewId, userId) {
  const removed = await ReviewHelpfulVote.removeVote(reviewId, userId);

  if (!removed) {
    throw new Error('Voto no encontrado');
  }

  const counts = await ReviewHelpfulVote.getVoteCount(reviewId);

  return {
    success: true,
    counts
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE MODERACION
// ═══════════════════════════════════════════════════════════════

/**
 * Reporta un review
 */
async function flagReview(reviewId, userId, reason) {
  const review = await Review.findByPk(reviewId);

  if (!review) {
    throw new Error('Resena no encontrada');
  }

  await review.update({
    isFlagged: true,
    flagReason: reason
  });

  return {
    success: true,
    message: 'Resena reportada para revision'
  };
}

/**
 * Modera un review (admin)
 */
async function moderateReview(reviewId, adminId, action, reason) {
  const review = await Review.findByPk(reviewId);

  if (!review) {
    throw new Error('Resena no encontrada');
  }

  switch (action) {
    case 'hide':
      await review.update({ isHidden: true });
      break;
    case 'show':
      await review.update({ isHidden: false, isFlagged: false, flagReason: null });
      break;
    case 'delete':
      const doctorProfileId = review.doctorProfileId;
      const ratings = {
        overallRating: review.overallRating,
        punctualityRating: review.punctualityRating,
        treatmentRating: review.treatmentRating,
        clarityRating: review.clarityRating,
        facilitiesRating: review.facilitiesRating
      };
      await review.destroy();
      await updateRatingBreakdown(doctorProfileId, ratings, 'subtract');
      break;
    default:
      throw new Error('Accion no valida');
  }

  return {
    success: true,
    message: `Resena ${action === 'hide' ? 'ocultada' : action === 'show' ? 'mostrada' : 'eliminada'} exitosamente`
  };
}

/**
 * Obtiene reviews reportados
 */
async function getFlaggedReviews(pagination = {}) {
  const { page = 1, limit = 20 } = pagination;

  const { count, rows } = await Review.findAndCountAll({
    where: { isFlagged: true, isHidden: false },
    include: [
      { model: User, as: 'patient', attributes: ['id', 'firstName', 'lastName'] },
      { model: DoctorProfile, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  return {
    success: true,
    reviews: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE REPUTACION
// ═══════════════════════════════════════════════════════════════

/**
 * Actualiza el rating breakdown de un doctor
 */
async function updateRatingBreakdown(doctorProfileId, ratings, operation, transaction = null) {
  const doctor = await DoctorProfile.findByPk(doctorProfileId, { transaction });

  if (!doctor) return;

  const breakdown = doctor.ratingBreakdown || {
    overall: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    punctuality: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    treatment: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    clarity: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    facilities: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  };

  const modifier = operation === 'add' ? 1 : -1;

  breakdown.overall[ratings.overallRating] = Math.max(0, (breakdown.overall[ratings.overallRating] || 0) + modifier);
  breakdown.punctuality[ratings.punctualityRating] = Math.max(0, (breakdown.punctuality[ratings.punctualityRating] || 0) + modifier);
  breakdown.treatment[ratings.treatmentRating] = Math.max(0, (breakdown.treatment[ratings.treatmentRating] || 0) + modifier);
  breakdown.clarity[ratings.clarityRating] = Math.max(0, (breakdown.clarity[ratings.clarityRating] || 0) + modifier);
  breakdown.facilities[ratings.facilitiesRating] = Math.max(0, (breakdown.facilities[ratings.facilitiesRating] || 0) + modifier);

  await doctor.update({ ratingBreakdown: breakdown }, { transaction });
}

/**
 * Actualiza el nivel de reputacion de un doctor
 */
async function updateReputationLevel(doctorProfileId, transaction = null) {
  const doctor = await DoctorProfile.findByPk(doctorProfileId, { transaction });

  if (!doctor) return { levelChanged: false };

  const oldLevel = doctor.reputationLevel;
  const newLevel = DoctorProfile.calculateLevel(doctor.totalAppointments, doctor.averageRating);

  if (oldLevel !== newLevel) {
    await doctor.update({
      reputationLevel: newLevel,
      levelUpdatedAt: new Date()
    }, { transaction });

    return {
      levelChanged: true,
      oldLevel,
      newLevel
    };
  }

  return { levelChanged: false, level: oldLevel };
}

/**
 * Recalcula todos los ratings de un doctor (funcion de mantenimiento)
 */
async function recalculateRatings(doctorProfileId) {
  const transaction = await sequelize.transaction();

  try {
    const stats = await getReviewStats(doctorProfileId);

    // Contar citas completadas
    const totalAppointments = await Appointment.count({
      where: {
        doctorProfileId,
        status: 'completed'
      }
    });

    // Actualizar doctor
    const doctor = await DoctorProfile.findByPk(doctorProfileId, { transaction });

    await doctor.update({
      averageRating: stats.average,
      totalReviews: stats.total,
      totalAppointments,
      ratingBreakdown: {
        overall: stats.breakdown,
        punctuality: { ...stats.breakdown },
        treatment: { ...stats.breakdown },
        clarity: { ...stats.breakdown },
        facilities: { ...stats.breakdown }
      }
    }, { transaction });

    // Actualizar nivel
    const levelResult = await updateReputationLevel(doctorProfileId, transaction);

    await transaction.commit();

    return {
      success: true,
      doctor: await DoctorProfile.findByPk(doctorProfileId),
      levelChanged: levelResult.levelChanged
    };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

/**
 * Obtiene insights de reputacion para el doctor
 */
async function getDoctorReputationInsights(doctorProfileId) {
  const doctor = await DoctorProfile.findByPk(doctorProfileId);
  if (!doctor) {
    throw new Error('Doctor no encontrado');
  }

  const stats = await getReviewStats(doctorProfileId);
  const progress = doctor.calculateNextLevel();
  const badge = doctor.getReputationBadge();

  // Determinar fortalezas y areas de mejora
  const dimensions = ['punctuality', 'treatment', 'clarity', 'facilities'];
  const dimensionNames = {
    punctuality: 'Puntualidad',
    treatment: 'Trato al paciente',
    clarity: 'Claridad en explicaciones',
    facilities: 'Instalaciones'
  };

  const sortedDimensions = dimensions
    .map(d => ({ key: d, name: dimensionNames[d], rating: stats.dimensions[d] }))
    .sort((a, b) => b.rating - a.rating);

  const strengths = sortedDimensions.slice(0, 2).filter(d => d.rating >= 4.0);
  const improvements = sortedDimensions.slice(-2).filter(d => d.rating < 4.5);

  // Tendencia reciente (ultimos 30 dias)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentReviews = await Review.findAll({
    where: {
      doctorProfileId,
      isHidden: false,
      isVerified: true,
      createdAt: { [Op.gte]: thirtyDaysAgo }
    },
    attributes: ['overallRating']
  });

  const recentAverage = recentReviews.length > 0
    ? recentReviews.reduce((sum, r) => sum + r.overallRating, 0) / recentReviews.length
    : 0;

  const trend = recentAverage > stats.average ? 'improving'
    : recentAverage < stats.average ? 'declining'
    : 'stable';

  return {
    success: true,
    insights: {
      badge,
      progress,
      stats,
      strengths,
      improvements,
      trend: {
        direction: trend,
        recentAverage: parseFloat(recentAverage.toFixed(2)),
        recentCount: recentReviews.length
      },
      recommendations: generateRecommendations(stats, improvements, progress)
    }
  };
}

/**
 * Genera recomendaciones para mejorar
 */
function generateRecommendations(stats, improvements, progress) {
  const recommendations = [];

  if (stats.total < 10) {
    recommendations.push({
      type: 'reviews',
      message: 'Incentiva a tus pacientes a dejar resenas para mejorar tu visibilidad'
    });
  }

  improvements.forEach(dim => {
    if (dim.rating < 4.0) {
      recommendations.push({
        type: 'improvement',
        dimension: dim.key,
        message: `Enfocate en mejorar: ${dim.name} (${dim.rating.toFixed(1)})`
      });
    }
  });

  if (progress.missing && progress.missing.length > 0) {
    recommendations.push({
      type: 'level',
      message: progress.missing[0]
    });
  }

  if (stats.wouldRecommendPercent < 90) {
    recommendations.push({
      type: 'recommendation',
      message: 'Trabaja en aumentar tu tasa de recomendacion (actualmente ' + stats.wouldRecommendPercent + '%)'
    });
  }

  return recommendations;
}

/**
 * Obtiene reviews del paciente
 */
async function getPatientReviews(patientId, pagination = {}) {
  const { page = 1, limit = 10 } = pagination;

  const { count, rows } = await Review.findAndCountAll({
    where: { patientId },
    include: [
      {
        model: DoctorProfile,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'subSpecialty', 'profilePhoto']
      }
    ],
    order: [['created_at', 'DESC']],
    limit: parseInt(limit),
    offset: (parseInt(page) - 1) * parseInt(limit)
  });

  return {
    success: true,
    reviews: rows,
    pagination: {
      total: count,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(count / parseInt(limit))
    }
  };
}

module.exports = {
  // Reviews CRUD
  createReview,
  updateReview,
  deleteReview,
  replyToReview,

  // Consultas
  getReviews,
  getReviewStats,
  canLeaveReview,
  getPatientReviews,

  // Votos
  voteReviewHelpful,
  removeVote,

  // Moderacion
  flagReview,
  moderateReview,
  getFlaggedReviews,

  // Reputacion
  updateRatingBreakdown,
  updateReputationLevel,
  recalculateRatings,
  getDoctorReputationInsights
};

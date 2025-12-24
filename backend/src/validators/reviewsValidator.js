/**
 * Reviews Validator - CITAMED.VE
 * M02 Sub-Partida 3.4 - Sistema de Reputacion con Estrellas
 *
 * Validaciones para endpoints de reviews
 */

const { body, param, query } = require('express-validator');

// ═══════════════════════════════════════════════════════════════════════════
// VALIDACIONES PARA RATINGS
// ═══════════════════════════════════════════════════════════════════════════

const ratingValidation = (fieldName, displayName) => {
  return body(fieldName)
    .isInt({ min: 1, max: 5 })
    .withMessage(`${displayName} debe ser un número entre 1 y 5`);
};

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA CREAR REVIEW
// ═══════════════════════════════════════════════════════════════════════════

exports.createReview = [
  body('appointmentId')
    .isInt({ min: 1 })
    .withMessage('ID de cita inválido'),

  ratingValidation('overallRating', 'Calificación general'),
  ratingValidation('punctualityRating', 'Puntualidad'),
  ratingValidation('treatmentRating', 'Trato'),
  ratingValidation('clarityRating', 'Claridad'),
  ratingValidation('facilitiesRating', 'Instalaciones'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('El comentario no puede exceder 1000 caracteres')
    .customSanitizer(value => {
      // Sanitizar HTML básico
      if (value) {
        return value.replace(/<[^>]*>/g, '');
      }
      return value;
    }),

  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('wouldRecommend debe ser true o false')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA ACTUALIZAR REVIEW
// ═══════════════════════════════════════════════════════════════════════════

exports.updateReview = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido'),

  body('overallRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Calificación general debe ser entre 1 y 5'),

  body('punctualityRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Puntualidad debe ser entre 1 y 5'),

  body('treatmentRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Trato debe ser entre 1 y 5'),

  body('clarityRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Claridad debe ser entre 1 y 5'),

  body('facilitiesRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Instalaciones debe ser entre 1 y 5'),

  body('comment')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('El comentario no puede exceder 1000 caracteres')
    .customSanitizer(value => {
      if (value) {
        return value.replace(/<[^>]*>/g, '');
      }
      return value;
    }),

  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('wouldRecommend debe ser true o false')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES DE PARAMETROS
// ═══════════════════════════════════════════════════════════════════════════

exports.reviewIdParam = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido')
];

exports.appointmentIdParam = [
  param('appointmentId')
    .isInt({ min: 1 })
    .withMessage('ID de cita inválido')
];

exports.doctorProfileIdParam = [
  param('doctorProfileId')
    .isInt({ min: 1 })
    .withMessage('ID de perfil de médico inválido')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA VOTAR
// ═══════════════════════════════════════════════════════════════════════════

exports.voteHelpful = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido'),

  body('isHelpful')
    .isBoolean()
    .withMessage('isHelpful debe ser true o false')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA REPORTAR
// ═══════════════════════════════════════════════════════════════════════════

exports.flagReview = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido'),

  body('reason')
    .trim()
    .notEmpty()
    .withMessage('Debe proporcionar una razón para el reporte')
    .isLength({ min: 10, max: 500 })
    .withMessage('La razón debe tener entre 10 y 500 caracteres')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA RESPUESTA DE MEDICO
// ═══════════════════════════════════════════════════════════════════════════

exports.replyToReview = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido'),

  body('reply')
    .trim()
    .notEmpty()
    .withMessage('La respuesta no puede estar vacía')
    .isLength({ min: 10, max: 500 })
    .withMessage('La respuesta debe tener entre 10 y 500 caracteres')
    .customSanitizer(value => {
      if (value) {
        return value.replace(/<[^>]*>/g, '');
      }
      return value;
    })
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES PARA MODERACION
// ═══════════════════════════════════════════════════════════════════════════

exports.moderateReview = [
  param('reviewId')
    .isInt({ min: 1 })
    .withMessage('ID de reseña inválido'),

  body('action')
    .isIn(['approve', 'hide', 'delete'])
    .withMessage('Acción debe ser: approve, hide o delete'),

  body('reason')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('La razón no puede exceder 500 caracteres')
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDADORES DE QUERY PARAMS PARA LISTADOS
// ═══════════════════════════════════════════════════════════════════════════

exports.reviewsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Límite debe ser entre 1 y 50'),

  query('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Rating debe ser entre 1 y 5'),

  query('sortBy')
    .optional()
    .isIn(['recent', 'rating_high', 'rating_low', 'helpful'])
    .withMessage('sortBy debe ser: recent, rating_high, rating_low o helpful'),

  query('hasComment')
    .optional()
    .isBoolean()
    .withMessage('hasComment debe ser true o false')
];

exports.flaggedReviewsQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Página debe ser un número positivo'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100')
];

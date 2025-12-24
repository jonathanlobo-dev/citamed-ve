// src/validators/sessionValidator.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Validadores para endpoints de sesiones

const { param, query } = require('express-validator');

/**
 * Valida parámetro sessionId (UUID)
 */
const validateSessionId = [
  param('sessionId')
    .isUUID()
    .withMessage('ID de sesión inválido')
];

/**
 * Valida parámetros de paginación para historial
 */
const validateHistoryParams = [
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Límite debe ser entre 1 y 100'),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset debe ser un número positivo')
];

module.exports = {
  validateSessionId,
  validateHistoryParams
};

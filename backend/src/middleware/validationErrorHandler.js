/**
 * Validation Error Handler - CITAMED.VE
 *
 * Middleware para manejar errores de express-validator
 * Formatea errores de validación de forma consistente
 */

const { validationResult } = require('express-validator');

/**
 * Middleware para manejar errores de validación
 * Usar después de los validators de express-validator
 */
const validationErrorHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Formatear errores para respuesta
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value !== undefined ? '[REDACTED]' : undefined,
      location: err.location
    }));

    // Log para debugging (sin valores sensibles)
    console.warn(`[Validation] Failed for ${req.method} ${req.path}:`,
      formattedErrors.map(e => `${e.field}: ${e.message}`).join(', ')
    );

    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Los datos enviados no son válidos',
      errors: formattedErrors
    });
  }

  next();
};

/**
 * Factory para crear handler con opciones personalizadas
 * @param {Object} options - Opciones de configuración
 * @returns {Function} - Middleware
 */
const createValidationHandler = (options = {}) => {
  const {
    statusCode = 400,
    includeValues = false,
    customMessage = null
  } = options;

  return (req, res, next) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      const formattedErrors = errors.array().map(err => ({
        field: err.path || err.param,
        message: err.msg,
        ...(includeValues && process.env.NODE_ENV !== 'production' && {
          value: err.value
        }),
        location: err.location
      }));

      return res.status(statusCode).json({
        success: false,
        error: 'Validation Error',
        message: customMessage || 'Los datos enviados no son válidos',
        errors: formattedErrors
      });
    }

    next();
  };
};

/**
 * Handler específico para errores de autenticación
 * No revela detalles sobre qué campo falló
 */
const authValidationHandler = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    // Log interno con detalles
    console.warn(`[Auth Validation] Failed for ${req.path} from ${req.ip}`);

    // Respuesta genérica (no revelar qué campo falló)
    return res.status(400).json({
      success: false,
      error: 'Validation Error',
      message: 'Credenciales inválidas'
    });
  }

  next();
};

/**
 * Verificar si hay errores sin enviar respuesta
 * Útil para validación condicional
 */
const hasValidationErrors = (req) => {
  const errors = validationResult(req);
  return !errors.isEmpty();
};

/**
 * Obtener errores formateados sin enviar respuesta
 */
const getValidationErrors = (req) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) return null;

  return errors.array().map(err => ({
    field: err.path || err.param,
    message: err.msg
  }));
};

module.exports = {
  validationErrorHandler,
  createValidationHandler,
  authValidationHandler,
  hasValidationErrors,
  getValidationErrors
};

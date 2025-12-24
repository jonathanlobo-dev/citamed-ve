/**
 * Validate Request Middleware - CITAMED.VE
 *
 * Middleware para manejar errores de validación de express-validator
 */

const { validationResult } = require('express-validator');

/**
 * Middleware que verifica los resultados de express-validator
 * y retorna errores 400 si hay problemas de validación
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map(err => ({
      field: err.path || err.param,
      message: err.msg,
      value: err.value
    }));

    return res.status(400).json({
      success: false,
      message: 'Error de validación',
      errors: formattedErrors
    });
  }

  next();
};

module.exports = { validateRequest };

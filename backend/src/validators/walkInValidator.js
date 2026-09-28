/**
 * walkInValidator.js - CITAMED.VE
 * M03 / Semana 7 - Validador para Consulta sin Cita (Walk-in)
 */

const { body } = require('express-validator');

const walkInValidator = [
  body().custom((value, { req }) => {
    if (!req.body.patientId && !req.body.newPatient) {
      throw new Error('Debe especificar un patientId o los datos de newPatient');
    }
    return true;
  }),

  // Validación cuando viene patientId (Body A)
  body('patientId')
    .optional()
    .isInt({ min: 1 })
    .withMessage('patientId debe ser un número entero positivo')
    .toInt(),

  // Validaciones cuando viene newPatient (Body B)
  body('newPatient.firstName')
    .if(body('newPatient').exists())
    .trim()
    .notEmpty()
    .withMessage('El nombre del paciente es obligatorio')
    .isLength({ min: 2, max: 60 })
    .withMessage('El nombre debe tener entre 2 y 60 caracteres'),

  body('newPatient.lastName')
    .if(body('newPatient').exists())
    .trim()
    .notEmpty()
    .withMessage('El apellido del paciente es obligatorio')
    .isLength({ min: 2, max: 60 })
    .withMessage('El apellido debe tener entre 2 y 60 caracteres'),

  body('newPatient.phone')
    .if(body('newPatient').exists())
    .trim()
    .notEmpty()
    .withMessage('El teléfono es obligatorio'),

  body('newPatient.identificationType')
    .if((value, { req }) => req.body.newPatient && !req.body.newPatient.noIdentification)
    .trim()
    .notEmpty()
    .withMessage('El tipo de identificación es obligatorio (V o E)')
    .toUpperCase()
    .isIn(['V', 'E'])
    .withMessage('El tipo de identificación debe ser V o E'),

  body('newPatient.identificationNumber')
    .if((value, { req }) => req.body.newPatient && !req.body.newPatient.noIdentification)
    .notEmpty()
    .withMessage('El número de cédula es obligatorio'),

  body('newPatient.email')
    .if((value, { req }) => req.body.newPatient && req.body.newPatient.email)
    .trim()
    .isEmail()
    .withMessage('El correo electrónico no es válido')
    .normalizeEmail(),

  body('newPatient.dateOfBirth')
    .if((value, { req }) => req.body.newPatient && req.body.newPatient.dateOfBirth)
    .trim()
    .isISO8601()
    .withMessage('La fecha de nacimiento debe tener formato YYYY-MM-DD'),

  body('newPatient.gender')
    .if((value, { req }) => req.body.newPatient && req.body.newPatient.gender)
    .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
    .withMessage('El sexo debe ser male, female, other o prefer_not_to_say'),

  body('reasonForVisit')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('El motivo de consulta no puede exceder 500 caracteres')
];

module.exports = {
  walkInValidator
};

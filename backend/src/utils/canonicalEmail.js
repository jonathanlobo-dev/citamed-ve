/**
 * canonicalEmail.js - CITAMED.VE
 * Deja un correo igual a como lo guarda el registro y lo busca el inicio de sesión
 * (express-validator normalizeEmail: en Gmail quita puntos y lo que va después de "+").
 * Toda cuenta creada por otra vía (cita sin registro, asistente, consulta sin cita, Excel)
 * debe pasar por aquí; si no, la persona no puede entrar con su correo.
 */
const validator = require('validator');

function canonicalEmail(email) {
  const clean = String(email || '').trim().toLowerCase();
  if (!clean) return clean;
  return validator.normalizeEmail(clean) || clean;
}

module.exports = { canonicalEmail };

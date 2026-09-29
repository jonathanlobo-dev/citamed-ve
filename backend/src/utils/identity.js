/**
 * identity.js - CITAMED.VE
 * M03 / Semana 7 - Normalización de Cédula y Teléfono venezolano
 */

/**
 * Normaliza la cédula venezolana al formato 'V-12345678' o 'E-12345678'
 * @param {string} type - 'V' o 'E'
 * @param {string|number} number - Número de cédula
 * @returns {string} Cédula normalizada (ej: 'V-20111222')
 */
function normalizeCedula(type, number) {
  const t = String(type || '').trim().toUpperCase();
  if (t !== 'V' && t !== 'E') {
    const error = new Error('Tipo de documento inválido: debe ser V o E');
    error.statusCode = 400;
    throw error;
  }

  const digits = String(number || '').replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 9) {
    const error = new Error('Cédula inválida: debe tener entre 6 y 9 dígitos');
    error.statusCode = 400;
    throw error;
  }

  return `${t}-${digits}`;
}

/**
 * Normaliza un número telefónico venezolano al formato internacional '+584141234567'
 * @param {string} phone - Teléfono
 * @returns {string} Teléfono normalizado (+58 seguido de 10 dígitos, 13 caracteres en total)
 */
function normalizePhoneVE(phone) {
  if (!phone) {
    const error = new Error('Teléfono no válido');
    error.statusCode = 400;
    throw error;
  }

  let cleaned = String(phone).replace(/[\s().-]/g, '');

  if (cleaned.startsWith('0')) {
    cleaned = '+58' + cleaned.slice(1);
  } else if (cleaned.startsWith('58')) {
    cleaned = '+' + cleaned;
  } else if (!cleaned.startsWith('+58') && cleaned.startsWith('+')) {
    // Si viene con otro código de país no venezolano
    const error = new Error('Teléfono no válido: debe ser un número venezolano');
    error.statusCode = 400;
    throw error;
  } else if (!cleaned.startsWith('+58')) {
    // Si viene solo con los 10 dígitos (ej 4141234567)
    cleaned = '+58' + cleaned;
  }

  if (cleaned.length !== 13 || !/^\+58\d{10}$/.test(cleaned)) {
    const error = new Error('Teléfono no válido');
    error.statusCode = 400;
    throw error;
  }

  return cleaned;
}

/**
 * Cédula para mostrar. El número se guarda ya con su letra ('V-18222333'); identificationType
 * es el tipo de documento ('CI', 'passport'), no la letra, así que no se antepone.
 * Registros viejos sin guion ('V18222333') o solo con dígitos se completan.
 * @param {string} identificationNumber
 * @returns {string|null}
 */
function formatCedula(identificationNumber) {
  if (!identificationNumber) return null;
  const raw = String(identificationNumber).trim().toUpperCase();
  const withLetter = raw.match(/^([VEJ])-?(\d[\d.]*)$/);
  if (withLetter) return `${withLetter[1]}-${withLetter[2].replace(/\./g, '')}`;
  if (/^\d[\d.]*$/.test(raw)) return `V-${raw.replace(/\./g, '')}`;
  return raw;
}

module.exports = {
  normalizeCedula,
  normalizePhoneVE,
  formatCedula
};

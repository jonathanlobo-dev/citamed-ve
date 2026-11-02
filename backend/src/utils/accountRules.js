/**
 * accountRules.js - CITAMED.VE
 * Reglas de "Mi cuenta": qué datos identifican a la persona (y solo un admin puede cambiar)
 * y cómo se validan los cambios que se piden. Lógica pura, sin base de datos.
 */

const NAME_RE = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ][A-Za-zÁÉÍÓÚÜÑáéíóúüñ' -]{1,59}$/;
const CEDULA_RE = /^[VE]-?\d{6,9}$/i;
const MPPS_RE = /^[A-Za-z0-9-]{3,20}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Datos que identifican a la persona: no se editan solos, se piden con un motivo y un admin decide
const PROTECTED_FIELDS = {
  firstName: { label: 'Nombre', roles: ['patient', 'doctor', 'provider', 'assistant'] },
  lastName: { label: 'Apellido', roles: ['patient', 'doctor', 'provider', 'assistant'] },
  identificationNumber: { label: 'Cédula', roles: ['patient'] },
  mppsNumber: { label: 'Número de MPPS', roles: ['doctor'] }
};

const REASON_MIN = 10;
const REASON_MAX = 500;

function fail(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function protectedFieldsForRole(role) {
  return Object.entries(PROTECTED_FIELDS)
    .filter(([, def]) => def.roles.includes(role))
    .map(([field, def]) => ({ field, label: def.label }));
}

function isValidEmail(email) {
  return typeof email === 'string' && email.length <= 255 && EMAIL_RE.test(email.trim());
}

function normalizeEmail(email) {
  if (!isValidEmail(email)) throw fail('Escribe un correo válido');
  return email.trim().toLowerCase();
}

/** Valida y normaliza una solicitud de cambio de un dato protegido */
function validateChangeRequest({ field, value, reason, role }) {
  const def = Object.prototype.hasOwnProperty.call(PROTECTED_FIELDS, field) ? PROTECTED_FIELDS[field] : null;
  if (!def || !def.roles.includes(role)) {
    throw fail('Ese dato no se puede cambiar con una solicitud');
  }

  const text = typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
  let normalized;
  if (field === 'firstName' || field === 'lastName') {
    if (!NAME_RE.test(text)) throw fail(`${def.label} no válido: usa solo letras (entre 2 y 60)`);
    normalized = text;
  } else if (field === 'identificationNumber') {
    const compact = text.replace(/[.\s]/g, '');
    if (!CEDULA_RE.test(compact)) throw fail('Cédula no válida: usa el formato V-12345678');
    normalized = compact.toUpperCase();
  } else {
    if (!MPPS_RE.test(text)) throw fail('Número de MPPS no válido');
    normalized = text.toUpperCase();
  }

  const why = typeof reason === 'string' ? reason.trim() : '';
  if (why.length < REASON_MIN) throw fail(`Cuéntanos el motivo del cambio (mínimo ${REASON_MIN} caracteres)`);
  if (why.length > REASON_MAX) throw fail(`El motivo es muy largo (máximo ${REASON_MAX} caracteres)`);

  return { field, value: normalized, reason: why };
}

module.exports = {
  PROTECTED_FIELDS,
  REASON_MIN,
  REASON_MAX,
  protectedFieldsForRole,
  isValidEmail,
  normalizeEmail,
  validateChangeRequest
};

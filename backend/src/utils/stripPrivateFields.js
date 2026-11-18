/**
 * stripPrivateFields.js - CITAMED.VE
 * Las notas privadas del médico (doctorNotes) nunca salen hacia un paciente, venga de la ruta que venga
 * (por ejemplo, la cita completa que devuelve "cancelar"). Se aplica a todas las respuestas JSON de un paciente.
 */
const PRIVATE_FOR_PATIENT = new Set(['doctorNotes', 'doctor_notes']);

function strip(value, depth = 0) {
  if (depth > 12 || value === null || typeof value !== 'object') return value;
  if (Array.isArray(value)) return value.map((v) => strip(v, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(value)) {
    if (PRIVATE_FOR_PATIENT.has(k)) continue;
    out[k] = strip(v, depth + 1);
  }
  return out;
}

function stripForPatient(body) {
  if (body === null || typeof body !== 'object') return body;
  // Convierte instancias de Sequelize (toJSON) a objetos planos antes de limpiar
  return strip(JSON.parse(JSON.stringify(body)));
}

module.exports = { stripForPatient, PRIVATE_FOR_PATIENT };

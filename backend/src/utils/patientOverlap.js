/**
 * patientOverlap.js - CITAMED.VE
 * Un paciente no puede tener dos citas activas que se crucen en la misma fecha,
 * aunque sean con médicos distintos (QA de Nacho, 23/11).
 */
const INACTIVE = ['cancelled_patient', 'cancelled_doctor', 'no_show', 'rescheduled', 'completed'];

const toMinutes = (t) => {
  const [h, m] = String(t || '').split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

/**
 * Devuelve la primera cita de `existing` que se cruza con la nueva (hora + duración), o null.
 * `existing`: citas del paciente en esa fecha ({ id, appointmentTime, duration, status }).
 */
function findPatientOverlap(existing, appointmentTime, duration = 30, excludeId = null) {
  const start = toMinutes(appointmentTime);
  const end = start + (Number(duration) || 30);
  return (existing || []).find((a) => {
    if (excludeId && a.id === excludeId) return false;
    if (INACTIVE.includes(a.status)) return false;
    const s = toMinutes(a.appointmentTime);
    const e = s + (Number(a.duration) || 30);
    return start < e && s < end;
  }) || null;
}

const OVERLAP_MESSAGE = 'Ya tienes otra cita a esa hora. Elige otro horario o cancela la otra cita primero.';

module.exports = { findPatientOverlap, OVERLAP_MESSAGE, INACTIVE_STATUSES: INACTIVE };

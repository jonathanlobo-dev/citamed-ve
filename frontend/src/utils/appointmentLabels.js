/**
 * Textos de citas en español para mostrar al usuario (QA ASI-UX-001, PAC-UX-006).
 */
export const APPOINTMENT_STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  in_progress: 'En consulta',
  completed: 'Atendida',
  cancelled_patient: 'Cancelada por el paciente',
  cancelled_doctor: 'Cancelada por el médico',
  no_show: 'No asistió',
  rescheduled: 'Reprogramada'
};

export const appointmentStatusLabel = (status) => APPOINTMENT_STATUS_LABELS[status] || status || '';

/** "14:00:00" -> "14:00" */
export const shortTime = (time) => (time ? String(time).slice(0, 5) : '');

/** "2026-11-21" -> "21/11/2026" sin pasar por new Date (en Caracas se correría un día) */
export const ymdToDmy = (value) => {
  const [y, m, d] = String(value || '').split('T')[0].split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(value || '');
};

/** "17:30:00" -> "5:30 p. m." (hora de reloj normal, sin pasar por new Date) */
export function formatTime12(time) {
  if (!/^\d{1,2}:\d{2}/.test(String(time || ''))) return '';
  const [h, m] = String(time).split(':').map(Number);
  const suffix = h < 12 ? 'a. m.' : 'p. m.';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

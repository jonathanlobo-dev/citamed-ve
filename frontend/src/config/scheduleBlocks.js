// Bloques de atención que el médico puede activar. Las horas son una sugerencia y cada médico las ajusta.
export const SCHEDULE_PARTS = [
  { key: 'morning', label: 'Mañana', startTime: '08:00', endTime: '12:00' },
  { key: 'afternoon', label: 'Tarde', startTime: '13:00', endTime: '17:00' },
  { key: 'evening', label: 'Noche', startTime: '18:00', endTime: '21:00' }
];

// A qué bloque pertenece una hora de inicio ('08:00' o '08:00:00'). Se usa para rotular horarios ya guardados.
export function partOfTime(startTime) {
  const hour = parseInt(String(startTime || '').slice(0, 2), 10);
  if (Number.isNaN(hour) || hour < 12) return SCHEDULE_PARTS[0];
  if (hour < 18) return SCHEDULE_PARTS[1];
  return SCHEDULE_PARTS[2];
}

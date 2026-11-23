export const CONSULTATION_TYPE_OPTIONS = ['presencial', 'telemedicina', 'domicilio'];

/** El servidor guarda un solo tipo: si el médico marca varios se guarda "mixto" */
export function typesToValue(types) {
  if (types.length === 1) return types[0];
  return types.length > 1 ? 'mixto' : 'presencial';
}
export function valueToTypes(value) {
  if (value === 'mixto') return [...CONSULTATION_TYPE_OPTIONS];
  return CONSULTATION_TYPE_OPTIONS.includes(value) ? [value] : ['presencial'];
}

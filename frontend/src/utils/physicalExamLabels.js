/**
 * physicalExamLabels.js - CITAMED.VE
 * Nombres en español de los sistemas del examen físico (claves que guarda el backend).
 */

export const EXAM_SYSTEM_LABELS = {
  general: 'General',
  headNeck: 'Cabeza y cuello',
  cardiovascular: 'Cardiovascular',
  respiratory: 'Respiratorio',
  abdomen: 'Abdomen',
  extremities: 'Extremidades',
  neurological: 'Neurológico',
  skin: 'Piel'
};

export const examSystemLabel = (key) => EXAM_SYSTEM_LABELS[key] || key;

export const SEVERITY_LABELS = {
  mild: 'Leve',
  moderate: 'Moderada',
  severe: 'Severa',
  life_threatening: 'Peligro de muerte'
};

export const ALLERGY_TYPE_LABELS = {
  medication: 'Medicamento',
  food: 'Alimento',
  environmental: 'Ambiental',
  other: 'Otro'
};

export const CONDITION_STATUS_LABELS = {
  active: 'Activa',
  resolved: 'Resuelta',
  chronic: 'Crónica'
};

export const labelOf = (map, value) => (value ? map[value] || value : '');

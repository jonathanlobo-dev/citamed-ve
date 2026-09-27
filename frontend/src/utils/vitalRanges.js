/**
 * Vital Signs Ranges & Utilities - CITAMED.VE
 * Rangos biológicos para adultos (>= 18 años) y cálculo de IMC
 */

export const ADULT_VITAL_RANGES = {
  bloodPressureSystolic: {
    min: 90,
    max: 139,
    unit: 'mmHg',
    label: 'TA Sistólica'
  },
  bloodPressureDiastolic: {
    min: 60,
    max: 89,
    unit: 'mmHg',
    label: 'TA Diastólica'
  },
  heartRate: {
    min: 60,
    max: 100,
    unit: 'lpm',
    label: 'Frecuencia Cardíaca'
  },
  respiratoryRate: {
    min: 12,
    max: 20,
    unit: 'rpm',
    label: 'Frecuencia Respiratoria'
  },
  temperature: {
    min: 35.5,
    max: 37.9,
    unit: '°C',
    label: 'Temperatura'
  },
  oxygenSaturation: {
    min: 95,
    max: 100,
    unit: '%',
    label: 'Saturación O₂'
  },
  bloodGlucose: {
    min: 70,
    max: 140,
    unit: 'mg/dL',
    label: 'Glucemia'
  }
};

/**
 * Determina si un signo vital está fuera de rango para adultos (>= 18 años)
 * Si el paciente tiene menos de 18 años, no resalta según la especificación.
 *
 * @param {string} key - Clave del signo vital
 * @param {number|string} value - Valor ingresado
 * @param {number|null} [age] - Edad del paciente en años
 * @returns {boolean} true si está fuera de rango
 */
export function isVitalAbnormal(key, value, age) {
  if (value === '' || value === null || value === undefined) return false;
  const num = parseFloat(value);
  if (isNaN(num)) return false;

  // Solo evaluar para adultos (18 años o más, o edad no especificada)
  if (typeof age === 'number' && age < 18) {
    return false;
  }

  const range = ADULT_VITAL_RANGES[key];
  if (!range) return false;

  if (range.min !== undefined && num < range.min) return true;
  if (range.max !== undefined && num > range.max) return true;

  return false;
}

/**
 * Calcula el IMC (Índice de Masa Corporal)
 * @param {number|string} weightKg - Peso en kilogramos
 * @param {number|string} heightCm - Talla en centímetros
 * @returns {{ bmi: number|null, category: string, color: string }}
 */
export function calculateBMI(weightKg, heightCm) {
  const w = parseFloat(weightKg);
  const h = parseFloat(heightCm);

  if (!w || !h || w <= 0 || h <= 0) {
    return { bmi: null, category: '', color: '' };
  }

  const heightM = h / 100;
  const bmi = parseFloat((w / (heightM * heightM)).toFixed(1));

  let category = '';
  let color = '';

  if (bmi < 18.5) {
    category = 'Bajo peso';
    color = 'text-blue-600 bg-blue-50 border-blue-200';
  } else if (bmi <= 24.9) {
    category = 'Peso normal';
    color = 'text-green-700 bg-green-50 border-green-200';
  } else if (bmi <= 29.9) {
    category = 'Sobrepeso';
    color = 'text-amber-700 bg-amber-50 border-amber-200';
  } else if (bmi <= 34.9) {
    category = 'Obesidad grado I';
    color = 'text-orange-700 bg-orange-50 border-orange-200';
  } else if (bmi <= 39.9) {
    category = 'Obesidad grado II';
    color = 'text-red-700 bg-red-50 border-red-200';
  } else {
    category = 'Obesidad grado III';
    color = 'text-purple-700 bg-purple-50 border-purple-200';
  }

  return { bmi, category, color };
}

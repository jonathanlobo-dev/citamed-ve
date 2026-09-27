/**
 * clinicalNote.js - CITAMED.VE
 * M03 / Semana 6 - Validación y normalización de notas clínicas (SOAP, signos vitales, examen físico)
 */

const MAX_TEXT_LENGTH = 5000;
const MAX_FINDINGS_LENGTH = 2000;

const VITAL_RANGES = {
  systolic: { min: 50, max: 260, label: 'Presión sistólica (50 - 260 mmHg)' },
  diastolic: { min: 30, max: 160, label: 'Presión diastólica (30 - 160 mmHg)' },
  heartRate: { min: 20, max: 250, label: 'Frecuencia cardíaca (20 - 250 lpm)' },
  respiratoryRate: { min: 5, max: 80, label: 'Frecuencia respiratoria (5 - 80 rpm)' },
  temperature: { min: 30, max: 45, label: 'Temperatura (30 - 45 °C)' },
  oxygenSaturation: { min: 50, max: 100, label: 'Saturación de oxígeno (50 - 100 %)' },
  weightKg: { min: 0.5, max: 400, label: 'Peso (0.5 - 400 kg)' },
  heightCm: { min: 30, max: 250, label: 'Talla/Altura (30 - 250 cm)' },
  glucose: { min: 20, max: 800, label: 'Glucemia (20 - 800 mg/dL)' }
};

const PHYSICAL_EXAM_SYSTEMS = [
  'general',
  'headNeck',
  'cardiovascular',
  'respiratory',
  'abdomen',
  'extremities',
  'neurological',
  'skin'
];

const VALID_EXAM_STATUSES = ['normal', 'abnormal', 'not_evaluated'];

/**
 * Valida y recorta campos de la nota SOAP
 */
function validateSoapNote(soapNote) {
  if (!soapNote || typeof soapNote !== 'object' || Array.isArray(soapNote)) {
    return null;
  }

  const clean = {};
  const fields = ['subjective', 'objective', 'assessment', 'plan'];

  for (const field of fields) {
    if (soapNote[field] !== undefined && soapNote[field] !== null) {
      if (typeof soapNote[field] === 'string') {
        clean[field] = soapNote[field].trim().slice(0, MAX_TEXT_LENGTH);
      } else {
        clean[field] = String(soapNote[field]).trim().slice(0, MAX_TEXT_LENGTH);
      }
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Valida los signos vitales y calcula IMC
 */
function validateVitalSigns(vitalSigns) {
  if (!vitalSigns || typeof vitalSigns !== 'object' || Array.isArray(vitalSigns)) {
    return null;
  }

  const clean = {};

  for (const [key, range] of Object.entries(VITAL_RANGES)) {
    const val = vitalSigns[key];
    if (val !== undefined && val !== null && val !== '') {
      const num = Number(val);
      if (isNaN(num)) {
        const error = new Error(`El valor de ${range.label} debe ser un número válido`);
        error.statusCode = 400;
        throw error;
      }
      if (num < range.min || num > range.max) {
        const error = new Error(`Valor fuera de rango permitido para ${range.label}`);
        error.statusCode = 400;
        throw error;
      }
      clean[key] = num;
    }
  }

  // Calcular IMC si existen peso y talla
  if (clean.weightKg && clean.heightCm) {
    const heightM = clean.heightCm / 100;
    if (heightM > 0) {
      clean.bmi = Number((clean.weightKg / (heightM * heightM)).toFixed(1));
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Valida el examen físico por sistemas
 */
function validatePhysicalExam(physicalExam) {
  if (!physicalExam || typeof physicalExam !== 'object' || Array.isArray(physicalExam)) {
    return null;
  }

  const clean = {};

  for (const system of PHYSICAL_EXAM_SYSTEMS) {
    const data = physicalExam[system];
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      const status = data.status || 'not_evaluated';
      if (!VALID_EXAM_STATUSES.includes(status)) {
        const error = new Error(`Estado inválido para examen físico en ${system}. Permitidos: ${VALID_EXAM_STATUSES.join(', ')}`);
        error.statusCode = 400;
        throw error;
      }

      const findings = typeof data.findings === 'string'
        ? data.findings.trim().slice(0, MAX_FINDINGS_LENGTH)
        : '';

      clean[system] = {
        status,
        findings
      };
    }
  }

  return Object.keys(clean).length > 0 ? clean : null;
}

/**
 * Valida y limpia doctorNotes
 */
function validateDoctorNotes(notes) {
  if (notes === undefined || notes === null) return undefined;
  if (typeof notes === 'string') {
    return notes.trim().slice(0, MAX_TEXT_LENGTH);
  }
  return String(notes).trim().slice(0, MAX_TEXT_LENGTH);
}

/**
 * Valida conjunto completo de nota clínica
 */
function validateClinicalNoteData({ soapNote, vitalSigns, physicalExam, doctorNotes } = {}) {
  return {
    soapNote: validateSoapNote(soapNote),
    vitalSigns: validateVitalSigns(vitalSigns),
    physicalExam: validatePhysicalExam(physicalExam),
    doctorNotes: validateDoctorNotes(doctorNotes)
  };
}

module.exports = {
  validateSoapNote,
  validateVitalSigns,
  validatePhysicalExam,
  validateDoctorNotes,
  validateClinicalNoteData,
  VITAL_RANGES,
  PHYSICAL_EXAM_SYSTEMS
};

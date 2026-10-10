/**
 * medicalVocabulary.js - CITAMED.VE
 * Vocabulario de medicina humana para el dictado: sesga a Whisper hacia los nombres correctos
 * y corrige, de forma determinista y conservadora, errores típicos de transcripción
 * (tildes perdidas y nombres de fármacos escritos con otra ortografía, como "acitromicina").
 *
 * Solo toca palabras que sean EXACTAMENTE un término del vocabulario (sin tildes ni mayúsculas) o
 * que estén a una o dos letras de distancia de un fármaco largo y distintivo. No modifica números,
 * dosis ni unidades.
 */

// Fármacos de uso frecuente en consulta (forma correcta, con tilde cuando corresponde)
const DRUGS = [
  // Antibióticos y antiinfecciosos
  'amoxicilina', 'clavulánico', 'azitromicina', 'claritromicina', 'eritromicina', 'cefalexina', 'cefadroxilo',
  'cefuroxima', 'ceftriaxona', 'cefixima', 'ciprofloxacino', 'levofloxacino', 'norfloxacina', 'doxiciclina',
  'tetraciclina', 'clindamicina', 'metronidazol', 'tinidazol', 'nitrofurantoína', 'trimetoprima',
  'sulfametoxazol', 'gentamicina', 'amikacina', 'vancomicina', 'penicilina', 'benzatínica', 'fluconazol',
  'ketoconazol', 'clotrimazol', 'nistatina', 'aciclovir', 'oseltamivir', 'albendazol', 'mebendazol',
  'ivermectina', 'nitazoxanida', 'secnidazol',
  // Analgésicos y antiinflamatorios
  'acetaminofén', 'paracetamol', 'ibuprofeno', 'diclofenaco', 'naproxeno', 'ketorolaco', 'meloxicam',
  'celecoxib', 'etoricoxib', 'piroxicam', 'dexametasona', 'prednisona', 'prednisolona', 'metilprednisolona',
  'betametasona', 'hidrocortisona', 'tramadol', 'dipirona', 'metamizol', 'codeína', 'morfina',
  // Digestivo
  'omeprazol', 'esomeprazol', 'pantoprazol', 'lansoprazol', 'ranitidina', 'famotidina', 'domperidona',
  'metoclopramida', 'ondansetrón', 'hioscina', 'loperamida', 'simeticona', 'lactulosa',
  // Cardiovascular
  'losartán', 'valsartán', 'telmisartán', 'enalapril', 'captopril', 'lisinopril', 'amlodipino', 'nifedipino',
  'atenolol', 'metoprolol', 'carvedilol', 'bisoprolol', 'propranolol', 'hidroclorotiazida', 'furosemida',
  'espironolactona', 'clortalidona', 'digoxina', 'amiodarona', 'isosorbide', 'warfarina', 'clopidogrel',
  'enoxaparina', 'rivaroxabán', 'ácido acetilsalicílico', 'atorvastatina', 'rosuvastatina', 'simvastatina',
  'ezetimiba', 'fenofibrato',
  // Metabolismo y endocrino
  'metformina', 'glibenclamida', 'glimepirida', 'sitagliptina', 'empagliflozina', 'insulina', 'glargina',
  'levotiroxina', 'alopurinol', 'colchicina',
  // Respiratorio y alergia
  'salbutamol', 'budesonida', 'montelukast', 'ambroxol', 'acetilcisteína', 'bromhexina', 'fluticasona',
  'ipratropio', 'beclometasona', 'loratadina', 'desloratadina', 'cetirizina', 'levocetirizina',
  'clorfeniramina', 'difenhidramina',
  // Neurología y salud mental
  'sertralina', 'fluoxetina', 'escitalopram', 'amitriptilina', 'alprazolam', 'clonazepam', 'diazepam',
  'lorazepam', 'carbamazepina', 'fenitoína', 'levetiracetam', 'gabapentina', 'pregabalina', 'sumatriptán',
  // Otros
  'sildenafil', 'tamsulosina', 'finasterida', 'misoprostol', 'metilergometrina', 'oxitocina'
];

// Términos clínicos que suelen llegar sin tilde o mal escritos (forma correcta)
const TERMS = [
  'hipertensión', 'hipotensión', 'tensión', 'presión', 'arterial', 'glicemia', 'glucemia', 'hematología',
  'uroanálisis', 'creatinina', 'colesterol', 'triglicéridos', 'lipídico', 'hemoglobina', 'electrolitos',
  'radiografía', 'ecografía', 'tomografía', 'electrocardiograma', 'ecocardiograma', 'resonancia',
  'faringoamigdalitis', 'amigdalitis', 'faringitis', 'rinofaringitis', 'sinusitis', 'bronquitis', 'neumonía',
  'gastroenteritis', 'gastritis', 'colitis', 'apendicitis', 'diverticulitis', 'infección', 'urinaria',
  'cistitis', 'pielonefritis', 'dermatitis', 'conjuntivitis', 'otitis', 'lumbalgia', 'cervicalgia',
  'cefalea', 'migraña', 'odinofagia', 'disnea', 'taquicardia', 'bradicardia', 'taquipnea', 'palpitaciones',
  'mareos', 'náuseas', 'vómitos', 'diarrea', 'estreñimiento', 'astenia', 'adinamia', 'fiebre', 'escalofríos',
  'edema', 'cianosis', 'ictericia', 'eritematosa', 'eritematoso', 'exudado', 'amigdalino', 'adenopatías',
  'cervicales', 'abdomen', 'epigastrio', 'hipocondrio', 'torácico', 'precordial', 'auscultación', 'soplos',
  'rítmicos', 'murmullo', 'vesicular', 'sibilancias', 'estertores', 'crepitantes', 'neurológico',
  'diabetes', 'mellitus', 'asma', 'bronquial', 'dislipidemia', 'obesidad', 'sobrepeso', 'anemia',
  'hipotiroidismo', 'hipertiroidismo', 'artritis', 'artrosis', 'gota', 'epilepsia', 'depresión', 'ansiedad',
  'embarazo', 'gestación', 'lactancia', 'alergia', 'alérgico', 'anafilaxia', 'penicilina',
  'saturación', 'oxígeno', 'frecuencia', 'cardíaca', 'respiratoria', 'temperatura', 'miligramos',
  'tableta', 'comprimido', 'cápsula', 'ampolla', 'jarabe', 'suspensión', 'ungüento', 'crema', 'gotas',
  'diagnóstico', 'evaluación', 'tratamiento', 'indicaciones', 'hidratación', 'reposo', 'control',
  'hematológico', 'quirúrgico', 'ginecológico', 'pediátrico', 'cardiológico'
];

// Subconjunto que se le da a Whisper como contexto (el límite del proveedor es de unos 224 tokens)
const WHISPER_DRUGS = [
  'azitromicina', 'amoxicilina con ácido clavulánico', 'acetaminofén', 'ibuprofeno', 'diclofenaco', 'ketorolaco',
  'dexametasona', 'prednisona', 'omeprazol', 'ranitidina', 'losartán', 'enalapril', 'amlodipino', 'atenolol',
  'hidroclorotiazida', 'furosemida', 'metformina', 'glibenclamida', 'atorvastatina', 'ciprofloxacino',
  'cefalexina', 'ceftriaxona', 'claritromicina', 'metronidazol', 'loratadina', 'cetirizina', 'salbutamol',
  'ambroxol', 'tramadol', 'clonazepam', 'sertralina', 'levotiroxina'
];
const WHISPER_TERMS = [
  'faringoamigdalitis', 'hipertensión arterial', 'glicemia', 'hematología completa', 'uroanálisis', 'cefalea',
  'odinofagia', 'frecuencia cardíaca', 'saturación de oxígeno'
];

function buildTranscriptionPrompt() {
  return `Consulta médica en Venezuela. Fármacos: ${WHISPER_DRUGS.join(', ')}. Términos: ${WHISPER_TERMS.join(', ')}.`;
}

const normalize = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

// Índices: palabra normalizada -> forma correcta
const EXACT = new Map();
for (const w of [...TERMS, ...DRUGS]) EXACT.set(normalize(w), w);

// Solo fármacos largos y distintivos admiten corrección aproximada
const FUZZY_DRUGS = DRUGS.filter((d) => normalize(d).length >= 8 && !d.includes(' ')).map((d) => ({
  canonical: d,
  norm: normalize(d)
}));

function levenshtein(a, b, max) {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (cur[j] < rowMin) rowMin = cur[j];
    }
    if (rowMin > max) return max + 1;
    prev = cur;
  }
  return prev[b.length];
}

function matchCase(original, fixed) {
  if (original.length > 3 && original === original.toUpperCase()) return fixed.toUpperCase();
  if (/^[A-ZÁÉÍÓÚÑ]/.test(original)) return fixed.charAt(0).toUpperCase() + fixed.slice(1);
  return fixed;
}

function fuzzyDrug(norm) {
  if (norm.length < 8) return null;
  const maxDist = norm.length >= 11 ? 2 : 1;
  let best = null;
  let bestDist = maxDist + 1;
  let tie = false;
  for (const d of FUZZY_DRUGS) {
    if (d.norm[0] !== norm[0]) continue;
    const dist = levenshtein(norm, d.norm, maxDist);
    if (dist < bestDist) {
      best = d;
      bestDist = dist;
      tie = false;
    } else if (dist === bestDist && best && d.canonical !== best.canonical) {
      tie = true;
    }
  }
  return best && !tie && bestDist <= maxDist ? best.canonical : null;
}

/**
 * Corrige tildes y nombres de fármacos mal escritos en un texto clínico.
 * @param {string} text
 * @returns {string}
 */
function correctMedicalText(text) {
  if (!text || typeof text !== 'string') return text;
  return text.replace(/[A-Za-zÁÉÍÓÚÜáéíóúüÑñ]+/g, (word) => {
    if (word.length < 4) return word;
    const norm = normalize(word);
    const exact = EXACT.get(norm);
    if (exact) return word === exact ? word : matchCase(word, exact);
    const fuzzy = fuzzyDrug(norm);
    return fuzzy ? matchCase(word, fuzzy) : word;
  });
}

/**
 * Aplica la corrección a los textos de una propuesta de SOAP.
 */
function correctSoapProposal(proposal) {
  if (!proposal || typeof proposal !== 'object') return proposal;
  for (const key of ['subjective', 'objective', 'assessment', 'plan']) {
    if (typeof proposal[key] === 'string') proposal[key] = correctMedicalText(proposal[key]);
  }
  if (proposal.physicalExam && typeof proposal.physicalExam === 'object') {
    for (const sys of Object.values(proposal.physicalExam)) {
      if (sys && typeof sys.findings === 'string') sys.findings = correctMedicalText(sys.findings);
    }
  }
  if (Array.isArray(proposal.labOrders)) {
    proposal.labOrders = proposal.labOrders.map((o) => (typeof o === 'string' ? correctMedicalText(o) : o));
  }
  return proposal;
}

/**
 * Aplica la corrección a los medicamentos e indicaciones de una propuesta de récipe.
 */
function correctRxProposal(proposal) {
  if (!proposal || typeof proposal !== 'object') return proposal;
  if (Array.isArray(proposal.items)) {
    for (const item of proposal.items) {
      if (item && typeof item.medication === 'string') item.medication = correctMedicalText(item.medication);
      if (item && typeof item.instructions === 'string') item.instructions = correctMedicalText(item.instructions);
    }
  }
  if (typeof proposal.indications === 'string') proposal.indications = correctMedicalText(proposal.indications);
  return proposal;
}

module.exports = {
  buildTranscriptionPrompt,
  correctMedicalText,
  correctSoapProposal,
  correctRxProposal
};

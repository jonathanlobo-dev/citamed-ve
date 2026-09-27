/**
 * companionRules.js - CITAMED.VE
 * M03 / Semana 6 - Reglas fijas para sugerencias acompañantes y alertas de alergia en recetas
 * SIN IA: Reglas determinísticas basadas en palabras clave y normalización de texto.
 */

/**
 * Normaliza nombres eliminando acentos, espacios y convirtiendo a minúsculas
 */
export function normalizeText(text) {
  if (!text || typeof text !== 'string') return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

// Familias y listas de medicamentos clave
export const ANTIBIOTICS = [
  'amoxicilina',
  'clavul',
  'ampicilina',
  'penicilina',
  'cefalexina',
  'cefadroxilo',
  'cefuroxima',
  'cefixima',
  'ceftriaxona',
  'ciprofloxacino',
  'levofloxacino',
  'moxifloxacino',
  'azitromicina',
  'claritromicina',
  'eritromicina',
  'doxiciclina',
  'metronidazol',
  'clindamicina',
  'trimetoprim',
  'sulfametoxazol',
  'nitrofurantoina',
  'fosfomicina'
];

export const AINES = [
  'ibuprofeno',
  'diclofenac',
  'naproxeno',
  'ketoprofeno',
  'ketorolaco',
  'meloxicam',
  'piroxicam',
  'nimesulida',
  'aceclofenac',
  'etoricoxib',
  'celecoxib',
  'aspirina',
  'acetilsalicilico'
];

export const CORTICOIDS = [
  'prednisona',
  'prednisolona',
  'deflazacort',
  'dexametasona',
  'betametasona',
  'metilprednisolona',
  'hidrocortisona'
];

export const GASTRIC_PROTECTORS = [
  'omeprazol',
  'esomeprazol',
  'pantoprazol',
  'lansoprazol',
  'sucralfato',
  'famotidina',
  'rabeprazol'
];

export const PROBIOTICS = [
  'probiotico',
  'probioticos',
  'lactobacillus',
  'saccharomyces',
  'enterogermina',
  'florestor',
  'liolactil'
];

export const ALLERGY_FAMILIES = {
  penicilinas: ['penicilina', 'amoxicilina', 'ampicilina'],
  sulfas: ['sulfametoxazol', 'sulfa'],
  aine: AINES
};

/**
 * Obtiene sugerencias acompañantes según los medicamentos en el récipe
 *
 * @param {Array<{ medication: string }>} recipeItems - Medicamentos actuales
 * @param {Array<string>} [dismissedCategories=[]] - Categorías descartadas por el usuario
 * @returns {Array<{ id: string, message: string, defaultMedication: string }>}
 */
export function getCompanionSuggestions(recipeItems = [], dismissedCategories = []) {
  const normMeds = recipeItems
    .map((item) => normalizeText(item.medication))
    .filter(Boolean);

  if (normMeds.length === 0) return [];

  const suggestions = [];

  const hasAntibiotic = normMeds.some((m) =>
    ANTIBIOTICS.some((ab) => m.includes(ab))
  );

  const hasAine = normMeds.some((m) =>
    AINES.some((aine) => m.includes(aine))
  );

  const hasCorticoid = normMeds.some((m) =>
    CORTICOIDS.some((c) => m.includes(c))
  );

  const hasGastricProtector = normMeds.some((m) =>
    GASTRIC_PROTECTORS.some((gp) => m.includes(gp))
  );

  const hasProbiotic = normMeds.some((m) =>
    PROBIOTICS.some((pb) => m.includes(pb))
  );

  // 1. Sugerencia de probiótico para antibióticos
  if (
    hasAntibiotic &&
    !hasProbiotic &&
    !dismissedCategories.includes('antibiotic')
  ) {
    suggestions.push({
      id: 'antibiotic',
      message:
        'Estás recetando un antibiótico. Considera un probiótico acompañante para reducir el riesgo de diarrea asociada a antibióticos.',
      defaultMedication: 'Probiótico'
    });
  }

  // 2. Sugerencia de protector gástrico para AINE
  if (
    hasAine &&
    !hasGastricProtector &&
    !dismissedCategories.includes('aine')
  ) {
    suggestions.push({
      id: 'aine',
      message:
        'Considera un protector gástrico (por ejemplo omeprazol) si el tratamiento es prolongado, el paciente es mayor de 65 años o tiene antecedentes gastrointestinales.',
      defaultMedication: 'Omeprazol'
    });
  } else if (
    hasCorticoid &&
    !hasGastricProtector &&
    !dismissedCategories.includes('corticoid') &&
    !suggestions.some((s) => s.id === 'aine')
  ) {
    // 3. Sugerencia de protector gástrico para corticoides orales
    suggestions.push({
      id: 'corticoid',
      message:
        'Considera protección gástrica si se combina con un AINE o en tratamientos prolongados.',
      defaultMedication: 'Omeprazol'
    });
  }

  return suggestions;
}

/**
 * Comprueba si un medicamento específico entra en conflicto con las alergias del paciente
 *
 * @param {string} medication - Nombre del medicamento
 * @param {Array<Object|string>} allergies - Lista de alergias del paciente
 * @returns {{ hasAllergy: boolean, allergen: string } | null}
 */
export function checkMedicationAllergy(medication, allergies = []) {
  if (!medication || !allergies || allergies.length === 0) return null;

  const normMed = normalizeText(medication);
  if (!normMed) return null;

  for (const item of allergies) {
    const rawAllergen = typeof item === 'string' ? item : item.allergen || '';
    const normAllergen = normalizeText(rawAllergen);
    if (!normAllergen) continue;

    // Coincidencia directa
    if (normMed.includes(normAllergen) || normAllergen.includes(normMed)) {
      return { hasAllergy: true, allergen: rawAllergen };
    }

    // Coincidencia por familias
    for (const [familyName, familyMeds] of Object.entries(ALLERGY_FAMILIES)) {
      const allergenMatchesFamily =
        normAllergen.includes(familyName) ||
        familyMeds.some((fm) => normAllergen.includes(fm));

      if (allergenMatchesFamily) {
        const medMatchesFamily = familyMeds.some((fm) => normMed.includes(fm));
        if (medMatchesFamily) {
          return { hasAllergy: true, allergen: rawAllergen };
        }
      }
    }
  }

  return null;
}

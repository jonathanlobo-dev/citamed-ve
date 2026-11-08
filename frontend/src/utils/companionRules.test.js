import { describe, test, expect } from 'vitest';
import {
  normalizeText, getCompanionSuggestions, checkMedicationAllergy, ANTIBIOTICS, AINES, CORTICOIDS, GASTRIC_PROTECTORS, PROBIOTICS
} from './companionRules';

const meds = (...names) => names.map((medication) => ({ medication }));
const ids = (list) => list.map((s) => s.id);

describe('normalizeText', () => {
  test.each([
    ['Penicilína', 'penicilina'],
    ['  AMOXICILINA  ', 'amoxicilina'],
    ['Nitrofurantoína', 'nitrofurantoina'],
    ['Ácido acetilsalicílico', 'acido acetilsalicilico']
  ])('%p => %p', (input, expected) => {
    expect(normalizeText(input)).toBe(expected);
  });
  test.each([[null], [undefined], [''], [42], [{}]])('%p => vacío', (v) => {
    expect(normalizeText(v)).toBe('');
  });
});

describe('las listas están normalizadas (si no, nunca coinciden)', () => {
  test.each([['ANTIBIOTICS', ANTIBIOTICS], ['AINES', AINES], ['CORTICOIDS', CORTICOIDS], ['GASTRIC_PROTECTORS', GASTRIC_PROTECTORS], ['PROBIOTICS', PROBIOTICS]])('%s', (_n, list) => {
    list.forEach((m) => expect(m).toBe(normalizeText(m)));
  });
});

describe('sugerencias acompañantes', () => {
  test('sin medicamentos no sugiere nada', () => {
    expect(getCompanionSuggestions([])).toEqual([]);
    expect(getCompanionSuggestions()).toEqual([]);
    expect(getCompanionSuggestions(meds('', null))).toEqual([]);
  });
  test('un antibiótico sugiere probiótico', () => {
    const s = getCompanionSuggestions(meds('Amoxicilina 500 mg'));
    expect(ids(s)).toEqual(['antibiotic']);
    expect(s[0].defaultMedication).toBe('Probiótico');
  });
  test('si ya lleva probiótico no lo repite', () => {
    expect(getCompanionSuggestions(meds('Amoxicilina', 'Florestor'))).toEqual([]);
  });
  test('un AINE sugiere protector gástrico', () => {
    const s = getCompanionSuggestions(meds('Ibuprofeno 400 mg'));
    expect(ids(s)).toEqual(['aine']);
    expect(s[0].defaultMedication).toBe('Omeprazol');
  });
  test('si ya lleva protector gástrico no lo repite', () => {
    expect(getCompanionSuggestions(meds('Diclofenac', 'Omeprazol'))).toEqual([]);
  });
  test('un corticoide solo sugiere protección gástrica', () => {
    expect(ids(getCompanionSuggestions(meds('Prednisona')))).toEqual(['corticoid']);
  });
  test('AINE y corticoide juntos: solo la sugerencia del AINE (no se duplica el protector)', () => {
    expect(ids(getCompanionSuggestions(meds('Ibuprofeno', 'Prednisona')))).toEqual(['aine']);
  });
  test('antibiótico y AINE juntos dan las dos', () => {
    expect(ids(getCompanionSuggestions(meds('Amoxicilina', 'Ibuprofeno')))).toEqual(['antibiotic', 'aine']);
  });
  test('lo que el médico descartó no vuelve a salir', () => {
    expect(getCompanionSuggestions(meds('Amoxicilina', 'Ibuprofeno'), ['antibiotic'])).toHaveLength(1);
    expect(getCompanionSuggestions(meds('Amoxicilina', 'Ibuprofeno'), ['antibiotic', 'aine'])).toEqual([]);
  });
  test('un medicamento sin relación no sugiere nada', () => {
    expect(getCompanionSuggestions(meds('Acetaminofén 500 mg', 'Loratadina'))).toEqual([]);
  });
  test('ignora mayúsculas y acentos', () => {
    expect(ids(getCompanionSuggestions(meds('AMOXICILINA')))).toEqual(['antibiotic']);
    expect(ids(getCompanionSuggestions(meds('Nitrofurantoína')))).toEqual(['antibiotic']);
  });
});

describe('alerta de alergia (seguridad del paciente)', () => {
  test.each([
    ['Amoxicilina 500 mg', ['Penicilina']],
    ['Ampicilina', ['penicilinas']],
    ['Penicilina G', ['Amoxicilina']],
    ['Ibuprofeno', ['AINES']],
    ['Diclofenac', ['Aspirina']],
    ['Sulfametoxazol/Trimetoprim', ['Sulfa']],
    ['Paracetamol', ['Paracetamol']],
    ['Amoxicilina', [{ allergen: 'Penicilina', severity: 'severe' }]],
    ['AMOXICILINA', ['penicilína']]
  ])('%s con alergia %j: hay alerta', (med, allergies) => {
    expect(checkMedicationAllergy(med, allergies)).toMatchObject({ hasAllergy: true });
  });

  test('devuelve el nombre de la alergia tal como lo escribió el médico', () => {
    expect(checkMedicationAllergy('Amoxicilina', ['Penicilina'])).toEqual({ hasAllergy: true, allergen: 'Penicilina' });
    expect(checkMedicationAllergy('Amoxicilina', [{ allergen: 'Alergia a PENICILINA' }]).allergen).toBe('Alergia a PENICILINA');
  });

  test.each([
    ['Acetaminofén', ['Penicilina']],
    ['Loratadina', ['AINES', 'Sulfa']],
    ['Omeprazol', ['Penicilina']],
    ['Amoxicilina', ['Polen']],
    ['Azitromicina', ['Penicilina']]
  ])('%s con alergia %j: sin alerta', (med, allergies) => {
    expect(checkMedicationAllergy(med, allergies)).toBeNull();
  });

  test.each([
    [undefined, ['Penicilina']],
    ['', ['Penicilina']],
    ['Amoxicilina', undefined],
    ['Amoxicilina', []],
    ['Amoxicilina', [{ allergen: '' }, '', {}]],
    ['Amoxicilina', null]
  ])('datos vacíos (%p, %j): no revienta y no alerta', (med, allergies) => {
    expect(checkMedicationAllergy(med, allergies)).toBeNull();
  });

  test('de varias alergias detecta la que corresponde', () => {
    expect(checkMedicationAllergy('Ibuprofeno', ['Polen', 'Penicilina', 'AINES'])).toEqual({ hasAllergy: true, allergen: 'AINES' });
  });
});

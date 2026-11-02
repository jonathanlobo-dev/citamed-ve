const {
  validateSoapNote, validateVitalSigns, validatePhysicalExam, validateDoctorNotes,
  validateClinicalNoteData, VITAL_RANGES, PHYSICAL_EXAM_SYSTEMS
} = require('../../../src/utils/clinicalNote');

describe('validateSoapNote', () => {
  test('recorta espacios y conserva los cuatro campos', () => {
    expect(validateSoapNote({ subjective: ' dolor ', objective: 'o', assessment: 'a', plan: 'p' }))
      .toEqual({ subjective: 'dolor', objective: 'o', assessment: 'a', plan: 'p' });
  });
  test('descarta campos desconocidos', () => {
    expect(validateSoapNote({ subjective: 's', hack: 'x' })).toEqual({ subjective: 's' });
  });
  test('corta a 5000 caracteres', () => {
    expect(validateSoapNote({ plan: 'a'.repeat(6000) }).plan).toHaveLength(5000);
  });
  test('convierte números a texto', () => {
    expect(validateSoapNote({ plan: 42 })).toEqual({ plan: '42' });
  });
  test.each([[null], [undefined], ['texto'], [[]], [{}], [{ otro: 1 }]])('devuelve null con %p', (v) => {
    expect(validateSoapNote(v)).toBeNull();
  });
});

describe('validateVitalSigns', () => {
  test('acepta valores válidos como números', () => {
    expect(validateVitalSigns({ systolic: '120', diastolic: 80, heartRate: '72' }))
      .toEqual({ systolic: 120, diastolic: 80, heartRate: 72 });
  });

  test('calcula el IMC', () => {
    expect(validateVitalSigns({ weightKg: 70, heightCm: 175 }).bmi).toBe(22.9);
    expect(validateVitalSigns({ weightKg: 100, heightCm: 200 }).bmi).toBe(25);
  });

  test('sin peso o sin talla no hay IMC', () => {
    expect(validateVitalSigns({ weightKg: 70 }).bmi).toBeUndefined();
    expect(validateVitalSigns({ heightCm: 170 }).bmi).toBeUndefined();
  });

  test('ignora claves que no son canónicas (el servidor las descarta)', () => {
    expect(validateVitalSigns({ pulse: 70, bloodPressure: '120/80' })).toBeNull();
    expect(validateVitalSigns({ heartRate: 70, pulse: 99 })).toEqual({ heartRate: 70 });
  });

  test('ignora vacíos, nulos e indefinidos', () => {
    expect(validateVitalSigns({ systolic: '', diastolic: null, heartRate: undefined })).toBeNull();
  });

  test('todas las claves canónicas existen', () => {
    expect(Object.keys(VITAL_RANGES)).toEqual([
      'systolic', 'diastolic', 'heartRate', 'respiratoryRate', 'temperature',
      'oxygenSaturation', 'weightKg', 'heightCm', 'glucose'
    ]);
  });

  describe.each(Object.entries(VITAL_RANGES))('rango de %s', (key, range) => {
    test('acepta el mínimo y el máximo', () => {
      expect(validateVitalSigns({ [key]: range.min })[key]).toBe(range.min);
      expect(validateVitalSigns({ [key]: range.max })[key]).toBe(range.max);
    });
    test('rechaza por debajo y por encima', () => {
      expect(() => validateVitalSigns({ [key]: range.min - 0.1 })).toThrow(/fuera de rango/);
      expect(() => validateVitalSigns({ [key]: range.max + 0.1 })).toThrow(/fuera de rango/);
    });
    test('rechaza texto no numérico', () => {
      expect(() => validateVitalSigns({ [key]: 'abc' })).toThrow(/número válido/);
    });
  });

  test('el error trae statusCode 400', () => {
    try { validateVitalSigns({ systolic: 999 }); } catch (e) { expect(e.statusCode).toBe(400); }
  });

  test.each([[null], [undefined], ['x'], [[]]])('devuelve null con %p', (v) => {
    expect(validateVitalSigns(v)).toBeNull();
  });
});

describe('validatePhysicalExam', () => {
  test('conserva estado y hallazgos de un sistema', () => {
    expect(validatePhysicalExam({ cardiovascular: { status: 'abnormal', findings: ' soplo ' } }))
      .toEqual({ cardiovascular: { status: 'abnormal', findings: 'soplo' } });
  });
  test('el estado por defecto es not_evaluated', () => {
    expect(validatePhysicalExam({ skin: {} })).toEqual({ skin: { status: 'not_evaluated', findings: '' } });
  });
  test('rechaza un estado inválido', () => {
    expect(() => validatePhysicalExam({ skin: { status: 'raro' } })).toThrow(/Estado inválido/);
  });
  test('descarta sistemas desconocidos', () => {
    expect(validatePhysicalExam({ colon: { status: 'normal' } })).toBeNull();
  });
  test('corta los hallazgos a 2000 caracteres', () => {
    expect(validatePhysicalExam({ abdomen: { status: 'normal', findings: 'z'.repeat(3000) } }).abdomen.findings).toHaveLength(2000);
  });
  test('hallazgos que no son texto quedan vacíos', () => {
    expect(validatePhysicalExam({ general: { status: 'normal', findings: 5 } }).general.findings).toBe('');
  });
  test.each(PHYSICAL_EXAM_SYSTEMS)('acepta el sistema %s', (system) => {
    expect(validatePhysicalExam({ [system]: { status: 'normal' } })[system].status).toBe('normal');
  });
  test.each([[null], [undefined], ['x'], [[]], [{}]])('devuelve null con %p', (v) => {
    expect(validatePhysicalExam(v)).toBeNull();
  });
});

describe('validateDoctorNotes', () => {
  test('recorta y corta a 5000', () => {
    expect(validateDoctorNotes('  nota  ')).toBe('nota');
    expect(validateDoctorNotes('n'.repeat(9000))).toHaveLength(5000);
  });
  test('indefinido y nulo no se tocan', () => {
    expect(validateDoctorNotes(undefined)).toBeUndefined();
    expect(validateDoctorNotes(null)).toBeUndefined();
  });
});

describe('validateClinicalNoteData', () => {
  test('arma las cuatro partes', () => {
    const r = validateClinicalNoteData({
      soapNote: { plan: 'reposo' },
      vitalSigns: { heartRate: 70 },
      physicalExam: { skin: { status: 'normal' } },
      doctorNotes: 'privada'
    });
    expect(r.soapNote).toEqual({ plan: 'reposo' });
    expect(r.vitalSigns).toEqual({ heartRate: 70 });
    expect(r.physicalExam.skin.status).toBe('normal');
    expect(r.doctorNotes).toBe('privada');
  });
  test('sin argumentos no falla', () => {
    expect(validateClinicalNoteData()).toEqual({ soapNote: null, vitalSigns: null, physicalExam: null, doctorNotes: undefined });
  });
  test('un signo vital inválido hace fallar todo', () => {
    expect(() => validateClinicalNoteData({ vitalSigns: { temperature: 80 } })).toThrow();
  });
});

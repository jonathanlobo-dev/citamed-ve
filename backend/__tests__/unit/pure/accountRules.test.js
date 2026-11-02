const {
  PROTECTED_FIELDS, protectedFieldsForRole, isValidEmail, normalizeEmail, validateChangeRequest
} = require('../../../src/utils/accountRules');

const MOTIVO = 'Me equivoqué al escribirlo al registrarme';

describe('datos protegidos por rol', () => {
  test.each([
    ['patient', ['firstName', 'lastName', 'identificationNumber']],
    ['doctor', ['firstName', 'lastName', 'mppsNumber']],
    ['provider', ['firstName', 'lastName']],
    ['assistant', ['firstName', 'lastName']],
    ['admin', []]
  ])('%s', (role, fields) => {
    expect(protectedFieldsForRole(role).map((f) => f.field)).toEqual(fields);
  });

  test('cada dato protegido tiene nombre para mostrar', () => {
    Object.values(PROTECTED_FIELDS).forEach((d) => expect(d.label.length).toBeGreaterThan(2));
  });
});

describe('correo', () => {
  test.each(['a@b.co', 'nombre.apellido@dominio.com', ' mayus@Dominio.COM '])('acepta %p', (e) => {
    expect(isValidEmail(e)).toBe(true);
  });
  test.each(['', 'sin-arroba', 'a@b', 'a b@c.com', '@c.com', null, undefined, 42, 'a@b.c'])('rechaza %p', (e) => {
    expect(isValidEmail(e)).toBe(false);
  });
  test('rechaza correos de más de 255 caracteres', () => {
    expect(isValidEmail(`${'a'.repeat(250)}@b.com`)).toBe(false);
  });
  test('normaliza a minúsculas y sin espacios', () => {
    expect(normalizeEmail('  Doc@Mail.COM ')).toBe('doc@mail.com');
  });
  test('normalizeEmail lanza 400 con un correo malo', () => {
    try { normalizeEmail('malo'); throw new Error('no lanzó'); } catch (e) { expect(e.statusCode).toBe(400); }
  });
});

describe('validateChangeRequest: nombres', () => {
  test.each(['firstName', 'lastName'])('%s se limpia', (field) => {
    expect(validateChangeRequest({ field, value: '  María   José ', reason: MOTIVO, role: 'patient' }))
      .toEqual({ field, value: 'María José', reason: MOTIVO });
  });
  test.each(['Ñandú', "D'Angelo", 'Pérez-Gil', 'Ana'])('acepta %s', (value) => {
    expect(() => validateChangeRequest({ field: 'firstName', value, reason: MOTIVO, role: 'doctor' })).not.toThrow();
  });
  test.each(['', 'A', '123', 'Ana1', '<script>', 'x'.repeat(61), null, undefined, 5])('rechaza %p', (value) => {
    expect(() => validateChangeRequest({ field: 'firstName', value, reason: MOTIVO, role: 'doctor' })).toThrow(/no válido/);
  });
});

describe('validateChangeRequest: cédula (solo pacientes)', () => {
  test.each([['V-12345678', 'V-12345678'], ['v12345678', 'V12345678'], ['V 12.345.678', 'V12345678'], ['E-81234567', 'E-81234567']])('%s => %s', (value, expected) => {
    expect(validateChangeRequest({ field: 'identificationNumber', value, reason: MOTIVO, role: 'patient' }).value).toBe(expected);
  });
  test.each(['12345678', 'V-123', 'J-12345678', 'abc', ''])('rechaza %p', (value) => {
    expect(() => validateChangeRequest({ field: 'identificationNumber', value, reason: MOTIVO, role: 'patient' })).toThrow(/Cédula/);
  });
  test('un médico no puede pedir cambio de cédula por aquí', () => {
    expect(() => validateChangeRequest({ field: 'identificationNumber', value: 'V-12345678', reason: MOTIVO, role: 'doctor' })).toThrow(/no se puede cambiar/);
  });
});

describe('validateChangeRequest: MPPS (solo médicos)', () => {
  test('se guarda en mayúsculas', () => {
    expect(validateChangeRequest({ field: 'mppsNumber', value: 'mp-12345', reason: MOTIVO, role: 'doctor' }).value).toBe('MP-12345');
  });
  test.each(['ab', 'con espacio', '!!!', 'x'.repeat(21)])('rechaza %p', (value) => {
    expect(() => validateChangeRequest({ field: 'mppsNumber', value, reason: MOTIVO, role: 'doctor' })).toThrow(/MPPS/);
  });
  test('un paciente no puede pedirlo', () => {
    expect(() => validateChangeRequest({ field: 'mppsNumber', value: 'MP-1234', reason: MOTIVO, role: 'patient' })).toThrow(/no se puede cambiar/);
  });
});

describe('validateChangeRequest: motivo y campo', () => {
  test.each(['', '   ', 'corto', null, undefined])('motivo %p es obligatorio', (reason) => {
    expect(() => validateChangeRequest({ field: 'firstName', value: 'Ana', reason, role: 'patient' })).toThrow(/motivo/);
  });
  test('motivo muy largo', () => {
    expect(() => validateChangeRequest({ field: 'firstName', value: 'Ana', reason: 'x'.repeat(501), role: 'patient' })).toThrow(/muy largo/);
  });
  test.each(['email', 'role', 'password', 'isVerified', 'phone', undefined, '__proto__'])('el campo %p no es solicitable', (field) => {
    expect(() => validateChangeRequest({ field, value: 'Ana', reason: MOTIVO, role: 'patient' })).toThrow(/no se puede cambiar/);
  });
  test('el error trae statusCode 400', () => {
    try { validateChangeRequest({ field: 'x', role: 'patient' }); throw new Error('no lanzó'); } catch (e) { expect(e.statusCode).toBe(400); }
  });
});

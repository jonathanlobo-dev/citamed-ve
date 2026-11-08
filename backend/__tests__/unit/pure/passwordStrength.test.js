jest.mock('../../../src/models', () => ({ User: {}, VerificationToken: {} }));
jest.mock('../../../src/services/emailService', () => ({}));
jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const { validatePasswordStrength } = require('../../../src/services/passwordRecoveryService');

describe('validatePasswordStrength', () => {
  test.each([
    ['Abcdefg1', 'medium'],
    ['Abcdefgh12', 'medium'],
    ['Abcdefgh1234', 'medium'],
    ['Abcdefgh123!', 'strong'],
    ['Password123!', 'strong']
  ])('%s es válida (%s)', (password, strength) => {
    const r = validatePasswordStrength(password);
    expect(r.valid).toBe(true);
    expect(r.strength).toBe(strength);
    expect(r.message).toBe('Contraseña válida');
  });

  test.each([
    ['Ab1', /Mínimo 8/],
    ['abcdefg1', /mayúscula/],
    ['ABCDEFG1', /minúscula/],
    ['Abcdefgh', /número/],
    ['', /Mínimo 8/],
    [undefined, /Mínimo 8/]
  ])('%p se rechaza', (password, message) => {
    const r = validatePasswordStrength(password);
    expect(r.valid).toBe(false);
    expect(r.strength).toBe('weak');
    expect(r.message).toMatch(message);
  });

  test('junta todos los problemas en un solo mensaje', () => {
    const r = validatePasswordStrength('abc');
    expect(r.message).toMatch(/Mínimo 8/);
    expect(r.message).toMatch(/mayúscula/);
    expect(r.message).toMatch(/número/);
  });

  test('informa cada requisito por separado (lo usa el indicador de la pantalla)', () => {
    expect(validatePasswordStrength('Abcdefg1!').requirements).toEqual({
      minLength: true, hasLowercase: true, hasUppercase: true, hasNumber: true, hasSpecial: true
    });
    expect(validatePasswordStrength('abc').requirements).toMatchObject({ minLength: false, hasUppercase: false, hasNumber: false, hasSpecial: false });
  });

  test('el carácter especial es opcional', () => {
    expect(validatePasswordStrength('Abcdefg1').valid).toBe(true);
  });
});

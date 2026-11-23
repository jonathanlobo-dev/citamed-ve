jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));
jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn() },
  VerificationToken: { findOne: jest.fn() }
}));
jest.mock('../../../src/services/emailService', () => ({ sendPasswordChangedConfirmation: jest.fn().mockResolvedValue({ success: true }) }));

const db = require('../../../src/models');
const service = require('../../../src/services/passwordRecoveryService');

// Al poner su clave con el enlace del correo, quien pidió su primera cita sin registro activa su cuenta
function userOf(role, accountClaimed) {
  return { id: 9, role, accountClaimed, emailVerified: false, email: 'a@b.co', firstName: 'A', password: '$2a$10$notthesamehash', update: jest.fn().mockResolvedValue(true) };
}

beforeEach(() => {
  jest.spyOn(service, 'verifyResetToken').mockResolvedValue({ valid: true, userId: 9 });
  db.VerificationToken.findOne.mockResolvedValue(null);
});

afterEach(() => jest.restoreAllMocks());

describe('poner la clave con el enlace del correo', () => {
  test.each([['patient'], ['assistant']])('un %s sin reclamar queda activo', async (role) => {
    const user = userOf(role, false);
    db.User.findByPk.mockResolvedValue(user);
    const out = await service.resetPassword('tok', 'Clave1234');
    expect(out.success).toBe(true);
    expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ password: 'Clave1234', accountClaimed: true, emailVerified: true }));
  });

  test('un paciente que ya tenía su cuenta no cambia su estado', async () => {
    const user = userOf('patient', true);
    db.User.findByPk.mockResolvedValue(user);
    await service.resetPassword('tok', 'Clave1234');
    expect(user.update.mock.calls[0][0]).not.toHaveProperty('accountClaimed');
  });

  test('un médico nunca se activa por esta vía', async () => {
    const user = userOf('doctor', false);
    db.User.findByPk.mockResolvedValue(user);
    await service.resetPassword('tok', 'Clave1234');
    expect(user.update.mock.calls[0][0]).not.toHaveProperty('accountClaimed');
  });
});

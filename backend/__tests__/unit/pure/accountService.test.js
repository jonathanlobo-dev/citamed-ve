// Reglas de seguridad de "Mi cuenta" con la base de datos simulada: lo que NO debe pasar.

const mockT = { commit: jest.fn(), rollback: jest.fn(), finished: false, LOCK: { UPDATE: 'UPDATE' } };
jest.mock('../../../src/models', () => ({
  sequelize: { transaction: jest.fn(async () => mockT) },
  User: { findByPk: jest.fn(), findOne: jest.fn() },
  DoctorProfile: { findOne: jest.fn() },
  PatientProfile: { findOne: jest.fn() },
  VerificationToken: { canResend: jest.fn(), createVerification: jest.fn(), verifyCode: jest.fn() },
  ProfileChangeRequest: { findOne: jest.fn(), create: jest.fn(), findByPk: jest.fn(), findAll: jest.fn() }
}));
jest.mock('../../../src/services/emailService', () => ({
  sendVerificationEmail: jest.fn(),
  sendTransactional: jest.fn().mockResolvedValue({ success: true }),
  sendPasswordChangedConfirmation: jest.fn().mockResolvedValue({ success: true })
}));
jest.mock('../../../src/services/passwordRecoveryService', () => ({
  validatePasswordStrength: jest.fn((p) => (p && p.length >= 8 ? { valid: true } : { valid: false, message: 'Clave débil' }))
}));
jest.mock('../../../src/services/auditService', () => ({ log: jest.fn().mockResolvedValue() }));
jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const models = require('../../../src/models');
const emailService = require('../../../src/services/emailService');
const accountService = require('../../../src/services/accountService');

function fakeUser(over = {}) {
  const u = {
    id: 1, email: 'yo@mail.com', firstName: 'Ana', lastName: 'Pérez', role: 'patient', emailVerified: true,
    comparePassword: jest.fn(async (p) => p === 'ClaveActual1!'),
    update: jest.fn(async function (v) { Object.assign(this, v); return this; }),
    ...over
  };
  return u;
}
const code = async (promise) => promise.then(() => null, (e) => e.code);

beforeEach(() => {
  mockT.finished = false;
  models.VerificationToken.canResend.mockResolvedValue({ canResend: true });
});

describe('cambio de correo', () => {
  test('con la clave actual mal escrita NO se manda ningún código', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'nuevo@mail.com', currentPassword: 'mala' }))).toBe('WRONG_PASSWORD');
    expect(models.VerificationToken.createVerification).not.toHaveBeenCalled();
    expect(emailService.sendVerificationEmail).not.toHaveBeenCalled();
  });
  test('sin clave actual tampoco', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'nuevo@mail.com' }))).toBe('WRONG_PASSWORD');
  });
  test('el mismo correo que ya tiene se rechaza', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'YO@mail.com', currentPassword: 'ClaveActual1!' }))).toBe('SAME_EMAIL');
  });
  test('un correo de otra cuenta se rechaza', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.User.findOne.mockResolvedValue({ id: 9 });
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'ocupado@mail.com', currentPassword: 'ClaveActual1!' }))).toBe('EMAIL_EXISTS');
    expect(models.VerificationToken.createVerification).not.toHaveBeenCalled();
  });
  test('el código se envía al correo NUEVO, no al actual', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.User.findOne.mockResolvedValue(null);
    models.VerificationToken.createVerification.mockResolvedValue({ token: 't', code: '123456', verificationToken: { expiresAt: new Date() } });
    emailService.sendVerificationEmail.mockResolvedValue({ success: true });
    await accountService.requestEmailChange(1, { newEmail: 'Nuevo@Mail.com', currentPassword: 'ClaveActual1!' });
    expect(emailService.sendVerificationEmail).toHaveBeenCalledWith(expect.objectContaining({ to: 'nuevo@mail.com' }));
    expect(models.VerificationToken.createVerification).toHaveBeenCalledWith(expect.objectContaining({ purpose: 'email_change', contactValue: 'nuevo@mail.com' }));
  });
  test('si el envío falla, el código se invalida', async () => {
    const invalidate = jest.fn();
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.User.findOne.mockResolvedValue(null);
    models.VerificationToken.createVerification.mockResolvedValue({ token: 't', code: '1', verificationToken: { invalidate } });
    emailService.sendVerificationEmail.mockResolvedValue({ success: false });
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'nuevo@mail.com', currentPassword: 'ClaveActual1!' }))).toBe('SEND_FAILED');
    expect(invalidate).toHaveBeenCalledWith('send_failed');
  });
  test('respeta la espera entre códigos', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.User.findOne.mockResolvedValue(null);
    models.VerificationToken.canResend.mockResolvedValue({ canResend: false, secondsRemaining: 30 });
    expect(await code(accountService.requestEmailChange(1, { newEmail: 'nuevo@mail.com', currentPassword: 'ClaveActual1!' }))).toBe('COOLDOWN_ACTIVE');
  });

  describe('confirmar', () => {
    test('un código de OTRA persona no sirve', async () => {
      models.User.findByPk.mockResolvedValue(fakeUser());
      models.VerificationToken.verifyCode.mockResolvedValue({ success: true, verificationToken: { userId: 2, purpose: 'email_change', contactValue: 'x@y.com' } });
      expect(await code(accountService.confirmEmailChange(1, { token: 't', code: '123456' }))).toBe('INVALID_TOKEN');
    });
    test('un código de registro no sirve para cambiar el correo', async () => {
      models.User.findByPk.mockResolvedValue(fakeUser());
      models.VerificationToken.verifyCode.mockResolvedValue({ success: true, verificationToken: { userId: 1, purpose: 'registration', contactValue: 'x@y.com' } });
      expect(await code(accountService.confirmEmailChange(1, { token: 't', code: '123456' }))).toBe('INVALID_TOKEN');
    });
    test('un código incorrecto no cambia nada', async () => {
      const user = fakeUser();
      models.User.findByPk.mockResolvedValue(user);
      models.VerificationToken.verifyCode.mockResolvedValue({ success: false, message: 'Código incorrecto', code: 'INVALID_CODE' });
      expect(await code(accountService.confirmEmailChange(1, { token: 't', code: '000000' }))).toBe('INVALID_CODE');
      expect(user.update).not.toHaveBeenCalled();
    });
    test('sin código no se intenta nada', async () => {
      expect(await code(accountService.confirmEmailChange(1, { token: 't' }))).toBe('MISSING_CODE');
    });
    test('código válido: cambia el correo, lo deja verificado y avisa al correo anterior', async () => {
      const user = fakeUser();
      models.User.findByPk.mockResolvedValue(user);
      models.User.findOne.mockResolvedValue(null);
      models.VerificationToken.verifyCode.mockResolvedValue({ success: true, verificationToken: { userId: 1, purpose: 'email_change', contactValue: 'Nuevo@Mail.com' } });
      const r = await accountService.confirmEmailChange(1, { token: 't', code: '123456' });
      expect(r).toEqual({ email: 'nuevo@mail.com', emailVerified: true });
      expect(user.update).toHaveBeenCalledWith(expect.objectContaining({ email: 'nuevo@mail.com', emailVerified: true }));
      expect(emailService.sendTransactional).toHaveBeenCalledWith(expect.objectContaining({ to: 'yo@mail.com' }));
    });
    test('si mientras tanto otra cuenta tomó ese correo, no se cambia', async () => {
      const user = fakeUser();
      models.User.findByPk.mockResolvedValue(user);
      models.User.findOne.mockResolvedValue({ id: 9 });
      models.VerificationToken.verifyCode.mockResolvedValue({ success: true, verificationToken: { userId: 1, purpose: 'email_change', contactValue: 'tomado@mail.com' } });
      expect(await code(accountService.confirmEmailChange(1, { token: 't', code: '123456' }))).toBe('EMAIL_EXISTS');
      expect(user.update).not.toHaveBeenCalled();
    });
  });
});

describe('cambio de clave', () => {
  test('con la clave actual mal escrita no cambia', async () => {
    const user = fakeUser();
    models.User.findByPk.mockResolvedValue(user);
    expect(await code(accountService.changePassword(1, { currentPassword: 'mala', newPassword: 'NuevaClave1!' }))).toBe('WRONG_PASSWORD');
    expect(user.update).not.toHaveBeenCalled();
  });
  test('clave nueva débil se rechaza', async () => {
    const user = fakeUser();
    models.User.findByPk.mockResolvedValue(user);
    expect(await code(accountService.changePassword(1, { currentPassword: 'ClaveActual1!', newPassword: '123' }))).toBe('WEAK_PASSWORD');
    expect(user.update).not.toHaveBeenCalled();
  });
  test('la clave nueva no puede ser igual a la actual', async () => {
    const user = fakeUser({ comparePassword: jest.fn(async () => true) });
    models.User.findByPk.mockResolvedValue(user);
    expect(await code(accountService.changePassword(1, { currentPassword: 'ClaveActual1!', newPassword: 'ClaveActual1!' }))).toBe('SAME_PASSWORD');
  });
  test('cambio correcto: se guarda en claro para que el modelo la cifre una sola vez y se avisa por correo', async () => {
    const user = fakeUser();
    models.User.findByPk.mockResolvedValue(user);
    await accountService.changePassword(1, { currentPassword: 'ClaveActual1!', newPassword: 'NuevaClave1!' });
    expect(user.update).toHaveBeenCalledWith({ password: 'NuevaClave1!' });
    expect(emailService.sendPasswordChangedConfirmation).toHaveBeenCalledWith(expect.objectContaining({ to: 'yo@mail.com' }));
  });
});

describe('solicitudes de cambio de datos protegidos', () => {
  const body = { field: 'firstName', value: 'Mariana', reason: 'Me equivoqué al escribirlo' };

  test('no se puede pedir el mismo dato que ya tiene', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser({ firstName: 'Mariana' }));
    expect(await code(accountService.createChangeRequest(1, body))).toBe('NO_CHANGE');
  });
  test('no se acumulan dos solicitudes pendientes del mismo dato', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.ProfileChangeRequest.findOne.mockResolvedValue({ id: 5 });
    expect(await code(accountService.createChangeRequest(1, body))).toBe('ALREADY_PENDING');
    expect(models.ProfileChangeRequest.create).not.toHaveBeenCalled();
  });
  test('una solicitud válida guarda el valor actual y el pedido', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser());
    models.ProfileChangeRequest.findOne.mockResolvedValue(null);
    models.ProfileChangeRequest.create.mockImplementation(async (v) => ({ id: 10, ...v }));
    const r = await accountService.createChangeRequest(1, body);
    expect(r).toMatchObject({ userId: 1, field: 'firstName', currentValue: 'Ana', requestedValue: 'Mariana' });
  });
  test('un dato que no es protegido para su rol se rechaza', async () => {
    models.User.findByPk.mockResolvedValue(fakeUser({ role: 'doctor' }));
    await expect(accountService.createChangeRequest(1, { ...body, field: 'identificationNumber', value: 'V-12345678' })).rejects.toMatchObject({ statusCode: 400 });
  });

  describe('revisión del administrador', () => {
    const admin = { id: 99 };
    test('decisión inválida', async () => {
      expect(await code(accountService.reviewChangeRequest(1, admin, { decision: 'quizas' }))).toBe('INVALID_DECISION');
    });
    test('rechazar exige explicar el motivo', async () => {
      expect(await code(accountService.reviewChangeRequest(1, admin, { decision: 'rejected', note: '' }))).toBe('NOTE_REQUIRED');
    });
    test('una solicitud ya resuelta no se vuelve a resolver y se deshace la transacción', async () => {
      models.ProfileChangeRequest.findByPk.mockResolvedValue({ status: 'approved' });
      expect(await code(accountService.reviewChangeRequest(1, admin, { decision: 'approved' }))).toBe('ALREADY_RESOLVED');
      expect(mockT.rollback).toHaveBeenCalled();
      expect(mockT.commit).not.toHaveBeenCalled();
    });
    test('una solicitud inexistente', async () => {
      models.ProfileChangeRequest.findByPk.mockResolvedValue(null);
      expect(await code(accountService.reviewChangeRequest(1, admin, { decision: 'approved' }))).toBe('NOT_FOUND');
    });
    test('aprobar un nombre lo aplica al usuario y a su perfil', async () => {
      const request = { id: 3, userId: 1, field: 'firstName', requestedValue: 'Mariana', currentValue: 'Ana', status: 'pending', update: jest.fn() };
      const user = fakeUser();
      const profile = { id: 7, update: jest.fn() };
      models.ProfileChangeRequest.findByPk.mockResolvedValue(request);
      models.User.findByPk.mockResolvedValue(user);
      models.PatientProfile.findOne.mockResolvedValue(profile);
      await accountService.reviewChangeRequest(3, admin, { decision: 'approved' });
      expect(user.update).toHaveBeenCalledWith({ firstName: 'Mariana' }, { transaction: mockT });
      expect(profile.update).toHaveBeenCalledWith({ firstName: 'Mariana' }, { transaction: mockT });
      expect(request.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved', reviewedBy: 99 }), { transaction: mockT });
      expect(mockT.commit).toHaveBeenCalled();
    });
    test('rechazar no toca los datos de la persona', async () => {
      const request = { id: 3, userId: 1, field: 'firstName', requestedValue: 'Mariana', status: 'pending', update: jest.fn() };
      models.ProfileChangeRequest.findByPk.mockResolvedValue(request);
      await accountService.reviewChangeRequest(3, admin, { decision: 'rejected', note: 'No coincide con tu cédula' });
      expect(models.User.findByPk).not.toHaveBeenCalled();
      expect(request.update).toHaveBeenCalledWith(expect.objectContaining({ status: 'rejected', reviewNote: 'No coincide con tu cédula' }), { transaction: mockT });
    });
    test('aprobar una cédula que ya usa otra cuenta falla sin cambiar nada', async () => {
      const request = { id: 4, userId: 1, field: 'identificationNumber', requestedValue: 'V-12345678', status: 'pending', update: jest.fn() };
      const profile = { update: jest.fn() };
      models.ProfileChangeRequest.findByPk.mockResolvedValue(request);
      models.User.findByPk.mockResolvedValue(fakeUser());
      models.PatientProfile.findOne.mockResolvedValueOnce(profile).mockResolvedValueOnce({ id: 50 });
      expect(await code(accountService.reviewChangeRequest(4, admin, { decision: 'approved' }))).toBe('CEDULA_EXISTS');
      expect(profile.update).not.toHaveBeenCalled();
      expect(request.update).not.toHaveBeenCalled();
    });
  });
});

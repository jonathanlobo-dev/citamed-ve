jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
const mockUser = { id: 50, firstName: 'María', lastName: 'Gómez', email: 'maria@correo.com', destroy: jest.fn() };
const mockProfile = { destroy: jest.fn() };

jest.mock('../../../src/models', () => ({
  User: { findOne: jest.fn(), create: jest.fn() },
  PatientProfile: { findOne: jest.fn(), create: jest.fn() },
  DoctorProfile: { findByPk: jest.fn() },
  Specialty: {},
  VerificationToken: { createVerification: jest.fn() },
  sequelize: { transaction: jest.fn() }
}));
jest.mock('../../../src/services/appointmentService', () => ({ getAvailableSlots: jest.fn(), createAppointment: jest.fn() }));
jest.mock('../../../src/services/emailService', () => ({ sendTransactional: jest.fn() }));
jest.mock('../../../src/services/auditService', () => ({ log: jest.fn() }));

const db = require('../../../src/models');
const appointmentService = require('../../../src/services/appointmentService');
const emailService = require('../../../src/services/emailService');
const service = require('../../../src/services/guestBookingService');

const body = (over = {}) => ({
  firstName: 'María',
  lastName: 'Gómez',
  identificationType: 'V',
  identificationNumber: '12345678',
  phone: '04141234567',
  email: 'maria@correo.com',
  doctorProfileId: 7,
  appointmentDate: '2099-03-10',
  appointmentTime: '09:30',
  ...over
});

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV, APPOINTMENT_EMAILS_ENABLED: 'true', FRONTEND_URL: 'https://app.test' };
  db.sequelize.transaction.mockResolvedValue(mockTransaction);
  db.DoctorProfile.findByPk.mockResolvedValue({
    id: 7, userId: 3, specialtyId: 2, consultationFee: 40, clinicAddress: 'Av. Principal',
    user: { id: 3, firstName: 'Ana', lastName: 'Rojas', isActive: true, role: 'doctor' }
  });
  db.User.findOne.mockResolvedValue(null);
  db.PatientProfile.findOne.mockResolvedValue(null);
  db.User.create.mockResolvedValue(mockUser);
  db.PatientProfile.create.mockResolvedValue(mockProfile);
  db.VerificationToken.createVerification.mockResolvedValue({ token: 'tok-123', code: '111111' });
  appointmentService.getAvailableSlots.mockResolvedValue({ available: true, slots: [{ start: '09:30', duration: 30, available: true }] });
  appointmentService.createAppointment.mockResolvedValue({ id: 99, status: 'pending', appointmentDate: '2099-03-10', appointmentTime: '09:30' });
  emailService.sendTransactional.mockResolvedValue({ success: true });
});

afterAll(() => { process.env = OLD_ENV; });

describe('primera cita sin registro', () => {
  test('crea la cuenta sin reclamar, la cita pendiente y envía el enlace por correo', async () => {
    const out = await service.createGuestAppointment(body());

    expect(db.User.create).toHaveBeenCalledWith(expect.objectContaining({ role: 'patient', email: 'maria@correo.com', accountClaimed: false, phone: '+584141234567' }), expect.anything());
    expect(db.PatientProfile.create).toHaveBeenCalledWith(expect.objectContaining({ identificationNumber: 'V-12345678', userId: 50 }), expect.anything());
    expect(appointmentService.createAppointment).toHaveBeenCalledWith(expect.objectContaining({ patientId: 50, doctorId: 3, doctorProfileId: 7, appointmentType: 'first_consultation' }));
    expect(db.VerificationToken.createVerification).toHaveBeenCalledWith(expect.objectContaining({ userId: 50, purpose: 'password_reset' }));
    const mail = emailService.sendTransactional.mock.calls[0][0];
    expect(mail.to).toBe('maria@correo.com');
    expect(mail.html).toContain('https://app.test/reset-password?token=tok-123');
    expect(out).toEqual({ appointment: { id: 99, status: 'pending', appointmentDate: '2099-03-10', appointmentTime: '09:30' }, emailSent: true });
  });

  test('la clave del usuario nuevo es aleatoria: nadie puede entrar sin el enlace', async () => {
    await service.createGuestAppointment(body());
    const { password } = db.User.create.mock.calls[0][0];
    expect(password).toMatch(/^[0-9a-f]{64}$/);
  });

  test('si el correo ya existe pide iniciar sesión y no crea nada', async () => {
    db.User.findOne.mockResolvedValue({ id: 1 });
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 409, code: 'ACCOUNT_EXISTS', field: 'email' });
    expect(db.User.create).not.toHaveBeenCalled();
    expect(appointmentService.createAppointment).not.toHaveBeenCalled();
  });

  test('si la cédula ya existe pide iniciar sesión y no crea nada', async () => {
    db.PatientProfile.findOne.mockResolvedValue({ id: 1 });
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 409, code: 'ACCOUNT_EXISTS', field: 'cedula' });
    expect(db.User.create).not.toHaveBeenCalled();
  });

  test('un horario ocupado se detecta antes de crear la cuenta', async () => {
    appointmentService.getAvailableSlots.mockResolvedValue({ available: true, slots: [{ start: '10:00', duration: 30, available: true }] });
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 409, code: 'SLOT_TAKEN' });
    expect(db.User.create).not.toHaveBeenCalled();
  });

  test('si el turno se ocupa justo al crear la cita se borra la cuenta recién creada', async () => {
    appointmentService.createAppointment.mockRejectedValue(new Error('Este horario acaba de ser reservado'));
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 409, code: 'SLOT_TAKEN' });
    expect(mockProfile.destroy).toHaveBeenCalled();
    expect(mockUser.destroy).toHaveBeenCalled();
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });

  test('con los correos apagados la cita se crea pero no se manda nada', async () => {
    process.env.APPOINTMENT_EMAILS_ENABLED = 'false';
    const out = await service.createGuestAppointment(body());
    expect(out.emailSent).toBe(false);
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
    expect(db.VerificationToken.createVerification).not.toHaveBeenCalled();
  });

  test('si el correo falla la cita sigue creada', async () => {
    emailService.sendTransactional.mockRejectedValue(new Error('proveedor caído'));
    const out = await service.createGuestAppointment(body());
    expect(out.appointment.id).toBe(99);
    expect(out.emailSent).toBe(false);
  });

  test('un médico inexistente o suspendido da 404', async () => {
    db.DoctorProfile.findByPk.mockResolvedValue(null);
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 404 });
    db.DoctorProfile.findByPk.mockResolvedValue({ id: 7, user: { role: 'doctor', isActive: false } });
    await expect(service.createGuestAppointment(body())).rejects.toMatchObject({ statusCode: 404 });
  });

  test('una fecha pasada se rechaza', async () => {
    await expect(service.createGuestAppointment(body({ appointmentDate: '2020-01-01' }))).rejects.toMatchObject({ statusCode: 400 });
  });

  test('datos inválidos se rechazan antes de tocar la base', async () => {
    await expect(service.createGuestAppointment(body({ email: 'malo' }))).rejects.toMatchObject({ statusCode: 400 });
    expect(db.DoctorProfile.findByPk).not.toHaveBeenCalled();
  });
});

describe('horarios públicos', () => {
  test('solo devuelve horas libres, sin datos de pacientes', async () => {
    appointmentService.getAvailableSlots.mockResolvedValue({
      available: true,
      slots: [
        { start: '09:00', duration: 30, available: true, patientId: 5 },
        { start: '09:30', duration: 30, available: false }
      ]
    });
    expect(await service.getSlots('7', '2099-03-10')).toEqual({ available: true, reason: null, slots: [{ start: '09:00', duration: 30 }] });
  });

  test('parámetros inválidos dan 400', async () => {
    await expect(service.getSlots('x', '2099-03-10')).rejects.toMatchObject({ statusCode: 400 });
    await expect(service.getSlots('7', 'mañana')).rejects.toMatchObject({ statusCode: 400 });
  });
});

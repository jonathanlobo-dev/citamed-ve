// Recordatorios de citas con la base de datos y el correo simulados: lo que NO debe pasar.

jest.mock('../../../src/models', () => ({
  Appointment: { findAll: jest.fn(), update: jest.fn(), findByPk: jest.fn() },
  User: {},
  DoctorProfile: {},
  Specialty: {}
}));
jest.mock('../../../src/services/emailService', () => ({ sendTransactional: jest.fn() }));
jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const { Op } = require('sequelize');
const { Appointment } = require('../../../src/models');
const emailService = require('../../../src/services/emailService');
const reminderService = require('../../../src/services/reminderService');

// "Ahora" fijo: domingo 8 de noviembre de 2026, 10:00 en Caracas (14:00 UTC)
const NOW = new Date('2026-11-08T14:00:00Z');

function cita(over = {}) {
  return {
    id: 1,
    appointmentDate: '2026-11-09', // lunes
    appointmentTime: '12:00:00', // 26 h después => dentro de la ventana
    locationAddress: 'Av. Libertador, Caracas',
    patient: { id: 5, firstName: 'María', email: 'maria@gmail.com', isActive: true, accountClaimed: true },
    doctor: { id: 2, firstName: 'Alejandro', lastName: 'Rivas' },
    doctorProfile: { specialty: { name: 'Medicina General' } },
    ...over
  };
}

beforeEach(() => {
  process.env.APPOINTMENT_EMAILS_ENABLED = 'true';
  Appointment.update.mockResolvedValue([1]);
  emailService.sendTransactional.mockResolvedValue({ success: true });
});
afterEach(() => { delete process.env.APPOINTMENT_EMAILS_ENABLED; });

describe('recordatorio apagado', () => {
  test('sin el interruptor no consulta nada ni envía nada', async () => {
    delete process.env.APPOINTMENT_EMAILS_ENABLED;
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r.disabled).toBe(true);
    expect(Appointment.findAll).not.toHaveBeenCalled();
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });
  test('confirmación y cancelación tampoco envían', async () => {
    delete process.env.APPOINTMENT_EMAILS_ENABLED;
    expect(await reminderService.sendAppointmentConfirmation(cita())).toEqual({ sent: false, reason: 'disabled' });
    expect(await reminderService.sendCancellationNotification(cita(), 'doctor')).toEqual({ sent: false, reason: 'disabled' });
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });
});

describe('una pasada del recordatorio', () => {
  test('envía el recordatorio de una cita dentro de la ventana y la marca como avisada', async () => {
    Appointment.findAll.mockResolvedValue([cita()]);
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r).toEqual({ checked: 1, sent: 1, skipped: 0, failed: 0 });
    expect(emailService.sendTransactional).toHaveBeenCalledTimes(1);
    expect(emailService.sendTransactional).toHaveBeenCalledWith(expect.objectContaining({ to: 'maria@gmail.com', subject: expect.stringContaining('lunes 9 de noviembre') }));
    expect(Appointment.update).toHaveBeenCalledWith({ reminderSent: true, reminderSentAt: NOW }, { where: { id: 1, reminderSent: false } });
  });

  test('busca solo citas pendientes o confirmadas y sin recordatorio', async () => {
    Appointment.findAll.mockResolvedValue([]);
    await reminderService.runReminderPass({ now: NOW });
    const where = Appointment.findAll.mock.calls[0][0].where;
    expect(where.reminderSent).toBe(false);
    expect(where.status[Op.in]).toEqual(['pending', 'confirmed']);
  });

  test.each([
    ['muy pronto (2 h)', { appointmentTime: '00:00:00', appointmentDate: '2026-11-08' }],
    ['muy lejos (3 días)', { appointmentDate: '2026-11-11' }],
    ['ya pasó', { appointmentDate: '2026-11-07' }]
  ])('una cita %s no se recuerda', async (_n, over) => {
    Appointment.findAll.mockResolvedValue([cita(over)]);
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r.sent).toBe(0);
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });

  test.each([
    ['cuenta de prueba', { email: 'doctor@citamed.ve' }],
    ['dirección de ejemplo', { email: 'x@example.com' }],
    ['sin correo', { email: null }],
    ['cuenta suspendida', { isActive: false }],
    ['cuenta creada por el médico y aún sin reclamar', { accountClaimed: false }]
  ])('no escribe a: %s', async (_n, patientOver) => {
    Appointment.findAll.mockResolvedValue([cita({ patient: { ...cita().patient, ...patientOver } })]);
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r).toEqual({ checked: 1, sent: 0, skipped: 1, failed: 0 });
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
    expect(Appointment.update).not.toHaveBeenCalled();
  });

  test('si otra pasada ya reclamó la cita, no se envía por segunda vez', async () => {
    Appointment.findAll.mockResolvedValue([cita()]);
    Appointment.update.mockResolvedValue([0]);
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r.skipped).toBe(1);
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });

  test('si el envío falla, la cita vuelve a quedar sin recordar para el próximo intento', async () => {
    Appointment.findAll.mockResolvedValue([cita()]);
    emailService.sendTransactional.mockResolvedValue({ success: false, error: 'sin proveedor' });
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r).toEqual({ checked: 1, sent: 0, skipped: 0, failed: 1 });
    expect(Appointment.update).toHaveBeenLastCalledWith({ reminderSent: false, reminderSentAt: null }, { where: { id: 1 } });
  });

  test('si el envío lanza un error, tampoco se pierde el recordatorio ni se detienen las demás citas', async () => {
    Appointment.findAll.mockResolvedValue([cita({ id: 1 }), cita({ id: 2, patient: { ...cita().patient, email: 'luis@gmail.com' } })]);
    emailService.sendTransactional.mockRejectedValueOnce(new Error('red caída')).mockResolvedValueOnce({ success: true });
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r).toEqual({ checked: 2, sent: 1, skipped: 0, failed: 1 });
  });

  test('varias citas: cada una recibe un solo correo', async () => {
    Appointment.findAll.mockResolvedValue([
      cita({ id: 1 }),
      cita({ id: 2, appointmentTime: '13:30:00', patient: { ...cita().patient, email: 'luis@gmail.com' } }),
      cita({ id: 3, appointmentTime: '09:00:00', patient: { ...cita().patient, email: 'ana@gmail.com' } })
    ]);
    const r = await reminderService.runReminderPass({ now: NOW });
    expect(r.sent).toBe(3);
    const destinos = emailService.sendTransactional.mock.calls.map((c) => c[0].to).sort();
    expect(destinos).toEqual(['ana@gmail.com', 'luis@gmail.com', 'maria@gmail.com']);
  });

  test('el correo usa la dirección oficial del sistema para "Mis citas"', async () => {
    delete process.env.FRONTEND_URL;
    Appointment.findAll.mockResolvedValue([cita()]);
    await reminderService.runReminderPass({ now: NOW });
    expect(emailService.sendTransactional.mock.calls[0][0].html).toContain('https://app.citamedve.app/paciente/mis-citas');
  });
});

describe('confirmación y cancelación', () => {
  test('la confirmación al agendar se envía al paciente', async () => {
    expect(await reminderService.sendAppointmentConfirmation(cita())).toEqual({ sent: true });
    expect(emailService.sendTransactional).toHaveBeenCalledWith(expect.objectContaining({ to: 'maria@gmail.com' }));
  });
  test('si el paciente canceló, no se le avisa de su propia cancelación', async () => {
    expect(await reminderService.sendCancellationNotification(cita(), 'patient')).toEqual({ sent: false, reason: 'self_cancelled' });
    expect(emailService.sendTransactional).not.toHaveBeenCalled();
  });
  test('si cancela el médico, el paciente recibe el aviso', async () => {
    expect(await reminderService.sendCancellationNotification(cita(), 'doctor')).toEqual({ sent: true });
    expect(emailService.sendTransactional.mock.calls[0][0].html).toContain('cancelada por el médico');
  });
  test('un fallo del correo nunca rompe el agendamiento: devuelve el resultado, no lanza', async () => {
    emailService.sendTransactional.mockRejectedValue(new Error('caído'));
    await expect(reminderService.sendAppointmentConfirmation(cita())).resolves.toEqual({ sent: false, reason: 'error' });
  });
  test('a cuentas de prueba no se les envía', async () => {
    const r = await reminderService.sendAppointmentConfirmation(cita({ patient: { ...cita().patient, email: 'paciente@citamed.ve' } }));
    expect(r).toEqual({ sent: false, reason: 'no_recipient' });
  });
  test('si llega solo el id, la carga de la base', async () => {
    Appointment.findByPk.mockResolvedValue(cita());
    expect(await reminderService.sendAppointmentConfirmation({ id: 1 })).toEqual({ sent: true });
    expect(Appointment.findByPk).toHaveBeenCalledWith(1, expect.any(Object));
  });
});

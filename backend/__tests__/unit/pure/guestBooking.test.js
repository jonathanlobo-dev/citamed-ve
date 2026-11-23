jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));

const guest = require('../../../src/utils/guestBooking');

const valid = (over = {}) => ({
  firstName: 'María',
  lastName: 'Gómez Pérez',
  identificationType: 'v',
  identificationNumber: '12.345.678',
  phone: '0414-123-4567',
  email: ' Maria@Correo.com ',
  doctorProfileId: '7',
  appointmentDate: '2099-03-10',
  appointmentTime: '09:30',
  reasonForVisit: '  Control  ',
  ...over
});

describe('interruptor del servidor', () => {
  test.each([[{}, false], [{ GUEST_BOOKING_ENABLED: 'false' }, false], [{ GUEST_BOOKING_ENABLED: '' }, false], [{ GUEST_BOOKING_ENABLED: 'true' }, true], [{ GUEST_BOOKING_ENABLED: 'TRUE' }, true]])('%j => %s', (env, esperado) => {
    expect(guest.guestBookingEnabled(env)).toBe(esperado);
  });
});

describe('validateGuestInput', () => {
  test('normaliza cédula, teléfono y correo', () => {
    expect(guest.validateGuestInput(valid())).toEqual({
      firstName: 'María',
      lastName: 'Gómez Pérez',
      cedula: 'V-12345678',
      phone: '+584141234567',
      email: 'maria@correo.com',
      doctorProfileId: 7,
      appointmentDate: '2099-03-10',
      appointmentTime: '09:30',
      reasonForVisit: 'Control'
    });
  });

  test('el correo se guarda tal como se escribe, en minúsculas (los alias son cuentas aparte)', () => {
    expect(guest.validateGuestInput(valid({ email: 'Juan.Perez+citas@gmail.com' })).email).toBe('juan.perez+citas@gmail.com');
    expect(guest.validateGuestInput(valid({ email: 'ana.perez@hotmail.com' })).email).toBe('ana.perez@hotmail.com');
  });

  test('sin motivo se usa Consulta general', () => {
    expect(guest.validateGuestInput(valid({ reasonForVisit: '   ' })).reasonForVisit).toBe('Consulta general');
  });

  test('acepta cédula de extranjero (E)', () => {
    expect(guest.validateGuestInput(valid({ identificationType: 'E', identificationNumber: '81234567' })).cedula).toBe('E-81234567');
  });

  test.each([
    ['nombre muy corto', { firstName: 'A' }],
    ['nombre con números', { firstName: 'Mar1a' }],
    ['apellido vacío', { lastName: '' }],
    ['tipo de cédula J', { identificationType: 'J' }],
    ['sin tipo de cédula', { identificationType: '' }],
    ['cédula corta', { identificationNumber: '123' }],
    ['teléfono no venezolano', { phone: '+14155550123' }],
    ['sin teléfono', { phone: '' }],
    ['correo sin arroba', { email: 'maria.correo.com' }],
    ['sin correo', { email: '' }],
    ['médico no numérico', { doctorProfileId: 'abc' }],
    ['médico cero', { doctorProfileId: 0 }],
    ['fecha imposible', { appointmentDate: '2099-02-30' }],
    ['fecha con formato raro', { appointmentDate: '10/03/2099' }],
    ['hora imposible', { appointmentTime: '25:00' }],
    ['hora sin formato', { appointmentTime: '9am' }]
  ])('rechaza %s con 400', (_, over) => {
    try {
      guest.validateGuestInput(valid(over));
      throw new Error('no falló');
    } catch (e) {
      expect(e.statusCode).toBe(400);
    }
  });

  test('un cuerpo vacío no rompe: se rechaza', () => {
    expect(() => guest.validateGuestInput()).toThrow();
  });
});

describe('correo de la primera cita', () => {
  test('el enlace usa la página de recuperar clave con el token', () => {
    expect(guest.claimUrl('https://app.citamedve.app/', 'abc 123')).toBe('https://app.citamedve.app/reset-password?token=abc%20123');
  });

  test('el correo resume la cita, anima a registrarse y lleva el enlace', () => {
    const link = guest.claimUrl('https://app.citamedve.app', 'tok');
    const mail = guest.buildGuestEmail({
      patientName: 'María',
      doctorName: 'Dr(a). Ana Rojas',
      date: '2099-03-10',
      time: '09:30:00',
      location: 'Clínica <Centro>',
      claimLink: link
    });
    expect(mail.subject).toMatch(/CitaMed/);
    expect(mail.html).toContain(link);
    expect(mail.text).toContain(link);
    expect(mail.html).toContain('09:30');
    expect(mail.html).toMatch(/récipes digitales/);
    expect(mail.html).toContain('Clínica &lt;Centro&gt;');
    expect(mail.html + mail.text).not.toMatch(/[—–]/);
  });

  test('escapa el nombre para no inyectar HTML', () => {
    const mail = guest.buildGuestEmail({ patientName: '<b>x</b>', doctorName: 'Dr', date: '2099-03-10', time: '09:30', claimLink: 'https://x/y' });
    expect(mail.html).not.toContain('<b>x</b>');
  });
});

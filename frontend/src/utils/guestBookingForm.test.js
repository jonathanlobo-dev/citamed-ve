import { describe, test, expect } from 'vitest';
import { validateGuestForm, isVenezuelanPhone, buildGuestPayload, EMPTY_GUEST_FORM } from './guestBookingForm';

const valid = (over = {}) => ({
  firstName: 'María',
  lastName: 'Gómez',
  identificationType: 'V',
  identificationNumber: '12.345.678',
  phone: '0414-123-4567',
  email: 'maria@correo.com',
  ...over
});

describe('teléfono venezolano', () => {
  test.each(['0414-1234567', '04141234567', '584141234567', '+584141234567', '(0414) 123 45 67', '4141234567'])('%s es válido', (p) => {
    expect(isVenezuelanPhone(p)).toBe(true);
  });
  test.each(['', '12345', '+14155550123', '04141234', 'abc', null])('%p no es válido', (p) => {
    expect(isVenezuelanPhone(p)).toBe(false);
  });
});

describe('validateGuestForm', () => {
  test('un formulario correcto no tiene errores', () => {
    expect(validateGuestForm(valid())).toEqual({});
  });
  test('un formulario vacío marca todos los campos', () => {
    expect(Object.keys(validateGuestForm(EMPTY_GUEST_FORM)).sort()).toEqual(['email', 'firstName', 'identificationNumber', 'lastName', 'phone']);
  });
  test.each([
    ['firstName', { firstName: 'M4ria' }],
    ['lastName', { lastName: 'G' }],
    ['identificationType', { identificationType: 'J' }],
    ['identificationNumber', { identificationNumber: '123' }],
    ['phone', { phone: '555' }],
    ['email', { email: 'maria@' }]
  ])('marca %s', (campo, over) => {
    expect(validateGuestForm(valid(over))).toHaveProperty(campo);
  });
  test('acepta cédula de extranjero y apellidos compuestos', () => {
    expect(validateGuestForm(valid({ identificationType: 'E', lastName: "De la Cruz-O'Neil" }))).toEqual({});
  });
});

describe('buildGuestPayload', () => {
  test('limpia los datos y completa la cita', () => {
    expect(buildGuestPayload(valid({ email: ' Maria@Correo.com ', firstName: ' María ' }), {
      doctorProfileId: 7, appointmentDate: '2099-03-10', appointmentTime: '09:30', reasonForVisit: '  '
    })).toEqual({
      firstName: 'María',
      lastName: 'Gómez',
      identificationType: 'V',
      identificationNumber: '12345678',
      phone: '0414-123-4567',
      email: 'maria@correo.com',
      doctorProfileId: 7,
      appointmentDate: '2099-03-10',
      appointmentTime: '09:30',
      reasonForVisit: 'Consulta general'
    });
  });
});

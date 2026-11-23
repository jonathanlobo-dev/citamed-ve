/**
 * guestBookingForm.js - CitaMed
 * Validación del formulario de la primera cita sin registro (el servidor valida de nuevo).
 */

const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const EMPTY_GUEST_FORM = {
  firstName: '',
  lastName: '',
  identificationType: 'V',
  identificationNumber: '',
  phone: '',
  email: ''
};

/** Teléfono venezolano: 0414-1234567, 04141234567, 584141234567 o +584141234567 */
export function isVenezuelanPhone(value) {
  let v = String(value || '').replace(/[\s().-]/g, '');
  if (v.startsWith('+58')) v = v.slice(3);
  else if (v.startsWith('58')) v = v.slice(2);
  else if (v.startsWith('0')) v = v.slice(1);
  return /^\d{10}$/.test(v);
}

/** Devuelve { campo: mensaje } con los errores; vacío si todo está bien. */
export function validateGuestForm(values) {
  const errors = {};
  const nameError = (value, label) => {
    const v = String(value || '').trim();
    if (v.length < 2 || v.length > 60) return `${label} es obligatorio (entre 2 y 60 caracteres)`;
    if (!NAME_REGEX.test(v)) return `${label} solo puede llevar letras`;
    return null;
  };
  const first = nameError(values.firstName, 'El nombre');
  if (first) errors.firstName = first;
  const last = nameError(values.lastName, 'El apellido');
  if (last) errors.lastName = last;

  if (!['V', 'E'].includes(values.identificationType)) errors.identificationType = 'Elige V o E';
  const digits = String(values.identificationNumber || '').replace(/\D/g, '');
  if (digits.length < 6 || digits.length > 9) errors.identificationNumber = 'La cédula debe tener entre 6 y 9 dígitos';

  if (!isVenezuelanPhone(values.phone)) errors.phone = 'Escribe un teléfono venezolano, por ejemplo 0414-1234567';

  const email = String(values.email || '').trim();
  if (!EMAIL_REGEX.test(email)) errors.email = 'Escribe un correo válido';

  return errors;
}

/** Cuerpo que se envía al servidor. */
export function buildGuestPayload(values, { doctorProfileId, appointmentDate, appointmentTime, reasonForVisit }) {
  return {
    firstName: values.firstName.trim(),
    lastName: values.lastName.trim(),
    identificationType: values.identificationType,
    identificationNumber: values.identificationNumber.replace(/\D/g, ''),
    phone: values.phone.trim(),
    email: values.email.trim().toLowerCase(),
    doctorProfileId,
    appointmentDate,
    appointmentTime,
    reasonForVisit: (reasonForVisit || '').trim() || 'Consulta general'
  };
}

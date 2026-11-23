/**
 * guestBooking.js - CITAMED.VE
 * Primera cita sin registro: validación de los datos del visitante y correo con el enlace para
 * poner su clave. Todo puro (sin base de datos) para poder probarlo.
 */

const { normalizeCedula, normalizePhoneVE } = require('./identity');
const { isValidDate } = require('./financeReport');
const { isDeliverableEmail, formatDateEs } = require('./appointmentEmails');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;
const NAME_REGEX = /^[\p{L}][\p{L}\s'.-]*$/u;

// Días que dura el enlace para poner la clave
const CLAIM_LINK_DAYS = 7;

const fail = (message, statusCode = 400, extra = {}) => Object.assign(new Error(message), { statusCode, ...extra });

/** Interruptor del servidor: apagado salvo GUEST_BOOKING_ENABLED=true */
function guestBookingEnabled(env = process.env) {
  return String(env.GUEST_BOOKING_ENABLED || '').toLowerCase() === 'true';
}

function cleanName(value, label) {
  const v = String(value || '').trim().replace(/\s+/g, ' ');
  if (v.length < 2 || v.length > 60) throw fail(`${label} es obligatorio (entre 2 y 60 caracteres)`);
  if (!NAME_REGEX.test(v)) throw fail(`${label} solo puede llevar letras`);
  return v;
}

/**
 * Valida y normaliza lo que manda el visitante.
 * @returns {{ firstName, lastName, cedula, phone, email, doctorProfileId, appointmentDate, appointmentTime, reasonForVisit }}
 */
function validateGuestInput(body = {}) {
  const firstName = cleanName(body.firstName, 'El nombre');
  const lastName = cleanName(body.lastName, 'El apellido');

  const idType = String(body.identificationType || '').trim().toUpperCase();
  if (idType !== 'V' && idType !== 'E') throw fail('Elige el tipo de cédula: V o E');
  const cedula = normalizeCedula(idType, body.identificationNumber);

  const phone = normalizePhoneVE(body.phone);

  const rawEmail = String(body.email || '').trim().toLowerCase();
  if (!EMAIL_REGEX.test(rawEmail) || rawEmail.length > 120) throw fail('Escribe un correo válido');
  // Igual que el registro y el inicio de sesión (express-validator normalizeEmail): en Gmail quita
  // puntos y lo que va después de "+". Si se guardara distinto, la persona no podría entrar.
  const email = require('./canonicalEmail').canonicalEmail(rawEmail);

  const doctorProfileId = Number(body.doctorProfileId);
  if (!Number.isInteger(doctorProfileId) || doctorProfileId <= 0) throw fail('Médico no válido');

  if (!isValidDate(body.appointmentDate)) throw fail('Elige una fecha válida');
  if (!TIME_REGEX.test(String(body.appointmentTime || ''))) throw fail('Elige una hora válida');

  const reason = String(body.reasonForVisit || '').trim().slice(0, 500);

  return {
    firstName,
    lastName,
    cedula,
    phone,
    email,
    doctorProfileId,
    appointmentDate: body.appointmentDate,
    appointmentTime: body.appointmentTime,
    reasonForVisit: reason || 'Consulta general'
  };
}

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Enlace donde el paciente pone su clave (usa la página de recuperar clave que ya existe) */
function claimUrl(baseUrl, token) {
  return `${String(baseUrl || '').replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;
}

/** Correo de la primera cita: resumen de la solicitud y el enlace para poner la clave. */
function buildGuestEmail({ patientName, doctorName, date, time, location, claimLink }) {
  const when = `${formatDateEs(date)} a las ${String(time).slice(0, 5)}`;
  const subject = 'Recibimos tu solicitud de cita en CitaMed';
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0B2D4A;">Recibimos tu solicitud de cita</h2>
      <p>Hola ${escapeHtml(patientName)},</p>
      <p>Tu cita con <strong>${escapeHtml(doctorName)}</strong> quedó solicitada para el <strong>${escapeHtml(when)}</strong>${location ? ` en ${escapeHtml(location)}` : ''}. El consultorio la confirmará a la brevedad.</p>
      <p>Para agendar de nuevo, ver tus récipes digitales y no olvidar nada, crea tu clave y activa tu cuenta (solo toma un minuto). El enlace vence en ${CLAIM_LINK_DAYS} días:</p>
      <p>
        <a href="${claimLink}" style="background-color: #0B2D4A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Crear mi clave</a>
      </p>
      <p style="color: #64748b; font-size: 12px;">Si no pediste esta cita, ignora este correo: no se activará ninguna cuenta sin tu clave.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">CitaMed - Plataforma de Salud Digital de Venezuela</p>
    </div>`;
  const text = [
    `Hola ${patientName},`,
    '',
    `Tu cita con ${doctorName} quedó solicitada para el ${when}${location ? ` en ${location}` : ''}. El consultorio la confirmará a la brevedad.`,
    '',
    `Para agendar de nuevo, ver tus récipes digitales y no olvidar nada, crea tu clave aquí (vence en ${CLAIM_LINK_DAYS} días):`,
    claimLink,
    '',
    'Si no pediste esta cita, ignora este correo.'
  ].join('\n');
  return { subject, html, text };
}

module.exports = {
  CLAIM_LINK_DAYS,
  guestBookingEnabled,
  validateGuestInput,
  claimUrl,
  buildGuestEmail,
  isDeliverableEmail
};

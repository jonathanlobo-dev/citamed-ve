/**
 * appointmentEmails.js - CITAMED.VE
 * Reglas y textos de los correos de citas (confirmación, cancelación y recordatorio).
 * Todo es lógica pura, sin base de datos ni envío, para poder probarla.
 *
 * Las fechas de las citas son hora de Caracas (UTC-4, sin horario de verano).
 */

const CARACAS_OFFSET = '-04:00';

const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

// Cuentas de prueba y dominios de ejemplo: enviarles correo solo genera rebotes y daña la reputación del remitente
const TEST_EMAIL_PATTERNS = [/@citamed\.ve$/i, /@example\.[a-z]+$/i, /@test\./i, /@mock\./i, /@ejemplo\./i];

function isTestEmail(email) {
  const e = String(email || '').trim();
  return TEST_EMAIL_PATTERNS.some((re) => re.test(e));
}

function isDeliverableEmail(email) {
  const e = String(email || '').trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && !isTestEmail(e);
}

/** Instante exacto de una cita: fecha 'YYYY-MM-DD' y hora 'HH:MM[:SS]' en hora de Caracas */
function appointmentInstant(date, time) {
  const d = String(date || '').slice(0, 10);
  const t = String(time || '').slice(0, 5);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d) || !/^\d{2}:\d{2}$/.test(t)) return null;
  const instant = new Date(`${d}T${t}:00${CARACAS_OFFSET}`);
  return Number.isNaN(instant.getTime()) ? null : instant;
}

/** ¿La cita está dentro de la ventana del recordatorio (por defecto de 20 a 28 horas por delante)? */
function inReminderWindow(now, instant, { fromHours = 20, toHours = 28 } = {}) {
  if (!instant) return false;
  const hours = (instant.getTime() - now.getTime()) / 3600000;
  return hours >= fromHours && hours <= toHours;
}

/** "lunes 9 de noviembre". La fecha se lee sin pasar por zonas horarias. */
function formatDateEs(date) {
  const m = String(date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return '';
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const weekday = DAYS[new Date(Date.UTC(y, mo - 1, d)).getUTCDay()];
  return `${weekday} ${d} de ${MONTHS[mo - 1]}`;
}

/** "3:30 p. m." */
function formatTimeEs(time) {
  const m = String(time || '').match(/^(\d{2}):(\d{2})/);
  if (!m) return '';
  const h = Number(m[1]);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  return `${h % 12 || 12}:${m[2]} ${suffix}`;
}

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function shell(title, bodyHtml) {
  return `<div style="font-family:Calibri,Arial,sans-serif;max-width:560px;margin:0 auto;color:#1F2937">
  <div style="padding:20px 0;border-bottom:3px solid #0D9488"><span style="font-size:22px;font-weight:700;color:#134E4A">CITAMED.VE</span></div>
  <h2 style="font-size:19px;margin:24px 0 12px">${esc(title)}</h2>
  ${bodyHtml}
  <p style="font-size:12px;color:#6B7280;margin-top:32px;border-top:1px solid #E5E7EB;padding-top:12px">CitaMed, plataforma de salud de Venezuela. Este mensaje es automático; si necesitas ayuda escribe a soporte@citamedve.app.</p>
</div>`;
}

function detailsBlock({ doctorName, specialty, dateText, timeText, location }) {
  const row = (k, v) => (v ? `<tr><td style="padding:4px 12px 4px 0;color:#6B7280">${esc(k)}</td><td style="padding:4px 0;font-weight:600">${esc(v)}</td></tr>` : '');
  return `<table style="border-collapse:collapse;margin:12px 0">${row('Médico', doctorName)}${row('Especialidad', specialty)}${row('Fecha', dateText)}${row('Hora', timeText)}${row('Lugar', location)}</table>`;
}

function button(url, label) {
  return `<p style="margin:20px 0"><a href="${esc(url)}" style="background:#0D9488;color:#fff;text-decoration:none;padding:11px 20px;border-radius:8px;font-weight:600;display:inline-block">${esc(label)}</a></p>`;
}

/**
 * kind: 'reminder' | 'confirmation' | 'cancellation'
 * data: { patientName, doctorName, specialty, date, time, location, manageUrl, confirmUrl, cancelledBy }
 * Devuelve { subject, html, text }.
 */
function buildEmail(kind, data) {
  const dateText = formatDateEs(data.date);
  const timeText = formatTimeEs(data.time);
  const hello = data.patientName ? `Hola ${esc(data.patientName)},` : 'Hola,';
  const details = detailsBlock({ doctorName: data.doctorName, specialty: data.specialty, dateText, timeText, location: data.location });
  const textDetails = [`Médico: ${data.doctorName}`, data.specialty && `Especialidad: ${data.specialty}`, `Fecha: ${dateText}`, `Hora: ${timeText}`, data.location && `Lugar: ${data.location}`]
    .filter(Boolean).join('\n');

  if (kind === 'reminder') {
    const action = data.confirmUrl
      ? `<p>Confirma tu asistencia o avísanos si no podrás ir desde este enlace:</p>${button(data.confirmUrl, 'Confirmar o cancelar mi cita')}`
      : `<p>Si no podrás asistir, cancela o reprograma desde <strong>Mis citas</strong> para liberar el turno:</p>${button(data.manageUrl, 'Ver mis citas')}`;
    const actionText = data.confirmUrl ? `Confirma o cancela aquí: ${data.confirmUrl}` : `Si no podrás asistir, cancela desde Mis citas: ${data.manageUrl}`;
    return {
      subject: `Recordatorio: tu cita con ${data.doctorName} el ${dateText} a las ${timeText}`,
      html: shell('Recordatorio de tu cita', `<p>${hello}</p><p>Te recordamos que tienes una cita próxima.</p>${details}${action}<p style="color:#6B7280;font-size:13px">Llega unos minutos antes y usa la sala de espera virtual desde la aplicación.</p>`),
      text: `${hello.replace(/&[^;]+;/g, '')}\n\nTe recordamos que tienes una cita próxima.\n${textDetails}\n\n${actionText}`
    };
  }

  if (kind === 'confirmation') {
    return {
      subject: `Tu cita con ${data.doctorName} quedó registrada para el ${dateText}`,
      html: shell('Cita registrada', `<p>${hello}</p><p>Registramos tu cita. El médico la revisará y la confirmará; te avisaremos si cambia algo.</p>${details}${button(data.manageUrl, 'Ver mis citas')}`),
      text: `${hello.replace(/&[^;]+;/g, '')}\n\nRegistramos tu cita.\n${textDetails}\n\nVer mis citas: ${data.manageUrl}`
    };
  }

  if (kind === 'cancellation') {
    const who = { doctor: 'el médico', patient: 'tú', admin: 'la plataforma', system: 'el sistema' }[data.cancelledBy] || 'el médico';
    return {
      subject: `Tu cita del ${dateText} fue cancelada`,
      html: shell('Cita cancelada', `<p>${hello}</p><p>Tu cita fue cancelada por ${esc(who)}. El turno quedó libre.</p>${details}<p>Puedes pedir una nueva cita cuando quieras.</p>${button(data.manageUrl, 'Ver mis citas')}`),
      text: `${hello.replace(/&[^;]+;/g, '')}\n\nTu cita fue cancelada por ${who}.\n${textDetails}\n\nPuedes pedir una nueva cita: ${data.manageUrl}`
    };
  }

  throw new Error(`Tipo de correo de cita desconocido: ${kind}`);
}

function emailsEnabled(env = process.env) {
  return String(env.APPOINTMENT_EMAILS_ENABLED || '').toLowerCase() === 'true';
}

module.exports = {
  CARACAS_OFFSET,
  isTestEmail,
  isDeliverableEmail,
  appointmentInstant,
  inReminderWindow,
  formatDateEs,
  formatTimeEs,
  buildEmail,
  emailsEnabled
};

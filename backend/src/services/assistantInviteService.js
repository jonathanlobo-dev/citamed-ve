/**
 * assistantInviteService.js - CITAMED.VE
 * M01 / Semana 9 - Invitación de la asistente por correo y activación de su cuenta
 *
 * Una asistente nueva recibe un enlace de un solo uso (7 días) para definir su clave; al hacerlo
 * su cuenta queda activa y el vínculo con el médico aceptado. Si el correo no está configurado,
 * el médico recibe el mismo enlace para mandarlo por WhatsApp.
 */

const crypto = require('crypto');
const { DoctorAssistant, User, sequelize } = require('../models');
const emailService = require('./emailService');
const auditService = require('./auditService');
const passwordRecoveryService = require('./passwordRecoveryService');

const INVITE_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const FRONTEND = () => (process.env.FRONTEND_URL || 'https://citamed-ve.pages.dev').replace(/\/$/, '');
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const escapeHtml = (s) => String(s || '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * Genera el enlace de la invitación y envía el correo.
 * @returns {Promise<{ inviteUrl: string, emailSent: boolean, needsActivation: boolean }>}
 */
async function issueInvite(link, assistantUser, doctorUser) {
  const needsActivation = assistantUser.accountClaimed === false;
  let inviteUrl = `${FRONTEND()}/login`;

  if (needsActivation) {
    const token = crypto.randomBytes(32).toString('hex');
    link.inviteTokenHash = hashToken(token);
    link.inviteExpiresAt = new Date(Date.now() + INVITE_TTL_MS);
    await link.save();
    inviteUrl = `${FRONTEND()}/activar-asistente/${token}`;
  }

  const doctorName = `Dr(a). ${doctorUser.firstName || ''} ${doctorUser.lastName || ''}`.trim();
  const html = `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #0f172a;">
      <h2 style="color: #0B2D4A;">Te invitaron a CitaMed</h2>
      <p>Hola ${escapeHtml(assistantUser.firstName)},</p>
      <p><strong>${escapeHtml(doctorName)}</strong> te invitó a ser su asistente en CitaMed para manejar su agenda, su sala de espera y sus cobros.</p>
      <p>${needsActivation ? 'Para empezar, define tu contraseña con este enlace (vence en 7 días):' : 'Entra con tu cuenta y acepta la invitación:'}</p>
      <p>
        <a href="${inviteUrl}" style="background-color: #0B2D4A; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
          ${needsActivation ? 'Activar mi cuenta' : 'Ir a CitaMed'}
        </a>
      </p>
      <p style="color: #64748b; font-size: 12px;">Como asistente no tendrás acceso a la historia clínica de los pacientes.</p>
      <p style="color: #64748b; font-size: 12px; margin-top: 24px;">CitaMed - Plataforma de Salud Digital de Venezuela</p>
    </div>`;

  const result = await emailService.sendTransactional({
    to: assistantUser.email,
    subject: `${doctorName} te invitó a CitaMed`,
    html
  });

  return { inviteUrl, emailSent: Boolean(result.success), needsActivation };
}

async function findLinkByToken(token) {
  if (!token || typeof token !== 'string' || token.length < 32) return null;
  return DoctorAssistant.findOne({
    where: { inviteTokenHash: hashToken(token) },
    include: [
      { model: User, as: 'doctor', attributes: ['id', 'firstName', 'lastName'] },
      { model: User, as: 'assistant', attributes: ['id', 'firstName', 'lastName', 'email', 'accountClaimed', 'role'] }
    ]
  });
}

function invalidReason(link) {
  if (!link) return 'El enlace no es válido o ya fue usado';
  if (!link.inviteExpiresAt || new Date(link.inviteExpiresAt).getTime() < Date.now()) return 'El enlace venció. Pídele al médico que te reenvíe la invitación';
  if (link.status === 'revoked') return 'Esta invitación fue cancelada por el médico';
  if (!link.assistant || link.assistant.role !== 'assistant' || link.assistant.accountClaimed !== false) return 'Esta cuenta ya está activa. Inicia sesión con tu correo';
  return null;
}

/** Datos para mostrar en la página de activación (sin datos sensibles). */
async function getInviteInfo(token) {
  const link = await findLinkByToken(token);
  const reason = invalidReason(link);
  if (reason) {
    const err = new Error(reason);
    err.statusCode = 400;
    throw err;
  }
  return {
    doctorName: `Dr(a). ${link.doctor.firstName || ''} ${link.doctor.lastName || ''}`.trim(),
    assistantFirstName: link.assistant.firstName,
    email: link.assistant.email
  };
}

/** Define la clave, activa la cuenta y acepta el vínculo. El enlace queda inutilizado. */
async function activate(token, password) {
  const check = passwordRecoveryService.validatePasswordStrength(password || '');
  if (!check.valid) {
    const err = new Error(`La contraseña no es segura: ${check.message}`);
    err.statusCode = 400;
    throw err;
  }

  return sequelize.transaction(async (t) => {
    const link = await findLinkByToken(token);
    const reason = invalidReason(link);
    if (reason) {
      const err = new Error(reason);
      err.statusCode = 400;
      throw err;
    }

    const user = await User.findByPk(link.assistantId, { transaction: t, lock: t.LOCK.UPDATE });
    user.password = password; // el hook del modelo la cifra
    user.accountClaimed = true;
    await user.save({ transaction: t });

    link.status = 'active';
    link.acceptedAt = new Date();
    link.inviteTokenHash = null;
    link.inviteExpiresAt = null;
    await link.save({ transaction: t });

    await auditService.log({
      userId: user.id,
      action: 'assistant_activated',
      resource: 'doctor_assistant',
      resourceId: String(link.id),
      metadata: { doctorId: link.doctorId }
    });

    return { email: user.email };
  });
}

module.exports = { issueInvite, getInviteInfo, activate };

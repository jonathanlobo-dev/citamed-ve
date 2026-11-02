/**
 * accountService.js - CITAMED.VE
 * "Mi cuenta": cambio de correo (con clave actual y código al correo nuevo), cambio de clave y
 * solicitudes de cambio de datos protegidos (nombre, cédula, MPPS) que decide un administrador.
 */

const { Op } = require('sequelize');
const { sequelize, User, DoctorProfile, PatientProfile, VerificationToken, ProfileChangeRequest } = require('../models');
const emailService = require('./emailService');
const passwordRecoveryService = require('./passwordRecoveryService');
const auditService = require('./auditService');
const { logger } = require('../config/logger');
const { PROTECTED_FIELDS, protectedFieldsForRole, normalizeEmail, validateChangeRequest } = require('../utils/accountRules');

const EMAIL_COOLDOWN_SECONDS = 60;

function httpError(status, message, code) {
  const error = new Error(message);
  error.statusCode = status;
  error.code = code;
  return error;
}

async function safeAudit(entry) {
  try {
    await auditService.log(entry);
  } catch (error) {
    logger.error('No se pudo registrar la auditoría de cuenta', { error: error.message, action: entry.action });
  }
}

async function loadUser(userId) {
  const user = await User.findByPk(userId);
  if (!user) throw httpError(404, 'Usuario no encontrado', 'USER_NOT_FOUND');
  return user;
}

async function profileOf(user) {
  if (user.role === 'doctor') return DoctorProfile.findOne({ where: { userId: user.id } });
  if (user.role === 'patient') return PatientProfile.findOne({ where: { userId: user.id } });
  return null;
}

/** Valor actual de un dato protegido, para mostrarlo y para guardarlo junto a la solicitud */
async function currentValueOf(user, field) {
  if (field === 'firstName' || field === 'lastName') return user[field] || '';
  const profile = await profileOf(user);
  return profile?.[field] || '';
}

const accountService = {
  // ============================================================
  // RESUMEN
  // ============================================================
  async getSummary(userId) {
    const user = await loadUser(userId);
    const fields = protectedFieldsForRole(user.role);
    const protectedData = [];
    for (const { field, label } of fields) {
      protectedData.push({ field, label, value: await currentValueOf(user, field) });
    }
    const pending = await ProfileChangeRequest.findAll({
      where: { userId, status: 'pending' },
      attributes: ['field']
    });
    return {
      email: user.email,
      emailVerified: user.emailVerified === true,
      role: user.role,
      protectedData,
      pendingFields: pending.map((p) => p.field)
    };
  },

  // ============================================================
  // CORREO
  // ============================================================
  async requestEmailChange(userId, { newEmail, currentPassword }, meta = {}) {
    const user = await loadUser(userId);
    const email = normalizeEmail(newEmail);

    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw httpError(403, 'La clave actual no es correcta', 'WRONG_PASSWORD');
    }
    if (email === user.email.toLowerCase()) {
      throw httpError(400, 'Ese ya es tu correo actual', 'SAME_EMAIL');
    }
    const taken = await User.findOne({ where: { email: { [Op.iLike]: email } }, attributes: ['id'] });
    if (taken) throw httpError(409, 'Ese correo ya está en uso', 'EMAIL_EXISTS');

    const cooldown = await VerificationToken.canResend(userId, 'email', EMAIL_COOLDOWN_SECONDS);
    if (!cooldown.canResend) {
      throw httpError(429, cooldown.message || `Espera ${cooldown.secondsRemaining} segundos antes de pedir otro código`, 'COOLDOWN_ACTIVE');
    }

    const { token, code, verificationToken } = await VerificationToken.createVerification({
      userId,
      type: 'email',
      contactValue: email,
      purpose: 'email_change',
      ipAddress: meta.ipAddress,
      userAgent: meta.userAgent
    });

    const sent = await emailService.sendVerificationEmail({
      to: email,
      code,
      userName: user.firstName || email.split('@')[0],
      token,
      expiryHours: 24
    });
    if (!sent.success) {
      await verificationToken.invalidate('send_failed');
      throw httpError(502, 'No pudimos enviar el código a ese correo. Revisa que esté bien escrito.', 'SEND_FAILED');
    }

    await safeAudit({
      userId,
      action: 'account.email_change_requested',
      resource: 'user',
      resourceId: String(userId),
      entityType: 'user',
      entityId: userId,
      details: { newEmail: email }
    });
    return { token, newEmail: email, expiresAt: verificationToken.expiresAt };
  },

  async confirmEmailChange(userId, { token, code }, meta = {}) {
    if (!token || !code) throw httpError(400, 'Falta el código', 'MISSING_CODE');
    const user = await loadUser(userId);

    const result = await VerificationToken.verifyCode(token, String(code).trim(), meta.ipAddress);
    if (!result.success) {
      throw httpError(400, result.message, result.code);
    }
    const vt = result.verificationToken;
    if (vt.userId !== userId || vt.purpose !== 'email_change') {
      throw httpError(400, 'Este código no corresponde a un cambio de correo', 'INVALID_TOKEN');
    }

    const newEmail = vt.contactValue.toLowerCase();
    const taken = await User.findOne({ where: { email: { [Op.iLike]: newEmail }, id: { [Op.ne]: userId } }, attributes: ['id'] });
    if (taken) throw httpError(409, 'Ese correo ya está en uso', 'EMAIL_EXISTS');

    const oldEmail = user.email;
    await user.update({ email: newEmail, emailVerified: true, emailVerifiedAt: new Date(), isVerified: true });

    // Aviso al correo anterior: si el cambio no lo hizo la persona, se entera
    try {
      await emailService.sendTransactional({
        to: oldEmail,
        subject: 'El correo de tu cuenta CitaMed fue cambiado',
        html: `<p>Hola ${user.firstName || ''},</p><p>El correo de tu cuenta CitaMed cambió a <strong>${newEmail}</strong>.</p><p>Si no fuiste tú, escríbenos de inmediato para proteger tu cuenta.</p>`
      });
    } catch (error) {
      logger.error('No se pudo avisar al correo anterior', { userId, error: error.message });
    }

    await safeAudit({
      userId,
      action: 'account.email_changed',
      resource: 'user',
      resourceId: String(userId),
      entityType: 'user',
      entityId: userId,
      details: { from: oldEmail, to: newEmail }
    });
    return { email: newEmail, emailVerified: true };
  },

  // ============================================================
  // CLAVE
  // ============================================================
  async changePassword(userId, { currentPassword, newPassword }) {
    const user = await loadUser(userId);
    if (!currentPassword || !(await user.comparePassword(currentPassword))) {
      throw httpError(403, 'La clave actual no es correcta', 'WRONG_PASSWORD');
    }
    const strength = passwordRecoveryService.validatePasswordStrength(newPassword);
    if (!strength.valid) throw httpError(400, strength.message, 'WEAK_PASSWORD');
    if (await user.comparePassword(newPassword)) {
      throw httpError(400, 'La clave nueva debe ser distinta a la actual', 'SAME_PASSWORD');
    }

    await user.update({ password: newPassword });

    try {
      await emailService.sendPasswordChangedConfirmation({ to: user.email, userName: user.firstName });
    } catch (error) {
      logger.error('No se pudo enviar la confirmación de cambio de clave', { userId, error: error.message });
    }
    await safeAudit({
      userId,
      action: 'account.password_changed',
      resource: 'user',
      resourceId: String(userId),
      entityType: 'user',
      entityId: userId
    });
    return { changed: true };
  },

  // ============================================================
  // SOLICITUDES DE CAMBIO DE DATOS PROTEGIDOS
  // ============================================================
  async createChangeRequest(userId, body) {
    const user = await loadUser(userId);
    const { field, value, reason } = validateChangeRequest({ ...body, role: user.role });

    const current = await currentValueOf(user, field);
    if (String(current).trim().toLowerCase() === value.toLowerCase()) {
      throw httpError(400, 'Ese ya es tu dato actual', 'NO_CHANGE');
    }
    const existing = await ProfileChangeRequest.findOne({ where: { userId, field, status: 'pending' }, attributes: ['id'] });
    if (existing) {
      throw httpError(409, 'Ya tienes una solicitud pendiente para este dato', 'ALREADY_PENDING');
    }

    const request = await ProfileChangeRequest.create({
      userId,
      field,
      currentValue: String(current || ''),
      requestedValue: value,
      reason
    });
    await safeAudit({
      userId,
      action: 'account.change_requested',
      resource: 'profile_change_request',
      resourceId: String(request.id),
      entityType: 'profile_change_request',
      entityId: request.id,
      details: { field, from: current, to: value }
    });
    return request;
  },

  async listMyChangeRequests(userId) {
    return ProfileChangeRequest.findAll({ where: { userId }, order: [['createdAt', 'DESC']], limit: 50 });
  },

  async listChangeRequests({ status = 'pending', page = 1, limit = 25 } = {}) {
    const where = status === 'all' ? {} : { status };
    const { rows, count } = await ProfileChangeRequest.findAndCountAll({
      where,
      include: [{ model: User, as: 'user', attributes: ['id', 'firstName', 'lastName', 'email', 'role'] }],
      order: [['createdAt', status === 'pending' ? 'ASC' : 'DESC']],
      limit: Math.min(parseInt(limit, 10) || 25, 100),
      offset: ((parseInt(page, 10) || 1) - 1) * (Math.min(parseInt(limit, 10) || 25, 100))
    });
    return { requests: rows, total: count };
  },

  /** Un administrador aprueba o rechaza. Al aprobar, el dato se aplica en la misma transacción. */
  async reviewChangeRequest(requestId, adminUser, { decision, note }) {
    if (!['approved', 'rejected'].includes(decision)) throw httpError(400, 'Decisión no válida', 'INVALID_DECISION');
    const reviewNote = typeof note === 'string' ? note.trim().slice(0, 500) : '';
    if (decision === 'rejected' && reviewNote.length < 5) {
      throw httpError(400, 'Explica brevemente por qué se rechaza', 'NOTE_REQUIRED');
    }

    const t = await sequelize.transaction();
    try {
      const request = await ProfileChangeRequest.findByPk(requestId, { transaction: t, lock: t.LOCK.UPDATE });
      if (!request) throw httpError(404, 'Solicitud no encontrada', 'NOT_FOUND');
      if (request.status !== 'pending') throw httpError(409, 'Esta solicitud ya fue resuelta', 'ALREADY_RESOLVED');

      let doctorProfileId = null;
      if (decision === 'approved') {
        const user = await User.findByPk(request.userId, { transaction: t });
        if (!user) throw httpError(404, 'La persona ya no existe', 'USER_NOT_FOUND');
        if (!PROTECTED_FIELDS[request.field]?.roles.includes(user.role)) {
          throw httpError(400, 'Este dato ya no se puede cambiar para este rol', 'FIELD_NOT_ALLOWED');
        }
        const profile = await profileOf(user);

        if (request.field === 'firstName' || request.field === 'lastName') {
          await user.update({ [request.field]: request.requestedValue }, { transaction: t });
          if (profile) await profile.update({ [request.field]: request.requestedValue }, { transaction: t });
        } else if (request.field === 'identificationNumber') {
          const dup = await PatientProfile.findOne({
            where: { identificationNumber: request.requestedValue, userId: { [Op.ne]: user.id } },
            attributes: ['id'],
            transaction: t
          });
          if (dup) throw httpError(409, 'Esa cédula ya está registrada en otra cuenta', 'CEDULA_EXISTS');
          if (!profile) throw httpError(400, 'La persona no tiene perfil de paciente', 'NO_PROFILE');
          await profile.update({ identificationNumber: request.requestedValue }, { transaction: t });
        } else if (request.field === 'mppsNumber') {
          if (!profile) throw httpError(400, 'La persona no tiene perfil de médico', 'NO_PROFILE');
          await profile.update({ mppsNumber: request.requestedValue }, { transaction: t });
        }
        if (user.role === 'doctor' && profile) doctorProfileId = profile.id;
      }

      await request.update({
        status: decision,
        reviewedBy: adminUser.id,
        reviewedAt: new Date(),
        reviewNote: reviewNote || null
      }, { transaction: t });
      await t.commit();

      // El directorio guarda una copia del nombre: se refresca fuera de la transacción
      if (doctorProfileId) {
        try {
          const { syncSearchCache } = require('./doctorProfileService');
          await syncSearchCache(doctorProfileId);
        } catch (error) {
          logger.error('No se pudo refrescar el directorio tras el cambio', { requestId, error: error.message });
        }
      }

      await safeAudit({
        userId: adminUser.id,
        action: decision === 'approved' ? 'admin.change_request_approved' : 'admin.change_request_rejected',
        resource: 'profile_change_request',
        resourceId: String(request.id),
        entityType: 'profile_change_request',
        entityId: request.id,
        details: { field: request.field, from: request.currentValue, to: request.requestedValue, targetUserId: request.userId, note: reviewNote }
      });
      return request;
    } catch (error) {
      if (!t.finished) await t.rollback();
      throw error;
    }
  }
};

module.exports = accountService;

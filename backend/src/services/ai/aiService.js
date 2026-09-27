/**
 * aiService.js - CITAMED.VE
 * M03 / Semana 7 - Servicio principal de IA (SOAP, RX, Redacción, Transcripción)
 */

const { Op } = require('sequelize');
const { Appointment, User, PatientProfile, AiUsage } = require('../../models');
const platformSettingsService = require('../platformSettingsService');
const { getCaracasParts } = require('../../utils/dateCaracas');
const { VITAL_RANGES, PHYSICAL_EXAM_SYSTEMS } = require('../../utils/clinicalNote');
const { deidentify } = require('./deidentify');
const aiChain = require('./aiChain');
const transcriptionService = require('./transcription');
const {
  IMPROVE_SYSTEM_PROMPT,
  SOAP_SYSTEM_PROMPT,
  RX_SYSTEM_PROMPT
} = require('./prompts');

const RX_ALLOWED_FIELDS = ['medication', 'presentation', 'dose', 'frequency', 'duration', 'instructions'];

class AiService {
  /**
   * Obtiene el estado y límites de uso del usuario para el mes actual en Caracas
   */
  async getStatus(userId) {
    const limits = await platformSettingsService.get('ai_limits', {
      enabled: true,
      monthlyActionsPerDoctor: 200,
      perMinutePerUser: 10
    });

    const textChain = await aiChain.buildTextChain();
    const transChain = await transcriptionService.buildTranscriptionChain();

    const parts = getCaracasParts();
    const startOfMonth = new Date(`${parts.year}-${parts.month}-01T00:00:00-04:00`);
    const nextMonthNum = Number(parts.month) === 12 ? 1 : Number(parts.month) + 1;
    const nextMonthYear = Number(parts.month) === 12 ? Number(parts.year) + 1 : Number(parts.year);
    const startOfNextMonth = new Date(`${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00-04:00`);

    const usedThisMonth = await AiUsage.count({
      where: {
        userId,
        success: true,
        mode: { [Op.ne]: 'test' },
        created_at: {
          [Op.gte]: startOfMonth,
          [Op.lt]: startOfNextMonth
        }
      }
    });

    const monthlyLimit = typeof limits.monthlyActionsPerDoctor === 'number'
      ? limits.monthlyActionsPerDoctor
      : 200;

    return {
      enabled: limits.enabled !== false,
      available: textChain.length > 0,
      transcriptionAvailable: transChain.length > 0,
      monthlyLimit,
      usedThisMonth,
      remaining: Math.max(0, monthlyLimit - usedThisMonth)
    };
  }

  /**
   * Valida permisos y estado de la cita
   */
  async getValidatedAppointment(appointmentId, userId, requiresConsent = false) {
    if (!appointmentId) {
      const err = new Error('ID de cita requerido');
      err.status = 400;
      throw err;
    }

    const appointment = await Appointment.findByPk(appointmentId, {
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
          include: [
            {
              model: PatientProfile,
              as: 'patientProfile',
              attributes: ['id', 'identificationType', 'identificationNumber']
            }
          ]
        }
      ]
    });

    if (!appointment) {
      const err = new Error('Cita no encontrada');
      err.status = 404;
      throw err;
    }

    if (appointment.doctorId !== userId) {
      const err = new Error('No tienes acceso a esta cita');
      err.status = 403;
      throw err;
    }

    if (appointment.status === 'completed') {
      const err = new Error('La consulta ya ha sido completada');
      err.code = 'INVALID_APPOINTMENT_STATUS';
      err.status = 409;
      throw err;
    }

    if (appointment.status !== 'confirmed' && appointment.status !== 'in_progress') {
      const err = new Error(`Estado de cita inválido para procesar IA (${appointment.status})`);
      err.code = 'INVALID_APPOINTMENT_STATUS';
      err.status = 409;
      throw err;
    }

    if (requiresConsent && !appointment.aiConsentAt) {
      const err = new Error('El paciente no ha otorgado consentimiento para el uso de IA en esta consulta');
      err.code = 'AI_CONSENT_REQUIRED';
      err.status = 409;
      throw err;
    }

    return appointment;
  }

  /**
   * Verifica límites habilitados y cuota mensual en Caracas
   */
  async checkLimitsAndQuota(userId) {
    const limits = await platformSettingsService.get('ai_limits', {
      enabled: true,
      monthlyActionsPerDoctor: 200,
      perMinutePerUser: 10
    });

    if (limits.enabled === false) {
      const err = new Error('El asistente de IA se encuentra deshabilitado');
      err.code = 'AI_UNAVAILABLE';
      err.status = 503;
      throw err;
    }

    const parts = getCaracasParts();
    const startOfMonth = new Date(`${parts.year}-${parts.month}-01T00:00:00-04:00`);
    const nextMonthNum = Number(parts.month) === 12 ? 1 : Number(parts.month) + 1;
    const nextMonthYear = Number(parts.month) === 12 ? Number(parts.year) + 1 : Number(parts.year);
    const startOfNextMonth = new Date(`${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01T00:00:00-04:00`);

    const usedThisMonth = await AiUsage.count({
      where: {
        userId,
        success: true,
        mode: { [Op.ne]: 'test' },
        created_at: {
          [Op.gte]: startOfMonth,
          [Op.lt]: startOfNextMonth
        }
      }
    });

    const maxAllowed = typeof limits.monthlyActionsPerDoctor === 'number'
      ? limits.monthlyActionsPerDoctor
      : 200;

    if (usedThisMonth >= maxAllowed) {
      const err = new Error('Has alcanzado el límite mensual de acciones de IA permitidas');
      err.code = 'AI_QUOTA_EXCEEDED';
      err.status = 402;
      throw err;
    }

    return limits;
  }

  /**
   * Extrae datos del paciente para anonimización
   */
  getPatientData(appointment) {
    const patientUser = appointment.patient || {};
    const patientProfile = patientUser.patientProfile || {};

    return {
      firstName: patientUser.firstName || '',
      lastName: patientUser.lastName || '',
      phone: patientUser.phone || '',
      email: patientUser.email || '',
      identificationNumber: patientProfile.identificationNumber || ''
    };
  }

  /**
   * POST /api/ai/improve
   * Mejora redacción médica de un campo
   */
  async improve(userId, { appointmentId, field, text }) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const err = new Error('El texto a mejorar es requerido');
      err.status = 400;
      throw err;
    }

    if (text.length > 5000) {
      const err = new Error('El texto excede el límite máximo de 5000 caracteres');
      err.status = 400;
      throw err;
    }

    const appointment = await this.getValidatedAppointment(appointmentId, userId, false);
    await this.checkLimitsAndQuota(userId);

    const patientData = this.getPatientData(appointment);
    const anonymizedText = deidentify(text, patientData);

    const inputChars = anonymizedText.length;
    let result;

    try {
      result = await aiChain.generate({
        systemPrompt: IMPROVE_SYSTEM_PROMPT,
        userText: `Campo a redactar: ${field || 'General'}\nTexto original:\n${anonymizedText}`,
        json: false
      });

      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'improve',
        inputChars,
        attempts: result.attempts,
        fallback: { provider: result.provider, model: result.model, success: true, latencyMs: result.latencyMs }
      });

      return {
        text: result.text.trim()
      };
    } catch (err) {
      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'improve',
        inputChars,
        attempts: err.attempts,
        fallback: { success: false, errorCode: err.code || `HTTP_${err.status || 500}` }
      });
      throw err;
    }
  }

  /**
   * Registra cada intento de la cadena en ai_usage
   */
  async logUsageAttempts({ userId, appointmentId, mode, inputChars = null, audioSeconds = null, attempts = [], fallback = {} }) {
    try {
      if (Array.isArray(attempts) && attempts.length > 0) {
        for (const att of attempts) {
          await AiUsage.create({
            userId,
            appointmentId,
            mode,
            provider: att.provider || null,
            model: att.model || null,
            success: att.success === true,
            latencyMs: att.latencyMs || null,
            inputChars,
            audioSeconds,
            errorCode: att.success ? null : (att.errorCode || fallback.errorCode || 'AI_ERROR')
          });
        }
      } else {
        await AiUsage.create({
          userId,
          appointmentId,
          mode,
          provider: fallback.provider || null,
          model: fallback.model || null,
          success: fallback.success === true,
          latencyMs: fallback.latencyMs || null,
          inputChars,
          audioSeconds,
          errorCode: fallback.errorCode || null
        });
      }
    } catch (logErr) {
      console.error('[AiService] Error registrando en ai_usage:', logErr.message);
    }
  }

  /**
   * POST /api/ai/soap
   * Genera propuesta estructurada SOAP
   */
  async soap(userId, { appointmentId, text }) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const err = new Error('El texto de la consulta es requerido');
      err.status = 400;
      throw err;
    }

    if (text.length > 15000) {
      const err = new Error('El texto de la consulta excede los 15.000 caracteres');
      err.status = 400;
      throw err;
    }

    const appointment = await this.getValidatedAppointment(appointmentId, userId, true);
    await this.checkLimitsAndQuota(userId);

    const patientData = this.getPatientData(appointment);
    const anonymizedText = deidentify(text, patientData);

    const inputChars = anonymizedText.length;
    let result;

    try {
      result = await aiChain.generate({
        systemPrompt: SOAP_SYSTEM_PROMPT,
        userText: anonymizedText,
        json: true
      });

      const validatedProposal = this.validateSoapProposal(result.parsedJson);

      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'soap',
        inputChars,
        attempts: result.attempts,
        fallback: { provider: result.provider, model: result.model, success: true, latencyMs: result.latencyMs }
      });

      return {
        proposal: validatedProposal,
        provider: result.provider
      };
    } catch (err) {
      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'soap',
        inputChars,
        attempts: err.attempts,
        fallback: { success: false, errorCode: err.code || `HTTP_${err.status || 500}` }
      });
      throw err;
    }
  }

  /**
   * Valida y normaliza la salida del JSON de SOAP
   */
  validateSoapProposal(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        subjective: '',
        objective: '',
        assessment: '',
        plan: '',
        vitalSigns: {},
        physicalExam: {},
        labOrders: [],
        warnings: ['El modelo no devolvió una estructura JSON válida']
      };
    }

    const warnings = Array.isArray(raw.warnings)
      ? raw.warnings.filter(w => typeof w === 'string').map(w => w.slice(0, 300))
      : [];

    // 1. Textos principales recortados a 5000
    const subjective = typeof raw.subjective === 'string' ? raw.subjective.trim().slice(0, 5000) : '';
    const objective = typeof raw.objective === 'string' ? raw.objective.trim().slice(0, 5000) : '';
    const assessment = typeof raw.assessment === 'string' ? raw.assessment.trim().slice(0, 5000) : '';
    const plan = typeof raw.plan === 'string' ? raw.plan.trim().slice(0, 5000) : '';

    // 2. Signos vitales contra rangos de clinicalNote.js
    const cleanVitalSigns = {};
    if (raw.vitalSigns && typeof raw.vitalSigns === 'object' && !Array.isArray(raw.vitalSigns)) {
      for (const [key, range] of Object.entries(VITAL_RANGES)) {
        const val = raw.vitalSigns[key];
        if (val !== undefined && val !== null && val !== '') {
          const num = Number(val);
          if (isNaN(num)) {
            warnings.push(`Se descartó ${key}: no es un número válido`);
          } else if (num < range.min || num > range.max) {
            warnings.push(`Se descartó ${key} (${num}): fuera de rango permitido (${range.min} - ${range.max})`);
          } else {
            cleanVitalSigns[key] = num;
          }
        }
      }
    }

    // 3. Examen físico por sistemas permitidos
    const cleanPhysicalExam = {};
    if (raw.physicalExam && typeof raw.physicalExam === 'object' && !Array.isArray(raw.physicalExam)) {
      for (const system of PHYSICAL_EXAM_SYSTEMS) {
        const sysData = raw.physicalExam[system];
        if (sysData && typeof sysData === 'object' && !Array.isArray(sysData)) {
          const status = sysData.status === 'abnormal' ? 'abnormal' : 'normal';
          const findings = typeof sysData.findings === 'string'
            ? sysData.findings.trim().slice(0, 2000)
            : '';
          cleanPhysicalExam[system] = { status, findings };
        }
      }
    }

    // 4. Órdenes de laboratorio (máximo 20, 200 caracteres c/u)
    let labOrders = [];
    if (Array.isArray(raw.labOrders)) {
      labOrders = raw.labOrders
        .filter(item => typeof item === 'string' && item.trim())
        .map(item => item.trim().slice(0, 200))
        .slice(0, 20);
    }

    return {
      subjective,
      objective,
      assessment,
      plan,
      vitalSigns: cleanVitalSigns,
      physicalExam: cleanPhysicalExam,
      labOrders,
      warnings
    };
  }

  /**
   * POST /api/ai/rx
   * Genera propuesta estructurada de récipe médico
   */
  async rx(userId, { appointmentId, text }) {
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      const err = new Error('El texto de la prescripción es requerido');
      err.status = 400;
      throw err;
    }

    if (text.length > 5000) {
      const err = new Error('El texto de la prescripción excede los 5.000 caracteres');
      err.status = 400;
      throw err;
    }

    const appointment = await this.getValidatedAppointment(appointmentId, userId, true);
    await this.checkLimitsAndQuota(userId);

    const patientData = this.getPatientData(appointment);
    const anonymizedText = deidentify(text, patientData);

    const inputChars = anonymizedText.length;
    let result;

    try {
      result = await aiChain.generate({
        systemPrompt: RX_SYSTEM_PROMPT,
        userText: anonymizedText,
        json: true
      });

      const validatedProposal = this.validateRxProposal(result.parsedJson);

      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'rx',
        inputChars,
        attempts: result.attempts,
        fallback: { provider: result.provider, model: result.model, success: true, latencyMs: result.latencyMs }
      });

      return {
        proposal: validatedProposal,
        provider: result.provider
      };
    } catch (err) {
      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'rx',
        inputChars,
        attempts: err.attempts,
        fallback: { success: false, errorCode: err.code || `HTTP_${err.status || 500}` }
      });
      throw err;
    }
  }

  /**
   * Valida y normaliza la salida del JSON de RX
   */
  validateRxProposal(raw) {
    if (!raw || typeof raw !== 'object') {
      return {
        items: [],
        indications: '',
        warnings: ['El modelo no devolvió una estructura JSON válida para el récipe']
      };
    }

    const warnings = Array.isArray(raw.warnings)
      ? raw.warnings.filter(w => typeof w === 'string').map(w => w.slice(0, 300))
      : [];

    const rawItems = Array.isArray(raw.items) ? raw.items : [];
    const cleanItems = [];

    for (const it of rawItems) {
      if (!it || typeof it !== 'object') continue;
      // Solo items con medication no vacío
      if (typeof it.medication !== 'string' || !it.medication.trim()) continue;

      const item = {};
      for (const field of RX_ALLOWED_FIELDS) {
        if (typeof it[field] === 'string' && it[field].trim()) {
          item[field] = it[field].trim().slice(0, 300);
        } else {
          item[field] = '';
        }
      }

      cleanItems.push(item);
      if (cleanItems.length >= 20) break;
    }

    const indications = typeof raw.indications === 'string'
      ? raw.indications.trim().slice(0, 2000)
      : '';

    return {
      items: cleanItems,
      indications,
      warnings
    };
  }

  /**
   * POST /api/ai/transcribe
   * Transcribe archivo de audio con Whisper
   */
  async transcribe(userId, { appointmentId, buffer, mimeType, filename }) {
    const appointment = await this.getValidatedAppointment(appointmentId, userId, true);
    await this.checkLimitsAndQuota(userId);

    let result;
    try {
      result = await transcriptionService.transcribe({ buffer, mimeType, filename });

      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'transcribe',
        audioSeconds: result.seconds,
        attempts: result.attempts,
        fallback: { provider: result.provider, model: result.model, success: true, latencyMs: result.latencyMs }
      });

      return {
        text: result.text,
        seconds: result.seconds
      };
    } catch (err) {
      await this.logUsageAttempts({
        userId,
        appointmentId: appointment.id,
        mode: 'transcribe',
        attempts: err.attempts,
        fallback: { success: false, errorCode: err.code || `HTTP_${err.status || 500}` }
      });
      throw err;
    }
  }
}

module.exports = new AiService();

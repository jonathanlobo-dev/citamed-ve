// src/services/smsService.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Servicio de envío de SMS con Twilio

const twilio = require('twilio');
const { logger } = require('../config/logger');

/**
 * Configuración de Twilio
 */
const CONFIG = {
  accountSid: process.env.TWILIO_ACCOUNT_SID,
  authToken: process.env.TWILIO_AUTH_TOKEN,
  phoneNumber: process.env.TWILIO_PHONE_NUMBER,
  devMode: process.env.VERIFICATION_DEV_MODE === 'true'
};

// Cliente de Twilio (se inicializa bajo demanda)
let twilioClient = null;

/**
 * Inicializa el cliente de Twilio
 * @returns {Object|null} Cliente de Twilio o null
 */
function getTwilioClient() {
  if (twilioClient) return twilioClient;

  if (CONFIG.accountSid && CONFIG.authToken) {
    try {
      twilioClient = twilio(CONFIG.accountSid, CONFIG.authToken);
      return twilioClient;
    } catch (error) {
      logger.error('Error inicializando cliente Twilio', { error: error.message });
      return null;
    }
  }

  return null;
}

/**
 * Servicio de SMS
 */
const smsService = {
  /**
   * Envía SMS de verificación
   * @param {Object} params
   * @param {string} params.to - Número de teléfono destino (formato +58XXXXXXXXXX)
   * @param {string} params.code - Código de verificación
   * @returns {Object} { success, messageId, error }
   */
  async sendVerificationSMS({ to, code }) {
    try {
      // Validar número
      if (!to || !to.startsWith('+58')) {
        return {
          success: false,
          error: 'Número de teléfono inválido. Debe ser venezolano (+58...)',
          code: 'INVALID_PHONE'
        };
      }

      // Verificar configuración
      const client = getTwilioClient();

      if (!client) {
        if (CONFIG.devMode) {
          logger.warn('Twilio no configurado - modo desarrollo activo', { to, code });
          return {
            success: true,
            messageId: 'dev-mode-sms',
            devMode: true
          };
        }
        throw new Error('Twilio no está configurado. Verifica TWILIO_ACCOUNT_SID y TWILIO_AUTH_TOKEN');
      }

      if (!CONFIG.phoneNumber) {
        throw new Error('TWILIO_PHONE_NUMBER no configurado');
      }

      // Mensaje SMS
      const messageBody = `CITAMED.VE: Tu código de verificación es ${code}. Válido por 15 minutos. No compartir.`;

      // Enviar SMS
      const message = await client.messages.create({
        body: messageBody,
        from: CONFIG.phoneNumber,
        to: to
      });

      logger.info('SMS de verificación enviado via Twilio', {
        to,
        messageSid: message.sid,
        status: message.status
      });

      return {
        success: true,
        messageId: message.sid,
        status: message.status
      };
    } catch (error) {
      // Manejar errores específicos de Twilio
      const twilioError = this.parseTwilioError(error);

      logger.error('Error enviando SMS via Twilio', {
        to,
        error: twilioError.message,
        code: twilioError.code
      });

      return {
        success: false,
        error: twilioError.message,
        code: twilioError.code
      };
    }
  },

  /**
   * Envía SMS genérico
   * @param {Object} params
   * @param {string} params.to - Número destino
   * @param {string} params.message - Mensaje a enviar
   * @returns {Object} { success, messageId, error }
   */
  async sendSMS({ to, message }) {
    try {
      const client = getTwilioClient();

      if (!client) {
        if (CONFIG.devMode) {
          logger.warn('Twilio no configurado - SMS omitido', { to });
          return { success: true, messageId: 'dev-mode', devMode: true };
        }
        throw new Error('Twilio no configurado');
      }

      const result = await client.messages.create({
        body: message,
        from: CONFIG.phoneNumber,
        to: to
      });

      return {
        success: true,
        messageId: result.sid,
        status: result.status
      };
    } catch (error) {
      const twilioError = this.parseTwilioError(error);

      logger.error('Error enviando SMS', {
        to,
        error: twilioError.message
      });

      return {
        success: false,
        error: twilioError.message,
        code: twilioError.code
      };
    }
  },

  /**
   * Envía SMS de recordatorio de cita
   * @param {Object} params
   * @returns {Object} { success, messageId, error }
   */
  async sendAppointmentReminder({ to, patientName, doctorName, date, time }) {
    const message = `CITAMED.VE: Hola ${patientName}, recuerda tu cita con Dr(a). ${doctorName} el ${date} a las ${time}. Confirma o reprograma en citamed.ve`;

    return this.sendSMS({ to, message });
  },

  /**
   * Parsea errores de Twilio a formato amigable
   * @param {Error} error
   * @returns {Object} { message, code }
   */
  parseTwilioError(error) {
    const errorCode = error.code || error.status;

    const errorMessages = {
      21211: 'Número de teléfono inválido',
      21214: 'Número de teléfono no verificado en Twilio (modo trial)',
      21608: 'El número no puede recibir SMS',
      21610: 'Número bloqueado o en lista negra',
      21612: 'Número de origen inválido',
      21614: 'Número destino no SMS-capable',
      21408: 'Región no soportada',
      21617: 'Mensaje muy largo',
      20003: 'Autenticación fallida',
      20404: 'Recurso no encontrado',
      30006: 'Número de teléfono inválido para Venezuela',
      30007: 'Mensaje filtrado como spam'
    };

    return {
      message: errorMessages[errorCode] || error.message || 'Error desconocido al enviar SMS',
      code: errorCode || 'UNKNOWN_ERROR'
    };
  },

  /**
   * Verifica si Twilio está configurado
   * @returns {boolean}
   */
  isConfigured() {
    return !!(CONFIG.accountSid && CONFIG.authToken && CONFIG.phoneNumber);
  },

  /**
   * Obtiene configuración actual (sin credenciales)
   * @returns {Object}
   */
  getConfig() {
    return {
      hasAccountSid: !!CONFIG.accountSid,
      hasAuthToken: !!CONFIG.authToken,
      hasPhoneNumber: !!CONFIG.phoneNumber,
      phoneNumber: CONFIG.phoneNumber ? CONFIG.phoneNumber.replace(/\d{6}$/, '******') : null,
      devMode: CONFIG.devMode
    };
  },

  /**
   * Verifica el balance de la cuenta Twilio
   * @returns {Object} { success, balance, currency }
   */
  async getAccountBalance() {
    try {
      const client = getTwilioClient();

      if (!client) {
        return { success: false, error: 'Twilio no configurado' };
      }

      const balance = await client.balance.fetch();

      return {
        success: true,
        balance: parseFloat(balance.balance),
        currency: balance.currency
      };
    } catch (error) {
      logger.error('Error obteniendo balance Twilio', { error: error.message });
      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Valida formato de número venezolano
   * @param {string} phone
   * @returns {boolean}
   */
  isValidVenezuelanPhone(phone) {
    if (!phone) return false;

    // Debe empezar con +58 y tener 13 caracteres
    if (!phone.startsWith('+58') || phone.length !== 13) {
      return false;
    }

    // Verificar que el resto sean dígitos
    const digits = phone.substring(3);
    if (!/^\d{10}$/.test(digits)) {
      return false;
    }

    // Verificar prefijos válidos de operadoras venezolanas
    const prefix = digits.substring(0, 3);
    const validPrefixes = [
      '412', '414', '416', '424', '426', // Móviles
      '212', '243', '244', '241', '251', '261', '271', '281', '291' // Fijos
    ];

    return validPrefixes.includes(prefix);
  },

  /**
   * Estima costo de SMS a Venezuela
   * @returns {Object} { cost, currency }
   */
  getEstimatedCost() {
    // Costo aproximado por SMS a Venezuela (puede variar)
    return {
      cost: 0.0752,
      currency: 'USD',
      note: 'Costo aproximado, puede variar según plan'
    };
  }
};

module.exports = smsService;

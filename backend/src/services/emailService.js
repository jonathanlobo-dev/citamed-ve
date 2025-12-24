// src/services/emailService.js
// CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
// Servicio de envío de emails con SendGrid

const sgMail = require('@sendgrid/mail');
const { logger } = require('../config/logger');

// Configurar API Key
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

/**
 * Configuración de SendGrid
 */
const CONFIG = {
  fromEmail: process.env.SENDGRID_FROM_EMAIL || 'noreply@citamed.ve',
  fromName: process.env.SENDGRID_FROM_NAME || 'CITAMED.VE',
  templateId: process.env.SENDGRID_TEMPLATE_ID_VERIFICATION || null,
  baseUrl: process.env.FRONTEND_URL || 'https://citamed.ve',
  devMode: process.env.VERIFICATION_DEV_MODE === 'true'
};

/**
 * Genera HTML para email de verificación
 * @param {Object} params
 * @returns {string} HTML del email
 */
function generateVerificationEmailHTML({ code, userName, token, expiryHours }) {
  const verifyUrl = `${CONFIG.baseUrl}/verify-email/${token}`;

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu cuenta - CITAMED.VE</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                CITAMED.VE
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Plataforma de Salud Digital de Venezuela
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">
                ¡Hola${userName ? `, ${userName}` : ''}!
              </h2>

              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Gracias por registrarte en CITAMED.VE. Para completar tu registro y activar tu cuenta, ingresa el siguiente código de verificación:
              </p>

              <!-- Código de verificación -->
              <div style="background-color: #f1f5f9; border-radius: 12px; padding: 30px; text-align: center; margin: 24px 0;">
                <p style="margin: 0 0 12px; color: #64748b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">
                  Tu código de verificación
                </p>
                <div style="font-size: 40px; font-weight: 700; color: #0ea5e9; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                  ${code}
                </div>
              </div>

              <p style="margin: 24px 0; color: #475569; font-size: 14px; line-height: 1.6;">
                O haz clic en el siguiente botón para verificar automáticamente:
              </p>

              <!-- Botón -->
              <div style="text-align: center; margin: 24px 0;">
                <a href="${verifyUrl}" style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: 600; font-size: 16px;">
                  Verificar mi cuenta
                </a>
              </div>

              <!-- Información adicional -->
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; color: #92400e; font-size: 14px;">
                  <strong>Importante:</strong> Este código expira en <strong>${expiryHours} horas</strong>.
                </p>
              </div>

              <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.6;">
                Si no solicitaste esta verificación, puedes ignorar este correo de forma segura.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} CITAMED.VE - Todos los derechos reservados
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                ¿Necesitas ayuda? Contáctanos en <a href="mailto:soporte@citamed.ve" style="color: #0ea5e9;">soporte@citamed.ve</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;
}

/**
 * Genera texto plano para email de verificación
 */
function generateVerificationEmailText({ code, userName, token, expiryHours }) {
  const verifyUrl = `${CONFIG.baseUrl}/verify-email/${token}`;

  return `
CITAMED.VE - Verifica tu cuenta

¡Hola${userName ? `, ${userName}` : ''}!

Gracias por registrarte en CITAMED.VE. Para completar tu registro, usa el siguiente código:

Tu código de verificación: ${code}

O visita este enlace: ${verifyUrl}

IMPORTANTE: Este código expira en ${expiryHours} horas.

Si no solicitaste esta verificación, ignora este correo.

---
CITAMED.VE - Plataforma de Salud Digital de Venezuela
Soporte: soporte@citamed.ve
`;
}

/**
 * Servicio de Email
 */
const emailService = {
  /**
   * Envía email de verificación
   * @param {Object} params
   * @param {string} params.to - Email destinatario
   * @param {string} params.code - Código de verificación
   * @param {string} params.userName - Nombre del usuario
   * @param {string} params.token - Token UUID
   * @param {number} params.expiryHours - Horas hasta expiración
   * @returns {Object} { success, messageId, error }
   */
  async sendVerificationEmail({ to, code, userName, token, expiryHours = 24 }) {
    try {
      // Verificar configuración
      if (!process.env.SENDGRID_API_KEY) {
        if (CONFIG.devMode) {
          logger.warn('SendGrid no configurado - modo desarrollo activo', { to, code });
          return { success: true, messageId: 'dev-mode', devMode: true };
        }
        throw new Error('SENDGRID_API_KEY no configurada');
      }

      const msg = {
        to,
        from: {
          email: CONFIG.fromEmail,
          name: CONFIG.fromName
        },
        subject: 'Verifica tu cuenta en CITAMED.VE',
        text: generateVerificationEmailText({ code, userName, token, expiryHours }),
        html: generateVerificationEmailHTML({ code, userName, token, expiryHours }),
        trackingSettings: {
          clickTracking: { enable: false },
          openTracking: { enable: true }
        }
      };

      // Si hay template ID configurado, usarlo
      if (CONFIG.templateId) {
        msg.templateId = CONFIG.templateId;
        msg.dynamicTemplateData = {
          code,
          userName,
          verifyUrl: `${CONFIG.baseUrl}/verify-email/${token}`,
          expiryHours
        };
        delete msg.text;
        delete msg.html;
      }

      const response = await sgMail.send(msg);

      logger.info('Email de verificación enviado via SendGrid', {
        to,
        messageId: response[0]?.headers?.['x-message-id'],
        statusCode: response[0]?.statusCode
      });

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      logger.error('Error enviando email via SendGrid', {
        to,
        error: error.message,
        code: error.code,
        response: error.response?.body
      });

      return {
        success: false,
        error: error.message,
        code: error.code
      };
    }
  },

  /**
   * Envía email de bienvenida post-verificación
   * @param {Object} params
   * @returns {Object} { success, messageId, error }
   */
  async sendWelcomeEmail({ to, userName, role }) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        if (CONFIG.devMode) {
          logger.warn('SendGrid no configurado - email de bienvenida omitido', { to });
          return { success: true, messageId: 'dev-mode', devMode: true };
        }
        throw new Error('SENDGRID_API_KEY no configurada');
      }

      const roleMessages = {
        patient: 'Ya puedes agendar citas médicas, consultar tu historial y mucho más.',
        doctor: 'Tu cuenta está en proceso de verificación. Te notificaremos cuando sea aprobada.',
        provider: 'Tu cuenta empresarial está en revisión. Pronto podrás ofrecer tus servicios.'
      };

      const msg = {
        to,
        from: {
          email: CONFIG.fromEmail,
          name: CONFIG.fromName
        },
        subject: '¡Bienvenido a CITAMED.VE!',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #0ea5e9;">¡Bienvenido a CITAMED.VE!</h1>
            <p>Hola ${userName},</p>
            <p>Tu cuenta ha sido verificada exitosamente.</p>
            <p>${roleMessages[role] || 'Ya puedes comenzar a usar nuestra plataforma.'}</p>
            <p>
              <a href="${CONFIG.baseUrl}/dashboard" style="background-color: #0ea5e9; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Ir a mi cuenta
              </a>
            </p>
            <p style="color: #666; font-size: 12px; margin-top: 30px;">
              CITAMED.VE - Plataforma de Salud Digital de Venezuela
            </p>
          </div>
        `
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      logger.error('Error enviando email de bienvenida', {
        to,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Envía email de recuperación de contraseña
   * @param {Object} params
   * @returns {Object} { success, messageId, error }
   */
  async sendPasswordResetEmail({ to, code, userName, token, expiryMinutes = 60 }) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        if (CONFIG.devMode) {
          logger.warn('SendGrid no configurado - modo desarrollo', { to, code });
          return { success: true, messageId: 'dev-mode', devMode: true };
        }
        throw new Error('SENDGRID_API_KEY no configurada');
      }

      const resetUrl = `${CONFIG.baseUrl}/reset-password/${token}`;

      const msg = {
        to,
        from: {
          email: CONFIG.fromEmail,
          name: CONFIG.fromName
        },
        subject: 'Recupera tu contraseña - CITAMED.VE',
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #0ea5e9;">Recuperación de Contraseña</h1>
            <p>Hola ${userName || ''},</p>
            <p>Recibimos una solicitud para restablecer tu contraseña. Usa el siguiente código:</p>
            <div style="background: #f1f5f9; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #0ea5e9;">${code}</span>
            </div>
            <p>O haz clic aquí: <a href="${resetUrl}">${resetUrl}</a></p>
            <p style="color: #f59e0b; font-weight: bold;">Este código expira en ${expiryMinutes} minutos.</p>
            <p style="color: #666; font-size: 12px;">Si no solicitaste este cambio, ignora este email.</p>
          </div>
        `
      };

      const response = await sgMail.send(msg);

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      logger.error('Error enviando email de reset', {
        to,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Envía email de confirmación de cambio de contraseña
   * @param {Object} params
   * @returns {Object} { success, messageId, error }
   */
  async sendPasswordChangedConfirmation({ to, userName, ipAddress, timestamp }) {
    try {
      if (!process.env.SENDGRID_API_KEY) {
        if (CONFIG.devMode) {
          logger.warn('SendGrid no configurado - confirmación de cambio omitida', { to });
          return { success: true, messageId: 'dev-mode', devMode: true };
        }
        throw new Error('SENDGRID_API_KEY no configurada');
      }

      const formattedDate = new Date(timestamp).toLocaleString('es-VE', {
        dateStyle: 'full',
        timeStyle: 'short'
      });

      const msg = {
        to,
        from: {
          email: CONFIG.fromEmail,
          name: CONFIG.fromName
        },
        subject: 'Tu contraseña ha sido cambiada - CITAMED.VE',
        html: `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
  <table role="presentation" style="width: 100%; border-collapse: collapse;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">

          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px 40px; border-radius: 12px 12px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600;">
                CITAMED.VE
              </h1>
              <p style="margin: 8px 0 0; color: rgba(255, 255, 255, 0.9); font-size: 14px;">
                Notificación de Seguridad
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="width: 64px; height: 64px; background-color: #d1fae5; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center;">
                  <span style="font-size: 32px;">✓</span>
                </div>
              </div>

              <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600; text-align: center;">
                Contraseña Actualizada
              </h2>

              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Hola ${userName || ''},
              </p>

              <p style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">
                Tu contraseña de CITAMED.VE ha sido cambiada exitosamente.
              </p>

              <!-- Detalles -->
              <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 14px;">
                  <strong>Fecha:</strong> ${formattedDate}
                </p>
                ${ipAddress ? `
                <p style="margin: 0; color: #64748b; font-size: 14px;">
                  <strong>Dirección IP:</strong> ${ipAddress}
                </p>
                ` : ''}
              </div>

              <!-- Advertencia -->
              <div style="background-color: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 0 8px 8px 0; margin: 24px 0;">
                <p style="margin: 0; color: #991b1b; font-size: 14px;">
                  <strong>¿No realizaste este cambio?</strong><br>
                  Si no solicitaste este cambio de contraseña, tu cuenta puede estar comprometida.
                  Por favor contacta a nuestro soporte inmediatamente.
                </p>
              </div>

              <div style="text-align: center; margin: 24px 0;">
                <a href="mailto:soporte@citamed.ve" style="display: inline-block; background: #ef4444; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
                  Reportar Actividad Sospechosa
                </a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 24px 40px; border-radius: 0 0 12px 12px; border-top: 1px solid #e2e8f0;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-align: center;">
                © ${new Date().getFullYear()} CITAMED.VE - Todos los derechos reservados
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                Este es un mensaje automático de seguridad. No respondas a este correo.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
        `
      };

      const response = await sgMail.send(msg);

      logger.info('Email de confirmación de cambio de contraseña enviado', {
        to,
        messageId: response[0]?.headers?.['x-message-id']
      });

      return {
        success: true,
        messageId: response[0]?.headers?.['x-message-id']
      };
    } catch (error) {
      logger.error('Error enviando email de confirmación de cambio', {
        to,
        error: error.message
      });

      return {
        success: false,
        error: error.message
      };
    }
  },

  /**
   * Verifica si SendGrid está configurado
   * @returns {boolean}
   */
  isConfigured() {
    return !!process.env.SENDGRID_API_KEY;
  },

  /**
   * Obtiene configuración actual (sin API key)
   * @returns {Object}
   */
  getConfig() {
    return {
      fromEmail: CONFIG.fromEmail,
      fromName: CONFIG.fromName,
      hasApiKey: !!process.env.SENDGRID_API_KEY,
      hasTemplateId: !!CONFIG.templateId,
      devMode: CONFIG.devMode
    };
  }
};

module.exports = emailService;

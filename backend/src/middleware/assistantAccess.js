/**
 * assistantAccess.js - CITAMED.VE
 * Semana 9 / Bloque A - Middleware para permitir a la asistente actuar en nombre del médico
 */

const { DoctorAssistant, User } = require('../models');

/**
 * Middleware de control de acceso para asistentes
 * @param {'agenda' | 'payments' | 'voidReceipts'} requiredPermission - Permiso requerido
 */
function allowAssistant(requiredPermission) {
  return async (req, res, next) => {
    // Si no hay usuario autenticado, continúa al siguiente middleware de auth/roles
    if (!req.user) {
      return next();
    }

    // Si el usuario no es assistant, pasa sin tocar nada (médicos y admins siguen su flujo normal)
    if (req.user.role !== 'assistant') {
      return next();
    }

    const assistantId = req.user.id;
    const actingDoctorHeader = req.headers['x-acting-doctor'];

    if (!actingDoctorHeader) {
      return res.status(403).json({
        success: false,
        code: 'ACTING_DOCTOR_REQUIRED',
        message: 'Debes indicar el médico con la cabecera X-Acting-Doctor'
      });
    }

    const doctorId = parseInt(actingDoctorHeader, 10);
    if (!doctorId || isNaN(doctorId)) {
      return res.status(403).json({
        success: false,
        code: 'INVALID_ACTING_DOCTOR',
        message: 'El identificador del médico en X-Acting-Doctor no es válido'
      });
    }

    try {
      // 1. Verificar vínculo activo
      const link = await DoctorAssistant.findOne({
        where: {
          doctorId,
          assistantId,
          status: 'active'
        }
      });

      if (!link) {
        return res.status(403).json({
          success: false,
          code: 'NO_ACTIVE_LINK',
          message: 'No tienes un vínculo activo con este médico'
        });
      }

      // 2. Verificar permiso específico
      let hasPermission = false;
      if (requiredPermission === 'agenda') {
        hasPermission = Boolean(link.canAgenda);
      } else if (requiredPermission === 'payments') {
        hasPermission = Boolean(link.canPayments);
      } else if (requiredPermission === 'voidReceipts') {
        hasPermission = Boolean(link.canPayments && link.canVoidReceipts);
      }

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          code: 'PERMISSION_DENIED',
          message: `No tienes el permiso '${requiredPermission}' concedido por este médico`
        });
      }

      // 3. Verificar estado de la cuenta del médico
      const doctor = await User.findByPk(doctorId);
      if (!doctor || doctor.isActive === false || doctor.role !== 'doctor') {
        return res.status(403).json({
          success: false,
          code: 'DOCTOR_UNAVAILABLE',
          message: 'El médico especificado no está disponible o su cuenta no está activa'
        });
      }

      // 4. Reemplazar req.user para que toda la lógica existente del médico funcione
      req.user = {
        id: doctor.id,
        email: doctor.email,
        role: 'doctor',
        actingAssistantId: assistantId,
        actingAssistantEmail: req.user.email
      };

      next();
    } catch (error) {
      console.error('[assistantAccess] Error verificando vínculo de asistente:', error);
      return res.status(500).json({
        success: false,
        code: 'INTERNAL_ERROR',
        message: 'Error al verificar permisos de la asistente'
      });
    }
  };
}

module.exports = {
  allowAssistant
};

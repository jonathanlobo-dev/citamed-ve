/**
 * doctorVerification.js - CITAMED.VE
 * Un médico puede registrarse y preparar su consultorio, pero no atender, emitir documentos
 * ni cobrar hasta que un administrador verifique su identidad profesional.
 *
 * El bloqueo se enciende con ENFORCE_DOCTOR_VERIFICATION=true (así se libera de forma controlada).
 * Los admins y el resto de roles pasan sin tocar nada. La asistente llega aquí ya convertida en
 * su médico (allowAssistant reemplaza req.user), por lo que se evalúa la verificación del médico.
 */

const { DoctorProfile } = require('../models');

const NOT_VERIFIED_MESSAGE =
  'Tu verificación profesional está en revisión. Mientras tanto puedes preparar tu consultorio, pero aún no puedes atender, emitir documentos ni cobrar.';

function isEnforced(env = process.env) {
  return String(env.ENFORCE_DOCTOR_VERIFICATION || '').toLowerCase() === 'true';
}

/** Decide si un perfil de médico puede ejercer. Función pura para poder probarla. */
function canPractice(profile) {
  return !!profile && profile.isVerified === true;
}

async function requireVerifiedDoctor(req, res, next) {
  if (!isEnforced() || !req.user || req.user.role !== 'doctor') {
    return next();
  }
  try {
    const profile = await DoctorProfile.findOne({
      where: { userId: req.user.id },
      attributes: ['id', 'isVerified', 'verificationStatus']
    });
    if (canPractice(profile)) return next();
    return res.status(403).json({
      success: false,
      code: 'DOCTOR_NOT_VERIFIED',
      verificationStatus: profile?.verificationStatus || 'unverified',
      message: NOT_VERIFIED_MESSAGE
    });
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireVerifiedDoctor, canPractice, isEnforced, NOT_VERIFIED_MESSAGE };

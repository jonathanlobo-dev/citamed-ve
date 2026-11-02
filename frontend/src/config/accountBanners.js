/**
 * accountBanners.js - CITAMED.VE
 * Decide qué avisos fijos ve la persona arriba de la pantalla: correo sin verificar y, para
 * médicos, verificación profesional pendiente. Lógica pura para poder probarla sin pantalla.
 */

// Pantallas donde un aviso estorba (acceso, registro, verificación, páginas públicas)
const HIDE_ON = [/^\/login/, /^\/registro/, /^\/forgot-password/, /^\/reset-password/, /^\/verificar/, /^\/activar-asistente/, /^\/cita\//];

const DOCTOR_STATUS_TEXT = {
  rejected: 'Tu verificación profesional fue rechazada. Revisa el motivo y vuelve a enviar tus documentos.',
  documents_incomplete: 'Tu verificación profesional necesita documentos. Sube lo que falta para que podamos revisarla.',
  pending: 'Tu verificación profesional está en revisión. Mientras tanto puedes preparar tu consultorio, pero aún no puedes atender, emitir documentos ni cobrar.',
  unverified: 'Falta enviar tus documentos para verificar tu identidad profesional. Mientras tanto puedes preparar tu consultorio, pero aún no puedes atender, emitir documentos ni cobrar.'
};

export function getAccountBanners(user, pathname = '/') {
  if (!user || HIDE_ON.some((re) => re.test(pathname))) return [];
  const banners = [];

  // emailVerified === undefined es una sesión guardada de antes: se espera a refrescarla, no se asusta a nadie
  if (['patient', 'doctor', 'provider'].includes(user.role) && user.emailVerified === false) {
    banners.push({
      key: 'email',
      tone: 'warning',
      text: `Verifica tu correo (${user.email}) para poder recuperar tu clave y recibir avisos.`,
      actionLabel: 'Verificar ahora',
      to: `/verificar/email?userId=${user.id}&email=${encodeURIComponent(user.email)}&returnTo=${encodeURIComponent(pathname)}`
    });
  }

  if (user.role === 'doctor' && user.profile && user.profile.isVerified !== true) {
    const status = user.profile.verificationStatus || 'unverified';
    banners.push({
      key: 'doctor',
      tone: status === 'rejected' ? 'danger' : 'info',
      text: DOCTOR_STATUS_TEXT[status] || DOCTOR_STATUS_TEXT.unverified,
      actionLabel: status === 'pending' ? 'Ver estado' : 'Subir documentos',
      to: '/medico/verificacion'
    });
  }

  return banners;
}

/**
 * Tareas de la tarjeta "Prepara tu consultorio" - CITAMED.VE
 */

const NEEDS_DOCUMENTS = ['unverified', 'rejected', 'documents_incomplete'];

export function buildSetupTasks(profile, { onSharePublicPage } = {}) {
  if (!profile) return [];
  const availability = Array.isArray(profile.availability) ? profile.availability : [];
  return [
    {
      id: 'documents',
      label: 'Envía tus documentos de verificación',
      hint: 'Título y MPPS. Los necesitamos para habilitar tus consultas.',
      done: profile.isVerified === true || !NEEDS_DOCUMENTS.includes(profile.verificationStatus),
      to: '/medico/verificacion'
    },
    {
      id: 'location',
      label: 'Agrega la dirección de tu consultorio',
      hint: 'Para que tus pacientes sepan a dónde ir.',
      done: Boolean(profile.clinicAddress && String(profile.clinicAddress).trim()),
      to: '/medico/perfil/editar?tab=location'
    },
    {
      id: 'schedule',
      label: 'Configura tus horarios',
      hint: 'Los pacientes solo pueden agendar en los horarios que publiques.',
      done: availability.some((a) => a.isActive !== false),
      to: '/medico/agenda?tab=availability'
    },
    {
      id: 'price',
      label: 'Define el precio de tu consulta',
      hint: 'Se muestra en tu perfil y se usa en los cobros.',
      done: Number(profile.consultationFee) > 0,
      to: '/medico/perfil/editar?tab=services'
    },
    {
      id: 'photo',
      label: 'Sube tu foto de perfil',
      hint: 'Los perfiles con foto inspiran más confianza.',
      done: Boolean(profile.profilePhoto),
      to: '/medico/perfil/editar?tab=info'
    },
    {
      id: 'share',
      label: 'Comparte tu página pública',
      // El enlace se crea al guardar el perfil por primera vez: antes de eso no hay nada que compartir
      hint: profile.publicSlug
        ? 'Envía tu enlace por WhatsApp para recibir citas.'
        : 'Tu enlace se crea al guardar tu perfil por primera vez.',
      done: false,
      optional: true,
      ...(profile.publicSlug ? { onClick: onSharePublicPage } : { to: '/medico/perfil/editar?tab=info' })
    }
  ];
}

/**
 * Share Recipe Utility - CITAMED.VE
 * M03 / Semana 5 - Compartir récipe por Web Share API o WhatsApp
 */

const FRONTEND_URL = window.location.origin;

/**
 * Normaliza número de teléfono a formato solo dígitos con código 58
 * Ej: "+58 412-1234567" -> "584121234567"
 */
export function normalizePhone58(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/\D/g, '');
  if (digits.startsWith('58')) {
    return digits;
  }
  if (digits.startsWith('0')) {
    return '58' + digits.slice(1);
  }
  return '58' + digits;
}

/**
 * Comparte el récipe médico:
 * 1. Intenta Web Share API con archivo adjunto (móviles)
 * 2. Si no se soporta o falla, abre WhatsApp con mensaje y enlace de verificación
 *
 * @param {Object} params
 * @param {Blob} params.pdfBlob - Blob del archivo PDF
 * @param {string} params.verificationCode - Código único de verificación
 * @param {string} params.patientName - Nombre del paciente
 * @param {string} params.doctorName - Nombre del doctor (con Dr/Dra)
 * @param {string} params.date - Fecha formateada de emisión
 * @param {string} [params.patientPhone] - Teléfono del paciente (si comparte el médico)
 * @param {boolean} [params.isPatientSharing=false] - True si el paciente lo comparte
 */
export async function shareRecipe({
  pdfBlob,
  verificationCode,
  patientName = 'Paciente',
  doctorName = 'tu médico',
  date = 'hoy',
  patientPhone = '',
  isPatientSharing = false
}) {
  const verifyLink = `${FRONTEND_URL}/verificar-recipe/${verificationCode}`;
  const shareText = isPatientSharing
    ? `Hola, comparto mi récipe médico emitido por ${doctorName} el ${date}. Puedes verificar su autenticidad aquí: ${verifyLink}`
    : `Hola ${patientName}, te envío tu récipe médico emitido por ${doctorName} el ${date}. Puedes verificar que es auténtico aquí: ${verifyLink}`;

  // 1. Probar Web Share API con archivos si está disponible
  if (pdfBlob && navigator.canShare) {
    try {
      const file = new File([pdfBlob], `recipe-CitaMed-${verificationCode}.pdf`, {
        type: 'application/pdf'
      });

      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Récipe Médico CitaMed - ${patientName}`,
          text: shareText
        });
        return { success: true, method: 'web-share' };
      }
    } catch (err) {
      if (err.name === 'AbortError') {
        // El usuario canceló el diálogo de compartir
        return { success: false, aborted: true };
      }
      console.warn('Web Share API falló, usando fallback de WhatsApp:', err);
    }
  }

  // 2. Fallback a WhatsApp
  const phoneDigits = !isPatientSharing && patientPhone ? normalizePhone58(patientPhone) : '';
  const waUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  window.open(waUrl, '_blank', 'noopener,noreferrer');
  return { success: true, method: 'whatsapp' };
}

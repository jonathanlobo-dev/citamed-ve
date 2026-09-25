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

// Los navegadores solo permiten abrir ventanas o el menú de compartir durante el clic.
// Por eso el PDF se descarga por adelantado y shareRecipe nunca espera una petición antes de compartir.
const pdfCache = new Map();
const pendingPdf = new Map();

export function prefetchRecipePdf(prescriptionId, downloadPdf) {
  if (!prescriptionId || pdfCache.has(prescriptionId) || pendingPdf.has(prescriptionId)) return;
  const request = downloadPdf(prescriptionId)
    .then((res) => pdfCache.set(prescriptionId, new Blob([res.data], { type: 'application/pdf' })))
    .catch(() => {})
    .finally(() => pendingPdf.delete(prescriptionId));
  pendingPdf.set(prescriptionId, request);
}

export function getCachedRecipePdf(prescriptionId) {
  return pdfCache.get(prescriptionId) || null;
}

function openWhatsApp(waUrl) {
  const win = window.open(waUrl, '_blank');
  if (win) {
    win.opener = null;
  } else {
    window.location.href = waUrl;
  }
}

/**
 * Comparte el récipe médico. Debe llamarse directamente desde el clic, sin await previos.
 * En teléfonos con el PDF ya descargado, adjunta el archivo con el menú de compartir;
 * en los demás casos abre WhatsApp con el mensaje y el enlace de verificación.
 */
export function shareRecipe({
  prescriptionId,
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

  const phoneDigits = !isPatientSharing && patientPhone ? normalizePhone58(patientPhone) : '';
  const waUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const blob = pdfBlob || getCachedRecipePdf(prescriptionId);
  const isTouchDevice = window.matchMedia?.('(pointer: coarse)').matches;

  if (blob && isTouchDevice && navigator.canShare) {
    const file = new File([blob], `recipe-CitaMed-${verificationCode}.pdf`, { type: 'application/pdf' });
    if (navigator.canShare({ files: [file] })) {
      return navigator
        .share({ files: [file], title: `Récipe Médico CitaMed - ${patientName}`, text: shareText })
        .then(() => ({ success: true, method: 'web-share' }))
        .catch((err) => {
          if (err.name === 'AbortError') return { success: false, aborted: true };
          window.location.href = waUrl;
          return { success: true, method: 'whatsapp' };
        });
    }
  }

  openWhatsApp(waUrl);
  return Promise.resolve({ success: true, method: 'whatsapp' });
}

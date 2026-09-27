/**
 * Share Document Utility - CITAMED.VE
 * M03 / Semana 6 - Compartir documentos médicos verificables por Web Share API o WhatsApp
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
// Por eso los PDF se descargan por adelantado y shareDocument nunca espera una petición antes de compartir.
const pdfCache = new Map();
const pendingPdf = new Map();

const getCacheKey = (type = 'prescription', id) => `${type}_${id}`;

/**
 * Pre-descarga el PDF de un documento para tenerlo listo en el evento de clic
 */
export function prefetchDocumentPdf(type, id, downloadPdfFn) {
  if (!id || typeof downloadPdfFn !== 'function') return;
  const key = getCacheKey(type, id);
  if (pdfCache.has(key) || pendingPdf.has(key)) return;

  const request = downloadPdfFn(id)
    .then((res) => {
      pdfCache.set(key, new Blob([res.data], { type: 'application/pdf' }));
    })
    .catch((err) => {
      console.warn(`[shareDocument] Error prefetching ${type} ${id}:`, err);
    })
    .finally(() => {
      pendingPdf.delete(key);
    });

  pendingPdf.set(key, request);
}

/**
 * Obtiene el blob de un documento desde la memoria caché
 */
export function getCachedDocumentPdf(type, id) {
  return pdfCache.get(getCacheKey(type, id)) || null;
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
 * Obtiene los textos descriptivos según el tipo de documento médico
 */
function getDocumentLabels(type) {
  switch (type) {
    case 'lab_order':
      return {
        noun: 'orden de exámenes',
        feminine: true,
        filePrefix: 'orden-examenes'
      };
    case 'rest_note':
      return {
        noun: 'reposo médico',
        feminine: false,
        filePrefix: 'reposo-medico'
      };
    case 'certificate':
      return {
        noun: 'constancia médica',
        feminine: true,
        filePrefix: 'constancia'
      };
    case 'medical_report':
      return {
        noun: 'informe médico',
        feminine: false,
        filePrefix: 'informe-medico'
      };
    case 'prescription':
    case 'recipe':
    default:
      return {
        noun: 'récipe médico',
        feminine: false,
        filePrefix: 'recipe'
      };
  }
}

/**
 * Comparte cualquier documento médico verificado.
 * Debe llamarse directamente desde el evento onClick sin awaits previos.
 */
export function shareDocument({
  type = 'prescription',
  documentId,
  verificationCode,
  pdfBlob,
  patientName = 'Paciente',
  doctorName = 'tu médico',
  date = 'hoy',
  patientPhone = '',
  isPatientSharing = false
}) {
  const labels = getDocumentLabels(type);
  const verifyLink = `${FRONTEND_URL}/verificar/${verificationCode}`;

  const emittedWord = labels.feminine ? 'emitida' : 'emitido';
  const authenticWord = labels.feminine ? 'auténtica' : 'auténtico';

  const shareText = isPatientSharing
    ? `Hola, comparto mi ${labels.noun} ${emittedWord} por ${doctorName} el ${date}. Puedes verificar su autenticidad aquí: ${verifyLink}`
    : `Hola ${patientName}, te envío tu ${labels.noun} ${emittedWord} por ${doctorName} el ${date}. Puedes verificar que es ${authenticWord} aquí: ${verifyLink}`;

  const phoneDigits = !isPatientSharing && patientPhone ? normalizePhone58(patientPhone) : '';
  const waUrl = phoneDigits
    ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(shareText)}`
    : `https://wa.me/?text=${encodeURIComponent(shareText)}`;

  const blob = pdfBlob || getCachedDocumentPdf(type, documentId);
  const isTouchDevice =
    typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches;

  if (blob && isTouchDevice && navigator.canShare) {
    const file = new File(
      [blob],
      `${labels.filePrefix}-CitaMed-${verificationCode}.pdf`,
      { type: 'application/pdf' }
    );
    if (navigator.canShare({ files: [file] })) {
      return navigator
        .share({
          files: [file],
          title: `CitaMed - ${labels.noun.toUpperCase()} (${patientName})`,
          text: shareText
        })
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

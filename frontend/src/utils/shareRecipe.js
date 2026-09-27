/**
 * Share Recipe Utility - CITAMED.VE
 * M03 / Semana 5 & Semana 6
 * Re-exporta y delega en shareDocument.js manteniendo compatibilidad total.
 */

import {
  normalizePhone58,
  prefetchDocumentPdf,
  getCachedDocumentPdf,
  shareDocument
} from './shareDocument';

export { normalizePhone58 };

export function prefetchRecipePdf(prescriptionId, downloadPdf) {
  return prefetchDocumentPdf('prescription', prescriptionId, downloadPdf);
}

export function getCachedRecipePdf(prescriptionId) {
  return getCachedDocumentPdf('prescription', prescriptionId);
}

export function shareRecipe(options) {
  return shareDocument({
    ...options,
    type: 'prescription',
    documentId: options.prescriptionId
  });
}

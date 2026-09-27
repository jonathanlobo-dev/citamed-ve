/**
 * medicalDocumentService.js - CITAMED.VE
 * M03 / Semana 6 - Servicio frontend para Documentos Médicos (órdenes, reposos, constancias, informes y adjuntos)
 */

import api from './api';

const medicalDocumentService = {
  /**
   * Obtiene el catálogo de exámenes médicos por categorías
   * @returns {Promise<{success: boolean, data: Array<{category: string, name: string}>}>}
   */
  getLabCatalog: () =>
    api.get('/medical-documents/lab-catalog').then((res) => res.data),

  /**
   * Emite un nuevo documento médico (lab_order, rest_note, certificate, medical_report)
   * @param {Object} data - { appointmentId, type, content }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  create: (data) =>
    api.post('/medical-documents', data).then((res) => res.data),

  /**
   * Obtiene los documentos médicos de un paciente
   * @param {number|string} patientId
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getByPatient: (patientId) =>
    api.get(`/medical-documents/patient/${patientId}`).then((res) => res.data),

  /**
   * Descarga el PDF del documento médico como blob
   * @param {number|string} id
   * @returns {Promise<AxiosResponse<Blob>>}
   */
  downloadPdf: (id) =>
    api.get(`/medical-documents/${id}/pdf`, { responseType: 'blob' }),

  /**
   * Anula un documento médico emitido
   * @param {number|string} id
   * @param {string} reason
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  void: (id, reason) =>
    api.put(`/medical-documents/${id}/void`, { reason }).then((res) => res.data),

  /**
   * Sube un archivo adjunto privado (multipart/form-data)
   * @param {FormData} formData - Debe contener 'file', 'appointmentId', 'title', etc.
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  uploadAttachment: (formData) =>
    api
      .post('/medical-documents/attachments', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then((res) => res.data),

  /**
   * Obtiene la URL firmada de descarga de un archivo adjunto privado
   * @param {number|string} id
   * @returns {Promise<{success: boolean, data: {signedUrl: string, fileName: string}}>}
   */
  getFileSignedUrl: (id) =>
    api.get(`/medical-documents/${id}/file`).then((res) => res.data),

  /**
   * Elimina un archivo adjunto privado
   * @param {number|string} id
   * @returns {Promise<{success: boolean, message: string}>}
   */
  deleteAttachmentFile: (id) =>
    api.delete(`/medical-documents/${id}/file`).then((res) => res.data)
};

export default medicalDocumentService;

/**
 * clinicalRecordService.js - CITAMED.VE
 * M03 / Semana 6 - Servicio frontend para Historia Clínica del Paciente y Médico
 */

import api from './api';

const clinicalRecordService = {
  /**
   * Obtiene la ficha clínica completa de un paciente para el médico
   * @param {number|string} patientId
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getPatientRecordForDoctor: (patientId) =>
    api.get(`/doctor/patients/${patientId}/record`).then((res) => res.data),

  /**
   * Agrega una alergia al paciente desde la consulta o ficha
   * @param {number|string} patientId
   * @param {Object} data - { allergen, severity, reaction }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  addPatientAllergy: (patientId, data) =>
    api.post(`/doctor/patients/${patientId}/allergies`, data).then((res) => res.data),

  /**
   * Agrega una condición/antecedente al paciente desde la consulta o ficha
   * @param {number|string} patientId
   * @param {Object} data - { condition, type, notes }
   * @returns {Promise<{success: boolean, message: string, data: Object}>}
   */
  addPatientCondition: (patientId, data) =>
    api.post(`/doctor/patients/${patientId}/conditions`, data).then((res) => res.data),

  /**
   * Lista los pacientes con los que el médico ha tenido consultas
   * @returns {Promise<{success: boolean, data: Array}>}
   */
  getDoctorPatients: () =>
    api.get('/doctor/patients').then((res) => res.data),

  /**
   * Obtiene la historia clínica del propio paciente autenticado (sin doctorNotes)
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  getMyClinicalRecord: () =>
    api.get('/patients/me/record').then((res) => res.data)
};

export default clinicalRecordService;

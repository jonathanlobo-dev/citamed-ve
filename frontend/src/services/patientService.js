/**
 * Patient Service - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Servicio para gestión de perfiles de pacientes
 */

import api from './api';

// ═══════════════════════════════════════════════════════════════
// MI PERFIL (PACIENTE AUTENTICADO)
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene perfil del paciente autenticado
 * @returns {Promise<Object>} Perfil completo con completitud
 */
export const getMyProfile = async () => {
  const response = await api.get('/patient-profile/me');
  return response.data;
};

/**
 * Actualiza información básica del perfil
 * @param {Object} data - Datos a actualizar
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateProfile = async (data) => {
  const response = await api.put('/patient-profile/me', data);
  return response.data;
};

/**
 * Actualiza contacto de emergencia
 * @param {Object} contactData - Datos del contacto
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateEmergencyContact = async (contactData) => {
  const response = await api.put('/patient-profile/me/emergency-contact', contactData);
  return response.data;
};

/**
 * Actualiza información del seguro médico
 * @param {Object} insuranceData - Datos del seguro
 * @returns {Promise<Object>} Perfil actualizado
 */
export const updateInsurance = async (insuranceData) => {
  const response = await api.put('/patient-profile/me/insurance', insuranceData);
  return response.data;
};

/**
 * Obtiene porcentaje de completitud del perfil
 * @returns {Promise<Object>} Porcentaje y campos faltantes
 */
export const getCompleteness = async () => {
  const response = await api.get('/patient-profile/me/completeness');
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// HISTORIAL MÉDICO
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega una condición al historial médico
 * @param {Object} historyData - Datos de la condición
 * @returns {Promise<Object>} Condición creada
 */
export const addMedicalHistory = async (historyData) => {
  const response = await api.post('/patient-profile/me/medical-history', historyData);
  return response.data;
};

/**
 * Actualiza una condición del historial médico
 * @param {number} historyId - ID de la condición
 * @param {Object} historyData - Datos actualizados
 * @returns {Promise<Object>} Condición actualizada
 */
export const updateMedicalHistory = async (historyId, historyData) => {
  const response = await api.put(`/patient-profile/me/medical-history/${historyId}`, historyData);
  return response.data;
};

/**
 * Elimina una condición del historial médico
 * @param {number} historyId - ID de la condición
 * @returns {Promise<Object>} Confirmación
 */
export const deleteMedicalHistory = async (historyId) => {
  const response = await api.delete(`/patient-profile/me/medical-history/${historyId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// ALERGIAS
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega una alergia
 * @param {Object} allergyData - Datos de la alergia
 * @returns {Promise<Object>} Alergia creada
 */
export const addAllergy = async (allergyData) => {
  const response = await api.post('/patient-profile/me/allergies', allergyData);
  return response.data;
};

/**
 * Actualiza una alergia
 * @param {number} allergyId - ID de la alergia
 * @param {Object} allergyData - Datos actualizados
 * @returns {Promise<Object>} Alergia actualizada
 */
export const updateAllergy = async (allergyId, allergyData) => {
  const response = await api.put(`/patient-profile/me/allergies/${allergyId}`, allergyData);
  return response.data;
};

/**
 * Elimina una alergia
 * @param {number} allergyId - ID de la alergia
 * @returns {Promise<Object>} Confirmación
 */
export const deleteAllergy = async (allergyId) => {
  const response = await api.delete(`/patient-profile/me/allergies/${allergyId}`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// MEDICAMENTOS
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega un medicamento
 * @param {Object} medicationData - Datos del medicamento
 * @returns {Promise<Object>} Medicamento creado
 */
export const addMedication = async (medicationData) => {
  const response = await api.post('/patient-profile/me/medications', medicationData);
  return response.data;
};

/**
 * Actualiza un medicamento
 * @param {number} medicationId - ID del medicamento
 * @param {Object} medicationData - Datos actualizados
 * @returns {Promise<Object>} Medicamento actualizado
 */
export const updateMedication = async (medicationId, medicationData) => {
  const response = await api.put(`/patient-profile/me/medications/${medicationId}`, medicationData);
  return response.data;
};

/**
 * Elimina un medicamento
 * @param {number} medicationId - ID del medicamento
 * @returns {Promise<Object>} Confirmación
 */
export const deleteMedication = async (medicationId) => {
  const response = await api.delete(`/patient-profile/me/medications/${medicationId}`);
  return response.data;
};

/**
 * Suspende un medicamento (marca como inactivo)
 * @param {number} medicationId - ID del medicamento
 * @returns {Promise<Object>} Medicamento actualizado
 */
export const stopMedication = async (medicationId) => {
  const response = await api.post(`/patient-profile/me/medications/${medicationId}/stop`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// PERFIL DE PACIENTE (PARA DOCTORES/ADMIN)
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene perfil de un paciente (para doctores/admin)
 * @param {number} patientId - ID del perfil del paciente
 * @returns {Promise<Object>} Perfil completo
 */
export const getPatientProfile = async (patientId) => {
  const response = await api.get(`/patient-profile/${patientId}`);
  return response.data;
};

/**
 * Obtiene resumen médico de un paciente (para doctores)
 * @param {number} patientId - ID del perfil del paciente
 * @returns {Promise<Object>} Resumen médico
 */
export const getPatientSummary = async (patientId) => {
  const response = await api.get(`/patient-profile/${patientId}/summary`);
  return response.data;
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Formatea el tipo de sangre para display
 */
export const formatBloodType = (bloodType) => {
  if (!bloodType || bloodType === 'unknown') return 'No especificado';
  return bloodType;
};

/**
 * Formatea el estado de fumador
 */
export const formatSmokingStatus = (status) => {
  const statuses = {
    never: 'Nunca ha fumado',
    former: 'Ex-fumador',
    current: 'Fumador activo',
    unknown: 'No especificado'
  };
  return statuses[status] || status;
};

/**
 * Formatea el consumo de alcohol
 */
export const formatAlcoholConsumption = (consumption) => {
  const consumptions = {
    never: 'No consume',
    occasional: 'Ocasional',
    moderate: 'Moderado',
    heavy: 'Frecuente',
    unknown: 'No especificado'
  };
  return consumptions[consumption] || consumption;
};

/**
 * Formatea la frecuencia de ejercicio
 */
export const formatExerciseFrequency = (frequency) => {
  const frequencies = {
    sedentary: 'Sedentario',
    light: 'Ligero (1-2 días/semana)',
    moderate: 'Moderado (3-4 días/semana)',
    active: 'Activo (5-6 días/semana)',
    very_active: 'Muy activo (diario)',
    unknown: 'No especificado'
  };
  return frequencies[frequency] || frequency;
};

/**
 * Formatea el tipo de alergia
 */
export const formatAllergyType = (type) => {
  const types = {
    medication: 'Medicamento',
    food: 'Alimento',
    environmental: 'Ambiental',
    other: 'Otro'
  };
  return types[type] || type;
};

/**
 * Formatea la severidad de la alergia
 */
export const formatAllergySeverity = (severity) => {
  const severities = {
    mild: 'Leve',
    moderate: 'Moderada',
    severe: 'Severa',
    life_threatening: 'Riesgo vital'
  };
  return severities[severity] || severity;
};

/**
 * Obtiene el color de severidad para UI
 */
export const getSeverityColor = (severity) => {
  const colors = {
    mild: 'yellow',
    moderate: 'orange',
    severe: 'red',
    life_threatening: 'purple'
  };
  return colors[severity] || 'gray';
};

/**
 * Formatea el estado de la condición médica
 */
export const formatConditionStatus = (status) => {
  const statuses = {
    active: 'Activa',
    resolved: 'Resuelta',
    chronic: 'Crónica'
  };
  return statuses[status] || status;
};

/**
 * Obtiene el color del estado de condición para UI
 */
export const getConditionStatusColor = (status) => {
  const colors = {
    active: 'blue',
    resolved: 'green',
    chronic: 'orange'
  };
  return colors[status] || 'gray';
};

/**
 * Calcula el BMI y su categoría
 */
export const calculateBMI = (height, weight) => {
  if (!height || !weight) return null;

  const heightInMeters = parseFloat(height) / 100;
  const bmi = parseFloat((parseFloat(weight) / (heightInMeters * heightInMeters)).toFixed(2));

  let category;
  let color;

  if (bmi < 18.5) {
    category = 'Bajo peso';
    color = 'yellow';
  } else if (bmi < 25) {
    category = 'Normal';
    color = 'green';
  } else if (bmi < 30) {
    category = 'Sobrepeso';
    color = 'orange';
  } else {
    category = 'Obesidad';
    color = 'red';
  }

  return { bmi, category, color };
};

/**
 * Formatea la fecha para display
 */
export const formatDate = (dateString) => {
  if (!dateString) return 'No especificada';
  const date = new Date(dateString);
  return date.toLocaleDateString('es-VE', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

export default {
  // Mi perfil
  getMyProfile,
  updateProfile,
  updateEmergencyContact,
  updateInsurance,
  getCompleteness,

  // Historial médico
  addMedicalHistory,
  updateMedicalHistory,
  deleteMedicalHistory,

  // Alergias
  addAllergy,
  updateAllergy,
  deleteAllergy,

  // Medicamentos
  addMedication,
  updateMedication,
  deleteMedication,
  stopMedication,

  // Perfil de paciente (para doctores)
  getPatientProfile,
  getPatientSummary,

  // Utilidades
  formatBloodType,
  formatSmokingStatus,
  formatAlcoholConsumption,
  formatExerciseFrequency,
  formatAllergyType,
  formatAllergySeverity,
  getSeverityColor,
  formatConditionStatus,
  getConditionStatusColor,
  calculateBMI,
  formatDate
};

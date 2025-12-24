/**
 * Patient Profile Service - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Servicio para gestión completa del perfil de pacientes
 */

const {
  PatientProfile,
  PatientMedicalHistory,
  PatientAllergy,
  PatientMedication,
  User,
  sequelize
} = require('../models');
const { Op } = require('sequelize');

// ═══════════════════════════════════════════════════════════════
// PERFIL COMPLETO
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene el perfil completo de un paciente
 * @param {number} patientProfileId - ID del perfil
 * @returns {Object} Perfil completo con historial, alergias y medicamentos
 */
const getCompleteProfile = async (patientProfileId) => {
  const profile = await PatientProfile.findByPk(patientProfileId, {
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['id', 'email', 'role', 'isActive']
      },
      {
        model: PatientMedicalHistory,
        as: 'medicalHistory',
        order: [['diagnosedDate', 'DESC']]
      },
      {
        model: PatientAllergy,
        as: 'patientAllergies',
        order: [['severity', 'DESC']]
      },
      {
        model: PatientMedication,
        as: 'medications',
        order: [['isActive', 'DESC'], ['startDate', 'DESC']]
      }
    ]
  });

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  // Calcular BMI
  let bmi = null;
  let bmiCategory = null;
  if (profile.height && profile.weight) {
    const heightInMeters = parseFloat(profile.height) / 100;
    bmi = parseFloat((parseFloat(profile.weight) / (heightInMeters * heightInMeters)).toFixed(2));

    if (bmi < 18.5) bmiCategory = 'bajo peso';
    else if (bmi < 25) bmiCategory = 'normal';
    else if (bmi < 30) bmiCategory = 'sobrepeso';
    else bmiCategory = 'obesidad';
  }

  // Calcular estado del seguro
  let insuranceStatus = 'none';
  if (profile.hasInsurance && profile.insuranceProvider) {
    if (profile.insuranceExpiryDate) {
      insuranceStatus = new Date(profile.insuranceExpiryDate) >= new Date() ? 'active' : 'expired';
    } else {
      insuranceStatus = 'active';
    }
  }

  // Calcular completitud
  const completeness = await calculateProfileCompleteness(patientProfileId);

  // Normalizar respuesta para el frontend
  const profileData = profile.toJSON();
  const { patientAllergies, ...rest } = profileData;

  return {
    ...rest,
    allergies: patientAllergies || [],
    bmi,
    bmiCategory,
    insuranceStatus,
    completeness
  };
};

/**
 * Actualiza información básica del perfil
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} data - Datos a actualizar
 * @returns {Object} Perfil actualizado
 */
const updateBasicInfo = async (patientProfileId, data) => {
  const profile = await PatientProfile.findByPk(patientProfileId);

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  // Campos permitidos para actualización básica
  const allowedFields = [
    'bloodType', 'height', 'weight',
    'smokingStatus', 'alcoholConsumption', 'exerciseFrequency', 'dietType',
    'hasChronicConditions', 'hasSurgeries', 'notes',
    'consentForDataSharing', 'consentForResearch',
    'preferredLanguage', 'preferredCommunicationMethod', 'preferredDoctorGender'
  ];

  const updateData = {};
  for (const field of allowedFields) {
    if (data[field] !== undefined) {
      updateData[field] = data[field];
    }
  }

  await profile.update(updateData);

  return profile;
};

/**
 * Actualiza contacto de emergencia
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} contactData - Datos del contacto
 * @returns {Object} Perfil actualizado
 */
const updateEmergencyContact = async (patientProfileId, contactData) => {
  const profile = await PatientProfile.findByPk(patientProfileId);

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  const { name, phone, relationship } = contactData;

  await profile.update({
    emergencyContactName: name,
    emergencyContactPhone: phone,
    emergencyContactRelationship: relationship
  });

  return profile;
};

/**
 * Actualiza información del seguro médico
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} insuranceData - Datos del seguro
 * @returns {Object} Perfil actualizado
 */
const updateInsuranceInfo = async (patientProfileId, insuranceData) => {
  const profile = await PatientProfile.findByPk(patientProfileId);

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  const { company, policyNumber, validUntil, type } = insuranceData;

  await profile.update({
    hasInsurance: !!company,
    insuranceProvider: company || null,
    insurancePolicyNumber: policyNumber || null,
    insuranceExpiryDate: validUntil || null,
    insuranceType: type || null
  });

  return profile;
};

// ═══════════════════════════════════════════════════════════════
// HISTORIAL MÉDICO
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega una condición al historial médico
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} historyData - Datos de la condición
 * @returns {Object} Condición creada
 */
const addMedicalHistory = async (patientProfileId, historyData) => {
  const condition = await PatientMedicalHistory.addCondition(patientProfileId, historyData);
  return condition;
};

/**
 * Actualiza una condición del historial médico
 * @param {number} historyId - ID de la condición
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} historyData - Datos actualizados
 * @returns {Object} Condición actualizada
 */
const updateMedicalHistory = async (historyId, patientProfileId, historyData) => {
  const condition = await PatientMedicalHistory.updateCondition(historyId, patientProfileId, historyData);
  return condition;
};

/**
 * Elimina una condición del historial médico
 * @param {number} historyId - ID de la condición
 * @param {number} patientProfileId - ID del perfil
 * @returns {boolean} Éxito
 */
const deleteMedicalHistory = async (historyId, patientProfileId) => {
  return await PatientMedicalHistory.deleteCondition(historyId, patientProfileId);
};

// ═══════════════════════════════════════════════════════════════
// ALERGIAS
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega una alergia
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} allergyData - Datos de la alergia
 * @returns {Object} Alergia creada
 */
const addAllergy = async (patientProfileId, allergyData) => {
  const allergy = await PatientAllergy.addAllergy(patientProfileId, allergyData);
  return allergy;
};

/**
 * Actualiza una alergia
 * @param {number} allergyId - ID de la alergia
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} allergyData - Datos actualizados
 * @returns {Object} Alergia actualizada
 */
const updateAllergy = async (allergyId, patientProfileId, allergyData) => {
  const allergy = await PatientAllergy.updateAllergy(allergyId, patientProfileId, allergyData);
  return allergy;
};

/**
 * Elimina una alergia
 * @param {number} allergyId - ID de la alergia
 * @param {number} patientProfileId - ID del perfil
 * @returns {boolean} Éxito
 */
const deleteAllergy = async (allergyId, patientProfileId) => {
  return await PatientAllergy.deleteAllergy(allergyId, patientProfileId);
};

// ═══════════════════════════════════════════════════════════════
// MEDICAMENTOS
// ═══════════════════════════════════════════════════════════════

/**
 * Agrega un medicamento
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} medicationData - Datos del medicamento
 * @returns {Object} Medicamento creado
 */
const addMedication = async (patientProfileId, medicationData) => {
  const medication = await PatientMedication.addMedication(patientProfileId, medicationData);
  return medication;
};

/**
 * Actualiza un medicamento
 * @param {number} medicationId - ID del medicamento
 * @param {number} patientProfileId - ID del perfil
 * @param {Object} medicationData - Datos actualizados
 * @returns {Object} Medicamento actualizado
 */
const updateMedication = async (medicationId, patientProfileId, medicationData) => {
  const medication = await PatientMedication.updateMedication(medicationId, patientProfileId, medicationData);
  return medication;
};

/**
 * Elimina un medicamento
 * @param {number} medicationId - ID del medicamento
 * @param {number} patientProfileId - ID del perfil
 * @returns {boolean} Éxito
 */
const deleteMedication = async (medicationId, patientProfileId) => {
  return await PatientMedication.deleteMedication(medicationId, patientProfileId);
};

/**
 * Suspende un medicamento (marca como inactivo con fecha de hoy)
 * @param {number} medicationId - ID del medicamento
 * @param {number} patientProfileId - ID del perfil
 * @returns {Object} Medicamento actualizado
 */
const stopMedication = async (medicationId, patientProfileId) => {
  return await PatientMedication.stopMedication(medicationId, patientProfileId);
};

// ═══════════════════════════════════════════════════════════════
// RESUMEN Y UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Obtiene resumen médico para médicos
 * @param {number} patientProfileId - ID del perfil
 * @returns {Object} Resumen médico
 */
const getMedicalSummary = async (patientProfileId) => {
  const profile = await PatientProfile.findByPk(patientProfileId, {
    include: [
      {
        model: PatientMedicalHistory,
        as: 'medicalHistory',
        where: { status: { [Op.in]: ['active', 'chronic'] } },
        required: false
      },
      {
        model: PatientAllergy,
        as: 'patientAllergies',
        required: false
      },
      {
        model: PatientMedication,
        as: 'medications',
        where: { isActive: true },
        required: false
      }
    ]
  });

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  // BMI
  let bmi = null;
  let bmiCategory = null;
  if (profile.height && profile.weight) {
    const heightInMeters = parseFloat(profile.height) / 100;
    bmi = parseFloat((parseFloat(profile.weight) / (heightInMeters * heightInMeters)).toFixed(2));

    if (bmi < 18.5) bmiCategory = 'bajo peso';
    else if (bmi < 25) bmiCategory = 'normal';
    else if (bmi < 30) bmiCategory = 'sobrepeso';
    else bmiCategory = 'obesidad';
  }

  // Alergias críticas
  const criticalAllergies = profile.patientAllergies
    ?.filter(a => a.severity === 'severe' || a.severity === 'life_threatening')
    .map(a => ({
      allergen: a.allergen,
      type: a.allergyType,
      severity: a.severity,
      reaction: a.reaction
    })) || [];

  // Condiciones crónicas
  const chronicConditions = profile.medicalHistory
    ?.filter(h => h.status === 'chronic')
    .map(h => h.condition) || [];

  // Medicamentos activos
  const activeMedications = profile.medications
    ?.map(m => `${m.medicationName} ${m.dosage} - ${m.frequency}`) || [];

  return {
    patientInfo: {
      name: `${profile.firstName} ${profile.lastName}`,
      age: profile.dateOfBirth ? calculateAge(profile.dateOfBirth) : null,
      gender: profile.gender,
      bloodType: profile.bloodType
    },
    vitalData: {
      height: profile.height,
      weight: profile.weight,
      bmi,
      bmiCategory
    },
    criticalAllergies,
    chronicConditions,
    activeMedications,
    lifestyle: {
      smoking: profile.smokingStatus,
      alcohol: profile.alcoholConsumption,
      exercise: profile.exerciseFrequency
    },
    emergencyContact: profile.emergencyContactName ? {
      name: profile.emergencyContactName,
      phone: profile.emergencyContactPhone,
      relationship: profile.emergencyContactRelationship
    } : null,
    insurance: profile.hasInsurance ? {
      provider: profile.insuranceProvider,
      policyNumber: profile.insurancePolicyNumber,
      validUntil: profile.insuranceExpiryDate
    } : null
  };
};

/**
 * Calcula el porcentaje de completitud del perfil
 * @param {number} patientProfileId - ID del perfil
 * @returns {Object} Porcentaje y campos faltantes
 */
const calculateProfileCompleteness = async (patientProfileId) => {
  const profile = await PatientProfile.findByPk(patientProfileId, {
    include: [
      { model: PatientMedicalHistory, as: 'medicalHistory' },
      { model: PatientAllergy, as: 'patientAllergies' },
      { model: PatientMedication, as: 'medications' }
    ]
  });

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  const missing = [];
  let score = 0;

  // Básico (30%): bloodType, height, weight, emergencyContact
  if (profile.bloodType && profile.bloodType !== 'unknown') {
    score += 7.5;
  } else {
    missing.push('Grupo sanguíneo');
  }

  if (profile.height) {
    score += 7.5;
  } else {
    missing.push('Altura');
  }

  if (profile.weight) {
    score += 7.5;
  } else {
    missing.push('Peso');
  }

  if (profile.emergencyContactName && profile.emergencyContactPhone) {
    score += 7.5;
  } else {
    missing.push('Contacto de emergencia');
  }

  // Seguro (20%)
  if (profile.hasInsurance && profile.insuranceProvider && profile.insurancePolicyNumber) {
    score += 20;
  } else if (!profile.hasInsurance) {
    // Si explícitamente no tiene seguro, considerarlo completo
    score += 20;
  } else {
    missing.push('Información de seguro médico');
  }

  // Historial médico (20%)
  if (profile.medicalHistory?.length > 0 || profile.hasChronicConditions === false) {
    score += 20;
  } else {
    missing.push('Historial médico');
  }

  // Alergias (15%)
  if (profile.patientAllergies?.length > 0 || profile.patientAllergies?.length === 0) {
    // Si tiene alergias registradas o confirmó que no tiene
    score += 15;
  } else {
    missing.push('Alergias (o confirmar que no tiene)');
  }

  // Medicamentos (15%)
  if (profile.medications?.length > 0 || profile.medications?.length === 0) {
    score += 15;
  } else {
    missing.push('Medicamentos actuales (o confirmar que no toma)');
  }

  const percentage = Math.min(100, Math.round(score));

  return {
    percentage,
    missing
  };
};

// ═══════════════════════════════════════════════════════════════
// UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * Calcula la edad desde fecha de nacimiento
 */
const calculateAge = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  return age;
};

/**
 * Obtiene el perfil de paciente por userId
 * @param {number} userId - ID del usuario
 * @returns {Object} Perfil del paciente
 */
const getProfileByUserId = async (userId) => {
  const profile = await PatientProfile.findOne({
    where: { userId }
  });

  if (!profile) {
    throw new Error('Perfil de paciente no encontrado');
  }

  return getCompleteProfile(profile.id);
};

module.exports = {
  // Perfil completo
  getCompleteProfile,
  updateBasicInfo,
  updateEmergencyContact,
  updateInsuranceInfo,

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

  // Resumen y utilidades
  getMedicalSummary,
  calculateProfileCompleteness,
  getProfileByUserId
};

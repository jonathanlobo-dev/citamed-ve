/**
 * Patient Profile Controller - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Controlador para endpoints de perfil de paciente
 */

const patientProfileService = require('../services/patientProfileService');
const db = require('../models');

const { PatientProfile, User } = db;

// ═══════════════════════════════════════════════════════════════
// PERFIL
// ═══════════════════════════════════════════════════════════════

/**
 * GET /patients/:patientId
 * Obtiene perfil de un paciente (para doctores/admin)
 */
async function getProfile(req, res) {
  try {
    const { patientId } = req.params;

    const profile = await patientProfileService.getCompleteProfile(parseInt(patientId));

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);

    if (error.message === 'Perfil de paciente no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil del paciente'
    });
  }
}

/**
 * GET /patients/me
 * Obtiene perfil del paciente autenticado
 * Si el perfil no existe, lo crea automáticamente con datos del User
 */
async function getMyProfile(req, res) {
  try {
    const userId = req.user.id;

    // Intentar obtener el perfil
    let profile;
    try {
      profile = await patientProfileService.getProfileByUserId(userId);
    } catch (error) {
      // Si el perfil no existe, crearlo automáticamente
      if (error.message === 'Perfil de paciente no encontrado') {
        console.log(`Auto-creando perfil de paciente para userId: ${userId}`);

        // Obtener datos del usuario
        const user = await User.findByPk(userId);

        if (!user || user.role !== 'patient') {
          return res.status(403).json({
            success: false,
            message: 'El usuario no tiene rol de paciente'
          });
        }

        // Crear perfil básico con datos del User
        const newProfile = await PatientProfile.create({
          userId: user.id,
          firstName: user.firstName || 'Sin nombre',
          lastName: user.lastName || '',
          phoneNumber: user.phone || null,
          dateOfBirth: user.dateOfBirth || null,
          gender: mapUserGender(user.gender),
          bloodType: 'unknown',
          profileStatus: 'incomplete',
          consentForDataSharing: true
        });

        console.log(`Perfil de paciente creado exitosamente: ${newProfile.id}`);

        // Obtener el perfil completo
        profile = await patientProfileService.getCompleteProfile(newProfile.id);
      } else {
        throw error;
      }
    }

    res.json({
      success: true,
      data: profile
    });
  } catch (error) {
    console.error('Error obteniendo mi perfil:', error);

    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil'
    });
  }
}

/**
 * Mapea el género del User al formato del PatientProfile
 */
function mapUserGender(userGender) {
  const genderMap = {
    'masculino': 'male',
    'femenino': 'female',
    'otro': 'other',
    'prefiero_no_decir': 'prefer_not_to_say',
    'male': 'male',
    'female': 'female',
    'other': 'other',
    'prefer_not_to_say': 'prefer_not_to_say'
  };
  return genderMap[userGender] || 'prefer_not_to_say';
}

/**
 * PUT /patients/me
 * Actualiza información básica del perfil
 */
async function updateProfile(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({
      where: { userId }
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const updatedProfile = await patientProfileService.updateBasicInfo(
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error al actualizar perfil'
    });
  }
}

/**
 * PUT /patients/me/emergency-contact
 * Actualiza contacto de emergencia
 */
async function updateEmergencyContact(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({
      where: { userId }
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const updatedProfile = await patientProfileService.updateEmergencyContact(
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Contacto de emergencia actualizado exitosamente',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error actualizando contacto de emergencia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar contacto de emergencia'
    });
  }
}

/**
 * PUT /patients/me/insurance
 * Actualiza información del seguro médico
 */
async function updateInsurance(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({
      where: { userId }
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const updatedProfile = await patientProfileService.updateInsuranceInfo(
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Información de seguro actualizada exitosamente',
      data: updatedProfile
    });
  } catch (error) {
    console.error('Error actualizando seguro:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar información de seguro'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// HISTORIAL MÉDICO
// ═══════════════════════════════════════════════════════════════

/**
 * POST /patients/me/medical-history
 * Agrega una condición al historial médico
 */
async function addMedicalHistory(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const history = await patientProfileService.addMedicalHistory(
      patientProfile.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Condición médica agregada exitosamente',
      data: history
    });
  } catch (error) {
    console.error('Error agregando historial médico:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar condición médica'
    });
  }
}

/**
 * PUT /patients/me/medical-history/:historyId
 * Actualiza una condición del historial médico
 */
async function updateMedicalHistory(req, res) {
  try {
    const userId = req.user.id;
    const { historyId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const history = await patientProfileService.updateMedicalHistory(
      parseInt(historyId),
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Condición médica actualizada exitosamente',
      data: history
    });
  } catch (error) {
    console.error('Error actualizando historial médico:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar condición médica'
    });
  }
}

/**
 * DELETE /patients/me/medical-history/:historyId
 * Elimina una condición del historial médico
 */
async function deleteMedicalHistory(req, res) {
  try {
    const userId = req.user.id;
    const { historyId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    await patientProfileService.deleteMedicalHistory(
      parseInt(historyId),
      patientProfile.id
    );

    res.json({
      success: true,
      message: 'Condición médica eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando historial médico:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar condición médica'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// ALERGIAS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /patients/me/allergies
 * Agrega una alergia
 */
async function addAllergy(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const allergy = await patientProfileService.addAllergy(
      patientProfile.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Alergia agregada exitosamente',
      data: allergy
    });
  } catch (error) {
    console.error('Error agregando alergia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar alergia'
    });
  }
}

/**
 * PUT /patients/me/allergies/:allergyId
 * Actualiza una alergia
 */
async function updateAllergy(req, res) {
  try {
    const userId = req.user.id;
    const { allergyId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const allergy = await patientProfileService.updateAllergy(
      parseInt(allergyId),
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Alergia actualizada exitosamente',
      data: allergy
    });
  } catch (error) {
    console.error('Error actualizando alergia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar alergia'
    });
  }
}

/**
 * DELETE /patients/me/allergies/:allergyId
 * Elimina una alergia
 */
async function deleteAllergy(req, res) {
  try {
    const userId = req.user.id;
    const { allergyId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    await patientProfileService.deleteAllergy(
      parseInt(allergyId),
      patientProfile.id
    );

    res.json({
      success: true,
      message: 'Alergia eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando alergia:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar alergia'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// MEDICAMENTOS
// ═══════════════════════════════════════════════════════════════

/**
 * POST /patients/me/medications
 * Agrega un medicamento
 */
async function addMedication(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const medication = await patientProfileService.addMedication(
      patientProfile.id,
      req.body
    );

    res.status(201).json({
      success: true,
      message: 'Medicamento agregado exitosamente',
      data: medication
    });
  } catch (error) {
    console.error('Error agregando medicamento:', error);

    // Detectar alerta de alergia
    if (error.message && error.message.includes('ALERTA')) {
      return res.status(409).json({
        success: false,
        isAllergyWarning: true,
        message: error.message
      });
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Error al agregar medicamento'
    });
  }
}

/**
 * PUT /patients/me/medications/:medicationId
 * Actualiza un medicamento
 */
async function updateMedication(req, res) {
  try {
    const userId = req.user.id;
    const { medicationId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const medication = await patientProfileService.updateMedication(
      parseInt(medicationId),
      patientProfile.id,
      req.body
    );

    res.json({
      success: true,
      message: 'Medicamento actualizado exitosamente',
      data: medication
    });
  } catch (error) {
    console.error('Error actualizando medicamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al actualizar medicamento'
    });
  }
}

/**
 * DELETE /patients/me/medications/:medicationId
 * Elimina un medicamento
 */
async function deleteMedication(req, res) {
  try {
    const userId = req.user.id;
    const { medicationId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    await patientProfileService.deleteMedication(
      parseInt(medicationId),
      patientProfile.id
    );

    res.json({
      success: true,
      message: 'Medicamento eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando medicamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al eliminar medicamento'
    });
  }
}

/**
 * POST /patients/me/medications/:medicationId/stop
 * Suspende un medicamento (marca como inactivo)
 */
async function stopMedication(req, res) {
  try {
    const userId = req.user.id;
    const { medicationId } = req.params;

    const patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const medication = await patientProfileService.stopMedication(
      parseInt(medicationId),
      patientProfile.id
    );

    res.json({
      success: true,
      message: 'Medicamento suspendido exitosamente',
      data: medication
    });
  } catch (error) {
    console.error('Error suspendiendo medicamento:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error al suspender medicamento'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// RESUMEN Y UTILIDADES
// ═══════════════════════════════════════════════════════════════

/**
 * GET /patients/:patientId/summary
 * Obtiene resumen médico de un paciente (para doctores)
 */
async function getMedicalSummary(req, res) {
  try {
    const { patientId } = req.params;

    const summary = await patientProfileService.getMedicalSummary(parseInt(patientId));

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error('Error obteniendo resumen médico:', error);

    if (error.message === 'Perfil de paciente no encontrado') {
      return res.status(404).json({
        success: false,
        message: 'Paciente no encontrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error al obtener resumen médico'
    });
  }
}

/**
 * GET /patients/me/completeness
 * Obtiene el porcentaje de completitud del perfil
 */
async function getCompleteness(req, res) {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({
      where: { userId }
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    const completeness = await patientProfileService.calculateProfileCompleteness(
      patientProfile.id
    );

    res.json({
      success: true,
      data: completeness
    });
  } catch (error) {
    console.error('Error obteniendo completitud:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener completitud del perfil'
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// EXPORTAR
// ═══════════════════════════════════════════════════════════════

module.exports = {
  // Perfil
  getProfile,
  getMyProfile,
  updateProfile,
  updateEmergencyContact,
  updateInsurance,

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
  getCompleteness
};

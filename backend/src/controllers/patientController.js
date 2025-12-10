const { PatientProfile, User } = require('../models/index');

// Obtener perfil del paciente actual
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const patientProfile = await PatientProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        }
      ]
    });

    if (!patientProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de paciente no encontrado'
      });
    }

    res.json({
      success: true,
      data: patientProfile
    });
  } catch (error) {
    console.error('Error obteniendo perfil de paciente:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear o actualizar perfil de paciente
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    let patientProfile = await PatientProfile.findOne({ where: { userId } });

    if (patientProfile) {
      // Actualizar perfil existente
      await patientProfile.update(profileData);
      return res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: patientProfile
      });
    } else {
      // Crear nuevo perfil
      patientProfile = await PatientProfile.create({
        userId,
        ...profileData
      });

      return res.status(201).json({
        success: true,
        message: 'Perfil creado correctamente',
        data: patientProfile
      });
    }
  } catch (error) {
    console.error('Error creando/actualizando perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
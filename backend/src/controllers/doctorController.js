const { DoctorProfile, User } = require('../models/index');

// Obtener perfil del doctor actual
exports.getMyProfile = async (req, res) => {
  try {
    const userId = req.user.id; // Obtenido del middleware de autenticación

    const doctorProfile = await DoctorProfile.findOne({
      where: { userId },
      include: [
        {
          model: User,
          attributes: ['id', 'email', 'firstName', 'lastName', 'role']
        }
      ]
    });

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: 'Perfil de doctor no encontrado'
      });
    }

    res.json({
      success: true,
      data: doctorProfile
    });
  } catch (error) {
    console.error('Error obteniendo perfil de doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear o actualizar perfil de doctor
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    // Buscar si ya existe un perfil
    let doctorProfile = await DoctorProfile.findOne({ where: { userId } });

    if (doctorProfile) {
      // Actualizar perfil existente
      await doctorProfile.update(profileData);
      return res.json({
        success: true,
        message: 'Perfil actualizado correctamente',
        data: doctorProfile
      });
    } else {
      // Crear nuevo perfil
      doctorProfile = await DoctorProfile.create({
        userId,
        ...profileData
      });

      return res.status(201).json({
        success: true,
        message: 'Perfil creado correctamente',
        data: doctorProfile
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

// Obtener todos los doctores (para directorio)
exports.getAllDoctors = async (req, res) => {
  try {
    const { specialty, city, page = 1, limit = 10 } = req.query;

    // Construir filtros
    const whereClause = { isVerified: true };
    if (specialty) whereClause.specialty = specialty;
    if (city) whereClause.city = city;

    const offset = (page - 1) * limit;

    const doctors = await DoctorProfile.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      attributes: { 
        exclude: ['userId', 'createdAt', 'updatedAt'] 
      },
      limit: parseInt(limit),
      offset: offset,
      order: [['rating', 'DESC']]
    });

    res.json({
      success: true,
      data: doctors.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(doctors.count / limit),
        totalItems: doctors.count,
        itemsPerPage: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('Error obteniendo doctores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener doctor por ID
exports.getDoctorById = async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await DoctorProfile.findOne({
      where: { id, isVerified: true },
      include: [
        {
          model: User,
          attributes: ['id', 'firstName', 'lastName']
        }
      ],
      attributes: { 
        exclude: ['userId', 'createdAt', 'updatedAt'] 
      }
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Doctor no encontrado'
      });
    }

    res.json({
      success: true,
      data: doctor
    });
  } catch (error) {
    console.error('Error obteniendo doctor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};
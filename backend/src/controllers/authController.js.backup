const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User, DoctorProfile, PatientProfile, sequelize } = require('../models/index');

const authController = {
  register: async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
      const { role, email, password, name, phone, ...additionalData } = req.body;

      if (!role || !email || !password || !name) {
        return res.status(400).json({
          success: false,
          message: 'Campos obligatorios: role, email, password, name'
        });
      }

      if (!['doctor', 'patient', 'provider', 'admin', 'clinic', 'insurer'].includes(role)) {
        return res.status(400).json({
          success: false,
          message: 'Rol inválido. Debe ser: doctor, patient, provider, admin, clinic o insurer'
        });
      }

      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }

      // NO hashear aquí - el modelo User tiene hook beforeCreate que lo hace automáticamente
      const user = await User.create({
        email,
        password, // El hook beforeCreate del modelo User hashea automáticamente
        name,
        phone: phone || null,
        role,
        isActive: true
      }, { transaction });

      let profile = null;
      if (role === 'doctor') {
        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        profile = await DoctorProfile.create({
          userId: user.id,
          firstName,
          lastName,
          phoneNumber: phone || null,
          licenseNumber: additionalData.licenseNumber || null,
          subSpecialty: additionalData.specialty || null, // Using subSpecialty for now
          yearsExperience: additionalData.yearsExperience || 0,
          consultationFee: additionalData.consultationFee || 0
        }, { transaction });
      } else if (role === 'patient') {
        // Split name into firstName and lastName
        const nameParts = name.trim().split(' ');
        const firstName = nameParts[0] || 'N/A';
        const lastName = nameParts.slice(1).join(' ') || 'N/A';

        profile = await PatientProfile.create({
          userId: user.id,
          firstName,
          lastName,
          phoneNumber: phone || null,
          dateOfBirth: additionalData.dateOfBirth || null,
          gender: additionalData.gender || null,
          bloodType: additionalData.bloodType || 'unknown',
          emergencyContactName: additionalData.emergencyContactName || null,
          emergencyContactPhone: additionalData.emergencyContactPhone || null,
          emergencyContactRelationship: additionalData.emergencyContactRelationship || null
        }, { transaction });
      }

      await transaction.commit();

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role
          },
          profile
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error en register:', error);

      // Handle unique constraint violations
      if (error.name === 'SequelizeUniqueConstraintError') {
        if (error.errors && error.errors.length > 0) {
          const field = error.errors[0].path;
          if (field === 'licenseNumber') {
            return res.status(400).json({
              success: false,
              message: 'Esta matrícula profesional ya está registrada en el sistema'
            });
          }
        }
        // Fallback for unique constraint errors
        return res.status(400).json({
          success: false,
          message: 'Este registro ya existe en el sistema. Verifica los datos ingresados.'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar usuario',
        error: error.message
      });
    }
  },

  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email y password son obligatorios'
        });
      }

      const user = await User.findOne({ where: { email } });

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);

      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      let profile = null;
      if (user.role === 'doctor') {
        profile = await DoctorProfile.findOne({ where: { userId: user.id } });
      } else if (user.role === 'patient') {
        profile = await PatientProfile.findOne({ where: { userId: user.id } });
      }

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone,
            role: user.role
          },
          profile
        }
      });

    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error al iniciar sesión',
        error: error.message
      });
    }
  },

  getProfile: async (req, res) => {
    try {
      const user = await User.findByPk(req.user.id, {
        attributes: { exclude: ['password'] }
      });

      let profile = null;
      if (user.role === 'doctor') {
        profile = await DoctorProfile.findOne({ where: { userId: user.id } });
      } else if (user.role === 'patient') {
        profile = await PatientProfile.findOne({ where: { userId: user.id } });
      }

      res.json({
        success: true,
        data: {
          user,
          profile
        }
      });

    } catch (error) {
      console.error('Error en getProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener perfil',
        error: error.message
      });
    }
  }
};

module.exports = authController;

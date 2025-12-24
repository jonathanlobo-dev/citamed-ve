const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const { User, DoctorProfile, PatientProfile, ProviderProfile, sequelize } = require('../models/index');
const authService = require('../services/authService');
const sessionService = require('../services/sessionService');
const { logger } = require('../config/logger');

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

      // Separar nombre en firstName y lastName
      const nameParts = name.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // NO hashear aquí - el modelo User tiene hook beforeCreate que lo hace automáticamente
      const user = await User.create({
        email,
        password,
        firstName,
        lastName,
        phone: phone || null,
        role,
        isActive: true
      }, { transaction });

      let profile = null;
      if (role === 'doctor') {
        profile = await DoctorProfile.create({
          userId: user.id,
          firstName,
          lastName,
          phoneNumber: phone || null,
          licenseNumber: additionalData.licenseNumber || `TEMP-${Date.now()}`,
          subSpecialty: additionalData.specialty || null,
          experienceYears: additionalData.yearsExperience || 0,
          consultationFee: additionalData.consultationFee || 0
        }, { transaction });
      } else if (role === 'patient') {
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

      // Construir nombre completo para la respuesta
      const fullName = lastName ? `${firstName} ${lastName}` : firstName;

      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: fullName,
            phone: user.phone,
            role: user.role
          },
          profile
        }
      });

    } catch (error) {
      await transaction.rollback();
      console.error('Error en register:', error);

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
        return res.status(400).json({
          success: false,
          message: 'Este registro ya existe en el sistema. Verifica los datos ingresados.'
        });
      }

      // Manejar errores de validación de Sequelize
      if (error.name === 'SequelizeValidationError') {
        const messages = error.errors.map(e => e.message).join(', ');
        return res.status(400).json({
          success: false,
          message: `Error de validación: ${messages}`
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
      // Trim inputs to remove accidental whitespace
      const email = (req.body.email || '').trim();
      const password = (req.body.password || '').trim();

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
        // Registrar intento fallido
        await sessionService.recordLoginAttempt(
          user.id,
          false,
          req,
          'Contraseña incorrecta',
          'password'
        );

        return res.status(401).json({
          success: false,
          message: 'Credenciales inválidas'
        });
      }

      // Si 2FA está activado, retornar que se requiere verificación
      if (user.twoFactorEnabled) {
        return res.json({
          success: true,
          requires2FA: true,
          userId: user.id,
          message: 'Se requiere verificación de dos factores'
        });
      }

      // 2FA no activo - login normal
      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Crear sesión y registrar login exitoso
      try {
        await sessionService.createSession(user.id, token, req);
        await sessionService.enforceSessionLimit(user.id);
        await sessionService.recordLoginAttempt(user.id, true, req, null, 'password');
      } catch (sessionError) {
        logger.error('Error creando sesión:', sessionError);
        // Continuar aunque falle el tracking de sesión
      }

      let profile = null;
      if (user.role === 'doctor') {
        profile = await DoctorProfile.findOne({ where: { userId: user.id } });
      } else if (user.role === 'patient') {
        profile = await PatientProfile.findOne({ where: { userId: user.id } });
      }

      // Construir nombre completo para la respuesta
      const fullName = user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.email);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: fullName,
            phone: user.phone,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
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

  /**
   * Login con 2FA - Segundo paso del login
   * POST /api/auth/login/2fa
   */
  loginWith2FA: async (req, res) => {
    try {
      const { userId, token: twoFactorToken } = req.body;

      if (!userId || !twoFactorToken) {
        return res.status(400).json({
          success: false,
          message: 'userId y token son obligatorios'
        });
      }

      const user = await User.findByPk(userId);

      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }

      if (!user.twoFactorEnabled) {
        return res.status(400).json({
          success: false,
          message: '2FA no está activado para este usuario'
        });
      }

      // Verificar código 2FA
      const twoFactorService = require('../services/twoFactorService');
      const ipAddress = req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
                       req.headers['x-real-ip'] ||
                       req.ip || 'unknown';
      const userAgent = req.headers['user-agent'] || null;

      const verification = await twoFactorService.verifyTwoFactorToken(
        userId,
        twoFactorToken,
        ipAddress,
        userAgent
      );

      if (!verification.success) {
        return res.status(401).json({
          success: false,
          message: 'Código de verificación inválido'
        });
      }

      // 2FA verificado - generar token JWT
      const jwtToken = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
      );

      // Crear sesión y registrar login exitoso
      try {
        await sessionService.createSession(user.id, jwtToken, req);
        await sessionService.enforceSessionLimit(user.id);
        await sessionService.recordLoginAttempt(user.id, true, req, null, '2fa');
      } catch (sessionError) {
        logger.error('Error creando sesión 2FA:', sessionError);
        // Continuar aunque falle el tracking de sesión
      }

      let profile = null;
      if (user.role === 'doctor') {
        profile = await DoctorProfile.findOne({ where: { userId: user.id } });
      } else if (user.role === 'patient') {
        profile = await PatientProfile.findOne({ where: { userId: user.id } });
      }

      const fullName = user.lastName ? `${user.firstName} ${user.lastName}` : (user.firstName || user.email);

      res.json({
        success: true,
        message: 'Login exitoso',
        data: {
          token: jwtToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            name: fullName,
            phone: user.phone,
            role: user.role,
            twoFactorEnabled: user.twoFactorEnabled
          },
          profile,
          verificationMethod: verification.method
        }
      });

    } catch (error) {
      console.error('Error en loginWith2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar código 2FA',
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
      } else if (user.role === 'provider') {
        profile = await ProviderProfile.findOne({ where: { userId: user.id } });
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
  },

  /**
   * Verificar si un email ya está registrado
   * GET /api/auth/check-email?email=test@example.com
   */
  checkEmail: async (req, res) => {
    try {
      const { email } = req.query;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email es requerido'
        });
      }

      const exists = await authService.emailExists(email);

      res.json({
        success: true,
        data: {
          exists,
          available: !exists
        }
      });

    } catch (error) {
      console.error('Error en checkEmail:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar email'
      });
    }
  },

  /**
   * Verificar si una cédula ya está registrada
   * GET /api/auth/check-cedula?cedula=V-12345678
   */
  checkCedula: async (req, res) => {
    try {
      const { cedula } = req.query;

      if (!cedula) {
        return res.status(400).json({
          success: false,
          message: 'Cédula es requerida'
        });
      }

      const exists = await authService.cedulaExists(cedula);

      res.json({
        success: true,
        data: {
          exists,
          available: !exists
        }
      });

    } catch (error) {
      console.error('Error en checkCedula:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar cédula'
      });
    }
  },

  /**
   * Registro de paciente (Multi-paso)
   * POST /api/auth/register/patient
   */
  registerPatient: async (req, res) => {
    try {
      // Validar errores de express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array().map(e => ({
            field: e.path,
            message: e.msg
          }))
        });
      }

      const result = await authService.createPatient(req.body);

      res.status(201).json({
        success: true,
        message: 'Paciente registrado exitosamente',
        data: result
      });

    } catch (error) {
      console.error('Error en registerPatient:', error);

      // Manejar errores específicos
      if (error.message === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
          errors: [{ field: 'email', message: 'El email ya está registrado' }]
        });
      }

      if (error.message === 'CEDULA_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'La cédula ya está registrada',
          errors: [{ field: 'identificationNumber', message: 'La cédula ya está registrada' }]
        });
      }

      // Error de validación de Sequelize
      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar paciente',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Registro de médico (Multi-paso)
   * POST /api/auth/register/doctor
   */
  registerDoctor: async (req, res) => {
    try {
      // Validar errores de express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array().map(e => ({
            field: e.path,
            message: e.msg
          }))
        });
      }

      const result = await authService.createDoctor(req.body);

      res.status(201).json({
        success: true,
        message: 'Médico registrado exitosamente. Tu cuenta está pendiente de aprobación.',
        data: result
      });

    } catch (error) {
      console.error('Error en registerDoctor:', error);

      if (error.message === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
          errors: [{ field: 'email', message: 'El email ya está registrado' }]
        });
      }

      if (error.message === 'MPPS_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'El número MPPS ya está registrado',
          errors: [{ field: 'mppsNumber', message: 'El número MPPS ya está registrado' }]
        });
      }

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar médico',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Registro de proveedor (Multi-paso)
   * POST /api/auth/register/provider
   */
  registerProvider: async (req, res) => {
    try {
      // Validar errores de express-validator
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Errores de validación',
          errors: errors.array().map(e => ({
            field: e.path,
            message: e.msg
          }))
        });
      }

      const result = await authService.createProvider(req.body);

      res.status(201).json({
        success: true,
        message: 'Proveedor registrado exitosamente. Tu cuenta está pendiente de aprobación.',
        data: result
      });

    } catch (error) {
      console.error('Error en registerProvider:', error);

      if (error.message === 'EMAIL_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado',
          errors: [{ field: 'email', message: 'El email ya está registrado' }]
        });
      }

      if (error.message === 'RIF_EXISTS') {
        return res.status(400).json({
          success: false,
          message: 'El RIF ya está registrado',
          errors: [{ field: 'rif', message: 'El RIF ya está registrado' }]
        });
      }

      if (error.name === 'SequelizeValidationError') {
        return res.status(400).json({
          success: false,
          message: 'Error de validación',
          errors: error.errors.map(e => ({
            field: e.path,
            message: e.message
          }))
        });
      }

      res.status(500).json({
        success: false,
        message: 'Error al registrar proveedor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },

  /**
   * Cerrar sesión actual
   * POST /api/auth/logout
   */
  logout: async (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(400).json({
          success: false,
          message: 'Token no proporcionado'
        });
      }

      const token = authHeader.substring(7);
      const result = await sessionService.logout(token);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json({
        success: true,
        message: 'Sesión cerrada correctamente'
      });

    } catch (error) {
      console.error('Error en logout:', error);
      res.status(500).json({
        success: false,
        message: 'Error al cerrar sesión'
      });
    }
  }
};

module.exports = authController;

// controllers/verificationController.js
// CITAMED.VE - Sistema de Verificación de Profesionales de Salud
// Cumplimiento legal Venezuela: MPPS, Colegios Médicos, INPSASEL

const { DoctorProfile, User, sequelize } = require('../models/index');
const { Op } = require('sequelize');

const verificationController = {
  // ============================================================
  // OBTENER MÉDICOS PENDIENTES DE VERIFICACIÓN (ADMIN)
  // ============================================================
  getPendingVerifications: async (req, res) => {
    try {
      const { page = 1, limit = 20 } = req.query;
      const offset = (page - 1) * limit;

      const { count, rows: doctors } = await DoctorProfile.findAndCountAll({
        where: {
          [Op.or]: [
            { profileStatus: 'pending_review' },
            { profileStatus: 'incomplete', isVerified: false }
          ]
        },
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'phone', 'createdAt']
        }],
        order: [['createdAt', 'ASC']], // Primero los más antiguos
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

      res.json({
        success: true,
        data: {
          doctors,
          pagination: {
            total: count,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(count / limit)
          }
        }
      });
    } catch (error) {
      console.error('Error en getPendingVerifications:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener verificaciones pendientes',
        error: error.message
      });
    }
  },

  // ============================================================
  // SOLICITAR VERIFICACIÓN (MÉDICO)
  // ============================================================
  requestVerification: async (req, res) => {
    try {
      const userId = req.user.id;
      const {
        licenseNumber,
        medicalSchool,
        graduationYear,
        specialtyId,
        verificationDocuments // Array de URLs de documentos subidos
      } = req.body;

      const doctorProfile = await DoctorProfile.findOne({ where: { userId } });

      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de médico no encontrado'
        });
      }

      // Validar campos mínimos requeridos para verificación
      const requiredFields = {
        licenseNumber: licenseNumber || doctorProfile.licenseNumber,
        medicalSchool: medicalSchool || doctorProfile.medicalSchool,
        graduationYear: graduationYear || doctorProfile.graduationYear,
        firstName: doctorProfile.firstName,
        lastName: doctorProfile.lastName
      };

      const missingFields = Object.entries(requiredFields)
        .filter(([key, value]) => !value)
        .map(([key]) => key);

      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos obligatorios para solicitar verificación',
          missingFields,
          requirements: {
            licenseNumber: 'Número de matrícula MPPS/Colegio de Médicos',
            medicalSchool: 'Universidad de egreso',
            graduationYear: 'Año de graduación',
            firstName: 'Nombre',
            lastName: 'Apellido'
          }
        });
      }

      // Documentos requeridos para verificación legal en Venezuela
      const requiredDocuments = [
        'titulo_universitario',      // Título de médico
        'matricula_mpps',            // Matrícula MPPS
        'colegio_medicos',           // Inscripción Colegio de Médicos
        'cedula_identidad',          // Cédula de identidad
        'rif'                        // RIF (opcional para facturación)
      ];

      // Actualizar perfil con datos de verificación
      await doctorProfile.update({
        licenseNumber: licenseNumber || doctorProfile.licenseNumber,
        medicalSchool: medicalSchool || doctorProfile.medicalSchool,
        graduationYear: graduationYear || doctorProfile.graduationYear,
        specialtyId: specialtyId || doctorProfile.specialtyId,
        verificationDocuments: verificationDocuments || doctorProfile.verificationDocuments,
        profileStatus: 'pending_review'
      });

      res.json({
        success: true,
        message: 'Solicitud de verificación enviada correctamente',
        data: {
          profileStatus: 'pending_review',
          submittedAt: new Date().toISOString(),
          estimatedReviewTime: '24-48 horas hábiles',
          requiredDocuments,
          documentsProvided: verificationDocuments?.length || 0
        }
      });
    } catch (error) {
      console.error('Error en requestVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al solicitar verificación',
        error: error.message
      });
    }
  },

  // ============================================================
  // APROBAR VERIFICACIÓN (ADMIN)
  // ============================================================
  approveVerification: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { doctorProfileId } = req.params;
      const {
        notes,
        verifiedLicenseNumber,  // Número verificado contra MPPS
        verifiedSpecialtyId
      } = req.body;

      const adminId = req.user.id;

      const doctorProfile = await DoctorProfile.findByPk(doctorProfileId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      if (!doctorProfile) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Perfil de médico no encontrado'
        });
      }

      // Registrar verificación
      const verificationData = {
        isVerified: true,
        verificationDate: new Date(),
        profileStatus: 'active',
        licenseNumber: verifiedLicenseNumber || doctorProfile.licenseNumber,
        specialtyId: verifiedSpecialtyId || doctorProfile.specialtyId
      };

      await doctorProfile.update(verificationData, { transaction });

      // Crear registro de auditoría (para cumplimiento legal)
      const auditLog = {
        action: 'DOCTOR_VERIFICATION_APPROVED',
        doctorProfileId: doctorProfile.id,
        doctorUserId: doctorProfile.userId,
        adminUserId: adminId,
        timestamp: new Date(),
        details: {
          licenseNumber: verificationData.licenseNumber,
          notes,
          previousStatus: doctorProfile.profileStatus
        }
      };

      console.log('AUDIT LOG:', JSON.stringify(auditLog, null, 2));

      await transaction.commit();

      res.json({
        success: true,
        message: 'Médico verificado exitosamente',
        data: {
          doctorProfileId: doctorProfile.id,
          doctorName: `${doctorProfile.firstName} ${doctorProfile.lastName}`,
          email: doctorProfile.user?.email,
          licenseNumber: verificationData.licenseNumber,
          verificationDate: verificationData.verificationDate,
          profileStatus: 'active',
          isVerified: true
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error en approveVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al aprobar verificación',
        error: error.message
      });
    }
  },

  // ============================================================
  // RECHAZAR VERIFICACIÓN (ADMIN)
  // ============================================================
  rejectVerification: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { doctorProfileId } = req.params;
      const {
        reason,           // Razón del rechazo
        rejectionType,    // 'documents_invalid', 'license_not_found', 'incomplete_info', 'other'
        canResubmit       // Si puede volver a intentar
      } = req.body;

      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar una razón para el rechazo'
        });
      }

      const doctorProfile = await DoctorProfile.findByPk(doctorProfileId, {
        include: [{
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'name']
        }]
      });

      if (!doctorProfile) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Perfil de médico no encontrado'
        });
      }

      const newStatus = canResubmit !== false ? 'incomplete' : 'suspended';

      await doctorProfile.update({
        isVerified: false,
        profileStatus: newStatus,
        verificationDate: null
      }, { transaction });

      // Registro de auditoría
      const auditLog = {
        action: 'DOCTOR_VERIFICATION_REJECTED',
        doctorProfileId: doctorProfile.id,
        doctorUserId: doctorProfile.userId,
        adminUserId: adminId,
        timestamp: new Date(),
        details: {
          reason,
          rejectionType,
          canResubmit: canResubmit !== false,
          previousStatus: doctorProfile.profileStatus
        }
      };

      console.log('AUDIT LOG:', JSON.stringify(auditLog, null, 2));

      await transaction.commit();

      res.json({
        success: true,
        message: 'Verificación rechazada',
        data: {
          doctorProfileId: doctorProfile.id,
          reason,
          rejectionType,
          canResubmit: canResubmit !== false,
          newStatus
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error en rejectVerification:', error);
      res.status(500).json({
        success: false,
        message: 'Error al rechazar verificación',
        error: error.message
      });
    }
  },

  // ============================================================
  // SUSPENDER MÉDICO (ADMIN)
  // ============================================================
  suspendDoctor: async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
      const { doctorProfileId } = req.params;
      const { reason, suspensionType } = req.body;
      // suspensionType: 'temporary', 'permanent', 'investigation'

      const adminId = req.user.id;

      if (!reason) {
        return res.status(400).json({
          success: false,
          message: 'Debe proporcionar una razón para la suspensión'
        });
      }

      const doctorProfile = await DoctorProfile.findByPk(doctorProfileId);

      if (!doctorProfile) {
        await transaction.rollback();
        return res.status(404).json({
          success: false,
          message: 'Perfil de médico no encontrado'
        });
      }

      await doctorProfile.update({
        profileStatus: 'suspended',
        acceptingNewPatients: false
      }, { transaction });

      // También desactivar el usuario
      await User.update(
        { isActive: false },
        { where: { id: doctorProfile.userId }, transaction }
      );

      const auditLog = {
        action: 'DOCTOR_SUSPENDED',
        doctorProfileId: doctorProfile.id,
        adminUserId: adminId,
        timestamp: new Date(),
        details: { reason, suspensionType }
      };

      console.log('AUDIT LOG:', JSON.stringify(auditLog, null, 2));

      await transaction.commit();

      res.json({
        success: true,
        message: 'Médico suspendido',
        data: {
          doctorProfileId: doctorProfile.id,
          reason,
          suspensionType,
          profileStatus: 'suspended'
        }
      });
    } catch (error) {
      await transaction.rollback();
      console.error('Error en suspendDoctor:', error);
      res.status(500).json({
        success: false,
        message: 'Error al suspender médico',
        error: error.message
      });
    }
  },

  // ============================================================
  // OBTENER ESTADO DE VERIFICACIÓN (MÉDICO)
  // ============================================================
  getVerificationStatus: async (req, res) => {
    try {
      const userId = req.user.id;

      const doctorProfile = await DoctorProfile.findOne({
        where: { userId },
        attributes: [
          'id', 'isVerified', 'verificationDate', 'profileStatus',
          'licenseNumber', 'verificationDocuments', 'profileCompleteness'
        ]
      });

      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          message: 'Perfil de médico no encontrado'
        });
      }

      const statusMessages = {
        'incomplete': 'Tu perfil está incompleto. Completa la información requerida para solicitar verificación.',
        'pending_review': 'Tu solicitud está siendo revisada. Tiempo estimado: 24-48 horas hábiles.',
        'active': 'Tu perfil está verificado y activo.',
        'suspended': 'Tu cuenta ha sido suspendida. Contacta a soporte para más información.',
        'inactive': 'Tu perfil está inactivo.'
      };

      res.json({
        success: true,
        data: {
          isVerified: doctorProfile.isVerified,
          profileStatus: doctorProfile.profileStatus,
          statusMessage: statusMessages[doctorProfile.profileStatus],
          verificationDate: doctorProfile.verificationDate,
          licenseNumber: doctorProfile.licenseNumber,
          documentsUploaded: doctorProfile.verificationDocuments?.length || 0,
          profileCompleteness: doctorProfile.profileCompleteness,
          requiredDocuments: [
            { id: 'titulo_universitario', name: 'Título Universitario', required: true },
            { id: 'matricula_mpps', name: 'Matrícula MPPS', required: true },
            { id: 'colegio_medicos', name: 'Inscripción Colegio de Médicos', required: true },
            { id: 'cedula_identidad', name: 'Cédula de Identidad', required: true },
            { id: 'rif', name: 'RIF', required: false },
            { id: 'especialidad', name: 'Certificado de Especialidad', required: false }
          ]
        }
      });
    } catch (error) {
      console.error('Error en getVerificationStatus:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estado de verificación',
        error: error.message
      });
    }
  },

  // ============================================================
  // ESTADÍSTICAS DE VERIFICACIÓN (ADMIN)
  // ============================================================
  getVerificationStats: async (req, res) => {
    try {
      const stats = await DoctorProfile.findAll({
        attributes: [
          'profileStatus',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['profileStatus']
      });

      const verifiedCount = await DoctorProfile.count({ where: { isVerified: true } });
      const pendingCount = await DoctorProfile.count({ where: { profileStatus: 'pending_review' } });
      const totalDoctors = await DoctorProfile.count();

      res.json({
        success: true,
        data: {
          total: totalDoctors,
          verified: verifiedCount,
          pendingReview: pendingCount,
          verificationRate: totalDoctors > 0 ? ((verifiedCount / totalDoctors) * 100).toFixed(1) : 0,
          byStatus: stats.reduce((acc, item) => {
            acc[item.profileStatus] = parseInt(item.dataValues.count);
            return acc;
          }, {})
        }
      });
    } catch (error) {
      console.error('Error en getVerificationStats:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas',
        error: error.message
      });
    }
  }
};

module.exports = verificationController;

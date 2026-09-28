/**
 * adminService.js - CITAMED.VE
 * M01 / Semana 7 - Lógica de negocio para el panel de Superadministración
 */

const { Op, QueryTypes } = require('sequelize');
const {
  User,
  DoctorProfile,
  PatientProfile,
  Specialty,
  Appointment,
  Prescription,
  MedicalDocument,
  AiUsage,
  sequelize
} = require('../models');
const crypto = require('crypto');
const { getCaracasParts, todayCaracas } = require('../utils/dateCaracas');
const searchService = require('./searchService');
const auditService = require('./auditService');
const platformSettingsService = require('./platformSettingsService');
const secretCrypto = require('../utils/secretCrypto');

class AdminService {
  /**
   * Obtiene métricas y resumen general de la plataforma
   * Horas y fechas calculadas en zona horaria de Caracas (America/Caracas)
   */
  async getOverview() {
    const parts = getCaracasParts();
    const todayDateStr = todayCaracas();
    const startOfMonthStr = `${parts.year}-${parts.month}-01`;
    const startOfMonthDate = new Date(`${parts.year}-${parts.month}-01T00:00:00-04:00`);
    // Primer día del mes siguiente: "este mes" no debe contar citas agendadas para meses futuros
    const nextMonthNum = Number(parts.month) === 12 ? 1 : Number(parts.month) + 1;
    const nextMonthYear = Number(parts.month) === 12 ? Number(parts.year) + 1 : Number(parts.year);
    const startOfNextMonthStr = `${nextMonthYear}-${String(nextMonthNum).padStart(2, '0')}-01`;

    // 1. Usuarios por rol
    const userRoleCounts = await User.findAll({
      attributes: ['role', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['role'],
      raw: true
    });

    let totalUsers = 0;
    const roleMap = { patient: 0, doctor: 0, admin: 0, provider: 0 };
    userRoleCounts.forEach(r => {
      const count = parseInt(r.count, 10);
      totalUsers += count;
      if (roleMap[r.role] !== undefined) {
        roleMap[r.role] = count;
      }
    });

    const [activeUsers, suspendedUsers] = await Promise.all([
      User.count({ where: { isActive: true } }),
      User.count({ where: { isActive: false } })
    ]);

    const users = {
      total: totalUsers,
      active: activeUsers,
      suspended: suspendedUsers,
      patients: roleMap.patient,
      doctors: roleMap.doctor,
      admins: roleMap.admin,
      providers: roleMap.provider
    };

    // 2. Médicos (activos, suspendidos, en directorio, verificación)
    const [activeDoctors, suspendedDoctors, directoryResult, verificationCounts] = await Promise.all([
      User.count({ where: { role: 'doctor', isActive: true } }),
      User.count({ where: { role: 'doctor', isActive: false } }),
      sequelize.query('SELECT COUNT(*)::int AS count FROM doctor_search_cache', { type: QueryTypes.SELECT }),
      DoctorProfile.findAll({
        attributes: ['verificationStatus', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['verificationStatus'],
        raw: true
      })
    ]);

    const verification = {
      unverified: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      documents_incomplete: 0
    };
    verificationCounts.forEach(r => {
      if (verification[r.verificationStatus] !== undefined) {
        verification[r.verificationStatus] = parseInt(r.count, 10);
      }
    });

    const doctors = {
      active: activeDoctors,
      suspended: suspendedDoctors,
      inDirectory: directoryResult[0]?.count || 0,
      verification
    };

    // 3. Citas de hoy y del mes
    const [appointmentsToday, appointmentsMonth, completedConsultationsMonth] = await Promise.all([
      Appointment.count({ where: { appointmentDate: todayDateStr } }),
      Appointment.count({ where: { appointmentDate: { [Op.gte]: startOfMonthStr, [Op.lt]: startOfNextMonthStr } } }),
      Appointment.count({
        where: {
          status: 'completed',
          appointmentDate: { [Op.gte]: startOfMonthStr, [Op.lt]: startOfNextMonthStr }
        }
      })
    ]);

    const appointments = {
      today: appointmentsToday,
      thisMonth: appointmentsMonth
    };

    const consultations = {
      completedThisMonth: completedConsultationsMonth
    };

    // 4. Documentos emitidos del mes (récipes + medical_documents sin adjuntos)
    const [recipesMonth, medicalDocsMonth] = await Promise.all([
      Prescription.count({
        where: {
          createdAt: { [Op.gte]: startOfMonthDate }
        }
      }),
      MedicalDocument.count({
        where: {
          type: { [Op.ne]: 'attachment' },
          createdAt: { [Op.gte]: startOfMonthDate }
        }
      })
    ]);

    const documents = {
      thisMonth: recipesMonth + medicalDocsMonth
    };

    // 5. Métricas de IA del mes
    const aiUsageRows = await AiUsage.findAll({
      where: {
        created_at: { [Op.gte]: startOfMonthDate }
      },
      attributes: ['provider', 'success', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
      group: ['provider', 'success'],
      raw: true
    });

    let aiTotal = 0;
    let aiSuccess = 0;
    let aiFailed = 0;
    const byProvider = {};

    aiUsageRows.forEach(r => {
      const cnt = parseInt(r.count, 10);
      aiTotal += cnt;
      if (r.success) {
        aiSuccess += cnt;
      } else {
        aiFailed += cnt;
      }
      const p = r.provider || 'otros';
      byProvider[p] = (byProvider[p] || 0) + cnt;
    });

    // Top 5 médicos con más usos exitosos de IA en el mes
    const topDoctorRows = await AiUsage.findAll({
      where: {
        success: true,
        created_at: { [Op.gte]: startOfMonthDate }
      },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['user_id'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5,
      raw: true
    });

    let topDoctors = [];
    if (topDoctorRows.length > 0) {
      const docUserIds = topDoctorRows.map(r => r.userId);
      const docUsers = await User.findAll({
        where: { id: { [Op.in]: docUserIds } },
        attributes: ['id', 'firstName', 'lastName']
      });
      const docUserMap = {};
      docUsers.forEach(u => {
        docUserMap[u.id] = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      });
      topDoctors = topDoctorRows.map(r => ({
        doctorId: r.userId,
        name: docUserMap[r.userId] || `Médico #${r.userId}`,
        count: parseInt(r.count, 10)
      }));
    }

    const ai = {
      thisMonth: {
        total: aiTotal,
        success: aiSuccess,
        failed: aiFailed,
        byProvider
      },
      topDoctors
    };

    return {
      users,
      doctors,
      appointments,
      consultations,
      documents,
      ai
    };
  }

  /**
   * Lista usuarios con búsqueda, filtros y paginación
   */
  async getUsers({ search = '', role = '', status = '', page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const where = {};
    if (role) {
      // Un rol fuera del ENUM haría fallar la consulta con un 500
      if (!['patient', 'doctor', 'admin', 'provider'].includes(role)) {
        const err = new Error('Rol no válido');
        err.status = 400;
        throw err;
      }
      where.role = role;
    }
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'suspended') {
      where.isActive = false;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      where[Op.or] = [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { '$patientProfile.identificationNumber$': { [Op.iLike]: term } }
      ];
    }

    const { count: total, rows: userRows } = await User.findAndCountAll({
      where,
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'role',
        'isActive', 'suspendedAt', 'lastLogin', 'createdAt'
      ],
      include: [
        {
          model: PatientProfile,
          as: 'patientProfile',
          attributes: ['identificationNumber'],
          required: false
        }
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    const users = userRows.map(u => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      email: u.email,
      role: u.role,
      isActive: u.isActive,
      suspendedAt: u.suspendedAt,
      lastLogin: u.lastLogin,
      createdAt: u.createdAt
    }));

    return {
      users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Obtiene detalle de un usuario específico por ID
   */
  async getUserById(id) {
    const user = await User.findByPk(id, {
      attributes: [
        'id', 'firstName', 'lastName', 'email', 'role', 'phone', 'gender',
        'isActive', 'suspendedAt', 'suspensionReason', 'lastLogin', 'createdAt'
      ]
    });

    if (!user) {
      return null;
    }

    const patientProfile = await PatientProfile.findOne({
      where: { userId: user.id },
      attributes: ['identificationNumber']
    });

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
      phone: user.phone || null,
      gender: user.gender || null,
      identificationNumber: patientProfile?.identificationNumber || null,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    if (user.role === 'doctor') {
      const docProfile = await DoctorProfile.findOne({
        where: { userId: user.id },
        include: [
          {
            model: Specialty,
            as: 'specialty',
            attributes: ['name'],
            required: false
          }
        ]
      });

      const directoryRows = await sequelize.query(
        'SELECT 1 FROM doctor_search_cache WHERE doctor_id = :doctorId LIMIT 1',
        { replacements: { doctorId: user.id }, type: QueryTypes.SELECT }
      );

      const [totalAppointments, completedConsultations, lastAppointment] = await Promise.all([
        Appointment.count({ where: { doctorId: user.id } }),
        Appointment.count({ where: { doctorId: user.id, status: 'completed' } }),
        Appointment.findOne({
          where: { doctorId: user.id, status: 'completed' },
          order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
          attributes: ['appointmentDate', 'appointmentTime']
        })
      ]);

      userData.DoctorProfile = {
        mppsNumber: docProfile?.mppsNumber || null,
        colegioMedicoNumber: docProfile?.colegioMedicoNumber || null,
        verificationStatus: docProfile?.verificationStatus || 'unverified',
        specialty: docProfile?.specialty?.name || null,
        isDirectoryListed: directoryRows.length > 0,
        city: docProfile?.city || null,
        totalAppointments,
        completedConsultations,
        lastConsultationAt: lastAppointment
          ? `${lastAppointment.appointmentDate} ${lastAppointment.appointmentTime || ''}`.trim()
          : null
      };
      userData.doctor = userData.DoctorProfile;
    }

    return userData;
  }

  /**
   * Suspende o reactiva un usuario
   */
  async updateUserStatus(id, { isActive, reason }, adminUser) {
    const targetUserId = parseInt(id, 10);

    // 403: No suspenderse a sí mismo
    if (targetUserId === adminUser.id) {
      const err = new Error('No puedes modificar el estado de tu propia cuenta');
      err.status = 403;
      throw err;
    }

    const user = await User.findByPk(targetUserId);
    if (!user) {
      const err = new Error('Usuario no encontrado');
      err.status = 404;
      throw err;
    }

    // 403: No suspender a otro admin
    if (user.role === 'admin') {
      const err = new Error('No se puede suspender ni modificar el estado de un administrador');
      err.status = 403;
      throw err;
    }

    if (isActive === false) {
      if (!reason || typeof reason !== 'string' || !reason.trim() || reason.trim().length > 500) {
        const err = new Error('El motivo de suspensión es obligatorio (1 a 500 caracteres)');
        err.status = 400;
        throw err;
      }
      user.isActive = false;
      user.suspendedAt = new Date();
      user.suspensionReason = reason.trim();
    } else {
      user.isActive = true;
      user.suspendedAt = null;
      user.suspensionReason = null;
    }

    await user.save();

    // Si es médico, actualizar search cache
    if (user.role === 'doctor') {
      try {
        await searchService.updateDoctorSearchCache(user.id);
      } catch (cacheErr) {
        console.error(`[AdminService] Error actualizando cache de búsqueda para médico #${user.id}:`, cacheErr);
      }
    }

    // Registrar en auditoría
    try {
      await auditService.log({
        userId: adminUser.id,
        action: isActive ? 'admin.user_reactivated' : 'admin.user_suspended',
        resource: 'user',
        resourceId: user.id.toString(),
        entityType: 'user',
        entityId: user.id,
        details: { reason: reason ? reason.trim() : null },
        metadata: { reason: reason ? reason.trim() : null }
      });
    } catch (auditErr) {
      console.error('[AdminService] Error en auditService.log:', auditErr);
    }

    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason
    };
  }

  /**
   * Lista médicos con datos clínicos, verificación y presencia en el directorio
   */
  async getDoctors({ search = '', verification = '', status = '', page = 1, limit = 20 }) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const userWhere = { role: 'doctor' };
    if (status === 'active') {
      userWhere.isActive = true;
    } else if (status === 'suspended') {
      userWhere.isActive = false;
    }

    const profileWhere = {};
    if (verification) {
      // Un valor fuera del ENUM haría fallar la consulta con un 500
      if (!['unverified', 'pending', 'approved', 'rejected', 'documents_incomplete'].includes(verification)) {
        const err = new Error('Estado de verificación no válido');
        err.status = 400;
        throw err;
      }
      profileWhere.verificationStatus = verification;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { '$doctorProfile.specialty.name$': { [Op.iLike]: term } },
        { '$doctorProfile.city$': { [Op.iLike]: term } }
      ];
    }

    const { count: total, rows: doctorUsers } = await User.findAndCountAll({
      where: userWhere,
      attributes: ['id', 'firstName', 'lastName', 'email', 'isActive'],
      include: [
        {
          model: DoctorProfile,
          as: 'doctorProfile',
          where: Object.keys(profileWhere).length > 0 ? profileWhere : undefined,
          required: true,
          attributes: ['id', 'city', 'verificationStatus', 'mppsNumber', 'licenseNumber'],
          include: [
            {
              model: Specialty,
              as: 'specialty',
              attributes: ['name'],
              required: false
            }
          ]
        }
      ],
      order: [['id', 'DESC']],
      limit: limitNum,
      offset,
      distinct: true
    });

    const doctorIds = doctorUsers.map(d => d.id);
    let directorySet = new Set();
    const appointmentsMap = {};
    const lastConsultationMap = {};

    if (doctorIds.length > 0) {
      const dirRows = await sequelize.query(
        'SELECT doctor_id FROM doctor_search_cache WHERE doctor_id IN (:doctorIds)',
        { replacements: { doctorIds }, type: QueryTypes.SELECT }
      );
      directorySet = new Set(dirRows.map(r => r.doctor_id));

      const appCounts = await Appointment.findAll({
        where: { doctorId: { [Op.in]: doctorIds } },
        attributes: ['doctorId', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
        group: ['doctorId'],
        raw: true
      });
      appCounts.forEach(r => {
        appointmentsMap[r.doctorId] = parseInt(r.count, 10);
      });

      const lastAppointments = await Appointment.findAll({
        where: {
          doctorId: { [Op.in]: doctorIds },
          status: 'completed'
        },
        attributes: ['doctorId', 'appointmentDate', 'appointmentTime'],
        order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
      });
      lastAppointments.forEach(r => {
        if (!lastConsultationMap[r.doctorId]) {
          lastConsultationMap[r.doctorId] = `${r.appointmentDate} ${r.appointmentTime || ''}`.trim();
        }
      });
    }

    const doctors = doctorUsers.map(doc => {
      const fullName = [doc.firstName, doc.lastName].filter(Boolean).join(' ') || 'Sin nombre';
      return {
        id: doc.id,
        name: fullName,
        firstName: doc.firstName,
        lastName: doc.lastName,
        email: doc.email,
        specialty: doc.doctorProfile?.specialty?.name || null,
        specialties: doc.doctorProfile?.specialty?.name ? [doc.doctorProfile.specialty.name] : [],
        mppsNumber: doc.doctorProfile?.mppsNumber || null,
        licenseNumber: doc.doctorProfile?.licenseNumber || null,
        colegioMedicoNumber: doc.doctorProfile?.licenseNumber || null,
        city: doc.doctorProfile?.city || null,
        verificationStatus: doc.doctorProfile?.verificationStatus || 'unverified',
        isActive: doc.isActive,
        inDirectory: directorySet.has(doc.id),
        totalAppointments: appointmentsMap[doc.id] || 0,
        lastConsultationAt: lastConsultationMap[doc.id] ? lastConsultationMap[doc.id].trim() : null
      };
    });

    return {
      doctors,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  /**
   * Obtiene la configuración de IA sin exponer llaves secretas
   */
  async getAiConfig() {
    const [providersSetting, transcriptionSetting, limitsSetting] = await Promise.all([
      platformSettingsService.get('ai_providers', { chain: [] }),
      platformSettingsService.get('ai_transcription', { chain: [] }),
      platformSettingsService.get('ai_limits', {
        enabled: true,
        monthlyActionsPerDoctor: 200,
        perMinutePerUser: 10
      })
    ]);

    const mapItem = (item) => {
      const hasKey = !!item.apiKeyEnc || !!item.apiKey;
      let keyPreview = null;
      if (item.apiKeyEnc) {
        try {
          const dec = secretCrypto.decrypt(item.apiKeyEnc);
          keyPreview = secretCrypto.maskKey(dec);
        } catch (_) {
          keyPreview = '••••';
        }
      } else if (item.apiKey) {
        keyPreview = secretCrypto.maskKey(item.apiKey);
      }
      return {
        id: item.id,
        provider: item.provider,
        model: item.model,
        enabled: item.enabled !== false,
        hasKey,
        keyPreview
      };
    };

    const providersList = (Array.isArray(providersSetting?.chain) ? providersSetting.chain : []).map(mapItem);
    const transcriptionList = (Array.isArray(transcriptionSetting?.chain) ? transcriptionSetting.chain : []).map(mapItem);

    const env = {
      gemini: !!process.env.GEMINI_API_KEY,
      groq: !!process.env.GROQ_API_KEY,
      openai: !!process.env.OPENAI_API_KEY,
      anthropic: !!process.env.ANTHROPIC_API_KEY
    };

    return {
      providers: providersList,
      transcription: transcriptionList,
      limits: {
        enabled: limitsSetting?.enabled !== false,
        monthlyActionsPerDoctor: typeof limitsSetting?.monthlyActionsPerDoctor === 'number'
          ? limitsSetting.monthlyActionsPerDoctor
          : 200,
        perMinutePerUser: typeof limitsSetting?.perMinutePerUser === 'number'
          ? limitsSetting.perMinutePerUser
          : 10
      },
      env
    };
  }

  /**
   * Actualiza la configuración de IA cifrando llaves nuevas y auditando
   */
  async updateAiConfig({ providers: rawProviders, transcription: rawTranscription, limits: rawLimits } = {}, adminUser) {
    const [existingProviders, existingTranscription] = await Promise.all([
      platformSettingsService.get('ai_providers', { chain: [] }),
      platformSettingsService.get('ai_transcription', { chain: [] })
    ]);

    const existingProvidersMap = new Map();
    (existingProviders?.chain || []).forEach(it => { if (it.id) existingProvidersMap.set(it.id, it); });

    const existingTransMap = new Map();
    (existingTranscription?.chain || []).forEach(it => { if (it.id) existingTransMap.set(it.id, it); });

    const ALLOWED_TEXT_PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'mock'];
    const ALLOWED_TRANS_PROVIDERS = ['groq', 'openai', 'mock'];

    const cleanProviders = [];
    if (Array.isArray(rawProviders)) {
      for (const item of rawProviders) {
        if (!ALLOWED_TEXT_PROVIDERS.includes(item.provider)) {
          const err = new Error(`Proveedor de texto no válido: ${item.provider}`);
          err.status = 400;
          throw err;
        }
        if (!item.model || typeof item.model !== 'string' || item.model.trim().length < 1 || item.model.trim().length > 100) {
          const err = new Error('El modelo debe ser una cadena de texto entre 1 y 100 caracteres');
          err.status = 400;
          throw err;
        }

        const id = item.id || crypto.randomUUID();
        const existing = existingProvidersMap.get(id);

        let apiKeyEnc = null;
        if (typeof item.apiKey === 'string' && item.apiKey.trim().length > 0) {
          apiKeyEnc = secretCrypto.encrypt(item.apiKey.trim());
        } else if (existing && existing.apiKeyEnc) {
          apiKeyEnc = existing.apiKeyEnc;
        } else if (item.provider === 'mock') {
          apiKeyEnc = null;
        } else {
          const err = new Error(`Item de proveedor '${item.provider}' sin llave configurada`);
          err.status = 400;
          throw err;
        }

        cleanProviders.push({
          id,
          provider: item.provider,
          model: item.model.trim(),
          enabled: item.enabled !== false,
          ...(apiKeyEnc ? { apiKeyEnc } : {})
        });
      }
    }

    const cleanTranscription = [];
    if (Array.isArray(rawTranscription)) {
      for (const item of rawTranscription) {
        if (!ALLOWED_TRANS_PROVIDERS.includes(item.provider)) {
          const err = new Error(`Proveedor de transcripción no válido: ${item.provider}`);
          err.status = 400;
          throw err;
        }
        if (!item.model || typeof item.model !== 'string' || item.model.trim().length < 1 || item.model.trim().length > 100) {
          const err = new Error('El modelo de transcripción debe ser una cadena de texto entre 1 y 100 caracteres');
          err.status = 400;
          throw err;
        }

        const id = item.id || crypto.randomUUID();
        const existing = existingTransMap.get(id);

        let apiKeyEnc = null;
        if (typeof item.apiKey === 'string' && item.apiKey.trim().length > 0) {
          apiKeyEnc = secretCrypto.encrypt(item.apiKey.trim());
        } else if (existing && existing.apiKeyEnc) {
          apiKeyEnc = existing.apiKeyEnc;
        } else if (item.provider === 'mock') {
          apiKeyEnc = null;
        } else {
          const err = new Error(`Item de transcripción '${item.provider}' sin llave configurada`);
          err.status = 400;
          throw err;
        }

        cleanTranscription.push({
          id,
          provider: item.provider,
          model: item.model.trim(),
          enabled: item.enabled !== false,
          ...(apiKeyEnc ? { apiKeyEnc } : {})
        });
      }
    }

    let cleanLimits = { enabled: true, monthlyActionsPerDoctor: 200, perMinutePerUser: 10 };
    if (rawLimits && typeof rawLimits === 'object') {
      if (typeof rawLimits.enabled === 'boolean') {
        cleanLimits.enabled = rawLimits.enabled;
      }
      if (rawLimits.monthlyActionsPerDoctor !== undefined) {
        const num = parseInt(rawLimits.monthlyActionsPerDoctor, 10);
        if (isNaN(num) || num < 0 || num > 100000) {
          const err = new Error('monthlyActionsPerDoctor debe ser un entero entre 0 y 100.000');
          err.status = 400;
          throw err;
        }
        cleanLimits.monthlyActionsPerDoctor = num;
      }
      if (rawLimits.perMinutePerUser !== undefined) {
        const num = parseInt(rawLimits.perMinutePerUser, 10);
        if (isNaN(num) || num < 1 || num > 60) {
          const err = new Error('perMinutePerUser debe ser un entero entre 1 y 60');
          err.status = 400;
          throw err;
        }
        cleanLimits.perMinutePerUser = num;
      }
    }

    if (Array.isArray(rawProviders)) {
      await platformSettingsService.set('ai_providers', { chain: cleanProviders }, adminUser?.id || null);
    }
    if (Array.isArray(rawTranscription)) {
      await platformSettingsService.set('ai_transcription', { chain: cleanTranscription }, adminUser?.id || null);
    }
    if (rawLimits) {
      await platformSettingsService.set('ai_limits', cleanLimits, adminUser?.id || null);
    }

    await auditService.log({
      userId: adminUser?.id || null,
      action: 'admin.ai_config_updated',
      entityType: 'platform_settings',
      entityId: 'ai',
      details: {
        providersCount: cleanProviders.length,
        transcriptionCount: cleanTranscription.length,
        limits: cleanLimits
      }
    });

    return await this.getAiConfig();
  }

  /**
   * Prueba conexión con un proveedor de IA
   */
  async testAiConnection({ kind = 'text', provider, model, apiKey, entryId } = {}, adminUser) {
    if (!provider) {
      const err = new Error('Proveedor requerido');
      err.status = 400;
      throw err;
    }

    let effectiveKey = apiKey ? apiKey.trim() : null;
    if (!effectiveKey && entryId) {
      const settingKey = kind === 'transcription' ? 'ai_transcription' : 'ai_providers';
      const setting = await platformSettingsService.get(settingKey, { chain: [] });
      const found = (setting?.chain || []).find(it => it.id === entryId);
      if (found && found.apiKeyEnc) {
        try {
          effectiveKey = secretCrypto.decrypt(found.apiKeyEnc);
        } catch (_) {}
      }
    }

    if (!effectiveKey && provider !== 'mock') {
      const envKeyMap = {
        gemini: process.env.GEMINI_API_KEY,
        groq: process.env.GROQ_API_KEY,
        openai: process.env.OPENAI_API_KEY,
        anthropic: process.env.ANTHROPIC_API_KEY
      };
      effectiveKey = envKeyMap[provider] || null;
    }

    if (!effectiveKey && provider !== 'mock') {
      const err = new Error('No se especificó ni encontró llave de API para la prueba');
      err.status = 400;
      throw err;
    }

    const start = Date.now();
    let ok = false;
    let message = '';
    let latencyMs = 0;
    let errorCode = null;

    try {
      if (provider === 'mock') {
        if (model === 'fail') {
          const err = new Error('Fallo simulado mock (429)');
          err.status = 429;
          throw err;
        }
        ok = true;
        latencyMs = 5;
        message = 'Conexión exitosa (mock)';
      } else if (kind === 'transcription') {
        const url = provider === 'groq'
          ? 'https://api.groq.com/openai/v1/models'
          : 'https://api.openai.com/v1/models';

        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${effectiveKey}` }
        });
        latencyMs = Date.now() - start;
        if (res.ok) {
          ok = true;
          message = 'Conexión exitosa con el servicio de transcripción';
        } else {
          ok = false;
          message = `Proveedor respondió con estado ${res.status}`;
          errorCode = `HTTP_${res.status}`;
        }
      } else {
        const providers = require('./ai/providers');
        let testResp = '';
        const testModel = model || (provider === 'gemini' ? 'gemini-2.5-flash' : provider === 'groq' ? 'openai/gpt-oss-120b' : provider === 'openai' ? 'gpt-4o-mini' : 'claude-haiku-4-5-20251001');

        if (provider === 'gemini') {
          testResp = await providers.callGemini({ apiKey: effectiveKey, model: testModel, userText: 'Responde solo: OK' });
        } else if (provider === 'groq') {
          testResp = await providers.callGroq({ apiKey: effectiveKey, model: testModel, userText: 'Responde solo: OK' });
        } else if (provider === 'openai') {
          testResp = await providers.callOpenAI({ apiKey: effectiveKey, model: testModel, userText: 'Responde solo: OK' });
        } else if (provider === 'anthropic') {
          testResp = await providers.callAnthropic({ apiKey: effectiveKey, model: testModel, userText: 'Responde solo: OK' });
        }

        latencyMs = Date.now() - start;
        ok = !!testResp;
        message = ok ? 'Conexión exitosa con el proveedor de IA' : 'Respuesta vacía';
      }
    } catch (err) {
      latencyMs = Date.now() - start;
      ok = false;
      message = err.message || 'Error al conectar con el proveedor';
      errorCode = err.code || `HTTP_${err.status || 500}`;
    }

    try {
      await AiUsage.create({
        userId: adminUser?.id || 1,
        mode: 'test',
        provider,
        model: model || 'test',
        success: ok,
        latencyMs,
        errorCode
      });
    } catch (_) {}

    return {
      ok,
      latencyMs,
      message
    };
  }

  /**
   * Obtiene la lista de modelos soportados por proveedor
   */
  async getAiModels({ provider } = {}) {
    const fallbackModels = {
      gemini: ['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-1.5-flash', 'gemini-1.5-pro'],
      groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'whisper-large-v3-turbo'],
      openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo', 'whisper-1'],
      anthropic: ['claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
      mock: ['echo', 'fail']
    };

    const models = fallbackModels[provider] || [];
    return { provider, models };
  }

  /**
   * Estadísticas de uso de IA para los últimos N días
   */
  async getAiUsageStats({ days = 30 } = {}) {
    const daysNum = Math.min(Math.max(parseInt(days, 10) || 30, 1), 365);
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const [byDayRows, byProviderRows, byModeRows, topDoctorRows] = await Promise.all([
      AiUsage.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          [sequelize.literal("DATE(created_at AT TIME ZONE 'America/Caracas')"), 'dayDate'],
          'success',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: [sequelize.literal("DATE(created_at AT TIME ZONE 'America/Caracas')"), 'success'],
        order: [[sequelize.literal("DATE(created_at AT TIME ZONE 'America/Caracas')"), 'ASC']],
        raw: true
      }),
      AiUsage.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          'provider',
          'success',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['provider', 'success'],
        raw: true
      }),
      AiUsage.findAll({
        where: { created_at: { [Op.gte]: startDate } },
        attributes: [
          'mode',
          'success',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['mode', 'success'],
        raw: true
      }),
      AiUsage.findAll({
        where: {
          success: true,
          created_at: { [Op.gte]: startDate }
        },
        attributes: [
          'userId',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count']
        ],
        group: ['user_id'],
        order: [[sequelize.literal('count'), 'DESC']],
        limit: 5,
        raw: true
      })
    ]);

    const dayMap = {};
    byDayRows.forEach(r => {
      const d = r.dayDate;
      if (!dayMap[d]) dayMap[d] = { date: d, success: 0, failed: 0 };
      const cnt = parseInt(r.count, 10);
      if (r.success) dayMap[d].success += cnt;
      else dayMap[d].failed += cnt;
    });
    const byDay = Object.values(dayMap);

    const providerMap = {};
    byProviderRows.forEach(r => {
      const p = r.provider || 'desconocido';
      if (!providerMap[p]) providerMap[p] = { provider: p, success: 0, failed: 0 };
      const cnt = parseInt(r.count, 10);
      if (r.success) providerMap[p].success += cnt;
      else providerMap[p].failed += cnt;
    });
    const byProvider = Object.values(providerMap);

    const modeMap = {};
    byModeRows.forEach(r => {
      const m = r.mode || 'desconocido';
      if (!modeMap[m]) modeMap[m] = { mode: m, success: 0, failed: 0 };
      const cnt = parseInt(r.count, 10);
      if (r.success) modeMap[m].success += cnt;
      else modeMap[m].failed += cnt;
    });
    const byMode = Object.values(modeMap);

    let topDoctors = [];
    if (topDoctorRows.length > 0) {
      const userIds = topDoctorRows.map(r => r.userId);
      const users = await User.findAll({
        where: { id: { [Op.in]: userIds } },
        attributes: ['id', 'firstName', 'lastName']
      });
      const userMap = {};
      users.forEach(u => {
        userMap[u.id] = `${u.firstName || ''} ${u.lastName || ''}`.trim();
      });
      topDoctors = topDoctorRows.map(r => ({
        doctorId: r.userId,
        name: userMap[r.userId] || `Médico #${r.userId}`,
        count: parseInt(r.count, 10)
      }));
    }

    return {
      byDay,
      byProvider,
      byMode,
      topDoctors
    };
  }
}

module.exports = new AdminService();

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
const { getCaracasParts, todayCaracas } = require('../utils/dateCaracas');
const searchService = require('./searchService');
const auditService = require('./auditService');

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

    const users = {
      total: totalUsers,
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
        'id', 'firstName', 'lastName', 'email', 'role',
        'isActive', 'suspendedAt', 'suspensionReason', 'lastLogin', 'createdAt'
      ]
    });

    if (!user) {
      return null;
    }

    const userData = {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      suspendedAt: user.suspendedAt,
      suspensionReason: user.suspensionReason,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt
    };

    if (user.role === 'doctor') {
      const docProfile = await DoctorProfile.findOne({
        where: { userId: user.id },
        include: [
          {
            model: Specialty,
            as: 'primarySpecialty',
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

      userData.doctor = {
        verificationStatus: docProfile?.verificationStatus || 'unverified',
        specialty: docProfile?.primarySpecialty?.name || null,
        city: docProfile?.city || null,
        inDirectory: directoryRows.length > 0,
        totalAppointments,
        completedConsultations,
        lastConsultationAt: lastAppointment
          ? `${lastAppointment.appointmentDate} ${lastAppointment.appointmentTime || ''}`.trim()
          : null
      };
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
      profileWhere.verificationStatus = verification;
    }

    if (search && search.trim()) {
      const term = `%${search.trim()}%`;
      userWhere[Op.or] = [
        { firstName: { [Op.iLike]: term } },
        { lastName: { [Op.iLike]: term } },
        { email: { [Op.iLike]: term } },
        { '$doctorProfile.primarySpecialty.name$': { [Op.iLike]: term } },
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
          attributes: ['id', 'city', 'verificationStatus'],
          include: [
            {
              model: Specialty,
              as: 'primarySpecialty',
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
        attributes: [
          'doctorId',
          [sequelize.fn('MAX', sequelize.literal(`concat(appointment_date, ' ', COALESCE(appointment_time::text, ''))`)), 'lastConsultation']
        ],
        group: ['doctorId'],
        raw: true
      });
      lastAppointments.forEach(r => {
        lastConsultationMap[r.doctorId] = r.lastConsultation;
      });
    }

    const doctors = doctorUsers.map(doc => ({
      id: doc.id,
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
      specialty: doc.doctorProfile?.primarySpecialty?.name || null,
      city: doc.doctorProfile?.city || null,
      verificationStatus: doc.doctorProfile?.verificationStatus || 'unverified',
      isActive: doc.isActive,
      inDirectory: directorySet.has(doc.id),
      totalAppointments: appointmentsMap[doc.id] || 0,
      lastConsultationAt: lastConsultationMap[doc.id] ? lastConsultationMap[doc.id].trim() : null
    }));

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
}

module.exports = new AdminService();

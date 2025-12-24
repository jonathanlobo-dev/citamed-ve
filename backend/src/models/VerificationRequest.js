/**
 * VerificationRequest Model - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Solicitudes de verificación de médicos para seguimiento admin
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const VerificationRequest = sequelize.define('VerificationRequest', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id',
      references: {
        model: 'doctor_profiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    requestDate: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
      field: 'request_date',
      comment: 'Fecha de solicitud de verificación'
    },
    status: {
      type: DataTypes.ENUM('submitted', 'in_review', 'approved', 'rejected', 'on_hold'),
      allowNull: false,
      defaultValue: 'submitted',
      comment: 'Estado de la solicitud'
    },
    assignedTo: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'assigned_to',
      references: {
        model: 'users',
        key: 'id'
      },
      comment: 'Admin asignado para revisar'
    },
    priority: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Prioridad (mayor = más urgente)'
    },
    completedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'completed_at',
      comment: 'Fecha de finalización de la revisión'
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Notas de la revisión'
    }
  }, {
    tableName: 'verification_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['doctor_profile_id'] },
      { fields: ['status'] },
      { fields: ['assigned_to'] },
      { fields: ['priority'], order: 'DESC' }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INSTANCIA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifica si la solicitud está pendiente
   */
  VerificationRequest.prototype.isPending = function() {
    return ['submitted', 'in_review', 'on_hold'].includes(this.status);
  };

  /**
   * Verifica si la solicitud está completada
   */
  VerificationRequest.prototype.isCompleted = function() {
    return ['approved', 'rejected'].includes(this.status);
  };

  /**
   * Calcula tiempo de espera en días
   */
  VerificationRequest.prototype.getWaitingDays = function() {
    const start = new Date(this.requestDate);
    const end = this.completedAt ? new Date(this.completedAt) : new Date();
    return Math.floor((end - start) / (1000 * 60 * 60 * 24));
  };

  /**
   * Obtiene nombre legible del estado
   */
  VerificationRequest.prototype.getStatusName = function() {
    const names = {
      submitted: 'Enviada',
      in_review: 'En Revisión',
      approved: 'Aprobada',
      rejected: 'Rechazada',
      on_hold: 'En Espera'
    };
    return names[this.status] || this.status;
  };

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene la solicitud activa de un doctor
   */
  VerificationRequest.getActiveByDoctor = async function(doctorProfileId) {
    return await this.findOne({
      where: {
        doctorProfileId,
        status: { [Op.in]: ['submitted', 'in_review', 'on_hold'] }
      },
      order: [['requestDate', 'DESC']]
    });
  };

  /**
   * Obtiene todas las solicitudes de un doctor
   */
  VerificationRequest.getAllByDoctor = async function(doctorProfileId) {
    return await this.findAll({
      where: { doctorProfileId },
      order: [['requestDate', 'DESC']]
    });
  };

  /**
   * Obtiene la cola de solicitudes pendientes (para admins)
   */
  VerificationRequest.getPendingQueue = async function(options = {}) {
    const {
      limit = 50,
      offset = 0,
      assignedTo = null,
      status = null
    } = options;

    const where = {
      status: status || { [Op.in]: ['submitted', 'in_review', 'on_hold'] }
    };

    if (assignedTo) {
      where.assignedTo = assignedTo;
    }

    return await this.findAndCountAll({
      where,
      order: [
        ['priority', 'DESC'],
        ['requestDate', 'ASC']
      ],
      limit,
      offset,
      include: [
        {
          model: sequelize.models.DoctorProfile,
          as: 'doctorProfile',
          attributes: ['id', 'firstName', 'lastName', 'specialties', 'mppsNumber']
        }
      ]
    });
  };

  /**
   * Obtiene estadísticas de verificaciones (para dashboard admin)
   */
  VerificationRequest.getStats = async function() {
    const [results] = await sequelize.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'submitted') as pending,
        COUNT(*) FILTER (WHERE status = 'in_review') as in_review,
        COUNT(*) FILTER (WHERE status = 'approved') as approved,
        COUNT(*) FILTER (WHERE status = 'rejected') as rejected,
        COUNT(*) FILTER (WHERE status = 'on_hold') as on_hold,
        COUNT(*) as total,
        AVG(EXTRACT(EPOCH FROM (COALESCE(completed_at, NOW()) - request_date)) / 86400)
          FILTER (WHERE status IN ('approved', 'rejected')) as avg_completion_days
      FROM verification_requests
      WHERE created_at >= NOW() - INTERVAL '30 days'
    `);

    return results[0] || {
      pending: 0,
      in_review: 0,
      approved: 0,
      rejected: 0,
      on_hold: 0,
      total: 0,
      avg_completion_days: 0
    };
  };

  /**
   * Asigna solicitud a un admin
   */
  VerificationRequest.assignToAdmin = async function(requestId, adminId) {
    const request = await this.findByPk(requestId);
    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    request.assignedTo = adminId;
    if (request.status === 'submitted') {
      request.status = 'in_review';
    }
    await request.save();
    return request;
  };

  /**
   * Crea o retorna solicitud existente para un doctor
   */
  VerificationRequest.createOrGetActive = async function(doctorProfileId) {
    // Verificar si ya hay una solicitud activa
    const existing = await this.getActiveByDoctor(doctorProfileId);
    if (existing) {
      return { request: existing, isNew: false };
    }

    // Crear nueva solicitud
    const newRequest = await this.create({
      doctorProfileId,
      status: 'submitted',
      priority: 0
    });

    return { request: newRequest, isNew: true };
  };

  /**
   * Obtiene solicitudes sin asignar
   */
  VerificationRequest.getUnassigned = async function(limit = 20) {
    return await this.findAll({
      where: {
        assignedTo: null,
        status: 'submitted'
      },
      order: [
        ['priority', 'DESC'],
        ['requestDate', 'ASC']
      ],
      limit,
      include: [
        {
          model: sequelize.models.DoctorProfile,
          as: 'doctorProfile',
          attributes: ['id', 'firstName', 'lastName', 'specialties']
        }
      ]
    });
  };

  /**
   * Actualiza prioridad de una solicitud
   */
  VerificationRequest.updatePriority = async function(requestId, priority) {
    const request = await this.findByPk(requestId);
    if (!request) {
      throw new Error('Solicitud no encontrada');
    }

    request.priority = priority;
    await request.save();
    return request;
  };

  return VerificationRequest;
};

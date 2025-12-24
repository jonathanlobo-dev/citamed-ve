// src/models/AuditLog.js
// CITAMED.VE - M01 Sub-Partida 2.5.2 Audit Logs
// Modelo de logs de auditoría del sistema

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const AuditLog = sequelize.define('AuditLog', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Usuario que ejecutó la acción (null si es sistema)
    userId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'user_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },

    // Acción ejecutada (ej: 'user.deleted', 'auth.login.success')
    action: {
      type: DataTypes.STRING(100),
      allowNull: false
    },

    // Recurso afectado (ej: 'user', 'appointment', 'session')
    resource: {
      type: DataTypes.STRING(50),
      allowNull: true
    },

    // ID del recurso afectado
    resourceId: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'resource_id'
    },

    // Método HTTP
    method: {
      type: DataTypes.STRING(10),
      allowNull: true
    },

    // Endpoint del API
    endpoint: {
      type: DataTypes.STRING(255),
      allowNull: true
    },

    // Código de estado HTTP
    statusCode: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: 'status_code'
    },

    // Dirección IP del cliente
    ipAddress: {
      type: DataTypes.STRING(45),
      allowNull: true,
      field: 'ip_address'
    },

    // User Agent del navegador/cliente
    userAgent: {
      type: DataTypes.TEXT,
      allowNull: true,
      field: 'user_agent'
    },

    // Estado anterior del recurso (antes del cambio)
    changesBefore: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'changes_before'
    },

    // Estado nuevo del recurso (después del cambio)
    changesAfter: {
      type: DataTypes.JSONB,
      allowNull: true,
      field: 'changes_after'
    },

    // Metadata adicional contextual
    metadata: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: {}
    },

    // Severidad del evento
    severity: {
      type: DataTypes.ENUM('info', 'warning', 'error', 'critical'),
      allowNull: false,
      defaultValue: 'info'
    }
  }, {
    tableName: 'audit_logs',
    timestamps: true,
    updatedAt: false, // Logs son inmutables, no se actualizan
    underscored: true,
    indexes: [
      { fields: ['user_id'], name: 'idx_audit_logs_user_id' },
      { fields: ['action'], name: 'idx_audit_logs_action' },
      { fields: ['resource'], name: 'idx_audit_logs_resource' },
      { fields: ['created_at'], order: 'DESC', name: 'idx_audit_logs_created_at' },
      { fields: ['severity'], name: 'idx_audit_logs_severity' },
      { fields: ['resource', 'resource_id'], name: 'idx_audit_logs_resource_composite' },
      { fields: ['ip_address'], name: 'idx_audit_logs_ip' }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Crea un nuevo log de auditoría
   */
  AuditLog.createLog = async function(data) {
    return await this.create({
      userId: data.userId || null,
      action: data.action,
      resource: data.resource || null,
      resourceId: data.resourceId || null,
      method: data.method || null,
      endpoint: data.endpoint || null,
      statusCode: data.statusCode || null,
      ipAddress: data.ipAddress || null,
      userAgent: data.userAgent || null,
      changesBefore: data.changesBefore || null,
      changesAfter: data.changesAfter || null,
      metadata: data.metadata || {},
      severity: data.severity || 'info'
    });
  };

  /**
   * Busca logs con filtros y paginación
   */
  AuditLog.findWithFilters = async function(filters = {}, options = {}) {
    const {
      userId,
      action,
      resource,
      resourceId,
      severity,
      startDate,
      endDate,
      ipAddress,
      search,
      limit = 50,
      offset = 0,
      orderBy = 'createdAt',
      orderDir = 'DESC'
    } = { ...filters, ...options };

    const where = {};

    if (userId) where.userId = userId;
    if (action) {
      if (Array.isArray(action)) {
        where.action = { [Op.in]: action };
      } else {
        where.action = { [Op.like]: `${action}%` };
      }
    }
    if (resource) where.resource = resource;
    if (resourceId) where.resourceId = resourceId;
    if (severity) {
      if (Array.isArray(severity)) {
        where.severity = { [Op.in]: severity };
      } else {
        where.severity = severity;
      }
    }
    if (ipAddress) where.ipAddress = ipAddress;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    if (search) {
      where[Op.or] = [
        { action: { [Op.iLike]: `%${search}%` } },
        { endpoint: { [Op.iLike]: `%${search}%` } },
        sequelize.where(
          sequelize.cast(sequelize.col('metadata'), 'TEXT'),
          { [Op.iLike]: `%${search}%` }
        )
      ];
    }

    const { count, rows } = await this.findAndCountAll({
      where,
      limit: Math.min(limit, 1000),
      offset,
      order: [[orderBy, orderDir]],
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName', 'role'],
        required: false
      }]
    });

    return {
      logs: rows,
      total: count,
      page: Math.floor(offset / limit) + 1,
      totalPages: Math.ceil(count / limit)
    };
  };

  /**
   * Obtiene logs por recurso específico
   */
  AuditLog.findByResource = async function(resource, resourceId, limit = 50) {
    return await this.findAll({
      where: { resource, resourceId },
      order: [['createdAt', 'DESC']],
      limit,
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false
      }]
    });
  };

  /**
   * Obtiene alertas de seguridad recientes
   */
  AuditLog.getSecurityAlerts = async function(hoursAgo = 24) {
    const since = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);

    return await this.findAll({
      where: {
        severity: { [Op.in]: ['error', 'critical'] },
        createdAt: { [Op.gte]: since }
      },
      order: [['createdAt', 'DESC']],
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['id', 'email', 'firstName', 'lastName'],
        required: false
      }]
    });
  };

  /**
   * Obtiene estadísticas de auditoría
   */
  AuditLog.getStats = async function(startDate, endDate) {
    const where = {};
    if (startDate) where.createdAt = { [Op.gte]: new Date(startDate) };
    if (endDate) {
      where.createdAt = where.createdAt || {};
      where.createdAt[Op.lte] = new Date(endDate);
    }

    // Total de eventos
    const total = await this.count({ where });

    // Por severidad
    const bySeverity = await this.findAll({
      where,
      attributes: [
        'severity',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['severity'],
      raw: true
    });

    // Por acción (top 10)
    const byAction = await this.findAll({
      where,
      attributes: [
        'action',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['action'],
      order: [[sequelize.fn('COUNT', sequelize.col('id')), 'DESC']],
      limit: 10,
      raw: true
    });

    // Por usuario (top 10)
    const byUser = await this.findAll({
      where: { ...where, userId: { [Op.ne]: null } },
      attributes: [
        'userId',
        [sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'count']
      ],
      include: [{
        model: sequelize.models.User,
        as: 'user',
        attributes: ['email', 'firstName', 'lastName'],
        required: true
      }],
      group: ['AuditLog.user_id', 'user.id', 'user.email', 'user.firstName', 'user.lastName'],
      order: [[sequelize.fn('COUNT', sequelize.col('AuditLog.id')), 'DESC']],
      limit: 10
    });

    // IPs únicas
    const uniqueIps = await this.count({
      where,
      distinct: true,
      col: 'ipAddress'
    });

    return {
      total,
      bySeverity: bySeverity.reduce((acc, item) => {
        acc[item.severity] = parseInt(item.count);
        return acc;
      }, {}),
      byAction,
      byUser: byUser.map(u => ({
        userId: u.userId,
        email: u.user?.email,
        name: u.user ? `${u.user.firstName} ${u.user.lastName}` : 'Unknown',
        count: parseInt(u.dataValues.count)
      })),
      uniqueIps
    };
  };

  /**
   * Cuenta login fallidos de un usuario en los últimos X minutos
   */
  AuditLog.countRecentLoginFailures = async function(userId, minutes = 10) {
    const since = new Date(Date.now() - minutes * 60 * 1000);

    return await this.count({
      where: {
        userId,
        action: 'auth.login.failed',
        createdAt: { [Op.gte]: since }
      }
    });
  };

  return AuditLog;
};

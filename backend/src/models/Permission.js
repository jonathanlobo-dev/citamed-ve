// src/models/Permission.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Modelo de permisos del sistema

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const Permission = sequelize.define('Permission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Nombre único del permiso (ej: 'appointments.create')
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true
    },

    // Recurso al que aplica (ej: 'appointments', 'users', 'sessions')
    resource: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    // Acción permitida (ej: 'create', 'read', 'update', 'delete')
    action: {
      type: DataTypes.STRING(50),
      allowNull: false
    },

    // Descripción del permiso
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    // Si es un permiso de sistema (no editable)
    isSystem: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_system'
    }
  }, {
    tableName: 'permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['name'], unique: true },
      { fields: ['resource', 'action'] },
      { fields: ['resource'] }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Crea un nuevo permiso
   */
  Permission.createPermission = async function(name, resource, action, description = null) {
    return await this.create({
      name,
      resource,
      action,
      description
    });
  };

  /**
   * Busca permiso por nombre
   */
  Permission.findByName = async function(name) {
    return await this.findOne({ where: { name } });
  };

  /**
   * Busca permisos por recurso
   */
  Permission.findByResource = async function(resource) {
    return await this.findAll({
      where: { resource },
      order: [['action', 'ASC']]
    });
  };

  /**
   * Obtiene todos los permisos agrupados por recurso
   */
  Permission.getAllGroupedByResource = async function() {
    const permissions = await this.findAll({
      order: [['resource', 'ASC'], ['action', 'ASC']]
    });

    // Agrupar por recurso
    const grouped = {};
    permissions.forEach(p => {
      if (!grouped[p.resource]) {
        grouped[p.resource] = [];
      }
      grouped[p.resource].push(p);
    });

    return grouped;
  };

  /**
   * Busca permisos por patrón (para wildcards)
   */
  Permission.findByPattern = async function(pattern) {
    // Convertir wildcard a patrón SQL
    const sqlPattern = pattern.replace('*', '%');
    return await this.findAll({
      where: {
        name: {
          [Op.like]: sqlPattern
        }
      }
    });
  };

  return Permission;
};

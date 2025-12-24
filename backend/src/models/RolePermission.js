// src/models/RolePermission.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Modelo de asignación de permisos a roles

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const RolePermission = sequelize.define('RolePermission', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    // Rol al que se asigna el permiso
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'provider', 'admin'),
      allowNull: false
    },

    // Referencia al permiso
    permissionId: {
      type: DataTypes.UUID,
      allowNull: false,
      field: 'permission_id'
    }
  }, {
    tableName: 'role_permissions',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['role'] },
      { fields: ['permission_id'] },
      {
        fields: ['role', 'permission_id'],
        unique: true,
        name: 'unique_role_permission'
      }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Asigna un permiso a un rol
   */
  RolePermission.assignPermission = async function(role, permissionId) {
    // Verificar que no existe ya
    const existing = await this.findOne({
      where: { role, permissionId }
    });

    if (existing) {
      return existing; // Ya asignado
    }

    return await this.create({ role, permissionId });
  };

  /**
   * Remueve un permiso de un rol
   */
  RolePermission.removePermission = async function(role, permissionId) {
    const result = await this.destroy({
      where: { role, permissionId }
    });
    return result > 0;
  };

  /**
   * Obtiene todos los permisos de un rol
   */
  RolePermission.getPermissionsByRole = async function(role) {
    const { Permission } = require('./index');

    const rolePermissions = await this.findAll({
      where: { role },
      include: [{
        model: Permission,
        as: 'permission'
      }]
    });

    return rolePermissions.map(rp => rp.permission);
  };

  /**
   * Obtiene nombres de permisos de un rol
   */
  RolePermission.getPermissionNamesByRole = async function(role) {
    const { Permission } = require('./index');

    const rolePermissions = await this.findAll({
      where: { role },
      include: [{
        model: Permission,
        as: 'permission',
        attributes: ['name']
      }]
    });

    return rolePermissions.map(rp => rp.permission?.name).filter(Boolean);
  };

  /**
   * Verifica si un rol tiene un permiso específico
   */
  RolePermission.roleHasPermission = async function(role, permissionName) {
    const { Permission } = require('./index');

    const permission = await Permission.findByName(permissionName);
    if (!permission) return false;

    const exists = await this.findOne({
      where: {
        role,
        permissionId: permission.id
      }
    });

    return !!exists;
  };

  /**
   * Obtiene todos los roles que tienen un permiso
   */
  RolePermission.getRolesWithPermission = async function(permissionId) {
    const rolePermissions = await this.findAll({
      where: { permissionId },
      attributes: ['role']
    });

    return [...new Set(rolePermissions.map(rp => rp.role))];
  };

  return RolePermission;
};

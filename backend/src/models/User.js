// src/models/User.js
// MÓDULO 2 - CITAMED.VE
// Modelo de Usuario - VERSIÓN CON INTEGER ID
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    // Información personal
    firstName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    lastName: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    // Autenticación
    email: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    // Contacto
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    // Información demográfica
    dateOfBirth: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    gender: {
      type: DataTypes.ENUM('masculino', 'femenino', 'otro', 'prefiero_no_decir'),
      defaultValue: 'prefiero_no_decir'
    },
    // Rol y permisos
    role: {
      type: DataTypes.ENUM('patient', 'doctor', 'admin', 'provider', 'clinic', 'insurer'),
      allowNull: false,
      defaultValue: 'patient'
    },
    // Estado de la cuenta
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    verificationToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    // Verificación de email (Sub-Partida 2.3)
    emailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'email_verified'
    },
    emailVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'email_verified_at'
    },
    // Verificación de teléfono (Sub-Partida 2.3)
    phoneVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'phone_verified'
    },
    phoneVerifiedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: 'phone_verified_at'
    },
    // Two-Factor Authentication (Sub-Partida 2.4.1)
    twoFactorEnabled: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    twoFactorSecret: {
      type: DataTypes.STRING(255),
      allowNull: true,
      comment: 'Encrypted TOTP secret (AES-256-CBC)'
    },
    twoFactorBackupCodes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of SHA256 hashed backup codes'
    },
    twoFactorActivatedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    // Recuperación de contraseña
    resetPasswordToken: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    resetPasswordExpires: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // Actividad
    lastLogin: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    // RBAC - Permisos personalizados (Sub-Partida 2.5.1)
    customPermissions: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: null,
      comment: 'Override de permisos individuales: { granted: [...], revoked: [...] }',
      field: 'custom_permissions'
    },
  }, {
    tableName: 'users',
    timestamps: true,
    indexes: [
      { fields: ['email'] },
      { fields: ['role'] },
      { fields: ['isActive'] },
    ],
    hooks: {
      // Hook para hashear password antes de crear
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      // Hook para hashear password antes de actualizar
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(10);
          user.password = await bcrypt.hash(user.password, salt);
        }
      }
    }
  });

  // Método para comparar passwords
  User.prototype.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
  };

  // Método toJSON - ocultar datos sensibles
  User.prototype.toJSON = function() {
    const values = { ...this.get() };
    delete values.password;
    delete values.verificationToken;
    delete values.resetPasswordToken;
    delete values.twoFactorSecret;
    delete values.twoFactorBackupCodes;
    return values;
  };

  // Método para obtener nombre completo
  User.prototype.getFullName = function() {
    if (this.firstName && this.lastName) {
      return `${this.firstName} ${this.lastName}`;
    }
    return this.email;
  };

  return User;
};
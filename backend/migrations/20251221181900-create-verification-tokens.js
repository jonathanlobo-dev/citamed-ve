'use strict';

/**
 * Migration: Create Verification Tokens Table
 * CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Sistema enterprise-grade de verificación:
 * - Tokens UUID únicos para URLs
 * - Códigos 6 dígitos hasheados (bcrypt)
 * - Tracking de IP y user agent
 * - Múltiples propósitos (registro, reset, cambio teléfono)
 * - Control de intentos y expiración
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('verification_tokens', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },

      // ========================================
      // RELACIÓN CON USUARIO
      // ========================================
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id',
        comment: 'Usuario propietario del token'
      },

      // ========================================
      // TOKEN Y CÓDIGO
      // ========================================
      token: {
        type: Sequelize.STRING(255),
        allowNull: false,
        unique: true,
        comment: 'Token UUID único para URL (criptográficamente seguro)'
      },
      codeHash: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'code_hash',
        comment: 'Código 6 dígitos hasheado con bcrypt'
      },

      // ========================================
      // TIPO Y PROPÓSITO
      // ========================================
      type: {
        type: Sequelize.ENUM('email', 'phone'),
        allowNull: false,
        comment: 'Tipo de verificación'
      },
      purpose: {
        type: Sequelize.ENUM('registration', 'password_reset', 'email_change', 'phone_change'),
        allowNull: false,
        defaultValue: 'registration',
        comment: 'Propósito de la verificación'
      },
      contactValue: {
        type: Sequelize.STRING(255),
        allowNull: false,
        field: 'contact_value',
        comment: 'Email o teléfono a verificar'
      },

      // ========================================
      // CONTROL DE INTENTOS
      // ========================================
      attempts: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        comment: 'Número de intentos fallidos'
      },
      maxAttempts: {
        type: Sequelize.INTEGER,
        defaultValue: 5,
        field: 'max_attempts',
        comment: 'Máximo de intentos permitidos'
      },
      resendCount: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
        field: 'resend_count',
        comment: 'Veces que se ha reenviado'
      },
      maxResends: {
        type: Sequelize.INTEGER,
        defaultValue: 3,
        field: 'max_resends',
        comment: 'Máximo de reenvíos por hora'
      },

      // ========================================
      // EXPIRACIÓN Y ESTADO
      // ========================================
      expiresAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'expires_at',
        comment: 'Fecha/hora de expiración'
      },
      verifiedAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'verified_at',
        comment: 'Fecha/hora de verificación exitosa'
      },
      lastAttemptAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_attempt_at',
        comment: 'Último intento de verificación'
      },
      lastResendAt: {
        type: Sequelize.DATE,
        allowNull: true,
        field: 'last_resend_at',
        comment: 'Último reenvío de código'
      },

      // ========================================
      // SEGURIDAD Y TRACKING
      // ========================================
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        field: 'ip_address',
        comment: 'IP de creación (IPv4/IPv6)'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true,
        field: 'user_agent',
        comment: 'Browser fingerprint'
      },
      verifiedIpAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        field: 'verified_ip_address',
        comment: 'IP donde se verificó'
      },

      // ========================================
      // ESTADO ACTIVO
      // ========================================
      isActive: {
        type: Sequelize.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
        comment: 'Token activo (false = invalidado)'
      },
      invalidatedReason: {
        type: Sequelize.STRING(100),
        allowNull: true,
        field: 'invalidated_reason',
        comment: 'Razón de invalidación (expired, used, replaced, manual)'
      },

      // ========================================
      // TIMESTAMPS
      // ========================================
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    });

    // ========================================
    // ÍNDICES PARA PERFORMANCE
    // ========================================

    // Búsqueda por token (principal)
    await queryInterface.addIndex('verification_tokens', ['token'], {
      unique: true,
      name: 'verification_tokens_token_unique'
    });

    // Búsqueda por usuario y tipo (para invalidar anteriores)
    await queryInterface.addIndex('verification_tokens', ['user_id', 'type', 'is_active'], {
      name: 'verification_tokens_user_type_active_idx'
    });

    // Limpieza de tokens expirados
    await queryInterface.addIndex('verification_tokens', ['expires_at', 'is_active'], {
      name: 'verification_tokens_expires_active_idx'
    });

    // Búsqueda por contacto (para rate limiting)
    await queryInterface.addIndex('verification_tokens', ['contact_value', 'created_at'], {
      name: 'verification_tokens_contact_created_idx'
    });

    // Tokens pendientes por usuario
    await queryInterface.addIndex('verification_tokens', ['user_id', 'verified_at'], {
      name: 'verification_tokens_user_verified_idx'
    });

    console.log('  verification_tokens table created successfully');
  },

  async down(queryInterface) {
    await queryInterface.dropTable('verification_tokens');
    console.log('  verification_tokens table dropped');
  }
};

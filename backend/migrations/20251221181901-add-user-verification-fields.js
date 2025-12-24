'use strict';

/**
 * Migration: Add Verification Fields to Users Table
 * CITAMED.VE - M01 Sub-Partida 2.3 Verificación Identidad
 *
 * Campos para tracking de verificación de identidad:
 * - Email verificado (separado de isVerified general)
 * - Teléfono verificado
 * - Timestamps de verificación
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si las columnas ya existen para evitar errores
    const tableInfo = await queryInterface.describeTable('users');

    // Agregar email_verified si no existe
    if (!tableInfo.email_verified) {
      await queryInterface.addColumn('users', 'email_verified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Email verificado mediante código'
      });
      console.log('  Added column: email_verified');
    }

    // Agregar phone_verified si no existe
    if (!tableInfo.phone_verified) {
      await queryInterface.addColumn('users', 'phone_verified', {
        type: Sequelize.BOOLEAN,
        defaultValue: false,
        allowNull: false,
        comment: 'Teléfono verificado mediante SMS'
      });
      console.log('  Added column: phone_verified');
    }

    // Agregar email_verified_at si no existe
    if (!tableInfo.email_verified_at) {
      await queryInterface.addColumn('users', 'email_verified_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha/hora de verificación de email'
      });
      console.log('  Added column: email_verified_at');
    }

    // Agregar phone_verified_at si no existe
    if (!tableInfo.phone_verified_at) {
      await queryInterface.addColumn('users', 'phone_verified_at', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Fecha/hora de verificación de teléfono'
      });
      console.log('  Added column: phone_verified_at');
    }

    // Agregar índices para queries de usuarios no verificados
    try {
      await queryInterface.addIndex('users', ['email_verified'], {
        name: 'users_email_verified_idx'
      });
      console.log('  Added index: users_email_verified_idx');
    } catch (e) {
      // Índice ya existe, ignorar
    }

    try {
      await queryInterface.addIndex('users', ['phone_verified'], {
        name: 'users_phone_verified_idx'
      });
      console.log('  Added index: users_phone_verified_idx');
    } catch (e) {
      // Índice ya existe, ignorar
    }

    console.log('  User verification fields added successfully');
  },

  async down(queryInterface) {
    // Remover índices
    try {
      await queryInterface.removeIndex('users', 'users_email_verified_idx');
      await queryInterface.removeIndex('users', 'users_phone_verified_idx');
    } catch (e) {
      // Índices no existen, ignorar
    }

    // Remover columnas
    await queryInterface.removeColumn('users', 'email_verified');
    await queryInterface.removeColumn('users', 'phone_verified');
    await queryInterface.removeColumn('users', 'email_verified_at');
    await queryInterface.removeColumn('users', 'phone_verified_at');

    console.log('  User verification fields removed');
  }
};

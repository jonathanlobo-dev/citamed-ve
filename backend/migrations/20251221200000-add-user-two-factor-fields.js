'use strict';

/**
 * Migration: Add Two-Factor Authentication fields to users
 * CITAMED.VE - M01 Sub-Partida 2.4.1
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 2FA fields to users table
    await queryInterface.addColumn('users', 'twoFactorEnabled', {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
      allowNull: false
    });

    await queryInterface.addColumn('users', 'twoFactorSecret', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Encrypted TOTP secret (AES-256-CBC)'
    });

    await queryInterface.addColumn('users', 'twoFactorBackupCodes', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of SHA256 hashed backup codes'
    });

    await queryInterface.addColumn('users', 'twoFactorActivatedAt', {
      type: Sequelize.DATE,
      allowNull: true
    });

    // Add index for faster queries on 2FA enabled users
    await queryInterface.addIndex('users', ['twoFactorEnabled'], {
      name: 'idx_users_two_factor_enabled'
    });

    console.log('✅ Added 2FA fields to users table');
  },

  async down(queryInterface, Sequelize) {
    // Remove index
    await queryInterface.removeIndex('users', 'idx_users_two_factor_enabled');

    // Remove columns
    await queryInterface.removeColumn('users', 'twoFactorActivatedAt');
    await queryInterface.removeColumn('users', 'twoFactorBackupCodes');
    await queryInterface.removeColumn('users', 'twoFactorSecret');
    await queryInterface.removeColumn('users', 'twoFactorEnabled');

    console.log('✅ Removed 2FA fields from users table');
  }
};

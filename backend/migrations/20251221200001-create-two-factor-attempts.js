'use strict';

/**
 * Migration: Create two_factor_attempts table for audit trail
 * CITAMED.VE - M01 Sub-Partida 2.4.1
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('two_factor_attempts', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      success: {
        type: Sequelize.BOOLEAN,
        allowNull: false
      },
      method: {
        type: Sequelize.ENUM('totp', 'backup_code'),
        allowNull: false,
        defaultValue: 'totp',
        comment: 'Method used for verification'
      },
      ipAddress: {
        type: Sequelize.STRING(45),
        allowNull: true,
        comment: 'IPv4 or IPv6 address'
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      attemptedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    });

    // Indexes for efficient queries
    await queryInterface.addIndex('two_factor_attempts', ['userId'], {
      name: 'idx_2fa_attempts_user_id'
    });

    await queryInterface.addIndex('two_factor_attempts', ['attemptedAt'], {
      name: 'idx_2fa_attempts_attempted_at'
    });

    await queryInterface.addIndex('two_factor_attempts', ['userId', 'success'], {
      name: 'idx_2fa_attempts_user_success'
    });

    console.log('✅ Created two_factor_attempts table');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('two_factor_attempts');
    console.log('✅ Dropped two_factor_attempts table');
  }
};

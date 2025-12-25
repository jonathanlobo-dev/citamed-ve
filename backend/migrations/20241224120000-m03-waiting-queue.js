/**
 * Migration: M03 - Waiting Queue and Availability Overrides
 * CITAMED.VE - Sala de Espera Virtual
 */

'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      // 1. Crear tabla waiting_queue
      await queryInterface.createTable('waiting_queue', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        appointment_id: {
          type: Sequelize.UUID,
          allowNull: false,
          unique: true
          // FK to appointments omitted - will be handled by application layer
          // appointments table may use INTEGER or UUID depending on sync state
        },
        doctor_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        patient_id: {
          type: Sequelize.UUID,
          allowNull: false,
          references: {
            model: 'users',
            key: 'id'
          },
          onDelete: 'CASCADE'
        },
        position: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        original_position: {
          type: Sequelize.INTEGER,
          allowNull: false
        },
        status: {
          type: Sequelize.ENUM(
            'waiting',
            'checked_in',
            'called',
            'in_consultation',
            'completed',
            'cancelled',
            'no_show'
          ),
          defaultValue: 'waiting'
        },
        joined_queue_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        check_in_time: {
          type: Sequelize.DATE,
          allowNull: true
        },
        called_time: {
          type: Sequelize.DATE,
          allowNull: true
        },
        consultation_start: {
          type: Sequelize.DATE,
          allowNull: true
        },
        consultation_end: {
          type: Sequelize.DATE,
          allowNull: true
        },
        estimated_wait_minutes: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        actual_wait_minutes: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        consultation_duration_minutes: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        notification_5_sent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        notification_2_sent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        notification_next_sent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        notification_turn_sent: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        patient_rating: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        metadata: {
          type: Sequelize.JSONB,
          defaultValue: {}
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Indices para waiting_queue
      await queryInterface.addIndex('waiting_queue', ['appointment_id'], {
        unique: true,
        transaction
      });
      await queryInterface.addIndex('waiting_queue', ['doctor_id'], { transaction });
      await queryInterface.addIndex('waiting_queue', ['patient_id'], { transaction });
      await queryInterface.addIndex('waiting_queue', ['status'], { transaction });
      await queryInterface.addIndex('waiting_queue', ['doctor_id', 'status'], { transaction });
      await queryInterface.addIndex('waiting_queue', ['doctor_id', 'position'], { transaction });
      await queryInterface.addIndex('waiting_queue', ['joined_queue_at'], { transaction });

      console.log('  Created table: waiting_queue');

      // 2. Crear tabla availability_overrides
      await queryInterface.createTable('availability_overrides', {
        id: {
          type: Sequelize.UUID,
          defaultValue: Sequelize.UUIDV4,
          primaryKey: true
        },
        doctor_profile_id: {
          type: Sequelize.INTEGER,
          allowNull: false
          // FK reference to doctor_profiles handled by application layer
        },
        override_date: {
          type: Sequelize.DATEONLY,
          allowNull: false
        },
        override_type: {
          type: Sequelize.ENUM(
            'unavailable',
            'custom_hours',
            'holiday',
            'vacation',
            'emergency_only'
          ),
          allowNull: false
        },
        start_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        end_time: {
          type: Sequelize.TIME,
          allowNull: true
        },
        slot_duration: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        max_patients: {
          type: Sequelize.INTEGER,
          allowNull: true
        },
        reason: {
          type: Sequelize.TEXT,
          allowNull: true
        },
        is_recurring_yearly: {
          type: Sequelize.BOOLEAN,
          defaultValue: false
        },
        created_by: {
          type: Sequelize.UUID,
          allowNull: true
        },
        created_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        },
        updated_at: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.NOW
        }
      }, { transaction });

      // Indices para availability_overrides
      await queryInterface.addIndex('availability_overrides', ['doctor_profile_id'], { transaction });
      await queryInterface.addIndex('availability_overrides', ['override_date'], { transaction });
      await queryInterface.addIndex('availability_overrides', ['doctor_profile_id', 'override_date'], {
        unique: true,
        transaction
      });
      await queryInterface.addIndex('availability_overrides', ['override_type'], { transaction });

      console.log('  Created table: availability_overrides');

      await transaction.commit();
      console.log('M03 Migration completed successfully');
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  },

  async down(queryInterface, Sequelize) {
    const transaction = await queryInterface.sequelize.transaction();

    try {
      await queryInterface.dropTable('waiting_queue', { transaction });
      await queryInterface.dropTable('availability_overrides', { transaction });

      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
};

'use strict';

/**
 * Migration: Update Doctor Profiles - Add MPPS and Pricing Fields
 * CITAMED.VE - M01.3 Registro Multi-Paso
 *
 * Agrega campos específicos para médicos en Venezuela:
 * - mppsNumber: Número del Ministerio del Poder Popular para la Salud
 * - priceTeleconsultation: Precio específico para teleconsultas
 * - priceHomeVisit: Precio para visitas a domicilio
 * - acceptedInsurances: Lista de seguros aceptados (texto)
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Verificar si las columnas ya existen antes de agregarlas
    const tableDescription = await queryInterface.describeTable('doctor_profiles');

    // Agregar mppsNumber si no existe
    if (!tableDescription.mpps_number) {
      await queryInterface.addColumn('doctor_profiles', 'mpps_number', {
        type: Sequelize.STRING(50),
        allowNull: true,
        unique: true,
        comment: 'Número MPPS - Ministerio del Poder Popular para la Salud'
      });
      console.log('✅ Added mpps_number column');
    }

    // Agregar priceTeleconsultation si no existe
    if (!tableDescription.price_teleconsultation) {
      await queryInterface.addColumn('doctor_profiles', 'price_teleconsultation', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        comment: 'Precio de teleconsulta en USD'
      });
      console.log('✅ Added price_teleconsultation column');
    }

    // Agregar priceHomeVisit si no existe
    if (!tableDescription.price_home_visit) {
      await queryInterface.addColumn('doctor_profiles', 'price_home_visit', {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
        defaultValue: null,
        comment: 'Precio de visita a domicilio en USD'
      });
      console.log('✅ Added price_home_visit column');
    }

    // Agregar acceptedInsurances como texto si no existe
    if (!tableDescription.accepted_insurances) {
      await queryInterface.addColumn('doctor_profiles', 'accepted_insurances', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lista de seguros médicos aceptados'
      });
      console.log('✅ Added accepted_insurances column');
    }

    // Agregar availableDays si no existe (para horarios simples)
    if (!tableDescription.available_days) {
      await queryInterface.addColumn('doctor_profiles', 'available_days', {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: [],
        comment: 'Días disponibles [monday, tuesday, ...]'
      });
      console.log('✅ Added available_days column');
    }

    // Agregar startTime si no existe
    if (!tableDescription.start_time) {
      await queryInterface.addColumn('doctor_profiles', 'start_time', {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Hora de inicio de atención'
      });
      console.log('✅ Added start_time column');
    }

    // Agregar endTime si no existe
    if (!tableDescription.end_time) {
      await queryInterface.addColumn('doctor_profiles', 'end_time', {
        type: Sequelize.TIME,
        allowNull: true,
        comment: 'Hora de fin de atención'
      });
      console.log('✅ Added end_time column');
    }

    // Crear índice para mpps_number si no existe
    try {
      await queryInterface.addIndex('doctor_profiles', ['mpps_number'], {
        unique: true,
        name: 'doctor_profiles_mpps_number_unique',
        where: {
          mpps_number: {
            [Sequelize.Op.ne]: null
          }
        }
      });
      console.log('✅ Added mpps_number unique index');
    } catch (error) {
      if (!error.message.includes('already exists')) {
        throw error;
      }
      console.log('ℹ️ mpps_number index already exists');
    }

    console.log('✅ doctor_profiles table updated successfully');
  },

  async down(queryInterface) {
    // Remover índice
    try {
      await queryInterface.removeIndex('doctor_profiles', 'doctor_profiles_mpps_number_unique');
    } catch (error) {
      console.log('ℹ️ Index may not exist');
    }

    // Remover columnas
    const columnsToRemove = [
      'mpps_number',
      'price_teleconsultation',
      'price_home_visit',
      'accepted_insurances',
      'available_days',
      'start_time',
      'end_time'
    ];

    for (const column of columnsToRemove) {
      try {
        await queryInterface.removeColumn('doctor_profiles', column);
        console.log(`✅ Removed ${column} column`);
      } catch (error) {
        console.log(`ℹ️ Column ${column} may not exist`);
      }
    }

    console.log('✅ doctor_profiles rollback completed');
  }
};

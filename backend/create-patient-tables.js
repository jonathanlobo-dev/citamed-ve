/**
 * Script de migración para Perfil de Paciente Completo
 * CITAMED.VE - M02 Sub-Partida 3.2
 *
 * Crea tablas para historial médico, alergias y medicamentos
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: console.log
  }
);

async function runMigrations() {
  try {
    await sequelize.authenticate();
    console.log('✅ Conexión a la base de datos establecida');

    const queryInterface = sequelize.getQueryInterface();

    // ═══════════════════════════════════════════════════════════════
    // MIGRATION 1: Expandir patient_profiles
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 Expandiendo tabla patient_profiles...');

    // Agregar campos faltantes si no existen
    const patientColumns = await queryInterface.describeTable('patient_profiles');

    // insuranceType
    if (!patientColumns.insuranceType) {
      await queryInterface.addColumn('patient_profiles', 'insuranceType', {
        type: DataTypes.STRING(100),
        allowNull: true,
        comment: 'Tipo de plan de seguro (HCM, Plan básico, etc.)'
      });
      console.log('  ✅ Columna insuranceType agregada');
    }

    // hasChronicConditions
    if (!patientColumns.hasChronicConditions) {
      await queryInterface.addColumn('patient_profiles', 'hasChronicConditions', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Tiene condiciones crónicas'
      });
      console.log('  ✅ Columna hasChronicConditions agregada');
    }

    // hasSurgeries
    if (!patientColumns.hasSurgeries) {
      await queryInterface.addColumn('patient_profiles', 'hasSurgeries', {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
        comment: 'Ha tenido cirugías previas'
      });
      console.log('  ✅ Columna hasSurgeries agregada');
    }

    // notes
    if (!patientColumns.notes) {
      await queryInterface.addColumn('patient_profiles', 'notes', {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas generales del paciente'
      });
      console.log('  ✅ Columna notes agregada');
    }

    // ═══════════════════════════════════════════════════════════════
    // MIGRATION 2: Crear tabla patient_medical_history
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 Creando tabla patient_medical_history...');

    // Crear ENUM para status si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE condition_status AS ENUM ('active', 'resolved', 'chronic');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear ENUM para severity si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE condition_severity AS ENUM ('mild', 'moderate', 'severe');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('patient_medical_history', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patient_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'patient_profile_id'
      },
      condition: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Nombre de la condición médica'
      },
      diagnosedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'diagnosed_date',
        comment: 'Fecha de diagnóstico'
      },
      status: {
        type: DataTypes.ENUM('active', 'resolved', 'chronic'),
        defaultValue: 'active',
        comment: 'Estado de la condición'
      },
      severity: {
        type: DataTypes.ENUM('mild', 'moderate', 'severe'),
        allowNull: true,
        comment: 'Severidad de la condición'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas adicionales'
      },
      diagnosedBy: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'diagnosed_by',
        comment: 'Nombre del médico que diagnosticó'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('  ⏭️  Tabla ya existe');
      } else {
        throw err;
      }
    });

    console.log('  ✅ Tabla patient_medical_history creada');

    // Índices para medical_history
    try {
      await queryInterface.addIndex('patient_medical_history', ['patient_profile_id'], {
        name: 'idx_patient_medical_history_patient'
      });
      await queryInterface.addIndex('patient_medical_history', ['patient_profile_id', 'status'], {
        name: 'idx_patient_medical_history_status'
      });
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // ═══════════════════════════════════════════════════════════════
    // MIGRATION 3: Crear tabla patient_allergies
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 Creando tabla patient_allergies...');

    // Crear ENUM para allergy_type si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE allergy_type AS ENUM ('medication', 'food', 'environmental', 'other');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Crear ENUM para allergy_severity si no existe
    await sequelize.query(`
      DO $$ BEGIN
        CREATE TYPE allergy_severity AS ENUM ('mild', 'moderate', 'severe', 'life_threatening');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    await queryInterface.createTable('patient_allergies', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patient_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'patient_profile_id'
      },
      allergyType: {
        type: DataTypes.ENUM('medication', 'food', 'environmental', 'other'),
        allowNull: false,
        field: 'allergy_type',
        comment: 'Tipo de alergia'
      },
      allergen: {
        type: DataTypes.STRING(200),
        allowNull: false,
        comment: 'Nombre del alérgeno'
      },
      severity: {
        type: DataTypes.ENUM('mild', 'moderate', 'severe', 'life_threatening'),
        allowNull: false,
        comment: 'Severidad de la alergia'
      },
      reaction: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Descripción de la reacción alérgica'
      },
      diagnosedDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'diagnosed_date',
        comment: 'Fecha de diagnóstico'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas adicionales'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('  ⏭️  Tabla ya existe');
      } else {
        throw err;
      }
    });

    console.log('  ✅ Tabla patient_allergies creada');

    // Índices para allergies
    try {
      await queryInterface.addIndex('patient_allergies', ['patient_profile_id'], {
        name: 'idx_patient_allergies_patient'
      });
      await queryInterface.addIndex('patient_allergies', ['patient_profile_id', 'allergy_type'], {
        name: 'idx_patient_allergies_type'
      });
      await queryInterface.addIndex('patient_allergies', ['severity'], {
        name: 'idx_patient_allergies_severity'
      });
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // ═══════════════════════════════════════════════════════════════
    // MIGRATION 4: Crear tabla patient_medications
    // ═══════════════════════════════════════════════════════════════
    console.log('\n📦 Creando tabla patient_medications...');

    await queryInterface.createTable('patient_medications', {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      patientProfileId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'patient_profiles',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'patient_profile_id'
      },
      medicationName: {
        type: DataTypes.STRING(200),
        allowNull: false,
        field: 'medication_name',
        comment: 'Nombre del medicamento'
      },
      dosage: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Dosis (ej: 500mg)'
      },
      frequency: {
        type: DataTypes.STRING(100),
        allowNull: false,
        comment: 'Frecuencia (ej: Cada 8 horas)'
      },
      route: {
        type: DataTypes.STRING(50),
        allowNull: true,
        comment: 'Vía de administración (oral, IV, tópica, etc.)'
      },
      startDate: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        field: 'start_date',
        comment: 'Fecha de inicio'
      },
      endDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
        field: 'end_date',
        comment: 'Fecha de fin (null si indefinido)'
      },
      prescribedBy: {
        type: DataTypes.STRING(200),
        allowNull: true,
        field: 'prescribed_by',
        comment: 'Nombre del médico que prescribió'
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Razón de la prescripción'
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        field: 'is_active',
        comment: 'Medicamento activo'
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Notas adicionales'
      },
      createdAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'created_at'
      },
      updatedAt: {
        type: DataTypes.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        field: 'updated_at'
      }
    }).catch(err => {
      if (err.message.includes('already exists')) {
        console.log('  ⏭️  Tabla ya existe');
      } else {
        throw err;
      }
    });

    console.log('  ✅ Tabla patient_medications creada');

    // Índices para medications
    try {
      await queryInterface.addIndex('patient_medications', ['patient_profile_id'], {
        name: 'idx_patient_medications_patient'
      });
      await queryInterface.addIndex('patient_medications', ['patient_profile_id', 'is_active'], {
        name: 'idx_patient_medications_active'
      });
    } catch (err) {
      if (!err.message.includes('already exists')) throw err;
    }

    // ═══════════════════════════════════════════════════════════════
    // RESUMEN
    // ═══════════════════════════════════════════════════════════════
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('✅ MIGRACIÓN COMPLETADA');
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('Tablas creadas/actualizadas:');
    console.log('  - patient_profiles (expandida)');
    console.log('  - patient_medical_history (nueva)');
    console.log('  - patient_allergies (nueva)');
    console.log('  - patient_medications (nueva)');
    console.log('═══════════════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

runMigrations()
  .then(() => {
    console.log('Script completado exitosamente');
    process.exit(0);
  })
  .catch(err => {
    console.error('Error fatal:', err);
    process.exit(1);
  });

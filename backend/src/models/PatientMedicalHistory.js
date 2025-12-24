/**
 * PatientMedicalHistory Model - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Historial de condiciones médicas del paciente
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const PatientMedicalHistory = sequelize.define('PatientMedicalHistory', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    patientProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'patient_profile_id',
      references: {
        model: 'patient_profiles',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE'
    },
    condition: {
      type: DataTypes.STRING(200),
      allowNull: false,
      validate: {
        len: {
          args: [3, 200],
          msg: 'La condición debe tener entre 3 y 200 caracteres'
        }
      },
      comment: 'Nombre de la condición médica'
    },
    diagnosedDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'diagnosed_date',
      validate: {
        isDate: true,
        isBefore: {
          args: new Date(Date.now() + 86400000).toISOString().split('T')[0],
          msg: 'La fecha de diagnóstico no puede ser futura'
        }
      },
      comment: 'Fecha de diagnóstico'
    },
    status: {
      type: DataTypes.ENUM('active', 'resolved', 'chronic'),
      defaultValue: 'active',
      allowNull: false,
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
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Las notas no pueden exceder 2000 caracteres'
        }
      },
      comment: 'Notas adicionales'
    },
    diagnosedBy: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'diagnosed_by',
      comment: 'Nombre del médico que diagnosticó'
    }
  }, {
    tableName: 'patient_medical_history',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['patient_profile_id'] },
      { fields: ['patient_profile_id', 'status'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INSTANCIA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifica si la condición está activa
   */
  PatientMedicalHistory.prototype.isActive = function() {
    return this.status === 'active' || this.status === 'chronic';
  };

  /**
   * Calcula la duración desde el diagnóstico
   */
  PatientMedicalHistory.prototype.getDuration = function() {
    if (!this.diagnosedDate) return null;

    const diagnosed = new Date(this.diagnosedDate);
    const now = new Date();
    const diffTime = Math.abs(now - diagnosed);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 30) {
      return { value: diffDays, unit: 'días' };
    } else if (diffDays < 365) {
      return { value: Math.floor(diffDays / 30), unit: 'meses' };
    } else {
      return { value: Math.floor(diffDays / 365), unit: 'años' };
    }
  };

  /**
   * Formatea la condición para display
   */
  PatientMedicalHistory.prototype.toSummary = function() {
    const duration = this.getDuration();
    return {
      id: this.id,
      condition: this.condition,
      status: this.status,
      severity: this.severity,
      diagnosedDate: this.diagnosedDate,
      duration: duration ? `${duration.value} ${duration.unit}` : null,
      isActive: this.isActive()
    };
  };

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene historial médico de un paciente
   */
  PatientMedicalHistory.getByPatient = async function(patientProfileId) {
    return await this.findAll({
      where: { patientProfileId },
      order: [['diagnosedDate', 'DESC'], ['createdAt', 'DESC']]
    });
  };

  /**
   * Obtiene condiciones activas de un paciente
   */
  PatientMedicalHistory.getActiveConditions = async function(patientProfileId) {
    const { Op } = require('sequelize');
    return await this.findAll({
      where: {
        patientProfileId,
        status: { [Op.in]: ['active', 'chronic'] }
      },
      order: [['severity', 'DESC'], ['diagnosedDate', 'DESC']]
    });
  };

  /**
   * Obtiene condiciones crónicas de un paciente
   */
  PatientMedicalHistory.getChronicConditions = async function(patientProfileId) {
    return await this.findAll({
      where: { patientProfileId, status: 'chronic' },
      order: [['diagnosedDate', 'DESC']]
    });
  };

  /**
   * Agrega una condición médica
   */
  PatientMedicalHistory.addCondition = async function(patientProfileId, data) {
    const condition = await this.create({
      patientProfileId,
      ...data
    });

    // Si es crónica, actualizar el flag en PatientProfile
    if (data.status === 'chronic') {
      const PatientProfile = sequelize.models.PatientProfile;
      await PatientProfile.update(
        { hasChronicConditions: true },
        { where: { id: patientProfileId } }
      );
    }

    return condition;
  };

  /**
   * Actualiza una condición médica
   */
  PatientMedicalHistory.updateCondition = async function(id, patientProfileId, data) {
    const condition = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!condition) {
      throw new Error('Condición no encontrada o no pertenece al paciente');
    }

    await condition.update(data);
    return condition;
  };

  /**
   * Elimina una condición médica
   */
  PatientMedicalHistory.deleteCondition = async function(id, patientProfileId) {
    const condition = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!condition) {
      throw new Error('Condición no encontrada o no pertenece al paciente');
    }

    await condition.destroy();

    // Verificar si todavía tiene condiciones crónicas
    const chronicCount = await this.count({
      where: { patientProfileId, status: 'chronic' }
    });

    if (chronicCount === 0) {
      const PatientProfile = sequelize.models.PatientProfile;
      await PatientProfile.update(
        { hasChronicConditions: false },
        { where: { id: patientProfileId } }
      );
    }

    return true;
  };

  return PatientMedicalHistory;
};

/**
 * PatientMedication Model - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Medicamentos actuales e históricos del paciente
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const PatientMedication = sequelize.define('PatientMedication', {
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
    medicationName: {
      type: DataTypes.STRING(200),
      allowNull: false,
      field: 'medication_name',
      validate: {
        len: {
          args: [2, 200],
          msg: 'El nombre del medicamento debe tener entre 2 y 200 caracteres'
        }
      },
      comment: 'Nombre del medicamento'
    },
    dosage: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La dosis es requerida'
        }
      },
      comment: 'Dosis (ej: 500mg)'
    },
    frequency: {
      type: DataTypes.STRING(100),
      allowNull: false,
      validate: {
        notEmpty: {
          msg: 'La frecuencia es requerida'
        }
      },
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
      validate: {
        isDate: true
      },
      comment: 'Fecha de inicio'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'end_date',
      validate: {
        isDate: true,
        isAfterStartDate(value) {
          if (value && this.startDate && new Date(value) < new Date(this.startDate)) {
            throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
          }
        }
      },
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
      validate: {
        len: {
          args: [0, 2000],
          msg: 'La razón no puede exceder 2000 caracteres'
        }
      },
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
      validate: {
        len: {
          args: [0, 2000],
          msg: 'Las notas no pueden exceder 2000 caracteres'
        }
      },
      comment: 'Notas adicionales'
    }
  }, {
    tableName: 'patient_medications',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['patient_profile_id'] },
      { fields: ['patient_profile_id', 'is_active'] }
    ]
  });

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INSTANCIA
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verifica si el medicamento está actualmente activo
   */
  PatientMedication.prototype.isCurrentlyActive = function() {
    if (!this.isActive) return false;
    if (!this.endDate) return true;
    return new Date(this.endDate) >= new Date();
  };

  /**
   * Calcula la duración del tratamiento
   */
  PatientMedication.prototype.getDuration = function() {
    const start = new Date(this.startDate);
    const end = this.endDate ? new Date(this.endDate) : new Date();
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 7) {
      return { value: diffDays, unit: 'días' };
    } else if (diffDays < 30) {
      return { value: Math.floor(diffDays / 7), unit: 'semanas' };
    } else if (diffDays < 365) {
      return { value: Math.floor(diffDays / 30), unit: 'meses' };
    } else {
      return { value: Math.floor(diffDays / 365), unit: 'años' };
    }
  };

  /**
   * Formatea el medicamento para display
   */
  PatientMedication.prototype.toSummary = function() {
    const duration = this.getDuration();
    return {
      id: this.id,
      medicationName: this.medicationName,
      dosage: this.dosage,
      frequency: this.frequency,
      route: this.route,
      isActive: this.isCurrentlyActive(),
      duration: `${duration.value} ${duration.unit}`,
      prescribedBy: this.prescribedBy
    };
  };

  /**
   * Formatea como instrucción para paciente
   */
  PatientMedication.prototype.toInstructions = function() {
    return `${this.medicationName} ${this.dosage} - ${this.frequency}${this.route ? ` (${this.route})` : ''}`;
  };

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS ESTÁTICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Obtiene todos los medicamentos de un paciente
   */
  PatientMedication.getByPatient = async function(patientProfileId) {
    return await this.findAll({
      where: { patientProfileId },
      order: [['isActive', 'DESC'], ['startDate', 'DESC']]
    });
  };

  /**
   * Obtiene medicamentos activos de un paciente
   */
  PatientMedication.getActiveMedications = async function(patientProfileId) {
    return await this.findAll({
      where: {
        patientProfileId,
        isActive: true,
        [Op.or]: [
          { endDate: null },
          { endDate: { [Op.gte]: new Date() } }
        ]
      },
      order: [['startDate', 'DESC']]
    });
  };

  /**
   * Obtiene medicamentos suspendidos/históricos
   */
  PatientMedication.getInactiveMedications = async function(patientProfileId) {
    return await this.findAll({
      where: {
        patientProfileId,
        [Op.or]: [
          { isActive: false },
          { endDate: { [Op.lt]: new Date() } }
        ]
      },
      order: [['endDate', 'DESC']]
    });
  };

  /**
   * Agrega un medicamento
   */
  PatientMedication.addMedication = async function(patientProfileId, data) {
    // Verificar alergias a medicamentos
    const PatientAllergy = sequelize.models.PatientAllergy;
    const allergyCheck = await PatientAllergy.checkMedicationAllergy(
      patientProfileId,
      data.medicationName
    );

    if (allergyCheck) {
      throw new Error(`ALERTA: El paciente tiene alergia registrada a ${data.medicationName}`);
    }

    const medication = await this.create({
      patientProfileId,
      ...data
    });

    return medication;
  };

  /**
   * Actualiza un medicamento
   */
  PatientMedication.updateMedication = async function(id, patientProfileId, data) {
    const medication = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!medication) {
      throw new Error('Medicamento no encontrado o no pertenece al paciente');
    }

    await medication.update(data);
    return medication;
  };

  /**
   * Elimina un medicamento
   */
  PatientMedication.deleteMedication = async function(id, patientProfileId) {
    const medication = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!medication) {
      throw new Error('Medicamento no encontrado o no pertenece al paciente');
    }

    await medication.destroy();
    return true;
  };

  /**
   * Suspende un medicamento (marca como inactivo con fecha de hoy)
   */
  PatientMedication.stopMedication = async function(id, patientProfileId) {
    const medication = await this.findOne({
      where: { id, patientProfileId }
    });

    if (!medication) {
      throw new Error('Medicamento no encontrado o no pertenece al paciente');
    }

    await medication.update({
      isActive: false,
      endDate: new Date()
    });

    return medication;
  };

  /**
   * Obtiene lista simple de medicamentos activos para display a médicos
   */
  PatientMedication.getActiveSummary = async function(patientProfileId) {
    const medications = await this.getActiveMedications(patientProfileId);
    return medications.map(m => m.toInstructions());
  };

  /**
   * Placeholder para verificar interacciones medicamentosas
   */
  PatientMedication.checkDrugInteractions = async function(patientProfileId, newMedicationName) {
    // TODO: Integrar con API de interacciones medicamentosas
    // Por ahora solo retorna null (sin interacciones conocidas)
    return null;
  };

  return PatientMedication;
};

/**
 * ClinicDoctor Model - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas
 *
 * Modelo para la relación entre médicos y clínicas/sedes
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClinicDoctor = sequelize.define('ClinicDoctor', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    clinicId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'clinic_id',
      references: {
        model: 'clinics',
        key: 'id'
      }
    },
    locationId: {
      type: DataTypes.INTEGER,
      field: 'location_id',
      references: {
        model: 'clinic_locations',
        key: 'id'
      },
      comment: 'Sede específica (null = todas las sedes)'
    },
    doctorId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_id',
      references: {
        model: 'users',
        key: 'id'
      }
    },
    employmentType: {
      type: DataTypes.ENUM('staff', 'visiting', 'partner', 'affiliated'),
      field: 'employment_type',
      comment: 'staff=empleado, visiting=visitante, partner=socio, affiliated=afiliado'
    },
    schedule: {
      type: DataTypes.JSONB,
      comment: 'Horarios de atención en esta sede'
      /*
        Formato esperado:
        {
          "monday": ["09:00-13:00", "15:00-18:00"],
          "wednesday": ["09:00-13:00"],
          ...
        }
      */
    },
    consultationRoom: {
      type: DataTypes.STRING(50),
      field: 'consultation_room',
      comment: 'Consultorio asignado'
    },
    servicesOffered: {
      type: DataTypes.ARRAY(DataTypes.TEXT),
      field: 'services_offered',
      comment: 'Lista de servicios que ofrece en esta sede'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    },
    startDate: {
      type: DataTypes.DATEONLY,
      field: 'start_date'
    },
    endDate: {
      type: DataTypes.DATEONLY,
      field: 'end_date'
    }
  }, {
    tableName: 'clinic_doctors',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['clinic_id'] },
      { fields: ['location_id'] },
      { fields: ['doctor_id'] },
      { fields: ['is_active'] },
      {
        unique: true,
        fields: ['clinic_id', 'doctor_id', 'location_id']
      }
    ]
  });

  // Método para obtener el tipo de empleo en español
  ClinicDoctor.prototype.getEmploymentTypeLabel = function() {
    const labels = {
      'staff': 'Médico de Planta',
      'visiting': 'Médico Visitante',
      'partner': 'Socio',
      'affiliated': 'Afiliado'
    };
    return labels[this.employmentType] || this.employmentType;
  };

  // Método para verificar si está activo actualmente
  ClinicDoctor.prototype.isCurrentlyActive = function() {
    if (!this.isActive) return false;
    const today = new Date();
    if (this.startDate && new Date(this.startDate) > today) return false;
    if (this.endDate && new Date(this.endDate) < today) return false;
    return true;
  };

  return ClinicDoctor;
};

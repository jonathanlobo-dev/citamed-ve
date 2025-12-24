/**
 * ClinicService Model - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas
 *
 * Modelo para servicios ofrecidos por una clínica/sede
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClinicService = sequelize.define('ClinicService', {
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
      comment: 'Sede específica donde se ofrece (null = todas las sedes)'
    },
    serviceName: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'service_name'
    },
    serviceCategory: {
      type: DataTypes.STRING(100),
      field: 'service_category',
      comment: 'Categoría del servicio (Consulta, Cirugía, Diagnóstico, etc.)'
    },
    description: {
      type: DataTypes.TEXT
    },
    price: {
      type: DataTypes.DECIMAL(10, 2)
    },
    priceCurrency: {
      type: DataTypes.STRING(10),
      defaultValue: 'USD',
      field: 'price_currency'
    },
    durationMinutes: {
      type: DataTypes.INTEGER,
      field: 'duration_minutes',
      comment: 'Duración estimada en minutos'
    },
    requiresAppointment: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'requires_appointment'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'clinic_services',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['clinic_id'] },
      { fields: ['location_id'] },
      { fields: ['service_category'] }
    ]
  });

  // Método para formatear precio
  ClinicService.prototype.getFormattedPrice = function() {
    if (!this.price) return 'Consultar';
    return `${this.priceCurrency} ${parseFloat(this.price).toFixed(2)}`;
  };

  // Método para formatear duración
  ClinicService.prototype.getFormattedDuration = function() {
    if (!this.durationMinutes) return null;
    if (this.durationMinutes < 60) return `${this.durationMinutes} minutos`;
    const hours = Math.floor(this.durationMinutes / 60);
    const mins = this.durationMinutes % 60;
    if (mins === 0) return `${hours} hora${hours > 1 ? 's' : ''}`;
    return `${hours}h ${mins}min`;
  };

  return ClinicService;
};

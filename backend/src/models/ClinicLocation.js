/**
 * ClinicLocation Model - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas
 *
 * Modelo para sedes físicas de una clínica
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClinicLocation = sequelize.define('ClinicLocation', {
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Nombre de la sede (ej: Sede Principal, Sucursal Este)'
    },
    isMain: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_main',
      comment: 'Indica si es la sede principal'
    },
    addressLine1: {
      type: DataTypes.STRING(255),
      allowNull: false,
      field: 'address_line1'
    },
    addressLine2: {
      type: DataTypes.STRING(255),
      field: 'address_line2'
    },
    city: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    state: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    postalCode: {
      type: DataTypes.STRING(20),
      field: 'postal_code'
    },
    country: {
      type: DataTypes.STRING(100),
      defaultValue: 'Venezuela'
    },
    latitude: {
      type: DataTypes.DECIMAL(10, 8)
    },
    longitude: {
      type: DataTypes.DECIMAL(11, 8)
    },
    phone: {
      type: DataTypes.STRING(20)
    },
    whatsapp: {
      type: DataTypes.STRING(20)
    },
    email: {
      type: DataTypes.STRING(255)
    },
    openingHours: {
      type: DataTypes.JSONB,
      field: 'opening_hours',
      comment: 'Horarios de atención por día de la semana'
      /*
        Formato esperado:
        {
          "monday": { "open": "08:00", "close": "18:00", "closed": false },
          "tuesday": { "open": "08:00", "close": "18:00", "closed": false },
          ...
        }
      */
    },
    hasParking: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_parking'
    },
    hasEmergency: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_emergency'
    },
    hasPharmacy: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_pharmacy'
    },
    hasLaboratory: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_laboratory'
    },
    hasImaging: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'has_imaging',
      comment: 'Servicio de imagenología'
    },
    wheelchairAccessible: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'wheelchair_accessible'
    },
    totalConsultationRooms: {
      type: DataTypes.INTEGER,
      field: 'total_consultation_rooms'
    },
    totalBeds: {
      type: DataTypes.INTEGER,
      field: 'total_beds'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'clinic_locations',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['clinic_id'] },
      { fields: ['city', 'state'] },
      { fields: ['latitude', 'longitude'] },
      { fields: ['is_active'] }
    ]
  });

  // Método para obtener dirección completa
  ClinicLocation.prototype.getFullAddress = function() {
    let address = this.addressLine1;
    if (this.addressLine2) address += `, ${this.addressLine2}`;
    address += `, ${this.city}, ${this.state}`;
    if (this.postalCode) address += ` ${this.postalCode}`;
    address += `, ${this.country}`;
    return address;
  };

  // Método para obtener lista de servicios disponibles
  ClinicLocation.prototype.getAvailableAmenities = function() {
    const amenities = [];
    if (this.hasParking) amenities.push('Estacionamiento');
    if (this.hasEmergency) amenities.push('Emergencias');
    if (this.hasPharmacy) amenities.push('Farmacia');
    if (this.hasLaboratory) amenities.push('Laboratorio');
    if (this.hasImaging) amenities.push('Imagenología');
    if (this.wheelchairAccessible) amenities.push('Acceso para sillas de ruedas');
    return amenities;
  };

  return ClinicLocation;
};

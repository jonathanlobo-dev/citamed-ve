/**
 * ClinicImage Model - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas
 *
 * Modelo para la galería de imágenes de clínicas/sedes
 */

const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const ClinicImage = sequelize.define('ClinicImage', {
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
      comment: 'Sede específica (null = imagen general de la clínica)'
    },
    imageUrl: {
      type: DataTypes.STRING(500),
      allowNull: false,
      field: 'image_url'
    },
    imageType: {
      type: DataTypes.ENUM(
        'exterior',
        'reception',
        'consultation_room',
        'waiting_room',
        'equipment',
        'staff',
        'other'
      ),
      field: 'image_type'
    },
    title: {
      type: DataTypes.STRING(255)
    },
    description: {
      type: DataTypes.TEXT
    },
    displayOrder: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
      field: 'display_order'
    },
    isFeatured: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_featured',
      comment: 'Imagen destacada para mostrar primero'
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
      field: 'is_active'
    }
  }, {
    tableName: 'clinic_images',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      { fields: ['clinic_id'] },
      { fields: ['location_id'] },
      { fields: ['display_order'] }
    ]
  });

  // Método para obtener el tipo de imagen en español
  ClinicImage.prototype.getImageTypeLabel = function() {
    const labels = {
      'exterior': 'Exterior',
      'reception': 'Recepción',
      'consultation_room': 'Consultorio',
      'waiting_room': 'Sala de Espera',
      'equipment': 'Equipos',
      'staff': 'Personal',
      'other': 'Otro'
    };
    return labels[this.imageType] || 'Imagen';
  };

  return ClinicImage;
};

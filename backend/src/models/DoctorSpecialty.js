/**
 * DoctorSpecialty Model - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Tabla intermedia many-to-many entre doctores y especialidades
 * Permite a un doctor tener múltiples especialidades con certificaciones
 */

const { DataTypes, Op } = require('sequelize');

module.exports = (sequelize) => {
  const DoctorSpecialty = sequelize.define('DoctorSpecialty', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },

    doctorProfileId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'doctor_profile_id',
      references: {
        model: 'doctor_profiles',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    specialtyId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: 'specialty_id',
      references: {
        model: 'specialties',
        key: 'id'
      },
      onDelete: 'CASCADE'
    },

    isPrimary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
      field: 'is_primary',
      comment: 'Solo una especialidad puede ser principal por doctor'
    },

    certificationDate: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      field: 'certification_date',
      comment: 'Fecha de certificación en esta especialidad'
    },

    certificationNumber: {
      type: DataTypes.STRING(100),
      allowNull: true,
      field: 'certification_number',
      comment: 'Número de certificación o colegiatura'
    },

    certificationInstitution: {
      type: DataTypes.STRING(200),
      allowNull: true,
      field: 'certification_institution',
      comment: 'Institución que otorgó la certificación'
    }

  }, {
    tableName: 'doctor_specialties',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['doctor_profile_id', 'specialty_id'],
        name: 'unique_doctor_specialty'
      }
    ]
  });

  // ========================================
  // MÉTODOS ESTÁTICOS
  // ========================================

  /**
   * Asigna una especialidad a un doctor
   * Si es primaria, desmarca las otras como no primarias
   */
  DoctorSpecialty.assignSpecialty = async function(doctorProfileId, specialtyId, data = {}) {
    const transaction = await sequelize.transaction();

    try {
      // Si es primaria, desmarcar otras
      if (data.isPrimary) {
        await this.update(
          { isPrimary: false },
          {
            where: { doctorProfileId, isPrimary: true },
            transaction
          }
        );
      }

      // Crear o actualizar
      const [specialty, created] = await this.findOrCreate({
        where: { doctorProfileId, specialtyId },
        defaults: {
          isPrimary: data.isPrimary || false,
          certificationDate: data.certificationDate,
          certificationNumber: data.certificationNumber,
          certificationInstitution: data.certificationInstitution
        },
        transaction
      });

      if (!created) {
        await specialty.update({
          isPrimary: data.isPrimary !== undefined ? data.isPrimary : specialty.isPrimary,
          certificationDate: data.certificationDate || specialty.certificationDate,
          certificationNumber: data.certificationNumber || specialty.certificationNumber,
          certificationInstitution: data.certificationInstitution || specialty.certificationInstitution
        }, { transaction });
      }

      await transaction.commit();
      return specialty;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Establece una especialidad como primaria
   */
  DoctorSpecialty.setPrimarySpecialty = async function(doctorProfileId, specialtyId) {
    const transaction = await sequelize.transaction();

    try {
      // Desmarcar todas
      await this.update(
        { isPrimary: false },
        {
          where: { doctorProfileId },
          transaction
        }
      );

      // Marcar la indicada
      const result = await this.update(
        { isPrimary: true },
        {
          where: { doctorProfileId, specialtyId },
          transaction
        }
      );

      await transaction.commit();
      return result[0] > 0;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  };

  /**
   * Obtiene todas las especialidades de un doctor
   */
  DoctorSpecialty.getSpecialtiesByDoctor = async function(doctorProfileId) {
    const { Specialty } = sequelize.models;

    return await this.findAll({
      where: { doctorProfileId },
      include: [{
        model: Specialty,
        as: 'specialty'
      }],
      order: [['isPrimary', 'DESC'], ['createdAt', 'ASC']]
    });
  };

  /**
   * Obtiene la especialidad primaria de un doctor
   */
  DoctorSpecialty.getPrimarySpecialty = async function(doctorProfileId) {
    const { Specialty } = sequelize.models;

    return await this.findOne({
      where: { doctorProfileId, isPrimary: true },
      include: [{
        model: Specialty,
        as: 'specialty'
      }]
    });
  };

  /**
   * Cuenta doctores por especialidad
   */
  DoctorSpecialty.countDoctorsBySpecialty = async function(specialtyId) {
    return await this.count({
      where: { specialtyId }
    });
  };

  /**
   * Elimina una especialidad de un doctor
   * No permite eliminar si es la única
   */
  DoctorSpecialty.removeSpecialty = async function(doctorProfileId, specialtyId) {
    const count = await this.count({ where: { doctorProfileId } });

    if (count <= 1) {
      throw new Error('No se puede eliminar la única especialidad del doctor');
    }

    const specialty = await this.findOne({
      where: { doctorProfileId, specialtyId }
    });

    if (!specialty) {
      throw new Error('Especialidad no encontrada');
    }

    const wasPrimary = specialty.isPrimary;
    await specialty.destroy();

    // Si era primaria, asignar la primera restante como primaria
    if (wasPrimary) {
      const firstRemaining = await this.findOne({
        where: { doctorProfileId },
        order: [['createdAt', 'ASC']]
      });

      if (firstRemaining) {
        await firstRemaining.update({ isPrimary: true });
      }
    }

    return true;
  };

  return DoctorSpecialty;
};

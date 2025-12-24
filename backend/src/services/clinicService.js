/**
 * Clinic Service - CITAMED.VE
 * M02 Sub-Partida 3.6 - Sistema de Clínicas y Organizaciones
 *
 * Servicio con toda la lógica de negocio para gestión de clínicas
 */

const db = require('../models');
const { Op } = require('sequelize');

const {
  Clinic,
  ClinicLocation,
  ClinicService: ClinicServiceModel,
  ClinicDoctor,
  ClinicImage,
  User,
  DoctorProfile,
  Specialty
} = db;

class ClinicService {

  // ═══════════════════════════════════════════════════════════════
  // CRUD CLÍNICAS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Crear nueva clínica
   */
  async createClinic(clinicData, adminUserId) {
    const transaction = await db.sequelize.transaction();

    try {
      const clinic = await Clinic.create({
        ...clinicData,
        adminUserId
      }, { transaction });

      await transaction.commit();

      return {
        success: true,
        data: clinic,
        message: 'Clínica creada exitosamente'
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error creando clínica:', error);
      throw error;
    }
  }

  /**
   * Obtener clínica por ID con todas sus relaciones
   */
  async getClinicById(clinicId, options = {}) {
    const includes = [];

    if (options.includeLocations !== false) {
      includes.push({
        model: ClinicLocation,
        as: 'locations',
        where: options.activeOnly ? { isActive: true } : {},
        required: false,
        order: [['isMain', 'DESC'], ['name', 'ASC']]
      });
    }

    if (options.includeServices) {
      includes.push({
        model: ClinicServiceModel,
        as: 'services',
        where: options.activeOnly ? { isActive: true } : {},
        required: false
      });
    }

    if (options.includeImages) {
      includes.push({
        model: ClinicImage,
        as: 'images',
        where: { isActive: true },
        required: false,
        order: [['isFeatured', 'DESC'], ['displayOrder', 'ASC']]
      });
    }

    if (options.includeAdmin) {
      includes.push({
        model: User,
        as: 'admin',
        attributes: ['id', 'firstName', 'lastName', 'email']
      });
    }

    const clinic = await Clinic.findByPk(clinicId, {
      include: includes
    });

    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    return { success: true, data: clinic };
  }

  /**
   * Obtener clínica con todas sus sedes y médicos
   */
  async getClinicWithLocations(clinicId) {
    const clinic = await Clinic.findByPk(clinicId, {
      include: [
        {
          model: ClinicLocation,
          as: 'locations',
          where: { isActive: true },
          required: false,
          include: [
            {
              model: ClinicDoctor,
              as: 'doctors',
              where: { isActive: true },
              required: false,
              include: [
                {
                  model: User,
                  as: 'doctor',
                  attributes: ['id', 'firstName', 'lastName', 'email'],
                  include: [{
                    model: DoctorProfile,
                    as: 'doctorProfile',
                    attributes: ['id', 'profilePhoto', 'specialty']
                  }]
                }
              ]
            }
          ]
        },
        {
          model: ClinicImage,
          as: 'images',
          where: { isActive: true },
          required: false,
          order: [['isFeatured', 'DESC'], ['displayOrder', 'ASC']]
        }
      ]
    });

    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    return { success: true, data: clinic };
  }

  /**
   * Actualizar información de clínica
   */
  async updateClinic(clinicId, updateData, userId) {
    const clinic = await Clinic.findByPk(clinicId);

    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    // Verificar que el usuario sea admin de la clínica
    if (clinic.adminUserId !== userId) {
      return { success: false, message: 'No tienes permiso para editar esta clínica' };
    }

    // Campos que no se pueden actualizar directamente
    delete updateData.adminUserId;
    delete updateData.isVerified;
    delete updateData.verificationDate;
    delete updateData.verifiedBy;

    await clinic.update(updateData);

    return { success: true, data: clinic, message: 'Clínica actualizada' };
  }

  /**
   * Buscar clínicas con filtros
   */
  async searchClinics(filters = {}) {
    const where = { isActive: true };

    if (filters.organizationType) {
      where.organizationType = filters.organizationType;
    }

    if (filters.isVerified !== undefined) {
      where.isVerified = filters.isVerified;
    }

    if (filters.search) {
      where[Op.or] = [
        { commercialName: { [Op.iLike]: `%${filters.search}%` } },
        { legalName: { [Op.iLike]: `%${filters.search}%` } }
      ];
    }

    const clinics = await Clinic.findAll({
      where,
      include: [
        {
          model: ClinicLocation,
          as: 'locations',
          where: filters.city ? { city: { [Op.iLike]: `%${filters.city}%` }, isActive: true } : { isActive: true },
          required: !!filters.city
        }
      ],
      order: [
        ['isVerified', 'DESC'],
        ['commercialName', 'ASC']
      ],
      limit: filters.limit || 50,
      offset: filters.offset || 0
    });

    return { success: true, data: clinics };
  }

  // ═══════════════════════════════════════════════════════════════
  // SEDES (LOCATIONS)
  // ═══════════════════════════════════════════════════════════════

  /**
   * Agregar sede a clínica
   */
  async addLocation(clinicId, locationData) {
    const clinic = await Clinic.findByPk(clinicId);

    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    const transaction = await db.sequelize.transaction();

    try {
      // Si es sede principal, desmarcar otras sedes principales
      if (locationData.isMain) {
        await ClinicLocation.update(
          { isMain: false },
          { where: { clinicId }, transaction }
        );
      }

      const location = await ClinicLocation.create({
        ...locationData,
        clinicId
      }, { transaction });

      // Actualizar contador
      await clinic.increment('totalLocations', { transaction });

      await transaction.commit();

      return { success: true, data: location, message: 'Sede agregada exitosamente' };
    } catch (error) {
      await transaction.rollback();
      console.error('Error agregando sede:', error);
      throw error;
    }
  }

  /**
   * Actualizar sede
   */
  async updateLocation(locationId, updateData) {
    const location = await ClinicLocation.findByPk(locationId);

    if (!location) {
      return { success: false, message: 'Sede no encontrada' };
    }

    const transaction = await db.sequelize.transaction();

    try {
      // Si se marca como principal, desmarcar otras
      if (updateData.isMain) {
        await ClinicLocation.update(
          { isMain: false },
          { where: { clinicId: location.clinicId, id: { [Op.ne]: locationId } }, transaction }
        );
      }

      await location.update(updateData, { transaction });

      await transaction.commit();

      return { success: true, data: location, message: 'Sede actualizada' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtener sedes de una clínica
   */
  async getClinicLocations(clinicId) {
    const locations = await ClinicLocation.findAll({
      where: { clinicId, isActive: true },
      order: [['isMain', 'DESC'], ['name', 'ASC']]
    });

    return { success: true, data: locations };
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉDICOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Asignar médico a sede
   */
  async assignDoctorToLocation(clinicId, locationId, doctorId, assignmentData) {
    // Verificar que existan
    const clinic = await Clinic.findByPk(clinicId);
    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    if (locationId) {
      const location = await ClinicLocation.findByPk(locationId);
      if (!location || location.clinicId !== clinicId) {
        return { success: false, message: 'Sede no encontrada o no pertenece a esta clínica' };
      }
    }

    const doctor = await User.findByPk(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return { success: false, message: 'Médico no encontrado' };
    }

    const transaction = await db.sequelize.transaction();

    try {
      // Verificar si ya existe la asignación
      const existing = await ClinicDoctor.findOne({
        where: { clinicId, doctorId, locationId }
      });

      if (existing) {
        await existing.update(assignmentData, { transaction });
        await transaction.commit();
        return { success: true, data: existing, message: 'Asignación actualizada' };
      }

      const assignment = await ClinicDoctor.create({
        clinicId,
        locationId,
        doctorId,
        ...assignmentData
      }, { transaction });

      // Actualizar contador de médicos
      await clinic.increment('totalDoctors', { transaction });

      await transaction.commit();

      return { success: true, data: assignment, message: 'Médico asignado exitosamente' };
    } catch (error) {
      await transaction.rollback();
      console.error('Error asignando médico:', error);
      throw error;
    }
  }

  /**
   * Remover médico de sede
   */
  async removeDoctorFromLocation(clinicId, doctorId, locationId) {
    const transaction = await db.sequelize.transaction();

    try {
      const where = { clinicId, doctorId };
      if (locationId) where.locationId = locationId;

      const deleted = await ClinicDoctor.destroy({
        where,
        transaction
      });

      if (deleted > 0) {
        const clinic = await Clinic.findByPk(clinicId);
        if (clinic) {
          await clinic.decrement('totalDoctors', { by: deleted, transaction });
        }
      }

      await transaction.commit();

      return { success: true, message: 'Médico removido' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtener médicos de una clínica/sede
   */
  async getClinicDoctors(clinicId, locationId = null) {
    const where = { clinicId, isActive: true };

    if (locationId) {
      where.locationId = locationId;
    }

    const doctors = await ClinicDoctor.findAll({
      where,
      include: [
        {
          model: User,
          as: 'doctor',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          include: [
            {
              model: DoctorProfile,
              as: 'doctorProfile',
              attributes: ['id', 'profilePhoto', 'specialty', 'bio', 'experienceYears', 'averageRating', 'totalReviews']
            }
          ]
        },
        {
          model: ClinicLocation,
          as: 'location',
          attributes: ['id', 'name', 'city']
        }
      ]
    });

    return { success: true, data: doctors };
  }

  // ═══════════════════════════════════════════════════════════════
  // SERVICIOS
  // ═══════════════════════════════════════════════════════════════

  /**
   * Agregar servicio a clínica/sede
   */
  async addService(clinicId, locationId, serviceData) {
    const clinic = await Clinic.findByPk(clinicId);
    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    const transaction = await db.sequelize.transaction();

    try {
      const service = await ClinicServiceModel.create({
        clinicId,
        locationId,
        ...serviceData
      }, { transaction });

      await clinic.increment('totalServices', { transaction });

      await transaction.commit();

      return { success: true, data: service, message: 'Servicio agregado' };
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }

  /**
   * Obtener servicios de una clínica/sede
   */
  async getClinicServices(clinicId, locationId = null) {
    const where = { clinicId, isActive: true };

    if (locationId) {
      where.locationId = locationId;
    }

    const services = await ClinicServiceModel.findAll({
      where,
      include: [
        {
          model: ClinicLocation,
          as: 'location',
          attributes: ['id', 'name']
        }
      ],
      order: [['serviceCategory', 'ASC'], ['serviceName', 'ASC']]
    });

    return { success: true, data: services };
  }

  // ═══════════════════════════════════════════════════════════════
  // IMÁGENES
  // ═══════════════════════════════════════════════════════════════

  /**
   * Agregar imagen a galería
   */
  async addImage(clinicId, locationId, imageData) {
    const image = await ClinicImage.create({
      clinicId,
      locationId,
      ...imageData
    });

    return { success: true, data: image, message: 'Imagen agregada' };
  }

  /**
   * Obtener imágenes de clínica/sede
   */
  async getClinicImages(clinicId, locationId = null) {
    const where = { clinicId, isActive: true };

    if (locationId) {
      where.locationId = locationId;
    }

    const images = await ClinicImage.findAll({
      where,
      order: [['isFeatured', 'DESC'], ['displayOrder', 'ASC']]
    });

    return { success: true, data: images };
  }

  /**
   * Eliminar imagen
   */
  async deleteImage(imageId) {
    const image = await ClinicImage.findByPk(imageId);
    if (!image) {
      return { success: false, message: 'Imagen no encontrada' };
    }

    await image.update({ isActive: false });

    return { success: true, message: 'Imagen eliminada' };
  }

  // ═══════════════════════════════════════════════════════════════
  // VERIFICACIÓN
  // ═══════════════════════════════════════════════════════════════

  /**
   * Verificar clínica (solo admin)
   */
  async verifyClinic(clinicId, verifierId) {
    const clinic = await Clinic.findByPk(clinicId);
    if (!clinic) {
      return { success: false, message: 'Clínica no encontrada' };
    }

    await clinic.update({
      isVerified: true,
      verificationDate: new Date(),
      verifiedBy: verifierId
    });

    return { success: true, data: clinic, message: 'Clínica verificada exitosamente' };
  }

  /**
   * Obtener clínicas administradas por un usuario
   */
  async getUserClinics(userId) {
    const clinics = await Clinic.findAll({
      where: { adminUserId: userId, isActive: true },
      include: [
        {
          model: ClinicLocation,
          as: 'locations',
          where: { isActive: true },
          required: false
        }
      ]
    });

    return { success: true, data: clinics };
  }
}

module.exports = new ClinicService();

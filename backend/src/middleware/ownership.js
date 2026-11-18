/**
 * ownership.js - CITAMED.VE
 * Comprobaciones de pertenencia: que el recurso pedido sea de quien lo pide.
 */
const db = require('../models');

/**
 * Un médico solo puede ver el perfil de un paciente con el que tiene al menos una cita.
 * El administrador puede ver cualquiera. :patientId es el id del perfil de paciente.
 */
async function requireDoctorPatientRelationship(req, res, next) {
  try {
    if (req.user.role === 'admin') return next();
    const profile = await db.PatientProfile.findByPk(parseInt(req.params.patientId, 10), { attributes: ['id', 'userId'] });
    if (!profile) return res.status(404).json({ success: false, message: 'Paciente no encontrado' });
    const cita = await db.Appointment.findOne({
      where: { patientId: profile.userId, doctorId: req.user.id },
      attributes: ['id']
    });
    if (!cita) {
      return res.status(403).json({ success: false, message: 'No tienes citas registradas con este paciente' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

/**
 * Solo el administrador de la clínica (adminUserId) o un admin del sistema puede modificarla.
 * Si la ruta trae :locationId o :imageId, se comprueba también que pertenezcan a esa clínica.
 */
async function requireClinicOwner(req, res, next) {
  try {
    const clinicId = parseInt(req.params.clinicId || req.params.id, 10);
    const clinic = await db.Clinic.findByPk(clinicId, { attributes: ['id', 'adminUserId'] });
    if (!clinic) return res.status(404).json({ success: false, message: 'Clínica no encontrada' });
    if (req.user.role !== 'admin' && clinic.adminUserId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'No administras esta clínica' });
    }
    if (req.params.locationId) {
      const loc = await db.ClinicLocation.findByPk(parseInt(req.params.locationId, 10), { attributes: ['id', 'clinicId'] });
      if (!loc || loc.clinicId !== clinic.id) return res.status(404).json({ success: false, message: 'Sede no encontrada' });
    }
    if (req.params.imageId) {
      const img = await db.ClinicImage.findByPk(parseInt(req.params.imageId, 10), { attributes: ['id', 'clinicId'] });
      if (!img || img.clinicId !== clinic.id) return res.status(404).json({ success: false, message: 'Imagen no encontrada' });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireDoctorPatientRelationship, requireClinicOwner };

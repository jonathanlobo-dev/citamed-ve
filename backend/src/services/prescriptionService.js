/**
 * Prescription Service - CITAMED.VE
 * M03 / Semana 5 - Lógica de negocio para récipes médicos
 */

const crypto = require('crypto');
const db = require('../models');
const { Prescription, Appointment, User, DoctorProfile, PatientProfile, Specialty, Clinic, ClinicLocation } = db;

/**
 * Helper para obtener iniciales del paciente
 */
function getInitials(firstName, lastName) {
  const f = firstName ? firstName.trim()[0].toUpperCase() + '.' : '';
  const l = lastName ? lastName.trim()[0].toUpperCase() + '.' : '';
  return `${f} ${l}`.trim() || 'N/A';
}

/**
 * Genera código aleatorio único y no secuencial
 */
function generateVerificationCode() {
  // 16 caracteres hexadecimales en mayúsculas
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Crea un récipe médico asociado a una cita
 */
async function createPrescription({ appointmentId, user, items, indications }) {
  if (!items || !Array.isArray(items) || items.length === 0) {
    const error = new Error('El récipe debe contener al menos un medicamento');
    error.status = 400;
    throw error;
  }

  for (const item of items) {
    if (!item.medication || typeof item.medication !== 'string' || !item.medication.trim()) {
      const error = new Error('Cada medicamento debe tener un nombre válido');
      error.status = 400;
      throw error;
    }
  }

  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    const error = new Error('Cita no encontrada');
    error.status = 404;
    throw error;
  }

  // Solo el médico asignado o admin
  if (user.role !== 'admin' && appointment.doctorId !== user.id) {
    const error = new Error('No autorizado para emitir récipe en esta cita');
    error.status = 403;
    throw error;
  }

  // La cita debe estar en progreso o completada
  if (!['in_progress', 'completed'].includes(appointment.status)) {
    const error = new Error('Solo se puede emitir récipe durante o después de la consulta (in_progress o completed)');
    error.status = 400;
    throw error;
  }

  const verificationCode = generateVerificationCode();

  const prescription = await Prescription.create({
    appointmentId: appointment.id,
    doctorId: appointment.doctorId,
    patientId: appointment.patientId,
    items,
    indications: indications || null,
    verificationCode,
    status: 'active'
  });

  return await getPrescriptionWithDetails(prescription.id);
}

/**
 * Obtiene un récipe por ID con todas sus relaciones cargadas
 */
async function getPrescriptionWithDetails(id) {
  return await Prescription.findByPk(id, {
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone'],
        include: [
          {
            model: PatientProfile,
            as: 'patientProfile'
          }
        ]
      },
      {
        model: Appointment,
        as: 'appointment',
        include: [
          { model: Clinic, as: 'clinic' },
          { model: ClinicLocation, as: 'clinicLocation' },
          { model: Specialty, as: 'specialty', attributes: ['id', 'name'] }
        ]
      }
    ]
  });
}

/**
 * Obtiene los récipes de una cita
 */
async function getPrescriptionsByAppointment(appointmentId, user) {
  const appointment = await Appointment.findByPk(appointmentId);
  if (!appointment) {
    const error = new Error('Cita no encontrada');
    error.status = 404;
    throw error;
  }

  // Médico dueño, paciente dueño o admin
  if (user.role !== 'admin' && appointment.doctorId !== user.id && appointment.patientId !== user.id) {
    const error = new Error('No autorizado para ver los récipes de esta cita');
    error.status = 403;
    throw error;
  }

  return await Prescription.findAll({
    where: { appointmentId },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Obtiene un récipe para visualización / descarga con control de acceso
 */
async function getPrescriptionForUser(id, user) {
  const prescription = await getPrescriptionWithDetails(id);
  if (!prescription) {
    const error = new Error('Récipe no encontrado');
    error.status = 404;
    throw error;
  }

  if (user.role !== 'admin' && prescription.doctorId !== user.id && prescription.patientId !== user.id) {
    const error = new Error('No autorizado para acceder a este récipe');
    error.status = 403;
    throw error;
  }

  return prescription;
}

/**
 * Anula un récipe existente (solo el médico emisor)
 */
async function voidPrescription(id, user) {
  const prescription = await Prescription.findByPk(id);
  if (!prescription) {
    const error = new Error('Récipe no encontrado');
    error.status = 404;
    throw error;
  }

  if (user.role !== 'admin' && prescription.doctorId !== user.id) {
    const error = new Error('Solo el médico emisor puede anular este récipe');
    error.status = 403;
    throw error;
  }

  prescription.status = 'voided';
  await prescription.save();

  return prescription;
}

/**
 * Verificación pública de récipe (datos mínimos, sin cédula, teléfono ni diagnóstico)
 */
async function verifyPrescription(code) {
  if (!code) {
    return { valid: false, message: 'Código de verificación no proporcionado' };
  }

  const prescription = await Prescription.findOne({
    where: { verificationCode: code.trim().toUpperCase() },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            attributes: ['firstName', 'lastName', 'mppsNumber', 'mpps_number'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: User,
        as: 'patient',
        attributes: ['id', 'firstName', 'lastName'],
        include: [
          {
            model: PatientProfile,
            as: 'patientProfile',
            attributes: ['firstName', 'lastName']
          }
        ]
      }
    ]
  });

  if (!prescription) {
    return {
      valid: false,
      message: 'Récipe no encontrado'
    };
  }

  const doctor = prescription.doctor || {};
  const docProfile = doctor.doctorProfile || {};
  const doctorName = `Dr(a). ${docProfile.firstName || doctor.firstName || ''} ${docProfile.lastName || doctor.lastName || ''}`.trim();
  const specialty = docProfile.specialty?.name || 'Medicina General';
  const mpps = docProfile.mppsNumber || docProfile.mpps_number || 'N/A';

  const patient = prescription.patient || {};
  const patientProfile = patient.patientProfile || {};
  const patientInitials = getInitials(
    patientProfile.firstName || patient.firstName,
    patientProfile.lastName || patient.lastName
  );

  const medications = Array.isArray(prescription.items)
    ? prescription.items.map(item => ({
        medication: item.medication,
        presentation: item.presentation || null
      }))
    : [];

  return {
    valid: prescription.status === 'active',
    status: prescription.status,
    date: prescription.createdAt,
    doctorName,
    specialty,
    mpps,
    patientInitials,
    medications
  };
}

module.exports = {
  createPrescription,
  getPrescriptionsByAppointment,
  getPrescriptionForUser,
  getPrescriptionWithDetails,
  voidPrescription,
  verifyPrescription
};

/**
 * medicalDocumentService.js - CITAMED.VE
 * M03 / Semana 6 - Lógica de negocio para documentos médicos (órdenes, reposos, constancias, informes)
 */

const crypto = require('crypto');
const db = require('../models');
const { todayCaracas } = require('../utils/dateCaracas');
const { doctorTitle } = require('./pdf/pdfLayout');
const prescriptionService = require('./prescriptionService');

const {
  MedicalDocument,
  Appointment,
  User,
  DoctorProfile,
  PatientProfile,
  Specialty
} = db;

const ALLOWED_ISSUED_TYPES = ['lab_order', 'rest_note', 'certificate', 'medical_report'];

function getInitials(firstName, lastName) {
  const f = firstName ? firstName.trim()[0].toUpperCase() + '.' : '';
  const l = lastName ? lastName.trim()[0].toUpperCase() + '.' : '';
  return `${f} ${l}`.trim() || 'N/A';
}

function generateVerificationCode() {
  return crypto.randomBytes(8).toString('hex').toUpperCase();
}

/**
 * Carga un documento médico con relaciones
 */
async function getMedicalDocumentWithDetails(id) {
  return await MedicalDocument.findByPk(id, {
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'gender'],
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
        model: User,
        as: 'uploader',
        attributes: ['id', 'firstName', 'lastName', 'role']
      },
      {
        model: Appointment,
        as: 'appointment',
        include: [
          { model: db.Clinic, as: 'clinic' },
          { model: db.ClinicLocation, as: 'clinicLocation' },
          { model: Specialty, as: 'specialty', attributes: ['id', 'name'] }
        ]
      }
    ]
  });
}

/**
 * Emite un nuevo documento médico
 */
async function createDocument({ appointmentId, type, content = {} }, user) {
  if (!ALLOWED_ISSUED_TYPES.includes(type)) {
    const err = new Error(`Tipo de documento inválido: ${type}. Permitidos: ${ALLOWED_ISSUED_TYPES.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const appointment = await Appointment.findByPk(appointmentId, {
    include: [
      { model: User, as: 'patient' }
    ]
  });

  if (!appointment) {
    const err = new Error('Cita no encontrada');
    err.statusCode = 404;
    throw err;
  }

  if (user.role !== 'admin' && appointment.doctorId !== user.id) {
    const err = new Error('No estás autorizado para emitir documentos en esta cita');
    err.statusCode = 403;
    throw err;
  }

  if (!['in_progress', 'completed'].includes(appointment.status)) {
    const err = new Error('Solo se puede emitir un documento durante o después de la consulta (in_progress o completed)');
    err.statusCode = 400;
    throw err;
  }

  let title = '';
  let cleanContent = {};

  switch (type) {
    case 'lab_order': {
      const exams = Array.isArray(content.exams) ? content.exams.map(e => ({
        category: typeof e.category === 'string' ? e.category.slice(0, 100) : '',
        name: typeof e.name === 'string' ? e.name.slice(0, 200) : String(e).slice(0, 200)
      })) : [];

      const otherExams = typeof content.otherExams === 'string' ? content.otherExams.trim().slice(0, 2000) : '';

      if (exams.length === 0 && !otherExams) {
        const err = new Error('La orden de exámenes debe incluir al menos un examen');
        err.statusCode = 400;
        throw err;
      }

      cleanContent = {
        exams,
        otherExams: otherExams || null,
        clinicalIndication: typeof content.clinicalIndication === 'string' ? content.clinicalIndication.trim().slice(0, 2000) : null,
        presumptiveDiagnosis: typeof content.presumptiveDiagnosis === 'string' ? content.presumptiveDiagnosis.trim().slice(0, 2000) : null
      };
      title = 'Orden de Exámenes';
      break;
    }

    case 'rest_note': {
      const days = parseInt(content.days, 10);
      if (isNaN(days) || days < 1 || days > 90) {
        const err = new Error('Los días de reposo deben ser un número entero entre 1 y 90');
        err.statusCode = 400;
        throw err;
      }

      const startDate = content.startDate && typeof content.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(content.startDate.trim())
        ? content.startDate.trim()
        : todayCaracas();

      let endDate = content.endDate && typeof content.endDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(content.endDate.trim())
        ? content.endDate.trim()
        : null;

      if (!endDate) {
        const [y, m, d] = startDate.split('-').map(Number);
        const dt = new Date(y, m - 1, d);
        dt.setDate(dt.getDate() + (days - 1));
        const endY = dt.getFullYear();
        const endM = String(dt.getMonth() + 1).padStart(2, '0');
        const endD = String(dt.getDate()).padStart(2, '0');
        endDate = `${endY}-${endM}-${endD}`;
      }

      cleanContent = {
        days,
        startDate,
        endDate,
        includeDiagnosis: Boolean(content.includeDiagnosis),
        diagnosis: content.includeDiagnosis && typeof content.diagnosis === 'string' ? content.diagnosis.trim().slice(0, 500) : null,
        observations: typeof content.observations === 'string' ? content.observations.trim().slice(0, 2000) : null
      };
      title = `Reposo Médico (${days} días)`;
      break;
    }

    case 'certificate': {
      cleanContent = {
        reason: typeof content.reason === 'string' ? content.reason.trim().slice(0, 500) : null,
        attendedFrom: typeof content.attendedFrom === 'string' ? content.attendedFrom.trim().slice(0, 10) : null,
        attendedTo: typeof content.attendedTo === 'string' ? content.attendedTo.trim().slice(0, 10) : null,
        observations: typeof content.observations === 'string' ? content.observations.trim().slice(0, 2000) : null
      };
      title = 'Constancia Médica';
      break;
    }

    case 'medical_report': {
      if (!content.body || typeof content.body !== 'string' || !content.body.trim()) {
        const err = new Error('El informe médico debe contener un cuerpo de texto');
        err.statusCode = 400;
        throw err;
      }

      cleanContent = {
        body: content.body.trim().slice(0, 10000)
      };
      title = 'Informe Médico';
      break;
    }
  }

  const verificationCode = generateVerificationCode();

  const doc = await MedicalDocument.create({
    type,
    appointmentId: appointment.id,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
    uploadedBy: user.id,
    title,
    content: cleanContent,
    verificationCode,
    status: 'active'
  });

  return await getMedicalDocumentWithDetails(doc.id);
}

/**
 * Obtiene documentos de un paciente con filtrado de privacidad
 */
async function getDocumentsByPatient(patientId, user) {
  const patientIdNum = Number(patientId);

  // El paciente ve todos sus documentos no eliminados
  if (user.role === 'patient') {
    if (user.id !== patientIdNum) {
      const err = new Error('No tienes acceso a los documentos de otro paciente');
      err.statusCode = 403;
      throw err;
    }
    return await MedicalDocument.findAll({
      where: {
        patientId: patientIdNum,
        status: { [db.Sequelize.Op.ne]: 'deleted' }
      },
      order: [['createdAt', 'DESC']]
    });
  }

  // Si es médico: verificar que tenga o haya tenido al menos una cita con el paciente
  if (user.role === 'doctor') {
    const hasAppointment = await Appointment.findOne({
      where: {
        doctorId: user.id,
        patientId: patientIdNum
      }
    });

    if (!hasAppointment) {
      const err = new Error('No tienes acceso a los documentos de este paciente (sin citas previas)');
      err.statusCode = 403;
      throw err;
    }

    // Médico ve: los que él emitió + adjuntos subidos por el paciente
    return await MedicalDocument.findAll({
      where: {
        patientId: patientIdNum,
        status: { [db.Sequelize.Op.ne]: 'deleted' },
        [db.Sequelize.Op.or]: [
          { doctorId: user.id },
          { type: 'attachment', uploadedBy: patientIdNum }
        ]
      },
      order: [['createdAt', 'DESC']]
    });
  }

  // Admin
  return await MedicalDocument.findAll({
    where: {
      patientId: patientIdNum,
      status: { [db.Sequelize.Op.ne]: 'deleted' }
    },
    order: [['createdAt', 'DESC']]
  });
}

/**
 * Obtiene un documento individual con validación estricta de privacidad
 */
async function getDocumentForUser(id, user) {
  const doc = await getMedicalDocumentWithDetails(id);
  if (!doc) {
    const err = new Error('Documento no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (doc.status === 'deleted' && user.role !== 'admin') {
    const err = new Error('Documento no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (user.role === 'admin') return doc;

  // Paciente dueño
  if (doc.patientId === user.id) return doc;

  // Médico emisor
  if (doc.doctorId === user.id) return doc;

  // Médico viendo adjunto del paciente si tiene citas con él
  if (user.role === 'doctor' && doc.type === 'attachment' && doc.uploadedBy === doc.patientId) {
    const hasAppointment = await Appointment.findOne({
      where: {
        doctorId: user.id,
        patientId: doc.patientId
      }
    });
    if (hasAppointment) return doc;
  }

  const err = new Error('No tienes permiso para acceder a este documento');
  err.statusCode = 403;
  throw err;
}

/**
 * Anula un documento emitido (médico emisor o admin)
 */
async function voidDocument(id, user) {
  const doc = await MedicalDocument.findByPk(id);
  if (!doc) {
    const err = new Error('Documento no encontrado');
    err.statusCode = 404;
    throw err;
  }

  if (doc.type === 'attachment') {
    const err = new Error('Los archivos adjuntos no se anulan, deben eliminarse');
    err.statusCode = 400;
    throw err;
  }

  if (user.role !== 'admin' && doc.doctorId !== user.id) {
    const err = new Error('Solo el médico emisor puede anular este documento');
    err.statusCode = 403;
    throw err;
  }

  doc.status = 'voided';
  await doc.save();
  return doc;
}

/**
 * Verificación pública de documento (con unificación a récipes)
 */
async function verifyDocument(code) {
  if (!code) {
    return { valid: false, message: 'Código de verificación no proporcionado' };
  }

  const upperCode = code.trim().toUpperCase();

  const doc = await MedicalDocument.findOne({
    where: { verificationCode: upperCode },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'gender'],
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

  if (doc) {
    const doctor = doc.doctor || {};
    const docProfile = doctor.doctorProfile || {};
    const doctorName = `${doctorTitle(doctor.gender)} ${docProfile.firstName || doctor.firstName || ''} ${docProfile.lastName || doctor.lastName || ''}`.trim();
    const specialty = docProfile.specialty?.name || 'Medicina General';
    const mpps = docProfile.mppsNumber || docProfile.mpps_number || 'N/A';

    const patient = doc.patient || {};
    const patientProfile = patient.patientProfile || {};
    const patientInitials = getInitials(
      patientProfile.firstName || patient.firstName,
      patientProfile.lastName || patient.lastName
    );

    let summary = {};
    const content = doc.content || {};

    switch (doc.type) {
      case 'lab_order':
        summary = {
          exams: Array.isArray(content.exams) ? content.exams.map(e => e.name || e) : [],
          otherExams: content.otherExams || null
        };
        break;
      case 'rest_note':
        summary = {
          days: content.days,
          startDate: content.startDate,
          endDate: content.endDate,
          diagnosis: content.includeDiagnosis ? content.diagnosis : null
        };
        break;
      case 'certificate':
        summary = {
          attendedFrom: content.attendedFrom,
          attendedTo: content.attendedTo
        };
        break;
      case 'medical_report':
        summary = {
          title: doc.title
        };
        break;
    }

    return {
      valid: doc.status === 'active',
      status: doc.status,
      type: doc.type,
      title: doc.title,
      date: doc.createdAt,
      doctorName,
      specialty,
      mpps,
      patientInitials,
      summary
    };
  }

  // Verificación unificada: buscar en prescriptions
  const prescriptionResult = await prescriptionService.verifyPrescription(upperCode);
  if (prescriptionResult && prescriptionResult.valid !== undefined && prescriptionResult.date) {
    return {
      ...prescriptionResult,
      type: 'prescription',
      title: 'Récipe Médico'
    };
  }

  return {
    valid: false,
    message: 'Documento no encontrado'
  };
}

module.exports = {
  createDocument,
  getDocumentsByPatient,
  getDocumentForUser,
  getMedicalDocumentWithDetails,
  voidDocument,
  verifyDocument
};

/**
 * clinicalRecordService.js - CITAMED.VE
 * M03 / Semana 6 - Servicio de Historia Clínica del Paciente (vista médico y vista paciente)
 */

const { Op } = require('sequelize');
const db = require('../models');
const { todayCaracas } = require('../utils/dateCaracas');
const { calculateAge, doctorTitle } = require('./pdf/pdfLayout');

const {
  User,
  DoctorProfile,
  PatientProfile,
  PatientAllergy,
  PatientMedicalHistory,
  PatientMedication,
  Appointment,
  Prescription,
  MedicalDocument,
  Specialty
} = db;

/**
 * Obtiene lista de pacientes de un médico con paginación y búsqueda
 */
async function getDoctorPatients(doctorId, { search = '', page = 1, limit = 20 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 20));
  const offset = (pageNum - 1) * limitNum;

  // 1. Obtener IDs únicos de pacientes con los que el médico tiene o tuvo citas
  const appointmentsWithDoctor = await Appointment.findAll({
    attributes: ['patientId'],
    where: { doctorId },
    group: ['patientId']
  });

  const patientIds = appointmentsWithDoctor.map(a => a.patientId).filter(Boolean);

  if (patientIds.length === 0) {
    return {
      patients: [],
      pagination: {
        total: 0,
        page: pageNum,
        limit: limitNum,
        totalPages: 0
      }
    };
  }

  // 2. Filtro de búsqueda por nombre o cédula
  const userWhere = {
    id: { [Op.in]: patientIds }
  };

  const profileWhere = {};
  const trimmedSearch = (search || '').trim();

  if (trimmedSearch) {
    userWhere[Op.or] = [
      { firstName: { [Op.iLike]: `%${trimmedSearch}%` } },
      { lastName: { [Op.iLike]: `%${trimmedSearch}%` } },
      { '$patientProfile.identification_number$': { [Op.iLike]: `%${trimmedSearch}%` } }
    ];
  }

  const { count, rows: patients } = await User.findAndCountAll({
    where: userWhere,
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'gender'],
    include: [
      {
        model: PatientProfile,
        as: 'patientProfile',
        attributes: ['id', 'identificationType', 'identificationNumber', 'dateOfBirth', 'bloodType'],
        required: false
      }
    ],
    order: [['lastName', 'ASC'], ['firstName', 'ASC']],
    limit: limitNum,
    offset,
    subQuery: false
  });

  const today = todayCaracas();

  // 3. Complementar cada paciente con última consulta y próxima cita
  const patientCards = await Promise.all(
    patients.map(async (p) => {
      const patientId = p.id;
      const profile = p.patientProfile || {};

      // Última consulta completada
      const lastCompleted = await Appointment.findOne({
        where: {
          doctorId,
          patientId,
          status: 'completed'
        },
        order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']],
        attributes: ['id', 'appointmentDate', 'appointmentTime', 'diagnosis']
      });

      // Próxima cita programada
      const nextAppointment = await Appointment.findOne({
        where: {
          doctorId,
          patientId,
          status: { [Op.in]: ['pending', 'confirmed'] },
          appointmentDate: { [Op.gte]: today }
        },
        order: [['appointmentDate', 'ASC'], ['appointmentTime', 'ASC']],
        attributes: ['id', 'appointmentDate', 'appointmentTime', 'status']
      });

      return {
        id: patientId,
        firstName: p.firstName,
        lastName: p.lastName,
        fullName: `${p.firstName} ${p.lastName}`.trim(),
        email: p.email,
        phone: p.phone,
        gender: p.gender,
        identificationNumber: profile.identificationNumber
          ? `${profile.identificationType || 'V'}-${profile.identificationNumber}`
          : 'No registrada',
        age: calculateAge(profile.dateOfBirth),
        bloodType: profile.bloodType || null,
        lastConsultation: lastCompleted
          ? {
              id: lastCompleted.id,
              date: lastCompleted.appointmentDate,
              time: lastCompleted.appointmentTime,
              diagnosis: lastCompleted.diagnosis
            }
          : null,
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              date: nextAppointment.appointmentDate,
              time: nextAppointment.appointmentTime,
              status: nextAppointment.status
            }
          : null
      };
    })
  );

  return {
    patients: patientCards,
    pagination: {
      total: count,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(count / limitNum)
    }
  };
}

/**
 * Obtiene la ficha clínica completa de un paciente para el médico
 */
async function getPatientRecordForDoctor(patientId, doctorId, userRole) {
  const patientIdNum = Number(patientId);

  // Verificación de acceso: médico debe tener al menos una cita con el paciente
  if (userRole !== 'admin') {
    const hasAppointment = await Appointment.findOne({
      where: {
        doctorId,
        patientId: patientIdNum
      }
    });

    if (!hasAppointment) {
      const err = new Error('No tienes acceso al expediente de este paciente (sin citas previas)');
      err.statusCode = 403;
      throw err;
    }
  }

  // 1. Datos del paciente con perfil completo
  const patient = await User.findByPk(patientIdNum, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'gender'],
    include: [
      {
        model: PatientProfile,
        as: 'patientProfile',
        include: [
          {
            model: PatientAllergy,
            as: 'patientAllergies',
            order: [['severity', 'DESC']]
          },
          {
            model: PatientMedicalHistory,
            as: 'medicalHistory',
            order: [['diagnosedDate', 'DESC']]
          },
          {
            model: PatientMedication,
            as: 'medications',
            order: [['isActive', 'DESC'], ['startDate', 'DESC']]
          }
        ]
      }
    ]
  });

  if (!patient) {
    const err = new Error('Paciente no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const profile = patient.patientProfile || {};

  // 2. Consultas completadas o en curso DE ESE MÉDICO con ese paciente
  const appointments = await Appointment.findAll({
    where: {
      patientId: patientIdNum,
      doctorId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    },
    include: [
      {
        model: Prescription,
        as: 'prescriptions'
      },
      {
        model: MedicalDocument,
        as: 'medicalDocuments',
        where: { status: { [Op.ne]: 'deleted' } },
        required: false
      }
    ],
    order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
  });

  // 3. Documentos emitidos por ese médico para ese paciente
  const documents = await MedicalDocument.findAll({
    where: {
      patientId: patientIdNum,
      doctorId,
      status: { [Op.ne]: 'deleted' }
    },
    order: [['createdAt', 'DESC']]
  });

  // 4. Récipes emitidos por ese médico para ese paciente
  const prescriptions = await Prescription.findAll({
    where: {
      patientId: patientIdNum,
      doctorId
    },
    order: [['createdAt', 'DESC']]
  });

  // 5. Archivos adjuntos subidos por el propio paciente
  const patientAttachments = await MedicalDocument.findAll({
    where: {
      patientId: patientIdNum,
      type: 'attachment',
      uploadedBy: patientIdNum,
      status: { [Op.ne]: 'deleted' }
    },
    order: [['createdAt', 'DESC']]
  });

  // 6. Serie de signos vitales (peso, IMC, tensión arterial) ordenada cronológicamente
  const vitalsSeries = appointments
    .filter(a => a.vitalSigns && typeof a.vitalSigns === 'object')
    .map(a => ({
      date: a.appointmentDate,
      weightKg: a.vitalSigns.weightKg || null,
      bmi: a.vitalSigns.bmi || null,
      systolic: a.vitalSigns.systolic || null,
      diastolic: a.vitalSigns.diastolic || null,
      heartRate: a.vitalSigns.heartRate || null,
      temperature: a.vitalSigns.temperature || null,
      oxygenSaturation: a.vitalSigns.oxygenSaturation || null,
      glucose: a.vitalSigns.glucose || null
    }))
    .reverse(); // Cronológico ascendente para gráficos

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      email: patient.email,
      phone: patient.phone,
      gender: patient.gender,
      identificationNumber: profile.identificationNumber
        ? `${profile.identificationType || 'V'}-${profile.identificationNumber}`
        : 'No registrada',
      age: calculateAge(profile.dateOfBirth),
      dateOfBirth: profile.dateOfBirth || null,
      bloodType: profile.bloodType || null
    },
    allergies: profile.patientAllergies || [],
    medicalHistory: profile.medicalHistory || [],
    medications: profile.medications || [],
    consultations: appointments,
    documents,
    prescriptions,
    patientAttachments,
    vitalsSeries
  };
}

/**
 * Agrega una alergia al paciente desde la vista del médico
 */
async function addPatientAllergy(patientId, doctorId, userRole, data = {}) {
  const patientIdNum = Number(patientId);

  // Comprobar citas previas
  if (userRole !== 'admin') {
    const hasAppt = await Appointment.findOne({
      where: { doctorId, patientId: patientIdNum }
    });
    if (!hasAppt) {
      const err = new Error('No tienes acceso para registrar alergias a este paciente');
      err.statusCode = 403;
      throw err;
    }
  }

  const { allergen, allergyType = 'medication', severity = 'mild', reaction, notes } = data;

  if (!allergen || typeof allergen !== 'string' || !allergen.trim()) {
    const err = new Error('El nombre del alérgeno es obligatorio');
    err.statusCode = 400;
    throw err;
  }

  const validTypes = ['medication', 'food', 'environmental', 'other'];
  if (!validTypes.includes(allergyType)) {
    const err = new Error(`Tipo de alergia inválido. Permitidos: ${validTypes.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const validSeverities = ['mild', 'moderate', 'severe', 'life_threatening'];
  if (severity && !validSeverities.includes(severity)) {
    const err = new Error(`Severidad inválida. Permitidos: ${validSeverities.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const profile = await PatientProfile.findOne({
    where: { userId: patientIdNum }
  });

  if (!profile) {
    const err = new Error('El paciente no tiene un perfil clínico configurado');
    err.statusCode = 400;
    throw err;
  }

  const newAllergy = await PatientAllergy.create({
    patientProfileId: profile.id,
    allergen: allergen.trim().slice(0, 200),
    allergyType,
    severity: severity || 'mild',
    reaction: typeof reaction === 'string' ? reaction.trim().slice(0, 2000) : null,
    notes: typeof notes === 'string' ? notes.trim().slice(0, 2000) : null,
    diagnosedDate: todayCaracas()
  });

  return newAllergy;
}

/**
 * Agrega un antecedente / condición al paciente desde la vista del médico
 */
async function addPatientCondition(patientId, doctorUser, data = {}) {
  const patientIdNum = Number(patientId);

  // Comprobar citas previas
  if (doctorUser.role !== 'admin') {
    const hasAppt = await Appointment.findOne({
      where: { doctorId: doctorUser.id, patientId: patientIdNum }
    });
    if (!hasAppt) {
      const err = new Error('No tienes acceso para registrar antecedentes a este paciente');
      err.statusCode = 403;
      throw err;
    }
  }

  const { condition, status = 'active', severity, diagnosedDate, notes } = data;

  if (!condition || typeof condition !== 'string' || !condition.trim()) {
    const err = new Error('El nombre de la condición es obligatorio');
    err.statusCode = 400;
    throw err;
  }

  const validStatuses = ['active', 'resolved', 'chronic'];
  if (!validStatuses.includes(status)) {
    const err = new Error(`Estado de condición inválido. Permitidos: ${validStatuses.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const validSeverities = ['mild', 'moderate', 'severe'];
  if (severity && !validSeverities.includes(severity)) {
    const err = new Error(`Severidad inválida. Permitidos: ${validSeverities.join(', ')}`);
    err.statusCode = 400;
    throw err;
  }

  const profile = await PatientProfile.findOne({
    where: { userId: patientIdNum }
  });

  if (!profile) {
    const err = new Error('El paciente no tiene un perfil clínico configurado');
    err.statusCode = 400;
    throw err;
  }

  // diagnosedBy: guardar NOMBRE del médico con su título (STRING 200)
  // req.user no trae nombre ni género, por eso se leen de la base
  const doctorData = await User.findByPk(doctorUser.id, {
    attributes: ['firstName', 'lastName', 'gender']
  });
  const doctorName = doctorData
    ? `${doctorTitle(doctorData.gender)} ${doctorData.firstName || ''} ${doctorData.lastName || ''}`.trim().slice(0, 200)
    : '';

  const newCondition = await PatientMedicalHistory.create({
    patientProfileId: profile.id,
    condition: condition.trim().slice(0, 200),
    status,
    severity: severity || null,
    diagnosedDate: diagnosedDate && /^\d{4}-\d{2}-\d{2}$/.test(diagnosedDate) ? diagnosedDate : todayCaracas(),
    notes: typeof notes === 'string' ? notes.trim().slice(0, 2000) : null,
    diagnosedBy: doctorName || 'Médico tratante'
  });

  return newCondition;
}

/**
 * Obtiene la historia clínica del propio paciente con TODOS sus médicos
 * ESTRICTO: NUNCA incluye doctorNotes en ninguna parte de la respuesta.
 */
async function getMyClinicalRecord(patientUserId) {
  const patient = await User.findByPk(patientUserId, {
    attributes: ['id', 'firstName', 'lastName', 'email', 'phone', 'gender'],
    include: [
      {
        model: PatientProfile,
        as: 'patientProfile',
        include: [
          { model: PatientAllergy, as: 'patientAllergies', order: [['severity', 'DESC']] },
          { model: PatientMedicalHistory, as: 'medicalHistory', order: [['diagnosedDate', 'DESC']] },
          { model: PatientMedication, as: 'medications', order: [['isActive', 'DESC']] }
        ]
      }
    ]
  });

  if (!patient) {
    const err = new Error('Paciente no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const profile = patient.patientProfile || {};

  // Consultas con todos los médicos (sin doctorNotes)
  const rawAppointments = await Appointment.findAll({
    where: {
      patientId: patientUserId,
      status: { [Op.in]: ['in_progress', 'completed'] }
    },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'gender'],
        include: [
          {
            model: DoctorProfile,
            as: 'doctorProfile',
            attributes: ['clinicName', 'clinicAddress'],
            include: [{ model: Specialty, as: 'specialty', attributes: ['id', 'name'] }]
          }
        ]
      },
      {
        model: Prescription,
        as: 'prescriptions'
      },
      {
        model: MedicalDocument,
        as: 'medicalDocuments',
        where: { status: { [Op.ne]: 'deleted' } },
        required: false
      }
    ],
    order: [['appointmentDate', 'DESC'], ['appointmentTime', 'DESC']]
  });

  // Limpieza estricta: garantizar que doctorNotes no exista en ningún nivel
  const sanitizedConsultations = rawAppointments.map(a => {
    const doc = a.doctor || {};
    const docProfile = doc.doctorProfile || {};
    const docTitle = doctorTitle(doc.gender);
    const doctorFullName = `${docTitle} ${doc.firstName || ''} ${doc.lastName || ''}`.trim();
    const specialtyName = docProfile.specialty?.name || 'Medicina General';

    return {
      id: a.id,
      appointmentDate: a.appointmentDate,
      appointmentTime: a.appointmentTime,
      status: a.status,
      appointmentType: a.appointmentType,
      reasonForVisit: a.reasonForVisit,
      soapNote: a.soapNote || null,
      vitalSigns: a.vitalSigns || null,
      physicalExam: a.physicalExam || null,
      diagnosis: a.diagnosis || null,
      treatment: a.treatment || null,
      doctor: {
        id: doc.id,
        fullName: doctorFullName,
        specialty: specialtyName,
        clinicName: docProfile.clinicName || null
      },
      prescriptions: a.prescriptions || [],
      medicalDocuments: a.medicalDocuments || []
      // doctorNotes EXPLÍCITAMENTE OMITIDO
    };
  });

  // Todos los documentos médicos emitidos o archivos
  const documents = await MedicalDocument.findAll({
    where: {
      patientId: patientUserId,
      status: { [Op.ne]: 'deleted' }
    },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'gender']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Todos los récipes
  const prescriptions = await Prescription.findAll({
    where: {
      patientId: patientUserId
    },
    include: [
      {
        model: User,
        as: 'doctor',
        attributes: ['id', 'firstName', 'lastName', 'gender']
      }
    ],
    order: [['createdAt', 'DESC']]
  });

  // Archivos subidos por el paciente
  const attachments = documents.filter(d => d.type === 'attachment');
  const issuedDocuments = documents.filter(d => d.type !== 'attachment');

  return {
    patient: {
      id: patient.id,
      firstName: patient.firstName,
      lastName: patient.lastName,
      fullName: `${patient.firstName} ${patient.lastName}`.trim(),
      email: patient.email,
      phone: patient.phone,
      gender: patient.gender,
      identificationNumber: profile.identificationNumber
        ? `${profile.identificationType || 'V'}-${profile.identificationNumber}`
        : 'No registrada',
      age: calculateAge(profile.dateOfBirth),
      dateOfBirth: profile.dateOfBirth || null,
      bloodType: profile.bloodType || null
    },
    allergies: profile.patientAllergies || [],
    medicalHistory: profile.medicalHistory || [],
    medications: profile.medications || [],
    consultations: sanitizedConsultations,
    prescriptions,
    documents: issuedDocuments,
    attachments
  };
}

module.exports = {
  getDoctorPatients,
  getPatientRecordForDoctor,
  addPatientAllergy,
  addPatientCondition,
  getMyClinicalRecord
};

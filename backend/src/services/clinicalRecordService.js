/**
 * clinicalRecordService.js - CITAMED.VE
 * M03 / Semana 6 - Servicio de Historia Clínica del Paciente (vista médico y vista paciente)
 */

const { Op } = require('sequelize');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const { formatCedula, normalizeCedula, normalizePhoneVE } = require('../utils/identity');
const db = require('../models');
const { todayCaracas } = require('../utils/dateCaracas');
const { calculateAge, doctorTitle } = require('./pdf/pdfLayout');
const auditService = require('./auditService');

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
          ? formatCedula(profile.identificationNumber)
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
        ? formatCedula(profile.identificationNumber)
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
        ? formatCedula(profile.identificationNumber)
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

/**
 * Extrae valor de una fila buscando por varias claves o variantes
 */
function getRowValue(row, ...keys) {
  if (!row || typeof row !== 'object') return null;
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== null && String(row[k]).trim() !== '') {
      return String(row[k]).trim();
    }
  }
  const rowKeys = Object.keys(row);
  for (const k of keys) {
    const lowerK = k.toLowerCase().replace(/[\s_-]/g, '');
    for (const rk of rowKeys) {
      const cleanRk = rk.toLowerCase().replace(/[\s_-]/g, '');
      if (cleanRk === lowerK && row[rk] !== undefined && row[rk] !== null && String(row[rk]).trim() !== '') {
        return String(row[rk]).trim();
      }
    }
  }
  return null;
}

/**
 * Importa pacientes desde un arreglo de filas (Excel / CSV)
 * @param {number} doctorId - ID del médico
 * @param {Array} rawRows - Filas a importar (máx. 500)
 * @param {Object} user - Usuario autenticado (o actuando en nombre del médico)
 */
async function importPatientsFromExcel(doctorId, rawRows, user) {
  if (!Array.isArray(rawRows)) {
    const err = new Error('Se requiere un listado de filas para la importación');
    err.statusCode = 400;
    throw err;
  }

  if (rawRows.length === 0) {
    const err = new Error('El listado no contiene filas');
    err.statusCode = 400;
    throw err;
  }

  if (rawRows.length > 500) {
    const err = new Error('Máximo 500 filas por envío');
    err.statusCode = 400;
    throw err;
  }

  const doctorProfile = await DoctorProfile.findOne({ where: { userId: doctorId } });
  const doctorProfileId = doctorProfile?.id || null;

  const summary = {
    total: rawRows.length,
    created: 0,
    linked: 0,
    alreadyLinked: 0,
    errors: 0,
    errorRows: []
  };

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 1;

    const firstName = getRowValue(row, 'nombre', 'firstName', 'nombres');
    const lastName = getRowValue(row, 'apellido', 'lastName', 'apellidos');
    const cedulaRaw = getRowValue(row, 'cedula', 'identificationNumber', 'ci', 'identificacion');
    const phoneRaw = getRowValue(row, 'telefono', 'phone', 'celular', 'tlf');
    const emailRaw = getRowValue(row, 'correo', 'email', 'correo_electronico');
    const dobRaw = getRowValue(row, 'fecha_nacimiento', 'dateOfBirth', 'nacimiento', 'fechaNacimiento');
    const genderRaw = getRowValue(row, 'sexo', 'gender');
    const allergiesRaw = getRowValue(row, 'alergias', 'allergies');

    // 1. Validar nombre y apellido
    if (!firstName || !lastName) {
      summary.errors++;
      summary.errorRows.push({
        row: rowNum,
        cedula: cedulaRaw || '',
        error: 'El nombre y apellido son obligatorios'
      });
      continue;
    }

    // 2. Validar cédula
    if (!cedulaRaw) {
      summary.errors++;
      summary.errorRows.push({
        row: rowNum,
        cedula: '',
        error: 'La cédula es obligatoria'
      });
      continue;
    }

    let type = 'V';
    const upperCed = cedulaRaw.toUpperCase();
    if (upperCed.startsWith('E')) {
      type = 'E';
    }
    const digits = cedulaRaw.replace(/\D/g, '');
    let normalizedCedula = null;
    try {
      normalizedCedula = normalizeCedula(type, digits);
    } catch (cedErr) {
      summary.errors++;
      summary.errorRows.push({
        row: rowNum,
        cedula: cedulaRaw,
        error: cedErr.message || 'Cédula no válida'
      });
      continue;
    }

    // 3. Validar teléfono
    let normalizedPhone = null;
    try {
      normalizedPhone = normalizePhoneVE(phoneRaw);
    } catch (phoneErr) {
      summary.errors++;
      summary.errorRows.push({
        row: rowNum,
        cedula: normalizedCedula,
        error: phoneErr.message || 'Teléfono no válido'
      });
      continue;
    }

    // 4. Validar correo opcional
    let cleanEmail = null;
    if (emailRaw) {
      cleanEmail = emailRaw.toLowerCase();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(cleanEmail)) {
        summary.errors++;
        summary.errorRows.push({
          row: rowNum,
          cedula: normalizedCedula,
          error: 'El formato del correo electrónico es inválido'
        });
        continue;
      }
    }

    // 5. Fecha de nacimiento opcional
    let parsedDob = null;
    if (dobRaw) {
      const dmy = dobRaw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
      if (dmy) {
        parsedDob = `${dmy[3]}-${dmy[2].padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(dobRaw)) {
        parsedDob = dobRaw;
      }
    }

    // 6. Sexo opcional
    let userGender = 'prefiero_no_decir';
    let profileGender = 'prefer_not_to_say';
    if (genderRaw) {
      const g = genderRaw.toLowerCase();
      if (g.startsWith('f') || g === 'mujer') {
        userGender = 'femenino';
        profileGender = 'female';
      } else if (g.startsWith('m') || g === 'hombre') {
        userGender = 'masculino';
        profileGender = 'male';
      } else if (g.startsWith('o')) {
        userGender = 'otro';
        profileGender = 'other';
      }
    }

    // 7. Base de datos con transacción individual por fila
    const transaction = await db.sequelize.transaction();
    try {
      let targetProfile = await PatientProfile.findOne({
        where: { identificationNumber: normalizedCedula },
        transaction
      });

      let targetUser = null;
      if (targetProfile) {
        targetUser = await User.findByPk(targetProfile.userId, { transaction });
      } else if (cleanEmail) {
        targetUser = await User.findOne({
          where: { email: cleanEmail },
          transaction
        });
        if (targetUser) {
          targetProfile = await PatientProfile.findOne({
            where: { userId: targetUser.id },
            transaction
          });
        }
      }

      if (targetUser && targetProfile) {
        // Verificar si ya tiene citas con este médico
        const existingAppointment = await Appointment.findOne({
          where: { doctorId, patientId: targetUser.id },
          transaction
        });

        if (existingAppointment) {
          summary.alreadyLinked++;
        } else {
          await Appointment.create({
            doctorId,
            patientId: targetUser.id,
            doctorProfileId,
            appointmentDate: todayCaracas(),
            appointmentTime: '08:00:00',
            // Vínculo médico-paciente, no es una consulta: cancelada por el sistema para que no cuente
            // como consulta realizada, no salga en "Por cobrar" y la agenda la oculte por defecto
            status: 'cancelled_doctor',
            cancelledBy: 'system',
            cancellationReason: 'Paciente importado desde Excel (vínculo con el médico, no es una consulta)',
            appointmentType: 'first_consultation',
            reasonForVisit: 'Importación de paciente desde Excel'
          }, { transaction });
          summary.linked++;
        }
      } else {
        // Crear usuario sin reclamar y perfil
        const finalEmail = cleanEmail || `paciente.${uuidv4()}@sin-correo.citamed.ve`;
        const randomPassword = crypto.randomBytes(32).toString('hex');

        targetUser = await User.create({
          role: 'patient',
          firstName,
          lastName,
          phone: normalizedPhone,
          email: finalEmail,
          password: randomPassword,
          dateOfBirth: parsedDob || null,
          gender: userGender,
          isActive: true,
          accountClaimed: false
        }, { transaction });

        targetProfile = await PatientProfile.create({
          userId: targetUser.id,
          firstName,
          lastName,
          identificationType: 'CI',
          identificationNumber: normalizedCedula,
          phoneNumber: normalizedPhone,
          dateOfBirth: parsedDob || null,
          gender: profileGender,
          profileStatus: 'active',
          consentForDataSharing: true
        }, { transaction });

        await Appointment.create({
          doctorId,
          patientId: targetUser.id,
          doctorProfileId,
          appointmentDate: todayCaracas(),
          appointmentTime: '08:00:00',
          // Vínculo médico-paciente, no es una consulta: cancelada por el sistema para que no cuente
          // como consulta realizada, no salga en "Por cobrar" y la agenda la oculte por defecto
          status: 'cancelled_doctor',
          cancelledBy: 'system',
          cancellationReason: 'Paciente importado desde Excel (vínculo con el médico, no es una consulta)',
          appointmentType: 'first_consultation',
          reasonForVisit: 'Importación de paciente desde Excel'
        }, { transaction });

        summary.created++;
      }

      // Registro de alergias si vienen especificadas
      if (allergiesRaw && targetProfile) {
        const allergens = allergiesRaw
          .split(/[,;\n]/)
          .map((s) => s.trim())
          .filter((s) => s.length >= 2);

        for (const allergen of allergens) {
          const existingAllergy = await PatientAllergy.findOne({
            where: { patientProfileId: targetProfile.id, allergen },
            transaction
          });
          if (!existingAllergy) {
            await PatientAllergy.create({
              patientProfileId: targetProfile.id,
              allergyType: 'other',
              allergen: allergen.slice(0, 200),
              severity: 'moderate',
              diagnosedDate: todayCaracas()
            }, { transaction });
          }
        }
      }

      await transaction.commit();
    } catch (rowErr) {
      await transaction.rollback();
      summary.errors++;
      summary.errorRows.push({
        row: rowNum,
        cedula: normalizedCedula || cedulaRaw,
        error: rowErr.message || 'Error en base de datos al guardar fila'
      });
    }
  }

  // 8. Registro de auditoría
  try {
    await auditService.log({
      userId: user.actingAssistantId || user.id,
      action: 'patients_imported_excel',
      resource: 'patients',
      resourceId: doctorId,
      metadata: {
        total: summary.total,
        created: summary.created,
        linked: summary.linked,
        alreadyLinked: summary.alreadyLinked,
        errors: summary.errors,
        onBehalfOfDoctorId: user.actingAssistantId ? doctorId : undefined
      }
    });
  } catch (auditErr) {
    console.error('[clinicalRecordService] Error registrando auditoría de importación:', auditErr);
  }

  return summary;
}

module.exports = {
  getDoctorPatients,
  getPatientRecordForDoctor,
  addPatientAllergy,
  addPatientCondition,
  getMyClinicalRecord,
  importPatientsFromExcel
};


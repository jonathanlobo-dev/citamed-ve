/**
 * Authentication Service - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Servicio con lógica de negocio para:
 * - Registro de pacientes (4 pasos)
 * - Registro de médicos (6 pasos)
 * - Registro de proveedores (5 pasos)
 */

const jwt = require('jsonwebtoken');
const { User, PatientProfile, DoctorProfile, ProviderProfile, VerificationRequest, sequelize } = require('../models');

/**
 * Genera token JWT para un usuario
 * @param {Object} user - Usuario de la base de datos
 * @returns {string} Token JWT
 */
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

/**
 * Verifica si un email ya está registrado
 * @param {string} email - Email a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const emailExists = async (email) => {
  const user = await User.findOne({ where: { email: email.toLowerCase() } });
  return !!user;
};

/**
 * Verifica si una cédula ya está registrada
 * @param {string} identificationNumber - Cédula a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const cedulaExists = async (identificationNumber) => {
  const profile = await PatientProfile.findOne({
    where: { identificationNumber: identificationNumber.toUpperCase() }
  });
  return !!profile;
};

/**
 * Verifica si un número MPPS ya está registrado
 * @param {string} mppsNumber - Número MPPS a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const mppsExists = async (mppsNumber) => {
  const profile = await DoctorProfile.findOne({
    where: { mppsNumber: mppsNumber.toUpperCase() }
  });
  return !!profile;
};

/**
 * Verifica si un RIF ya está registrado
 * @param {string} rif - RIF a verificar
 * @returns {Promise<boolean>} true si existe, false si no
 */
const rifExists = async (rif) => {
  const profile = await ProviderProfile.findOne({
    where: { rif: rif.toUpperCase() }
  });
  return !!profile;
};

/**
 * Crea un nuevo paciente con su perfil
 * Usado para el registro multi-paso de pacientes
 *
 * @param {Object} data - Datos del paciente
 * @param {string} data.email - Email del paciente
 * @param {string} data.password - Contraseña
 * @param {string} data.firstName - Nombre
 * @param {string} data.lastName - Apellido
 * @param {string} data.identificationNumber - Cédula
 * @param {string} data.dateOfBirth - Fecha de nacimiento
 * @param {string} data.gender - Género
 * @param {string} data.phone - Teléfono
 * @param {string} data.allergies - Alergias (opcional)
 * @param {string} data.chronicConditions - Condiciones crónicas (opcional)
 * @param {string} data.bloodType - Tipo de sangre
 * @param {string} data.emergencyContactName - Nombre contacto emergencia
 * @param {string} data.emergencyContactPhone - Teléfono contacto emergencia
 * @returns {Promise<Object>} Usuario, perfil y token
 */
const createPatient = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    // Verificar email único
    if (await emailExists(data.email)) {
      throw new Error('EMAIL_EXISTS');
    }

    // Verificar cédula única
    if (data.identificationNumber && await cedulaExists(data.identificationNumber)) {
      throw new Error('CEDULA_EXISTS');
    }

    // Crear usuario
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: mapGender(data.gender),
      role: 'patient',
      isActive: true,
      isVerified: false // Pendiente verificación email
    }, { transaction });

    // Convertir allergies y chronicConditions a arrays
    const allergiesArray = data.allergies
      ? data.allergies.split(',').map(a => a.trim()).filter(a => a)
      : [];
    const chronicConditionsArray = data.chronicConditions
      ? data.chronicConditions.split(',').map(c => c.trim()).filter(c => c)
      : [];

    // Crear perfil de paciente
    const profile = await PatientProfile.create({
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: mapGenderProfile(data.gender),
      identificationNumber: data.identificationNumber ? data.identificationNumber.toUpperCase() : null,
      identificationType: 'CI',
      bloodType: data.bloodType || 'unknown',
      allergies: allergiesArray,
      chronicConditions: chronicConditionsArray,
      emergencyContactName: data.emergencyContactName || null,
      emergencyContactPhone: data.emergencyContactPhone || null,
      emergencyContactRelationship: data.emergencyContactRelationship || null,
      profileStatus: 'active',
      consentForDataSharing: true
    }, { transaction });

    await transaction.commit();

    // Generar token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `${user.firstName} ${user.lastName}`,
        phone: user.phone,
        role: user.role
      },
      profile,
      token
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Crea un nuevo médico con su perfil
 * Usado para el registro multi-paso de médicos
 *
 * @param {Object} data - Datos del médico
 * @returns {Promise<Object>} Usuario, perfil y token
 */
const createDoctor = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    // Verificar email único
    if (await emailExists(data.email)) {
      throw new Error('EMAIL_EXISTS');
    }

    // Verificar MPPS único
    if (data.mppsNumber && await mppsExists(data.mppsNumber)) {
      throw new Error('MPPS_EXISTS');
    }

    // Crear usuario
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone || null,
      dateOfBirth: data.dateOfBirth || null,
      gender: mapGender(data.gender),
      role: 'doctor',
      isActive: true,
      isVerified: false
    }, { transaction });

    // Crear perfil de médico
    const profile = await DoctorProfile.create({
      userId: user.id,
      firstName: data.firstName,
      lastName: data.lastName,
      phoneNumber: data.phone || null,
      licenseNumber: data.mppsNumber || `TEMP-${Date.now()}`,
      mppsNumber: data.mppsNumber ? data.mppsNumber.toUpperCase() : null,
      medicalSchool: data.university || null,
      graduationYear: data.graduationYear ? parseInt(data.graduationYear) : null,
      specialtyId: data.specialtyId ? parseInt(data.specialtyId) : null,
      experienceYears: data.experienceYears ? parseInt(data.experienceYears) : 0,
      clinicAddress: data.consultationAddress || null,
      city: data.city || null,
      state: data.state || null,
      coordinates: data.latitude && data.longitude ? { lat: data.latitude, lng: data.longitude } : null,
      availableDays: data.availableDays || [],
      startTime: data.startTime || null,
      endTime: data.endTime || null,
      consultationDuration: data.consultationDuration ? parseInt(data.consultationDuration) : 30,
      consultationFee: data.priceConsultation ? parseFloat(data.priceConsultation) : 0,
      priceTeleconsultation: data.priceTeleconsultation ? parseFloat(data.priceTeleconsultation) : null,
      priceHomeVisit: data.priceHomeVisit ? parseFloat(data.priceHomeVisit) : null,
      homeVisitsEnabled: data.acceptsHomeVisits || false,
      telemedicineEnabled: !!data.priceTeleconsultation,
      acceptsInsurance: data.acceptsInsurance || false,
      acceptedInsurances: data.acceptedInsurances || null,
      profileStatus: 'pending_review', // Médicos requieren aprobación
      isVerified: false
    }, { transaction });

    // Crear solicitud de verificación KYC automáticamente para que el admin
    // la vea en la cola (/admin/verificacion) y pueda aprobar o rechazar
    await VerificationRequest.create({
      doctorProfileId: profile.id,
      status: 'submitted'
    }, { transaction });

    await transaction.commit();

    // Generar token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: `Dr. ${user.firstName} ${user.lastName}`,
        phone: user.phone,
        role: user.role
      },
      profile,
      token,
      requiresApproval: true // Médicos requieren aprobación
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Crea un nuevo proveedor con su perfil
 * Usado para el registro multi-paso de proveedores
 *
 * @param {Object} data - Datos del proveedor
 * @returns {Promise<Object>} Usuario, perfil y token
 */
const createProvider = async (data) => {
  const transaction = await sequelize.transaction();

  try {
    // Verificar email único
    if (await emailExists(data.email)) {
      throw new Error('EMAIL_EXISTS');
    }

    // Verificar RIF único
    if (data.rif && await rifExists(data.rif)) {
      throw new Error('RIF_EXISTS');
    }

    // Crear usuario
    const user = await User.create({
      email: data.email.toLowerCase(),
      password: data.password,
      firstName: data.legalRepresentative || data.companyName,
      lastName: '',
      phone: data.commercialPhone || null,
      role: 'provider',
      isActive: true,
      isVerified: false
    }, { transaction });

    // Mapear tipo de proveedor
    const providerTypeMap = {
      'Farmacia': 'pharmacy',
      'Laboratorio clínico': 'laboratory',
      'Laboratorio': 'laboratory',
      'Insumos médicos': 'supplies',
      'Servicios de salud': 'services',
      'Clínica': 'clinic',
      'Hospital': 'hospital',
      'Centro de Diagnóstico': 'diagnostic_center',
      'Otro': 'other'
    };

    // Crear perfil de proveedor
    const profile = await ProviderProfile.create({
      userId: user.id,
      companyName: data.companyName,
      rif: data.rif ? data.rif.toUpperCase() : null,
      legalName: data.legalName || data.companyName,
      commercialPhone: data.commercialPhone || null,
      contactEmail: data.contactEmail || data.email,
      legalRepresentative: data.legalRepresentative || null,
      providerType: providerTypeMap[data.providerType] || 'other',
      description: data.description || null,
      mainProducts: data.mainProducts || null,
      mainAddress: data.mainAddress || null,
      city: data.city || null,
      state: data.state || null,
      coverageZones: data.coverageZones || null,
      hasMultipleLocations: data.hasMultipleLocations || false,
      locationCount: data.locationCount ? parseInt(data.locationCount) : 1,
      verificationStatus: 'pending' // Proveedores requieren aprobación
    }, { transaction });

    await transaction.commit();

    // Generar token
    const token = generateToken(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        name: data.companyName,
        phone: user.phone,
        role: user.role
      },
      profile,
      token,
      requiresApproval: true // Proveedores requieren aprobación
    };

  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

/**
 * Mapea género del frontend al formato del modelo User
 */
const mapGender = (gender) => {
  const map = {
    'male': 'masculino',
    'female': 'femenino',
    'other': 'otro',
    'prefer_not_to_say': 'prefiero_no_decir'
  };
  return map[gender] || 'prefiero_no_decir';
};

/**
 * Mapea género del frontend al formato del modelo PatientProfile
 */
const mapGenderProfile = (gender) => {
  const validGenders = ['male', 'female', 'other', 'prefer_not_to_say'];
  return validGenders.includes(gender) ? gender : 'prefer_not_to_say';
};

module.exports = {
  generateToken,
  emailExists,
  cedulaExists,
  mppsExists,
  rifExists,
  createPatient,
  createDoctor,
  createProvider
};

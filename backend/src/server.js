require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// Importar modelos
const { sequelize, Specialty, User, DoctorProfile, PatientProfile, Appointment } = require("./models/index");

// ==================== IMPORTAR RUTAS ====================
const authRoutes = require("./routes/auth");
const verificationRoutes = require("./routes/verification");

// ==================== USAR RUTAS ====================
app.use("/api/auth", authRoutes);
app.use("/api/verification", verificationRoutes);

// ==================== RUTAS BÁSICAS ====================
app.get("/", (req, res) => {
  res.json({
    message: '🏥 CITAMED.VE - API REST',
    version: '2.0',
    module: 'Módulo 2.5 - Primera Vista Frontend',
    endpoints: {
      health: 'GET /api/health',
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      profile: 'GET /api/auth/profile',
      specialties: 'GET /api/specialties',
      search: 'GET /api/specialties/search?q=cardio',
      stats: 'GET /api/stats'
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "🚀 CITAMED.VE - Servidor funcionando",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/db-test", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: "✅ Conexión a PostgreSQL exitosa"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "❌ Error en base de datos",
      error: error.message
    });
  }
});

// ==================== ESPECIALIDADES ====================
app.get("/api/specialties", async (req, res) => {
  try {
    const specialties = await Specialty.findAll({
      attributes: ['id', 'name', 'description', 'category', 'isActive'],
      where: { isActive: true },
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      total: specialties.length,
      data: specialties
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: "Error obteniendo especialidades",
      error: error.message
    });
  }
});

app.get("/api/specialties/search", async (req, res) => {
  try {
    const { q } = req.query;
    const { Op } = require('sequelize');

    let whereClause = { isActive: true };

    if (q) {
      whereClause = {
        ...whereClause,
        [Op.or]: [
          { name: { [Op.iLike]: `%${q}%` } },
          { description: { [Op.iLike]: `%${q}%` } }
        ]
      };
    }

    const specialties = await Specialty.findAll({
      attributes: ['id', 'name', 'description', 'category'],
      where: whereClause,
      order: [['name', 'ASC']]
    });

    res.json({
      success: true,
      total: specialties.length,
      query: q || 'todas',
      data: specialties
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: "Error en la búsqueda",
      error: error.message
    });
  }
});

// ==================== DIRECTORIO MÉDICO ====================
// PRODUCCIÓN: Solo muestra médicos VERIFICADOS y ACTIVOS al público
// Para desarrollo/testing usar ?includeUnverified=true
app.get("/api/doctors", async (req, res) => {
  try {
    const { specialty, city, search, page = 1, limit = 20, includeUnverified } = req.query;
    const { Op } = require('sequelize');
    const offset = (page - 1) * limit;

    // PRODUCCIÓN: Por defecto solo médicos verificados y activos
    let whereClause = {
      acceptingNewPatients: true,
      isVerified: true,
      profileStatus: 'active'
    };

    // Solo para desarrollo/testing: incluir no verificados
    if (includeUnverified === 'true' && process.env.NODE_ENV !== 'production') {
      whereClause = { acceptingNewPatients: true };
    }

    // Filtros de búsqueda
    if (specialty) {
      whereClause.subSpecialty = { [Op.iLike]: `%${specialty}%` };
    }

    if (city) {
      whereClause.city = { [Op.iLike]: `%${city}%` };
    }

    if (search) {
      whereClause[Op.or] = [
        { firstName: { [Op.iLike]: `%${search}%` } },
        { lastName: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const { count, rows: doctors } = await DoctorProfile.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'userId', 'firstName', 'lastName', 'profilePhoto', 'subSpecialty',
        'experienceYears', 'consultationFee', 'city', 'state',
        'averageRating', 'totalReviews', 'bio', 'licenseNumber',
        'isVerified', 'profileStatus', 'telemedicineEnabled',
        'languages', 'consultationDuration'
      ],
      order: [
        ['isVerified', 'DESC'],      // Verificados primero
        ['averageRating', 'DESC'],   // Mejor calificación
        ['totalReviews', 'DESC']     // Más reviews
      ],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      showingVerifiedOnly: whereClause.isVerified === true,
      data: doctors.map(doc => ({
        ...doc.toJSON(),
        displayName: `Dr. ${doc.firstName} ${doc.lastName}`,
        verificationBadge: doc.isVerified ? 'verified' : 'pending'
      }))
    });
  } catch (error) {
    console.error('Error obteniendo médicos:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener médicos",
      error: error.message
    });
  }
});

// Endpoint para obtener un médico específico (público)
app.get("/api/doctors/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const doctor = await DoctorProfile.findByPk(id, {
      include: [{
        model: User,
        as: 'user',
        attributes: ['email', 'createdAt']
      }, {
        model: Specialty,
        as: 'specialty',
        attributes: ['id', 'name', 'category']
      }]
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: 'Médico no encontrado'
      });
    }

    // Solo mostrar información completa si está verificado
    const publicProfile = {
      id: doctor.id,
      displayName: `Dr. ${doctor.firstName} ${doctor.lastName}`,
      firstName: doctor.firstName,
      lastName: doctor.lastName,
      profilePhoto: doctor.profilePhoto,
      specialty: doctor.specialty,
      subSpecialty: doctor.subSpecialty,
      bio: doctor.bio,
      experienceYears: doctor.experienceYears,
      consultationFee: doctor.consultationFee,
      followUpFee: doctor.followUpFee,
      consultationDuration: doctor.consultationDuration,
      city: doctor.city,
      state: doctor.state,
      languages: doctor.languages,
      telemedicineEnabled: doctor.telemedicineEnabled,
      homeVisitsEnabled: doctor.homeVisitsEnabled,
      averageRating: doctor.averageRating,
      totalReviews: doctor.totalReviews,
      totalPatients: doctor.totalPatients,
      isVerified: doctor.isVerified,
      verificationBadge: doctor.isVerified ? 'verified' : 'pending',
      acceptingNewPatients: doctor.acceptingNewPatients,
      workingHours: doctor.workingHours,
      acceptsInsurance: doctor.acceptsInsurance,
      insuranceProviders: doctor.insuranceProviders,
      // Solo mostrar info sensible si está verificado
      ...(doctor.isVerified && {
        licenseNumber: doctor.licenseNumber,
        medicalSchool: doctor.medicalSchool,
        graduationYear: doctor.graduationYear,
        certifications: doctor.certifications,
        hospitalAffiliations: doctor.hospitalAffiliations
      })
    };

    res.json({
      success: true,
      data: publicProfile
    });
  } catch (error) {
    console.error('Error obteniendo médico:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener médico",
      error: error.message
    });
  }
});

app.get("/api/stats", async (req, res) => {
  try {
    const [
      totalSpecialties,
      totalUsers,
      totalDoctors,
      totalPatients,
      totalAppointments
    ] = await Promise.all([
      Specialty.count({ where: { isActive: true } }),
      User.count(),
      DoctorProfile.count(),
      PatientProfile.count(),
      Appointment.count()
    ]);

    res.json({
      success: true,
      data: {
        total_specialties: totalSpecialties,
        total_users: totalUsers,
        total_doctors: totalDoctors,
        total_patients: totalPatients,
        total_appointments: totalAppointments
      }
    });
  } catch (error) {
    console.error('Error obteniendo stats:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener estadísticas",
      error: error.message
    });
  }
});

// ==================== INICIALIZACIÓN ====================
async function startServer() {
  console.log('🚀 Iniciando CITAMED.VE...');
  
  try {
    console.log('🔌 Conectando a PostgreSQL...');
    await sequelize.authenticate();
    console.log('✅ Conectado a PostgreSQL');

    console.log('🔄 Verificando sincronización...');
    // await sequelize.sync({ force: false, alter: true });
    console.log('✅ Tablas verificadas (sync skipped temporarily)');

    console.log('📥 Contando registros...');
    const count = await Specialty.count({ where: { isActive: true } });
    console.log(`✅ ${count} especialidades activas`);

    app.listen(PORT, () => {
      console.log('');
      console.log('========================================');
      console.log('🏥 CITAMED.VE - BACKEND FUNCIONANDO');
      console.log('========================================');
      console.log(`🌐 Servidor: http://localhost:${PORT}`);
      console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
      console.log('');
      console.log('📋 Endpoints disponibles:');
      console.log('   🔐 Auth:');
      console.log(`      POST http://localhost:${PORT}/api/auth/register`);
      console.log(`      POST http://localhost:${PORT}/api/auth/login`);
      console.log(`      GET  http://localhost:${PORT}/api/auth/profile`);
      console.log('');
      console.log('   📊 Data:');
      console.log(`      GET http://localhost:${PORT}/api/specialties`);
      console.log(`      GET http://localhost:${PORT}/api/specialties/search?q=cardio`);
      console.log(`      GET http://localhost:${PORT}/api/stats`);
      console.log('');
      console.log('✅ Listo para conectar con React Frontend');
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Error iniciando servidor:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

// Exportar app para testing
module.exports = app;

// Solo iniciar servidor si NO estamos en tests
if (require.main === module) {
  startServer();
}
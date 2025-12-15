require("dotenv").config();
const express = require("express");
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
const app = express();
const PORT = process.env.PORT || 5000;

// Logging & Monitoring
const { logger, logServerStart, logDatabaseConnection } = require('./config/logger');
const { morganLogger } = require('./middleware/morganLogger');
const { performanceMiddleware, memoryTracker } = require('./middleware/performanceMetrics');
const { errorLoggerMiddleware, uncaughtErrorLogger, setupProcessErrorHandlers } = require('./middleware/errorLogger');

// Security Middleware
const { securityHeaders } = require('./config/helmet.config');
const { corsOptions } = require('./config/cors.config');
const cors = require('cors');
const { sanitizerStack } = require('./middleware/sanitizer');
const { secureErrorHandler } = require('./middleware/security');

// Rate Limiting
const {
  generalLimiter,
  authLimiter,
  searchLimiter
} = require('./middleware/rateLimiter');

// Setup process error handlers
setupProcessErrorHandlers();

// ==================== SECURITY MIDDLEWARE (ORDEN IMPORTANTE) ====================
// 1. Deshabilitar X-Powered-By
app.disable('x-powered-by');

// 2. Security Headers (Helmet)
securityHeaders.forEach(middleware => app.use(middleware));

// 3. CORS
app.use(cors(corsOptions));

// 4. Body parsing con límites
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 5. Sanitización de inputs
sanitizerStack.forEach(middleware => app.use(middleware));

// ==================== LOGGING & MONITORING MIDDLEWARE ====================
// 6. HTTP Request logging (Morgan + Winston)
app.use(morganLogger);

// 7. Performance metrics tracking
app.use(performanceMiddleware);

// 8. Memory usage tracking (cada 1000 requests)
app.use(memoryTracker);

logger.info('Security and monitoring middleware stack applied');

// ==================== SWAGGER DOCUMENTATION ====================
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'CITAMED.VE - API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    showRequestDuration: true
  }
}));

// Importar modelos
const { sequelize, Specialty, User, DoctorProfile, PatientProfile, Appointment } = require("./models/index");

// ==================== IMPORTAR RUTAS ====================
const authRoutes = require("./routes/auth");
const verificationRoutes = require("./routes/verification");
const metricsRoutes = require("./routes/metrics");

// ==================== USAR RUTAS ====================
// Auth routes con rate limiting estricto (5 req/15min)
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/metrics", metricsRoutes);

// ==================== RUTAS B�SICAS ====================
app.get("/", (req, res) => {
  res.json({
    message: '?? CITAMED.VE - API REST',
    version: '2.0',
    module: 'M�dulo 2.5 - Primera Vista Frontend',
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

// Health endpoint mejorado - usa /api/metrics/health para versión completa
app.get("/api/health", async (req, res) => {
  const startTime = Date.now();
  try {
    // Quick DB check
    await sequelize.authenticate();
    res.json({
      status: "healthy",
      message: "CITAMED.VE - Servidor funcionando",
      timestamp: new Date().toISOString(),
      responseTime: `${Date.now() - startTime}ms`,
      uptime: Math.floor(process.uptime()),
      version: process.env.npm_package_version || '1.0.0'
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      message: "Database connection failed",
      timestamp: new Date().toISOString()
    });
  }
});

app.get("/api/db-test", async (req, res) => {
  try {
    await sequelize.authenticate();
    res.json({
      success: true,
      message: "? Conexi�n a PostgreSQL exitosa"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "? Error en base de datos",
      error: error.message
    });
  }
});

// ==================== ESPECIALIDADES ====================
/**
 * @swagger
 * /api/specialties:
 *   get:
 *     tags: [Specialties]
 *     summary: Obtener todas las especialidades médicas
 *     description: Retorna listado de especialidades activas ordenadas alfabéticamente
 *     responses:
 *       200:
 *         description: Lista de especialidades
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 total:
 *                   type: integer
 *                   example: 102
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Specialty'
 */
app.get("/api/specialties", searchLimiter, async (req, res) => {
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

/**
 * @swagger
 * /api/specialties/search:
 *   get:
 *     tags: [Specialties]
 *     summary: Buscar especialidades por nombre o descripción
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Término de búsqueda (ej. cardio, pediatr)
 *         example: cardio
 *     responses:
 *       200:
 *         description: Resultados de búsqueda
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 query:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Specialty'
 */
app.get("/api/specialties/search", searchLimiter, async (req, res) => {
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
    console.error('Error en b�squeda:', error);
    res.status(500).json({
      success: false,
      message: "Error en la b�squeda",
      error: error.message
    });
  }
});

// ==================== DIRECTORIO MÉDICO ====================
/**
 * @swagger
 * /api/doctors:
 *   get:
 *     tags: [Doctors]
 *     summary: Buscar médicos con filtros
 *     description: Retorna listado de médicos verificados y activos. En desarrollo se puede usar includeUnverified=true
 *     parameters:
 *       - in: query
 *         name: specialty
 *         schema:
 *           type: string
 *         description: Filtrar por especialidad
 *         example: Cardiología
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *         description: Filtrar por ciudad
 *         example: Caracas
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Buscar por nombre del médico
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Número de página
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Resultados por página
 *     responses:
 *       200:
 *         description: Lista paginada de médicos
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 totalPages:
 *                   type: integer
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Doctor'
 */
app.get("/api/doctors", searchLimiter, async (req, res) => {
  try {
    const { specialty, city, search, page = 1, limit = 20, includeUnverified } = req.query;
    const { Op } = require('sequelize');
    const offset = (page - 1) * limit;

    // PRODUCCI�N: Por defecto solo m�dicos verificados y activos
    let whereClause = {
      acceptingNewPatients: true,
      isVerified: true,
      profileStatus: 'active'
    };

    // Solo para desarrollo/testing: incluir no verificados
    if (includeUnverified === 'true' && process.env.NODE_ENV !== 'production') {
      whereClause = { acceptingNewPatients: true };
    }

    // Filtros de b�squeda
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
        ['averageRating', 'DESC'],   // Mejor calificaci�n
        ['totalReviews', 'DESC']     // M�s reviews
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
    console.error('Error obteniendo m�dicos:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener m�dicos",
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/doctors/{id}:
 *   get:
 *     tags: [Doctors]
 *     summary: Obtener perfil de un médico específico
 *     description: Retorna información detallada del médico. Info sensible solo visible si está verificado
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID del médico
 *     responses:
 *       200:
 *         description: Perfil del médico
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/Doctor'
 *       404:
 *         description: Médico no encontrado
 */
app.get("/api/doctors/:id", generalLimiter, async (req, res) => {
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
        message: 'M�dico no encontrado'
      });
    }

    // Solo mostrar informaci�n completa si est� verificado
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
      // Solo mostrar info sensible si est� verificado
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
    console.error('Error obteniendo m�dico:', error);
    res.status(500).json({
      success: false,
      message: "Error al obtener m�dico",
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/stats:
 *   get:
 *     tags: [Statistics]
 *     summary: Obtener estadísticas generales del sistema
 *     description: Retorna contadores de especialidades, usuarios, médicos, pacientes y citas
 *     responses:
 *       200:
 *         description: Estadísticas del sistema
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     total_specialties:
 *                       type: integer
 *                       example: 102
 *                     total_users:
 *                       type: integer
 *                     total_doctors:
 *                       type: integer
 *                     total_patients:
 *                       type: integer
 *                     total_appointments:
 *                       type: integer
 */
app.get("/api/stats", generalLimiter, async (req, res) => {
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
      message: "Error al obtener estad�sticas",
      error: error.message
    });
  }
});

// ==================== ERROR HANDLING MIDDLEWARE ====================
// Error logger (debe estar después de todas las rutas)
app.use(errorLoggerMiddleware);

// Final error handler
app.use(uncaughtErrorLogger);

// ==================== INICIALIZACION ====================
async function startServer() {
  logger.info('Starting CITAMED.VE server...');

  try {
    logger.info('Connecting to PostgreSQL...');
    await sequelize.authenticate();
    logDatabaseConnection('connected', { database: process.env.DB_NAME });

    // Count active specialties
    const count = await Specialty.count({ where: { isActive: true } });
    logger.info(`Database ready: ${count} active specialties`);

    app.listen(PORT, () => {
      logServerStart(PORT, process.env.NODE_ENV || 'development');

      // Console output for development visibility
      console.log('');
      console.log('========================================');
      console.log('CITAMED.VE - BACKEND FUNCIONANDO');
      console.log('========================================');
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log(`Base de datos: ${process.env.DB_NAME}`);
      console.log(`Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log('');
      console.log('Endpoints:');
      console.log(`  Health: GET http://localhost:${PORT}/api/health`);
      console.log(`  Metrics: GET http://localhost:${PORT}/api/metrics/health`);
      console.log(`  Docs: http://localhost:${PORT}/api-docs`);
      console.log('');
      console.log('Logs: backend/logs/');
      console.log('========================================');
      console.log('');
    });
  } catch (error) {
    logger.error('Failed to start server', {
      message: error.message,
      stack: error.stack
    });
    logDatabaseConnection('failed', { error: error.message });
    process.exit(1);
  }
}

// Exportar app para testing
module.exports = app;

// Solo iniciar servidor si NO estamos en tests
if (require.main === module) {
  startServer();
}
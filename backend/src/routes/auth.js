/**
 * Authentication Routes - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Rutas de autenticación:
 * - POST /api/auth/login - Login
 * - POST /api/auth/register - Registro genérico (legacy)
 * - POST /api/auth/register/patient - Registro paciente (4 pasos)
 * - POST /api/auth/register/doctor - Registro médico (6 pasos)
 * - POST /api/auth/register/provider - Registro proveedor (5 pasos)
 * - GET /api/auth/check-email - Verificar disponibilidad email
 * - GET /api/auth/check-cedula - Verificar disponibilidad cédula
 * - GET /api/auth/profile - Obtener perfil (autenticado)
 */

const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authMiddleware } = require("../middleware/auth");
const { auditLog } = require("../middleware/auditMiddleware");
const {
  registerValidator,
  loginValidator,
  patientRegisterValidator,
  doctorRegisterValidator,
  providerRegisterValidator,
  validationErrorHandler
} = require('../validators');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 *       401:
 *         description: Credenciales inválidas
 */
router.post("/login",
  loginValidator,
  validationErrorHandler,
  auditLog({ action: 'auth.login.attempt', resource: 'auth', severity: 'info' }),
  authController.login
);

/**
 * @swagger
 * /api/auth/login/2fa:
 *   post:
 *     tags: [Authentication]
 *     summary: Login con verificación 2FA
 *     description: Segundo paso del login cuando el usuario tiene 2FA activado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - token
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID del usuario (recibido del primer paso)
 *               token:
 *                 type: string
 *                 description: Código de 6 dígitos de la app o backup code de 8 caracteres
 *     responses:
 *       200:
 *         description: Login exitoso con 2FA
 *       401:
 *         description: Código 2FA inválido
 */
router.post("/login/2fa",
  auditLog({ action: 'auth.login.2fa', resource: 'auth', severity: 'info' }),
  authController.loginWith2FA
);

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar nuevo usuario (legacy)
 *     deprecated: true
 *     description: Use /api/auth/register/patient, /api/auth/register/doctor, or /api/auth/register/provider instead
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               name:
 *                 type: string
 *               role:
 *                 type: string
 *     responses:
 *       201:
 *         description: Usuario registrado
 *       400:
 *         description: Error de validación
 */
router.post("/register",
  registerValidator,
  validationErrorHandler,
  auditLog({ action: 'user.created', resource: 'user', severity: 'info' }),
  authController.register
);

/**
 * @swagger
 * /api/auth/register/patient:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar paciente (multi-paso)
 *     description: |
 *       Registro de paciente con todos los datos del wizard de 4 pasos:
 *       - Paso 1: Credenciales (email, password, acceptTerms)
 *       - Paso 2: Datos personales (nombre, cédula, fecha nacimiento, género, teléfono)
 *       - Paso 3: Información médica (alergias, condiciones, tipo sangre, contacto emergencia)
 *       - Paso 4: Confirmación
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - confirmPassword
 *               - acceptTerms
 *               - firstName
 *               - lastName
 *               - identificationNumber
 *               - dateOfBirth
 *               - gender
 *               - phone
 *               - bloodType
 *               - emergencyContactName
 *               - emergencyContactPhone
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: paciente@email.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 example: Password123
 *               confirmPassword:
 *                 type: string
 *                 example: Password123
 *               acceptTerms:
 *                 type: boolean
 *                 example: true
 *               firstName:
 *                 type: string
 *                 example: Juan
 *               lastName:
 *                 type: string
 *                 example: Pérez
 *               identificationNumber:
 *                 type: string
 *                 example: V-12345678
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other, prefer_not_to_say]
 *               phone:
 *                 type: string
 *                 example: 04121234567
 *               allergies:
 *                 type: string
 *                 example: Penicilina, Mariscos
 *               chronicConditions:
 *                 type: string
 *                 example: Hipertensión
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-, unknown]
 *               emergencyContactName:
 *                 type: string
 *                 example: María Pérez
 *               emergencyContactPhone:
 *                 type: string
 *                 example: 04241234567
 *     responses:
 *       201:
 *         description: Paciente registrado exitosamente
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                     profile:
 *                       type: object
 *                     token:
 *                       type: string
 *       400:
 *         description: Error de validación
 */
router.post("/register/patient",
  patientRegisterValidator,
  auditLog({ action: 'user.created', resource: 'user', severity: 'info', includeBody: false }),
  authController.registerPatient
);

/**
 * @swagger
 * /api/auth/register/doctor:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar médico (multi-paso)
 *     description: |
 *       Registro de médico con todos los datos del wizard de 6 pasos.
 *       La cuenta quedará en estado 'pending_review' hasta ser aprobada por administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - mppsNumber
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               mppsNumber:
 *                 type: string
 *                 description: Número MPPS (Ministerio del Poder Popular para la Salud)
 *               specialtyId:
 *                 type: integer
 *               university:
 *                 type: string
 *               graduationYear:
 *                 type: integer
 *               consultationAddress:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               availableDays:
 *                 type: array
 *                 items:
 *                   type: string
 *               startTime:
 *                 type: string
 *                 format: time
 *               endTime:
 *                 type: string
 *                 format: time
 *               priceConsultation:
 *                 type: number
 *               priceTeleconsultation:
 *                 type: number
 *               priceHomeVisit:
 *                 type: number
 *               acceptsHomeVisits:
 *                 type: boolean
 *               acceptsInsurance:
 *                 type: boolean
 *               acceptedInsurances:
 *                 type: string
 *     responses:
 *       201:
 *         description: Médico registrado (pendiente aprobación)
 *       400:
 *         description: Error de validación
 */
router.post("/register/doctor",
  doctorRegisterValidator,
  auditLog({ action: 'user.created', resource: 'user', severity: 'info', includeBody: false }),
  authController.registerDoctor
);

/**
 * @swagger
 * /api/auth/register/provider:
 *   post:
 *     tags: [Authentication]
 *     summary: Registrar proveedor (multi-paso)
 *     description: |
 *       Registro de proveedor con todos los datos del wizard de 5 pasos.
 *       La cuenta quedará en estado 'pending' hasta ser aprobada por administrador.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - companyName
 *               - rif
 *               - legalName
 *               - providerType
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               rif:
 *                 type: string
 *                 description: Registro de Información Fiscal
 *               legalName:
 *                 type: string
 *               legalRepresentative:
 *                 type: string
 *               commercialPhone:
 *                 type: string
 *               contactEmail:
 *                 type: string
 *               providerType:
 *                 type: string
 *                 enum: [Farmacia, Laboratorio, Insumos médicos, Servicios de salud, Clínica, Hospital, Centro de Diagnóstico, Otro]
 *               description:
 *                 type: string
 *               mainProducts:
 *                 type: string
 *               mainAddress:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               coverageZones:
 *                 type: string
 *               hasMultipleLocations:
 *                 type: boolean
 *               locationCount:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Proveedor registrado (pendiente aprobación)
 *       400:
 *         description: Error de validación
 */
router.post("/register/provider",
  providerRegisterValidator,
  auditLog({ action: 'user.created', resource: 'user', severity: 'info', includeBody: false }),
  authController.registerProvider
);

/**
 * @swagger
 * /api/auth/check-email:
 *   get:
 *     tags: [Authentication]
 *     summary: Verificar disponibilidad de email
 *     parameters:
 *       - in: query
 *         name: email
 *         required: true
 *         schema:
 *           type: string
 *           format: email
 *     responses:
 *       200:
 *         description: Resultado de verificación
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
 *                     exists:
 *                       type: boolean
 *                     available:
 *                       type: boolean
 */
router.get("/check-email", authController.checkEmail);

/**
 * @swagger
 * /api/auth/check-cedula:
 *   get:
 *     tags: [Authentication]
 *     summary: Verificar disponibilidad de cédula
 *     parameters:
 *       - in: query
 *         name: cedula
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Resultado de verificación
 */
router.get("/check-cedula", authController.checkCedula);

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Obtener perfil del usuario autenticado
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Perfil del usuario
 *       401:
 *         description: No autenticado
 */
router.get("/profile", authMiddleware, authController.getProfile);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     tags: [Authentication]
 *     summary: Cerrar sesión actual
 *     description: Invalida la sesión actual del usuario
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada exitosamente
 *       400:
 *         description: Token no proporcionado
 *       401:
 *         description: No autenticado
 */
router.post("/logout",
  authMiddleware,
  auditLog({ action: 'auth.logout', resource: 'session', severity: 'info' }),
  authController.logout
);

module.exports = router;

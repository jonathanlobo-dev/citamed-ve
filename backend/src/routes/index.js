const express = require('express');
const router = express.Router();

// Importar todas las rutas
const authRoutes = require('./auth');
const profileRoutes = require('./profiles');
const protectedRoutes = require('./protected');
const identityVerificationRoutes = require('./identityVerification');
const twoFactorRoutes = require('./twoFactor');
const passwordRecoveryRoutes = require('./passwordRecovery');
const sessionRoutes = require('./sessions');
const rbacRoutes = require('./rbac');
const auditRoutes = require('./audit');
const doctorRoutes = require('./doctors');
const specialtiesRoutes = require('./specialties');
const patientRoutes = require('./patients');
const kycVerificationRoutes = require('./kycVerification');
const reviewsRoutes = require('./reviews');
const searchRoutes = require('./search');
const clinicsRoutes = require('./clinics');

// Configurar rutas
router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/protected', protectedRoutes);
router.use('/verification', identityVerificationRoutes);
router.use('/2fa', twoFactorRoutes);
router.use('/password-recovery', passwordRecoveryRoutes);
router.use('/sessions', sessionRoutes);
router.use('/rbac', rbacRoutes);
router.use('/audit', auditRoutes);
router.use('/doctors', doctorRoutes);
router.use('/specialties', specialtiesRoutes);
router.use('/patients', patientRoutes);
router.use('/kyc', kycVerificationRoutes);
router.use('/reviews', reviewsRoutes);
router.use('/search', searchRoutes);
router.use('/clinics', clinicsRoutes);

// Ruta de prueba de base de datos
router.get('/db-test', async (req, res) => {
  try {
    const { sequelize } = require('../models/index.js');
    await sequelize.authenticate();
    res.json({ 
      success: true, 
      message: 'Conexión a PostgreSQL exitosa' 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: 'Error conectando a la base de datos',
      error: error.message 
    });
  }
});

module.exports = router;

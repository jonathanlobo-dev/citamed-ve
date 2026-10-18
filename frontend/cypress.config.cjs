const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'https://dev.citamed-ve.pages.dev',
    env: {
      apiUrl: process.env.CYPRESS_API_URL || 'https://citamed-api-dev.onrender.com/api'
    },
    setupNodeEvents(on, config) {
      on('task', {
        async createTestPaymentJourney() {
          require('../backend/node_modules/dotenv').config({ path: '../backend/.env' });
          // Estas tareas escriben en la base: solo se permiten contra Pruebas
          if (!String(process.env.DB_USER || '').endsWith('bvdjfxihcohexgvtyhto')) throw new Error('Las pruebas de cobros solo corren contra la base de Pruebas');
          const db = require('../backend/src/models');
          const uid = Date.now().toString().slice(-6);

          // Asegurar tasa de cambio
          let rate = await db.ExchangeRate.findOne({
            where: { currencyPair: 'USD/VES' },
            order: [['createdAt', 'DESC']]
          });
          if (!rate) {
            rate = await db.ExchangeRate.create({
              currencyPair: 'USD/VES',
              rate: 55.50,
              source: 'BCV',
              isManual: false,
              checkedAt: new Date()
            });
          }

          // Crear médico de prueba con métodos configurados
          const doctor = await db.User.create({
            email: `doc.cy.${uid}@citamed.ve`,
            password: 'Password123!',
            role: 'doctor',
            gender: 'masculino',
            firstName: 'DoctorCy',
            lastName: 'Prueba',
            phone: '+584141112233',
            isActive: true,
            emailVerified: true
          });

          const doctorProfile = await db.DoctorProfile.create({
            userId: doctor.id,
            firstName: 'DoctorCy',
            lastName: 'Prueba',
            licenseNumber: `LIC-CY-${uid}`,
            mppsNumber: `MPPS-CY-${uid}`,
            specialtyId: 1,
            consultationFee: 45.00,
            paymentSettings: {
              pagoMovil: {
                enabled: true,
                bankCode: '0102',
                phone: '04141112233',
                idType: 'V',
                idNumber: '12345678'
              },
              zelle: {
                enabled: true,
                email: 'drcy@citamed.ve',
                holderName: 'DoctorCy Prueba'
              },
              efectivoUsd: { enabled: true }
            }
          });

          // Crear paciente de prueba
          const patient = await db.User.create({
            email: `pat.cy.${uid}@citamed.ve`,
            password: 'Password123!',
            role: 'patient',
            gender: 'masculino',
            firstName: 'PacienteCy',
            lastName: 'Prueba',
            phone: '+584123334455',
            isActive: true,
            emailVerified: true
          });

          await db.PatientProfile.create({
            userId: patient.id,
            firstName: 'PacienteCy',
            lastName: 'Prueba'
          });

          // Crear cita completada
          const appointment = await db.Appointment.create({
            patientId: patient.id,
            doctorId: doctor.id,
            appointmentDate: new Date().toISOString().split('T')[0],
            appointmentTime: '10:00:00',
            reason: 'Consulta médica general E2E',
            status: 'completed',
            type: 'presencial',
            consultationFee: 45.00,
            paymentStatus: 'pending'
          });

          return {
            uid,
            doctorEmail: doctor.email,
            patientEmail: patient.email,
            password: 'Password123!',
            doctorId: doctor.id,
            patientId: patient.id,
            doctorProfileId: doctorProfile.id,
            appointmentId: appointment.id
          };
        },

        async cleanupTestPaymentJourney({ userIds, appointmentIds }) {
          require('../backend/node_modules/dotenv').config({ path: '../backend/.env' });
          // Estas tareas escriben en la base: solo se permiten contra Pruebas
          if (!String(process.env.DB_USER || '').endsWith('bvdjfxihcohexgvtyhto')) throw new Error('Las pruebas de cobros solo corren contra la base de Pruebas');
          const db = require('../backend/src/models');
          if (appointmentIds && appointmentIds.length) {
            await db.Payment.destroy({ where: { appointmentId: appointmentIds } });
            await db.Appointment.destroy({ where: { id: appointmentIds } });
          }
          if (userIds && userIds.length) {
            await db.DoctorProfile.destroy({ where: { userId: userIds } });
            await db.PatientProfile.destroy({ where: { userId: userIds } });
            await db.User.destroy({ where: { id: userIds } });
          }
          return true;
        }
      });

      return config;
    },
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 15000,
    requestTimeout: 15000,
    responseTimeout: 15000
  }
});

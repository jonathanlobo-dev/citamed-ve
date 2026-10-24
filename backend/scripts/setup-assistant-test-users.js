/**
 * setup-assistant-test-users.js - CITAMED.VE
 * Prepara usuarios de prueba en la base de Pruebas:
 * 1. Asistente 1 (asistente1@citamed.ve) vinculada a doctor@citamed.ve
 * 2. Asistente 2 (asistente2@citamed.ve) vinculada a doctor@citamed.ve Y a un segundo médico
 */

const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const dbUserSuffix = String(process.env.DB_USER || '').slice(-20);
console.log(`[Seguridad] Verificando sufijo de DB_USER: ...${dbUserSuffix}`);
if (!String(process.env.DB_USER || '').endsWith('bvdjfxihcohexgvtyhto')) {
  console.error('ABORTADO: este script solo corre contra la base de datos de Pruebas.');
  process.exit(1);
}

const bcrypt = require('bcryptjs');
const db = require('../src/models');
const { User, DoctorProfile, DoctorAssistant } = db;

async function run() {
  try {
    await db.sequelize.authenticate();
    console.log('Conexión con Postgres Pruebas verificada.');

    // 1. Buscar o verificar doctor@citamed.ve
    let doctor1 = await User.findOne({ where: { email: 'doctor@citamed.ve' } });
    if (!doctor1) {
      console.log('No existe doctor@citamed.ve, buscando cualquier médico...');
      doctor1 = await User.findOne({ where: { role: 'doctor' } });
    }
    console.log(`Doctor 1: ID ${doctor1.id} - ${doctor1.firstName} ${doctor1.lastName} (${doctor1.email})`);

    // 2. Buscar o crear segundo médico
    let doctor2 = await User.findOne({
      where: {
        role: 'doctor',
        id: { [db.Sequelize.Op.ne]: doctor1.id }
      }
    });

    if (!doctor2) {
      console.log('Creando segundo médico doctor2@citamed.ve...');
      const hash = await bcrypt.hash('Password123!', 10);
      doctor2 = await User.create({
        email: 'doctor2@citamed.ve',
        password: hash,
        role: 'doctor',
        firstName: 'Carlos',
        lastName: 'Mendoza',
        phone: '04141234567',
        isActive: true,
        accountClaimed: true
      });
      await DoctorProfile.create({
        userId: doctor2.id,
        firstName: 'Carlos',
        lastName: 'Mendoza',
        licenseNumber: 'MPPS-98765',
        clinicName: 'Clínica Sanitas Caracas',
        clinicAddress: 'Av. Principal Las Mercedes, Caracas',
        consultationFee: 50.00
      });
    }
    console.log(`Doctor 2: ID ${doctor2.id} - ${doctor2.firstName} ${doctor2.lastName} (${doctor2.email})`);

    const plainPassword = 'Password123!';

    // 3. Crear o actualizar Asistente 1 (asistente1@citamed.ve)
    let asst1 = await User.findOne({ where: { email: 'asistente1@citamed.ve' } });
    if (!asst1) {
      asst1 = await User.create({
        email: 'asistente1@citamed.ve',
        password: plainPassword,
        role: 'assistant',
        firstName: 'Valentina',
        lastName: 'Rivas',
        phone: '04121112233',
        isActive: true,
        accountClaimed: true
      });
      console.log(`Asistente 1 creada: ID ${asst1.id} (${asst1.email})`);
    } else {
      asst1.password = plainPassword;
      asst1.role = 'assistant';
      asst1.isActive = true;
      asst1.accountClaimed = true;
      await asst1.save();
      console.log(`Asistente 1 actualizada: ID ${asst1.id} (${asst1.email})`);
    }

    // Vínculo Asistente 1 -> Doctor 1 (Activo)
    await DoctorAssistant.destroy({ where: { assistantId: asst1.id } });
    const link1 = await DoctorAssistant.create({
      doctorId: doctor1.id,
      assistantId: asst1.id,
      status: 'active',
      canAgenda: true,
      canPayments: true,
      canVoidReceipts: false,
      invitedAt: new Date(),
      acceptedAt: new Date()
    });
    console.log(`Vínculo creado: Asistente 1 -> Doctor 1 (Link ID ${link1.id}, status: active)`);

    // 4. Crear o actualizar Asistente 2 (asistente2@citamed.ve)
    let asst2 = await User.findOne({ where: { email: 'asistente2@citamed.ve' } });
    if (!asst2) {
      asst2 = await User.create({
        email: 'asistente2@citamed.ve',
        password: plainPassword,
        role: 'assistant',
        firstName: 'Mariana',
        lastName: 'Gómez',
        phone: '04124445566',
        isActive: true,
        accountClaimed: true
      });
      console.log(`Asistente 2 creada: ID ${asst2.id} (${asst2.email})`);
    } else {
      asst2.password = plainPassword;
      asst2.role = 'assistant';
      asst2.isActive = true;
      asst2.accountClaimed = true;
      await asst2.save();
      console.log(`Asistente 2 actualizada: ID ${asst2.id} (${asst2.email})`);
    }

    // Vínculos Asistente 2 -> Doctor 1 y Doctor 2 (ambos Activos)
    await DoctorAssistant.destroy({ where: { assistantId: asst2.id } });
    const link2_1 = await DoctorAssistant.create({
      doctorId: doctor1.id,
      assistantId: asst2.id,
      status: 'active',
      canAgenda: true,
      canPayments: true,
      canVoidReceipts: true,
      invitedAt: new Date(),
      acceptedAt: new Date()
    });
    const link2_2 = await DoctorAssistant.create({
      doctorId: doctor2.id,
      assistantId: asst2.id,
      status: 'active',
      canAgenda: true,
      canPayments: false,
      canVoidReceipts: false,
      invitedAt: new Date(),
      acceptedAt: new Date()
    });
    console.log(`Vínculos creados para Asistente 2:`);
    console.log(`- con Doctor 1 (Link ID ${link2_1.id}, canAgenda: true, canPayments: true, canVoidReceipts: true)`);
    console.log(`- con Doctor 2 (Link ID ${link2_2.id}, canAgenda: true, canPayments: false)`);

    // 5. Crear una invitación PENDIENTE para Asistente 1 de Doctor 2 para probar la pantalla de invitaciones pendientes
    const link1_pend = await DoctorAssistant.create({
      doctorId: doctor2.id,
      assistantId: asst1.id,
      status: 'pending',
      canAgenda: true,
      canPayments: true,
      canVoidReceipts: false,
      invitedAt: new Date()
    });
    console.log(`Invitación pendiente creada: Doctor 2 -> Asistente 1 (Link ID ${link1_pend.id}, status: pending)`);

    console.log('\nRESUMEN DE USUARIOS LISTOS:');
    console.log('1. Doctor 1: ' + doctor1.email + ' (ID ' + doctor1.id + ') / Password123!');
    console.log('2. Doctor 2: ' + doctor2.email + ' (ID ' + doctor2.id + ') / Password123!');
    console.log('3. Asistente 1 (1 médico activo + 1 pendiente): ' + asst1.email + ' / Password123!');
    console.log('4. Asistente 2 (2 médicos activos): ' + asst2.email + ' / Password123!');

    process.exit(0);
  } catch (err) {
    console.error('Error al configurar usuarios de prueba:', err);
    process.exit(1);
  }
}

run();

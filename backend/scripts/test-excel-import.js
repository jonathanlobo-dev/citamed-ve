/**
 * test-excel-import.js - CITAMED.VE
 * M03 / Semana 9 - Bloque E: Prueba de importación de 100 pacientes desde Excel
 *
 * REGLAS OBLIGATORIAS:
 * - Bloqueo de seguridad: solo ejecuta contra la base de datos de Pruebas (bvdjfxihcohexgvtyhto).
 * - Prueba con 100 filas: 92 válidas, 5 con errores a propósito y 3 cédulas repetidas.
 * - Limpieza posterior de los pacientes creados.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const db = require('../src/models');
const clinicalRecordService = require('../src/services/clinicalRecordService');
const { Op } = require('sequelize');

async function main() {
  console.log('=== CITAMED.VE - TEST BLOQUE E: IMPORTACIÓN DESDE EXCEL ===');

  // 1. Verificación obligatoria de entorno de Pruebas
  const dbUser = process.env.DB_USER || '';
  const suffix = dbUser.slice(-20);
  console.log(`DB_USER actual termina en: ...${suffix}`);
  if (suffix !== 'bvdjfxihcohexgvtyhto') {
    console.error('ABORTANDO: La base de datos no es la de Pruebas (bvdjfxihcohexgvtyhto).');
    process.exit(1);
  }
  console.log('✓ Confirmada base de datos de Pruebas.');

  // 2. Buscar o crear un médico para la prueba
  let doctor = await db.User.findOne({
    where: { role: 'doctor', isActive: true },
    include: [{ model: db.DoctorProfile, as: 'doctorProfile' }]
  });

  if (!doctor) {
    console.error('No se encontró ningún médico activo en la base de datos de pruebas.');
    process.exit(1);
  }
  console.log(`✓ Médico para la prueba: Dr(a). ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})`);

  // Asegurar limpieza previa de posibles corridas anteriores
  const testCedulaPrefix = 'V-99';
  const existingTestProfiles = await db.PatientProfile.findAll({
    where: {
      identificationNumber: {
        [Op.like]: `${testCedulaPrefix}%`
      }
    }
  });

  if (existingTestProfiles.length > 0) {
    const userIds = existingTestProfiles.map(p => p.userId);
    const profileIds = existingTestProfiles.map(p => p.id);
    await db.PatientAllergy.destroy({ where: { patientProfileId: { [Op.in]: profileIds } } });
    await db.Appointment.destroy({ where: { patientId: { [Op.in]: userIds } } });
    await db.PatientProfile.destroy({ where: { id: { [Op.in]: profileIds } } });
    await db.User.destroy({ where: { id: { [Op.in]: userIds } } });
    console.log(`✓ Limpieza previa de ${existingTestProfiles.length} registros anteriores.`);
  }

  // 3. Generar 100 filas de prueba:
  // - 92 filas válidas
  // - 5 filas con errores a propósito
  // - 3 filas con cédulas repetidas
  const rows = [];

  // 92 válidas:
  for (let i = 1; i <= 92; i++) {
    const num = String(i).padStart(4, '0');
    rows.push({
      nombre: `Paciente${num}`,
      apellido: `Prueba${num}`,
      cedula: `V-9900${num}`,
      telefono: `0414990${num}`,
      correo: `paciente.prueba${num}@testcitamed.ve`,
      fecha_nacimiento: '1990-05-15',
      sexo: i % 2 === 0 ? 'Femenino' : 'Masculino',
      alergias: i % 5 === 0 ? 'Penicilina, Ibuprofeno' : ''
    });
  }

  // 5 errores a propósito:
  // Error 1: Nombre y apellido vacíos
  rows.push({
    nombre: '',
    apellido: '',
    cedula: 'V-99009991',
    telefono: '04149909991',
    correo: 'sin.nombre@testcitamed.ve'
  });

  // Error 2: Cédula con formato inválido (menos de 6 dígitos)
  rows.push({
    nombre: 'Carlos',
    apellido: 'ErrorCedula',
    cedula: 'V-123',
    telefono: '04149909992',
    correo: 'error.cedula@testcitamed.ve'
  });

  // Error 3: Teléfono inválido
  rows.push({
    nombre: 'Maria',
    apellido: 'ErrorTelefono',
    cedula: 'V-99009993',
    telefono: '12345',
    correo: 'error.telefono@testcitamed.ve'
  });

  // Error 4: Correo inválido
  rows.push({
    nombre: 'Jose',
    apellido: 'ErrorEmail',
    cedula: 'V-99009994',
    telefono: '04149909994',
    correo: 'correo_sin_arroba_ni_dominio'
  });

  // Error 5: Cédula ausente
  rows.push({
    nombre: 'Ana',
    apellido: 'SinCedula',
    cedula: '',
    telefono: '04149909995',
    correo: 'sin.cedula@testcitamed.ve'
  });

  // 3 cédulas repetidas (duplicadas dentro del lote):
  rows.push({
    nombre: 'PacienteDuplicado1',
    apellido: 'Prueba0001',
    cedula: 'V-99000001', // Ya existía en la fila 1
    telefono: '04149900001',
    correo: 'duplicado1@testcitamed.ve'
  });

  rows.push({
    nombre: 'PacienteDuplicado2',
    apellido: 'Prueba0002',
    cedula: 'V-99000002', // Ya existía en la fila 2
    telefono: '04149900002',
    correo: 'duplicado2@testcitamed.ve'
  });

  rows.push({
    nombre: 'PacienteDuplicado3',
    apellido: 'Prueba0003',
    cedula: 'V-99000003', // Ya existía en la fila 3
    telefono: '04149900003',
    correo: 'duplicado3@testcitamed.ve'
  });

  console.log(`\nTotal de filas preparadas para el test: ${rows.length}`);
  console.log('- Filas válidas únicas: 92');
  console.log('- Filas con errores intencionales: 5');
  console.log('- Filas con cédulas repetidas: 3');

  // 4. Ejecutar importación
  console.log('\nEjecutando importPatientsFromExcel...');
  const startTime = Date.now();
  const summary = await clinicalRecordService.importPatientsFromExcel(
    doctor.id,
    rows,
    doctor
  );
  const elapsedMs = Date.now() - startTime;
  console.log(`✓ Procesamiento completado en ${elapsedMs} ms.\n`);

  // 5. Imprimir resumen real devuelto
  console.log('================ RESUMEN REAL DEVUELTO ================');
  console.log(JSON.stringify(summary, null, 2));
  console.log('========================================================\n');

  // Verificaciones de aserción
  console.log('VERIFICACIONES:');
  console.log(`- Total procesadas == 100: ${summary.total === 100 ? 'PASS' : 'FAIL'} (${summary.total})`);
  console.log(`- Creados == 92: ${summary.created === 92 ? 'PASS' : 'FAIL'} (${summary.created})`);
  console.log(`- Ya vinculados / repetidos == 3: ${summary.alreadyLinked === 3 ? 'PASS' : 'FAIL'} (${summary.alreadyLinked})`);
  console.log(`- Errores == 5: ${summary.errors === 5 ? 'PASS' : 'FAIL'} (${summary.errors})`);
  console.log(`- Detalle de errores == 5 filas: ${summary.errorRows.length === 5 ? 'PASS' : 'FAIL'} (${summary.errorRows.length})`);

  // 6. Limpieza posterior de pacientes de prueba creados
  console.log('\nIniciando limpieza de pacientes de prueba creados...');
  const testProfilesToClean = await db.PatientProfile.findAll({
    where: {
      identificationNumber: {
        [Op.like]: `${testCedulaPrefix}%`
      }
    }
  });

  const testUserIds = testProfilesToClean.map(p => p.userId);
  const testProfileIds = testProfilesToClean.map(p => p.id);

  if (testProfileIds.length > 0) {
    const deletedAllergies = await db.PatientAllergy.destroy({
      where: { patientProfileId: { [Op.in]: testProfileIds } }
    });
    const deletedAppointments = await db.Appointment.destroy({
      where: { patientId: { [Op.in]: testUserIds } }
    });
    const deletedProfiles = await db.PatientProfile.destroy({
      where: { id: { [Op.in]: testProfileIds } }
    });
    const deletedUsers = await db.User.destroy({
      where: { id: { [Op.in]: testUserIds } }
    });

    console.log(`✓ Limpieza completada con éxito:`);
    console.log(`  - ${deletedAllergies} alergias eliminadas`);
    console.log(`  - ${deletedAppointments} citas de vinculación eliminadas`);
    console.log(`  - ${deletedProfiles} perfiles de paciente eliminados`);
    console.log(`  - ${deletedUsers} usuarios eliminados`);
  }

  // Verificación final de base limpia
  const remaining = await db.PatientProfile.count({
    where: { identificationNumber: { [Op.like]: `${testCedulaPrefix}%` } }
  });
  console.log(`✓ Registros residuales en base de datos: ${remaining} (Esperado: 0)`);

  console.log('\n=== TEST BLOQUE E COMPLETADO EXITOSAMENTE ===');
  process.exit(0);
}

main().catch(err => {
  console.error('ERROR EN TEST:', err);
  process.exit(1);
});

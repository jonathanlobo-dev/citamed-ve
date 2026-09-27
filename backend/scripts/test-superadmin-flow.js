/**
 * test-superadmin-flow.js - CITAMED.VE
 * M01 / Semana 7 - Prueba de punta a punta del panel de Superadministración y Suspensión (A6)
 */

const axios = require('axios');

const API_BASE = process.env.API_URL || 'http://localhost:5000/api';

const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function logStep(step, title) {
  console.log(`\n${colors.cyan}${colors.bold}[PASO ${step}]${colors.reset} ${title}`);
}

function pass(msg) {
  console.log(`  ${colors.green}${colors.bold}[PASS]${colors.reset} ${msg}`);
}

function fail(msg, err) {
  console.error(`  ${colors.red}${colors.bold}[FAIL]${colors.reset} ${msg}`);
  if (err) {
    if (err.response) {
      console.error(`         Status: ${err.response.status}`);
      console.error(`         Data:`, JSON.stringify(err.response.data));
    } else {
      console.error(`         Error: ${err.message || err}`);
    }
  }
}

async function runTest() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO TEST: SUPERADMIN Y SUSPENSIÓN DE CUENTAS`);
  console.log(`   API URL: ${API_BASE}`);
  console.log(`======================================================\n`);

  let allPassed = true;
  const uid = String(Date.now()).slice(-6);
  const createdEmails = [];

  let docToken, docId, docEmail;
  let patToken, patId, patEmail;
  let adminToken, adminId;

  try {
    // ----------------------------------------------------
    // PASO 1: Registro de Médico y Paciente con prefijo e2e.s7.
    // ----------------------------------------------------
    logStep(1, 'Registrando un médico y un paciente (prefijo e2e.s7.)...');

    docEmail = `e2e.s7.doc.${uid}@citamed.ve`;
    createdEmails.push(docEmail);
    const docPayload = {
      email: docEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Alejandro',
      lastName: `Rivas ${uid}`,
      identificationNumber: `V-${uid}11`,
      dateOfBirth: '1980-04-12',
      gender: 'male',
      phone: '+584145551001',
      mppsNumber: `MPPS${uid}`,
      specialtyId: 1,
      university: 'UCV',
      graduationYear: 2005,
      clinicName: `Consultorio Médico CitaMed ${uid}`,
      consultationAddress: 'Av. Francisco de Miranda, Caracas',
      city: 'Caracas',
      state: 'Distrito Capital',
      availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'],
      startTime: '08:00',
      endTime: '18:00',
      priceConsultation: 50.00
    };

    try {
      const docRes = await axios.post(`${API_BASE}/auth/register/doctor`, docPayload);
      docToken = docRes.data.token || docRes.data.data?.token;
      docId = docRes.data.user?.id || docRes.data.data?.user?.id;
      pass(`Médico registrado con éxito (id: ${docId}, email: ${docEmail})`);
    } catch (err) {
      fail('Registro de médico falló', err);
      allPassed = false;
      process.exit(1);
    }

    patEmail = `e2e.s7.pat.${uid}@citamed.ve`;
    createdEmails.push(patEmail);
    const patPayload = {
      email: patEmail,
      password: 'Password123!',
      confirmPassword: 'Password123!',
      acceptTerms: true,
      firstName: 'Carlos',
      lastName: `Silva ${uid}`,
      identificationNumber: `V-${uid}33`,
      dateOfBirth: '1992-06-15',
      gender: 'male',
      phone: '+584125553003',
      bloodType: 'O+',
      emergencyContactName: 'Pedro Silva',
      emergencyContactPhone: '+584141112233'
    };

    try {
      const patRes = await axios.post(`${API_BASE}/auth/register/patient`, patPayload);
      patToken = patRes.data.token || patRes.data.data?.token;
      patId = patRes.data.user?.id || patRes.data.data?.user?.id;
      pass(`Paciente registrado con éxito (id: ${patId}, email: ${patEmail})`);
    } catch (err) {
      fail('Registro de paciente falló', err);
      allPassed = false;
      process.exit(1);
    }

    // ----------------------------------------------------
    // PASO 2: Inicio de sesión como admin
    // ----------------------------------------------------
    logStep(2, 'Iniciando sesión como admin@citamed.ve...');

    try {
      const adminLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@citamed.ve',
        password: 'Admin123!'
      });

      adminToken = adminLoginRes.data.token || adminLoginRes.data.data?.token;
      adminId = adminLoginRes.data.user?.id || adminLoginRes.data.data?.user?.id;

      if (!adminToken) {
        throw new Error('Token de administrador no recibido');
      }
      pass(`Inicio de sesión de admin exitoso (id: ${adminId})`);
    } catch (err) {
      fail('Inicio de sesión de admin falló', err);
      allPassed = false;
      process.exit(1);
    }

    // Poblar doctor en doctor_search_cache con el token de admin
    try {
      await axios.post(
        `${API_BASE}/search/cache/${docId}`,
        {},
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      pass(`Médico sincronizado en cache de búsqueda (doctor_search_cache)`);
    } catch (cacheErr) {
      console.warn('Advertencia poblando cache de búsqueda:', cacheErr.message);
    }

    // ----------------------------------------------------
    // PASO 3: GET /api/admin/overview: 200 y todas las claves presentes
    // ----------------------------------------------------
    logStep(3, 'Consultando GET /api/admin/overview y verificando estructura completa...');

    try {
      const overviewRes = await axios.get(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      if (overviewRes.status !== 200) {
        throw new Error(`Status inesperado: ${overviewRes.status}`);
      }

      const d = overviewRes.data;
      const data = d.data || d;

      // Verificar claves requeridas
      const requiredTopKeys = ['users', 'doctors', 'appointments', 'consultations', 'documents', 'ai'];
      for (const k of requiredTopKeys) {
        if (data[k] === undefined) {
          throw new Error(`Falta la clave raíz '${k}' en overview`);
        }
      }

      // Validar sub-claves
      if (typeof data.users.total !== 'number' || typeof data.users.doctors !== 'number') {
        throw new Error(`Estructura inválida en overview.users`);
      }
      if (typeof data.doctors.active !== 'number' || typeof data.doctors.inDirectory !== 'number' || !data.doctors.verification) {
        throw new Error(`Estructura inválida en overview.doctors`);
      }
      if (typeof data.appointments.today !== 'number' || typeof data.appointments.thisMonth !== 'number') {
        throw new Error(`Estructura inválida en overview.appointments`);
      }
      if (typeof data.consultations.completedThisMonth !== 'number') {
        throw new Error(`Estructura inválida en overview.consultations`);
      }
      if (typeof data.documents.thisMonth !== 'number') {
        throw new Error(`Estructura inválida en overview.documents`);
      }
      if (!data.ai.thisMonth || !Array.isArray(data.ai.topDoctors)) {
        throw new Error(`Estructura inválida en overview.ai`);
      }

      pass(`GET /admin/overview respondió 200 con todas las claves presentes`);
    } catch (err) {
      fail('GET /admin/overview falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 4: GET /api/admin/users?search=e2e.s7.: encuentra a ambos y sin passwords
    // ----------------------------------------------------
    logStep(4, 'Buscando usuarios de prueba (GET /api/admin/users?search=e2e.s7.)...');

    try {
      const usersRes = await axios.get(`${API_BASE}/admin/users?search=e2e.s7.`, {
        headers: { Authorization: `Bearer ${adminToken}` }
      });

      const usersList = usersRes.data.users || usersRes.data.data?.users || [];
      const rawString = JSON.stringify(usersRes.data);

      if (rawString.includes('"password"') || rawString.includes('password_hash')) {
        throw new Error('VIOLACIÓN DE SEGURIDAD: La respuesta contiene el campo password');
      }

      const foundDoc = usersList.find(u => u.id === docId);
      const foundPat = usersList.find(u => u.id === patId);

      if (!foundDoc || !foundPat) {
        throw new Error(`No se encontraron ambos usuarios. Encontrados: ${usersList.map(u => u.email).join(', ')}`);
      }

      pass(`Ambos usuarios encontrados (médico y paciente). Ninguna respuesta contiene 'password'`);
    } catch (err) {
      fail('Búsqueda de usuarios falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 5: El médico llama a GET /api/admin/overview: 403
    // ----------------------------------------------------
    logStep(5, 'Médico intenta acceder a GET /api/admin/overview (esperado: 403)...');

    try {
      await axios.get(`${API_BASE}/admin/overview`, {
        headers: { Authorization: `Bearer ${docToken}` }
      });
      fail('El médico pudo acceder a /admin/overview (debió responder 403)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass('Médico fue rechazado con 403 al intentar acceder a /admin/overview');
      } else {
        fail('Respuesta inesperada para médico en /admin/overview', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 6: Suspender médico sin reason: 400; con reason: 200
    // ----------------------------------------------------
    logStep(6, 'Suspendiendo al médico: validando rechazo sin motivo (400) y aprobación con motivo (200)...');

    // 6.1 Sin reason -> 400
    try {
      await axios.put(
        `${API_BASE}/admin/users/${docId}/status`,
        { isActive: false },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fail('Suspensión sin motivo debió responder 400');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 400) {
        pass('Suspensión sin motivo rechazada correctamente con 400');
      } else {
        fail('Respuesta inesperada para suspensión sin motivo', err);
        allPassed = false;
      }
    }

    // 6.2 Con reason -> 200
    try {
      const suspendRes = await axios.put(
        `${API_BASE}/admin/users/${docId}/status`,
        { isActive: false, reason: 'Suspensión preventiva por prueba automatizada e2e' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (suspendRes.status === 200 && suspendRes.data.user?.isActive === false) {
        pass('Médico suspendido con éxito (200, isActive: false, reason registrado)');
      } else {
        throw new Error(`Respuesta inesperada al suspender: ${JSON.stringify(suspendRes.data)}`);
      }
    } catch (err) {
      fail('Suspensión con motivo falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 7: Médico intenta login (403 ACCOUNT_SUSPENDED) y token anterior en ruta protegida (403 ACCOUNT_SUSPENDED)
    // ----------------------------------------------------
    logStep(7, 'Verificando bloqueo por suspensión: login y token previo (esperado 403 ACCOUNT_SUSPENDED)...');

    // 7.1 Intento de login con credenciales válidas
    try {
      await axios.post(`${API_BASE}/auth/login`, {
        email: docEmail,
        password: 'Password123!'
      });
      fail('Médico suspendido pudo iniciar sesión');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_SUSPENDED') {
        pass(`Login de médico suspendido rechazado con 403 y code: 'ACCOUNT_SUSPENDED'`);
      } else {
        fail('Respuesta inesperada al intentar login de cuenta suspendida', err);
        allPassed = false;
      }
    }

    // 7.2 Intento de usar token anterior en ruta protegida (/api/appointments/my)
    try {
      await axios.get(`${API_BASE}/appointments/my`, {
        headers: { Authorization: `Bearer ${docToken}` }
      });
      fail('Token anterior de médico suspendido fue aceptado en ruta protegida');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === 'ACCOUNT_SUSPENDED') {
        pass(`Token de médico suspendido rechazado en ruta protegida con 403 y code: 'ACCOUNT_SUSPENDED'`);
      } else {
        fail('Respuesta inesperada para token de cuenta suspendida', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // PASO 8: Médico ya no aparece en la búsqueda pública de médicos
    // ----------------------------------------------------
    logStep(8, 'Verificando exclusión del médico suspendido en búsqueda pública (/api/search/doctors)...');

    try {
      const searchRes = await axios.get(`${API_BASE}/search/doctors?query=Alejandro`);
      const docsFound = searchRes.data?.data?.doctors || searchRes.data?.doctors || [];
      const isPresent = docsFound.some(d => d.id === docId || d.email === docEmail || d.doctor_id === docId);

      if (isPresent) {
        throw new Error('El médico suspendido todavía aparece en la búsqueda pública');
      }
      pass('Médico suspendido ya NO aparece en la búsqueda pública (/api/search/doctors)');
    } catch (err) {
      fail('Verificación de exclusión en búsqueda pública falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 9: Reactivar médico (200), login exitoso y reaparece en búsqueda
    // ----------------------------------------------------
    logStep(9, 'Reactivando al médico (PUT /api/admin/users/:id/status { isActive: true })...');

    try {
      const reactivateRes = await axios.put(
        `${API_BASE}/admin/users/${docId}/status`,
        { isActive: true },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );

      if (reactivateRes.status === 200 && reactivateRes.data.user?.isActive === true) {
        pass('Médico reactivado exitosamente (200, isActive: true)');
      } else {
        throw new Error(`Respuesta inesperada: ${JSON.stringify(reactivateRes.data)}`);
      }

      // Probar que ahora sí puede iniciar sesión
      const newLoginRes = await axios.post(`${API_BASE}/auth/login`, {
        email: docEmail,
        password: 'Password123!'
      });

      if (newLoginRes.data.success || newLoginRes.data.token || newLoginRes.data.data?.token) {
        pass('Médico reactivado inició sesión correctamente');
      } else {
        throw new Error('Fallo al iniciar sesión tras reactivación');
      }

      // Probar que reaparece en la búsqueda pública
      const searchAfterRes = await axios.get(`${API_BASE}/search/doctors?query=Alejandro`);
      const docsAfter = searchAfterRes.data?.data?.doctors || searchAfterRes.data?.doctors || [];
      const reappeared = docsAfter.some(d => d.id === docId || d.email === docEmail || d.doctor_id === docId);

      if (reappeared) {
        pass('Médico reactivado volvió a aparecer en la búsqueda pública (/api/search/doctors)');
      } else {
        throw new Error('El médico reactivado no volvió a aparecer en la búsqueda');
      }
    } catch (err) {
      fail('Reactivación de médico falló', err);
      allPassed = false;
    }

    // ----------------------------------------------------
    // PASO 10: Intentar suspender a admin@citamed.ve: 403
    // ----------------------------------------------------
    logStep(10, 'Intentando suspender al administrador (esperado: 403)...');

    try {
      await axios.put(
        `${API_BASE}/admin/users/${adminId}/status`,
        { isActive: false, reason: 'Intento indebido de suspender a un admin' },
        { headers: { Authorization: `Bearer ${adminToken}` } }
      );
      fail('El sistema permitió suspender a un administrador (debió responder 403)');
      allPassed = false;
    } catch (err) {
      if (err.response?.status === 403) {
        pass('Intento de suspender al administrador fue rechazado correctamente con 403');
      } else {
        fail('Respuesta inesperada al intentar suspender admin', err);
        allPassed = false;
      }
    }

    // ----------------------------------------------------
    // RESUMEN FINAL
    // ----------------------------------------------------
    console.log(`\n======================================================`);
    if (allPassed) {
      console.log(`🎉 ${colors.green}${colors.bold}TODOS LOS PASOS DEL BLOQUE A (SUPERADMIN Y SUSPENSIÓN) PASARON EXITOSAMENTE!${colors.reset}`);
    } else {
      console.log(`❌ ${colors.red}${colors.bold}ALGUNOS PASOS FALLARON.${colors.reset}`);
    }
    console.log(`======================================================\n`);

    if (!allPassed) {
      process.exit(1);
    }
  } catch (globalErr) {
    console.error('Error no capturado en la ejecución de tests:', globalErr);
    process.exit(1);
  }
}

if (require.main === module) {
  runTest();
}

module.exports = runTest;

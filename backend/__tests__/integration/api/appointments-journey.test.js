/**
 * appointments-journey.test.js
 * CITAMED.VE - Automated Integration Test: Full Medical Appointment Flow
 *
 * Flujo validado:
 * 1. Registro de médico -> Auto-creación de su consultorio/clínica.
 * 2. Configuración de horarios y disponibilidad semanal.
 * 3. Registro de paciente.
 * 4. Consulta de slots disponibles y solicitud de Pre-Cita (status: pending).
 * 5. Aprobación/Confirmación por parte del médico (status: confirmed).
 * 6. Verificación en panel del paciente con información del consultorio y sede.
 */

const request = require('supertest');
const app = require('../../../src/server');

describe('Flujo End-to-End de Citas y Consultorios (Semana 4)', () => {
  let docToken;
  let docUser;
  let docProfileId;
  let patToken;
  let patUser;
  let appointmentId;
  let targetDate;

  const timestamp = Date.now();
  const uniqueId = String(timestamp).slice(-5);

  beforeAll(() => {
    // Calcular fecha para el próximo Lunes
    const today = new Date();
    const result = new Date(today);
    const currentDay = today.getDay();
    let daysToAdd = (1 - currentDay + 7) % 7;
    if (daysToAdd === 0) daysToAdd = 7;
    result.setDate(today.getDate() + daysToAdd);
    const y = result.getFullYear();
    const m = String(result.getMonth() + 1).padStart(2, '0');
    const d = String(result.getDate()).padStart(2, '0');
    targetDate = `${y}-${m}-${d}`;
  });

  test('Paso 1: Registro de Médico y auto-creación de Consultorio/Clínica', async () => {
    const response = await request(app)
      .post('/api/auth/register/doctor')
      .send({
        email: `dr.jest.${uniqueId}@citamed.ve`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true,
        firstName: 'Alejandro',
        lastName: 'Rivas',
        identificationNumber: `V-${uniqueId}777`,
        dateOfBirth: '1985-05-15',
        gender: 'male',
        phone: '+584149998877',
        mppsNumber: `MPPS-${uniqueId}`,
        specialtyId: 1,
        university: 'Universidad Central de Venezuela',
        graduationYear: 2012,
        clinicName: `Centro Médico Especializado ${uniqueId}`,
        consultationAddress: 'Av. Casanova, Edif. Torre Centro, Piso 5',
        city: 'Caracas',
        state: 'Distrito Capital',
        availableDays: ['monday', 'wednesday', 'friday'],
        startTime: '08:00',
        endTime: '13:00',
        priceConsultation: 40.00
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');
    expect(response.body.data).toHaveProperty('user');

    docToken = response.body.data.token;
    docUser = response.body.data.user;
    docProfileId = response.body.data.profile?.id;

    if (!docProfileId) {
      const meRes = await request(app)
        .get('/api/doctors/me')
        .set('Authorization', `Bearer ${docToken}`);
      docProfileId = meRes.body.data.id;
    }

    expect(docProfileId).toBeDefined();
  });

  test('Paso 2: Configuración de Disponibilidad Semanal del Médico', async () => {
    const response = await request(app)
      .post('/api/doctors/me/availability')
      .set('Authorization', `Bearer ${docToken}`)
      .send({
        schedules: [
          {
            dayOfWeek: 1, // Lunes
            startTime: '08:00',
            endTime: '12:00',
            slotDuration: 30,
            consultationType: 'presencial'
          }
        ]
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('Paso 3: Registro de Paciente', async () => {
    const response = await request(app)
      .post('/api/auth/register/patient')
      .send({
        email: `paciente.jest.${uniqueId}@citamed.ve`,
        password: 'Password123!',
        confirmPassword: 'Password123!',
        acceptTerms: true,
        firstName: 'María',
        lastName: 'Gómez',
        identificationNumber: `V-${uniqueId}333`,
        dateOfBirth: '1995-03-25',
        gender: 'female',
        phone: '+584128887766',
        bloodType: 'O+',
        emergencyContactName: 'Pedro Gómez',
        emergencyContactPhone: '+584145556677'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('token');

    patToken = response.body.data.token;
    patUser = response.body.data.user;
  });

  test('Paso 4: Paciente consulta turnos y solicita Pre-Cita', async () => {
    // 4.1 Consulta de slots
    const slotsRes = await request(app)
      .get(`/api/appointments/available-slots?doctorProfileId=${docProfileId}&date=${targetDate}`)
      .set('Authorization', `Bearer ${patToken}`);

    expect(slotsRes.status).toBe(200);
    expect(slotsRes.body.success).toBe(true);
    const slots = slotsRes.body.data?.slots || [];
    expect(slots.length).toBeGreaterThan(0);

    const chosenSlot = slots[0].start;

    // 4.2 Creación de Pre-Cita
    const createRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patToken}`)
      .send({
        doctorId: docUser.id,
        doctorProfileId: docProfileId,
        specialtyId: 1,
        appointmentDate: targetDate,
        appointmentTime: chosenSlot,
        reasonForVisit: 'Evaluación general y consulta de control',
        appointmentType: 'first_consultation'
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.success).toBe(true);
    expect(createRes.body.data.status).toBe('pending');
    expect(createRes.body.data.clinicId).toBeDefined();

    appointmentId = createRes.body.data.id;
  });

  test('Paso 5: Médico consulta su agenda y Acepta la Pre-Cita', async () => {
    // 5.1 Médico ve su agenda para la fecha
    const agendaRes = await request(app)
      .get(`/api/appointments/doctor/today?date=${targetDate}`)
      .set('Authorization', `Bearer ${docToken}`);

    expect(agendaRes.status).toBe(200);
    expect(agendaRes.body.success).toBe(true);
    const appointments = agendaRes.body.data || [];
    const found = appointments.find(a => a.id === appointmentId);
    expect(found).toBeDefined();
    expect(found.status).toBe('pending');

    // 5.2 Médico confirma la cita
    const confirmRes = await request(app)
      .put(`/api/appointments/${appointmentId}/confirm`)
      .set('Authorization', `Bearer ${docToken}`)
      .send({});

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.success).toBe(true);
    expect(confirmRes.body.data.status).toBe('confirmed');
  });

  test('Paso 6: Paciente consulta "Mis Citas" y verifica estado confirmado con consultorio', async () => {
    const misCitasRes = await request(app)
      .get('/api/appointments/my?upcoming=true')
      .set('Authorization', `Bearer ${patToken}`);

    expect(misCitasRes.status).toBe(200);
    expect(misCitasRes.body.success).toBe(true);
    const list = misCitasRes.body.data || [];
    const targetApt = list.find(a => a.id === appointmentId);

    expect(targetApt).toBeDefined();
    expect(targetApt.status).toBe('confirmed');
    expect(targetApt.clinic).toBeDefined();
    expect(targetApt.clinic.commercialName).toContain(`Centro Médico Especializado ${uniqueId}`);
  });
});

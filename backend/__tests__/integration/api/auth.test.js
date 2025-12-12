const request = require('supertest');
const app = require('../../../src/server');

describe('POST /api/auth/register', () => {
  const generateEmail = (prefix) => `test_${prefix}_${Date.now()}@test.com`;

  test('debe registrar un paciente exitosamente', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('patient'),
        password: 'TestPass123!',
        name: 'Test Patient',
        role: 'patient',
        phone: '+584121234567'
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('patient');
    expect(response.body.data.token).toBeDefined();
  });

  test('debe registrar un medico exitosamente', async () => {
    const specialtiesRes = await request(app).get('/api/specialties');
    const specialtyId = specialtiesRes.body.data?.[0]?.id || 1;

    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('doctor'),
        password: 'DoctorPass123!',
        name: 'Dr. Test',
        role: 'doctor',
        phone: '+584121234568',
        specialtyId: specialtyId,
        licenseNumber: `TEST-${Date.now()}`
      });

    if (response.status !== 201) {
      console.log('Doctor registration response:', response.body);
    }

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('doctor');
  });

  test('debe rechazar registro con email duplicado', async () => {
    const email = generateEmail('duplicate');

    await request(app).post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Test User',
      role: 'patient'
    });

    const response = await request(app).post('/api/auth/register').send({
      email,
      password: 'TestPass123!',
      name: 'Test User 2',
      role: 'patient'
    });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('debe rechazar registro sin campos requeridos', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('incomplete')
      });

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });

  test('debe rechazar registro con email invalido', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'email-invalido-sin-arroba',
        password: 'TestPass123!',
        name: 'Test User',
        role: 'patient'
      });

    expect([400, 500]).toContain(response.status);
    expect(response.body.success).toBe(false);
  });
});

describe('POST /api/auth/login', () => {
  const generateEmail = (prefix) => `login_${prefix}_${Date.now()}@test.com`;
  let testUsers = {};

  beforeAll(async () => {
    const patientRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('patient'),
        password: 'PatientPass123!',
        name: 'Test Patient Login',
        role: 'patient'
      });
    testUsers.patient = {
      email: patientRes.body.data.user.email,
      password: 'PatientPass123!'
    };

    const specialtiesRes = await request(app).get('/api/specialties');
    const specialtyId = specialtiesRes.body.data?.[0]?.id || 1;

    const doctorRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('doctor'),
        password: 'DoctorPass123!',
        name: 'Dr. Test Login',
        role: 'doctor',
        specialtyId: specialtyId,
        licenseNumber: `LOGIN-${Date.now()}`
      });
    testUsers.doctor = {
      email: doctorRes.body.data.user.email,
      password: 'DoctorPass123!'
    };

    const providerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: generateEmail('provider'),
        password: 'ProviderPass123!',
        name: 'Test Provider Login',
        role: 'provider'
      });
    testUsers.provider = {
      email: providerRes.body.data.user.email,
      password: 'ProviderPass123!'
    };
  });

  test('debe hacer login exitoso de paciente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.patient.email,
        password: testUsers.patient.password
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('patient');
    expect(response.body.data.token).toBeDefined();
    expect(response.body.data.token).toMatch(/^[A-Za-z0-9-_]+.[A-Za-z0-9-_]+.[A-Za-z0-9-_]+$/);
  });

  test('debe hacer login exitoso de medico', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.doctor.email,
        password: testUsers.doctor.password
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('doctor');
    expect(response.body.data.token).toBeDefined();
  });

  test('debe hacer login exitoso de proveedor', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.provider.email,
        password: testUsers.provider.password
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.user.role).toBe('provider');
    expect(response.body.data.token).toBeDefined();
  });

  test('debe rechazar login con contrasena incorrecta', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: testUsers.patient.email,
        password: 'ContrasenaIncorrecta123!'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/credenciales|invalid/i);
  });

  test('debe rechazar login con email inexistente', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'noencontrado@test.com',
        password: 'TestPass123!'
      });

    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
  });

  test('debe rechazar login sin credenciales', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.success).toBe(false);
  });
});

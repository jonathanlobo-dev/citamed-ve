const request = require('supertest');
const app = require('../../../src/server');

describe('GET /api/doctors', () => {
  let testDoctors = {};

  // Crear médicos de prueba
  beforeAll(async () => {
    const timestamp = Date.now();
    
    // Médico 1: Cardiólogo en Caracas
    const doctor1 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `cardiologist_${timestamp}@test.com`,
        password: 'TestPass123!',
        name: 'Dr. Carlos Cardio',
        role: 'doctor',
        licenseNumber: `CARD-${timestamp}`
      });
    testDoctors.cardiologo = doctor1.body.data;

    // Médico 2: Pediatra en Maracaibo
    const doctor2 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `pediatra_${timestamp}@test.com`,
        password: 'TestPass123!',
        name: 'Dra. Patricia Pedi',
        role: 'doctor',
        licenseNumber: `PEDI-${timestamp}`
      });
    testDoctors.pediatra = doctor2.body.data;

    // Médico 3: Dermatólogo en Caracas
    const doctor3 = await request(app)
      .post('/api/auth/register')
      .send({
        email: `dermatologo_${timestamp}@test.com`,
        password: 'TestPass123!',
        name: 'Dr. Daniel Derma',
        role: 'doctor',
        licenseNumber: `DERM-${timestamp}`
      });
    testDoctors.dermatologo = doctor3.body.data;
  });

  test('debe listar médicos correctamente', async () => {
    const response = await request(app)
      .get('/api/doctors');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
    expect(response.body).toHaveProperty('total');
    expect(response.body).toHaveProperty('page');
    expect(response.body).toHaveProperty('totalPages');
  });

  test('debe incluir médicos no verificados con flag de desarrollo', async () => {
    const response = await request(app)
      .get('/api/doctors?includeUnverified=true');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  test('debe filtrar médicos por ciudad', async () => {
    const response = await request(app)
      .get('/api/doctors?city=Caracas&includeUnverified=true');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    
    // Todos deben ser de Caracas
    response.body.data.forEach(doctor => {
      expect(doctor.city.toLowerCase()).toContain('caracas');
    });
  });

  test('debe buscar médicos por nombre', async () => {
    const response = await request(app)
      .get('/api/doctors?search=Carlos&includeUnverified=true');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });

  test('debe manejar paginación correctamente', async () => {
    const response = await request(app)
      .get('/api/doctors?page=1&limit=2&includeUnverified=true');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.length).toBeLessThanOrEqual(2);
    expect(response.body.page).toBe(1);
  });

  test('debe retornar estructura correcta para cada médico', async () => {
    const response = await request(app)
      .get('/api/doctors?includeUnverified=true');

    expect(response.status).toBe(200);
    
    if (response.body.data.length > 0) {
      const doctor = response.body.data[0];
      expect(doctor).toHaveProperty('id');
      expect(doctor).toHaveProperty('firstName');
      expect(doctor).toHaveProperty('lastName');
      expect(doctor).toHaveProperty('displayName');
      expect(doctor).toHaveProperty('verificationBadge');
    }
  });

  test('debe obtener un médico individual por ID', async () => {
    // Primero obtener lista para tener un ID válido
    const listResponse = await request(app)
      .get('/api/doctors?includeUnverified=true');
    
    if (listResponse.body.data.length > 0) {
      const firstDoctor = listResponse.body.data[0];
      
      const response = await request(app)
        .get(`/api/doctors/${firstDoctor.id}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(firstDoctor.id);
      expect(response.body.data).toHaveProperty('displayName');
    }
  });

  test('debe retornar 404 para médico inexistente', async () => {
    const response = await request(app)
      .get('/api/doctors/99999');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toMatch(/no encontrado/i);
  });
});

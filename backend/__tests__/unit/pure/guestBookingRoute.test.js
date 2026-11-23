jest.mock('../../../src/config/logger', () => ({ logger: { error: jest.fn(), info: jest.fn(), warn: jest.fn() } }));
jest.mock('../../../src/services/guestBookingService', () => ({
  getSlots: jest.fn(),
  createGuestAppointment: jest.fn()
}));

const express = require('express');
const request = require('supertest');

const OLD_ENV = process.env;

function buildApp() {
  jest.resetModules();
  // El router se vuelve a cargar para que cada prueba tenga sus propios límites de peticiones
  const router = require('../../../src/routes/guestBooking');
  const svc = require('../../../src/services/guestBookingService');
  const app = express();
  app.use(express.json());
  app.use('/api/guest-booking', router);
  return { app, svc };
}

afterEach(() => { process.env = OLD_ENV; });

describe('interruptor', () => {
  test('apagado responde 404 y no llega al servicio', async () => {
    process.env = { ...OLD_ENV, GUEST_BOOKING_ENABLED: 'false' };
    const { app } = buildApp();
    const a = await request(app).post('/api/guest-booking/appointments').send({});
    const b = await request(app).get('/api/guest-booking/slots?doctorProfileId=7&date=2099-03-10');
    expect(a.status).toBe(404);
    expect(b.status).toBe(404);
  });
});

describe('encendido', () => {
  beforeEach(() => {
    process.env = { ...OLD_ENV, GUEST_BOOKING_ENABLED: 'true' };
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  test('crear la cita responde 201 con los datos del servicio', async () => {
    const { app, svc } = buildApp();
    svc.createGuestAppointment.mockResolvedValue({ appointment: { id: 1 }, emailSent: true });
    const res = await request(app).post('/api/guest-booking/appointments').send({ a: 1 });
    expect(res.status).toBe(201);
    expect(res.body).toEqual({ success: true, data: { appointment: { id: 1 }, emailSent: true } });
  });

  test('un correo repetido llega como 409 ACCOUNT_EXISTS', async () => {
    const { app, svc } = buildApp();
    svc.createGuestAppointment.mockRejectedValue(Object.assign(new Error('Ya existe una cuenta'), { statusCode: 409, code: 'ACCOUNT_EXISTS', field: 'email' }));
    const res = await request(app).post('/api/guest-booking/appointments').send({});
    expect(res.status).toBe(409);
    expect(res.body).toMatchObject({ success: false, code: 'ACCOUNT_EXISTS', field: 'email' });
  });

  test('un error inesperado no filtra detalles', async () => {
    const { app, svc } = buildApp();
    svc.createGuestAppointment.mockRejectedValue(new Error('SELECT * FROM users falló'));
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const res = await request(app).post('/api/guest-booking/appointments').send({});
    spy.mockRestore();
    expect(res.status).toBe(500);
    expect(JSON.stringify(res.body)).not.toMatch(/SELECT/);
  });

  test('con Turnstile configurado y sin token se rechaza antes de crear nada', async () => {
    process.env.TURNSTILE_SECRET_KEY = 'secreto';
    const { app, svc } = buildApp();
    const res = await request(app).post('/api/guest-booking/appointments').send({});
    expect(res.status).toBe(403);
    expect(res.body.code).toBe('CAPTCHA_FAILED');
    expect(svc.createGuestAppointment).not.toHaveBeenCalled();
  });

  test('límite de peticiones: la séptima en una hora se bloquea', async () => {
    const { app, svc } = buildApp();
    svc.createGuestAppointment.mockResolvedValue({ appointment: { id: 1 }, emailSent: false });
    const statuses = [];
    for (let i = 0; i < 7; i += 1) {
      statuses.push((await request(app).post('/api/guest-booking/appointments').send({})).status);
    }
    expect(statuses.slice(0, 6).every((s) => s === 201)).toBe(true);
    expect(statuses[6]).toBe(429);
  });

  test('los horarios pasan los parámetros al servicio', async () => {
    const { app, svc } = buildApp();
    svc.getSlots.mockResolvedValue({ available: true, slots: [] });
    const res = await request(app).get('/api/guest-booking/slots?doctorProfileId=7&date=2099-03-10');
    expect(res.status).toBe(200);
    expect(svc.getSlots).toHaveBeenCalledWith('7', '2099-03-10');
  });
});

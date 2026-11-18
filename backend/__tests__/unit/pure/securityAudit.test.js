// Correcciones de la auditoría de seguridad (18/11/2026). Cada prueba fija una regla que antes se podía saltar.

jest.mock('../../../src/models', () => ({
  User: { findByPk: jest.fn(), update: jest.fn() },
  PatientProfile: { findByPk: jest.fn() },
  Appointment: { findOne: jest.fn() },
  Clinic: { findByPk: jest.fn() },
  ClinicLocation: { findByPk: jest.fn() },
  ClinicImage: { findByPk: jest.fn() }
}));

const fs = require('fs');
const path = require('path');
const jwt = require('jsonwebtoken');
const models = require('../../../src/models');
const { ALLOWED_ROLES } = require('../../../src/validators/authValidator');
const { requireDoctorPatientRelationship, requireClinicOwner } = require('../../../src/middleware/ownership');
const { passwordFingerprint, tokenPayload } = require('../../../src/utils/tokenFingerprint');
const { stripForPatient } = require('../../../src/utils/stripPrivateFields');
const profileController = require('../../../src/controllers/profileController');
const { authMiddleware } = require('../../../src/middleware/auth');

const SRC = path.join(__dirname, '../../../src');
const read = (f) => fs.readFileSync(path.join(SRC, f), 'utf8');

function mockRes() {
  const res = { statusCode: 200, body: undefined };
  res.status = jest.fn((c) => { res.statusCode = c; return res; });
  res.json = jest.fn((b) => { res.body = b; return res; });
  return res;
}
async function run(mw, req) {
  const res = mockRes();
  const next = jest.fn();
  await mw(req, res, next);
  return { res, next };
}

beforeAll(() => { process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-de-prueba'; });

describe('S-01: nadie se registra como administrador', () => {
  test('el validador no acepta admin', () => {
    expect(ALLOWED_ROLES).not.toContain('admin');
    expect(ALLOWED_ROLES).toEqual(['patient', 'doctor', 'provider']);
  });
  test('el controlador de registro tampoco', () => {
    const src = read('controllers/authController.js');
    expect(src).toMatch(/\['doctor', 'patient', 'provider'\]\.includes\(role\)/);
    expect(src).not.toMatch(/'provider', 'admin', 'clinic', 'insurer'/);
  });
});

describe('S-18: el perfil propio no cambia rol, correo ni clave', () => {
  test('solo se guardan los campos permitidos', async () => {
    models.User.update.mockResolvedValue([1]);
    const res = mockRes();
    await profileController.updateMyProfile({
      user: { id: 7 },
      body: { phone: '04141234567', role: 'admin', email: 'x@x.com', password: 'Hack1234', isActive: true, isVerified: true }
    }, res);
    expect(models.User.update).toHaveBeenCalledWith({ phone: '04141234567' }, { where: { id: 7 } });
  });
  test('si solo vienen campos prohibidos no se toca nada', async () => {
    const res = mockRes();
    await profileController.updateMyProfile({ user: { id: 7 }, body: { role: 'admin' } }, res);
    expect(models.User.update).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(400);
  });
});

describe('S-11: un médico solo ve pacientes con los que tiene citas', () => {
  test('sin cita: 403', async () => {
    models.PatientProfile.findByPk.mockResolvedValue({ id: 3, userId: 30 });
    models.Appointment.findOne.mockResolvedValue(null);
    const { res, next } = await run(requireDoctorPatientRelationship, { user: { id: 9, role: 'doctor' }, params: { patientId: '3' } });
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
    expect(models.Appointment.findOne).toHaveBeenCalledWith(expect.objectContaining({ where: { patientId: 30, doctorId: 9 } }));
  });
  test('con cita: pasa', async () => {
    models.PatientProfile.findByPk.mockResolvedValue({ id: 3, userId: 30 });
    models.Appointment.findOne.mockResolvedValue({ id: 1 });
    const { next } = await run(requireDoctorPatientRelationship, { user: { id: 9, role: 'doctor' }, params: { patientId: '3' } });
    expect(next).toHaveBeenCalledWith();
  });
  test('admin pasa sin consultar', async () => {
    const { next } = await run(requireDoctorPatientRelationship, { user: { id: 1, role: 'admin' }, params: { patientId: '3' } });
    expect(next).toHaveBeenCalledWith();
    expect(models.Appointment.findOne).not.toHaveBeenCalled();
  });
  test('las dos rutas de perfil del paciente lo usan', () => {
    const src = read('routes/patients.js');
    expect((src.match(/validatePatientId,\s*requireDoctorPatientRelationship,/g) || []).length).toBe(2);
  });
});

describe('S-14 y S-15: clínicas', () => {
  test('otro usuario no modifica una clínica ajena', async () => {
    models.Clinic.findByPk.mockResolvedValue({ id: 5, adminUserId: 50 });
    const { res, next } = await run(requireClinicOwner, { user: { id: 9, role: 'doctor' }, params: { clinicId: '5' } });
    expect(res.statusCode).toBe(403);
    expect(next).not.toHaveBeenCalled();
  });
  test('el dueño sí', async () => {
    models.Clinic.findByPk.mockResolvedValue({ id: 5, adminUserId: 9 });
    const { next } = await run(requireClinicOwner, { user: { id: 9, role: 'doctor' }, params: { clinicId: '5' } });
    expect(next).toHaveBeenCalledWith();
  });
  test('una sede de otra clínica no se acepta aunque la clínica sea mía', async () => {
    models.Clinic.findByPk.mockResolvedValue({ id: 5, adminUserId: 9 });
    models.ClinicLocation.findByPk.mockResolvedValue({ id: 70, clinicId: 6 });
    const { res, next } = await run(requireClinicOwner, { user: { id: 9, role: 'doctor' }, params: { clinicId: '5', locationId: '70' } });
    expect(res.statusCode).toBe(404);
    expect(next).not.toHaveBeenCalled();
  });
  test('una imagen de otra clínica tampoco', async () => {
    models.Clinic.findByPk.mockResolvedValue({ id: 5, adminUserId: 9 });
    models.ClinicImage.findByPk.mockResolvedValue({ id: 80, clinicId: 6 });
    const { res } = await run(requireClinicOwner, { user: { id: 9, role: 'doctor' }, params: { clinicId: '5', imageId: '80' } });
    expect(res.statusCode).toBe(404);
  });
  test('todas las rutas que modifican una clínica exigen ser el dueño, y verificar exige admin', () => {
    const src = read('routes/clinics.js');
    const mutantes = src.split('\n').filter((l) => /router\.(post|put|delete)\('\/:clinicId/.test(l));
    expect(mutantes.length).toBe(7);
    mutantes.forEach((l) => expect(l).toContain('requireClinicOwner'));
    expect(src).toMatch(/'\/:id\/verify', authenticateToken, requireRole\(\['admin'\]\)/);
  });
});

describe('S-02 y S-09: el token deja de servir al cambiar la clave', () => {
  const user = { id: 4, email: 'a@b.com', role: 'doctor', password: '$2b$12$hashviejo', isActive: true };
  const firmar = (payload, opts = {}) => jwt.sign(payload, process.env.JWT_SECRET, { algorithm: 'HS256', ...opts });

  test('la huella cambia si cambia la clave y no revela el hash', () => {
    const a = passwordFingerprint(user);
    expect(a).toHaveLength(16);
    expect(user.password).not.toContain(a);
    expect(passwordFingerprint({ ...user, password: '$2b$12$hashnuevo' })).not.toBe(a);
    expect(tokenPayload(user)).toEqual({ id: 4, email: 'a@b.com', role: 'doctor', pwv: a });
  });
  test('token con la clave actual: pasa', async () => {
    models.User.findByPk.mockResolvedValue({ ...user });
    const { next, res } = await run(authMiddleware, { headers: { authorization: `Bearer ${firmar(tokenPayload(user))}` }, originalUrl: '/api/x' });
    expect(res.statusCode).toBe(200);
    expect(next).toHaveBeenCalled();
  });
  test('token emitido antes de cambiar la clave: 401', async () => {
    const viejo = firmar(tokenPayload(user));
    models.User.findByPk.mockResolvedValue({ ...user, password: '$2b$12$hashnuevo' });
    const { res, next } = await run(authMiddleware, { headers: { authorization: `Bearer ${viejo}` }, originalUrl: '/api/x' });
    expect(res.statusCode).toBe(401);
    expect(res.body.code).toBe('SESSION_EXPIRED');
    expect(next).not.toHaveBeenCalled();
  });
  test('token antiguo sin huella: 401', async () => {
    models.User.findByPk.mockResolvedValue({ ...user });
    const { res } = await run(authMiddleware, { headers: { authorization: `Bearer ${firmar({ id: 4, role: 'doctor' })}` }, originalUrl: '/api/x' });
    expect(res.statusCode).toBe(401);
  });
  test('un token con otro algoritmo no se acepta', async () => {
    const none = jwt.sign(tokenPayload(user), null, { algorithm: 'none' });
    const { res } = await run(authMiddleware, { headers: { authorization: `Bearer ${none}` }, originalUrl: '/api/x' });
    expect(res.statusCode).not.toBe(200);
  });
});

describe('S-10: doctorNotes nunca sale hacia un paciente', () => {
  test('se quita en cualquier nivel', () => {
    const body = { success: true, data: { id: 1, doctorNotes: 'privado', diagnosis: 'x', items: [{ doctorNotes: 'p', ok: 1 }], d: new Date('2026-01-01T00:00:00Z') } };
    const out = stripForPatient(body);
    expect(JSON.stringify(out)).not.toContain('privado');
    expect(out.data.items[0]).toEqual({ ok: 1 });
    expect(out.data.diagnosis).toBe('x');
    expect(out.data.d).toBe('2026-01-01T00:00:00.000Z');
  });
  test('el middleware lo aplica a las respuestas de un paciente y no a las del médico', async () => {
    const paciente = { id: 2, role: 'patient', email: 'p@x.com', password: '$2b$h', isActive: true };
    models.User.findByPk.mockResolvedValue(paciente);
    const token = jwt.sign(tokenPayload(paciente), process.env.JWT_SECRET, { algorithm: 'HS256' });
    const res = mockRes();
    const enviado = [];
    res.json = jest.fn((b) => { enviado.push(b); return res; });
    await authMiddleware({ headers: { authorization: `Bearer ${token}` }, originalUrl: '/api/appointments/1/cancel' }, res, jest.fn());
    res.json({ data: { doctorNotes: 'privado', status: 'cancelled_patient' } });
    expect(enviado[0]).toEqual({ data: { status: 'cancelled_patient' } });
  });
});

describe('S-12, S-16, S-03, S-17: rutas y configuración', () => {
  test('importar pacientes, alergias, condiciones y validar o anular cobros exigen médico verificado', () => {
    const dp = read('routes/doctorPatients.js');
    ['/import', '/:patientId/allergies', '/:patientId/conditions'].forEach((r) => {
      const bloque = dp.slice(dp.indexOf(`'${r}'`), dp.indexOf(');', dp.indexOf(`'${r}'`)));
      expect(bloque).toContain('requireVerifiedDoctor');
    });
    const pay = read('routes/payments.js');
    ['approve', 'reject', 'void'].forEach((a) => {
      const linea = pay.slice(pay.indexOf(`/:id/${a}`)).split('\n')[1];
      expect(linea).toContain('requireVerifiedDoctor');
    });
  });
  test('la caché de búsqueda solo la toca un admin', () => {
    const src = read('routes/search.js');
    src.split('\n').filter((l) => l.includes("router.post('/cache")).forEach((l) => expect(l).toContain("requireRole(['admin'])"));
  });
  test('el servidor confía en el proxy de Render y /api/db-test no devuelve el error interno', () => {
    const src = read('server.js');
    expect(src).toContain("app.set('trust proxy', 1)");
    const dbTest = src.slice(src.indexOf('/api/db-test'), src.indexOf('/api/db-test') + 500);
    expect(dbTest).not.toContain('error.message');
  });
  test('el registro de errores no guarda el contenido del body', () => {
    const src = read('middleware/errorLogger.js');
    expect(src).toContain('fields: Object.keys(req.body)');
  });
});

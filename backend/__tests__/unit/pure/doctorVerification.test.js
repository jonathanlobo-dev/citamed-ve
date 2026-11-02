const fs = require('fs');
const path = require('path');

jest.mock('../../../src/models', () => ({ DoctorProfile: { findOne: jest.fn() } }));
const { DoctorProfile } = require('../../../src/models');
const { requireVerifiedDoctor, canPractice, isEnforced } = require('../../../src/middleware/doctorVerification');

function run(user) {
  const req = { user };
  const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
  const next = jest.fn();
  return requireVerifiedDoctor(req, res, next).then(() => ({ res, next }));
}

afterEach(() => { delete process.env.ENFORCE_DOCTOR_VERIFICATION; });

describe('canPractice', () => {
  test.each([
    [{ isVerified: true }, true],
    [{ isVerified: false }, false],
    [{ isVerified: null }, false],
    [{}, false],
    [null, false],
    [undefined, false]
  ])('%j => %s', (profile, expected) => {
    expect(canPractice(profile)).toBe(expected);
  });
});

describe('isEnforced', () => {
  test.each([['true', true], ['TRUE', true], ['false', false], ['', false], [undefined, false], ['1', false]])('%p => %s', (v, expected) => {
    expect(isEnforced({ ENFORCE_DOCTOR_VERIFICATION: v })).toBe(expected);
  });
});

describe('requireVerifiedDoctor', () => {
  test('apagado: deja pasar sin ni siquiera consultar la base', async () => {
    const { next } = await run({ id: 1, role: 'doctor' });
    expect(next).toHaveBeenCalledWith();
    expect(DoctorProfile.findOne).not.toHaveBeenCalled();
  });

  describe('encendido', () => {
    beforeEach(() => { process.env.ENFORCE_DOCTOR_VERIFICATION = 'true'; });

    test('médico verificado pasa', async () => {
      DoctorProfile.findOne.mockResolvedValue({ isVerified: true, verificationStatus: 'approved' });
      const { res, next } = await run({ id: 1, role: 'doctor' });
      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    });

    test.each(['unverified', 'pending', 'rejected', 'documents_incomplete'])('médico con estado %s es bloqueado', async (status) => {
      DoctorProfile.findOne.mockResolvedValue({ isVerified: false, verificationStatus: status });
      const { res, next } = await run({ id: 1, role: 'doctor' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ code: 'DOCTOR_NOT_VERIFIED', verificationStatus: status }));
    });

    test('médico sin perfil es bloqueado', async () => {
      DoctorProfile.findOne.mockResolvedValue(null);
      const { res, next } = await run({ id: 1, role: 'doctor' });
      expect(next).not.toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(403);
    });

    test.each(['admin', 'patient', 'assistant', 'provider'])('el rol %s no se evalúa aquí', async (role) => {
      const { next } = await run({ id: 1, role });
      expect(next).toHaveBeenCalledWith();
      expect(DoctorProfile.findOne).not.toHaveBeenCalled();
    });

    test('sin usuario pasa al siguiente (la autenticación se encarga)', async () => {
      const { next } = await run(undefined);
      expect(next).toHaveBeenCalledWith();
    });

    test('un fallo de base de datos se entrega al manejador de errores, no se deja pasar', async () => {
      const boom = new Error('db caída');
      DoctorProfile.findOne.mockRejectedValue(boom);
      const { next } = await run({ id: 1, role: 'doctor' });
      expect(next).toHaveBeenCalledWith(boom);
    });
  });
});

// Si alguien agrega una ruta clínica nueva y se olvida del bloqueo, esta prueba lo avisa.
describe('rutas protegidas por la verificación del médico', () => {
  const routesDir = path.join(__dirname, '../../../src/routes');
  const read = (f) => fs.readFileSync(path.join(routesDir, f), 'utf8');

  function block(src, routePath) {
    const i = src.indexOf(`'${routePath}',`);
    expect(i).toBeGreaterThan(-1);
    return src.slice(i, src.indexOf(');', i));
  }

  test.each([
    ['appointments.js', '/walk-in'],
    ['appointments.js', '/:id/start'],
    ['appointments.js', '/:id/clinical-note'],
    ['appointments.js', '/:id/complete'],
    ['appointments.js', '/:id/notes'],
    ['appointments.js', '/:id/ai-consent'],
    ['prescriptions.js', '/:id/void'],
    ['prescriptions.js', '/:id/patient-instructions'],
    ['medicalDocuments.js', '/:id/void'],
    ['payments.js', '/record'],
    ['payments.js', '/appointments/:appointmentId/record']
  ])('%s %s exige médico verificado', (file, route) => {
    expect(block(read(file), route)).toContain('requireVerifiedDoctor');
  });

  test('emitir récipes y documentos exige médico verificado', () => {
    expect(read('prescriptions.js')).toMatch(/router\.post\(\s*'\/',[\s\S]*?requireVerifiedDoctor/);
    expect(read('medicalDocuments.js')).toMatch(/router\.post\(\s*'\/',[\s\S]*?requireVerifiedDoctor/);
  });

  test('todas las rutas de IA exigen médico verificado', () => {
    expect(read('ai.js')).toMatch(/router\.use\(authenticateToken,[^\n]*requireVerifiedDoctor\);/);
  });

  test('el bloqueo va después de allowAssistant, para evaluar al médico y no a la asistente', () => {
    for (const f of ['appointments.js', 'payments.js']) {
      const src = read(f);
      const gate = src.indexOf('requireVerifiedDoctor,');
      expect(gate).toBeGreaterThan(-1);
      // en cada ruta que usa los dos, allowAssistant aparece antes
      for (const m of src.matchAll(/router\.\w+\(\s*'[^']+',[\s\S]*?\);/g)) {
        const chain = m[0];
        if (chain.includes('allowAssistant') && chain.includes('requireVerifiedDoctor')) {
          expect(chain.indexOf('allowAssistant')).toBeLessThan(chain.indexOf('requireVerifiedDoctor'));
        }
      }
    }
  });
});

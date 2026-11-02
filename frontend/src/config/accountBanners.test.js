import { describe, test, expect } from 'vitest';
import { getAccountBanners } from './accountBanners';

const user = (over = {}) => ({ id: 7, email: 'a@b.com', role: 'patient', emailVerified: true, ...over });
const doctor = (profile, over = {}) => user({ role: 'doctor', profile, ...over });
const keys = (u, p = '/dashboard') => getAccountBanners(u, p).map((b) => b.key);

describe('aviso de correo sin verificar', () => {
  test.each(['patient', 'doctor', 'provider'])('se muestra a %s con el correo sin verificar', (role) => {
    expect(keys(user({ role, emailVerified: false, profile: { isVerified: true } }))).toContain('email');
  });
  test('no se muestra si ya está verificado', () => {
    expect(keys(user())).toEqual([]);
  });
  test('no asusta con sesiones viejas donde emailVerified aún no existe', () => {
    expect(keys(user({ emailVerified: undefined }))).toEqual([]);
  });
  test.each(['admin', 'assistant'])('no se muestra a %s', (role) => {
    expect(keys(user({ role, emailVerified: false }))).toEqual([]);
  });
  test('el botón lleva a verificar y vuelve a la pantalla donde estaba', () => {
    const [b] = getAccountBanners(user({ emailVerified: false }), '/paciente/mis-citas');
    expect(b.to).toBe('/verificar/email?userId=7&email=a%40b.com&returnTo=%2Fpaciente%2Fmis-citas');
  });
});

describe('aviso de verificación profesional', () => {
  test('médico verificado no ve aviso', () => {
    expect(keys(doctor({ isVerified: true, verificationStatus: 'approved' }))).toEqual([]);
  });
  test.each([['pending', 'info', 'Ver estado'], ['unverified', 'info', 'Subir documentos'], ['documents_incomplete', 'info', 'Subir documentos'], ['rejected', 'danger', 'Subir documentos']])(
    'estado %s: tono %s, botón "%s"',
    (status, tone, label) => {
      const [b] = getAccountBanners(doctor({ isVerified: false, verificationStatus: status }), '/medico/dashboard');
      expect(b).toMatchObject({ key: 'doctor', tone, actionLabel: label, to: '/medico/verificacion' });
    }
  );
  test('el aviso dice claramente qué no puede hacer mientras tanto', () => {
    const [b] = getAccountBanners(doctor({ isVerified: false, verificationStatus: 'pending' }), '/medico/dashboard');
    expect(b.text).toMatch(/no puedes atender, emitir documentos ni cobrar/);
  });
  test('un estado desconocido se trata como sin verificar', () => {
    expect(keys(doctor({ isVerified: false, verificationStatus: 'raro' }))).toEqual(['doctor']);
  });
  test('correo sin verificar y médico sin verificar: salen los dos, el del correo primero', () => {
    expect(keys(doctor({ isVerified: false, verificationStatus: 'pending' }, { emailVerified: false }))).toEqual(['email', 'doctor']);
  });
  test('un paciente nunca ve el aviso profesional', () => {
    expect(keys(user({ profile: { isVerified: false } }))).toEqual([]);
  });
});

describe('dónde no se muestran', () => {
  test.each(['/login', '/registro', '/registro?role=doctor', '/forgot-password', '/reset-password', '/verificar/email', '/verificar/telefono', '/activar-asistente/abc', '/cita/xyz'])('%s', (path) => {
    expect(keys(user({ emailVerified: false }), path)).toEqual([]);
  });
  test('sin sesión no hay avisos', () => {
    expect(getAccountBanners(null, '/dashboard')).toEqual([]);
  });
});

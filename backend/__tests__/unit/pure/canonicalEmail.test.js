const { canonicalEmail, emailLookupCandidates, findUserByEmail } = require('../../../src/utils/canonicalEmail');

describe('correos', () => {
  test('se guardan tal cual, sin espacios y en minúsculas', () => {
    expect(canonicalEmail('  Ana.Rojas+Citas@Gmail.com ')).toBe('ana.rojas+citas@gmail.com');
  });

  test('al buscar se prueba la forma exacta y después la antigua', () => {
    expect(emailLookupCandidates('Ana.Rojas+x@gmail.com')).toEqual(['ana.rojas+x@gmail.com', 'anarojas@gmail.com']);
    expect(emailLookupCandidates('ana@correo.com')).toEqual(['ana@correo.com']);
  });

  test('una cuenta antigua guardada sin puntos sigue entrando', async () => {
    const User = { findOne: jest.fn(async ({ where }) => (where.email === 'anarojas@gmail.com' ? { id: 1 } : null)) };
    expect(await findUserByEmail(User, 'Ana.Rojas@gmail.com')).toEqual({ id: 1 });
  });

  test('un alias que existe tal cual gana sobre la cuenta principal', async () => {
    const User = { findOne: jest.fn(async ({ where }) => ({ id: where.email === 'ana+p@gmail.com' ? 2 : 1 })) };
    expect(await findUserByEmail(User, 'ana+p@gmail.com')).toEqual({ id: 2 });
  });
});

const { encrypt, decrypt, maskKey, getEncryptionKey } = require('../../../src/utils/secretCrypto');

describe('secretCrypto', () => {
  test('cifra y descifra de ida y vuelta', () => {
    const secret = 'gsk_llave-de-prueba-123';
    expect(decrypt(encrypt(secret))).toBe(secret);
  });

  test('conserva acentos, emojis y textos largos', () => {
    const txt = 'Clave ñandú 🔑 ' + 'x'.repeat(5000);
    expect(decrypt(encrypt(txt))).toBe(txt);
  });

  test('el formato es v1:iv:tag:datos', () => {
    const parts = encrypt('abc').split(':');
    expect(parts).toHaveLength(4);
    expect(parts[0]).toBe('v1');
    expect(parts[1]).toHaveLength(24);
    expect(parts[2]).toHaveLength(32);
  });

  test('el mismo texto cifrado dos veces da resultados distintos (IV aleatorio)', () => {
    expect(encrypt('igual')).not.toBe(encrypt('igual'));
  });

  test('el texto cifrado no contiene el secreto', () => {
    expect(encrypt('SECRETO-VISIBLE')).not.toContain('SECRETO-VISIBLE');
  });

  test('un objeto se guarda como JSON', () => {
    expect(JSON.parse(decrypt(encrypt({ a: 1 })))).toEqual({ a: 1 });
  });

  test('detecta manipulación del texto cifrado', () => {
    const parts = encrypt('intacto').split(':');
    parts[3] = (parts[3][0] === 'a' ? 'b' : 'a') + parts[3].slice(1);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test('detecta una etiqueta de autenticación alterada', () => {
    const parts = encrypt('intacto').split(':');
    parts[2] = '0'.repeat(32);
    expect(() => decrypt(parts.join(':'))).toThrow();
  });

  test.each([[null], [undefined], [''], [123]])('decrypt rechaza %p', (v) => {
    expect(() => decrypt(v)).toThrow(/Payload inválido/);
  });

  test.each([['v2:a:b:c'], ['v1:a:b'], ['texto-suelto']])('decrypt rechaza formato %s', (v) => {
    expect(() => decrypt(v)).toThrow(/Formato de cifrado/);
  });

  test.each([[null], [undefined]])('encrypt rechaza %p', (v) => {
    expect(() => encrypt(v)).toThrow(/nulo/);
  });

  test('sin llave configurada falla con un mensaje claro', () => {
    const saved = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    delete process.env.TWO_FACTOR_ENCRYPTION_KEY;
    expect(() => getEncryptionKey()).toThrow(/llave de cifrado/);
    process.env.TWO_FACTOR_ENCRYPTION_KEY = saved;
  });

  test('una llave que no mide 64 caracteres hex no se acepta', () => {
    const saved = process.env.TWO_FACTOR_ENCRYPTION_KEY;
    process.env.TWO_FACTOR_ENCRYPTION_KEY = 'corta';
    expect(() => getEncryptionKey()).toThrow();
    process.env.TWO_FACTOR_ENCRYPTION_KEY = saved;
  });

  test('PLATFORM_SETTINGS_KEY tiene prioridad sobre la llave de 2FA', () => {
    process.env.PLATFORM_SETTINGS_KEY = 'f'.repeat(64);
    expect(getEncryptionKey().toString('hex')).toBe('f'.repeat(64));
    delete process.env.PLATFORM_SETTINGS_KEY;
  });
});

describe('maskKey', () => {
  test.each([
    ['gsk_abcdefgh1234', '••••1234'],
    ['  AIzaSyXXXX9876  ', '••••9876'],
    ['abcd', '••••abcd'],
    ['ab', '••••ab'],
    ['', '••••'],
    [null, '••••'],
    [undefined, '••••'],
    [12345, '••••']
  ])('%p => %s', (input, expected) => {
    expect(maskKey(input)).toBe(expected);
  });

  test('nunca revela más de 4 caracteres', () => {
    expect(maskKey('0123456789').replace('••••', '')).toHaveLength(4);
  });
});

const { validatePaymentSettings } = require('../../../src/utils/paymentSettingsValidator');
const { VENEZUELAN_BANKS, isValidBankCode, getBankByCode } = require('../../../src/utils/venezuelanBanks');

const pagoMovil = (over = {}) => ({ enabled: true, bankCode: '0134', phone: '0414-123-4567', idType: 'v', idNumber: 'V-12.345.678', ...over });
const transferencia = (over = {}) => ({
  enabled: true, bankCode: '0102', accountNumber: '0102 0000 1234 5678 9012'.replace(/ /g, '') , holderName: 'Dr. Pérez', idType: 'V', idNumber: '12345678', ...over
});

describe('bancos venezolanos', () => {
  test('todos los códigos tienen 4 dígitos y no se repiten', () => {
    const codes = VENEZUELAN_BANKS.map((b) => b.code);
    codes.forEach((c) => expect(c).toMatch(/^\d{4}$/));
    expect(new Set(codes).size).toBe(codes.length);
  });
  test.each([['0102', true], ['0134', true], [' 0134 ', true], ['9999', false], ['', false], [null, false], [134, false]])('isValidBankCode(%p)', (c, ok) => {
    expect(isValidBankCode(c)).toBe(ok);
  });
  test('getBankByCode', () => {
    expect(getBankByCode('0134').name).toBe('Banesco');
    expect(getBankByCode('0000')).toBeNull();
  });
});

describe('validatePaymentSettings: estructura', () => {
  test('sin datos todo queda apagado', () => {
    expect(validatePaymentSettings({})).toEqual({
      pagoMovil: { enabled: false }, transferencia: { enabled: false }, zelle: { enabled: false },
      efectivoUsd: { enabled: false }, efectivoVes: { enabled: false }, notes: ''
    });
  });
  test('sin argumento usa el valor por defecto', () => {
    expect(validatePaymentSettings().notes).toBe('');
  });
  test.each([[null], [[]], ['texto'], [5]])('rechaza %p', (v) => {
    expect(() => validatePaymentSettings(v)).toThrow(/objeto válido/);
  });
  test('descarta claves desconocidas', () => {
    expect(validatePaymentSettings({ bitcoin: { enabled: true } }).bitcoin).toBeUndefined();
  });
  test('un método apagado no valida ni guarda sus campos', () => {
    expect(validatePaymentSettings({ pagoMovil: { enabled: false, bankCode: 'basura' } }).pagoMovil).toEqual({ enabled: false });
  });
  test('las notas se recortan y se cortan a 200', () => {
    expect(validatePaymentSettings({ notes: '  hola  ' }).notes).toBe('hola');
    expect(validatePaymentSettings({ notes: 'n'.repeat(500) }).notes).toHaveLength(200);
  });
  test('efectivo USD y VES', () => {
    const r = validatePaymentSettings({ efectivoUsd: { enabled: 1 }, efectivoVes: { enabled: 0 } });
    expect(r.efectivoUsd.enabled).toBe(true);
    expect(r.efectivoVes.enabled).toBe(false);
  });
});

describe('Pago Móvil', () => {
  test('normaliza teléfono, tipo y cédula', () => {
    expect(validatePaymentSettings({ pagoMovil: pagoMovil() }).pagoMovil)
      .toEqual({ enabled: true, bankCode: '0134', phone: '04141234567', idType: 'V', idNumber: '12345678' });
  });
  test('el teléfono +58 se guarda en formato local', () => {
    expect(validatePaymentSettings({ pagoMovil: pagoMovil({ phone: '+584241234567' }) }).pagoMovil.phone).toBe('04241234567');
  });
  test.each([
    [{ bankCode: '9999' }, /banco/i],
    [{ phone: '123' }, /Pago Móvil/],
    [{ phone: '' }, /Pago Móvil/],
    [{ idType: 'X' }, /Tipo de documento/],
    [{ idNumber: '123' }, /entre 6 y 9/],
    [{ idNumber: '' }, /entre 6 y 9/]
  ])('rechaza %j', (over, msg) => {
    expect(() => validatePaymentSettings({ pagoMovil: pagoMovil(over) })).toThrow(msg);
  });
  test.each(['V', 'E', 'J'])('acepta el tipo %s', (t) => {
    expect(validatePaymentSettings({ pagoMovil: pagoMovil({ idType: t }) }).pagoMovil.idType).toBe(t);
  });
});

describe('Transferencia', () => {
  test('acepta una cuenta de 20 dígitos', () => {
    const r = validatePaymentSettings({ transferencia: transferencia() }).transferencia;
    expect(r.enabled).toBe(true);
    expect(r.accountNumber).toHaveLength(20);
    expect(r.holderName).toBe('Dr. Pérez');
  });
  test('quita guiones y espacios de la cuenta', () => {
    expect(validatePaymentSettings({ transferencia: transferencia({ accountNumber: '0102-0000-1234-5678-9012' }) }).transferencia.accountNumber)
      .toBe('01020000123456789012');
  });
  test.each([
    [{ bankCode: 'x' }, /banco/i],
    [{ accountNumber: '123' }, /20 dígitos/],
    [{ accountNumber: '0'.repeat(21) }, /20 dígitos/],
    [{ holderName: 'ab' }, /titular/],
    [{ holderName: '   ' }, /titular/],
    [{ idType: 'P' }, /Tipo de documento/],
    [{ idNumber: '12' }, /entre 6 y 9/]
  ])('rechaza %j', (over, msg) => {
    expect(() => validatePaymentSettings({ transferencia: transferencia(over) })).toThrow(msg);
  });
  test('el titular se corta a 100 caracteres', () => {
    expect(validatePaymentSettings({ transferencia: transferencia({ holderName: 'N'.repeat(300) }) }).transferencia.holderName).toHaveLength(100);
  });
});

describe('Zelle', () => {
  test('normaliza el correo a minúsculas', () => {
    expect(validatePaymentSettings({ zelle: { enabled: true, email: ' Doc@Mail.COM ', holderName: 'Ana Pérez' } }).zelle)
      .toEqual({ enabled: true, email: 'doc@mail.com', holderName: 'Ana Pérez' });
  });
  test.each([['sin-arroba'], ['a@b'], ['a b@c.com'], ['']])('rechaza el correo %p', (email) => {
    expect(() => validatePaymentSettings({ zelle: { enabled: true, email, holderName: 'Ana' } })).toThrow(/Correo/);
  });
  test('rechaza titular corto', () => {
    expect(() => validatePaymentSettings({ zelle: { enabled: true, email: 'a@b.com', holderName: 'A' } })).toThrow(/titular/);
  });
});

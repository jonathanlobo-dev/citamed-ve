const {
  sanitizeXSS, sanitizeObject, xssSanitizer, contentTypeValidator, payloadSizeValidator
} = require('../../../src/middleware/sanitizer');

let warn;
beforeEach(() => { warn = jest.spyOn(console, 'warn').mockImplementation(() => {}); });
afterEach(() => { warn.mockRestore(); delete process.env.MAX_PAYLOAD_SIZE; });

describe('sanitizeXSS', () => {
  test.each([
    ['<script>alert(1)</script>Hola', 'Hola'],
    ['Hola <b>mundo</b>', 'Hola mundo'],
    ['<img src=x onerror=alert(1)>', ''],
    ['<SCRIPT SRC=//evil.js></SCRIPT>ok', 'ok'],
    ['javascript:alert(1)', 'alert(1)'],
    ['JaVaScRiPt:alert(1)', 'alert(1)']
  ])('%p => %p', (input, expected) => {
    expect(sanitizeXSS(input)).toBe(expected);
  });

  test.each([
    'Amoxicilina 875/125 mg cada 12 horas',
    'Dolor torácico > 20 minutos, TA 140/90',
    'Paciente refiere "dolor" & fiebre',
    "O'Brien Pérez Ñandú",
    'V-12345678',
    '5 < 10 y 10 > 5'
  ])('no corrompe texto clínico legítimo: %p', (text) => {
    expect(sanitizeXSS(text)).toBe(text);
  });

  test.each([[null], [undefined], [42], [true]])('deja intacto lo que no es texto (%p)', (v) => {
    expect(sanitizeXSS(v)).toBe(v);
  });
});

describe('sanitizeObject', () => {
  test('limpia texto anidado en objetos y listas', () => {
    expect(sanitizeObject({ a: '<b>x</b>', b: { c: ['<i>y</i>', 'z'] } })).toEqual({ a: 'x', b: { c: ['y', 'z'] } });
  });
  test('limpia también las claves', () => {
    expect(sanitizeObject({ '<script>x</script>nombre': 'ok' })).toEqual({ nombre: 'ok' });
  });
  test.each(['password', 'confirmPassword', 'currentPassword', 'newPassword', 'oldPassword'])('no toca la clave %s (podría llevar < o >)', (key) => {
    const pass = 'Ab<c>1!javascript:';
    expect(sanitizeObject({ [key]: pass })[key]).toBe(pass);
  });
  test('conserva números, booleanos y nulos', () => {
    expect(sanitizeObject({ n: 1, t: true, x: null, u: undefined })).toEqual({ n: 1, t: true, x: null, u: undefined });
  });
  test('no modifica el objeto original', () => {
    const original = { a: '<b>x</b>' };
    sanitizeObject(original);
    expect(original.a).toBe('<b>x</b>');
  });
});

describe('xssSanitizer (middleware)', () => {
  test('limpia body, query y params', () => {
    const req = { body: { a: '<b>1</b>' }, query: { q: '<i>2</i>' }, params: { id: '<u>3</u>' } };
    const next = jest.fn();
    xssSanitizer(req, {}, next);
    expect(req).toMatchObject({ body: { a: '1' }, query: { q: '2' }, params: { id: '3' } });
    expect(next).toHaveBeenCalledTimes(1);
  });
  test('sin body no falla', () => {
    const next = jest.fn();
    xssSanitizer({}, {}, next);
    expect(next).toHaveBeenCalledTimes(1);
  });
});

describe('contentTypeValidator', () => {
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });

  test.each(['application/json', 'application/json; charset=utf-8', 'multipart/form-data; boundary=x', 'application/x-www-form-urlencoded'])('acepta %s', (ct) => {
    const next = jest.fn();
    contentTypeValidator({ method: 'POST', headers: { 'content-type': ct }, body: { a: 1 } }, res(), next);
    expect(next).toHaveBeenCalled();
  });
  test('rechaza un tipo raro con cuerpo (415)', () => {
    const r = res();
    const next = jest.fn();
    contentTypeValidator({ method: 'POST', headers: { 'content-type': 'text/xml' }, body: { a: 1 }, ip: '1.1.1.1' }, r, next);
    expect(r.status).toHaveBeenCalledWith(415);
    expect(next).not.toHaveBeenCalled();
  });
  test('un GET no se valida', () => {
    const next = jest.fn();
    contentTypeValidator({ method: 'GET', headers: { 'content-type': 'text/xml' }, body: { a: 1 } }, res(), next);
    expect(next).toHaveBeenCalled();
  });
  test('un POST sin cuerpo pasa', () => {
    const next = jest.fn();
    contentTypeValidator({ method: 'POST', headers: {}, body: {} }, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

describe('payloadSizeValidator', () => {
  const res = () => ({ status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() });

  test('deja pasar 10 MB exactos y rechaza un byte más (413)', () => {
    const ok = jest.fn();
    payloadSizeValidator({ headers: { 'content-length': String(10 * 1024 * 1024) } }, res(), ok);
    expect(ok).toHaveBeenCalled();

    const r = res();
    const no = jest.fn();
    payloadSizeValidator({ headers: { 'content-length': String(10 * 1024 * 1024 + 1) }, ip: 'x' }, r, no);
    expect(r.status).toHaveBeenCalledWith(413);
    expect(no).not.toHaveBeenCalled();
  });
  test('respeta MAX_PAYLOAD_SIZE', () => {
    process.env.MAX_PAYLOAD_SIZE = '1000';
    const r = res();
    payloadSizeValidator({ headers: { 'content-length': '1001' }, ip: 'x' }, r, jest.fn());
    expect(r.status).toHaveBeenCalledWith(413);
  });
  test('sin cabecera de tamaño pasa', () => {
    const next = jest.fn();
    payloadSizeValidator({ headers: {} }, res(), next);
    expect(next).toHaveBeenCalled();
  });
});

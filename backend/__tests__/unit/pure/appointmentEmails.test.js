const {
  isTestEmail, isDeliverableEmail, appointmentInstant, inReminderWindow, formatDateEs, formatTimeEs, buildEmail, emailsEnabled
} = require('../../../src/utils/appointmentEmails');

describe('cuentas a las que no se les escribe', () => {
  test.each([
    'doctor@citamed.ve', 'paciente.test.19360@citamed.ve', 'DR@CITAMED.VE', 'alguien@example.com', 'x@example.org',
    'a@test.com', 'a@mock.io', 'carlos.mendoza@ejemplo.com'
  ])('%s es de prueba', (e) => { expect(isTestEmail(e)).toBe(true); });

  test.each(['persona@gmail.com', 'ana@citamedve.app', 'luis@hotmail.com', 'dra@clinica.com.ve'])('%s es real', (e) => {
    expect(isTestEmail(e)).toBe(false);
    expect(isDeliverableEmail(e)).toBe(true);
  });

  test.each([[''], [null], [undefined], ['sin-arroba'], ['a@b'], ['a b@c.com']])('%p no es entregable', (e) => {
    expect(isDeliverableEmail(e)).toBe(false);
  });
});

describe('instante de una cita (hora de Caracas, UTC-4)', () => {
  test('3:00 p. m. en Caracas son las 19:00 UTC', () => {
    expect(appointmentInstant('2026-11-09', '15:00:00').toISOString()).toBe('2026-11-09T19:00:00.000Z');
  });
  test('una cita de las 21:00 en Caracas cae al día siguiente en UTC', () => {
    expect(appointmentInstant('2026-11-09', '21:00').toISOString()).toBe('2026-11-10T01:00:00.000Z');
  });
  test.each([[null, '10:00'], ['2026-11-09', null], ['09/11/2026', '10:00'], ['2026-11-09', 'diez'], ['', '']])('datos inválidos (%p, %p)', (d, t) => {
    expect(appointmentInstant(d, t)).toBeNull();
  });
});

describe('ventana del recordatorio (20 a 28 horas antes)', () => {
  const now = new Date('2026-11-08T14:00:00Z');
  const inHours = (h) => new Date(now.getTime() + h * 3600000);

  test.each([[19.99, false], [20, true], [24, true], [28, true], [28.01, false], [2, false], [-1, false], [72, false]])('a %p horas: %s', (h, esperado) => {
    expect(inReminderWindow(now, inHours(h))).toBe(esperado);
  });
  test('sin instante no hay recordatorio', () => {
    expect(inReminderWindow(now, null)).toBe(false);
  });
  test('la ventana se puede cambiar', () => {
    expect(inReminderWindow(now, inHours(3), { fromHours: 2, toHours: 4 })).toBe(true);
  });
  test('con una pasada cada 30 minutos, cada cita cae al menos una vez en la ventana de 8 horas', () => {
    const cita = inHours(26.3);
    let veces = 0;
    for (let pasada = 0; pasada < 24 * 2; pasada += 1) {
      if (inReminderWindow(new Date(now.getTime() + pasada * 1800000), cita)) veces += 1;
    }
    expect(veces).toBeGreaterThan(0);
  });
});

describe('formato en español', () => {
  test.each([
    ['2026-11-09', 'lunes 9 de noviembre'],
    ['2026-11-08', 'domingo 8 de noviembre'],
    ['2026-12-31', 'jueves 31 de diciembre'],
    ['2027-01-01', 'viernes 1 de enero'],
    ['2028-02-29', 'martes 29 de febrero']
  ])('%s => %s', (d, e) => { expect(formatDateEs(d)).toBe(e); });
  test('no corre el día por la zona horaria', () => {
    expect(formatDateEs('2026-11-09T00:00:00.000Z')).toBe('lunes 9 de noviembre');
  });
  test.each([['00:00', '12:00 a. m.'], ['08:05', '8:05 a. m.'], ['11:59', '11:59 a. m.'], ['12:00', '12:00 p. m.'], ['15:30:00', '3:30 p. m.'], ['23:45', '11:45 p. m.']])('%s => %s', (t, e) => {
    expect(formatTimeEs(t)).toBe(e);
  });
  test.each([[''], [null], ['x']])('vacío o inválido (%p)', (v) => {
    expect(formatDateEs(v)).toBe('');
    expect(formatTimeEs(v)).toBe('');
  });
});

describe('textos de los correos', () => {
  const data = {
    patientName: 'María', doctorName: 'Dr(a). Alejandro Rivas', specialty: 'Medicina General', date: '2026-11-09', time: '15:30:00',
    location: 'Av. Libertador, Caracas', manageUrl: 'https://app.citamedve.app/paciente/mis-citas'
  };

  test('recordatorio sin enlace de confirmación apunta a Mis citas', () => {
    const e = buildEmail('reminder', data);
    expect(e.subject).toBe('Recordatorio: tu cita con Dr(a). Alejandro Rivas el lunes 9 de noviembre a las 3:30 p. m.');
    expect(e.html).toContain('https://app.citamedve.app/paciente/mis-citas');
    expect(e.html).toContain('Av. Libertador, Caracas');
    expect(e.text).toContain('lunes 9 de noviembre');
    expect(e.text).toContain('3:30 p. m.');
  });
  test('recordatorio con enlace de confirmación lo usa', () => {
    const e = buildEmail('reminder', { ...data, confirmUrl: 'https://app.citamedve.app/cita/abc123' });
    expect(e.html).toContain('https://app.citamedve.app/cita/abc123');
    expect(e.text).toContain('https://app.citamedve.app/cita/abc123');
  });
  test('confirmación al agendar', () => {
    const e = buildEmail('confirmation', data);
    expect(e.subject).toContain('quedó registrada');
    expect(e.html).toContain('El médico la revisará');
  });
  test.each([['doctor', 'el médico'], ['admin', 'la plataforma'], ['system', 'el sistema'], [undefined, 'el médico']])('cancelación por %p dice "%s"', (por, texto) => {
    expect(buildEmail('cancellation', { ...data, cancelledBy: por }).html).toContain(`cancelada por ${texto}`);
  });
  test('un tipo desconocido falla en vez de enviar algo raro', () => {
    expect(() => buildEmail('otro', data)).toThrow(/desconocido/);
  });
  test('el texto del paciente o del lugar nunca inyecta HTML', () => {
    const e = buildEmail('reminder', { ...data, patientName: '<script>x</script>', location: '"><img src=x onerror=alert(1)>' });
    expect(e.html).not.toContain('<script>');
    expect(e.html).not.toContain('<img');
    expect(e.html).toContain('&lt;script&gt;');
  });
  test('sin lugar ni especialidad no deja filas vacías', () => {
    const e = buildEmail('reminder', { ...data, location: '', specialty: '' });
    expect(e.html).not.toContain('Lugar');
    expect(e.html).not.toContain('Especialidad');
  });
  test('sin nombre del paciente saluda igual', () => {
    expect(buildEmail('reminder', { ...data, patientName: '' }).html).toContain('Hola,');
  });
  test('no usa guiones largos', () => {
    ['reminder', 'confirmation', 'cancellation'].forEach((k) => {
      const e = buildEmail(k, data);
      expect(`${e.subject}${e.html}${e.text}`).not.toMatch(/[–—]/);
    });
  });
});

describe('interruptor', () => {
  test.each([['true', true], ['TRUE', true], ['false', false], ['', false], [undefined, false], ['1', false], ['yes', false]])('%p => %s', (v, e) => {
    expect(emailsEnabled({ APPOINTMENT_EMAILS_ENABLED: v })).toBe(e);
  });
});

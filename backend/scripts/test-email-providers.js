/**
 * Prueba de proveedores de correo (sin red ni base de datos).
 * Simula fetch para comprobar que los correos de verificación, recuperación,
 * bienvenida y cambio de clave salen por Resend, y que sin proveedor fallan sin lanzar.
 * Uso: node backend/scripts/test-email-providers.js
 */
delete process.env.SENDGRID_API_KEY;
delete process.env.VERIFICATION_DEV_MODE;
process.env.RESEND_API_KEY = 'test-key';
process.env.RESEND_FROM = 'CitaMed <no-reply@citamedve.app>';

const calls = [];
global.fetch = async (url, opts) => {
  calls.push({ url, body: JSON.parse(opts.body) });
  return { ok: true, json: async () => ({ id: 'msg_test' }), text: async () => '' };
};

const emailService = require('../src/services/emailService');

let failures = 0;
const check = (name, cond) => {
  console.log(`${cond ? 'OK   ' : 'FALLA'} ${name}`);
  if (!cond) failures++;
};

(async () => {
  const jobs = {
    'verificación': () => emailService.sendVerificationEmail({ to: 'a@b.com', code: '123456', userName: 'Ana', token: 't' }),
    'recuperación de clave': () => emailService.sendPasswordResetEmail({ to: 'a@b.com', code: '123456', userName: 'Ana', token: 't' }),
    'bienvenida': () => emailService.sendWelcomeEmail({ to: 'a@b.com', userName: 'Ana', role: 'doctor' }),
    'clave cambiada': () => emailService.sendPasswordChangedConfirmation({ to: 'a@b.com', userName: 'Ana', timestamp: new Date().toISOString() })
  };

  for (const [name, run] of Object.entries(jobs)) {
    calls.length = 0;
    const res = await run();
    check(`${name}: éxito con Resend`, res.success === true && res.messageId === 'msg_test');
    check(`${name}: una llamada a Resend con remitente de CitaMed`,
      calls.length === 1 && calls[0].url.includes('resend.com') && calls[0].body.from.includes('citamedve.app') && calls[0].body.to[0] === 'a@b.com');
  }

  delete process.env.RESEND_API_KEY;
  const none = await emailService.sendPasswordResetEmail({ to: 'a@b.com', code: '1', token: 't' });
  check('sin proveedor: devuelve success false y no lanza', none.success === false);

  console.log(failures ? `\n${failures} comprobación(es) fallaron` : '\nTodo bien');
  process.exit(failures ? 1 : 0);
})();

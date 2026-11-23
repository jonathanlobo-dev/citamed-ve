/**
 * canonicalEmail.js - CITAMED.VE
 * Los correos se guardan tal como los escribe la persona, solo sin espacios y en minúsculas.
 * Así un alias (nombre+algo@gmail.com) es una cuenta aparte. La cédula única ya impide
 * que una persona tenga varias cuentas de paciente.
 *
 * Hasta el 22/11 los Gmail se guardaban "limpios" (sin puntos ni +alias). Para no dejar
 * afuera a esas cuentas, al buscar se prueba también esa forma (emailLookupCandidates).
 */
const validator = require('validator');

function canonicalEmail(email) {
  return String(email || '').trim().toLowerCase();
}

/** Formas posibles en que puede estar guardado un correo, la exacta primero */
function emailLookupCandidates(email) {
  const exact = canonicalEmail(email);
  if (!exact) return [];
  const legacy = validator.normalizeEmail(exact) || exact;
  return legacy === exact ? [exact] : [exact, legacy];
}

/** Busca un usuario por correo: primero la forma exacta y, si no está, la forma antigua */
async function findUserByEmail(User, email, options = {}) {
  for (const candidate of emailLookupCandidates(email)) {
    const user = await User.findOne({ ...options, where: { ...(options.where || {}), email: candidate } });
    if (user) return user;
  }
  return null;
}

module.exports = { canonicalEmail, emailLookupCandidates, findUserByEmail };

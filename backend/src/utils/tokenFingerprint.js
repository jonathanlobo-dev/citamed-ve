/**
 * tokenFingerprint.js - CITAMED.VE
 * Huella corta de la clave actual del usuario que viaja dentro del JWT (campo pwv).
 * Si el usuario cambia o recupera su clave, la huella cambia y todos sus tokens anteriores dejan de servir.
 * No revela la clave: es un pedazo del SHA-256 del hash bcrypt ya guardado.
 */
const crypto = require('crypto');

function passwordFingerprint(user) {
  if (!user || !user.password) return null;
  return crypto.createHash('sha256').update(String(user.password)).digest('hex').slice(0, 16);
}

function tokenPayload(user) {
  return { id: user.id, email: user.email, role: user.role, pwv: passwordFingerprint(user) };
}

module.exports = { passwordFingerprint, tokenPayload };

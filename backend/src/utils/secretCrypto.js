/**
 * secretCrypto.js - CITAMED.VE
 * M01 / Semana 7 - Cifrado autenticado (AES-256-GCM) para secretos y configuraciones
 */

const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 12 bytes recomendados para GCM

/**
 * Obtiene la llave de cifrado de 32 bytes (64 caracteres hex)
 * Prioridad: PLATFORM_SETTINGS_KEY > TWO_FACTOR_ENCRYPTION_KEY
 */
function getEncryptionKey() {
  const hexRegex = /^[0-9a-fA-F]{64}$/;
  
  if (process.env.PLATFORM_SETTINGS_KEY && hexRegex.test(process.env.PLATFORM_SETTINGS_KEY)) {
    return Buffer.from(process.env.PLATFORM_SETTINGS_KEY, 'hex');
  }
  
  if (process.env.TWO_FACTOR_ENCRYPTION_KEY && hexRegex.test(process.env.TWO_FACTOR_ENCRYPTION_KEY)) {
    return Buffer.from(process.env.TWO_FACTOR_ENCRYPTION_KEY, 'hex');
  }

  throw new Error('No hay llave de cifrado configurada');
}

/**
 * Cifra un texto plano usando AES-256-GCM
 * Formato de salida: 'v1:<iv hex>:<tag hex>:<cifrado hex>'
 * @param {string} text - Texto plano a cifrar
 * @returns {string} - Cadena cifrada versionada
 */
function encrypt(text) {
  if (text === null || text === undefined) {
    throw new Error('Texto a cifrar no puede ser nulo o indefinido');
  }

  const stringToEncrypt = typeof text === 'string' ? text : JSON.stringify(text);
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([
    cipher.update(stringToEncrypt, 'utf8'),
    cipher.final()
  ]);
  const tag = cipher.getAuthTag();

  return `v1:${iv.toString('hex')}:${tag.toString('hex')}:${encrypted.toString('hex')}`;
}

/**
 * Descifra una cadena previamente cifrada con encrypt()
 * @param {string} payload - Formato 'v1:<iv hex>:<tag hex>:<cifrado hex>'
 * @returns {string} - Texto plano descifrado
 */
function decrypt(payload) {
  if (!payload || typeof payload !== 'string') {
    throw new Error('Payload inválido para descifrar');
  }

  const parts = payload.split(':');
  if (parts.length !== 4 || parts[0] !== 'v1') {
    throw new Error('Formato de cifrado no soportado');
  }

  const [, ivHex, tagHex, encryptedHex] = parts;
  const key = getEncryptionKey();
  const iv = Buffer.from(ivHex, 'hex');
  const tag = Buffer.from(tagHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final()
  ]);

  return decrypted.toString('utf8');
}

/**
 * Enmascara una llave mostrando solo los últimos 4 caracteres
 * @param {string} plain - Llave en texto plano
 * @returns {string} - Llave enmascarada ('••••' + últimos 4 caracteres)
 */
function maskKey(plain) {
  if (!plain || typeof plain !== 'string') {
    return '••••';
  }
  const clean = plain.trim();
  if (clean.length <= 4) {
    return '••••' + clean;
  }
  return '••••' + clean.slice(-4);
}

module.exports = {
  encrypt,
  decrypt,
  maskKey,
  getEncryptionKey
};

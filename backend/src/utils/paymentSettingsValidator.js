/**
 * paymentSettingsValidator.js - CITAMED.VE
 * M05 / Semana 8 - Validador y sanitizador de métodos de cobro del médico
 */

const { isValidBankCode } = require('./venezuelanBanks');
const { normalizePhoneVE } = require('./identity');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ACCOUNT_REGEX = /^\d{20}$/;
const DIGITS_REGEX = /^\d{6,9}$/;
const VALID_ID_TYPES = ['V', 'E', 'J'];

/**
 * Valida y sanitiza el objeto paymentSettings del médico.
 * Descarta cualquier clave desconocida y valida campos requeridos cuando un método está enabled.
 *
 * @param {Object} input - Datos recibidos del cliente
 * @returns {Object} paymentSettings limpio y estructurado
 * @throws {Error} con statusCode 400 si algún campo obligatorio o formato es inválido
 */
function validatePaymentSettings(input = {}) {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    const err = new Error('Los métodos de cobro deben ser un objeto válido');
    err.statusCode = 400;
    throw err;
  }

  const clean = {
    pagoMovil: { enabled: false },
    transferencia: { enabled: false },
    zelle: { enabled: false },
    efectivoUsd: { enabled: false },
    efectivoVes: { enabled: false },
    notes: ''
  };

  // 1. Pago Móvil
  if (input.pagoMovil && typeof input.pagoMovil === 'object') {
    const pm = input.pagoMovil;
    const enabled = Boolean(pm.enabled);
    if (enabled) {
      const bankCode = String(pm.bankCode || '').trim();
      if (!isValidBankCode(bankCode)) {
        const err = new Error('Pago Móvil: Código de banco no válido');
        err.statusCode = 400;
        throw err;
      }

      let phone;
      try {
        const norm = normalizePhoneVE(pm.phone);
        phone = '0' + norm.slice(3); // Formato local venezolano 04141234567
      } catch (e) {
        const err = new Error(`Pago Móvil: ${e.message || 'Teléfono no válido'}`);
        err.statusCode = 400;
        throw err;
      }

      const idType = String(pm.idType || '').trim().toUpperCase();
      if (!VALID_ID_TYPES.includes(idType)) {
        const err = new Error('Pago Móvil: Tipo de documento inválido (debe ser V, E o J)');
        err.statusCode = 400;
        throw err;
      }

      const idNumber = String(pm.idNumber || '').replace(/\D/g, '');
      if (!DIGITS_REGEX.test(idNumber)) {
        const err = new Error('Pago Móvil: Número de cédula/RIF debe tener entre 6 y 9 dígitos');
        err.statusCode = 400;
        throw err;
      }

      clean.pagoMovil = {
        enabled: true,
        bankCode,
        phone,
        idType,
        idNumber
      };
    } else {
      clean.pagoMovil = { enabled: false };
    }
  }

  // 2. Transferencia bancaria
  if (input.transferencia && typeof input.transferencia === 'object') {
    const tr = input.transferencia;
    const enabled = Boolean(tr.enabled);
    if (enabled) {
      const bankCode = String(tr.bankCode || '').trim();
      if (!isValidBankCode(bankCode)) {
        const err = new Error('Transferencia: Código de banco no válido');
        err.statusCode = 400;
        throw err;
      }

      const accountNumber = String(tr.accountNumber || '').replace(/\D/g, '');
      if (!ACCOUNT_REGEX.test(accountNumber)) {
        const err = new Error('Transferencia: El número de cuenta debe tener exactamente 20 dígitos');
        err.statusCode = 400;
        throw err;
      }

      const holderName = String(tr.holderName || '').trim();
      if (!holderName || holderName.length < 3) {
        const err = new Error('Transferencia: Nombre del titular requerido (mínimo 3 caracteres)');
        err.statusCode = 400;
        throw err;
      }

      const idType = String(tr.idType || '').trim().toUpperCase();
      if (!VALID_ID_TYPES.includes(idType)) {
        const err = new Error('Transferencia: Tipo de documento inválido (debe ser V, E o J)');
        err.statusCode = 400;
        throw err;
      }

      const idNumber = String(tr.idNumber || '').replace(/\D/g, '');
      if (!DIGITS_REGEX.test(idNumber)) {
        const err = new Error('Transferencia: Número de cédula/RIF debe tener entre 6 y 9 dígitos');
        err.statusCode = 400;
        throw err;
      }

      clean.transferencia = {
        enabled: true,
        bankCode,
        accountNumber,
        holderName: holderName.slice(0, 100),
        idType,
        idNumber
      };
    } else {
      clean.transferencia = { enabled: false };
    }
  }

  // 3. Zelle
  if (input.zelle && typeof input.zelle === 'object') {
    const z = input.zelle;
    const enabled = Boolean(z.enabled);
    if (enabled) {
      const email = String(z.email || '').trim().toLowerCase();
      if (!EMAIL_REGEX.test(email)) {
        const err = new Error('Zelle: Correo electrónico no válido');
        err.statusCode = 400;
        throw err;
      }

      const holderName = String(z.holderName || '').trim();
      if (!holderName || holderName.length < 3) {
        const err = new Error('Zelle: Nombre del titular requerido (mínimo 3 caracteres)');
        err.statusCode = 400;
        throw err;
      }

      clean.zelle = {
        enabled: true,
        email: email.slice(0, 120),
        holderName: holderName.slice(0, 100)
      };
    } else {
      clean.zelle = { enabled: false };
    }
  }

  // 4. Efectivo USD
  if (input.efectivoUsd && typeof input.efectivoUsd === 'object') {
    clean.efectivoUsd = { enabled: Boolean(input.efectivoUsd.enabled) };
  }

  // 5. Efectivo VES
  if (input.efectivoVes && typeof input.efectivoVes === 'object') {
    clean.efectivoVes = { enabled: Boolean(input.efectivoVes.enabled) };
  }

  // 6. Notas adicionales
  if (input.notes && typeof input.notes === 'string') {
    clean.notes = input.notes.trim().slice(0, 200);
  }

  return clean;
}

module.exports = {
  validatePaymentSettings
};

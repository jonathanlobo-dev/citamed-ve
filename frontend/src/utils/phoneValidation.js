/**
 * phoneValidation.js - CITAMED.VE
 * Mensajes claros para el teléfono venezolano: dice exactamente qué está mal
 * (faltan o sobran números, o el código no es de celular) en vez de un genérico "no válido".
 */

export const MOBILE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'];
const LANDLINE_PREFIXES = ['0212', '0241', '0243', '0251', '0261', '0281'];

/**
 * Devuelve el mensaje de error o null si está bien.
 * @param {string} value lo que escribió la persona
 * @param {{ allowLandline?: boolean }} opts acepta fijos (contacto de emergencia)
 */
export function phoneError(value, { allowLandline = false } = {}) {
  const digits = String(value || '').replace(/\D/g, '');
  if (!digits) return 'Escribe tu teléfono';
  const prefixes = allowLandline ? [...MOBILE_PREFIXES, ...LANDLINE_PREFIXES] : MOBILE_PREFIXES;
  if (digits.length >= 4 && !prefixes.includes(digits.slice(0, 4))) {
    return allowLandline
      ? 'El código no es de Venezuela. Ejemplo: 0414 1234567 o 0212 1234567'
      : `Debe empezar por ${MOBILE_PREFIXES.join(', ')}`;
  }
  if (digits.length < 11) {
    const faltan = 11 - digits.length;
    return `Te ${faltan === 1 ? 'falta 1 número' : `faltan ${faltan} números`}: son 11 dígitos, por ejemplo 0414 1234567`;
  }
  if (digits.length > 11) return 'Sobran números: son 11 dígitos, por ejemplo 0414 1234567';
  return null;
}

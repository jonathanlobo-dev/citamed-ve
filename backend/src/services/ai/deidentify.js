/**
 * deidentify.js - CITAMED.VE
 * M03 / Semana 7 - Anonimización de datos del paciente antes del envío a proveedores de IA
 */

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Convierte una cadena en una expresión regular insensible a mayúsculas y acentos
 */
function makeAccentInsensitivePattern(str) {
  const accentMap = {
    a: '[aáàäâã]',
    e: '[eéèëê]',
    i: '[iíìïî]',
    o: '[oóòöôõ]',
    u: '[uúùüû]',
    n: '[nñ]',
    c: '[cç]'
  };

  return str
    .split('')
    .map((char) => {
      const lower = char.toLowerCase();
      const stripped = lower.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      if (accentMap[stripped]) {
        return accentMap[stripped];
      }
      return escapeRegex(char);
    })
    .join('');
}

/**
 * Anonimiza texto clínico eliminando identificadores del paciente
 * Regla:
 * - Nombre completo y cada nombre/apellido de 3 o más letras -> [PACIENTE]
 * - Cédula con o sin prefijo V-/E-/J-/G- y con o sin puntos -> [CÉDULA]
 * - Teléfono (últimos 7 dígitos, con o sin separadores) -> [TELÉFONO]
 * - Correo -> [CORREO]
 * 
 * @param {string} text - Texto clínico a anonimizar
 * @param {Object} patientData - Datos del paciente
 * @param {string} [patientData.firstName]
 * @param {string} [patientData.lastName]
 * @param {string} [patientData.identificationNumber]
 * @param {string} [patientData.phone]
 * @param {string} [patientData.email]
 * @returns {string} - Texto anonimizado
 */
function deidentify(text, patientData = {}) {
  if (!text || typeof text !== 'string') return '';
  let result = text;

  const { firstName = '', lastName = '', identificationNumber = '', phone = '', email = '' } = patientData;

  // 1. Anonimizar correo electrónico
  if (email && email.trim()) {
    const emailPattern = new RegExp(escapeRegex(email.trim()), 'gi');
    result = result.replace(emailPattern, '[CORREO]');
  }
  // También anonimizar cualquier correo genérico por si acaso
  result = result.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/gi, '[CORREO]');

  // 2. Anonimizar teléfono (últimos 7 dígitos con o sin código de área)
  if (phone) {
    const phoneDigits = String(phone).replace(/\D/g, '');
    if (phoneDigits.length >= 7) {
      const last7 = phoneDigits.slice(-7);
      const last7Pattern = last7.split('').join('[-.\\s]?');
      // Coincide con prefijo opcional (+58, 0414, 0424, etc.) seguido de los 7 dígitos
      const fullPhoneRegex = new RegExp(`(?:(?:\\+?58|0)?[24]\\d{2}[-.\\s]*)?${last7Pattern}\\b`, 'g');
      result = result.replace(fullPhoneRegex, '[TELÉFONO]');
    }
  }

  // 3. Anonimizar cédula (con o sin prefijo V-/E-/J-/G- y con o sin puntos)
  if (identificationNumber) {
    const rawCedula = String(identificationNumber).trim();
    const idDigits = rawCedula.replace(/\D/g, '');
    if (idDigits.length >= 4) {
      // Coincide con dígitos con puntos o espacios opcionales
      const digitsPattern = idDigits.split('').join('[.\\s]?');
      // Con o sin prefijo V-, E-, J-, G-, V., etc.
      const cedulaRegex = new RegExp(`\\b(?:[VEJGPvejgp][-.:\\s]?)?${digitsPattern}\\b`, 'g');
      result = result.replace(cedulaRegex, '[CÉDULA]');
    }
  }

  // 4. Anonimizar nombres y apellidos
  const nameParts = [];
  const fullFullName = `${firstName || ''} ${lastName || ''}`.trim();
  if (fullFullName.length >= 3) {
    nameParts.push(fullFullName);
  }

  // Extraer palabras individuales de firstName y lastName
  const rawWords = `${firstName || ''} ${lastName || ''}`
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length >= 3);

  nameParts.push(...rawWords);

  // Ordenar de más largo a más corto para reemplazar nombres compuestos primero
  const uniqueNameParts = Array.from(new Set(nameParts)).sort((a, b) => b.length - a.length);

  for (const part of uniqueNameParts) {
    const patternStr = makeAccentInsensitivePattern(part);
    // Bounded by non-word or non-letter
    const regex = new RegExp(`(?<![a-zA-ZáéíóúÁÉÍÓÚñÑ])${patternStr}(?![a-zA-ZáéíóúÁÉÍÓÚñÑ])`, 'gi');
    result = result.replace(regex, '[PACIENTE]');
  }

  return result;
}

module.exports = {
  deidentify
};

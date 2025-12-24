// src/utils/deviceDetector.js
// CITAMED.VE - M01 Sub-Partida 2.4.3 Session Management
// Utilidad para detectar información del dispositivo

const UAParser = require('ua-parser-js');

/**
 * Parsea User-Agent y extrae información del dispositivo
 * @param {string} userAgent - User-Agent string del navegador
 * @returns {Object} Información del dispositivo
 */
function parseUserAgent(userAgent) {
  if (!userAgent) {
    return {
      deviceType: 'unknown',
      deviceName: 'Dispositivo desconocido',
      browser: null,
      os: null,
      browserVersion: null,
      osVersion: null
    };
  }

  const parser = new UAParser(userAgent);
  const result = parser.getResult();

  // Determinar tipo de dispositivo
  let deviceType = 'desktop';
  const device = result.device;

  if (device.type === 'mobile') {
    deviceType = 'mobile';
  } else if (device.type === 'tablet') {
    deviceType = 'tablet';
  } else if (device.type === 'smarttv' || device.type === 'wearable' || device.type === 'embedded') {
    deviceType = 'unknown';
  }

  // Construir nombre del dispositivo
  const browserName = result.browser.name || 'Navegador';
  const browserVersion = result.browser.version ? result.browser.version.split('.')[0] : '';
  const osName = result.os.name || 'Sistema';
  const osVersion = result.os.version || '';

  const deviceName = browserVersion
    ? `${browserName} ${browserVersion} en ${osName}${osVersion ? ' ' + osVersion : ''}`
    : `${browserName} en ${osName}`;

  return {
    deviceType,
    deviceName,
    browser: result.browser.name || null,
    browserVersion: result.browser.version || null,
    os: result.os.name || null,
    osVersion: result.os.version || null,
    deviceModel: device.model || null,
    deviceVendor: device.vendor || null
  };
}

/**
 * Obtiene la IP real del cliente considerando proxies
 * @param {Object} req - Request object de Express
 * @returns {string} Dirección IP
 */
function getClientIP(req) {
  // Orden de prioridad para determinar IP real
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    // X-Forwarded-For puede contener múltiples IPs separadas por coma
    // La primera es la IP original del cliente
    return forwardedFor.split(',')[0].trim();
  }

  const realIP = req.headers['x-real-ip'];
  if (realIP) {
    return realIP;
  }

  const cfConnectingIP = req.headers['cf-connecting-ip'];
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  return req.connection?.remoteAddress ||
         req.socket?.remoteAddress ||
         req.ip ||
         'unknown';
}

/**
 * Obtiene información completa del dispositivo desde el request
 * @param {Object} req - Request object de Express
 * @returns {Object} Información completa del dispositivo
 */
function getDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || '';
  const ipAddress = getClientIP(req);
  const parsedDevice = parseUserAgent(userAgent);

  return {
    ...parsedDevice,
    ipAddress,
    userAgent,
    location: null // Se puede expandir con geolocation API
  };
}

/**
 * Obtiene ubicación aproximada desde IP (placeholder para API externa)
 * @param {string} ipAddress - Dirección IP
 * @returns {Promise<Object>} Información de ubicación
 */
async function getLocationFromIP(ipAddress) {
  // IPs locales o privadas no tienen ubicación
  if (!ipAddress ||
      ipAddress === 'unknown' ||
      ipAddress === '127.0.0.1' ||
      ipAddress === '::1' ||
      ipAddress.startsWith('192.168.') ||
      ipAddress.startsWith('10.') ||
      ipAddress.startsWith('172.')) {
    return {
      city: null,
      country: 'Local',
      countryCode: 'LO',
      formatted: 'Red local'
    };
  }

  // Placeholder - en producción se usaría una API como ipapi.co o ip-api.com
  // Por ahora retornamos null para no hacer llamadas externas
  try {
    // Ejemplo de cómo se implementaría con una API externa:
    // const response = await axios.get(`https://ipapi.co/${ipAddress}/json/`);
    // return {
    //   city: response.data.city,
    //   country: response.data.country_name,
    //   countryCode: response.data.country_code,
    //   formatted: `${response.data.city}, ${response.data.country_name}`
    // };

    return {
      city: null,
      country: null,
      countryCode: null,
      formatted: null
    };
  } catch (error) {
    console.error('Error obteniendo ubicación:', error.message);
    return {
      city: null,
      country: null,
      countryCode: null,
      formatted: 'Ubicación desconocida'
    };
  }
}

/**
 * Genera un fingerprint simple del dispositivo
 * @param {string} userAgent - User-Agent string
 * @param {string} ipAddress - Dirección IP
 * @returns {string} Hash del fingerprint
 */
function generateDeviceFingerprint(userAgent, ipAddress) {
  const crypto = require('crypto');
  const data = `${userAgent || ''}|${ipAddress || ''}`;
  return crypto.createHash('md5').update(data).digest('hex');
}

/**
 * Verifica si dos dispositivos son potencialmente el mismo
 * @param {Object} device1 - Primer dispositivo
 * @param {Object} device2 - Segundo dispositivo
 * @returns {boolean} True si son probablemente el mismo dispositivo
 */
function isSameDevice(device1, device2) {
  // Si tienen el mismo IP y mismo browser/OS, probablemente es el mismo dispositivo
  if (device1.ipAddress && device1.ipAddress === device2.ipAddress) {
    if (device1.browser === device2.browser && device1.os === device2.os) {
      return true;
    }
  }

  return false;
}

/**
 * Obtiene icono sugerido para el tipo de dispositivo
 * @param {string} deviceType - Tipo de dispositivo
 * @returns {string} Nombre del icono
 */
function getDeviceIcon(deviceType) {
  const icons = {
    desktop: 'monitor',
    mobile: 'smartphone',
    tablet: 'tablet',
    unknown: 'help-circle'
  };

  return icons[deviceType] || 'help-circle';
}

/**
 * Formatea la última actividad como texto relativo
 * @param {Date} lastActivity - Fecha de última actividad
 * @returns {string} Texto relativo
 */
function formatLastActivity(lastActivity) {
  if (!lastActivity) return 'Desconocido';

  const now = new Date();
  const last = new Date(lastActivity);
  const diffMs = now - last;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Ahora mismo';
  if (diffMins < 60) return `Hace ${diffMins} minuto${diffMins === 1 ? '' : 's'}`;
  if (diffHours < 24) return `Hace ${diffHours} hora${diffHours === 1 ? '' : 's'}`;
  if (diffDays < 7) return `Hace ${diffDays} día${diffDays === 1 ? '' : 's'}`;

  return last.toLocaleDateString('es-VE', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

module.exports = {
  parseUserAgent,
  getClientIP,
  getDeviceInfo,
  getLocationFromIP,
  generateDeviceFingerprint,
  isSameDevice,
  getDeviceIcon,
  formatLastActivity
};

/**
 * platformSettingsService.js - CITAMED.VE
 * M01 / Semana 7 - Servicio de configuración de plataforma con caché en memoria y upsert
 */

const { PlatformSetting } = require('../models');

const CACHE_TTL_MS = 60 * 1000; // 60 segundos
const memoryCache = new Map(); // key -> { value, expiresAt }

class PlatformSettingsService {
  /**
   * Obtiene una configuración por su clave.
   * Si está en caché y no ha expirado, la devuelve de memoria.
   * Si no, consulta la base de datos y almacena en caché por 60s.
   * @param {string} key - Clave de configuración
   * @param {*} [defaultValue=null] - Valor por defecto si no existe
   * @returns {Promise<*>}
   */
  async get(key, defaultValue = null) {
    if (!key) return defaultValue;

    const cached = memoryCache.get(key);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.value;
    }

    try {
      const setting = await PlatformSetting.findByPk(key);
      if (!setting) {
        return defaultValue;
      }

      memoryCache.set(key, {
        value: setting.value,
        expiresAt: Date.now() + CACHE_TTL_MS
      });

      return setting.value;
    } catch (err) {
      console.error(`[PlatformSettingsService] Error obteniendo '${key}':`, err.message);
      return defaultValue;
    }
  }

  /**
   * Guarda o actualiza una configuración en la base de datos (upsert)
   * e invalida la caché en memoria.
   * @param {string} key - Clave de configuración
   * @param {*} value - Valor JSON
   * @param {number|null} [userId=null] - ID del usuario administrador que realiza el cambio
   * @returns {Promise<*>}
   */
  async set(key, value, userId = null) {
    if (!key) throw new Error('Clave de configuración requerida');

    // Invalida la caché inmediatamente
    memoryCache.delete(key);

    const [setting] = await PlatformSetting.upsert({
      key,
      value,
      updatedBy: userId,
      updated_at: new Date()
    });

    return setting ? setting.value : value;
  }

  /**
   * Limpia toda la caché en memoria (útil en tests)
   */
  clearCache() {
    memoryCache.clear();
  }
}

module.exports = new PlatformSettingsService();

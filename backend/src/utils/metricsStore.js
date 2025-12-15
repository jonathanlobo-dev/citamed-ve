/**
 * Metrics Store - CITAMED.VE
 *
 * Almacenamiento en memoria de métricas de performance:
 * - Requests por endpoint
 * - Tiempos de respuesta
 * - Errores
 * - Solo datos de requests REALES
 */

/**
 * Clase para almacenar y agregar métricas
 */
class MetricsStore {
  constructor() {
    // Requests individuales (últimas N)
    this.requests = [];
    this.maxStoredRequests = 1000;

    // Contadores de errores por hora
    this.errorsByHour = new Map();

    // Timestamp de inicio
    this.startTime = Date.now();

    // Contadores globales
    this.totalRequests = 0;
    this.totalErrors = 0;

    // Limpiar errores viejos cada hora
    setInterval(() => this.cleanOldErrors(), 60 * 60 * 1000);
  }

  /**
   * Registrar un request
   * @param {string} route - Ruta del request
   * @param {number} responseTime - Tiempo de respuesta en ms
   * @param {number} statusCode - Código de estado HTTP
   * @param {string} method - Método HTTP
   * @param {string} userId - ID del usuario (opcional)
   */
  recordRequest(route, responseTime, statusCode, method = 'GET', userId = null) {
    const timestamp = new Date();

    this.requests.push({
      route,
      method,
      responseTime,
      statusCode,
      userId,
      timestamp
    });

    this.totalRequests++;

    // Registrar error si aplica
    if (statusCode >= 400) {
      this.recordError(statusCode, route);
    }

    // Mantener límite de requests almacenados
    if (this.requests.length > this.maxStoredRequests) {
      this.requests.shift();
    }
  }

  /**
   * Registrar un error
   * @param {number} statusCode - Código de estado
   * @param {string} route - Ruta donde ocurrió
   */
  recordError(statusCode, route) {
    const hourKey = this.getHourKey(new Date());

    if (!this.errorsByHour.has(hourKey)) {
      this.errorsByHour.set(hourKey, {
        count: 0,
        errors4xx: 0,
        errors5xx: 0,
        routes: {}
      });
    }

    const hourData = this.errorsByHour.get(hourKey);
    hourData.count++;

    if (statusCode >= 500) {
      hourData.errors5xx++;
    } else {
      hourData.errors4xx++;
    }

    hourData.routes[route] = (hourData.routes[route] || 0) + 1;
    this.totalErrors++;
  }

  /**
   * Obtener key para la hora actual
   */
  getHourKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}-${String(date.getHours()).padStart(2, '0')}`;
  }

  /**
   * Limpiar errores de más de 24 horas
   */
  cleanOldErrors() {
    const now = new Date();
    const cutoff = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    for (const [key] of this.errorsByHour) {
      const [year, month, day, hour] = key.split('-').map(Number);
      const keyDate = new Date(year, month - 1, day, hour);
      if (keyDate < cutoff) {
        this.errorsByHour.delete(key);
      }
    }
  }

  /**
   * Obtener endpoints más lentos
   * @param {number} limit - Número de resultados
   * @returns {Array}
   */
  getSlowEndpoints(limit = 10) {
    const avgByRoute = new Map();

    this.requests.forEach(req => {
      const key = `${req.method} ${req.route}`;
      if (!avgByRoute.has(key)) {
        avgByRoute.set(key, { total: 0, count: 0, max: 0 });
      }
      const data = avgByRoute.get(key);
      data.total += req.responseTime;
      data.count++;
      data.max = Math.max(data.max, req.responseTime);
    });

    return Array.from(avgByRoute.entries())
      .map(([route, data]) => ({
        route,
        avgTime: Math.round(data.total / data.count),
        maxTime: Math.round(data.max),
        count: data.count
      }))
      .sort((a, b) => b.avgTime - a.avgTime)
      .slice(0, limit);
  }

  /**
   * Obtener endpoints más usados
   * @param {number} limit - Número de resultados
   * @returns {Array}
   */
  getTopEndpoints(limit = 10) {
    const countByRoute = new Map();

    this.requests.forEach(req => {
      const key = `${req.method} ${req.route}`;
      countByRoute.set(key, (countByRoute.get(key) || 0) + 1);
    });

    return Array.from(countByRoute.entries())
      .map(([route, count]) => ({ route, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  /**
   * Obtener errores por hora (últimas 24 horas)
   * @returns {Array}
   */
  getErrorsByHour() {
    const result = [];
    const now = new Date();

    for (let i = 23; i >= 0; i--) {
      const hourDate = new Date(now.getTime() - i * 60 * 60 * 1000);
      const key = this.getHourKey(hourDate);
      const data = this.errorsByHour.get(key) || { count: 0, errors4xx: 0, errors5xx: 0 };

      result.push({
        hour: key,
        total: data.count,
        errors4xx: data.errors4xx,
        errors5xx: data.errors5xx
      });
    }

    return result;
  }

  /**
   * Calcular tasa de errores
   * @returns {string}
   */
  getErrorRate() {
    if (this.totalRequests === 0) return '0%';
    const rate = (this.totalErrors / this.totalRequests) * 100;
    return `${rate.toFixed(2)}%`;
  }

  /**
   * Obtener requests por minuto (últimos 5 min)
   * @returns {number}
   */
  getRequestRate() {
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentRequests = this.requests.filter(r => r.timestamp > fiveMinAgo);
    return recentRequests.length;
  }

  /**
   * Obtener resumen completo de métricas
   * @returns {Object}
   */
  getSummary() {
    return {
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      totalRequests: this.totalRequests,
      totalErrors: this.totalErrors,
      errorRate: this.getErrorRate(),
      requestsLast5Min: this.getRequestRate(),
      slowEndpoints: this.getSlowEndpoints(10),
      topEndpoints: this.getTopEndpoints(10),
      errorsByHour: this.getErrorsByHour(),
      storedRequests: this.requests.length
    };
  }

  /**
   * Reset de métricas (para testing)
   */
  reset() {
    this.requests = [];
    this.errorsByHour.clear();
    this.totalRequests = 0;
    this.totalErrors = 0;
    this.startTime = Date.now();
  }
}

// Exportar instancia singleton
module.exports = new MetricsStore();

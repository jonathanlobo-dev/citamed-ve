/**
 * errorAlertService.js - CITAMED.VE
 * Avisa por correo cuando el servidor falla (respuestas 5xx, excepciones y promesas sin atender),
 * para enterarse sin tener que mirar los registros de Render.
 *
 * Apagado si no hay ERROR_ALERT_EMAIL. Para no llenar la bandeja:
 *  - el mismo error (mismo método, ruta y estado) avisa una vez y después solo resume cuántas veces se repitió;
 *  - hay un tope de avisos por hora para todo el servidor.
 * El aviso no lleva el cuerpo de la petición ni datos de pacientes: solo ruta, estado, mensaje y el id del usuario.
 */

const { logger } = require('../config/logger');

const DEFAULTS = { repeatWindowMs: 15 * 60 * 1000, maxPerHour: 20 };

const esc = (t) => String(t ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/** Rutas que no merecen aviso (comprobaciones de salud, etc.) */
function isIgnoredPath(path) {
  return /^\/api\/(health|db-test|metrics)\b/.test(String(path || '')) || path === '/';
}

/** Convierte /api/appointments/123/start en /api/appointments/:id/start para agrupar el mismo error */
function normalizePath(path) {
  return String(path || '')
    .split('?')[0]
    .replace(/\/\d+(?=\/|$)/g, '/:id')
    .replace(/\/[0-9a-f]{16,}(?=\/|$)/gi, '/:token');
}

function recipients(env = process.env) {
  return String(env.ERROR_ALERT_EMAIL || '').split(',').map((e) => e.trim()).filter((e) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));
}

function buildAlertEmail({ signature, status, method, path, message, userId, count, environment, at }) {
  const when = new Date(at).toLocaleString('es-VE', { timeZone: 'America/Caracas', dateStyle: 'medium', timeStyle: 'medium' });
  const repeated = count > 1 ? ` (se repitió ${count} veces desde el último aviso)` : '';
  const subject = `[CitaMed ${environment}] Error ${status} en ${method} ${path}${count > 1 ? ` x${count}` : ''}`;
  const rows = [
    ['Entorno', environment], ['Cuándo (Caracas)', when], ['Petición', `${method} ${path}`], ['Estado', String(status)],
    ['Mensaje', message || 'sin mensaje'], ['Usuario', userId ? String(userId) : 'sin sesión'], ['Repeticiones', String(count)]
  ];
  const html = `<div style="font-family:Calibri,Arial,sans-serif;max-width:560px">
  <h2 style="margin:0 0 12px">Error del servidor${esc(repeated)}</h2>
  <table style="border-collapse:collapse">${rows.map(([k, v]) => `<tr><td style="padding:3px 14px 3px 0;color:#6B7280">${esc(k)}</td><td style="padding:3px 0"><strong>${esc(v)}</strong></td></tr>`).join('')}</table>
  <p style="color:#6B7280;font-size:12px;margin-top:20px">Los detalles completos están en los registros de Render. Este aviso no incluye datos de pacientes.</p>
</div>`;
  const text = rows.map(([k, v]) => `${k}: ${v}`).join('\n');
  return { subject, html, text, signature };
}

class ErrorAlertService {
  constructor({ send, now = () => Date.now(), env = process.env, options = {} } = {}) {
    this.send = send; // async ({ to, subject, html, text }) => ({ success })
    this.now = now;
    this.env = env;
    this.opts = { ...DEFAULTS, ...options };
    this.seen = new Map(); // firma -> { lastSent, pending }
    this.sentTimes = [];
  }

  enabled() {
    return recipients(this.env).length > 0;
  }

  /**
   * Registra un fallo. Devuelve 'sent' | 'throttled' | 'capped' | 'disabled' | 'ignored'.
   */
  async notify({ status, method = 'GET', path = '', message = '', userId = null }) {
    if (!this.enabled()) return 'disabled';
    if (isIgnoredPath(path)) return 'ignored';

    const route = normalizePath(path);
    const signature = `${method} ${route} ${status}`;
    const t = this.now();
    const entry = this.seen.get(signature) || { lastSent: 0, pending: 0 };

    if (entry.lastSent && t - entry.lastSent < this.opts.repeatWindowMs) {
      entry.pending += 1;
      this.seen.set(signature, entry);
      return 'throttled';
    }

    this.sentTimes = this.sentTimes.filter((x) => t - x < 3600000);
    if (this.sentTimes.length >= this.opts.maxPerHour) {
      entry.pending += 1;
      this.seen.set(signature, entry);
      return 'capped';
    }

    const count = entry.pending + 1;
    entry.lastSent = t;
    entry.pending = 0;
    this.seen.set(signature, entry);
    this.sentTimes.push(t);
    // La memoria no debe crecer sin límite si aparecen miles de rutas distintas
    if (this.seen.size > 500) this.seen.delete(this.seen.keys().next().value);

    const email = buildAlertEmail({
      signature, status, method, path: route, message: String(message).slice(0, 300), userId, count,
      environment: this.env.ERROR_ALERT_LABEL || (this.env.NODE_ENV === 'production' ? 'producción' : 'pruebas'), at: t
    });
    try {
      await this.send({ to: recipients(this.env), subject: email.subject, html: email.html, text: email.text });
    } catch (error) {
      // Un aviso que falla nunca debe causar otro fallo
      logger.warn(`[ErrorAlert] No se pudo enviar el aviso: ${error.message}`);
    }
    return 'sent';
  }
}

let shared = null;
function getErrorAlertService() {
  if (!shared) {
    // emailService se carga al usarse para no crear dependencias circulares al arrancar
    shared = new ErrorAlertService({ send: (msg) => require('./emailService').sendTransactional(msg) });
  }
  return shared;
}

module.exports = { ErrorAlertService, getErrorAlertService, isIgnoredPath, normalizePath, recipients, buildAlertEmail, DEFAULTS };

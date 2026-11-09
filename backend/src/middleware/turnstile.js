/**
 * turnstile.js - CITAMED.VE
 * Verificación anti robots con Cloudflare Turnstile (gratis) en el inicio de sesión, el registro y la
 * recuperación de clave. Apagada si no hay TURNSTILE_SECRET_KEY, y entonces todo funciona como siempre.
 *
 * La pantalla manda el resultado del desafío en la cabecera X-Turnstile-Token.
 *  - Sin token o con token rechazado por Cloudflare: 403 CAPTCHA_FAILED.
 *  - Si el servicio de Cloudflare no responde: se deja pasar y se anota (disponibilidad antes que bloqueo;
 *    los límites de intentos por dirección siguen protegiendo).
 */

const { logger } = require('../config/logger');

const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const TIMEOUT_MS = 5000;

function enabled(env = process.env) {
  return !!String(env.TURNSTILE_SECRET_KEY || '').trim();
}

function clientIp(req) {
  return req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.ip || undefined;
}

/**
 * Pregunta a Cloudflare. Devuelve 'ok' | 'rejected' | 'unavailable'.
 * `fetchImpl` se puede cambiar para probar sin red.
 */
async function verifyToken(token, ip, { fetchImpl = fetch, env = process.env } = {}) {
  try {
    const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: token });
    if (ip) body.set('remoteip', ip);
    const res = await fetchImpl(VERIFY_URL, { method: 'POST', body, signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!res.ok) return 'unavailable';
    const data = await res.json();
    return data.success === true ? 'ok' : 'rejected';
  } catch (error) {
    logger.warn(`[Turnstile] No se pudo verificar: ${error.message}`);
    return 'unavailable';
  }
}

function createTurnstileMiddleware({ fetchImpl, env } = {}) {
  return async function requireTurnstile(req, res, next) {
    const e = env || process.env;
    if (!enabled(e)) return next();

    const token = String(req.headers['x-turnstile-token'] || '').trim();
    if (!token || token.length > 2048) {
      return res.status(403).json({ success: false, code: 'CAPTCHA_FAILED', message: 'Completa la verificación anti robots e intenta de nuevo.' });
    }

    const result = await verifyToken(token, clientIp(req), { fetchImpl, env: e });
    if (result === 'rejected') {
      return res.status(403).json({ success: false, code: 'CAPTCHA_FAILED', message: 'La verificación anti robots no pasó. Inténtalo otra vez.' });
    }
    if (result === 'unavailable') {
      logger.warn('[Turnstile] Servicio no disponible: se deja pasar la petición', { path: req.originalUrl });
    }
    return next();
  };
}

module.exports = { requireTurnstile: createTurnstileMiddleware(), createTurnstileMiddleware, verifyToken, enabled, VERIFY_URL };

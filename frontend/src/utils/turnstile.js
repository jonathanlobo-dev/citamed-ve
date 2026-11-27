/**
 * turnstile.js - CITAMED.VE
 * Verificación anti robots (Cloudflare Turnstile). Apagada si el build no trae VITE_TURNSTILE_SITE_KEY:
 * entonces nada de esto hace nada y las pantallas funcionan como siempre.
 *
 * El desafío entrega un token de un solo uso. Se manda en la cabecera X-Turnstile-Token solo en las
 * peticiones que el servidor protege (inicio de sesión, registro y recuperar clave), y después de cada una
 * se descarta y se pide otro desafío.
 */

export const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY || '';

export const turnstileEnabled = () => !!SITE_KEY;

let currentToken = '';

export const setTurnstileToken = (token) => { currentToken = token || ''; };

/** Mensaje cuando se pulsa el botón antes de que Cloudflare termine de verificar */
export const TURNSTILE_PENDING_MESSAGE = 'Espera a que termine la verificación de Cloudflare (la casilla debe quedar en verde) y vuelve a intentarlo.';

/** true si la verificación está encendida pero todavía no hay token (sigue en "Verificando...") */
export const turnstilePending = () => turnstileEnabled() && !currentToken;
export const getTurnstileToken = () => currentToken;

// Mismas rutas que protege el servidor (backend/src/routes)
const PROTECTED = [
  /\/auth\/login$/,
  /\/auth\/register(\/(patient|doctor|provider))?$/,
  /\/(password|password-recovery)\/request$/,
  /\/guest-booking\/appointments$/
];

export function isProtectedUrl(url = '') {
  const path = String(url).split('?')[0];
  return PROTECTED.some((re) => re.test(path));
}

/** Para los interceptores de axios: agrega la cabecera solo cuando corresponde */
export function withTurnstileHeader(config) {
  if (turnstileEnabled() && currentToken && isProtectedUrl(config?.url)) {
    config.headers = config.headers || {};
    config.headers['X-Turnstile-Token'] = currentToken;
  }
  return config;
}

export const RESET_EVENT = 'citamed:turnstile-reset';

/** El token ya se usó: se descarta y el desafío se pide de nuevo */
export function resetTurnstile() {
  currentToken = '';
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(RESET_EVENT));
}

/** Para los interceptores de respuesta */
export function afterProtectedRequest(config) {
  if (turnstileEnabled() && isProtectedUrl(config?.url)) resetTurnstile();
}

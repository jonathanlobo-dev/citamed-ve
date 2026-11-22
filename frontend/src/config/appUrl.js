/**
 * appUrl.js - CITAMED.VE
 * Separa la página de presentación (citamedve.app) del sistema (app.citamedve.app).
 * Solo actúa si el build define VITE_APP_URL (por ejemplo https://app.citamedve.app).
 * Sin esa variable (local, pruebas) todo se queda en el mismo sitio, como siempre.
 */

const APP_URL = (import.meta.env.VITE_APP_URL || '').replace(/\/$/, '');

function appOrigin() {
  try {
    return APP_URL ? new URL(APP_URL).origin : '';
  } catch {
    return '';
  }
}

/** true si el sitio se está abriendo desde la dirección del sistema */
export function isAppHost() {
  const origin = appOrigin();
  return !!origin && window.location.origin === origin;
}

/**
 * Dirección de la página de presentación. Se toma de VITE_LANDING_URL; si no está,
 * se deduce quitando "app." del dominio del sistema (app.citamedve.app -> citamedve.app).
 */
export function landingOrigin() {
  const explicit = (import.meta.env.VITE_LANDING_URL || '').replace(/\/$/, '');
  if (explicit) {
    try {
      return new URL(explicit).origin;
    } catch {
      return '';
    }
  }
  const origin = appOrigin();
  if (!origin) return '';
  const url = new URL(origin);
  if (!url.hostname.startsWith('app.')) return '';
  url.hostname = url.hostname.slice(4);
  return url.origin;
}

/** Dirección del "inicio": la presentación si estamos en el sistema, y "/" en cualquier otro caso */
export function homeUrl() {
  const landing = landingOrigin();
  return isAppHost() && landing ? `${landing}/` : '/';
}

function hasSession() {
  try {
    return !!localStorage.getItem('citamed_token');
  } catch {
    return false;
  }
}

/** Vuelve al inicio. Dentro del sistema (app.) el "/" solo lleva al login, así que se sale a la presentación */
export function goToHome(navigate) {
  const landing = landingOrigin();
  // La sesión vive en app.: la presentación (otro dominio) no la ve y parecería cerrada.
  // Con sesión abierta, "Inicio" lleva al panel de la persona.
  if (isAppHost() && landing && hasSession()) {
    navigate('/dashboard');
    return;
  }
  if (isAppHost() && landing) {
    window.location.href = `${landing}/`;
    return;
  }
  navigate('/');
}

/** Lleva a una ruta del sistema: dentro del mismo sitio o, desde la presentación, a la dirección del sistema */
export function goToApp(navigate, path) {
  const origin = appOrigin();
  if (origin && window.location.origin !== origin) {
    window.location.href = `${origin}${path}`;
    return;
  }
  navigate(path);
}

/** Dirección completa de una ruta del sistema (para enlaces <a> desde la presentación) */
export function appHref(path) {
  const origin = appOrigin();
  return origin && window.location.origin !== origin ? `${origin}${path}` : path;
}

/** true si el sitio se abre desde la página de presentación (citamedve.app) */
export function isLandingHost() {
  const landing = landingOrigin();
  return !!landing && window.location.origin === landing;
}

// Rutas que viven en la presentación. Todo lo demás pertenece al sistema (app.)
const LANDING_PATHS = ['/', '/terminos', '/privacidad', '/codigo-etica'];

/**
 * Si estamos en la presentación y la ruta es del sistema, devuelve la dirección en app.
 * Los enlaces viejos (QR de récipes, /dr/, /cita/) siguen funcionando: solo cambian de dominio.
 */
export function systemRedirectFor(pathname, search = '', hash = '') {
  if (!isLandingHost() || LANDING_PATHS.includes(pathname)) return null;
  const origin = appOrigin();
  return origin ? `${origin}${pathname}${search}${hash}` : null;
}

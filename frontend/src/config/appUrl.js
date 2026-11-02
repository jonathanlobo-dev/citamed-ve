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

/** Vuelve al inicio. Dentro del sistema (app.) el "/" solo lleva al login, así que se sale a la presentación */
export function goToHome(navigate) {
  const landing = landingOrigin();
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

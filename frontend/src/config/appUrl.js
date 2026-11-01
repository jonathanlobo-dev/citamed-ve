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

/** Lleva a una ruta del sistema: dentro del mismo sitio o, desde la presentación, a la dirección del sistema */
export function goToApp(navigate, path) {
  const origin = appOrigin();
  if (origin && window.location.origin !== origin) {
    window.location.href = `${origin}${path}`;
    return;
  }
  navigate(path);
}

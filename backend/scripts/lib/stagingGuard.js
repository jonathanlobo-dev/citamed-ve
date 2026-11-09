/**
 * stagingGuard.js - CITAMED.VE
 * Los recorridos completos (scripts test-*.js) crean usuarios, citas, récipes y cobros de verdad.
 * Solo se pueden correr contra el entorno de Pruebas. Esta guarda lo comprueba antes de empezar.
 */

const STAGING_PROJECT_REF = 'bvdjfxihcohexgvtyhto';
const DEFAULT_STAGING_API = 'https://citamed-api-dev.onrender.com/api';

// Direcciones de producción (y la vieja) que nunca se deben tocar con pruebas
const PRODUCTION_HOSTS = ['api.citamedve.app', 'citamed-api.onrender.com', 'app.citamedve.app', 'citamedve.app', 'citamed-ve.pages.dev'];

function hostOf(url) {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function isProductionUrl(url) {
  const host = hostOf(url);
  return PRODUCTION_HOSTS.includes(host);
}

/**
 * Devuelve { ok, apiUrl } o { ok: false, reason }. No lanza ni termina el proceso: así se puede probar.
 */
function checkStagingTarget(env = process.env) {
  const apiUrl = (env.API_URL || DEFAULT_STAGING_API).replace(/\/$/, '');

  if (!hostOf(apiUrl)) {
    return { ok: false, reason: `API_URL no es una dirección válida: ${apiUrl}` };
  }
  if (isProductionUrl(apiUrl)) {
    return { ok: false, reason: `API_URL apunta a producción (${hostOf(apiUrl)}). Los recorridos solo corren contra Pruebas.` };
  }
  if (!String(env.DB_USER || '').endsWith(STAGING_PROJECT_REF)) {
    return { ok: false, reason: 'backend/.env no apunta a la base de Pruebas (DB_USER no termina en el proyecto de Pruebas).' };
  }
  return { ok: true, apiUrl };
}

module.exports = { checkStagingTarget, isProductionUrl, hostOf, STAGING_PROJECT_REF, DEFAULT_STAGING_API, PRODUCTION_HOSTS };

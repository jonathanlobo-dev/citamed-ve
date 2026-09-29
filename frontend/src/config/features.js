/* global __BUILD_BRANCH__ */
/**
 * features.js - CITAMED.VE
 * Interruptores de funciones por entrega.
 *
 * Producción se construye desde la rama master y solo muestra lo ya entregado al cliente.
 * Pruebas (rama dev) y el entorno local muestran todo lo que está en construcción.
 * Para liberar una función en producción: pasar su valor a true en RELEASED_IN_PRODUCTION.
 * También se puede forzar con VITE_FEATURE_<NOMBRE>=true|false en las variables del build.
 */

const RELEASED_IN_PRODUCTION = {
  AI: false, // IA en el Espacio Clínico
  SUPERADMIN: false // Panel de superadministración
};

const branch = typeof __BUILD_BRANCH__ !== 'undefined' ? __BUILD_BRANCH__ : 'local';
const isProductionBuild = branch === 'master' || branch === 'main';

function flag(name) {
  const override = import.meta.env[`VITE_FEATURE_${name}`];
  if (override === 'true') return true;
  if (override === 'false') return false;
  return isProductionBuild ? RELEASED_IN_PRODUCTION[name] : true;
}

export const FEATURES = {
  ai: flag('AI'),
  superadmin: flag('SUPERADMIN')
};

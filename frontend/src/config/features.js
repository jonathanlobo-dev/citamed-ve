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
  AI: true, // IA en el Espacio Clínico (liberada)
  SUPERADMIN: true, // Panel de superadministración (liberado)
  PWA: true, // App instalable (liberada el 22/11)
  ASSISTANT: true, // Asistente del médico (liberada)
  PUBLIC_PAGE: true, // Página pública del médico con enlace propio (liberada)
  WA_CONFIRM: true, // Confirmar o cancelar cita desde WhatsApp (liberada)
  AI_PATIENT_INSTRUCTIONS: false, // Indicaciones para el paciente con IA (mejora futura)
  EXCEL_IMPORT: true, // Importar pacientes desde Excel (liberada)
  DOCTOR_REPORTS: false, // Reportes del médico: ingresos, egresos y utilidad (en construcción)
  GUEST_BOOKING: false // Primera cita sin registro (en construcción; el servidor también pide GUEST_BOOKING_ENABLED=true)
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
  superadmin: flag('SUPERADMIN'),
  pwa: flag('PWA'),
  assistant: flag('ASSISTANT'),
  publicPage: flag('PUBLIC_PAGE'),
  waConfirm: flag('WA_CONFIRM'),
  aiPatientInstructions: flag('AI_PATIENT_INSTRUCTIONS'),
  excelImport: flag('EXCEL_IMPORT'),
  doctorReports: flag('DOCTOR_REPORTS'),
  guestBooking: flag('GUEST_BOOKING')
};

// Secciones que todavía no existen de verdad (módulos MarketMed, Telemedicina y Citamed Paga,
// clínicas y seguros). Se ocultan en todos los entornos hasta que estén hechas.
export const SHOW_UNBUILT_SECTIONS = import.meta.env.VITE_SHOW_UNBUILT_SECTIONS === 'true';

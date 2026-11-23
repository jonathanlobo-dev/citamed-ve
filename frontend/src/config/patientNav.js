/**
 * patientNav.js - CitaMed
 * Secciones de la barra de navegación del paciente y a cuál pertenece cada ruta.
 * Es lógica pura (sin React) para poder probarla: la barra solo se muestra en rutas conocidas
 * y siempre marca la sección activa.
 */

const starts = (pathname, ...bases) =>
  bases.some((b) => pathname === b || pathname.startsWith(`${b}/`));

export const PATIENT_SECTIONS = [
  {
    key: 'inicio',
    label: 'Inicio',
    // "Inicio" no tiene ruta fija: la barra lo resuelve con la función de inicio de config/appUrl (con sesión abierta lleva al panel)
    path: null,
    match: (p) => p === '/dashboard' || p === '/paciente'
  },
  {
    key: 'citas',
    label: 'Mis citas',
    path: '/paciente/mis-citas',
    match: (p) => starts(p, '/paciente/mis-citas', '/paciente/sala-espera', '/sala-espera', '/agendar')
  },
  {
    key: 'historia',
    label: 'Mi historia',
    path: '/paciente/mi-historia',
    match: (p) => starts(p, '/paciente/mi-historia', '/paciente/historia-clinica')
  },
  {
    key: 'directorio',
    label: 'Directorio',
    path: '/directorio',
    match: (p) => starts(p, '/directorio', '/doctor', '/buscar', '/clinicas')
  },
  {
    key: 'cuenta',
    label: 'Mi cuenta',
    path: '/cuenta',
    match: (p) => starts(p, '/cuenta', '/paciente/perfil', '/perfil-paciente', '/settings')
  }
];

/** Sección a la que pertenece una ruta, o null si la barra no debe mostrarse ahí. */
export function patientSectionFor(pathname) {
  const p = String(pathname || '').split('?')[0].replace(/\/+$/, '') || '/';
  return PATIENT_SECTIONS.find((s) => s.match(p)) || null;
}

/** La barra solo aparece para pacientes con sesión y en las páginas del paciente. */
export function showPatientNav(user, pathname) {
  return Boolean(user && user.role === 'patient' && patientSectionFor(pathname));
}

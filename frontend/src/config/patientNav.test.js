import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PATIENT_SECTIONS, patientSectionFor, showPatientNav } from './patientNav';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

describe('qué sección es cada ruta', () => {
  test.each([
    ['/dashboard', 'inicio'],
    ['/paciente', 'inicio'],
    ['/paciente/mis-citas', 'citas'],
    ['/paciente/sala-espera', 'citas'],
    ['/paciente/sala-espera/55', 'citas'],
    ['/sala-espera/55', 'citas'],
    ['/agendar/7', 'citas'],
    ['/agendar/7?reschedule=3', 'citas'],
    ['/paciente/mi-historia', 'historia'],
    ['/paciente/historia-clinica', 'historia'],
    ['/directorio', 'directorio'],
    ['/doctor/12', 'directorio'],
    ['/buscar', 'directorio'],
    ['/clinicas/4', 'directorio'],
    ['/cuenta', 'cuenta'],
    ['/paciente/perfil', 'cuenta'],
    ['/paciente/perfil/editar', 'cuenta'],
    ['/perfil-paciente', 'cuenta'],
    ['/perfil-paciente/editar', 'cuenta'],
    ['/settings/sessions', 'cuenta'],
    ['/paciente/mis-citas/', 'citas']
  ])('%s es %s', (path, key) => {
    expect(patientSectionFor(path)?.key).toBe(key);
  });

  test.each(['/', '/login', '/registro', '/medico/dashboard', '/admin', '/dr/ana', '/cita/abc', '/verificar/email', '/terminos', '/doctor-algo', '/dashboardx'])(
    '%s no es del paciente: la barra no sale',
    (path) => {
      expect(patientSectionFor(path)).toBeNull();
    }
  );

  test('ninguna ruta cae en dos secciones a la vez', () => {
    const rutas = ['/dashboard', '/paciente', '/paciente/mis-citas', '/paciente/mi-historia', '/directorio', '/cuenta', '/agendar/1', '/doctor/1', '/paciente/perfil'];
    rutas.forEach((r) => expect(PATIENT_SECTIONS.filter((s) => s.match(r))).toHaveLength(1));
  });
});

describe('quién ve la barra', () => {
  test('solo un paciente con sesión en una página suya', () => {
    expect(showPatientNav({ role: 'patient' }, '/paciente/mis-citas')).toBe(true);
    expect(showPatientNav(null, '/paciente/mis-citas')).toBe(false);
    expect(showPatientNav({ role: 'doctor' }, '/directorio')).toBe(false);
    expect(showPatientNav({ role: 'assistant' }, '/cuenta')).toBe(false);
    expect(showPatientNav({ role: 'patient' }, '/login')).toBe(false);
  });
});

describe('las rutas del paciente de App.jsx están cubiertas', () => {
  test('toda ruta protegida solo para pacientes tiene sección', () => {
    const app = readFileSync(join(SRC, 'App.jsx'), 'utf8');
    const rutas = [...app.matchAll(/path="([^"]+)"\s+element=\{\s*<ProtectedRoute allowedRoles=\{\['patient'\]\}/g)].map((m) => m[1]);
    expect(rutas.length).toBeGreaterThan(5);
    const sinSeccion = rutas.filter((r) => !patientSectionFor(r.replace(/:[A-Za-z]+/g, '1')));
    expect(sinSeccion).toEqual([]);
  });
});

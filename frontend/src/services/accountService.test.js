import { describe, test, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { accountErrorMessage } from './accountService';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (f) => readFileSync(join(SRC, f), 'utf8');

describe('accountErrorMessage', () => {
  test('usa el mensaje que manda el servidor', () => {
    expect(accountErrorMessage({ response: { data: { message: 'La clave actual no es correcta' } } })).toBe('La clave actual no es correcta');
  });
  test.each([[null], [undefined], [{}], [{ response: {} }], [{ response: { data: {} } }]])('sin mensaje (%j) usa el genérico', (err) => {
    expect(accountErrorMessage(err)).toMatch(/No pudimos completar/);
  });
  test('acepta un mensaje genérico propio', () => {
    expect(accountErrorMessage({}, 'Falló')).toBe('Falló');
  });
});

describe('Mi cuenta está conectada', () => {
  test('la ruta /cuenta existe y exige sesión de cualquier rol', () => {
    const app = read('App.jsx');
    expect(app).toMatch(/path="\/cuenta"[\s\S]*?allowedRoles=\{\[[^\]]*'patient'[^\]]*'doctor'[^\]]*'provider'[^\]]*'assistant'[^\]]*'admin'[^\]]*\]\}[\s\S]*?<MiCuentaPage/);
  });
  test('el menú de la barra superior lleva a /cuenta en escritorio y móvil', () => {
    const nav = read('components/common/Navbar/Navbar.jsx');
    expect(nav.match(/navigate\('\/cuenta'\)/g)).toHaveLength(2);
  });
  test('el panel admin tiene la pestaña de solicitudes', () => {
    const admin = read('pages/admin/AdminPanelPage.jsx');
    expect(admin).toContain("setActiveTab('requests')");
    expect(admin).toContain('<ChangeRequestsPanel />');
  });
  test('los formularios usan paneles laterales, no ventanas emergentes', () => {
    const page = read('pages/account/MiCuentaPage.jsx');
    expect(page).toContain("SideDrawer");
    expect(page).not.toMatch(/window\.(prompt|confirm|alert)\(/);
  });
});

describe('aviso de médico no verificado', () => {
  test('la instancia api explica el bloqueo en lugar de fallar en silencio', () => {
    expect(read('services/api.js')).toContain("DOCTOR_NOT_VERIFIED");
  });
});

import { describe, test, expect } from 'vitest';
import { buildSetupTasks } from './setupTasks';

const byId = (tasks) => Object.fromEntries(tasks.map((t) => [t.id, t.done]));

describe('Prepara tu consultorio', () => {
  test('un médico recién registrado tiene todo pendiente', () => {
    const t = byId(buildSetupTasks({ verificationStatus: 'unverified', availability: [], consultationFee: 0 }));
    expect(t).toMatchObject({ documents: false, location: false, schedule: false, price: false, photo: false });
  });

  test('marca como listo lo que ya está configurado', () => {
    const t = byId(buildSetupTasks({
      verificationStatus: 'pending',
      clinicAddress: 'Av. Principal, Caracas',
      availability: [{ isActive: true }],
      consultationFee: '40.00',
      profilePhoto: 'https://x/foto.jpg'
    }));
    expect(t).toMatchObject({ documents: true, location: true, schedule: true, price: true, photo: true });
  });

  test('horarios inactivos no cuentan', () => {
    const t = byId(buildSetupTasks({ availability: [{ isActive: false }] }));
    expect(t.schedule).toBe(false);
  });

  test('sin enlace público todavía, compartir lleva a guardar el perfil', () => {
    const share = buildSetupTasks({}, { onSharePublicPage: () => {} }).find((t) => t.id === 'share');
    expect(share.to).toBe('/medico/perfil/editar?tab=info');
    const lista = buildSetupTasks({ publicSlug: 'dra-ana' }, { onSharePublicPage: () => {} }).find((t) => t.id === 'share');
    expect(typeof lista.onClick).toBe('function');
  });

  test('cada tarea pendiente lleva a una ruta existente o a una acción', () => {
    const rutas = ['/medico/verificacion', '/medico/perfil/editar', '/medico/agenda'];
    buildSetupTasks({}, { onSharePublicPage: () => {} }).forEach((task) => {
      if (task.to) expect(rutas.some((r) => task.to.startsWith(r))).toBe(true);
      else expect(typeof task.onClick).toBe('function');
    });
  });
});

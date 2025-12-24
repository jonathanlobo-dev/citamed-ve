/**
 * Script para limpiar usuarios mock/basura de la BD
 *
 * PRESERVA:
 * - Usuarios estándar de prueba (doctor@citamed.ve, paciente@citamed.ve, etc.)
 * - Usuarios reales registrados con el flujo normal
 *
 * ELIMINA:
 * - Usuarios con emails @test, @example, @mock, etc.
 * - Usuarios @citamed.ve que NO son los 4 estándar
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'citamed_development',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false
  }
);

// Emails estándar de prueba que se PRESERVAN
const STANDARD_TEST_EMAILS = [
  'doctor@citamed.ve',
  'paciente@citamed.ve',
  'proveedor@citamed.ve',
  'admin@citamed.ve'
];

async function cleanMockUsers() {
  try {
    console.log('═══════════════════════════════════════════════════════');
    console.log('  CITAMED - Limpieza de Usuarios Mock/Basura');
    console.log('═══════════════════════════════════════════════════════\n');

    // 1. Contar usuarios actuales
    const totalUsers = await sequelize.query('SELECT COUNT(*) as total FROM users');
    console.log(`Total de usuarios en BD: ${totalUsers[0][0].total}`);

    // 2. Identificar usuarios a eliminar
    const mockUsers = await sequelize.query(`
      SELECT id, email, role, "firstName", "lastName", "createdAt"
      FROM users
      WHERE
        -- Es un email mock/test
        (
          email LIKE '%@test%' OR
          email LIKE '%@example%' OR
          email LIKE '%@mock%' OR
          email LIKE '%fake%' OR
          email LIKE '%demo%' OR
          email LIKE '%prueba%' OR
          email LIKE '%localhost%' OR
          (email LIKE '%@citamed.ve' AND email NOT IN ('doctor@citamed.ve', 'paciente@citamed.ve', 'proveedor@citamed.ve', 'admin@citamed.ve'))
        )
      ORDER BY "createdAt"
    `);

    console.log(`Usuarios mock/basura encontrados: ${mockUsers[0].length}\n`);

    if (mockUsers[0].length === 0) {
      console.log('✅ No hay usuarios basura que eliminar.');
      await sequelize.close();
      return;
    }

    // 3. Mostrar algunos ejemplos
    console.log('Ejemplos de usuarios a eliminar:');
    mockUsers[0].slice(0, 10).forEach(u => {
      console.log(`  - ${u.email} (${u.role})`);
    });
    if (mockUsers[0].length > 10) {
      console.log(`  ... y ${mockUsers[0].length - 10} más\n`);
    }

    // 4. Eliminar en orden correcto (por dependencias)
    console.log('\n→ Eliminando usuarios mock...');

    // Primero eliminar perfiles relacionados
    const mockUserIds = mockUsers[0].map(u => u.id);

    // Eliminar perfiles de doctor
    await sequelize.query(`
      DELETE FROM doctor_profiles WHERE "userId" = ANY($1::int[])
    `, { bind: [mockUserIds] });
    console.log('  ✓ Perfiles de doctor eliminados');

    // Eliminar perfiles de paciente
    await sequelize.query(`
      DELETE FROM patient_profiles WHERE "userId" = ANY($1::int[])
    `, { bind: [mockUserIds] });
    console.log('  ✓ Perfiles de paciente eliminados');

    // Eliminar perfiles de proveedor (usa snake_case)
    await sequelize.query(`
      DELETE FROM provider_profiles WHERE user_id = ANY($1::int[])
    `, { bind: [mockUserIds] });
    console.log('  ✓ Perfiles de proveedor eliminados');

    // Eliminar usuarios
    await sequelize.query(`
      DELETE FROM users WHERE id = ANY($1::int[])
    `, { bind: [mockUserIds] });
    console.log('  ✓ Usuarios eliminados');

    // 5. Limpiar cache de búsqueda
    await sequelize.query('TRUNCATE TABLE doctor_search_cache RESTART IDENTITY');
    console.log('  ✓ Cache de búsqueda limpiado');

    // 6. Verificar resultado
    const remainingUsers = await sequelize.query('SELECT COUNT(*) as total FROM users');
    console.log(`\n═══════════════════════════════════════════════════════`);
    console.log(`  ✅ LIMPIEZA COMPLETADA`);
    console.log(`  - Usuarios eliminados: ${mockUsers[0].length}`);
    console.log(`  - Usuarios restantes: ${remainingUsers[0][0].total}`);
    console.log(`═══════════════════════════════════════════════════════\n`);

    // 7. Mostrar usuarios restantes
    const remaining = await sequelize.query(`
      SELECT email, role, "firstName", "lastName" FROM users ORDER BY role, email
    `);

    if (remaining[0].length > 0) {
      console.log('Usuarios restantes:');
      remaining[0].forEach(u => {
        console.log(`  - ${u.email} (${u.role}) - ${u.firstName} ${u.lastName}`);
      });
    }

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error.message);
    await sequelize.close();
    process.exit(1);
  }
}

cleanMockUsers();

// src/seeders/permissionsSeeder.js
// CITAMED.VE - M01 Sub-Partida 2.5.1 RBAC
// Seeder de permisos base del sistema

const { logger } = require('../config/logger');

// Definición de todos los permisos del sistema
const PERMISSIONS = [
  // APPOINTMENTS
  { name: 'appointments.create', resource: 'appointments', action: 'create', description: 'Crear nuevas citas médicas' },
  { name: 'appointments.read', resource: 'appointments', action: 'read', description: 'Ver citas médicas' },
  { name: 'appointments.read.own', resource: 'appointments', action: 'read.own', description: 'Ver solo citas propias' },
  { name: 'appointments.update', resource: 'appointments', action: 'update', description: 'Modificar citas médicas' },
  { name: 'appointments.update.own', resource: 'appointments', action: 'update.own', description: 'Modificar solo citas propias' },
  { name: 'appointments.delete', resource: 'appointments', action: 'delete', description: 'Eliminar citas médicas' },
  { name: 'appointments.cancel', resource: 'appointments', action: 'cancel', description: 'Cancelar citas médicas' },

  // USERS
  { name: 'users.read.own', resource: 'users', action: 'read.own', description: 'Ver perfil propio' },
  { name: 'users.update.own', resource: 'users', action: 'update.own', description: 'Actualizar perfil propio' },
  { name: 'users.read.all', resource: 'users', action: 'read.all', description: 'Ver todos los usuarios' },
  { name: 'users.update.all', resource: 'users', action: 'update.all', description: 'Actualizar cualquier usuario' },
  { name: 'users.delete', resource: 'users', action: 'delete', description: 'Eliminar usuarios' },

  // SESSIONS
  { name: 'sessions.read.own', resource: 'sessions', action: 'read.own', description: 'Ver sesiones propias' },
  { name: 'sessions.revoke.own', resource: 'sessions', action: 'revoke.own', description: 'Cerrar sesiones propias' },
  { name: 'sessions.read.all', resource: 'sessions', action: 'read.all', description: 'Ver todas las sesiones' },
  { name: 'sessions.revoke.all', resource: 'sessions', action: 'revoke.all', description: 'Cerrar cualquier sesión' },

  // DOCTORS
  { name: 'doctors.read', resource: 'doctors', action: 'read', description: 'Ver directorio de médicos' },
  { name: 'doctors.verify', resource: 'doctors', action: 'verify', description: 'Verificar médicos' },
  { name: 'doctors.approve', resource: 'doctors', action: 'approve', description: 'Aprobar solicitudes de médicos' },

  // PROVIDERS
  { name: 'providers.read', resource: 'providers', action: 'read', description: 'Ver directorio de proveedores' },
  { name: 'providers.verify', resource: 'providers', action: 'verify', description: 'Verificar proveedores' },
  { name: 'providers.approve', resource: 'providers', action: 'approve', description: 'Aprobar solicitudes de proveedores' },

  // 2FA
  { name: '2fa.enable', resource: '2fa', action: 'enable', description: 'Activar autenticación de dos factores' },
  { name: '2fa.disable', resource: '2fa', action: 'disable', description: 'Desactivar autenticación de dos factores' },
  { name: '2fa.manage.all', resource: '2fa', action: 'manage.all', description: 'Gestionar 2FA de cualquier usuario' },

  // ADMIN
  { name: 'admin.dashboard', resource: 'admin', action: 'dashboard', description: 'Acceso al panel de administración' },
  { name: 'admin.analytics', resource: 'admin', action: 'analytics', description: 'Ver analíticas del sistema' },
  { name: 'admin.settings', resource: 'admin', action: 'settings', description: 'Configurar ajustes del sistema' },
  { name: 'admin.audit', resource: 'admin', action: 'audit', description: 'Ver logs de auditoría' },

  // RBAC
  { name: 'rbac.read', resource: 'rbac', action: 'read', description: 'Ver permisos y roles' },
  { name: 'rbac.manage', resource: 'rbac', action: 'manage', description: 'Gestionar permisos y roles' }
];

// Asignación de permisos a roles
const ROLE_PERMISSIONS = {
  patient: [
    'appointments.create',
    'appointments.read.own',
    'appointments.cancel',
    'users.read.own',
    'users.update.own',
    'sessions.read.own',
    'sessions.revoke.own',
    'doctors.read',
    '2fa.enable',
    '2fa.disable'
  ],
  doctor: [
    'appointments.read',
    'appointments.update',
    'users.read.own',
    'users.update.own',
    'sessions.read.own',
    'sessions.revoke.own',
    'doctors.read',
    '2fa.enable',
    '2fa.disable'
  ],
  provider: [
    'users.read.own',
    'users.update.own',
    'sessions.read.own',
    'sessions.revoke.own',
    'providers.read',
    '2fa.enable',
    '2fa.disable'
  ],
  admin: [
    // Admin tiene todos los permisos
    '*'
  ]
};

/**
 * Ejecuta el seeder de permisos
 * @param {Object} db - Objeto con modelos de Sequelize
 * @returns {Object} Resultado del seeding
 */
async function seedPermissions(db) {
  const { Permission, RolePermission } = db;
  const results = {
    permissionsCreated: 0,
    permissionsExisted: 0,
    rolePermissionsCreated: 0,
    errors: []
  };

  logger.info('Iniciando seeding de permisos...');

  try {
    // 1. Crear permisos
    for (const permData of PERMISSIONS) {
      try {
        const [permission, created] = await Permission.findOrCreate({
          where: { name: permData.name },
          defaults: {
            resource: permData.resource,
            action: permData.action,
            description: permData.description,
            isSystem: true
          }
        });

        if (created) {
          results.permissionsCreated++;
        } else {
          results.permissionsExisted++;
        }
      } catch (error) {
        results.errors.push(`Error creando permiso ${permData.name}: ${error.message}`);
      }
    }

    logger.info(`Permisos: ${results.permissionsCreated} creados, ${results.permissionsExisted} ya existían`);

    // 2. Asignar permisos a roles
    for (const [role, permissionNames] of Object.entries(ROLE_PERMISSIONS)) {
      // Skip admin wildcard por ahora, se maneja en el servicio
      if (permissionNames.includes('*')) {
        // Para admin, asignar todos los permisos
        const allPermissions = await Permission.findAll();
        for (const permission of allPermissions) {
          try {
            await RolePermission.assignPermission(role, permission.id);
            results.rolePermissionsCreated++;
          } catch (error) {
            // Ignorar duplicados
          }
        }
      } else {
        for (const permName of permissionNames) {
          try {
            const permission = await Permission.findByName(permName);
            if (permission) {
              await RolePermission.assignPermission(role, permission.id);
              results.rolePermissionsCreated++;
            } else {
              results.errors.push(`Permiso no encontrado: ${permName}`);
            }
          } catch (error) {
            // Ignorar duplicados
          }
        }
      }
    }

    logger.info(`Role permissions asignados: ${results.rolePermissionsCreated}`);

    if (results.errors.length > 0) {
      logger.warn('Errores durante seeding:', results.errors);
    }

    return results;
  } catch (error) {
    logger.error('Error en seeding de permisos:', error);
    throw error;
  }
}

/**
 * Ejecuta seeding al importar si se llama directamente
 */
async function runSeeder() {
  const db = require('../models');

  // Esperar a que la DB esté lista
  await db.sequelize.authenticate();

  // Sync de modelos
  await db.Permission.sync();
  await db.RolePermission.sync();

  // Ejecutar seeder
  const results = await seedPermissions(db);

  console.log('Seeding completado:', results);
  return results;
}

// Export para uso en otros archivos
module.exports = {
  PERMISSIONS,
  ROLE_PERMISSIONS,
  seedPermissions,
  runSeeder
};

// Si se ejecuta directamente
if (require.main === module) {
  runSeeder()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Error:', err);
      process.exit(1);
    });
}

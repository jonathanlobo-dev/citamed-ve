/**
 * PermissionGate Component - CITAMED.VE
 * M01 Sub-Partida 2.5.1
 *
 * Componente para renderizado condicional basado en permisos
 */

import { usePermissions, useHasPermission, useHasAnyPermission, useHasAllPermissions, useHasRole } from '../../hooks/usePermissions';

/**
 * Gate que muestra contenido solo si el usuario tiene el permiso
 * @param {Object} props
 * @param {string} props.permission - Permiso requerido
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene permiso
 * @param {boolean} props.showLoading - Mostrar indicador de carga
 */
export function PermissionGate({ permission, children, fallback = null, showLoading = false }) {
  const { hasPermission, loading } = useHasPermission(permission);

  if (loading && showLoading) {
    return <span className="text-gray-400">...</span>;
  }

  if (loading) {
    return null;
  }

  return hasPermission ? children : fallback;
}

/**
 * Gate que muestra contenido si el usuario tiene AL MENOS UNO de los permisos
 * @param {Object} props
 * @param {string[]} props.permissions - Permisos requeridos (cualquiera)
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo
 */
export function AnyPermissionGate({ permissions, children, fallback = null, showLoading = false }) {
  const { hasPermission, loading } = useHasAnyPermission(permissions);

  if (loading && showLoading) {
    return <span className="text-gray-400">...</span>;
  }

  if (loading) {
    return null;
  }

  return hasPermission ? children : fallback;
}

/**
 * Gate que muestra contenido solo si el usuario tiene TODOS los permisos
 * @param {Object} props
 * @param {string[]} props.permissions - Permisos requeridos (todos)
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo
 */
export function AllPermissionsGate({ permissions, children, fallback = null, showLoading = false }) {
  const { hasPermission, loading } = useHasAllPermissions(permissions);

  if (loading && showLoading) {
    return <span className="text-gray-400">...</span>;
  }

  if (loading) {
    return null;
  }

  return hasPermission ? children : fallback;
}

/**
 * Gate que muestra contenido solo para roles específicos
 * @param {Object} props
 * @param {string[]} props.roles - Roles permitidos
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo
 */
export function RoleGate({ roles, children, fallback = null, showLoading = false }) {
  const { hasRole, loading } = useHasRole(roles);

  if (loading && showLoading) {
    return <span className="text-gray-400">...</span>;
  }

  if (loading) {
    return null;
  }

  return hasRole ? children : fallback;
}

/**
 * Gate exclusivo para administradores
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a mostrar
 * @param {React.ReactNode} props.fallback - Contenido alternativo
 */
export function AdminGate({ children, fallback = null, showLoading = false }) {
  return (
    <RoleGate roles={['admin']} fallback={fallback} showLoading={showLoading}>
      {children}
    </RoleGate>
  );
}

/**
 * Gate que muestra mensaje de acceso denegado
 * @param {Object} props
 * @param {string} props.permission - Permiso requerido
 * @param {React.ReactNode} props.children - Contenido a mostrar
 */
export function PermissionGateWithMessage({ permission, children }) {
  const { hasPermission, loading } = useHasPermission(permission);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  if (!hasPermission) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <svg
          className="mx-auto h-12 w-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <h3 className="mt-4 text-lg font-medium text-red-800">
          Acceso denegado
        </h3>
        <p className="mt-2 text-sm text-red-600">
          No tienes permiso para acceder a esta sección.
        </p>
        <p className="mt-1 text-xs text-red-500">
          Permiso requerido: <code className="bg-red-100 px-1 rounded">{permission}</code>
        </p>
      </div>
    );
  }

  return children;
}

/**
 * HOC para proteger componentes con permisos
 * @param {React.ComponentType} Component - Componente a proteger
 * @param {string} permission - Permiso requerido
 * @param {React.ReactNode} fallback - Componente alternativo
 */
export function withPermission(Component, permission, fallback = null) {
  return function PermissionProtectedComponent(props) {
    return (
      <PermissionGate permission={permission} fallback={fallback}>
        <Component {...props} />
      </PermissionGate>
    );
  };
}

/**
 * HOC para proteger componentes con roles
 * @param {React.ComponentType} Component - Componente a proteger
 * @param {string[]} roles - Roles permitidos
 * @param {React.ReactNode} fallback - Componente alternativo
 */
export function withRole(Component, roles, fallback = null) {
  return function RoleProtectedComponent(props) {
    return (
      <RoleGate roles={roles} fallback={fallback}>
        <Component {...props} />
      </RoleGate>
    );
  };
}

export default PermissionGate;

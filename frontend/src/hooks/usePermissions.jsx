/**
 * usePermissions Hook - CITAMED.VE
 * M01 Sub-Partida 2.5.1
 *
 * Hook para gestión de permisos en componentes React
 */

import { useState, useEffect, useCallback, useMemo, useContext, createContext } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getMyPermissions,
  hasPermissionLocal,
  hasAnyPermissionLocal,
  hasAllPermissionsLocal
} from '../services/rbacService';

// ========================================
// CONTEXT PARA COMPARTIR PERMISOS
// ========================================

const PermissionsContext = createContext({
  permissions: [],
  loading: true,
  error: null,
  hasPermission: () => false,
  hasAnyPermission: () => false,
  hasAllPermissions: () => false,
  refreshPermissions: () => Promise.resolve()
});

/**
 * Provider para permisos del usuario
 */
export function PermissionsProvider({ children }) {
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar permisos cuando el usuario está autenticado
  const loadPermissions = useCallback(async () => {
    if (!isAuthenticated || !user) {
      setPermissions([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const response = await getMyPermissions();

      if (response.success) {
        setPermissions(response.data.permissions || []);
      } else {
        throw new Error(response.message || 'Error obteniendo permisos');
      }
    } catch (err) {
      console.error('Error cargando permisos:', err);
      setError(err.message);
      // Si hay error, usar array vacío pero incluir el rol
      setPermissions([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Verificar un permiso específico
  const hasPermission = useCallback((permission) => {
    // Admin siempre tiene todos los permisos
    if (user?.role === 'admin') return true;
    return hasPermissionLocal(permissions, permission);
  }, [permissions, user?.role]);

  // Verificar si tiene al menos uno de los permisos
  const hasAnyPermission = useCallback((permissionList) => {
    if (user?.role === 'admin') return true;
    return hasAnyPermissionLocal(permissions, permissionList);
  }, [permissions, user?.role]);

  // Verificar si tiene todos los permisos
  const hasAllPermissions = useCallback((permissionList) => {
    if (user?.role === 'admin') return true;
    return hasAllPermissionsLocal(permissions, permissionList);
  }, [permissions, user?.role]);

  const value = useMemo(() => ({
    permissions,
    loading,
    error,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    refreshPermissions: loadPermissions,
    role: user?.role
  }), [permissions, loading, error, hasPermission, hasAnyPermission, hasAllPermissions, loadPermissions, user?.role]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

/**
 * Hook principal para acceder a los permisos
 */
export function usePermissions() {
  const context = useContext(PermissionsContext);

  if (!context) {
    throw new Error('usePermissions debe usarse dentro de PermissionsProvider');
  }

  return context;
}

/**
 * Hook para verificar un permiso específico
 * @param {string} permission - Nombre del permiso
 */
export function useHasPermission(permission) {
  const { hasPermission, loading } = usePermissions();

  return useMemo(() => ({
    hasPermission: hasPermission(permission),
    loading
  }), [hasPermission, permission, loading]);
}

/**
 * Hook para verificar múltiples permisos (cualquiera)
 * @param {string[]} permissions - Lista de permisos
 */
export function useHasAnyPermission(permissions) {
  const { hasAnyPermission, loading } = usePermissions();

  return useMemo(() => ({
    hasPermission: hasAnyPermission(permissions),
    loading
  }), [hasAnyPermission, permissions, loading]);
}

/**
 * Hook para verificar múltiples permisos (todos)
 * @param {string[]} permissions - Lista de permisos
 */
export function useHasAllPermissions(permissions) {
  const { hasAllPermissions, loading } = usePermissions();

  return useMemo(() => ({
    hasPermission: hasAllPermissions(permissions),
    loading
  }), [hasAllPermissions, permissions, loading]);
}

/**
 * Hook para verificar si el usuario es admin
 */
export function useIsAdmin() {
  const { role, loading } = usePermissions();

  return useMemo(() => ({
    isAdmin: role === 'admin',
    loading
  }), [role, loading]);
}

/**
 * Hook para verificar roles específicos
 * @param {string[]} roles - Lista de roles permitidos
 */
export function useHasRole(roles) {
  const { role, loading } = usePermissions();

  return useMemo(() => ({
    hasRole: roles.includes(role),
    loading
  }), [role, roles, loading]);
}

export default usePermissions;

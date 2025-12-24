/**
 * RoleManagementPage - CITAMED.VE
 * M01 Sub-Partida 2.5.1
 *
 * Página de administración de roles y permisos
 */

import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  listPermissionsGrouped,
  getRolePermissions,
  assignPermissionToRole,
  removePermissionFromRole
} from '../../services/rbacService';
import { AdminGate } from '../../components/permissions/PermissionGate';
import { Shield, Users, Check, X, ChevronDown, ChevronUp, ArrowLeft, RefreshCw } from 'lucide-react';

const ROLES = [
  { id: 'patient', name: 'Paciente', description: 'Usuario que agenda citas médicas', color: 'bg-blue-100 text-blue-800' },
  { id: 'doctor', name: 'Médico', description: 'Profesional de la salud', color: 'bg-green-100 text-green-800' },
  { id: 'provider', name: 'Proveedor', description: 'Clínica o centro de salud', color: 'bg-purple-100 text-purple-800' },
  { id: 'admin', name: 'Administrador', description: 'Acceso completo al sistema', color: 'bg-red-100 text-red-800' }
];

function RoleManagementContent() {
  const navigate = useNavigate();
  const [permissionsGrouped, setPermissionsGrouped] = useState({});
  const [rolePermissions, setRolePermissions] = useState({});
  const [selectedRole, setSelectedRole] = useState('patient');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [expandedResources, setExpandedResources] = useState({});
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Cargar permisos agrupados
  const loadPermissions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [groupedResponse, roleResponse] = await Promise.all([
        listPermissionsGrouped(),
        getRolePermissions(selectedRole)
      ]);

      if (groupedResponse.success) {
        setPermissionsGrouped(groupedResponse.data.permissions);
        // Expandir todos los recursos por defecto
        const expanded = {};
        Object.keys(groupedResponse.data.permissions).forEach(resource => {
          expanded[resource] = true;
        });
        setExpandedResources(expanded);
      }

      if (roleResponse.success) {
        setRolePermissions(prev => ({
          ...prev,
          [selectedRole]: roleResponse.data.permissions.map(p => p.id)
        }));
      }
    } catch (err) {
      setError('Error cargando permisos: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedRole]);

  useEffect(() => {
    loadPermissions();
  }, [loadPermissions]);

  // Cargar permisos de un rol específico
  const loadRolePermissions = async (role) => {
    try {
      const response = await getRolePermissions(role);
      if (response.success) {
        setRolePermissions(prev => ({
          ...prev,
          [role]: response.data.permissions.map(p => p.id)
        }));
      }
    } catch (err) {
      console.error('Error cargando permisos del rol:', err);
    }
  };

  // Toggle permiso para un rol
  const togglePermission = async (permissionId, hasPermission) => {
    if (selectedRole === 'admin') {
      setError('No se pueden modificar los permisos del rol admin');
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      if (hasPermission) {
        await removePermissionFromRole(selectedRole, permissionId);
        setRolePermissions(prev => ({
          ...prev,
          [selectedRole]: prev[selectedRole]?.filter(id => id !== permissionId) || []
        }));
        setSuccessMessage('Permiso removido');
      } else {
        await assignPermissionToRole(selectedRole, permissionId);
        setRolePermissions(prev => ({
          ...prev,
          [selectedRole]: [...(prev[selectedRole] || []), permissionId]
        }));
        setSuccessMessage('Permiso asignado');
      }

      // Limpiar mensaje de éxito después de 2 segundos
      setTimeout(() => setSuccessMessage(''), 2000);
    } catch (err) {
      setError('Error actualizando permiso: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Toggle expandir/colapsar recurso
  const toggleResource = (resource) => {
    setExpandedResources(prev => ({
      ...prev,
      [resource]: !prev[resource]
    }));
  };

  // Verificar si un permiso está asignado al rol actual
  const hasPermission = (permissionId) => {
    return rolePermissions[selectedRole]?.includes(permissionId) || false;
  };

  const currentRoleInfo = ROLES.find(r => r.id === selectedRole);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="h-5 w-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-7 w-7 text-teal-600" />
                Gestión de Roles y Permisos
              </h1>
              <p className="text-gray-600 mt-1">
                Administra los permisos asignados a cada rol del sistema
              </p>
            </div>
          </div>
          <button
            onClick={loadPermissions}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {/* Mensajes */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {successMessage}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Selector de roles */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border p-4">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5" />
                Roles
              </h2>
              <div className="space-y-2">
                {ROLES.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => {
                      setSelectedRole(role.id);
                      if (!rolePermissions[role.id]) {
                        loadRolePermissions(role.id);
                      }
                    }}
                    className={`w-full text-left p-3 rounded-lg border-2 transition-all ${
                      selectedRole === role.id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-transparent hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${role.color}`}>
                        {role.name}
                      </span>
                      {selectedRole === role.id && (
                        <Check className="h-4 w-4 text-teal-600" />
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{role.description}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Info del rol actual */}
            {currentRoleInfo && (
              <div className="mt-4 bg-white rounded-xl shadow-sm border p-4">
                <h3 className="font-medium text-gray-900">Rol seleccionado</h3>
                <div className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-medium ${currentRoleInfo.color}`}>
                  {currentRoleInfo.name}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  {rolePermissions[selectedRole]?.length || 0} permisos asignados
                </p>
                {selectedRole === 'admin' && (
                  <p className="text-xs text-amber-600 mt-2">
                    * Los permisos de admin no se pueden modificar
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Lista de permisos */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-4 border-b">
                <h2 className="font-semibold text-gray-900">
                  Permisos del Sistema
                </h2>
                <p className="text-sm text-gray-500">
                  Haz clic en un permiso para asignarlo o quitarlo del rol seleccionado
                </p>
              </div>

              <div className="divide-y">
                {Object.entries(permissionsGrouped).map(([resource, permissions]) => (
                  <div key={resource} className="border-b last:border-b-0">
                    {/* Header del recurso */}
                    <button
                      onClick={() => toggleResource(resource)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 capitalize">
                          {resource}
                        </span>
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                          {permissions.length} permisos
                        </span>
                      </div>
                      {expandedResources[resource] ? (
                        <ChevronUp className="h-5 w-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Lista de permisos del recurso */}
                    {expandedResources[resource] && (
                      <div className="px-4 pb-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {permissions.map((permission) => {
                            const isAssigned = hasPermission(permission.id);
                            const isAdmin = selectedRole === 'admin';

                            return (
                              <button
                                key={permission.id}
                                onClick={() => !isAdmin && togglePermission(permission.id, isAssigned)}
                                disabled={updating || isAdmin}
                                className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                                  isAssigned
                                    ? 'bg-teal-50 border-teal-200'
                                    : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                } ${isAdmin ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}`}
                              >
                                <div className="text-left">
                                  <p className={`text-sm font-medium ${isAssigned ? 'text-teal-700' : 'text-gray-700'}`}>
                                    {permission.action}
                                  </p>
                                  <p className="text-xs text-gray-500 truncate max-w-[200px]">
                                    {permission.description}
                                  </p>
                                </div>
                                <div className={`p-1 rounded-full ${isAssigned ? 'bg-teal-200' : 'bg-gray-200'}`}>
                                  {isAssigned ? (
                                    <Check className="h-4 w-4 text-teal-700" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-400" />
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RoleManagementPage() {
  return (
    <AdminGate
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md">
            <Shield className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600">
              Solo los administradores pueden acceder a esta sección.
            </p>
          </div>
        </div>
      }
    >
      <RoleManagementContent />
    </AdminGate>
  );
}

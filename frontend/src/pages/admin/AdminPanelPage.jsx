/**
 * AdminPanelPage.jsx - CITAMED.VE
 * M01 / Semana 7 - Panel de Superadministración: Resumen, Médicos y Usuarios
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Stethoscope,
  Users,
  Bot,
  ShieldCheck,
  FileText,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Activity,
  Calendar,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import adminService from '../../services/adminService';
import './AdminPanelPage.css';

export default function AdminPanelPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  // ==========================================
  // ESTADO: RESUMEN (OVERVIEW)
  // ==========================================
  const [overview, setOverview] = useState(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  const loadOverview = useCallback(async () => {
    setOverviewLoading(true);
    try {
      const data = await adminService.getOverview();
      if (data.success) {
        setOverview(data);
      }
    } catch (err) {
      console.error('Error al cargar métricas generales:', err);
      toast.error('No se pudo cargar el resumen de la plataforma');
    } finally {
      setOverviewLoading(false);
    }
  }, []);

  // ==========================================
  // ESTADO: MÉDICOS
  // ==========================================
  const [doctors, setDoctors] = useState([]);
  const [doctorsLoading, setDoctorsLoading] = useState(false);
  const [docSearch, setDocSearch] = useState('');
  const [docDebouncedSearch, setDocDebouncedSearch] = useState('');
  const [docVerification, setDocVerification] = useState('all');
  const [docStatus, setDocStatus] = useState('all');
  const [docPagination, setDocPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const docTimerRef = useRef(null);

  useEffect(() => {
    if (docTimerRef.current) clearTimeout(docTimerRef.current);
    docTimerRef.current = setTimeout(() => {
      setDocDebouncedSearch(docSearch);
      setDocPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => {
      if (docTimerRef.current) clearTimeout(docTimerRef.current);
    };
  }, [docSearch]);

  const loadDoctors = useCallback(async () => {
    setDoctorsLoading(true);
    try {
      const res = await adminService.getDoctors({
        search: docDebouncedSearch,
        verification: docVerification,
        status: docStatus,
        page: docPagination.page,
        limit: docPagination.limit
      });
      if (res.success) {
        setDoctors(res.doctors || []);
        if (res.pagination) {
          setDocPagination((p) => ({
            ...p,
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1
          }));
        }
      }
    } catch (err) {
      console.error('Error al cargar médicos:', err);
      toast.error('No se pudo cargar el listado de médicos');
    } finally {
      setDoctorsLoading(false);
    }
  }, [docDebouncedSearch, docVerification, docStatus, docPagination.page, docPagination.limit]);

  // ==========================================
  // ESTADO: USUARIOS
  // ==========================================
  const [usersList, setUsersList] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userDebouncedSearch, setUserDebouncedSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [userStatus, setUserStatus] = useState('all');
  const [userPagination, setUserPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });
  const userTimerRef = useRef(null);

  useEffect(() => {
    if (userTimerRef.current) clearTimeout(userTimerRef.current);
    userTimerRef.current = setTimeout(() => {
      setUserDebouncedSearch(userSearch);
      setUserPagination((p) => ({ ...p, page: 1 }));
    }, 300);
    return () => {
      if (userTimerRef.current) clearTimeout(userTimerRef.current);
    };
  }, [userSearch]);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try {
      const res = await adminService.getUsers({
        search: userDebouncedSearch,
        role: userRole,
        status: userStatus,
        page: userPagination.page,
        limit: userPagination.limit
      });
      if (res.success) {
        setUsersList(res.users || []);
        if (res.pagination) {
          setUserPagination((p) => ({
            ...p,
            total: res.pagination.total || 0,
            totalPages: res.pagination.totalPages || 1
          }));
        }
      }
    } catch (err) {
      console.error('Error al listar usuarios:', err);
      toast.error('No se pudo cargar el listado de usuarios');
    } finally {
      setUsersLoading(false);
    }
  }, [userDebouncedSearch, userRole, userStatus, userPagination.page, userPagination.limit]);

  // ==========================================
  // ESTADO: DETALLE / SIDEDRAWER DE USUARIO
  // ==========================================
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [showSuspendInput, setShowSuspendInput] = useState(false);
  const [actionProcessing, setActionProcessing] = useState(false);

  const handleOpenUserDetail = async (userId) => {
    setDrawerOpen(true);
    setDrawerLoading(true);
    setSelectedUser(null);
    setShowSuspendInput(false);
    setSuspensionReason('');
    try {
      const res = await adminService.getUserById(userId);
      if (res.success) {
        setSelectedUser(res.data || res);
      }
    } catch (err) {
      console.error('Error al obtener detalle del usuario:', err);
      toast.error('No se pudo cargar la información del usuario');
      setDrawerOpen(false);
    } finally {
      setDrawerLoading(false);
    }
  };

  const handleToggleUserStatus = async (userToUpdate, shouldBeActive) => {
    if (!shouldBeActive) {
      if (!suspensionReason.trim()) {
        toast.error('Debes indicar un motivo para suspender la cuenta');
        return;
      }
      const confirmed = window.confirm(
        `¿Confirmas que deseas suspender la cuenta de ${userToUpdate.name || userToUpdate.email}?`
      );
      if (!confirmed) return;
    } else {
      const confirmed = window.confirm(
        `¿Confirmas que deseas reactivar la cuenta de ${userToUpdate.name || userToUpdate.email}?`
      );
      if (!confirmed) return;
    }

    setActionProcessing(true);
    try {
      const res = await adminService.updateUserStatus(userToUpdate.id, {
        isActive: shouldBeActive,
        reason: shouldBeActive ? null : suspensionReason.trim()
      });
      if (res.success) {
        toast.success(
          shouldBeActive
            ? 'Cuenta reactivada exitosamente'
            : 'Cuenta suspendida exitosamente'
        );
        setShowSuspendInput(false);
        setSuspensionReason('');
        // Refrescar usuario en el drawer
        setSelectedUser((prev) => ({
          ...prev,
          isActive: shouldBeActive,
          suspendedReason: shouldBeActive ? null : suspensionReason.trim()
        }));
        // Refrescar listas activas
        if (activeTab === 'doctors') loadDoctors();
        if (activeTab === 'users') loadUsers();
        if (activeTab === 'overview') loadOverview();
      }
    } catch (err) {
      console.error('Error al actualizar estado del usuario:', err);
      toast.error(err.response?.data?.message || 'Error al actualizar estado del usuario');
    } finally {
      setActionProcessing(false);
    }
  };

  // Carga inicial según la pestaña seleccionada
  useEffect(() => {
    if (activeTab === 'overview') {
      loadOverview();
    } else if (activeTab === 'doctors') {
      loadDoctors();
    } else if (activeTab === 'users') {
      loadUsers();
    }
  }, [activeTab, loadOverview, loadDoctors, loadUsers]);

  return (
    <div className="admin-panel-page">
      <Navbar />

      <main className="admin-panel-container">
        {/* ENCABEZADO DEL PANEL */}
        <header className="admin-header">
          <div className="admin-header-info">
            <div className="admin-header-icon-wrap">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h1 className="admin-header-title">Panel de Superadministración</h1>
              <p className="admin-header-subtitle">
                Supervisión médica, control de usuarios y gestión de plataforma en CitaMed.
              </p>
            </div>
          </div>

          <div className="admin-header-links">
            <Link to="/admin/verificacion" className="admin-quick-link" title="Revisión de expedientes KYC">
              <Stethoscope className="w-4 h-4 text-primary" />
              <span>Verificación de médicos</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>
            <Link to="/admin/audit" className="admin-quick-link" title="Registro de auditoría del sistema">
              <FileText className="w-4 h-4 text-primary" />
              <span>Auditoría</span>
              <ExternalLink className="w-3.5 h-3.5 text-gray-400" />
            </Link>
          </div>
        </header>

        {/* NAVEGACIÓN POR PESTAÑAS */}
        <nav className="admin-tabs-nav" aria-label="Secciones del panel">
          <button
            type="button"
            onClick={() => setActiveTab('overview')}
            className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Resumen</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('doctors')}
            className={`admin-tab-btn ${activeTab === 'doctors' ? 'active' : ''}`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Médicos</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          >
            <Users className="w-4 h-4" />
            <span>Usuarios</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`admin-tab-btn ${activeTab === 'ai' ? 'active' : ''}`}
          >
            <Bot className="w-4 h-4" />
            <span>Inteligencia Artificial</span>
          </button>
        </nav>

        {/* ========================================================= */}
        {/* PESTAÑA 1: RESUMEN (OVERVIEW) */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div>
            {overviewLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" />
                <span>Cargando métricas de la plataforma...</span>
              </div>
            ) : overview ? (
              <>
                <div className="admin-overview-grid">
                  {/* Tarjeta: Total Usuarios */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-label">Usuarios Totales</span>
                      <div className="admin-stat-icon-wrap bg-blue-50 text-blue-600">
                        <Users className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="admin-stat-value">{overview.users?.total ?? 0}</div>
                    <div className="admin-stat-desc">
                      <span className="admin-stat-badge bg-emerald-50 text-emerald-700">
                        {overview.users?.active ?? 0} activos
                      </span>
                      {Number(overview.users?.suspended) > 0 && (
                        <span className="admin-stat-badge bg-rose-50 text-rose-700">
                          {overview.users?.suspended} suspendidos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tarjeta: Médicos y Verificación */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-label">Médicos en CitaMed</span>
                      <div className="admin-stat-icon-wrap bg-indigo-50 text-indigo-600">
                        <Stethoscope className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="admin-stat-value">{overview.doctors?.total ?? 0}</div>
                    <div className="admin-stat-desc">
                      <span className="admin-stat-badge bg-emerald-50 text-emerald-700">
                        {overview.doctors?.byVerification?.verified ?? 0} verificados
                      </span>
                      <span className="admin-stat-badge bg-amber-50 text-amber-700">
                        {overview.doctors?.byVerification?.pending ?? 0} pendientes
                      </span>
                      <span className="admin-stat-badge bg-cyan-50 text-cyan-700">
                        {overview.doctors?.inDirectory ?? 0} en directorio
                      </span>
                    </div>
                  </div>

                  {/* Tarjeta: Citas del Mes y Hoy */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-label">Actividad Clínica</span>
                      <div className="admin-stat-icon-wrap bg-amber-50 text-amber-600">
                        <Calendar className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="admin-stat-value">{overview.appointments?.thisMonth ?? 0}</div>
                    <div className="admin-stat-desc">
                      <span>Citas del mes • <strong>{overview.appointments?.today ?? 0}</strong> hoy</span>
                      <span>Consultas realizadas: <strong>{overview.consultations?.completedThisMonth ?? 0}</strong></span>
                    </div>
                  </div>

                  {/* Tarjeta: Uso de IA este mes */}
                  <div className="admin-stat-card">
                    <div className="admin-stat-top">
                      <span className="admin-stat-label">Asistente IA (Mes en curso)</span>
                      <div className="admin-stat-icon-wrap bg-purple-50 text-purple-600">
                        <Bot className="w-5 h-5" />
                      </div>
                    </div>
                    <div className="admin-stat-value">{overview.ai?.totalThisMonth ?? 0}</div>
                    <div className="admin-stat-desc">
                      <span className="admin-stat-badge bg-emerald-50 text-emerald-700">
                        {overview.ai?.successThisMonth ?? 0} exitosas
                      </span>
                      {Number(overview.ai?.failedThisMonth) > 0 && (
                        <span className="admin-stat-badge bg-rose-50 text-rose-700">
                          {overview.ai?.failedThisMonth} fallos
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Top Médicos Usuarios de IA */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">
                      <Activity className="w-5 h-5 text-purple-600" />
                      <span>Médicos con mayor uso de IA clínica (Mes en curso)</span>
                    </h2>
                  </div>
                  {overview.topDoctorsAi && overview.topDoctorsAi.length > 0 ? (
                    <div className="admin-table-container">
                      <table className="admin-table">
                        <thead>
                          <tr>
                            <th>Médico</th>
                            <th>Especialidad</th>
                            <th style={{ textAlign: 'right' }}>Acciones Ejecutadas</th>
                          </tr>
                        </thead>
                        <tbody>
                          {overview.topDoctorsAi.map((doc, idx) => (
                            <tr key={doc.doctorId || idx}>
                              <td>
                                <div className="font-semibold text-gray-900">Dr(a). {doc.name}</div>
                                <div className="text-xs text-gray-500">ID Usuario: #{doc.doctorId}</div>
                              </td>
                              <td>{doc.specialty || 'Medicina General'}</td>
                              <td style={{ textAlign: 'right' }}>
                                <span className="badge badge-info">{doc.count} acciones</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      No se han registrado consumos de IA clínica en este período.
                    </p>
                  )}
                </div>
              </>
            ) : null}
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 2: MÉDICOS */}
        {/* ========================================================= */}
        {activeTab === 'doctors' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Stethoscope className="w-5 h-5 text-primary" />
                <span>Directorio Médico y Control de Cuentas</span>
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Total: {docPagination.total} médicos
              </span>
            </div>

            {/* Filtros */}
            <div className="admin-filters-bar">
              <div className="admin-search-wrap">
                <Search className="admin-search-icon" />
                <input
                  type="text"
                  value={docSearch}
                  onChange={(e) => setDocSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo, cédula o MPPS..."
                  className="admin-search-input"
                />
              </div>

              <select
                value={docVerification}
                onChange={(e) => {
                  setDocVerification(e.target.value);
                  setDocPagination((p) => ({ ...p, page: 1 }));
                }}
                className="admin-select"
              >
                <option value="all">Todas las verificaciones</option>
                <option value="verified">Verificados</option>
                <option value="pending">Pendientes de revisión</option>
                <option value="rejected">Rechazados</option>
                <option value="unsubmitted">Sin expediente enviado</option>
              </select>

              <select
                value={docStatus}
                onChange={(e) => {
                  setDocStatus(e.target.value);
                  setDocPagination((p) => ({ ...p, page: 1 }));
                }}
                className="admin-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
            </div>

            {/* Tabla de Médicos */}
            {doctorsLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" />
                <span>Buscando médicos...</span>
              </div>
            ) : doctors.length > 0 ? (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Médico</th>
                      <th>Cédula / MPPS</th>
                      <th>Especialidades</th>
                      <th>Verificación</th>
                      <th>Estado</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {doctors.map((doc) => (
                      <tr
                        key={doc.id}
                        className="clickable"
                        onClick={() => handleOpenUserDetail(doc.id)}
                      >
                        <td>
                          <div className="font-semibold text-gray-900">Dr(a). {doc.name}</div>
                          <div className="text-xs text-gray-500">{doc.email}</div>
                        </td>
                        <td>
                          <div className="text-sm">{doc.identificationNumber || '—'}</div>
                          <div className="text-xs text-gray-500">MPPS: {doc.mppsNumber || '—'}</div>
                        </td>
                        <td>
                          <span className="text-xs text-gray-700 font-medium">
                            {doc.specialties && doc.specialties.length > 0
                              ? doc.specialties.join(', ')
                              : 'Medicina General'}
                          </span>
                        </td>
                        <td>
                          {doc.verificationStatus === 'verified' && (
                            <span className="badge badge-success">
                              <CheckCircle2 className="w-3 h-3" /> Verificado
                            </span>
                          )}
                          {doc.verificationStatus === 'pending' && (
                            <span className="badge badge-warning">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                          {doc.verificationStatus === 'rejected' && (
                            <span className="badge badge-danger">
                              <XCircle className="w-3 h-3" /> Rechazado
                            </span>
                          )}
                          {(!doc.verificationStatus || doc.verificationStatus === 'unsubmitted') && (
                            <span className="badge badge-neutral">No enviado</span>
                          )}
                        </td>
                        <td>
                          {doc.isActive ? (
                            <span className="badge badge-success">Activo</span>
                          ) : (
                            <span className="badge badge-danger">Suspendido</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUserDetail(doc.id);
                            }}
                            className="text-primary hover:underline font-semibold text-xs"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No se encontraron médicos con los filtros aplicados.
              </div>
            )}

            {/* Paginación */}
            {docPagination.totalPages > 1 && (
              <div className="admin-pagination">
                <span className="admin-pagination-info">
                  Página {docPagination.page} de {docPagination.totalPages}
                </span>
                <div className="admin-pagination-actions">
                  <button
                    type="button"
                    disabled={docPagination.page <= 1}
                    onClick={() => setDocPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="admin-btn-page"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    type="button"
                    disabled={docPagination.page >= docPagination.totalPages}
                    onClick={() => setDocPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="admin-btn-page"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 3: USUARIOS */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Users className="w-5 h-5 text-primary" />
                <span>Gestión de Cuentas y Usuarios</span>
              </h2>
              <span className="text-xs text-gray-500 font-medium">
                Total: {userPagination.total} usuarios
              </span>
            </div>

            {/* Filtros */}
            <div className="admin-filters-bar">
              <div className="admin-search-wrap">
                <Search className="admin-search-icon" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Buscar por nombre, correo o cédula..."
                  className="admin-search-input"
                />
              </div>

              <select
                value={userRole}
                onChange={(e) => {
                  setUserRole(e.target.value);
                  setUserPagination((p) => ({ ...p, page: 1 }));
                }}
                className="admin-select"
              >
                <option value="all">Todos los roles</option>
                <option value="patient">Pacientes</option>
                <option value="doctor">Médicos</option>
                <option value="provider">Proveedores</option>
                <option value="admin">Administradores</option>
              </select>

              <select
                value={userStatus}
                onChange={(e) => {
                  setUserStatus(e.target.value);
                  setUserPagination((p) => ({ ...p, page: 1 }));
                }}
                className="admin-select"
              >
                <option value="all">Todos los estados</option>
                <option value="active">Activos</option>
                <option value="suspended">Suspendidos</option>
              </select>
            </div>

            {/* Tabla de Usuarios */}
            {usersLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" />
                <span>Buscando usuarios...</span>
              </div>
            ) : usersList.length > 0 ? (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Usuario</th>
                      <th>Cédula</th>
                      <th>Rol</th>
                      <th>Estado</th>
                      <th>Registro</th>
                      <th style={{ textAlign: 'right' }}>Acción</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((usr) => (
                      <tr
                        key={usr.id}
                        className="clickable"
                        onClick={() => handleOpenUserDetail(usr.id)}
                      >
                        <td>
                          <div className="font-semibold text-gray-900">{usr.name || 'Sin nombre'}</div>
                          <div className="text-xs text-gray-500">{usr.email}</div>
                        </td>
                        <td className="text-sm">{usr.identificationNumber || '—'}</td>
                        <td>
                          <span className="badge badge-info uppercase text-[10px] tracking-wider">
                            {usr.role === 'doctor'
                              ? 'Médico'
                              : usr.role === 'patient'
                              ? 'Paciente'
                              : usr.role === 'admin'
                              ? 'Admin'
                              : 'Proveedor'}
                          </span>
                        </td>
                        <td>
                          {usr.isActive ? (
                            <span className="badge badge-success">Activo</span>
                          ) : (
                            <span className="badge badge-danger">Suspendido</span>
                          )}
                        </td>
                        <td className="text-xs text-gray-500">
                          {usr.createdAt ? new Date(usr.createdAt).toLocaleDateString('es-VE') : '—'}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenUserDetail(usr.id);
                            }}
                            className="text-primary hover:underline font-semibold text-xs"
                          >
                            Ver detalle →
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500 text-sm">
                No se encontraron usuarios con los filtros aplicados.
              </div>
            )}

            {/* Paginación */}
            {userPagination.totalPages > 1 && (
              <div className="admin-pagination">
                <span className="admin-pagination-info">
                  Página {userPagination.page} de {userPagination.totalPages}
                </span>
                <div className="admin-pagination-actions">
                  <button
                    type="button"
                    disabled={userPagination.page <= 1}
                    onClick={() => setUserPagination((p) => ({ ...p, page: p.page - 1 }))}
                    className="admin-btn-page"
                  >
                    <ChevronLeft className="w-4 h-4" /> Anterior
                  </button>
                  <button
                    type="button"
                    disabled={userPagination.page >= userPagination.totalPages}
                    onClick={() => setUserPagination((p) => ({ ...p, page: p.page + 1 }))}
                    className="admin-btn-page"
                  >
                    Siguiente <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* PESTAÑA 4: INTELIGENCIA ARTIFICIAL (IA) */}
        {/* ========================================================= */}
        {activeTab === 'ai' && (
          <div className="admin-card">
            <div className="admin-card-header">
              <h2 className="admin-card-title">
                <Bot className="w-5 h-5 text-primary" />
                <span>Configuración de Inteligencia Artificial</span>
              </h2>
            </div>
            <p className="text-sm text-gray-500 py-4">
              Configuración de proveedores de IA y límites en proceso...
            </p>
          </div>
        )}

        {/* ========================================================= */}
        {/* SIDEDRAWER: DETALLE Y SUSPENSIÓN DE USUARIOS / MÉDICOS */}
        {/* ========================================================= */}
        <SideDrawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          title={selectedUser?.role === 'doctor' ? 'Expediente del Médico' : 'Detalle de Cuenta'}
        >
          {drawerLoading ? (
            <div className="flex items-center justify-center p-12 text-gray-500">
              <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" />
              <span>Cargando detalle...</span>
            </div>
          ) : selectedUser ? (
            <div>
              {/* Box de Perfil */}
              <div className="drawer-profile-box">
                <div className="drawer-avatar">
                  {selectedUser.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">
                    {selectedUser.role === 'doctor' ? `Dr(a). ${selectedUser.name}` : selectedUser.name}
                  </h3>
                  <p className="text-xs text-gray-500">{selectedUser.email}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="badge badge-info uppercase text-[10px]">
                      {selectedUser.role}
                    </span>
                    {selectedUser.isActive ? (
                      <span className="badge badge-success">Cuenta Activa</span>
                    ) : (
                      <span className="badge badge-danger">Cuenta Suspendida</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Si está suspendido: Caja de Advertencia */}
              {!selectedUser.isActive && (
                <div className="drawer-suspension-box">
                  <div className="drawer-suspension-title">
                    <AlertTriangle className="w-4 h-4" />
                    <span>Cuenta actualmente suspendida</span>
                  </div>
                  <p className="drawer-suspension-text">
                    <strong>Motivo registrado:</strong> {selectedUser.suspendedReason || 'No especificado'}
                  </p>
                  {selectedUser.suspendedAt && (
                    <p className="text-xs text-rose-600 mt-1">
                      Fecha: {new Date(selectedUser.suspendedAt).toLocaleString('es-VE')}
                    </p>
                  )}
                </div>
              )}

              {/* Información General */}
              <div className="drawer-info-grid">
                <div className="drawer-info-item">
                  <span className="drawer-info-label">Cédula de Identidad</span>
                  <div className="drawer-info-val">
                    {selectedUser.identificationNumber || selectedUser.PatientProfile?.identificationNumber || '—'}
                  </div>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Teléfono</span>
                  <div className="drawer-info-val">{selectedUser.phone || '—'}</div>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">Fecha de Registro</span>
                  <div className="drawer-info-val">
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleDateString('es-VE')
                      : '—'}
                  </div>
                </div>

                <div className="drawer-info-item">
                  <span className="drawer-info-label">ID en Sistema</span>
                  <div className="drawer-info-val font-mono">#{selectedUser.id}</div>
                </div>
              </div>

              {/* Si es Médico: Datos Profesionales Adicionales */}
              {selectedUser.role === 'doctor' && selectedUser.DoctorProfile && (
                <div className="mb-6">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">
                    Credenciales Médicas
                  </h4>
                  <div className="drawer-info-grid">
                    <div className="drawer-info-item">
                      <span className="drawer-info-label">Número MPPS</span>
                      <div className="drawer-info-val">
                        {selectedUser.DoctorProfile.mppsNumber || '—'}
                      </div>
                    </div>

                    <div className="drawer-info-item">
                      <span className="drawer-info-label">Colegio Médico</span>
                      <div className="drawer-info-val">
                        {selectedUser.DoctorProfile.colegioMedicoNumber || '—'}
                      </div>
                    </div>

                    <div className="drawer-info-item">
                      <span className="drawer-info-label">Estado KYC</span>
                      <div className="drawer-info-val capitalize">
                        {selectedUser.DoctorProfile.verificationStatus || 'unsubmitted'}
                      </div>
                    </div>

                    <div className="drawer-info-item">
                      <span className="drawer-info-label">Visible en Directorio</span>
                      <div className="drawer-info-val">
                        {selectedUser.DoctorProfile.isDirectoryListed ? 'Sí' : 'No'}
                      </div>
                    </div>
                  </div>

                  <div className="mt-2">
                    <button
                      type="button"
                      onClick={() => navigate('/admin/verificacion')}
                      className="admin-quick-link w-full justify-center text-primary"
                    >
                      <Stethoscope className="w-4 h-4" />
                      <span>Revisar expediente en Verificación de médicos</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Acciones de Suspensión / Reactivación */}
              <div className="border-t border-gray-200 pt-4 mt-6">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">
                  Gestión de Acceso
                </h4>

                {selectedUser.role === 'admin' ? (
                  <p className="text-xs text-gray-500 italic">
                    Las cuentas con rol de administrador no pueden ser suspendidas.
                  </p>
                ) : selectedUser.isActive ? (
                  <div>
                    {!showSuspendInput ? (
                      <button
                        type="button"
                        onClick={() => setShowSuspendInput(true)}
                        className="px-4 py-2 bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg text-sm font-semibold transition-all w-full flex items-center justify-center gap-2"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        <span>Suspender cuenta</span>
                      </button>
                    ) : (
                      <div className="drawer-suspend-form">
                        <label className="text-xs font-bold text-orange-900 uppercase">
                          Motivo obligatorio de suspensión:
                        </label>
                        <textarea
                          rows={3}
                          value={suspensionReason}
                          onChange={(e) => setSuspensionReason(e.target.value)}
                          placeholder="Indica la razón de la suspensión (inconsistencia de documentos, solicitud médica, etc.)..."
                          className="drawer-suspend-textarea"
                        />
                        <div className="flex gap-2 mt-3">
                          <button
                            type="button"
                            disabled={actionProcessing}
                            onClick={() => handleToggleUserStatus(selectedUser, false)}
                            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex-1 transition-all"
                          >
                            Confirmar suspensión
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowSuspendInput(false);
                              setSuspensionReason('');
                            }}
                            className="px-3 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg text-xs font-semibold"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    <button
                      type="button"
                      disabled={actionProcessing}
                      onClick={() => handleToggleUserStatus(selectedUser, true)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-bold transition-all w-full flex items-center justify-center gap-2 shadow"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Reactivar cuenta</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </SideDrawer>
      </main>
    </div>
  );
}

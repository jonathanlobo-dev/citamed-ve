/**
 * AdminPanelPage.jsx - CITAMED.VE
 * M01 / Semana 7 - Panel de Superadministración: Resumen, Médicos, Usuarios y Configuración de IA
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
  ArrowUp,
  ArrowDown,
  Trash2,
  Plus,
  Play,
  RefreshCw,
  Power,
  Activity,
  Calendar,
  Lock,
  ExternalLink
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import adminService from '../../services/adminService';
import './AdminPanelPage.css';

const TEXT_PROVIDERS = ['gemini', 'groq', 'openai', 'anthropic', 'mock'];
const TRANSCRIPTION_PROVIDERS = ['groq', 'openai', 'mock'];

const DEFAULT_MODELS = {
  gemini: ['gemini-3.5-flash-lite', 'gemini-3.5-flash', 'gemini-flash-latest'],
  groq: ['openai/gpt-oss-120b', 'llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'],
  openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-4-turbo'],
  anthropic: ['claude-haiku-4-5-20251001', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307'],
  mock: ['echo', 'fail']
};

const DEFAULT_TRANSCRIPTION_MODELS = {
  groq: ['whisper-large-v3-turbo', 'whisper-large-v3', 'distil-whisper-large-v3-en'],
  openai: ['whisper-1'],
  mock: ['echo', 'fail']
};

// Adapta la respuesta de GET /api/admin/overview a los nombres que usa esta pantalla
function normalizeOverview(data) {
  const doctors = data.doctors || {};
  const verification = doctors.verification || {};
  const ai = data.ai || {};
  const aiMonth = ai.thisMonth || {};
  return {
    ...data,
    doctors: {
      ...doctors,
      total: (doctors.active || 0) + (doctors.suspended || 0),
      byVerification: {
        verified: verification.approved || 0,
        pending: (verification.pending || 0) + (verification.documents_incomplete || 0)
      }
    },
    ai: {
      ...ai,
      totalThisMonth: aiMonth.total || 0,
      successThisMonth: aiMonth.success || 0,
      failedThisMonth: aiMonth.failed || 0
    },
    topDoctorsAi: ai.topDoctors || []
  };
}

const VERIFICATION_LABELS = {
  unverified: 'Sin verificar',
  pending: 'Pendiente de revisión',
  approved: 'Verificado',
  rejected: 'Rechazado',
  documents_incomplete: 'Documentos incompletos'
};

function doctorTitle(gender) {
  const g = String(gender || '').toLowerCase();
  if (g === 'masculino' || g === 'male') return 'Dr.';
  if (g === 'femenino' || g === 'female') return 'Dra.';
  return 'Dr(a).';
}

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
        setOverview(normalizeOverview(data));
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
        const u = res.data || res;
        if (!u.name) {
          u.name = [u.firstName, u.lastName].filter(Boolean).join(' ') || 'Sin nombre';
        }
        setSelectedUser(u);
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
        // Recargar el detalle desde el servidor (estado, motivo y presencia en el directorio)
        handleOpenUserDetail(userToUpdate.id);
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

  // ==========================================
  // ESTADO: INTELIGENCIA ARTIFICIAL (IA)
  // ==========================================
  const [aiConfig, setAiConfig] = useState(null);
  const [aiUsageStats, setAiUsageStats] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSaving, setAiSaving] = useState(false);

  // Estados locales editables de IA
  const [textChain, setTextChain] = useState([]);
  const [transcriptionChain, setTranscriptionChain] = useState([]);
  const [aiLimits, setAiLimits] = useState({
    enabled: true,
    monthlyActionsPerDoctor: 200,
    perMinutePerUser: 10
  });
  const [aiEnvFlags, setAiEnvFlags] = useState({});

  // Modelos cargados dinámicamente por proveedor { gemini: [...], groq: [...] }
  const [providerModelsCache, setProviderModelsCache] = useState({});
  // Resultados temporales de pruebas de conexión por item id
  const [testResults, setTestResults] = useState({});
  const [testingId, setTestingId] = useState(null);

  const loadAiData = useCallback(async () => {
    setAiLoading(true);
    try {
      const [configRes, usageRes] = await Promise.all([
        adminService.getAiConfig(),
        adminService.getAiUsage({ days: 30 })
      ]);

      if (configRes.success) {
        setAiConfig(configRes);
        setTextChain(
          (configRes.providers || []).map((p) => ({
            ...p,
            apiKey: '', // La llave nunca se inicializa ni se muestra
            replacingKey: false
          }))
        );
        setTranscriptionChain(
          (configRes.transcription || []).map((t) => ({
            ...t,
            apiKey: '',
            replacingKey: false
          }))
        );
        setAiLimits({
          enabled: configRes.limits?.enabled ?? true,
          monthlyActionsPerDoctor: configRes.limits?.monthlyActionsPerDoctor ?? 200,
          perMinutePerUser: configRes.limits?.perMinutePerUser ?? 10
        });
        setAiEnvFlags(configRes.env || {});
      }

      if (usageRes.success) {
        setAiUsageStats(usageRes);
      }
    } catch (err) {
      console.error('Error al cargar datos de IA:', err);
      toast.error('No se pudo cargar la configuración de IA');
    } finally {
      setAiLoading(false);
    }
  }, []);

  // Fetch de modelos para un proveedor específico si no están en caché
  const fetchModelsForProvider = async (provider, entryId = null) => {
    if (!provider || providerModelsCache[provider]) return;
    try {
      const res = await adminService.getAiModels({ provider, entryId });
      if (res.success && Array.isArray(res.models)) {
        setProviderModelsCache((prev) => ({
          ...prev,
          [provider]: res.models
        }));
      }
    } catch {
      // Usar respaldo local si la llamada falla
      const fallback = DEFAULT_MODELS[provider] || DEFAULT_TRANSCRIPTION_MODELS[provider] || [];
      setProviderModelsCache((prev) => ({
        ...prev,
        [provider]: fallback
      }));
    }
  };

  // Reordenar elementos de la cadena
  const moveItem = (listType, index, direction) => {
    const list = listType === 'text' ? [...textChain] : [...transcriptionChain];
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= list.length) return;
    const temp = list[index];
    list[index] = list[targetIndex];
    list[targetIndex] = temp;

    if (listType === 'text') setTextChain(list);
    else setTranscriptionChain(list);
  };

  // Quitar elemento de la cadena
  const removeItem = (listType, index) => {
    if (listType === 'text') {
      setTextChain(textChain.filter((_, i) => i !== index));
    } else {
      setTranscriptionChain(transcriptionChain.filter((_, i) => i !== index));
    }
  };

  // Agregar nuevo item
  const addItem = (listType) => {
    const defaultProvider = listType === 'text' ? 'gemini' : 'groq';
    const defaultModel = listType === 'text' ? 'gemini-3.5-flash-lite' : 'whisper-large-v3-turbo';
    const newItem = {
      id: `new-${Date.now()}`,
      provider: defaultProvider,
      model: defaultModel,
      enabled: true,
      hasKey: false,
      keyPreview: null,
      apiKey: '',
      replacingKey: true
    };

    if (listType === 'text') {
      setTextChain([...textChain, newItem]);
    } else {
      setTranscriptionChain([...transcriptionChain, newItem]);
    }
    fetchModelsForProvider(defaultProvider);
  };

  // Probar conexión de un item
  const handleTestItem = async (kind, item) => {
    setTestingId(item.id);
    setTestResults((prev) => ({ ...prev, [item.id]: { loading: true } }));
    try {
      const res = await adminService.testAiConnection({
        kind,
        provider: item.provider,
        model: item.model,
        apiKey: item.apiKey ? item.apiKey.trim() : undefined,
        entryId: item.hasKey ? item.id : undefined
      });

      setTestResults((prev) => ({
        ...prev,
        [item.id]: {
          loading: false,
          ok: res.ok,
          latencyMs: res.latencyMs,
          message: res.message
        }
      }));

      if (res.ok) {
        toast.success(`Conexión exitosa (${res.latencyMs} ms)`);
      } else {
        toast.error(`Fallo: ${res.message}`);
      }
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [item.id]: {
          loading: false,
          ok: false,
          message: err.response?.data?.message || err.message
        }
      }));
      toast.error(err.response?.data?.message || 'Error probando la conexión');
    } finally {
      setTestingId(null);
    }
  };

  // Guardar configuración completa de IA
  const handleSaveAiConfig = async () => {
    // Validar que cada item tenga una llave (existente o nueva)
    for (const item of textChain) {
      if (item.provider !== 'mock' && !item.hasKey && (!item.apiKey || !item.apiKey.trim())) {
        toast.error(`El proveedor ${item.provider} (${item.model}) requiere una API Key.`);
        return;
      }
    }
    for (const item of transcriptionChain) {
      if (item.provider !== 'mock' && !item.hasKey && (!item.apiKey || !item.apiKey.trim())) {
        toast.error(`El transcriptor ${item.provider} (${item.model}) requiere una API Key.`);
        return;
      }
    }

    setAiSaving(true);
    try {
      const payload = {
        limits: {
          enabled: Boolean(aiLimits.enabled),
          monthlyActionsPerDoctor: Number(aiLimits.monthlyActionsPerDoctor) || 0,
          perMinutePerUser: Number(aiLimits.perMinutePerUser) || 10
        },
        providers: textChain.map((p) => ({
          ...(p.id && !p.id.startsWith('new-') ? { id: p.id } : {}),
          provider: p.provider,
          model: p.model.trim(),
          enabled: Boolean(p.enabled),
          ...(p.apiKey && p.apiKey.trim() ? { apiKey: p.apiKey.trim() } : {})
        })),
        transcription: transcriptionChain.map((t) => ({
          ...(t.id && !t.id.startsWith('new-') ? { id: t.id } : {}),
          provider: t.provider,
          model: t.model.trim(),
          enabled: Boolean(t.enabled),
          ...(t.apiKey && t.apiKey.trim() ? { apiKey: t.apiKey.trim() } : {})
        }))
      };

      const res = await adminService.updateAiConfig(payload);
      if (res.success) {
        toast.success('Configuración de IA guardada exitosamente');
        // Recargar datos desde el servidor para obtener los previews limpios
        await loadAiData();
      }
    } catch (err) {
      console.error('Error al guardar configuración de IA:', err);
      toast.error(err.response?.data?.message || 'Error al guardar configuración de IA');
    } finally {
      setAiSaving(false);
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
    } else if (activeTab === 'ai') {
      loadAiData();
    }
  }, [activeTab, loadOverview, loadDoctors, loadUsers, loadAiData]);

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
                Supervisión médica, control de usuarios y gestión de inteligencia artificial en CitaMed.
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
                                <div className="font-semibold text-gray-900">{doc.name}</div>
                                <div className="text-xs text-gray-500">ID Usuario: #{doc.doctorId}</div>
                              </td>
                              <td>{doc.specialty || '—'}</td>
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
                <option value="approved">Verificados</option>
                <option value="pending">Pendientes de revisión</option>
                <option value="documents_incomplete">Documentos incompletos</option>
                <option value="rejected">Rechazados</option>
                <option value="unverified">Sin expediente enviado</option>
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
                          <div className="font-semibold text-gray-900">{doc.name}</div>
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
                          {doc.verificationStatus === 'approved' && (
                            <span className="badge badge-success">
                              <CheckCircle2 className="w-3 h-3" /> Verificado
                            </span>
                          )}
                          {(doc.verificationStatus === 'pending' || doc.verificationStatus === 'documents_incomplete') && (
                            <span className="badge badge-warning">
                              <Clock className="w-3 h-3" /> Pendiente
                            </span>
                          )}
                          {doc.verificationStatus === 'rejected' && (
                            <span className="badge badge-danger">
                              <XCircle className="w-3 h-3" /> Rechazado
                            </span>
                          )}
                          {(!doc.verificationStatus || doc.verificationStatus === 'unverified') && (
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
          <div>
            {aiLoading ? (
              <div className="flex items-center justify-center p-12 text-gray-500">
                <RefreshCw className="w-6 h-6 animate-spin mr-3 text-primary" />
                <span>Cargando configuración de IA...</span>
              </div>
            ) : aiConfig ? (
              <>
                {/* 1. LÍMITES Y VARIABLES DE ENTORNO */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <h2 className="admin-card-title">
                      <Power className="w-5 h-5 text-primary" />
                      <span>Parámetros Generales de Inteligencia Artificial</span>
                    </h2>
                  </div>

                  <div className="ai-config-grid">
                    {/* Control de Límites */}
                    <div className="ai-limits-box">
                      <div className="ai-limit-row">
                        <label htmlFor="ai-toggle-active" className="text-sm font-semibold text-gray-700">
                          Servicio de IA activo en CitaMed
                        </label>
                        <input
                          id="ai-toggle-active"
                          type="checkbox"
                          checked={aiLimits.enabled}
                          onChange={(e) =>
                            setAiLimits((prev) => ({ ...prev, enabled: e.target.checked }))
                          }
                          className="w-5 h-5 accent-primary cursor-pointer"
                        />
                      </div>

                      <div className="ai-limit-row">
                        <div>
                          <div className="text-sm font-semibold text-gray-700">
                            Acciones por médico al mes
                          </div>
                          <div className="text-xs text-gray-500">
                            Límite mensual acumulado por profesional
                          </div>
                        </div>
                        <input
                          type="number"
                          min="0"
                          max="100000"
                          value={aiLimits.monthlyActionsPerDoctor}
                          onChange={(e) =>
                            setAiLimits((prev) => ({
                              ...prev,
                              monthlyActionsPerDoctor: parseInt(e.target.value, 10) || 0
                            }))
                          }
                          className="ai-input"
                          style={{ width: '110px', textAlign: 'right' }}
                        />
                      </div>

                      <div className="ai-limit-row">
                        <div>
                          <div className="text-sm font-semibold text-gray-700">
                            Máximo de peticiones por minuto
                          </div>
                          <div className="text-xs text-gray-500">
                            Control anti-ráfagas por usuario
                          </div>
                        </div>
                        <input
                          type="number"
                          min="1"
                          max="60"
                          value={aiLimits.perMinutePerUser}
                          onChange={(e) =>
                            setAiLimits((prev) => ({
                              ...prev,
                              perMinutePerUser: parseInt(e.target.value, 10) || 1
                            }))
                          }
                          className="ai-input"
                          style={{ width: '110px', textAlign: 'right' }}
                        />
                      </div>
                    </div>

                    {/* Respaldos por Variables del Servidor */}
                    <div className="ai-limits-box">
                      <div className="text-sm font-semibold text-gray-700 mb-1">
                        Respaldos por variables de entorno (.env)
                      </div>
                      <p className="text-xs text-gray-500 mb-3">
                        Si un proveedor falla en la cadena, el sistema salta a los respaldos configurados en el servidor:
                      </p>

                      <div className="ai-env-badges-wrap">
                        <div className="ai-env-pill">
                          <span>Gemini:</span>
                          {aiEnvFlags.gemini ? (
                            <span className="badge badge-success">Configurado</span>
                          ) : (
                            <span className="badge badge-neutral">No configurado</span>
                          )}
                        </div>
                        <div className="ai-env-pill">
                          <span>Groq:</span>
                          {aiEnvFlags.groq ? (
                            <span className="badge badge-success">Configurado</span>
                          ) : (
                            <span className="badge badge-neutral">No configurado</span>
                          )}
                        </div>
                        <div className="ai-env-pill">
                          <span>OpenAI:</span>
                          {aiEnvFlags.openai ? (
                            <span className="badge badge-success">Configurado</span>
                          ) : (
                            <span className="badge badge-neutral">No configurado</span>
                          )}
                        </div>
                        <div className="ai-env-pill">
                          <span>Anthropic:</span>
                          {aiEnvFlags.anthropic ? (
                            <span className="badge badge-success">Configurado</span>
                          ) : (
                            <span className="badge badge-neutral">No configurado</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. CADENA DE PROVEEDORES DE TEXTO (SOAP, RX, MEJORA) */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h2 className="admin-card-title">
                        <Bot className="w-5 h-5 text-primary" />
                        <span>Cadena de Proveedores de Texto (SOAP, Récipe y Redacción)</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        El sistema intentará ejecutar las solicitudes en el orden configurado (prioridad descendente).
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem('text')}
                      className="admin-quick-link text-primary font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Agregar proveedor
                    </button>
                  </div>

                  {textChain.map((item, index) => {
                    const testState = testResults[item.id];
                    const availableModels =
                      providerModelsCache[item.provider] ||
                      DEFAULT_MODELS[item.provider] ||
                      [];

                    return (
                      <div key={item.id || index} className="ai-chain-item">
                        <div className="ai-chain-header">
                          <div className="ai-chain-title-wrap">
                            <span className="ai-chain-num">#{index + 1}</span>
                            <span className="font-bold text-gray-900 capitalize">
                              {item.provider}
                            </span>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 ml-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => {
                                  const updated = [...textChain];
                                  updated[index].enabled = e.target.checked;
                                  setTextChain(updated);
                                }}
                                className="w-4 h-4 accent-primary"
                              />
                              Habilitado
                            </label>
                          </div>

                          <div className="ai-chain-actions">
                            <button
                              type="button"
                              title="Subir prioridad"
                              disabled={index === 0}
                              onClick={() => moveItem('text', index, -1)}
                              className="ai-btn-icon"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Bajar prioridad"
                              disabled={index === textChain.length - 1}
                              onClick={() => moveItem('text', index, 1)}
                              className="ai-btn-icon"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Quitar proveedor"
                              onClick={() => removeItem('text', index)}
                              className="ai-btn-icon ai-btn-danger"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={testingId === item.id}
                              onClick={() => handleTestItem('text', item)}
                              className="admin-btn-page text-xs ml-2"
                            >
                              {testingId === item.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-primary" />
                              )}
                              Probar conexión
                            </button>
                          </div>
                        </div>

                        {/* Campos del item */}
                        <div className="ai-chain-fields">
                          {/* Proveedor */}
                          <div className="ai-field-group">
                            <label className="ai-field-label">Proveedor</label>
                            <select
                              value={item.provider}
                              onChange={(e) => {
                                const newProv = e.target.value;
                                const updated = [...textChain];
                                updated[index].provider = newProv;
                                updated[index].model =
                                  (DEFAULT_MODELS[newProv] && DEFAULT_MODELS[newProv][0]) || 'default';
                                setTextChain(updated);
                                fetchModelsForProvider(newProv);
                              }}
                              className="ai-input"
                            >
                              {TEXT_PROVIDERS.map((tp) => (
                                <option key={tp} value={tp}>
                                  {tp.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Modelo */}
                          <div className="ai-field-group">
                            <label className="ai-field-label">Modelo</label>
                            <div className="flex gap-2">
                              <select
                                value={item.model}
                                onChange={(e) => {
                                  const updated = [...textChain];
                                  updated[index].model = e.target.value;
                                  setTextChain(updated);
                                }}
                                className="ai-input"
                              >
                                {availableModels.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                                {!availableModels.includes(item.model) && (
                                  <option value={item.model}>{item.model} (personalizado)</option>
                                )}
                              </select>
                              <input
                                type="text"
                                placeholder="Escribir modelo..."
                                value={item.model}
                                onChange={(e) => {
                                  const updated = [...textChain];
                                  updated[index].model = e.target.value;
                                  setTextChain(updated);
                                }}
                                className="ai-input"
                                style={{ maxWidth: '180px' }}
                              />
                            </div>
                          </div>

                          {/* Llave API */}
                          <div className="ai-field-group">
                            <label className="ai-field-label">API Key</label>
                            {item.hasKey && !item.replacingKey ? (
                              <div className="ai-key-saved-box">
                                <span className="font-mono text-xs flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                  Guardada {item.keyPreview}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...textChain];
                                    updated[index].replacingKey = true;
                                    setTextChain(updated);
                                  }}
                                  className="text-xs text-primary font-semibold hover:underline"
                                >
                                  Reemplazar
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <input
                                  type="password"
                                  value={item.apiKey || ''}
                                  onChange={(e) => {
                                    const updated = [...textChain];
                                    updated[index].apiKey = e.target.value;
                                    setTextChain(updated);
                                  }}
                                  placeholder={item.hasKey ? 'Pega nueva clave...' : 'Pega tu API Key...'}
                                  className="ai-input"
                                  autoComplete="new-password"
                                />
                                {item.hasKey && item.replacingKey && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...textChain];
                                      updated[index].replacingKey = false;
                                      updated[index].apiKey = '';
                                      setTextChain(updated);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 hover:text-gray-700"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Resultado de prueba de conexión */}
                        {testState && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            {testState.loading ? (
                              <span className="ai-test-badge bg-blue-50 text-blue-700">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Verificando conectividad...
                              </span>
                            ) : testState.ok ? (
                              <span className="ai-test-badge bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK — Latencia: {testState.latencyMs} ms
                              </span>
                            ) : (
                              <span className="ai-test-badge bg-rose-50 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5" /> Error: {testState.message}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* 3. CADENA DE TRANSCRIPCIÓN DE AUDIO (WHISPER) */}
                <div className="admin-card">
                  <div className="admin-card-header">
                    <div>
                      <h2 className="admin-card-title">
                        <Bot className="w-5 h-5 text-primary" />
                        <span>Cadena de Transcripción de Audio (Whisper)</span>
                      </h2>
                      <p className="text-xs text-gray-500 mt-1">
                        Utilizada para convertir dictados de voz y notas médicas en texto dentro del Espacio Clínico.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => addItem('transcription')}
                      className="admin-quick-link text-primary font-semibold"
                    >
                      <Plus className="w-4 h-4" /> Agregar transcriptor
                    </button>
                  </div>

                  {transcriptionChain.map((item, index) => {
                    const testState = testResults[item.id];
                    const availableModels =
                      DEFAULT_TRANSCRIPTION_MODELS[item.provider] || [];

                    return (
                      <div key={item.id || index} className="ai-chain-item">
                        <div className="ai-chain-header">
                          <div className="ai-chain-title-wrap">
                            <span className="ai-chain-num">#{index + 1}</span>
                            <span className="font-bold text-gray-900 capitalize">
                              {item.provider}
                            </span>
                            <label className="flex items-center gap-2 text-xs font-semibold text-gray-600 ml-3 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={item.enabled}
                                onChange={(e) => {
                                  const updated = [...transcriptionChain];
                                  updated[index].enabled = e.target.checked;
                                  setTranscriptionChain(updated);
                                }}
                                className="w-4 h-4 accent-primary"
                              />
                              Habilitado
                            </label>
                          </div>

                          <div className="ai-chain-actions">
                            <button
                              type="button"
                              title="Subir prioridad"
                              disabled={index === 0}
                              onClick={() => moveItem('transcription', index, -1)}
                              className="ai-btn-icon"
                            >
                              <ArrowUp className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Bajar prioridad"
                              disabled={index === transcriptionChain.length - 1}
                              onClick={() => moveItem('transcription', index, 1)}
                              className="ai-btn-icon"
                            >
                              <ArrowDown className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              title="Quitar transcriptor"
                              onClick={() => removeItem('transcription', index)}
                              className="ai-btn-icon ai-btn-danger"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              disabled={testingId === item.id}
                              onClick={() => handleTestItem('transcription', item)}
                              className="admin-btn-page text-xs ml-2"
                            >
                              {testingId === item.id ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Play className="w-3.5 h-3.5 text-primary" />
                              )}
                              Probar conexión
                            </button>
                          </div>
                        </div>

                        {/* Campos del item */}
                        <div className="ai-chain-fields">
                          <div className="ai-field-group">
                            <label className="ai-field-label">Proveedor</label>
                            <select
                              value={item.provider}
                              onChange={(e) => {
                                const newProv = e.target.value;
                                const updated = [...transcriptionChain];
                                updated[index].provider = newProv;
                                updated[index].model =
                                  (DEFAULT_TRANSCRIPTION_MODELS[newProv] &&
                                    DEFAULT_TRANSCRIPTION_MODELS[newProv][0]) ||
                                  'whisper-large-v3-turbo';
                                setTranscriptionChain(updated);
                              }}
                              className="ai-input"
                            >
                              {TRANSCRIPTION_PROVIDERS.map((tp) => (
                                <option key={tp} value={tp}>
                                  {tp.toUpperCase()}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div className="ai-field-group">
                            <label className="ai-field-label">Modelo</label>
                            <div className="flex gap-2">
                              <select
                                value={item.model}
                                onChange={(e) => {
                                  const updated = [...transcriptionChain];
                                  updated[index].model = e.target.value;
                                  setTranscriptionChain(updated);
                                }}
                                className="ai-input"
                              >
                                {availableModels.map((m) => (
                                  <option key={m} value={m}>
                                    {m}
                                  </option>
                                ))}
                                {!availableModels.includes(item.model) && (
                                  <option value={item.model}>{item.model} (personalizado)</option>
                                )}
                              </select>
                              <input
                                type="text"
                                placeholder="Escribir modelo..."
                                value={item.model}
                                onChange={(e) => {
                                  const updated = [...transcriptionChain];
                                  updated[index].model = e.target.value;
                                  setTranscriptionChain(updated);
                                }}
                                className="ai-input"
                                style={{ maxWidth: '180px' }}
                              />
                            </div>
                          </div>

                          <div className="ai-field-group">
                            <label className="ai-field-label">API Key</label>
                            {item.hasKey && !item.replacingKey ? (
                              <div className="ai-key-saved-box">
                                <span className="font-mono text-xs flex items-center gap-1.5">
                                  <Lock className="w-3.5 h-3.5 text-emerald-600" />
                                  Guardada {item.keyPreview}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = [...transcriptionChain];
                                    updated[index].replacingKey = true;
                                    setTranscriptionChain(updated);
                                  }}
                                  className="text-xs text-primary font-semibold hover:underline"
                                >
                                  Reemplazar
                                </button>
                              </div>
                            ) : (
                              <div className="relative">
                                <input
                                  type="password"
                                  value={item.apiKey || ''}
                                  onChange={(e) => {
                                    const updated = [...transcriptionChain];
                                    updated[index].apiKey = e.target.value;
                                    setTranscriptionChain(updated);
                                  }}
                                  placeholder={item.hasKey ? 'Pega nueva clave...' : 'Pega tu API Key...'}
                                  className="ai-input"
                                  autoComplete="new-password"
                                />
                                {item.hasKey && item.replacingKey && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = [...transcriptionChain];
                                      updated[index].replacingKey = false;
                                      updated[index].apiKey = '';
                                      setTranscriptionChain(updated);
                                    }}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] text-gray-500 hover:text-gray-700"
                                  >
                                    Cancelar
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {testState && (
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                            {testState.loading ? (
                              <span className="ai-test-badge bg-blue-50 text-blue-700">
                                <RefreshCw className="w-3 h-3 animate-spin" /> Verificando conectividad...
                              </span>
                            ) : testState.ok ? (
                              <span className="ai-test-badge bg-emerald-50 text-emerald-700">
                                <CheckCircle2 className="w-3.5 h-3.5" /> OK — Latencia: {testState.latencyMs} ms
                              </span>
                            ) : (
                              <span className="ai-test-badge bg-rose-50 text-rose-700">
                                <AlertTriangle className="w-3.5 h-3.5" /> Error: {testState.message}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* BOTÓN GUARDAR CONFIGURACIÓN */}
                <div className="flex justify-end mb-8">
                  <button
                    type="button"
                    disabled={aiSaving}
                    onClick={handleSaveAiConfig}
                    className="px-6 py-3 bg-primary text-white font-bold rounded-xl shadow-lg hover:bg-primary-dark transition-all flex items-center gap-2"
                  >
                    {aiSaving && <RefreshCw className="w-4 h-4 animate-spin" />}
                    <span>Guardar configuración de IA</span>
                  </button>
                </div>

                {/* 4. MÉTRICAS DE USO DE LOS ÚLTIMOS 30 DÍAS */}
                {aiUsageStats && (
                  <div className="admin-card">
                    <div className="admin-card-header">
                      <h2 className="admin-card-title">
                        <Activity className="w-5 h-5 text-purple-600" />
                        <span>Métricas de Consumo de IA (Últimos 30 Días)</span>
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                      {/* Por Proveedor */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Consumo por Proveedor</h3>
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Proveedor</th>
                                <th style={{ textAlign: 'center' }}>Exitosas</th>
                                <th style={{ textAlign: 'center' }}>Fallidas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiUsageStats.byProvider && aiUsageStats.byProvider.length > 0 ? (
                                aiUsageStats.byProvider.map((p, i) => (
                                  <tr key={i}>
                                    <td className="font-semibold uppercase">{p.provider || 'Sin asignar'}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className="badge badge-success">{p.success}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className="badge badge-danger">{p.failed}</span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="text-center py-4 text-gray-500 text-xs">
                                    Sin registros por proveedor
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Por Modo */}
                      <div>
                        <h3 className="text-sm font-bold text-gray-700 mb-2">Consumo por Modalidad Clínica</h3>
                        <div className="admin-table-container">
                          <table className="admin-table">
                            <thead>
                              <tr>
                                <th>Modo</th>
                                <th style={{ textAlign: 'center' }}>Exitosas</th>
                                <th style={{ textAlign: 'center' }}>Fallidas</th>
                              </tr>
                            </thead>
                            <tbody>
                              {aiUsageStats.byMode && aiUsageStats.byMode.length > 0 ? (
                                aiUsageStats.byMode.map((m, i) => (
                                  <tr key={i}>
                                    <td className="font-semibold uppercase text-xs">{m.mode}</td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className="badge badge-success">{m.success}</span>
                                    </td>
                                    <td style={{ textAlign: 'center' }}>
                                      <span className="badge badge-danger">{m.failed}</span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="3" className="text-center py-4 text-gray-500 text-xs">
                                    Sin registros por modo
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Consumo por Día */}
                    <div>
                      <h3 className="text-sm font-bold text-gray-700 mb-2">Registro Diario (Últimos 30 Días)</h3>
                      <div className="admin-table-container" style={{ maxHeight: '280px', overflowY: 'auto' }}>
                        <table className="admin-table">
                          <thead>
                            <tr>
                              <th>Fecha</th>
                              <th style={{ textAlign: 'center' }}>Solicitudes Exitosas</th>
                              <th style={{ textAlign: 'center' }}>Solicitudes Fallidas</th>
                            </tr>
                          </thead>
                          <tbody>
                            {aiUsageStats.byDay && aiUsageStats.byDay.length > 0 ? (
                              aiUsageStats.byDay.map((d, i) => (
                                <tr key={i}>
                                  <td className="text-xs font-mono">{d.date}</td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="badge badge-success">{d.success}</span>
                                  </td>
                                  <td style={{ textAlign: 'center' }}>
                                    <span className="badge badge-danger">{d.failed}</span>
                                  </td>
                                </tr>
                              ))
                            ) : (
                              <tr>
                                <td colSpan="3" className="text-center py-4 text-gray-500 text-xs">
                                  Sin actividad registrada en los últimos 30 días
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : null}
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
                    {selectedUser.role === 'doctor' ? `${doctorTitle(selectedUser.gender)} ${selectedUser.name}` : selectedUser.name}
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
                    <strong>Motivo registrado:</strong> {selectedUser.suspensionReason || selectedUser.suspendedReason || 'No especificado'}
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
                      <div className="drawer-info-val">
                        {VERIFICATION_LABELS[selectedUser.DoctorProfile.verificationStatus] || 'Sin verificar'}
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

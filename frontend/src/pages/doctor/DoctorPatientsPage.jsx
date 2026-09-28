import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Calendar,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  User,
  AlertCircle,
  RefreshCw,
  FileText
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import clinicalRecordService from '../../services/clinicalRecordService';
import './DoctorPatientsPage.css';

export default function DoctorPatientsPage() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 15,
    totalPages: 1
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const debounceTimerRef = useRef(null);

  // Debounce de 300 ms al escribir en el buscador
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((prev) => ({ ...prev, page: 1 }));
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // Carga de pacientes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    clinicalRecordService
      .getDoctorPatients({
        search: debouncedSearch,
        page: pagination.page,
        limit: pagination.limit
      })
      .then((res) => {
        if (!isMounted) return;
        if (res.success && res.data) {
          setPatients(res.data.patients || []);
          setPagination((prev) => ({
            ...prev,
            total: res.data.pagination?.total || 0,
            page: res.data.pagination?.page || 1,
            totalPages: res.data.pagination?.totalPages || 1
          }));
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error al cargar pacientes del médico:', err);
        setError(
          err.response?.data?.message || 'Error al conectar con el servidor para consultar pacientes.'
        );
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearch, pagination.page, pagination.limit]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setPagination((prev) => ({ ...prev, page: newPage }));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="doctor-patients-page">
      <Navbar />

      <main className="doctor-patients-container">
        {/* Encabezado */}
        <header className="doctor-patients-header">
          <div className="doctor-patients-header-info">
            <div className="doctor-patients-title-row flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
              <div className="flex items-center gap-3">
                <div className="doctor-patients-icon-wrap">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h1 className="doctor-patients-title">Mis Pacientes</h1>
                  <p className="doctor-patients-subtitle">
                    Directorio de pacientes con consultas o citas programadas contigo en CitaMed
                  </p>
                </div>
              </div>
              <Link
                to="/medico/consulta/nueva"
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary text-white font-semibold text-sm rounded-lg hover:bg-primary/90 transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                Nueva consulta
              </Link>
            </div>
          </div>

          {/* Buscador */}
          <div className="doctor-patients-search-bar">
            <div className="doctor-patients-search-input-wrap">
              <Search className="doctor-patients-search-icon" />
              <input
                type="text"
                className="doctor-patients-search-input"
                placeholder="Buscar por nombre, apellido o cédula..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Buscar pacientes"
              />
              {search && (
                <button
                  type="button"
                  className="doctor-patients-search-clear"
                  onClick={() => setSearch('')}
                  aria-label="Limpiar búsqueda"
                >
                  &times;
                </button>
              )}
            </div>
            {!loading && (
              <span className="doctor-patients-count-badge">
                {pagination.total} {pagination.total === 1 ? 'paciente' : 'pacientes'}
              </span>
            )}
          </div>
        </header>

        {/* Mensaje de error */}
        {error && (
          <div className="doctor-patients-error">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p>{error}</p>
            <button
              type="button"
              className="doctor-patients-retry-btn"
              onClick={() => setPagination((prev) => ({ ...prev }))}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Reintentar
            </button>
          </div>
        )}

        {/* Estado cargando */}
        {loading && (
          <div className="doctor-patients-loading">
            <div className="doctor-patients-spinner"></div>
            <p>Cargando lista de pacientes...</p>
          </div>
        )}

        {/* Lista de pacientes */}
        {!loading && !error && patients.length > 0 && (
          <>
            <div className="doctor-patients-list">
              {patients.map((patient) => {
                const initials = `${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() || 'P';

                return (
                  <div
                    key={patient.id}
                    className="doctor-patient-card"
                    onClick={() => navigate(`/medico/pacientes/${patient.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/medico/pacientes/${patient.id}`);
                      }
                    }}
                  >
                    <div className="doctor-patient-avatar">{initials}</div>

                    <div className="doctor-patient-main">
                      <div className="doctor-patient-primary">
                        <h2 className="doctor-patient-name">{patient.fullName}</h2>
                        <div className="doctor-patient-meta">
                          <span className="doctor-patient-id-badge">
                            C.I. {patient.identificationNumber || 'No registrada'}
                          </span>
                          <span className="doctor-patient-age">
                            {patient.age || 'Edad no reg.'}
                          </span>
                          {patient.bloodType && (
                            <span className="doctor-patient-blood">
                              GS: {patient.bloodType}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="doctor-patient-history-grid">
                        <div className="doctor-patient-history-item">
                          <span className="doctor-patient-history-label">
                            <FileText className="w-3.5 h-3.5 mr-1 text-slate-400" />
                            Última consulta:
                          </span>
                          <span className="doctor-patient-history-val">
                            {patient.lastConsultation ? (
                              <>
                                <strong>{formatDate(patient.lastConsultation.date)}</strong>
                                {patient.lastConsultation.diagnosis && (
                                  <span className="doctor-patient-diag">
                                    {' '}
                                    · {patient.lastConsultation.diagnosis}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className="text-slate-400 italic">Sin consultas previas</span>
                            )}
                          </span>
                        </div>

                        <div className="doctor-patient-history-item">
                          <span className="doctor-patient-history-label">
                            <Calendar className="w-3.5 h-3.5 mr-1 text-teal-600" />
                            Próxima cita:
                          </span>
                          <span className="doctor-patient-history-val">
                            {patient.nextAppointment ? (
                              <span className="text-teal-700 font-medium">
                                {formatDate(patient.nextAppointment.date)} a las{' '}
                                {patient.nextAppointment.time?.slice(0, 5)}
                              </span>
                            ) : (
                              <span className="text-slate-400">No programada</span>
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="doctor-patient-action">
                      <button
                        type="button"
                        className="doctor-patient-view-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/medico/pacientes/${patient.id}`);
                        }}
                      >
                        <span>Ver ficha</span>
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Paginación */}
            {pagination.totalPages > 1 && (
              <div className="doctor-patients-pagination">
                <button
                  type="button"
                  className="doctor-patients-page-btn"
                  disabled={pagination.page <= 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
                </button>
                <span className="doctor-patients-page-indicator">
                  Página {pagination.page} de {pagination.totalPages}
                </span>
                <button
                  type="button"
                  className="doctor-patients-page-btn"
                  disabled={pagination.page >= pagination.totalPages}
                  onClick={() => handlePageChange(pagination.page + 1)}
                  aria-label="Página siguiente"
                >
                  Siguiente <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}

        {/* Estado vacío por búsqueda */}
        {!loading && !error && patients.length === 0 && debouncedSearch && (
          <div className="doctor-patients-empty">
            <User className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">
              No se encontraron pacientes
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-4">
              No hay ningún paciente atendido que coincida con "{debouncedSearch}".
            </p>
            <button
              type="button"
              className="doctor-patients-clear-search-btn"
              onClick={() => setSearch('')}
            >
              Borrar filtro
            </button>
          </div>
        )}

        {/* Estado vacío sin pacientes */}
        {!loading && !error && patients.length === 0 && !debouncedSearch && (
          <div className="doctor-patients-empty">
            <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Users className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">
              Aún no has atendido pacientes
            </h3>
            <p className="text-slate-500 text-sm max-w-md mx-auto mb-6">
              Cuando atiendas tus primeras consultas en la Sala de Espera o completes citas en tu
              Agenda, los pacientes aparecerán aquí con su historial y expediente clínico.
            </p>
            <div className="flex gap-3 justify-center">
              <button
                type="button"
                className="doctor-patients-btn-primary"
                onClick={() => navigate('/medico/sala-espera')}
              >
                <Clock className="w-4 h-4 mr-2" />
                Ir a la Sala de Espera
              </button>
              <button
                type="button"
                className="doctor-patients-btn-secondary"
                onClick={() => navigate('/medico/agenda')}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Ver mi Agenda
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

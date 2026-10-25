import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './hooks/usePermissions';
import ProtectedRoute from './components/ProtectedRoute';

import { FEATURES } from './config/features';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';

// Lazy-loaded pages (F1)
const DashboardPaciente = lazy(() => import('./pages/DashboardPaciente'));
const DashboardMedico = lazy(() => import('./pages/DashboardMedico'));
const DashboardProveedor = lazy(() => import('./pages/DashboardProveedor'));
const DirectorioMedicoPage = lazy(() => import('./pages/DirectorioMedicoPage'));
const ClinicasPage = lazy(() => import('./pages/ClinicasPage'));
const SegurosPage = lazy(() => import('./pages/SegurosPage'));
const AgendamientoPage = lazy(() => import('./pages/modules/AgendamientoPage'));
const TelemedicinaPage = lazy(() => import('./pages/modules/TelemedicinaPage'));
const MarketMedPage = lazy(() => import('./pages/modules/MarketMedPage'));
const CitamedPagaPage = lazy(() => import('./pages/modules/CitamedPagaPage'));
const EmailVerificationPage = lazy(() => import('./pages/verification/EmailVerificationPage'));
const PhoneVerificationPage = lazy(() => import('./pages/verification/PhoneVerificationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'));
const SessionsPage = lazy(() => import('./pages/settings/SessionsPage'));
const AuditLogsPage = lazy(() => import('./components/audit/AuditLogsPage'));
const AuditStatsPage = lazy(() => import('./components/audit/AuditStatsPage'));
const DoctorProfilePage = lazy(() => import('./pages/doctor/DoctorProfilePage'));
const DoctorProfileEditPage = lazy(() => import('./pages/doctor/DoctorProfileEditPage'));
const PatientProfilePage = lazy(() => import('./pages/patient/PatientProfilePage'));
const PatientProfileEditPage = lazy(() => import('./pages/patient/PatientProfileEditPage'));
const DocumentUploadPage = lazy(() => import('./pages/doctor/verification/DocumentUploadPage'));
const VerificationQueuePage = lazy(() => import('./pages/admin/verification/VerificationQueuePage'));
const DoctorReputationPage = lazy(() => import('./pages/doctor/DoctorReputationPage'));
const DoctorAgendaPage = lazy(() => import('./pages/doctor/DoctorAgendaPage'));
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const ProviderProfilePage = lazy(() => import('./pages/provider/ProviderProfilePage'));
const ClinicProfilePage = lazy(() => import('./pages/clinics/ClinicProfilePage'));
const PatientWaitingRoomPage = lazy(() => import('./pages/waitingRoom/PatientWaitingRoomPage'));
const DoctorWaitingRoomPage = lazy(() => import('./pages/waitingRoom/DoctorWaitingRoomPage'));
const SalaEsperaPage = lazy(() => import('./pages/waitingRoom/SalaEsperaPage'));
const MisCitasPage = lazy(() => import('./pages/appointments/MisCitasPage'));
const AgendarCitaPage = lazy(() => import('./pages/appointments/AgendarCitaPage'));
const DoctorPatientsPage = lazy(() => import('./pages/doctor/DoctorPatientsPage'));
const PatientRecordPage = lazy(() => import('./pages/doctor/PatientRecordPage'));
const PatientMyRecordPage = lazy(() => import('./pages/patient/PatientMyRecordPage'));
const EspacioClinicoPage = lazy(() => import('./pages/doctor/EspacioClinicoPage'));
const CobrosPage = lazy(() => import('./pages/doctor/CobrosPage'));
const VerificarDocumentoPage = lazy(() => import('./pages/public/VerificarDocumentoPage'));
const AdminPanelPage = lazy(() => import('./pages/admin/AdminPanelPage'));
const DoctorAssistantsPage = lazy(() => import('./pages/doctor/DoctorAssistantsPage'));
const AssistantPortalPage = lazy(() => import('./pages/assistant/AssistantPortalPage'));
const DoctorPublicSlugPage = lazy(() => import('./pages/public/DoctorPublicSlugPage'));
const CitaConfirmacionPage = lazy(() => import('./pages/public/CitaConfirmacionPage'));
const ActivarAsistentePage = lazy(() => import('./pages/assistant/ActivarAsistentePage'));

function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
function VerificarRecipeRedirect() {
  const { code } = useParams();
  return <Navigate to={`/verificar/${code}`} replace />;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route path="/verificar/email" element={<EmailVerificationPage />} />
      <Route path="/verificar/telefono" element={<PhoneVerificationPage />} />
      <Route path="/directorio" element={<DirectorioMedicoPage />} />
      <Route path="/buscar" element={<SearchPage />} />
      <Route path="/clinicas" element={<ClinicasPage />} />
      <Route path="/clinicas/:clinicId" element={<ClinicProfilePage />} />
      <Route path="/seguros" element={<SegurosPage />} />
      <Route path="/verificar-recipe/:code" element={<VerificarRecipeRedirect />} />
      <Route
        path="/verificar/:code"
        element={
          <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
            <VerificarDocumentoPage />
          </Suspense>
        }
      />
      <Route
        path="/dr/:slug"
        element={
          FEATURES.publicPage ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <DoctorPublicSlugPage />
            </Suspense>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/activar-asistente/:token"
        element={FEATURES.assistant ? <ActivarAsistentePage /> : <Navigate to="/" replace />}
      />
      <Route
        path="/cita/:token"
        element={
          FEATURES.waConfirm ? (
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <CitaConfirmacionPage />
            </Suspense>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Module Routes */}
      <Route path="/modulo/agendamiento" element={<AgendamientoPage />} />
      <Route path="/modulo/telemedicina" element={<TelemedicinaPage />} />
      <Route path="/modulo/marketmed" element={<MarketMedPage />} />
      <Route path="/modulo/citamed-paga" element={<CitamedPagaPage />} />

      {/* Doctor Profile Routes */}
      <Route path="/doctor/:doctorId" element={<DoctorProfilePage />} />
      <Route
        path="/medico/perfil/editar"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorProfileEditPage />
          </ProtectedRoute>
        }
      />

      {/* Doctor KYC Verification - M02 Sub-Partida 3.3 */}
      <Route
        path="/medico/verificacion"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DocumentUploadPage />
          </ProtectedRoute>
        }
      />

      {/* Doctor Reputation - M02 Sub-Partida 3.4 */}
      <Route
        path="/medico/reputacion"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DoctorReputationPage />
          </ProtectedRoute>
        }
      />

      {/* Doctor Module Routes (Coming Soon) */}
      <Route
        path="/medico/estado-actual"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/sala-espera"
        element={
          <ProtectedRoute allowedRoles={['doctor', 'assistant']}>
            <DoctorWaitingRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/consulta/nueva"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <EspacioClinicoPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/consulta/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <EspacioClinicoPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/agenda"
        element={
          <ProtectedRoute allowedRoles={['doctor', 'assistant']}>
            <DoctorAgendaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/pacientes"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <DoctorPatientsPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/pacientes/:patientId"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <PatientRecordPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/fidelizacion"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/historias-clinicas"
        element={<Navigate to="/medico/pacientes" replace />}
      />
      <Route
        path="/medico/estadisticas"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/cobros"
        element={
          <ProtectedRoute allowedRoles={['doctor', 'assistant']}>
            <CobrosPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/asistentes"
        element={
          FEATURES.assistant ? (
            <ProtectedRoute allowedRoles={['doctor']}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                <DoctorAssistantsPage />
              </Suspense>
            </ProtectedRoute>
          ) : (
            <Navigate to="/medico/dashboard" replace />
          )
        }
      />
      <Route
        path="/asistente"
        element={
          FEATURES.assistant ? (
            <ProtectedRoute allowedRoles={['assistant']}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                <AssistantPortalPage />
              </Suspense>
            </ProtectedRoute>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      <Route
        path="/medico/facturacion"
        element={<Navigate to="/medico/cobros" replace />}
      />
      <Route
        path="/medico/mensajeria"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/reportes"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/configuracion"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      {/* Redirect /medico to dashboard */}
      <Route path="/medico" element={<Navigate to="/medico/dashboard" replace />} />

      {/* Agendar cita con doctor - M03 */}
      <Route
        path="/agendar/:doctorId"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <AgendarCitaPage />
          </ProtectedRoute>
        }
      />

      {/* Patient Profile Routes - M02 Sub-Partida 3.2 */}
      <Route
        path="/perfil-paciente"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/perfil"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/mi-historia"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
              <PatientMyRecordPage />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/historia-clinica"
        element={<Navigate to="/paciente/mi-historia" replace />}
      />
      <Route
        path="/perfil-paciente/editar"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfileEditPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/perfil/editar"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientProfileEditPage />
          </ProtectedRoute>
        }
      />
      {/* Sala de Espera Virtual - M03 */}
      <Route
        path="/paciente/sala-espera"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <SalaEsperaPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/sala-espera/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientWaitingRoomPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/paciente/sala-espera/:appointmentId"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <PatientWaitingRoomPage />
          </ProtectedRoute>
        }
      />
      {/* Mis Citas - M03 */}
      <Route
        path="/paciente/mis-citas"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <MisCitasPage />
          </ProtectedRoute>
        }
      />
      {/* Redirect /paciente to dashboard */}
      <Route path="/paciente" element={<Navigate to="/dashboard" replace />} />

      {/* Dashboard Routes - Separated by Role */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={['patient']}>
            <DashboardPaciente />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/dashboard"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <DashboardMedico />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/dashboard"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <DashboardProveedor />
          </ProtectedRoute>
        }
      />

      {/* Provider Profile Routes - Mi Empresa */}
      <Route
        path="/proveedor/mi-empresa"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/perfil"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ProviderProfilePage />
          </ProtectedRoute>
        }
      />
      {/* Provider Coming Soon Routes */}
      <Route
        path="/proveedor/catalogo"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/pedidos"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/estadisticas"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/clientes"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/proveedor/configuracion"
        element={
          <ProtectedRoute allowedRoles={['provider']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      {/* Redirect /proveedor to dashboard */}
      <Route path="/proveedor" element={<Navigate to="/proveedor/dashboard" replace />} />

      {/* Settings Routes */}
      <Route
        path="/settings/sessions"
        element={
          <ProtectedRoute allowedRoles={['patient', 'doctor', 'provider', 'admin']}>
            <SessionsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Audit */}
      <Route
        path="/admin/audit"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditLogsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/audit/stats"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AuditStatsPage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - KYC Verification Queue - M02 Sub-Partida 3.3 */}
      <Route
        path="/admin/verificacion"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VerificationQueuePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Routes - Panel de Superadministración (M01 / Semana 7) */}
      <Route
        path="/admin"
        element={
          FEATURES.superadmin ? (
            <ProtectedRoute allowedRoles={['admin']}>
              <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-50"><div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div></div>}>
                <AdminPanelPage />
              </Suspense>
            </ProtectedRoute>
          ) : (
            <Navigate to="/admin/audit" replace />
          )
        }
      />
    </Routes>
    </Suspense>
  );
}

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <Router>
          <div className="app">
            <AppRoutes />

          </div>
        </Router>
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App;

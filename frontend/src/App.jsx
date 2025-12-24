import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { PermissionsProvider } from './hooks/usePermissions';
import ProtectedRoute from './components/ProtectedRoute';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegistroPage from './pages/RegistroPage';
import DashboardPaciente from './pages/DashboardPaciente';
import DashboardMedico from './pages/DashboardMedico';
import DashboardProveedor from './pages/DashboardProveedor';
import DirectorioMedicoPage from './pages/DirectorioMedicoPage';
import ClinicasPage from './pages/ClinicasPage';
import SegurosPage from './pages/SegurosPage';
import AgendamientoPage from './pages/modules/AgendamientoPage';
import TelemedicinaPage from './pages/modules/TelemedicinaPage';
import MarketMedPage from './pages/modules/MarketMedPage';
import CitamedPagaPage from './pages/modules/CitamedPagaPage';
import { EmailVerificationPage, PhoneVerificationPage } from './pages/verification';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import SessionsPage from './pages/settings/SessionsPage';
import { AuditLogsPage, AuditStatsPage } from './components/audit';
import DoctorProfilePage from './pages/doctor/DoctorProfilePage';
import DoctorProfileEditPage from './pages/doctor/DoctorProfileEditPage';
import PatientProfilePage from './pages/patient/PatientProfilePage';
import PatientProfileEditPage from './pages/patient/PatientProfileEditPage';
import DocumentUploadPage from './pages/doctor/verification/DocumentUploadPage';
import VerificationQueuePage from './pages/admin/verification/VerificationQueuePage';
import DoctorReputationPage from './pages/doctor/DoctorReputationPage';
import ComingSoonPage from './pages/ComingSoonPage';
import SearchPage from './pages/SearchPage';
import ProviderProfilePage from './pages/provider/ProviderProfilePage';

function AppRoutes() {
  return (
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
      <Route path="/seguros" element={<SegurosPage />} />

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
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/agenda"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/medico/pacientes"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
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
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
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
        path="/medico/facturacion"
        element={
          <ProtectedRoute allowedRoles={['doctor']}>
            <ComingSoonPage />
          </ProtectedRoute>
        }
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

      {/* Agendar cita con doctor */}
      <Route path="/agendar/:doctorId" element={<ComingSoonPage />} />

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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <Router>
          <div className="app">
            <AppRoutes />
            <Toaster position="top-right" toastOptions={{duration: 3000, style: {background: '#363636', color: '#fff'}, success: {duration: 3000, iconTheme: {primary: '#00BFA6', secondary: '#fff'}}, error: {duration: 4000, iconTheme: {primary: '#ef4444', secondary: '#fff'}}}} />
          </div>
        </Router>
      </PermissionsProvider>
    </AuthProvider>
  );
}

export default App;

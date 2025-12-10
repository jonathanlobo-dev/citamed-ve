import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
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

function AppRoutes() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/registro" element={<RegistroPage />} />
      <Route path="/directorio" element={<DirectorioMedicoPage />} />
      <Route path="/clinicas" element={<ClinicasPage />} />
      <Route path="/seguros" element={<SegurosPage />} />

      {/* Module Routes */}
      <Route path="/modulo/agendamiento" element={<AgendamientoPage />} />
      <Route path="/modulo/telemedicina" element={<TelemedicinaPage />} />
      <Route path="/modulo/marketmed" element={<MarketMedPage />} />
      <Route path="/modulo/citamed-paga" element={<CitamedPagaPage />} />

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
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="app">
          <AppRoutes />
          <Toaster position="top-right" toastOptions={{duration: 3000, style: {background: '#363636', color: '#fff'}, success: {duration: 3000, iconTheme: {primary: '#00BFA6', secondary: '#fff'}}, error: {duration: 4000, iconTheme: {primary: '#ef4444', secondary: '#fff'}}}} />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;

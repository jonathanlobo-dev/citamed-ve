import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  // No está logueado → redirect a login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Está logueado pero no tiene el rol permitido → redirect a su dashboard correcto
  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    const correctDashboard = getDashboardPath(user.role);
    return <Navigate to={correctDashboard} replace />;
  }

  // Todo OK, mostrar el componente
  return children;
}

export default ProtectedRoute;

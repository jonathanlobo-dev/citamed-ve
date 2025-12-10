import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../button/button';
import { LogOut, User, Calendar, Menu, X, Home, Grid, Stethoscope, Building2, Shield, HelpCircle } from 'lucide-react';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
    setMobileMenuOpen(false);
  };

  const scrollToSection = (sectionId) => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
    setMobileMenuOpen(false);
  };

  const navItems = [
    { label: 'Inicio', action: () => navigate('/'), icon: <Home className="w-4 h-4" />, type: 'navigate' },
    { label: 'Módulos', action: () => scrollToSection('modulos'), icon: <Grid className="w-4 h-4" />, type: 'scroll' },
    { label: 'Directorio Médico', action: () => navigate('/directorio'), icon: <Stethoscope className="w-4 h-4" />, type: 'navigate' },
    { label: 'Clínicas', action: () => navigate('/clinicas'), icon: <Building2 className="w-4 h-4" />, type: 'navigate' },
    { label: 'Seguros', action: () => navigate('/seguros'), icon: <Shield className="w-4 h-4" />, type: 'navigate' },
    { label: 'Beneficios', action: () => scrollToSection('beneficios'), icon: null, type: 'scroll' },
    { label: 'FAQ', action: () => scrollToSection('faq'), icon: <HelpCircle className="w-4 h-4" />, type: 'scroll' },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* LOGO */}
          <div
            onClick={() => navigate('/')}
            className="flex items-center cursor-pointer hover:opacity-80 transition-opacity"
          >
            <h1 className="text-2xl font-extrabold text-primary">
              CITAMED<span className="text-accent">.VE</span>
            </h1>
          </div>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2 text-gray-700 hover:text-primary transition-colors font-medium text-sm"
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </div>

          {/* DESKTOP AUTH BUTTONS */}
          <div className="hidden lg:flex items-center gap-3">
            {user ? (
              <>
                <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-full border border-primary/20">
                  <User className="w-5 h-5 text-primary" />
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-900">
                      {user.role === 'doctor' ? 'Dr. ' : ''}
                      {user.name?.split(' ')[0]}
                    </span>
                    <span className="text-xs text-gray-500 capitalize">
                      {user.role === 'doctor' ? 'Médico' : user.role === 'patient' ? 'Paciente' : 'Proveedor'}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  icon={<Calendar className="w-4 h-4" />}
                  onClick={() => navigate('/dashboard')}
                >
                  Dashboard
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={<LogOut className="w-4 h-4" />}
                  onClick={handleLogout}
                >
                  Salir
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Iniciar Sesión
                </Button>
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => navigate('/registro')}
                  className="shadow-lg hover:shadow-xl transition-shadow"
                >
                  Crear Cuenta
                </Button>
              </>
            )}
          </div>

          {/* MOBILE MENU BUTTON */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-700" />
            ) : (
              <Menu className="w-6 h-6 text-gray-700" />
            )}
          </button>
        </div>

        {/* MOBILE MENU */}
        {mobileMenuOpen && (
          <div className="lg:hidden pb-4 border-t border-gray-200 mt-2">
            <div className="flex flex-col gap-2 pt-4">
              {navItems.map((item) => (
                <button
                  key={item.label}
                  onClick={item.action}
                  className="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors font-medium text-left"
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}

              <div className="border-t border-gray-200 my-2"></div>

              {user ? (
                <>
                  <div className="px-4 py-3 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-lg border border-primary/20">
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-5 h-5 text-primary" />
                      <span className="text-sm font-bold text-gray-900">
                        {user.role === 'doctor' ? 'Dr. ' : ''}
                        {user.name?.split(' ')[0]} {user.name?.split(' ')[1]}
                      </span>
                    </div>
                    <span className="text-xs text-gray-600 capitalize">
                      {user.role === 'doctor' ? 'Médico' : user.role === 'patient' ? 'Paciente' : 'Proveedor'}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="md"
                    icon={<Calendar className="w-4 h-4" />}
                    onClick={() => {
                      navigate('/dashboard');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Dashboard
                  </Button>
                  <Button
                    variant="ghost"
                    size="md"
                    icon={<LogOut className="w-4 h-4" />}
                    onClick={handleLogout}
                    className="w-full"
                  >
                    Cerrar Sesión
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    size="md"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full"
                  >
                    Iniciar Sesión
                  </Button>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => {
                      navigate('/registro');
                      setMobileMenuOpen(false);
                    }}
                    className="w-full shadow-lg"
                  >
                    Crear Cuenta
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

export default Navbar;

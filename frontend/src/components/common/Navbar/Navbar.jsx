import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import Button from '../Button/button';
import { LogOut, User, Calendar, Menu, X, Home, Grid, Stethoscope, Building2, Shield, HelpCircle, Search, MapPin, Star } from 'lucide-react';
import searchService from '../../../services/searchService';

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const searchRef = useRef(null);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Búsqueda con debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const result = await searchService.quickSearch(searchQuery, 5);
        if (result.success) {
          setSearchResults(result.data);
          setShowSearchDropdown(true);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/directorio?q=${encodeURIComponent(searchQuery.trim())}`);
      setShowSearchDropdown(false);
      setSearchQuery('');
      setMobileMenuOpen(false);
    }
  };

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

          {/* SEARCH BAR - CENTRO */}
          <div className="hidden md:flex flex-1 max-w-xl mx-8" ref={searchRef}>
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchResults && setShowSearchDropdown(true)}
                  placeholder="Buscar médicos, especialidades, ciudades..."
                  className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all"
                />
                {searchLoading && (
                  <div className="absolute right-4 top-1/2 -translate-y-1/2">
                    <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>

              {/* Dropdown de resultados */}
              {showSearchDropdown && searchResults && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                  {/* Médicos */}
                  {searchResults.doctors?.length > 0 && (
                    <div className="p-3">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">Médicos</p>
                      {searchResults.doctors.map((doctor) => (
                        <button
                          key={doctor.doctor_id}
                          onClick={() => {
                            navigate(`/doctor/${doctor.doctor_id}`);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
                            {doctor.full_name?.charAt(0) || 'D'}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 truncate">Dr(a). {doctor.full_name}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {doctor.specialties_text?.[0] || 'Medicina General'}
                              {doctor.city && ` • ${doctor.city}`}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Especialidades */}
                  {searchResults.specialties?.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">Especialidades</p>
                      <div className="flex flex-wrap gap-2 px-2">
                        {searchResults.specialties.map((spec) => (
                          <button
                            key={spec.id}
                            onClick={() => {
                              navigate(`/directorio?specialty=${encodeURIComponent(spec.name)}`);
                              setShowSearchDropdown(false);
                              setSearchQuery('');
                            }}
                            className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium hover:bg-primary/20 transition-colors"
                          >
                            {spec.name}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ciudades */}
                  {searchResults.cities?.length > 0 && (
                    <div className="p-3 border-t border-gray-100">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2 px-2">Ubicaciones</p>
                      {searchResults.cities.map((city, idx) => (
                        <button
                          key={idx}
                          onClick={() => {
                            navigate(`/directorio?city=${encodeURIComponent(city.city)}`);
                            setShowSearchDropdown(false);
                            setSearchQuery('');
                          }}
                          className="w-full flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg transition-colors text-left"
                        >
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-700">{city.city}, {city.state}</span>
                          <span className="text-xs text-gray-400 ml-auto">{city.doctor_count} médicos</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Sin resultados */}
                  {!searchResults.doctors?.length && !searchResults.specialties?.length && !searchResults.cities?.length && (
                    <div className="p-6 text-center text-gray-500">
                      <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                      <p>No se encontraron resultados</p>
                    </div>
                  )}

                  {/* Ver todos */}
                  <div className="p-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={handleSearchSubmit}
                      className="w-full py-2 text-center text-primary font-medium hover:underline"
                    >
                      Ver todos los resultados →
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>

          {/* DESKTOP NAV ITEMS */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-primary hover:bg-gray-50 rounded-lg transition-colors font-medium text-sm"
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
              {/* MOBILE SEARCH BAR */}
              <div className="px-4 pb-4">
                <form onSubmit={handleSearchSubmit} className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Buscar médicos, especialidades..."
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary focus:bg-white transition-all"
                  />
                </form>
              </div>

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

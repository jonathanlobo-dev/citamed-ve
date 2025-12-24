/**
 * SearchPage - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Página de búsqueda avanzada de médicos
 */

import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  Grid,
  List,
  ArrowUpDown,
  Users,
  MapPin,
  Stethoscope,
  ArrowLeft
} from 'lucide-react';
import { useSearch, useQuickSearch } from '../hooks/useSearch';
import { SearchFilters, DoctorSearchCard } from '../components/search';
import searchService from '../services/searchService';
import Navbar from '../components/common/Navbar/Navbar';

const SearchPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'grid'

  // Inicializar filtros desde URL
  const initialFilters = {
    query: searchParams.get('q') || '',
    specialtyIds: searchParams.getAll('specialty').map(Number).filter(Boolean),
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || '',
    consultationType: searchParams.get('type') || ''
  };

  const {
    filters,
    results,
    loading,
    error,
    hasSearched,
    updateFilters,
    goToPage,
    clearFilters,
    activeFiltersCount
  } = useSearch(initialFilters);

  const { query: quickQuery, suggestions, loading: quickLoading, setQuery: setQuickQuery, clear: clearQuick } = useQuickSearch();

  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchInput, setSearchInput] = useState(filters.query || '');

  // Sincronizar búsqueda con URL
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set('q', filters.query);
    if (filters.city) params.set('city', filters.city);
    if (filters.state) params.set('state', filters.state);
    if (filters.consultationType) params.set('type', filters.consultationType);
    filters.specialtyIds?.forEach(id => params.append('specialty', id));
    setSearchParams(params, { replace: true });
  }, [filters.query, filters.city, filters.state, filters.consultationType, filters.specialtyIds]);

  // Manejar input de búsqueda
  const handleSearchInput = (e) => {
    const value = e.target.value;
    setSearchInput(value);
    setQuickQuery(value);
    setShowSuggestions(value.length >= 2);
  };

  // Ejecutar búsqueda
  const handleSearch = (e) => {
    e?.preventDefault();
    updateFilters({ query: searchInput });
    setShowSuggestions(false);
  };

  // Seleccionar sugerencia
  const handleSelectSuggestion = (type, item) => {
    setShowSuggestions(false);
    clearQuick();

    if (type === 'doctor') {
      // Navegar al perfil del médico
      window.location.href = `/doctor/${item.doctor_id}`;
    } else if (type === 'specialty') {
      setSearchInput('');
      updateFilters({ query: '', specialtyIds: [item.id] });
    } else if (type === 'city') {
      setSearchInput('');
      updateFilters({ query: '', city: item.city, state: item.state });
    }
  };

  // Cambiar ordenamiento
  const handleSortChange = (sortBy) => {
    updateFilters({
      sortBy,
      sortOrder: sortBy === filters.sortBy && filters.sortOrder === 'DESC' ? 'ASC' : 'DESC'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar común */}
      <Navbar />

      {/* Header de búsqueda avanzada */}
      <div className="bg-gradient-to-r from-primary to-secondary">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Breadcrumb y título */}
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate('/directorio')}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-sm font-medium">Volver al Directorio</span>
            </button>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-white">
                Búsqueda Avanzada
              </h1>
              <p className="text-white/80 mt-1">
                Encuentra el médico perfecto con filtros detallados
              </p>
            </div>

            {/* Botón filtros móvil */}
            <button
              type="button"
              onClick={() => setShowMobileFilters(true)}
              className="lg:hidden flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
            >
              <SlidersHorizontal className="w-5 h-5" />
              <span>Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-white text-primary text-xs px-2 py-0.5 rounded-full font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {/* Barra de búsqueda */}
          <form onSubmit={handleSearch} className="mt-6 relative">
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={handleSearchInput}
                  onFocus={() => searchInput.length >= 2 && setShowSuggestions(true)}
                  placeholder="Buscar por nombre, especialidad o ubicación..."
                  className="w-full pl-12 pr-4 py-4 border-0 rounded-xl shadow-lg focus:outline-none focus:ring-2 focus:ring-white/50 text-gray-800"
                />
                {searchInput && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchInput('');
                      clearQuick();
                      updateFilters({ query: '' });
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}

                {/* Sugerencias */}
                {showSuggestions && (suggestions.doctors?.length > 0 || suggestions.specialties?.length > 0 || suggestions.cities?.length > 0) && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 max-h-96 overflow-y-auto">
                    {/* Médicos */}
                    {suggestions.doctors?.length > 0 && (
                      <div className="p-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Médicos</div>
                        {suggestions.doctors.map(doc => (
                          <button
                            key={doc.doctor_id}
                            type="button"
                            onClick={() => handleSelectSuggestion('doctor', doc)}
                            className="w-full flex items-center gap-3 px-2 py-2 hover:bg-gray-50 rounded-lg text-left"
                          >
                            {doc.profile_photo ? (
                              <img src={doc.profile_photo} alt="" className="w-10 h-10 rounded-full object-cover" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                                <span className="text-white font-medium">{doc.full_name?.charAt(0)}</span>
                              </div>
                            )}
                            <div>
                              <div className="font-medium text-gray-800">Dr(a). {doc.full_name}</div>
                              <div className="text-sm text-gray-500">{doc.specialties_text?.join(', ')}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Especialidades */}
                    {suggestions.specialties?.length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Especialidades</div>
                        {suggestions.specialties.map(spec => (
                          <button
                            key={spec.id}
                            type="button"
                            onClick={() => handleSelectSuggestion('specialty', spec)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg text-left"
                          >
                            <Stethoscope className="w-4 h-4 text-primary" />
                            <span className="text-gray-800">{spec.name}</span>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Ciudades */}
                    {suggestions.cities?.length > 0 && (
                      <div className="p-3 border-t border-gray-100">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide px-2 mb-2">Ubicaciones</div>
                        {suggestions.cities.map(city => (
                          <button
                            key={`${city.city}-${city.state}`}
                            type="button"
                            onClick={() => handleSelectSuggestion('city', city)}
                            className="w-full flex items-center gap-2 px-2 py-2 hover:bg-gray-50 rounded-lg text-left"
                          >
                            <MapPin className="w-4 h-4 text-primary" />
                            <span className="text-gray-800">{city.city}, {city.state}</span>
                            <span className="text-xs text-gray-400 ml-auto">({city.doctor_count} médicos)</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="submit"
                className="px-8 py-4 bg-white text-primary rounded-xl hover:bg-gray-50 transition-colors font-semibold shadow-lg"
              >
                Buscar
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Contenido principal */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar de filtros (desktop) */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-20">
              <SearchFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
              />
            </div>
          </aside>

          {/* Resultados */}
          <div className="flex-1">
            {/* Toolbar */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-gray-600">
                    {loading ? (
                      'Buscando...'
                    ) : (
                      <>
                        <span className="font-semibold text-gray-800">{results.pagination.total}</span> médicos encontrados
                      </>
                    )}
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  {/* Ordenamiento */}
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="w-4 h-4 text-gray-400" />
                    <select
                      value={filters.sortBy}
                      onChange={(e) => handleSortChange(e.target.value)}
                      className="border-0 text-sm text-gray-600 focus:ring-0 cursor-pointer"
                    >
                      {searchService.SORT_OPTIONS.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Vista */}
                  <div className="hidden sm:flex items-center gap-1 border-l border-gray-200 pl-4">
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-100 text-teal-600' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Lista de resultados */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-lg" />
                      <div className="flex-1 space-y-3">
                        <div className="h-5 bg-gray-200 rounded w-48" />
                        <div className="h-4 bg-gray-200 rounded w-32" />
                        <div className="h-4 bg-gray-200 rounded w-64" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : error ? (
              <div className="bg-white rounded-lg border border-red-200 p-8 text-center">
                <div className="text-red-500 mb-2">Error al cargar resultados</div>
                <button
                  onClick={() => window.location.reload()}
                  className="text-teal-600 hover:text-teal-700 text-sm"
                >
                  Reintentar
                </button>
              </div>
            ) : results.doctors.length === 0 ? (
              <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  No se encontraron médicos
                </h3>
                <p className="text-gray-500 mb-4">
                  Intenta ajustar los filtros o buscar con otros términos
                </p>
                <button
                  onClick={clearFilters}
                  className="text-teal-600 hover:text-teal-700 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                {results.doctors.map(doctor => (
                  <DoctorSearchCard
                    key={doctor.doctor_id}
                    doctor={doctor}
                    showDistance={filters.userLat && filters.userLng}
                  />
                ))}
              </div>
            )}

            {/* Paginación */}
            {results.pagination.totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-2">
                <button
                  onClick={() => goToPage(results.pagination.page - 1)}
                  disabled={!results.pagination.hasPrev}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, results.pagination.totalPages))].map((_, i) => {
                    let pageNum;
                    if (results.pagination.totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (results.pagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (results.pagination.page >= results.pagination.totalPages - 2) {
                      pageNum = results.pagination.totalPages - 4 + i;
                    } else {
                      pageNum = results.pagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-colors ${
                          results.pagination.page === pageNum
                            ? 'bg-teal-600 text-white'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => goToPage(results.pagination.page + 1)}
                  disabled={!results.pagination.hasNext}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modal de filtros móvil */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="font-semibold text-gray-800">Filtros</h3>
              <button
                onClick={() => setShowMobileFilters(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto h-[calc(100vh-140px)]">
              <SearchFilters
                filters={filters}
                onFiltersChange={updateFilters}
                onClearFilters={clearFilters}
                activeFiltersCount={activeFiltersCount}
                className="border-0 rounded-none"
              />
            </div>
            <div className="p-4 border-t border-gray-200">
              <button
                onClick={() => setShowMobileFilters(false)}
                className="w-full py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700"
              >
                Ver {results.pagination.total} resultados
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overlay para cerrar sugerencias */}
      {showSuggestions && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowSuggestions(false)}
        />
      )}
    </div>
  );
};

export default SearchPage;

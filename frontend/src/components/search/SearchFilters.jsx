/**
 * SearchFilters Component - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Panel de filtros avanzados
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  MapPin,
  DollarSign,
  Star,
  Briefcase,
  Globe,
  Shield,
  UserCheck,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Award,
  Navigation,
  Video,
  Building2,
  RotateCcw
} from 'lucide-react';
import { useSearchFiltersData, useUserLocation } from '../../hooks/useSearch';
import searchService from '../../services/searchService';

/**
 * Panel de filtros para búsqueda de médicos
 */
const SearchFilters = ({
  filters,
  onFiltersChange,
  onClearFilters,
  activeFiltersCount = 0,
  className = ''
}) => {
  const { specialties, states, insuranceProviders, stats, loading: dataLoading, fetchCities } = useSearchFiltersData();
  const { lat, lng, loading: locationLoading, error: locationError, requestLocation, clearLocation, granted } = useUserLocation();
  const [cities, setCities] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    specialty: true,
    location: true,
    price: false,
    rating: false,
    experience: false,
    insurance: false,
    other: false
  });

  // Cargar ciudades cuando cambia el estado
  useEffect(() => {
    const loadCities = async () => {
      if (filters.state) {
        const response = await searchService.getCities('', filters.state);
        if (response.success) {
          setCities(response.data);
        }
      } else {
        setCities([]);
      }
    };
    loadCities();
  }, [filters.state]);

  // Actualizar filtros con ubicación
  useEffect(() => {
    if (lat && lng) {
      onFiltersChange({ userLat: lat, userLng: lng });
    }
  }, [lat, lng]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleSpecialtyChange = (specialtyId) => {
    const current = filters.specialtyIds || [];
    const updated = current.includes(specialtyId)
      ? current.filter(id => id !== specialtyId)
      : [...current, specialtyId];
    onFiltersChange({ specialtyIds: updated });
  };

  const handleReputationChange = (level) => {
    const current = filters.reputationLevels || [];
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level];
    onFiltersChange({ reputationLevels: updated });
  };

  const handleLanguageChange = (language) => {
    const current = filters.languages || [];
    const updated = current.includes(language)
      ? current.filter(l => l !== language)
      : [...current, language];
    onFiltersChange({ languages: updated });
  };

  const handleInsuranceNameChange = (insurance) => {
    const current = filters.insuranceNames || [];
    const updated = current.includes(insurance)
      ? current.filter(i => i !== insurance)
      : [...current, insurance];
    onFiltersChange({ insuranceNames: updated });
  };

  const FilterSection = ({ id, title, icon: Icon, children }) => (
    <div className="border-b border-gray-100 py-3">
      <button
        onClick={() => toggleSection(id)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-teal-600" />
          <span className="font-medium text-gray-700">{title}</span>
        </div>
        {expandedSections[id] ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {expandedSections[id] && (
        <div className="mt-3">
          {children}
        </div>
      )}
    </div>
  );

  if (dataLoading) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4" />
          <div className="h-8 bg-gray-200 rounded" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="h-8 bg-gray-200 rounded" />
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-teal-600" />
            <h3 className="font-semibold text-gray-800">Filtros</h3>
            {activeFiltersCount > 0 && (
              <span className="bg-teal-100 text-teal-700 text-xs px-2 py-0.5 rounded-full">
                {activeFiltersCount}
              </span>
            )}
          </div>
          {activeFiltersCount > 0 && (
            <button
              onClick={onClearFilters}
              className="text-sm text-gray-500 hover:text-teal-600 flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              Limpiar
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-1 max-h-[calc(100vh-200px)] overflow-y-auto">
        {/* Tipo de consulta */}
        <div className="pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-2">
            <Video className="w-4 h-4 text-teal-600" />
            <span className="font-medium text-gray-700">Tipo de consulta</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {searchService.CONSULTATION_TYPES.map(type => (
              <button
                key={type.value}
                onClick={() => onFiltersChange({ consultationType: type.value })}
                className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                  filters.consultationType === type.value
                    ? 'bg-teal-600 text-white border-teal-600'
                    : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Especialidades */}
        <FilterSection id="specialty" title="Especialidad" icon={Briefcase}>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {specialties.map(specialty => (
              <label key={specialty.id} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.specialtyIds?.includes(specialty.id) || false}
                  onChange={() => handleSpecialtyChange(specialty.id)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{specialty.name}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Ubicación */}
        <FilterSection id="location" title="Ubicación" icon={MapPin}>
          {/* Botón de ubicación */}
          <div className="mb-3">
            <button
              onClick={granted ? clearLocation : requestLocation}
              disabled={locationLoading}
              className={`w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors ${
                granted
                  ? 'bg-teal-50 border-teal-200 text-teal-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-teal-400'
              }`}
            >
              <Navigation className={`w-4 h-4 ${locationLoading ? 'animate-pulse' : ''}`} />
              {locationLoading
                ? 'Obteniendo ubicación...'
                : granted
                  ? 'Ubicación activa'
                  : 'Usar mi ubicación'}
            </button>
            {locationError && (
              <p className="text-xs text-red-500 mt-1">{locationError}</p>
            )}
          </div>

          {/* Distancia máxima */}
          {granted && (
            <div className="mb-3">
              <label className="block text-sm text-gray-600 mb-1">Distancia máxima</label>
              <select
                value={filters.maxDistance || ''}
                onChange={(e) => onFiltersChange({ maxDistance: e.target.value ? Number(e.target.value) : undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Sin límite</option>
                {searchService.DISTANCE_RANGES.map(range => (
                  <option key={range.value} value={range.value}>{range.label}</option>
                ))}
              </select>
            </div>
          )}

          {/* Estado */}
          <div className="mb-2">
            <label className="block text-sm text-gray-600 mb-1">Estado</label>
            <select
              value={filters.state || ''}
              onChange={(e) => onFiltersChange({ state: e.target.value, city: '' })}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
            >
              <option value="">Todos los estados</option>
              {states.map(state => (
                <option key={state.state} value={state.state}>
                  {state.state} ({state.doctor_count})
                </option>
              ))}
            </select>
          </div>

          {/* Ciudad */}
          {filters.state && cities.length > 0 && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Ciudad</label>
              <select
                value={filters.city || ''}
                onChange={(e) => onFiltersChange({ city: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Todas las ciudades</option>
                {cities.map(city => (
                  <option key={city.city} value={city.city}>
                    {city.city} ({city.doctor_count})
                  </option>
                ))}
              </select>
            </div>
          )}
        </FilterSection>

        {/* Precio */}
        <FilterSection id="price" title="Precio" icon={DollarSign}>
          <div className="space-y-3">
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Mínimo</label>
                <input
                  type="number"
                  placeholder="$0"
                  value={filters.minPrice || ''}
                  onChange={(e) => onFiltersChange({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-xs text-gray-500 mb-1">Máximo</label>
                <input
                  type="number"
                  placeholder="Sin límite"
                  value={filters.maxPrice || ''}
                  onChange={(e) => onFiltersChange({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-1">
              {searchService.PRICE_RANGES.map((range, idx) => (
                <button
                  key={idx}
                  onClick={() => onFiltersChange({ minPrice: range.min, maxPrice: range.max })}
                  className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded hover:bg-teal-100 hover:text-teal-700 transition-colors"
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
        </FilterSection>

        {/* Rating */}
        <FilterSection id="rating" title="Valoración" icon={Star}>
          <div className="space-y-2">
            {[4, 3, 2, 1].map(rating => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="minRating"
                  checked={filters.minRating === rating}
                  onChange={() => onFiltersChange({ minRating: rating })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="text-sm text-gray-600 ml-1">o más</span>
                </div>
              </label>
            ))}
            {filters.minRating && (
              <button
                onClick={() => onFiltersChange({ minRating: undefined })}
                className="text-xs text-gray-500 hover:text-teal-600"
              >
                Limpiar
              </button>
            )}
          </div>
        </FilterSection>

        {/* Experiencia */}
        <FilterSection id="experience" title="Experiencia" icon={Briefcase}>
          <div className="space-y-2">
            {searchService.EXPERIENCE_RANGES.map(range => (
              <label key={range.min} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="minExperience"
                  checked={filters.minExperience === range.min}
                  onChange={() => onFiltersChange({ minExperience: range.min || undefined })}
                  className="text-teal-600 focus:ring-teal-500"
                />
                <span className="text-sm text-gray-700">{range.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Reputación */}
        <FilterSection id="reputation" title="Nivel de Reputación" icon={Award}>
          <div className="space-y-2">
            {Object.entries(searchService.REPUTATION_LEVELS).map(([key, level]) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.reputationLevels?.includes(key) || false}
                  onChange={() => handleReputationChange(key)}
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                />
                <span className={`text-sm text-${level.color}`}>{level.label}</span>
                {stats?.reputationLevels?.[key] && (
                  <span className="text-xs text-gray-400">({stats.reputationLevels[key]})</span>
                )}
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Seguros */}
        <FilterSection id="insurance" title="Seguros" icon={Shield}>
          <div className="space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.acceptsInsurance === true}
                onChange={(e) => onFiltersChange({ acceptsInsurance: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Acepta seguros</span>
            </label>
            {filters.acceptsInsurance && insuranceProviders.length > 0 && (
              <div className="ml-6 space-y-2 max-h-32 overflow-y-auto">
                {insuranceProviders.map(insurance => (
                  <label key={insurance} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filters.insuranceNames?.includes(insurance) || false}
                      onChange={() => handleInsuranceNameChange(insurance)}
                      className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                    />
                    <span className="text-sm text-gray-600">{insurance}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </FilterSection>

        {/* Otros filtros */}
        <FilterSection id="other" title="Otros filtros" icon={UserCheck}>
          <div className="space-y-3">
            {/* Verificado */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.isVerified === true}
                onChange={(e) => onFiltersChange({ isVerified: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Solo verificados</span>
            </label>

            {/* Disponibilidad */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.hasAvailability === true}
                onChange={(e) => onFiltersChange({ hasAvailability: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Con disponibilidad</span>
            </label>

            {/* Acepta nuevos pacientes */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.acceptsNewPatients === true}
                onChange={(e) => onFiltersChange({ acceptsNewPatients: e.target.checked ? true : undefined })}
                className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
              />
              <span className="text-sm text-gray-700">Acepta nuevos pacientes</span>
            </label>

            {/* Género */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Género del médico</label>
              <select
                value={filters.gender || ''}
                onChange={(e) => onFiltersChange({ gender: e.target.value || undefined })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              >
                <option value="">Cualquiera</option>
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>

            {/* Idiomas */}
            <div>
              <label className="block text-sm text-gray-600 mb-1">Idiomas</label>
              <div className="flex flex-wrap gap-2">
                {['Español', 'Inglés', 'Portugués', 'Italiano', 'Francés'].map(lang => (
                  <button
                    key={lang}
                    onClick={() => handleLanguageChange(lang)}
                    className={`px-2 py-1 text-xs rounded-full border transition-colors ${
                      filters.languages?.includes(lang)
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400'
                    }`}
                  >
                    {lang}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </FilterSection>
      </div>
    </div>
  );
};

export default SearchFilters;

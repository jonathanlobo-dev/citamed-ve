/**
 * useSearch Hook - CITAMED.VE
 * M02 Sub-Partida 3.5 - BUSQUEDA AVANZADA DE MEDICOS
 *
 * Hook para búsqueda avanzada de médicos
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import searchService from '../services/searchService';

/**
 * Hook principal para búsqueda de médicos
 * @param {Object} initialFilters - Filtros iniciales
 * @returns {Object} Estado y funciones de búsqueda
 */
export const useSearch = (initialFilters = {}) => {
  const [filters, setFilters] = useState({
    query: '',
    specialtyIds: [],
    city: '',
    state: '',
    minPrice: undefined,
    maxPrice: undefined,
    minRating: undefined,
    minExperience: undefined,
    languages: [],
    acceptsInsurance: undefined,
    insuranceNames: [],
    isVerified: undefined,
    gender: '',
    reputationLevels: [],
    hasAvailability: undefined,
    acceptsNewPatients: undefined,
    userLat: undefined,
    userLng: undefined,
    maxDistance: undefined,
    consultationType: '',
    sortBy: 'average_rating',
    sortOrder: 'DESC',
    page: 1,
    limit: 20,
    ...initialFilters
  });

  const [results, setResults] = useState({
    doctors: [],
    pagination: {
      page: 1,
      limit: 20,
      total: 0,
      totalPages: 0,
      hasNext: false,
      hasPrev: false
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  const abortControllerRef = useRef(null);

  /**
   * Ejecuta la búsqueda
   */
  const search = useCallback(async (newFilters = null) => {
    // Cancelar búsqueda anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    const searchFilters = newFilters || filters;

    setLoading(true);
    setError(null);

    try {
      const response = await searchService.searchDoctors(searchFilters);

      if (response.success) {
        setResults({
          doctors: response.data.doctors,
          pagination: response.data.pagination
        });
        setHasSearched(true);
      } else {
        setError(response.message || 'Error en la búsqueda');
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Search error:', err);
        setError('Error al realizar la búsqueda');
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  /**
   * Actualiza filtros y ejecuta búsqueda
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      const updated = { ...prev, ...newFilters, page: 1 };
      return updated;
    });
  }, []);

  /**
   * Cambia de página
   */
  const goToPage = useCallback((page) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  /**
   * Limpia todos los filtros
   */
  const clearFilters = useCallback(() => {
    setFilters({
      query: '',
      specialtyIds: [],
      city: '',
      state: '',
      minPrice: undefined,
      maxPrice: undefined,
      minRating: undefined,
      minExperience: undefined,
      languages: [],
      acceptsInsurance: undefined,
      insuranceNames: [],
      isVerified: undefined,
      gender: '',
      reputationLevels: [],
      hasAvailability: undefined,
      acceptsNewPatients: undefined,
      userLat: filters.userLat, // Mantener ubicación
      userLng: filters.userLng,
      maxDistance: undefined,
      consultationType: '',
      sortBy: 'average_rating',
      sortOrder: 'DESC',
      page: 1,
      limit: 20
    });
  }, [filters.userLat, filters.userLng]);

  /**
   * Cuenta filtros activos
   */
  const activeFiltersCount = useCallback(() => {
    let count = 0;
    if (filters.query) count++;
    if (filters.specialtyIds?.length) count++;
    if (filters.city) count++;
    if (filters.state) count++;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.minRating !== undefined) count++;
    if (filters.minExperience !== undefined) count++;
    if (filters.languages?.length) count++;
    if (filters.acceptsInsurance !== undefined) count++;
    if (filters.insuranceNames?.length) count++;
    if (filters.isVerified !== undefined) count++;
    if (filters.gender) count++;
    if (filters.reputationLevels?.length) count++;
    if (filters.hasAvailability !== undefined) count++;
    if (filters.acceptsNewPatients !== undefined) count++;
    if (filters.maxDistance !== undefined) count++;
    if (filters.consultationType) count++;
    return count;
  }, [filters]);

  /**
   * Efecto para ejecutar búsqueda cuando cambian filtros
   */
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      search();
    }, 300);

    return () => clearTimeout(debounceTimer);
  }, [filters]);

  /**
   * Cleanup al desmontar
   */
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    filters,
    results,
    loading,
    error,
    hasSearched,
    search,
    updateFilters,
    goToPage,
    clearFilters,
    activeFiltersCount: activeFiltersCount()
  };
};

/**
 * Hook para búsqueda rápida (autocomplete)
 * @returns {Object} Estado y funciones
 */
export const useQuickSearch = () => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState({
    doctors: [],
    specialties: [],
    cities: []
  });
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef(null);

  const search = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions({ doctors: [], specialties: [], cities: [] });
      return;
    }

    setLoading(true);
    try {
      const response = await searchService.quickSearch(searchQuery);
      if (response.success) {
        setSuggestions(response.data);
      }
    } catch (err) {
      console.error('Quick search error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleQueryChange = useCallback((newQuery) => {
    setQuery(newQuery);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      search(newQuery);
    }, 200);
  }, [search]);

  const clear = useCallback(() => {
    setQuery('');
    setSuggestions({ doctors: [], specialties: [], cities: [] });
  }, []);

  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return {
    query,
    suggestions,
    loading,
    setQuery: handleQueryChange,
    clear
  };
};

/**
 * Hook para obtener datos de filtros
 * @returns {Object} Datos para filtros
 */
export const useSearchFiltersData = () => {
  const [specialties, setSpecialties] = useState([]);
  const [cities, setCities] = useState([]);
  const [states, setStates] = useState([]);
  const [insuranceProviders, setInsuranceProviders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [specialtiesRes, statesRes, insuranceRes, statsRes] = await Promise.all([
          searchService.getSpecialties(),
          searchService.getStates(),
          searchService.getInsuranceProviders(),
          searchService.getSearchStats()
        ]);

        if (specialtiesRes.success) setSpecialties(specialtiesRes.data);
        if (statesRes.success) setStates(statesRes.data);
        if (insuranceRes.success) setInsuranceProviders(insuranceRes.data);
        if (statsRes.success) setStats(statsRes.data);
      } catch (err) {
        console.error('Error fetching filter data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const fetchCities = useCallback(async (state = '') => {
    try {
      const response = await searchService.getCities('', state);
      if (response.success) {
        setCities(response.data);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
    }
  }, []);

  return {
    specialties,
    cities,
    states,
    insuranceProviders,
    stats,
    loading,
    fetchCities
  };
};

/**
 * Hook para geolocalización
 * @returns {Object} Ubicación del usuario
 */
export const useUserLocation = () => {
  const [location, setLocation] = useState({
    lat: null,
    lng: null,
    loading: false,
    error: null,
    granted: false
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocation(prev => ({
        ...prev,
        error: 'Geolocalización no soportada'
      }));
      return;
    }

    setLocation(prev => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          loading: false,
          error: null,
          granted: true
        });
      },
      (err) => {
        setLocation(prev => ({
          ...prev,
          loading: false,
          error: err.message,
          granted: false
        }));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000 // 5 minutos
      }
    );
  }, []);

  const clearLocation = useCallback(() => {
    setLocation({
      lat: null,
      lng: null,
      loading: false,
      error: null,
      granted: false
    });
  }, []);

  return {
    ...location,
    requestLocation,
    clearLocation
  };
};

export default useSearch;

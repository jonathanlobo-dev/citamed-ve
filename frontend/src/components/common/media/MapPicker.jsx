/**
 * MapPicker Component - CITAMED.VE
 * Selector de ubicación con mapa interactivo
 * Usa Leaflet (OpenStreetMap) - gratuito y sin API key
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  MapPin,
  Navigation,
  Search,
  Loader2,
  Check,
  AlertCircle,
  Crosshair,
  Map
} from 'lucide-react';

/**
 * Props:
 * @param {object} location - { lat: number, lng: number, address?: string }
 * @param {function} onLocationChange - Callback con nueva ubicación
 * @param {boolean} loading - Estado de carga
 * @param {boolean} disabled - Deshabilitar interacción
 * @param {string} label - Label del componente
 * @param {number} defaultZoom - Zoom inicial (default: 15)
 * @param {object} defaultCenter - Centro inicial { lat, lng }
 */
const MapPicker = ({
  location = null,
  onLocationChange,
  loading = false,
  disabled = false,
  label = 'Ubicación del consultorio',
  defaultZoom = 15,
  defaultCenter = { lat: 10.4806, lng: -66.9036 }, // Caracas, Venezuela
  className = ''
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchTimeoutRef = useRef(null);

  // Cargar Leaflet dinámicamente
  useEffect(() => {
    const loadLeaflet = async () => {
      // Verificar si ya está cargado
      if (window.L) {
        setMapLoaded(true);
        return;
      }

      // Cargar CSS de Leaflet
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Cargar JS de Leaflet
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => setMapLoaded(true);
      document.head.appendChild(script);
    };

    loadLeaflet();
  }, []);

  // Inicializar mapa cuando Leaflet está listo
  useEffect(() => {
    if (!mapLoaded || !mapRef.current || mapInstanceRef.current) return;

    const L = window.L;

    // Crear mapa
    const map = L.map(mapRef.current, {
      center: location
        ? [location.lat, location.lng]
        : [defaultCenter.lat, defaultCenter.lng],
      zoom: defaultZoom,
      zoomControl: true
    });

    // Agregar capa de tiles (OpenStreetMap)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Crear marcador si hay ubicación
    if (location) {
      markerRef.current = L.marker([location.lat, location.lng], {
        draggable: !disabled
      }).addTo(map);

      // Evento de drag del marcador
      if (!disabled) {
        markerRef.current.on('dragend', async (e) => {
          const { lat, lng } = e.target.getLatLng();
          const address = await reverseGeocode(lat, lng);
          if (onLocationChange) {
            onLocationChange({ lat, lng, address });
          }
        });
      }
    }

    // Evento de click en el mapa
    if (!disabled) {
      map.on('click', async (e) => {
        const { lat, lng } = e.latlng;

        // Actualizar o crear marcador
        if (markerRef.current) {
          markerRef.current.setLatLng([lat, lng]);
        } else {
          markerRef.current = L.marker([lat, lng], {
            draggable: true
          }).addTo(map);

          markerRef.current.on('dragend', async (e) => {
            const { lat, lng } = e.target.getLatLng();
            const address = await reverseGeocode(lat, lng);
            if (onLocationChange) {
              onLocationChange({ lat, lng, address });
            }
          });
        }

        // Obtener dirección
        const address = await reverseGeocode(lat, lng);
        if (onLocationChange) {
          onLocationChange({ lat, lng, address });
        }
      });
    }

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [mapLoaded, disabled]);

  // Actualizar marcador cuando cambia la ubicación
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !location) return;

    const L = window.L;
    const map = mapInstanceRef.current;

    if (markerRef.current) {
      markerRef.current.setLatLng([location.lat, location.lng]);
    } else {
      markerRef.current = L.marker([location.lat, location.lng], {
        draggable: !disabled
      }).addTo(map);
    }

    map.setView([location.lat, location.lng], defaultZoom);
  }, [location?.lat, location?.lng, mapLoaded]);

  // Geocodificación inversa (coordenadas -> dirección)
  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      const data = await response.json();
      return data.display_name || '';
    } catch (err) {
      console.error('Reverse geocoding error:', err);
      return '';
    }
  };

  // Buscar ubicación por texto
  const searchLocation = async (query) => {
    if (!query || query.length < 3) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&countrycodes=ve`,
        {
          headers: {
            'Accept-Language': 'es'
          }
        }
      );
      const data = await response.json();
      setSearchResults(data);
      setShowResults(true);
    } catch (err) {
      console.error('Search error:', err);
      setError('Error al buscar ubicación');
    } finally {
      setIsSearching(false);
    }
  };

  // Handler de búsqueda con debounce
  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    searchTimeoutRef.current = setTimeout(() => {
      searchLocation(query);
    }, 500);
  };

  // Seleccionar resultado de búsqueda
  const handleSelectResult = (result) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);

    if (mapInstanceRef.current) {
      mapInstanceRef.current.setView([lat, lng], defaultZoom);

      const L = window.L;
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      } else {
        markerRef.current = L.marker([lat, lng], {
          draggable: !disabled
        }).addTo(mapInstanceRef.current);
      }
    }

    if (onLocationChange) {
      onLocationChange({
        lat,
        lng,
        address: result.display_name
      });
    }

    setSearchQuery(result.display_name);
    setShowResults(false);
  };

  // Obtener ubicación actual del usuario
  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada en este navegador');
      return;
    }

    setIsLocating(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude: lat, longitude: lng } = position.coords;

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([lat, lng], defaultZoom);

          const L = window.L;
          if (markerRef.current) {
            markerRef.current.setLatLng([lat, lng]);
          } else {
            markerRef.current = L.marker([lat, lng], {
              draggable: !disabled
            }).addTo(mapInstanceRef.current);
          }
        }

        const address = await reverseGeocode(lat, lng);
        if (onLocationChange) {
          onLocationChange({ lat, lng, address });
        }

        setSearchQuery(address);
        setIsLocating(false);
      },
      (err) => {
        console.error('Geolocation error:', err);
        setError('No se pudo obtener tu ubicación');
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  return (
    <div className={className}>
      {/* Label */}
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-3">
          {label}
        </label>
      )}

      <div className="space-y-4">
        {/* Barra de búsqueda */}
        <div className="relative">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Buscar dirección..."
                disabled={disabled}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent disabled:bg-gray-100"
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-primary animate-spin" />
              )}
            </div>

            <button
              type="button"
              onClick={handleGetCurrentLocation}
              disabled={disabled || isLocating}
              className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {isLocating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Crosshair className="w-5 h-5" />
              )}
              <span className="hidden sm:inline">Mi ubicación</span>
            </button>
          </div>

          {/* Resultados de búsqueda */}
          {showResults && searchResults.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg border border-gray-200 z-20 max-h-60 overflow-y-auto"
            >
              {searchResults.map((result, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleSelectResult(result)}
                  className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 text-left border-b border-gray-100 last:border-b-0"
                >
                  <MapPin className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{result.display_name}</span>
                </button>
              ))}
            </motion.div>
          )}
        </div>

        {/* Mapa */}
        <div className="relative rounded-xl overflow-hidden border border-gray-200">
          {!mapLoaded && (
            <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10">
              <div className="text-center">
                <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-3" />
                <p className="text-gray-500">Cargando mapa...</p>
              </div>
            </div>
          )}
          <div
            ref={mapRef}
            className="w-full h-[300px] md:h-[400px]"
            style={{ background: '#f3f4f6' }}
          />
        </div>

        {/* Coordenadas actuales */}
        {location && (
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-50 px-4 py-2 rounded-lg">
            <MapPin className="w-4 h-4 text-primary" />
            <span>
              <strong>Lat:</strong> {location.lat.toFixed(6)}, <strong>Lng:</strong> {location.lng.toFixed(6)}
            </span>
            {location.address && (
              <span className="text-gray-400 truncate ml-2">
                ({location.address.substring(0, 50)}...)
              </span>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 text-sm">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}

        {/* Instrucciones */}
        <p className="text-gray-500 text-sm">
          Haz clic en el mapa para seleccionar ubicación o arrastra el marcador.
        </p>
      </div>
    </div>
  );
};

export default MapPicker;

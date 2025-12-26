/**
 * LocationTracker - CITAMED.VE
 * Componente de geolocalización inteligente
 *
 * Calcula:
 * - Distancia al consultorio
 * - Tiempo estimado de llegada
 * - Notificación "Sal ahora" basada en tiempo de espera
 */

import { useState, useEffect, useCallback } from 'react';
import './LocationTracker.css';

const LocationTracker = ({
  clinicLocation, // { lat, lng, address }
  estimatedWaitMinutes,
  position,
  onShouldLeave,
  onArrived
}) => {
  const [userLocation, setUserLocation] = useState(null);
  const [distance, setDistance] = useState(null);
  const [travelTime, setTravelTime] = useState(null);
  const [locationStatus, setLocationStatus] = useState('requesting'); // requesting, granted, denied, unavailable
  const [shouldLeaveNow, setShouldLeaveNow] = useState(false);
  const [hasArrived, setHasArrived] = useState(false);
  const [showNotification, setShowNotification] = useState(false);

  // Calcular distancia entre dos puntos (Haversine formula)
  const calculateDistance = useCallback((lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radio de la Tierra en km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }, []);

  // Estimar tiempo de viaje (asumiendo 30 km/h promedio en ciudad)
  const estimateTravelTime = useCallback((distanceKm) => {
    const avgSpeedKmH = 25; // Velocidad promedio en ciudad con tráfico
    return Math.ceil((distanceKm / avgSpeedKmH) * 60); // en minutos
  }, []);

  // Obtener ubicación del usuario
  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('unavailable');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationStatus('granted');

        if (clinicLocation?.lat && clinicLocation?.lng) {
          const dist = calculateDistance(
            latitude, longitude,
            clinicLocation.lat, clinicLocation.lng
          );
          setDistance(dist);
          setTravelTime(estimateTravelTime(dist));

          // Verificar si ya llegó (menos de 100m)
          if (dist < 0.1) {
            setHasArrived(true);
            if (onArrived) onArrived();
          }
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        if (error.code === error.PERMISSION_DENIED) {
          setLocationStatus('denied');
        } else {
          setLocationStatus('unavailable');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [clinicLocation, calculateDistance, estimateTravelTime, onArrived]);

  // Lógica de "Sal ahora"
  useEffect(() => {
    if (travelTime && estimatedWaitMinutes) {
      // Si el tiempo de viaje + 5 min buffer >= tiempo de espera
      const bufferMinutes = 5;
      const shouldLeave = travelTime + bufferMinutes >= estimatedWaitMinutes;

      if (shouldLeave && !shouldLeaveNow && position > 1) {
        setShouldLeaveNow(true);
        setShowNotification(true);
        if (onShouldLeave) onShouldLeave();

        // Vibrar si está disponible
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }
    }
  }, [travelTime, estimatedWaitMinutes, shouldLeaveNow, position, onShouldLeave]);

  const handleConfirmArrival = () => {
    setHasArrived(true);
    if (onArrived) onArrived();
  };

  const openMaps = () => {
    if (clinicLocation?.lat && clinicLocation?.lng) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${clinicLocation.lat},${clinicLocation.lng}&travelmode=driving`;
      window.open(url, '_blank');
    }
  };

  const formatDistance = (km) => {
    if (km < 1) {
      return `${Math.round(km * 1000)} m`;
    }
    return `${km.toFixed(1)} km`;
  };

  // UI según estado de ubicación
  if (locationStatus === 'requesting') {
    return (
      <div className="location-tracker requesting">
        <div className="location-icon pulse">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <p>Obteniendo tu ubicación...</p>
      </div>
    );
  }

  if (locationStatus === 'denied') {
    return (
      <div className="location-tracker denied">
        <div className="location-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
          </svg>
        </div>
        <div className="denied-content">
          <p>Ubicación no disponible</p>
          <span>Activa la ubicación para ver la distancia al consultorio</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`location-tracker ${shouldLeaveNow ? 'alert' : ''} ${hasArrived ? 'arrived' : ''}`}>
      {/* Notificación de "Sal ahora" */}
      {showNotification && !hasArrived && (
        <div className="leave-now-alert">
          <div className="alert-content">
            <div className="alert-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="alert-text">
              <strong>Sal ahora</strong>
              <span>Llegarás justo a tiempo</span>
            </div>
          </div>
          <button onClick={() => setShowNotification(false)} className="alert-dismiss">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      {/* Info de distancia */}
      <div className="location-info">
        <div className="distance-display">
          <div className="location-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div className="distance-data">
            <span className="distance-value">
              {distance ? formatDistance(distance) : '--'}
            </span>
            <span className="distance-label">del consultorio</span>
          </div>
        </div>

        <div className="travel-time">
          <div className="time-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="time-data">
            <span className="time-value">
              {travelTime ? `~${travelTime} min` : '--'}
            </span>
            <span className="time-label">de viaje</span>
          </div>
        </div>
      </div>

      {/* Acciones */}
      <div className="location-actions">
        {!hasArrived ? (
          <>
            <button onClick={openMaps} className="btn-navigate">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              Ver en mapa
            </button>

            {distance && distance < 0.5 && (
              <button onClick={handleConfirmArrival} className="btn-arrived">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Ya llegué
              </button>
            )}
          </>
        ) : (
          <div className="arrived-badge">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            En el consultorio
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationTracker;

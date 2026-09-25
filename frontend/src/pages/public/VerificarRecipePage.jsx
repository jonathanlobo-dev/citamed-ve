/**
 * VerificarRecipePage - CITAMED.VE
 * M03 / Semana 5 - Verificación pública de autenticidad de récipes médicos
 */

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import prescriptionAPI from '../../services/prescriptionService';
import './VerificarRecipePage.css';

const VerificarRecipePage = () => {
  const { code } = useParams();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const fetchVerification = async () => {
      if (!code) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);
      setNotFound(false);

      try {
        const response = await prescriptionAPI.verify(code);
        if (isMounted) {
          setData(response.data?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(err.response?.data?.error || 'Error al conectar con el servicio de verificación.');
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchVerification();

    return () => {
      isMounted = false;
    };
  }, [code]);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      return new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }).format(new Date(dateStr));
    } catch {
      return new Date(dateStr).toLocaleString();
    }
  };

  return (
    <div className="verificar-recipe-page">
      {/* Header institucional */}
      <header className="verificar-recipe-header">
        <div className="vr-header-content">
          <Link to="/" className="vr-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
            <span>CitaMed</span>
          </Link>
          <span className="vr-subtitle">Verificación Oficial de Récipes</span>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="verificar-recipe-main">
        {loading && (
          <div className="vr-loading">
            <div className="vr-spinner"></div>
            <p>Verificando autenticidad del récipe médico...</p>
          </div>
        )}

        {!loading && notFound && (
          <div className="vr-card">
            <div className="vr-banner not-found">
              <div className="vr-banner-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="vr-banner-text">
                <h2>Récipe no encontrado</h2>
                <p>No existe ningún récipe registrado en CitaMed con el código ingresado: <strong>{code}</strong>.</p>
              </div>
            </div>
            <div className="vr-details">
              <p>Por favor verifique que el código escaneado o escrito sea el correcto. Si el problema persiste, contacte directamente al médico emisor.</p>
            </div>
          </div>
        )}

        {!loading && error && (
          <div className="vr-error">
            <p>{error}</p>
          </div>
        )}

        {!loading && !notFound && !error && data && (
          <div className="vr-card">
            {/* Estado del Récipe */}
            {data.valid && data.status === 'active' ? (
              <div className="vr-banner valid">
                <div className="vr-banner-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="vr-banner-text">
                  <h2>Récipe Válido y Auténtico</h2>
                  <p>Documento médico electrónico certificado por la plataforma CitaMed.</p>
                </div>
              </div>
            ) : (
              <div className="vr-banner voided">
                <div className="vr-banner-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="vr-banner-text">
                  <h2>Récipe Anulado</h2>
                  <p>Este récipe fue anulado por el médico emisor y carece de validez médica o farmacéutica.</p>
                </div>
              </div>
            )}

            <div className="vr-details">
              {/* Información General */}
              <div className="vr-section">
                <h3>Información de Emisión</h3>
                <div className="vr-grid">
                  <div className="vr-item">
                    <span className="vr-label">Código de Verificación</span>
                    <span className="vr-value vr-code-tag">{code}</span>
                  </div>
                  <div className="vr-item">
                    <span className="vr-label">Fecha de Emisión</span>
                    <span className="vr-value">{formatDate(data.date)}</span>
                  </div>
                  <div className="vr-item">
                    <span className="vr-label">Paciente</span>
                    <span className="vr-value">Iniciales: {data.patientInitials || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Información del Profesional */}
              <div className="vr-section">
                <h3>Médico Emisor</h3>
                <div className="vr-grid">
                  <div className="vr-item">
                    <span className="vr-label">Profesional</span>
                    <span className="vr-value">{data.doctorName || 'Médico Tratante'}</span>
                  </div>
                  <div className="vr-item">
                    <span className="vr-label">Especialidad</span>
                    <span className="vr-value">{data.specialty || 'Medicina'}</span>
                  </div>
                  <div className="vr-item">
                    <span className="vr-label">N° MPPS</span>
                    <span className="vr-value">{data.mpps || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Medicamentos Prescritos */}
              <div className="vr-section">
                <h3>Medicamentos Prescritos ({data.medications?.length || 0})</h3>
                {data.medications && data.medications.length > 0 ? (
                  <ul className="vr-medications-list">
                    {data.medications.map((med, idx) => (
                      <li key={idx} className="vr-med-item">
                        <span className="vr-med-name">{idx + 1}. {med.medication}</span>
                        {med.presentation && (
                          <span className="vr-med-pres">{med.presentation}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="vr-label">No hay detalle de medicamentos visible.</p>
                )}
              </div>
            </div>

            {/* Aviso de Privacidad */}
            <div className="vr-privacy-notice">
              <strong>Protección de Datos Médicos:</strong> Por normativas de privacidad y secreto médico, la verificación pública solo muestra los datos estrictamente necesarios para dispensación y validación, protegiendo la identidad completa y diagnóstico del paciente.
            </div>
          </div>
        )}
      </main>

      <footer className="vr-footer">
        <p>CitaMed · Plataforma de Salud Digital · Venezuela</p>
      </footer>
    </div>
  );
};

export default VerificarRecipePage;

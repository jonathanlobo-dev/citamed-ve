import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Pill,
  Calendar,
  Clock,
  ShieldCheck,
  User,
  Stethoscope,
  FileCheck,
  FileBadge
} from 'lucide-react';
import './VerificarDocumentoPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default function VerificarDocumentoPage() {
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
        const response = await axios.get(
          `${API_URL}/medical-documents/verify/${encodeURIComponent(code.trim())}`
        );
        if (isMounted) {
          setData(response.data?.data || null);
        }
      } catch (err) {
        if (isMounted) {
          if (err.response?.status === 404) {
            setNotFound(true);
          } else {
            setError(
              err.response?.data?.message ||
                'Error al conectar con el servicio de verificación de CitaMed.'
            );
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
    // Fechas sin hora (YYYY-MM-DD, como las del reposo): se muestran tal cual, sin pasar por
    // Date, que las tomaría como medianoche UTC y en Caracas las correría al día anterior
    const dateOnly = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(dateStr));
    if (dateOnly) return `${dateOnly[3]}/${dateOnly[2]}/${dateOnly[1]}`;
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

  const getDocumentTypeInfo = (type) => {
    switch (type) {
      case 'prescription':
      case 'recipe':
        return { label: 'Récipe Médico', icon: Pill, color: 'purple' };
      case 'lab_order':
        return { label: 'Orden de Exámenes', icon: FileCheck, color: 'teal' };
      case 'rest_note':
        return { label: 'Reposo Médico', icon: Calendar, color: 'amber' };
      case 'certificate':
        return { label: 'Constancia Médica', icon: FileBadge, color: 'orange' };
      case 'medical_report':
        return { label: 'Informe Médico', icon: FileText, color: 'indigo' };
      default:
        return { label: 'Documento Médico', icon: FileText, color: 'slate' };
    }
  };

  const typeInfo = getDocumentTypeInfo(data?.type);
  const TypeIcon = typeInfo.icon;

  return (
    <div className="verificar-doc-page">
      {/* Header Institucional CitaMed */}
      <header className="verificar-doc-header">
        <div className="verificar-doc-header-content">
          <Link to="/" className="verificar-doc-logo" title="Ir al inicio de CitaMed">
            <div className="verificar-doc-logo-icon">
              <ShieldCheck className="w-5 h-5 text-white" />
            </div>
            <span className="verificar-doc-brand">
              CITAMED<span className="text-teal-400">.VE</span>
            </span>
          </Link>
          <span className="verificar-doc-badge">Verificación Oficial de Documentos</span>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="verificar-doc-main">
        {/* Loading */}
        {loading && (
          <div className="verificar-doc-loading">
            <div className="verificar-doc-spinner"></div>
            <p className="text-slate-700 font-semibold">Verificando autenticidad en CitaMed...</p>
            <p className="text-xs text-slate-500 mt-1">Consultando registro de firma electrónica</p>
          </div>
        )}

        {/* Not Found */}
        {!loading && notFound && (
          <div className="verificar-doc-card">
            <div className="verificar-doc-banner not-found">
              <div className="verificar-doc-banner-icon">
                <AlertTriangle className="w-8 h-8 text-amber-600" />
              </div>
              <div className="verificar-doc-banner-text">
                <h2>Documento no encontrado</h2>
                <p>
                  No existe ningún documento médico registrado en CitaMed con el código ingresado:{' '}
                  <strong>{code}</strong>.
                </p>
              </div>
            </div>
            <div className="verificar-doc-section">
              <p className="text-sm text-slate-600 leading-relaxed">
                Por favor comprueba que el código escrito o escaneado sea idéntico al que figura en el
                documento impreso o digital. Si consideras que se trata de un error, comunícate con el
                médico tratante o el centro de salud emisor.
              </p>
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="verificar-doc-card">
            <div className="verificar-doc-banner not-found">
              <div className="verificar-doc-banner-icon">
                <XCircle className="w-8 h-8 text-rose-600" />
              </div>
              <div className="verificar-doc-banner-text">
                <h2>Error de verificación</h2>
                <p>{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Documento encontrado */}
        {!loading && !notFound && !error && data && (
          <div className="verificar-doc-card">
            {/* Banner de Validez */}
            {data.valid && data.status === 'active' ? (
              <div className="verificar-doc-banner valid">
                <div className="verificar-doc-banner-icon">
                  <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                </div>
                <div className="verificar-doc-banner-text">
                  <h2>{typeInfo.label} Válido y Auténtico</h2>
                  <p>Documento médico electrónico oficial certificado por la plataforma CitaMed.</p>
                </div>
              </div>
            ) : (
              <div className="verificar-doc-banner voided">
                <div className="verificar-doc-banner-icon">
                  <XCircle className="w-8 h-8 text-rose-600" />
                </div>
                <div className="verificar-doc-banner-text">
                  <h2>Documento Anulado</h2>
                  <p>
                    Este documento fue anulado por el médico tratante y carece de validez médica o
                    farmacéutica.
                  </p>
                </div>
              </div>
            )}

            <div className="verificar-doc-details">
              {/* Información General del Documento */}
              <div className="verificar-doc-section">
                <div className="flex items-center justify-between mb-3 border-b pb-2">
                  <div className="flex items-center gap-2">
                    <TypeIcon className="w-5 h-5 text-primary" />
                    <h3 className="text-base font-bold text-slate-800">
                      Información del Documento
                    </h3>
                  </div>
                  <span className={`verificar-type-tag ${typeInfo.color}`}>{typeInfo.label}</span>
                </div>

                <div className="verificar-doc-grid">
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Código de Verificación</span>
                    <span className="verificar-doc-code-tag">{code}</span>
                  </div>
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Fecha de Emisión</span>
                    <span className="verificar-doc-val">{formatDate(data.date)}</span>
                  </div>
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Paciente</span>
                    <span className="verificar-doc-val">
                      Iniciales: <strong>{data.patientInitials || 'N/A'}</strong>
                    </span>
                  </div>
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Estado</span>
                    <span
                      className={`font-bold ${
                        data.status === 'active' ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {data.status === 'active' ? 'Activo / Válido' : 'Anulado'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Información del Profesional Médico */}
              <div className="verificar-doc-section">
                <div className="flex items-center gap-2 mb-3 border-b pb-2">
                  <Stethoscope className="w-5 h-5 text-primary" />
                  <h3 className="text-base font-bold text-slate-800">Profesional Emisor</h3>
                </div>

                <div className="verificar-doc-grid">
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Médico Tratante</span>
                    <span className="verificar-doc-val font-bold text-slate-900">
                      {data.doctorName || 'Médico Tratante'}
                    </span>
                  </div>
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">Especialidad</span>
                    <span className="verificar-doc-val">{data.specialty || 'Medicina'}</span>
                  </div>
                  <div className="verificar-doc-item">
                    <span className="verificar-doc-label">N° Registro MPPS</span>
                    <span className="verificar-doc-val">{data.mpps || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Resumen según tipo de documento */}

              {/* 1. Récipe */}
              {(data.type === 'prescription' || data.type === 'recipe') && (
                <div className="verificar-doc-section">
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <Pill className="w-5 h-5 text-purple-600" />
                    <h3 className="text-base font-bold text-slate-800">
                      Medicamentos Prescritos (
                      {(data.medications || data.summary?.medications || []).length})
                    </h3>
                  </div>

                  {(data.medications || data.summary?.medications || []).length > 0 ? (
                    <ul className="verificar-doc-med-list">
                      {(data.medications || data.summary?.medications || []).map((med, idx) => (
                        <li key={idx} className="verificar-doc-med-item">
                          <span className="font-bold text-slate-800">
                            {idx + 1}. {med.medication}
                          </span>
                          {med.presentation && (
                            <span className="text-xs text-slate-500 ml-2">
                              ({med.presentation})
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs text-slate-500 italic">
                      Detalle de medicamentos disponible en el documento físico.
                    </p>
                  )}
                </div>
              )}

              {/* 2. Orden de exámenes */}
              {data.type === 'lab_order' && (
                <div className="verificar-doc-section">
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <FileCheck className="w-5 h-5 text-teal-600" />
                    <h3 className="text-base font-bold text-slate-800">
                      Exámenes de Laboratorio Solicitados
                    </h3>
                  </div>

                  {data.summary?.exams && data.summary.exams.length > 0 ? (
                    <ul className="verificar-doc-med-list">
                      {data.summary.exams.map((exam, idx) => (
                        <li key={idx} className="verificar-doc-med-item">
                          <span className="font-semibold text-slate-800">
                            ✓ {typeof exam === 'string' ? exam : exam.name}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  {data.summary?.otherExams && (
                    <div className="mt-2 text-xs text-slate-700 bg-slate-50 p-2.5 rounded border">
                      <strong>Otros exámenes solicitados:</strong> {data.summary.otherExams}
                    </div>
                  )}
                </div>
              )}

              {/* 3. Reposo médico */}
              {data.type === 'rest_note' && (
                <div className="verificar-doc-section">
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <Calendar className="w-5 h-5 text-amber-600" />
                    <h3 className="text-base font-bold text-slate-800">
                      Detalle del Reposo Médico
                    </h3>
                  </div>

                  <div className="verificar-doc-grid">
                    <div className="verificar-doc-item">
                      <span className="verificar-doc-label">Días de Reposo</span>
                      <span className="verificar-doc-val text-amber-900 font-extrabold text-base">
                        {data.summary?.days || 'N/A'} días
                      </span>
                    </div>
                    <div className="verificar-doc-item">
                      <span className="verificar-doc-label">Desde</span>
                      <span className="verificar-doc-val">
                        {formatDate(data.summary?.startDate)}
                      </span>
                    </div>
                    <div className="verificar-doc-item">
                      <span className="verificar-doc-label">Hasta (inclusive)</span>
                      <span className="verificar-doc-val">
                        {formatDate(data.summary?.endDate)}
                      </span>
                    </div>
                    {data.summary?.diagnosis && (
                      <div className="verificar-doc-item col-span-full">
                        <span className="verificar-doc-label">Diagnóstico Autorizado</span>
                        <span className="verificar-doc-val font-semibold text-slate-800">
                          {data.summary.diagnosis}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Constancia médica */}
              {data.type === 'certificate' && (
                <div className="verificar-doc-section">
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <FileBadge className="w-5 h-5 text-orange-600" />
                    <h3 className="text-base font-bold text-slate-800">
                      Constancia de Asistencia
                    </h3>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    Se hace constar que el paciente estuvo presente para atención médica el día{' '}
                    <strong>{formatDate(data.date)}</strong>
                    {data.summary?.attendedFrom && ` desde las ${data.summary.attendedFrom}`}
                    {data.summary?.attendedTo && ` hasta las ${data.summary.attendedTo}`}.
                  </p>
                </div>
              )}

              {/* 5. Informe médico */}
              {data.type === 'medical_report' && (
                <div className="verificar-doc-section">
                  <div className="flex items-center gap-2 mb-3 border-b pb-2">
                    <FileText className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-base font-bold text-slate-800">Informe Médico</h3>
                  </div>

                  <p className="text-sm text-slate-700 leading-relaxed">
                    Informe médico oficial emitido por el profesional tratante. Por secreto médico y
                    estricta confidencialidad clínica, el contenido del informe permanece en custodia del
                    paciente y su médico.
                  </p>
                </div>
              )}

              {/* Aviso de Privacidad y Secreto Médico */}
              <div className="verificar-doc-privacy">
                <strong>Protección de Datos Médicos:</strong> Por normativas de privacidad de la
                República Bolivariana de Venezuela y secreto profesional médico, esta página oficial
                solo exhibe los datos indispensables para validación institucional, dispensación
                farmacéutica o justificación legal, salvaguardando la identidad completa y diagnóstico
                confidencial del paciente.
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="verificar-doc-footer">
        <p>CitaMed · Plataforma de Salud Digital · Venezuela</p>
      </footer>
    </div>
  );
}

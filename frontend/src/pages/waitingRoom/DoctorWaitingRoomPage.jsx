/**
 * DoctorWaitingRoomPage - CITAMED.VE
 * M03 - Sala de Espera Virtual
 *
 * Dashboard del doctor para manejar la cola en tiempo real
 */

import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import DoctorQueueDashboard from '../../components/waitingRoom/DoctorQueueDashboard';
import useWaitingRoom from '../../hooks/useWaitingRoom';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import prescriptionAPI from '../../services/prescriptionService';
import { shareRecipe } from '../../utils/shareRecipe';
import './DoctorWaitingRoomPage.css';

const API_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

const DoctorWaitingRoomPage = () => {
  const navigate = useNavigate();
  const { user: authUser, logout } = useAuth();
  const token = localStorage.getItem('citamed_token');
  const user = authUser || JSON.parse(localStorage.getItem('citamed_user') || '{}');

  const {
    connected,
    reconnecting,
    error,
    queue,
    stats,
    goOnline,
    goOffline,
    callNextPatient,
    callSpecificPatient
  } = useWaitingRoom(token, 'doctor');

  // Persistir estado online en localStorage
  const [isOnline, setIsOnline] = useState(() => {
    const saved = localStorage.getItem('citamed_doctor_online');
    return saved === 'true';
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [localQueue, setLocalQueue] = useState([]);
  const [localStats, setLocalStats] = useState({});

  // Modal de finalizar consulta
  const [endModal, setEndModal] = useState({
    open: false,
    queueEntryId: null,
    appointmentId: null,
    patientName: '',
    patientPhone: '',
    doctorNotes: '',
    diagnosis: '',
    showRecipe: false,
    items: [],
    indications: '',
    prescriptionSuccess: null
  });

  // Expediente mínimo y alergias del paciente
  const [currentPatientHistory, setCurrentPatientHistory] = useState(null);
  const [loadingCurrentHistory, setLoadingCurrentHistory] = useState(false);
  const [modalHistory, setModalHistory] = useState(null);
  const [loadingModalHistory, setLoadingModalHistory] = useState(false);
  const [showModalHistory, setShowModalHistory] = useState(false);

  // Sincronizar historial del paciente actualmente en consulta
  useEffect(() => {
    const inConsultation = localQueue.find((p) => p.status === 'in_consultation');
    const pId = inConsultation?.patientId || inConsultation?.patient?.id;
    if (pId) {
      setLoadingCurrentHistory(true);
      appointmentService
        .getPatientHistory(pId)
        .then((res) => setCurrentPatientHistory(res.data))
        .catch((err) => {
          console.error('Error cargando historial de paciente en consulta:', err);
          setCurrentPatientHistory(null);
        })
        .finally(() => setLoadingCurrentHistory(false));
    } else {
      setCurrentPatientHistory(null);
    }
  }, [localQueue]);

  // Cargar cola inicial via API
  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const response = await fetch(`${API_URL}/api/waiting-room/queue`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setLocalQueue(data.data?.queue || []);
          setLocalStats(data.data?.stats || {});
        } else {
          console.warn('[DoctorWaitingRoom] API responded with:', response.status);
        }
      } catch (err) {
        console.error('Error fetching queue:', err);
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchQueue();
    } else {
      // Sin token, dejar de cargar y mostrar la página vacía
      setLoading(false);
    }
  }, [token]);

  // Actualizar con datos de WebSocket
  useEffect(() => {
    if (queue.length > 0) {
      setLocalQueue(queue);
    }
    if (Object.keys(stats).length > 0) {
      setLocalStats(stats);
    }
  }, [queue, stats]);

  const handleGoOnline = () => {
    goOnline();
    setIsOnline(true);
    localStorage.setItem('citamed_doctor_online', 'true');
  };

  const handleGoOffline = () => {
    goOffline();
    setIsOnline(false);
    localStorage.setItem('citamed_doctor_online', 'false');
  };

  // Al conectarse el WebSocket, re-emitir estado online si estaba activo
  useEffect(() => {
    if (connected && isOnline) {
      goOnline();
    }
  }, [connected]);

  const handleCallNext = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/call-next`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        callNextPatient();
        await refreshQueue();
      }
    } catch (err) {
      console.error('Error calling next:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCallPatient = async (queueEntryId) => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/call/${queueEntryId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        callSpecificPatient(queueEntryId);
        await refreshQueue();
      }
    } catch (err) {
      console.error('Error calling patient:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartConsultation = async (queueEntryId) => {
    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/start-consultation/${queueEntryId}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        await refreshQueue();
      }
    } catch (err) {
      console.error('Error starting consultation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEndModal = (queueEntryId) => {
    const entry = localQueue.find((q) => q.id === queueEntryId);
    const patient = entry?.patient;
    const pId = entry?.patientId || patient?.id;
    setEndModal({
      open: true,
      queueEntryId,
      appointmentId: entry?.appointmentId || entry?.appointment?.id,
      patientName: `${patient?.firstName || ''} ${patient?.lastName || ''}`.trim(),
      patientPhone: patient?.phone || '',
      doctorNotes: '',
      diagnosis: '',
      showRecipe: false,
      items: [],
      indications: '',
      prescriptionSuccess: null
    });

    setModalHistory(null);
    setShowModalHistory(false);
    if (pId) {
      setLoadingModalHistory(true);
      appointmentService
        .getPatientHistory(pId)
        .then((res) => setModalHistory(res.data))
        .catch((err) => {
          console.error('Error cargando historial de paciente en modal:', err);
          setModalHistory(null);
        })
        .finally(() => setLoadingModalHistory(false));
    }
  };

  const handleCloseEndModal = () => {
    setEndModal({
      open: false,
      queueEntryId: null,
      appointmentId: null,
      patientName: '',
      patientPhone: '',
      doctorNotes: '',
      diagnosis: '',
      showRecipe: false,
      items: [],
      indications: '',
      prescriptionSuccess: null
    });
    setModalHistory(null);
    setShowModalHistory(false);
  };

  const handleAddMedication = () => {
    setEndModal((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        { medication: '', presentation: '', dose: '', frequency: '', duration: '', instructions: '' }
      ]
    }));
  };

  const handleUpdateMedication = (index, field, value) => {
    setEndModal((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      return { ...prev, items: newItems };
    });
  };

  const handleRemoveMedication = (index) => {
    setEndModal((prev) => ({
      ...prev,
      items: prev.items.filter((_, idx) => idx !== index)
    }));
  };

  const handleDownloadPrescriptionPdf = async (prescriptionId) => {
    try {
      const response = await prescriptionAPI.downloadPdf(prescriptionId);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `recipe-CitaMed-${prescriptionId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Error al descargar el PDF del récipe');
    }
  };

  const handleSharePrescriptionWhatsApp = async (prescription) => {
    try {
      const response = await prescriptionAPI.downloadPdf(prescription.id);
      const blob = new Blob([response.data], { type: 'application/pdf' });
      await shareRecipe({
        pdfBlob: blob,
        verificationCode: prescription.verificationCode,
        patientName: endModal.patientName,
        patientPhone: endModal.patientPhone,
        doctorName: `Dr(a). ${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
        date: new Intl.DateTimeFormat('es-VE', { timeZone: 'America/Caracas', day: '2-digit', month: '2-digit', year: 'numeric' }).format(new Date()),
        isPatientSharing: false
      });
    } catch (err) {
      console.error('Error compartiendo récipe:', err);
      alert('Error al compartir récipe por WhatsApp');
    }
  };

  const handleEndConsultationSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!endModal.queueEntryId) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/end-consultation/${endModal.queueEntryId}`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            doctorNotes: endModal.doctorNotes.trim() || undefined,
            diagnosis: endModal.diagnosis.trim() || undefined
          })
        }
      );

      if (!response.ok) {
        throw new Error('Error al finalizar consulta');
      }

      // Si se configuró récipe médico con medicamentos válidos
      const validItems = (endModal.items || []).filter((i) => i.medication && i.medication.trim());
      if (endModal.showRecipe && validItems.length > 0 && endModal.appointmentId) {
        try {
          const prescRes = await prescriptionAPI.create({
            appointmentId: endModal.appointmentId,
            items: validItems,
            indications: endModal.indications.trim() || undefined
          });

          const createdPresc = prescRes.data?.data;
          setEndModal((prev) => ({
            ...prev,
            prescriptionSuccess: createdPresc
          }));
          await refreshQueue();
          setActionLoading(false);
          return;
        } catch (prescErr) {
          console.error('Error emitiendo récipe:', prescErr);
          alert('Consulta finalizada, pero hubo un error con el récipe: ' + (prescErr.response?.data?.error || prescErr.message));
        }
      }

      handleCloseEndModal();
      await refreshQueue();
    } catch (err) {
      console.error('Error ending consultation:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkNoShow = async (queueEntryId) => {
    if (!confirm('¿Marcar paciente como no presentado?')) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `${API_URL}/api/waiting-room/no-show/${queueEntryId}`,
        {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.ok) {
        await refreshQueue();
      }
    } catch (err) {
      console.error('Error marking no-show:', err);
    } finally {
      setActionLoading(false);
    }
  };

  const refreshQueue = async () => {
    try {
      const response = await fetch(`${API_URL}/api/waiting-room/queue`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setLocalQueue(data.data.queue || []);
        setLocalStats(data.data.stats || {});
      }
    } catch (err) {
      console.error('Error refreshing queue:', err);
    }
  };

  if (loading) {
    return (
      <div className="doctor-waiting-room loading">
        <div className="spinner"></div>
        <p>Cargando panel de consultas...</p>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="doctor-waiting-room error">
        <p>Sesión no válida. Por favor inicie sesión nuevamente.</p>
        <button onClick={() => navigate('/login')} className="btn-primary">
          Ir a Login
        </button>
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="doctor-waiting-room">
      {/* Header de navegación */}
      <header className="doctor-wr-header">
        <div className="header-left">
          <Link to="/medico/dashboard" className="btn-back" title="Volver al Dashboard">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="24" height="24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div className="header-brand">
            <h1>Sala de Espera Virtual</h1>
            <span className="header-subtitle">Panel del Doctor</span>
          </div>
        </div>

        <div className="header-center">
          <div className={`connection-status ${connected ? 'connected' : reconnecting ? 'reconnecting' : 'disconnected'}`}>
            <span className="status-dot"></span>
            <span className="status-text">{connected ? 'Conectado' : reconnecting ? 'Reconectando...' : 'Sin conexión'}</span>
          </div>
        </div>

        <div className="header-right">
          <nav className="header-nav">
            <Link to="/medico/dashboard" className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Dashboard
            </Link>
            <Link to="/medico/agenda" className="nav-link">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Agenda
            </Link>
          </nav>

          <div className="user-menu">
            <span className="user-name">Dr. {user?.firstName || ''}</span>
            <button onClick={handleLogout} className="btn-logout" title="Cerrar sesión">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          {error}
        </div>
      )}

      {reconnecting && (
        <div className="connection-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Conexión perdida. Reconectando...
        </div>
      )}

      {!connected && !reconnecting && (
        <div className="connection-warning">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="20" height="20">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
          </svg>
          Sin conexión en tiempo real. Mostrando datos actualizados periódicamente.
        </div>
      )}

      <main className="doctor-wr-content">
        <DoctorQueueDashboard
          queue={localQueue}
          stats={localStats}
          isOnline={isOnline}
          actionLoading={actionLoading}
          onGoOnline={handleGoOnline}
          onGoOffline={handleGoOffline}
          onCallNext={handleCallNext}
          onCallPatient={handleCallPatient}
          onStartConsultation={handleStartConsultation}
          onEndConsultation={handleOpenEndModal}
          onMarkNoShow={handleMarkNoShow}
          currentPatientHistory={currentPatientHistory}
          loadingCurrentHistory={loadingCurrentHistory}
          onDownloadPrescriptionPdf={handleDownloadPrescriptionPdf}
        />
      </main>

      {/* Modal de Finalizar Consulta con Notas y Diagnóstico */}
      {endModal.open && (
        <div className="wr-modal-overlay" onClick={handleCloseEndModal}>
          <div className="wr-modal-container" onClick={(e) => e.stopPropagation()}>
            <div className="wr-modal-header">
              <h3>Finalizar Consulta</h3>
              <button
                type="button"
                className="wr-modal-close"
                onClick={handleCloseEndModal}
                disabled={actionLoading}
              >
                &times;
              </button>
            </div>
            {endModal.prescriptionSuccess ? (
              <div className="wr-prescription-success">
                <div className="wr-success-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="32" height="32">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3>¡Consulta finalizada y récipe emitido!</h3>
                <p>El récipe médico ha sido registrado y certificado en la plataforma.</p>
                <div className="wr-code-tag">
                  Código: <strong>{endModal.prescriptionSuccess.verificationCode}</strong>
                </div>

                <div className="wr-prescription-actions">
                  <button
                    type="button"
                    className="btn-pdf-download"
                    onClick={() => handleDownloadPrescriptionPdf(endModal.prescriptionSuccess.id)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar récipe (PDF)
                  </button>
                  <button
                    type="button"
                    className="btn-whatsapp-share"
                    onClick={() => handleSharePrescriptionWhatsApp(endModal.prescriptionSuccess)}
                  >
                    <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.084-1.84-.413-1.467-.604-2.42-2.102-2.493-2.2-.074-.098-.592-.787-.592-1.5 0-.713.375-1.063.51-1.206.135-.144.295-.18.393-.18.099 0 .197.001.283.006.09.004.21-.034.328.25.12.288.412 1.008.448 1.082.036.074.06.16.011.258-.049.098-.073.16-.146.246-.073.086-.154.192-.22.258-.074.073-.151.152-.065.3.086.148.382.631.821 1.022.564.502 1.04.658 1.188.732.148.074.234.062.321-.037.086-.099.37-.43.469-.578.099-.148.197-.123.33-.074.133.049.843.398.988.47.145.074.242.111.278.172.036.062.036.357-.108.762z" />
                    </svg>
                    Enviar por WhatsApp
                  </button>
                </div>

                <div className="wr-modal-footer" style={{ width: '100%', marginTop: '16px' }}>
                  <button
                    type="button"
                    className="btn-primary"
                    onClick={handleCloseEndModal}
                  >
                    Finalizar y Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleEndConsultationSubmit}>
                <div className="wr-modal-body">
                  {/* Expediente mínimo: Consultas anteriores con este paciente */}
                  <div className="wr-modal-history-box">
                    <button
                      type="button"
                      className="wr-modal-history-toggle"
                      onClick={() => setShowModalHistory(!showModalHistory)}
                    >
                      <span>📋 Consultas anteriores con este paciente {modalHistory ? `(${modalHistory.history?.length || 0})` : ''}</span>
                      <span>{showModalHistory ? '▲ Ocultar' : '▼ Ver'}</span>
                    </button>
                    {showModalHistory && (
                      <div className="wr-modal-history-content">
                        {loadingModalHistory ? (
                          <p className="wr-history-note">Cargando consultas anteriores...</p>
                        ) : !modalHistory || modalHistory.history?.length === 0 ? (
                          <p className="wr-history-note empty">Primera consulta con este paciente</p>
                        ) : (
                          <div className="wr-history-items-list">
                            {modalHistory.history.map((past) => (
                              <div key={past.id} className="wr-past-item">
                                <div className="wr-past-head">
                                  <strong>{past.appointmentDate} · {past.appointmentTime}</strong>
                                  <span>{past.reasonForVisit || 'Consulta general'}</span>
                                </div>
                                {past.diagnosis && (
                                  <div className="wr-past-row">
                                    <strong>Diagnóstico:</strong> {past.diagnosis}
                                  </div>
                                )}
                                {past.doctorNotes && (
                                  <div className="wr-past-row">
                                    <strong>Notas:</strong> {past.doctorNotes}
                                  </div>
                                )}
                                {past.prescriptions?.length > 0 && (
                                  <div className="wr-past-recipes">
                                    <strong>Récipes:</strong>
                                    {past.prescriptions.map((p) => (
                                      <div key={p.id} className="wr-past-recipe-chip">
                                        <span>{p.verificationCode} ({p.items?.map((i) => i.medication).join(', ')})</span>
                                        <button
                                          type="button"
                                          className="wr-btn-mini-pdf"
                                          onClick={() => handleDownloadPrescriptionPdf(p.id)}
                                        >
                                          PDF
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="wr-modal-field">
                    <label htmlFor="modal-diagnosis">Diagnóstico (opcional)</label>
                    <input
                      id="modal-diagnosis"
                      type="text"
                      placeholder="Ej. Rinofaringitis aguda, Control de rutina..."
                      value={endModal.diagnosis}
                      onChange={(e) => setEndModal((prev) => ({ ...prev, diagnosis: e.target.value }))}
                      disabled={actionLoading}
                    />
                  </div>
                  <div className="wr-modal-field">
                    <label htmlFor="modal-notes">Notas médicas / Observaciones clínicas (opcional)</label>
                    <textarea
                      id="modal-notes"
                      placeholder="Detalles de la consulta, evolución o indicaciones generales..."
                      value={endModal.doctorNotes}
                      onChange={(e) => setEndModal((prev) => ({ ...prev, doctorNotes: e.target.value }))}
                      disabled={actionLoading}
                    />
                  </div>

                  {/* Alerta de alergias registradas del paciente */}
                  {modalHistory?.allergies?.length > 0 && (
                    <div className="wr-allergy-alert">
                      <strong>⚠️ Alergias del paciente:</strong>{' '}
                      {modalHistory.allergies.map(a => `${a.allergen}${a.severity ? ` (${a.severity}${a.reaction ? `: ${a.reaction}` : ''})` : ''}`).join(', ')}
                    </div>
                  )}

                  {/* Sección opcional: Récipe Médico */}
                  <div className="wr-modal-field">
                    <label
                      className="wr-recipe-toggle"
                      onClick={() =>
                        setEndModal((prev) => ({
                          ...prev,
                          showRecipe: !prev.showRecipe,
                          items:
                            !prev.showRecipe && prev.items.length === 0
                              ? [
                                  {
                                    medication: '',
                                    presentation: '',
                                    dose: '',
                                    frequency: '',
                                    duration: '',
                                    instructions: ''
                                  }
                                ]
                              : prev.items
                        }))
                      }
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <input
                          type="checkbox"
                          checked={endModal.showRecipe}
                          onChange={() => {}}
                          style={{ width: 'auto', margin: 0 }}
                        />
                        Emitir Récipe Médico Electrónico
                      </span>
                      <small style={{ color: '#0d9488', fontWeight: 600 }}>
                        {endModal.showRecipe ? 'Ocultar' : 'Agregar medicamentos'}
                      </small>
                    </label>
                  </div>

                  {endModal.showRecipe && (
                    <div className="wr-recipe-box">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#334155' }}>
                          Medicamentos Prescritos ({endModal.items.length})
                        </span>
                        <button
                          type="button"
                          className="btn-add-med"
                          onClick={handleAddMedication}
                          disabled={actionLoading}
                        >
                          + Agregar Medicamento
                        </button>
                      </div>

                      {endModal.items.map((item, idx) => (
                        <div key={idx} className="wr-med-card">
                          <div className="wr-med-card-header">
                            <span>Medicamento #{idx + 1}</span>
                            {endModal.items.length > 1 && (
                              <button
                                type="button"
                                className="wr-btn-remove-med"
                                onClick={() => handleRemoveMedication(idx)}
                              >
                                Eliminar
                              </button>
                            )}
                          </div>
                          <div className="wr-med-grid">
                            <div className="wr-med-grid-full">
                              <input
                                type="text"
                                placeholder="Nombre del medicamento (ej. Amoxicilina + Ác. Clavulánico) *"
                                value={item.medication}
                                onChange={(e) => handleUpdateMedication(idx, 'medication', e.target.value)}
                                disabled={actionLoading}
                                required
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Presentación (ej. Tabletas 875/125 mg)"
                                value={item.presentation}
                                onChange={(e) => handleUpdateMedication(idx, 'presentation', e.target.value)}
                                disabled={actionLoading}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Dosis (ej. 1 tableta)"
                                value={item.dose}
                                onChange={(e) => handleUpdateMedication(idx, 'dose', e.target.value)}
                                disabled={actionLoading}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Frecuencia (ej. Cada 12 horas)"
                                value={item.frequency}
                                onChange={(e) => handleUpdateMedication(idx, 'frequency', e.target.value)}
                                disabled={actionLoading}
                              />
                            </div>
                            <div>
                              <input
                                type="text"
                                placeholder="Duración (ej. 7 días)"
                                value={item.duration}
                                onChange={(e) => handleUpdateMedication(idx, 'duration', e.target.value)}
                                disabled={actionLoading}
                              />
                            </div>
                            <div className="wr-med-grid-full">
                              <input
                                type="text"
                                placeholder="Instrucciones específicas (ej. Tomar con las comidas)"
                                value={item.instructions}
                                onChange={(e) => handleUpdateMedication(idx, 'instructions', e.target.value)}
                                disabled={actionLoading}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <div className="wr-modal-field" style={{ marginTop: '8px' }}>
                        <label htmlFor="modal-indications">Indicaciones generales del récipe (opcional)</label>
                        <textarea
                          id="modal-indications"
                          placeholder="Reposo, dieta, abundantes líquidos, signos de alarma..."
                          value={endModal.indications}
                          onChange={(e) => setEndModal((prev) => ({ ...prev, indications: e.target.value }))}
                          disabled={actionLoading}
                          style={{ minHeight: '60px' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <div className="wr-modal-footer">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={handleCloseEndModal}
                    disabled={actionLoading}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Guardando...' : 'Finalizar Consulta'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorWaitingRoomPage;

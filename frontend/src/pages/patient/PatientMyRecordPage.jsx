import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Activity,
  FileText,
  Clock,
  Paperclip,
  User,
  Heart,
  AlertTriangle,
  Pill,
  Download,
  Share2,
  QrCode,
  Plus,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Stethoscope,
  FileCheck,
  FileBadge,
  Calendar,
  X,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import clinicalRecordService from '../../services/clinicalRecordService';
import medicalDocumentService from '../../services/medicalDocumentService';
import prescriptionAPI from '../../services/prescriptionService';
import patientService from '../../services/patientService';
import { prefetchDocumentPdf, shareDocument } from '../../utils/shareDocument';
import './PatientMyRecordPage.css';

export default function PatientMyRecordPage() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [record, setRecord] = useState(null);

  // Tabs de navegación
  const [activeTab, setActiveTab] = useState('consultas'); // consultas | documentos | archivos | datos_medicos

  // SideDrawers
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedQrDoc, setSelectedQrDoc] = useState(null);
  const [drawerType, setDrawerType] = useState(null); // 'consultation' | 'qr_modal' | 'new_allergy' | 'new_condition' | 'new_medication' | 'upload_file'

  // Confirmaciones cortas
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { type, id, title }
  const [deleting, setDeleting] = useState(false);

  // Estado copiado al portapapeles
  const [copiedLink, setCopiedLink] = useState(false);

  // Formularios de SideDrawer
  const [allergyForm, setAllergyForm] = useState({
    allergen: '',
    allergyType: 'medication',
    severity: 'mild',
    reaction: '',
    notes: ''
  });
  const [conditionForm, setConditionForm] = useState({
    condition: '',
    status: 'active',
    severity: 'moderate',
    diagnosedDate: '',
    notes: ''
  });
  const [medicationForm, setMedicationForm] = useState({
    medicationName: '',
    dose: '',
    frequency: '',
    route: 'oral',
    instructions: '',
    isActive: true
  });
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'lab_result',
    description: '',
    file: null
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Carga de la historia clínica del paciente
  const fetchMyRecord = () => {
    setLoading(true);
    setError(null);

    clinicalRecordService
      .getMyClinicalRecord()
      .then((res) => {
        if (res.success && res.data) {
          setRecord(res.data);

          // Prefetch de PDFs para compartir instantáneamente por WhatsApp
          const docs = res.data.documents || [];
          docs.forEach((doc) => {
            if (doc.type !== 'attachment') {
              prefetchDocumentPdf(doc.type, doc.id, medicalDocumentService.downloadPdf);
            }
          });
          const prescriptions = res.data.prescriptions || [];
          prescriptions.forEach((p) => {
            prefetchDocumentPdf('prescription', p.id, prescriptionAPI.downloadPdf);
          });
        }
      })
      .catch((err) => {
        console.error('Error al cargar Mi Historia:', err);
        setError(
          err.response?.data?.message || 'Error al conectar con el servidor para consultar tu historial médico.'
        );
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchMyRecord();
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    try {
      const [y, m, d] = String(dateStr).slice(0, 10).split('-');
      return `${d}/${m}/${y}`;
    } catch {
      return dateStr;
    }
  };

  // Descarga de PDF
  const handleDownloadPdf = async (type, id, title = 'documento') => {
    try {
      const res =
        type === 'prescription'
          ? await prescriptionAPI.downloadPdf(id)
          : await medicalDocumentService.downloadPdf(id);

      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${title.toLowerCase().replace(/\s+/g, '-')}-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar PDF:', err);
      alert('Error al descargar el archivo PDF. Intente nuevamente.');
    }
  };

  // Compartir por WhatsApp (SIN AWAIT EN EL CLIC, isPatientSharing: true)
  const handleShare = (type, doc) => {
    const docDoctor = doc.doctor || {};
    const docTitle = docDoctor.gender === 'femenino' ? 'la Dra.' : 'el Dr.';
    const doctorFullName = docDoctor.firstName
      ? `${docTitle} ${docDoctor.firstName} ${docDoctor.lastName || ''}`.trim()
      : 'tu médico tratante';

    shareDocument({
      type,
      documentId: doc.id,
      verificationCode: doc.verificationCode,
      patientName: record?.patient?.fullName || 'Paciente',
      doctorName: doctorFullName,
      date: formatDate(doc.createdAt || doc.date),
      isPatientSharing: true
    });
  };

  // Abrir archivo adjunto en nueva pestaña con URL firmada
  const handleOpenFile = async (docId) => {
    try {
      const res = await medicalDocumentService.getFileSignedUrl(docId);
      if (res.success && res.data?.signedUrl) {
        window.open(res.data.signedUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Error al abrir archivo adjunto:', err);
      alert('Error al abrir el archivo adjunto.');
    }
  };

  // Copiar enlace de verificación al portapapeles
  const handleCopyLink = (code) => {
    const link = `${window.location.origin}/verificar/${code}`;
    navigator.clipboard.writeText(link).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  // Ejecutar eliminación confirmada (alergia, condición, medicamento o archivo)
  const handleConfirmDelete = async () => {
    if (!deleteConfirm) return;
    setDeleting(true);
    try {
      if (deleteConfirm.type === 'file') {
        await medicalDocumentService.deleteAttachmentFile(deleteConfirm.id);
      } else if (deleteConfirm.type === 'allergy') {
        await patientService.deleteAllergy(deleteConfirm.id);
      } else if (deleteConfirm.type === 'condition') {
        await patientService.deleteMedicalHistory(deleteConfirm.id);
      } else if (deleteConfirm.type === 'medication') {
        await patientService.deleteMedication(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      fetchMyRecord();
    } catch (err) {
      console.error('Error al eliminar registro:', err);
      alert(err.response?.data?.message || 'Error al eliminar el registro.');
    } finally {
      setDeleting(false);
    }
  };

  // Guardar nueva alergia
  const handleSaveAllergy = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergen.trim()) return;
    setSubmittingAction(true);
    try {
      await patientService.addAllergy(allergyForm);
      setDrawerType(null);
      setAllergyForm({ allergen: '', allergyType: 'medication', severity: 'mild', reaction: '', notes: '' });
      fetchMyRecord();
    } catch (err) {
      console.error('Error al agregar alergia:', err);
      alert(err.response?.data?.message || 'Error al guardar la alergia.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Guardar nueva condición
  const handleSaveCondition = async (e) => {
    e.preventDefault();
    if (!conditionForm.condition.trim()) return;
    setSubmittingAction(true);
    try {
      await patientService.addMedicalHistory(conditionForm);
      setDrawerType(null);
      setConditionForm({ condition: '', status: 'active', severity: 'moderate', diagnosedDate: '', notes: '' });
      fetchMyRecord();
    } catch (err) {
      console.error('Error al agregar antecedente:', err);
      alert(err.response?.data?.message || 'Error al guardar el antecedente.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Guardar nuevo medicamento habitual
  const handleSaveMedication = async (e) => {
    e.preventDefault();
    if (!medicationForm.medicationName.trim()) return;
    setSubmittingAction(true);
    try {
      await patientService.addMedication(medicationForm);
      setDrawerType(null);
      setMedicationForm({ medicationName: '', dose: '', frequency: '', route: 'oral', instructions: '', isActive: true });
      fetchMyRecord();
    } catch (err) {
      console.error('Error al agregar medicamento:', err);
      alert(err.response?.data?.message || 'Error al guardar el medicamento.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Subir archivo adjunto del paciente
  const handleUploadFile = async (e) => {
    e.preventDefault();
    if (!uploadForm.file || !uploadForm.title.trim()) return;
    setSubmittingAction(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadForm.file);
      formData.append('title', uploadForm.title.trim());
      formData.append('category', uploadForm.category);
      if (uploadForm.description.trim()) {
        formData.append('description', uploadForm.description.trim());
      }

      await medicalDocumentService.uploadAttachment(formData);
      setDrawerType(null);
      setUploadForm({ title: '', category: 'lab_result', description: '', file: null });
      fetchMyRecord();
    } catch (err) {
      console.error('Error al subir archivo:', err);
      alert(err.response?.data?.message || 'Error al subir el archivo.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Render Loading o Error
  if (loading) {
    return (
      <div className="patient-my-record-page">
        <Navbar />
        <main className="patient-my-record-container">
          <div className="patient-my-record-loading">
            <div className="patient-my-record-spinner"></div>
            <p>Cargando tu historial médico...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="patient-my-record-page">
        <Navbar />
        <main className="patient-my-record-container">
          <div className="patient-my-record-error">
            <AlertCircle className="w-6 h-6 text-rose-600" />
            <p>{error || 'No se pudo cargar tu historial clínico.'}</p>
            <button
              type="button"
              className="patient-my-record-retry-btn"
              onClick={fetchMyRecord}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const {
    patient,
    allergies = [],
    medicalHistory = [],
    medications = [],
    consultations = [],
    documents = [],
    prescriptions = [],
    attachments = []
  } = record;

  const totalDocuments = documents.length + prescriptions.length;

  return (
    <div className="patient-my-record-page">
      <Navbar />

      <main className="patient-my-record-container">
        {/* Encabezado Mobile-First */}
        <header className="patient-my-record-header">
          <div className="patient-my-record-header-badge">
            <Activity className="w-3.5 h-3.5 mr-1 text-teal-600" />
            <span>Expediente Clínico Personal</span>
          </div>
          <h1 className="patient-my-record-title">Mi Historia</h1>
          <p className="patient-my-record-subtitle">
            Hola, {patient.firstName}. Aquí puedes consultar tus consultas, récipes, órdenes médicas
            y gestionar tus antecedentes clínicos.
          </p>
        </header>

        {/* Barra de pestañas móvil scrollable */}
        <nav className="patient-my-record-tabs-bar">
          <button
            type="button"
            className={`patient-my-record-tab-btn ${activeTab === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultas')}
          >
            <Stethoscope className="w-4 h-4 mr-1.5" />
            <span>Consultas</span>
            <span className="badge">{consultations.length}</span>
          </button>
          <button
            type="button"
            className={`patient-my-record-tab-btn ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FileText className="w-4 h-4 mr-1.5" />
            <span>Récipes y Docs</span>
            <span className="badge">{totalDocuments}</span>
          </button>
          <button
            type="button"
            className={`patient-my-record-tab-btn ${activeTab === 'archivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('archivos')}
          >
            <Paperclip className="w-4 h-4 mr-1.5" />
            <span>Mis Archivos</span>
            <span className="badge">{attachments.length}</span>
          </button>
          <button
            type="button"
            className={`patient-my-record-tab-btn ${activeTab === 'datos_medicos' ? 'active' : ''}`}
            onClick={() => setActiveTab('datos_medicos')}
          >
            <Heart className="w-4 h-4 mr-1.5" />
            <span>Mis Datos</span>
          </button>
        </nav>

        {/* 1. SECCIÓN CONSULTAS */}
        {activeTab === 'consultas' && (
          <div className="patient-my-record-section">
            <h2 className="sr-only">Mis Consultas Médicas</h2>
            {consultations.length > 0 ? (
              <div className="patient-my-consultations-list">
                {consultations.map((c) => (
                  <div
                    key={c.id}
                    className="patient-my-consultation-card"
                    onClick={() => {
                      setSelectedConsultation(c);
                      setDrawerType('consultation');
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="patient-my-consultation-header">
                      <div>
                        <span className="patient-my-consultation-date">
                          <Calendar className="w-3.5 h-3.5 mr-1 text-slate-400" />
                          {formatDate(c.appointmentDate)} {c.appointmentTime ? `· ${c.appointmentTime.slice(0, 5)}` : ''}
                        </span>
                        <h3 className="patient-my-consultation-doctor">
                          {c.doctor?.fullName || 'Médico tratante'}
                        </h3>
                        <span className="patient-my-consultation-specialty">
                          {c.doctor?.specialty || 'Medicina General'}
                          {c.doctor?.clinicName && ` · ${c.doctor.clinicName}`}
                        </span>
                      </div>
                      <span className="patient-my-chip-completed">Atendida</span>
                    </div>

                    <div className="patient-my-consultation-body">
                      {c.diagnosis && (
                        <div className="patient-my-consultation-field">
                          <strong>Diagnóstico:</strong> {c.diagnosis}
                        </div>
                      )}
                      {(c.treatment || c.soapNote?.plan) && (
                        <div className="patient-my-consultation-field text-slate-600">
                          <strong>Plan / Tratamiento:</strong> {c.treatment || c.soapNote?.plan}
                        </div>
                      )}
                    </div>

                    <div className="patient-my-consultation-footer">
                      <div className="text-xs text-slate-500">
                        {c.prescriptions?.length > 0 && (
                          <span className="mr-3">💊 {c.prescriptions.length} récipe(s)</span>
                        )}
                        {c.medicalDocuments?.length > 0 && (
                          <span>📄 {c.medicalDocuments.length} doc(s)</span>
                        )}
                      </div>
                      <span className="patient-my-link-more">Ver detalles →</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="patient-my-record-empty-card">
                <Stethoscope className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  Aún no tienes consultas registradas
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Cuando asistas a tus citas médicas con tus doctores en CitaMed, tus consultas e
                  indicaciones aparecerán aquí.
                </p>
                <button
                  type="button"
                  className="patient-my-btn-primary"
                  onClick={() => navigate('/modulo/agendamiento')}
                >
                  Agendar una cita
                </button>
              </div>
            )}
          </div>
        )}

        {/* 2. SECCIÓN RÉCIPES Y DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="patient-my-record-section">
            <h2 className="sr-only">Mis Récipes y Documentos</h2>
            {totalDocuments > 0 ? (
              <div className="patient-my-docs-grid">
                {/* Récipes */}
                {prescriptions.map((p) => {
                  const docDoctor = p.doctor || {};
                  const docTitle = docDoctor.gender === 'femenino' ? 'Dra.' : 'Dr.';
                  const doctorName = docDoctor.firstName
                    ? `${docTitle} ${docDoctor.firstName} ${docDoctor.lastName || ''}`.trim()
                    : 'Médico tratante';

                  return (
                    <div key={`p_${p.id}`} className="patient-my-doc-card">
                      <div className="patient-my-doc-top">
                        <span className="patient-doc-badge purple">
                          <Pill className="w-3.5 h-3.5 mr-1" /> Récipe Médico
                        </span>
                        <span
                          className={`patient-my-status-pill ${p.status === 'active' ? 'active' : 'voided'}`}
                        >
                          {p.status === 'active' ? 'Válido' : 'Anulado'}
                        </span>
                      </div>

                      <h3 className="patient-my-doc-title">Récipe Médico Digital</h3>
                      <p className="patient-my-doc-doctor">Emitido por: {doctorName}</p>
                      <p className="patient-my-doc-date">Fecha: {formatDate(p.createdAt)}</p>

                      <div className="patient-my-doc-code-wrap">
                        <span className="text-xs text-slate-500 font-medium">Verificación:</span>
                        <code className="patient-my-doc-code">{p.verificationCode}</code>
                      </div>

                      <div className="patient-my-doc-actions">
                        <button
                          type="button"
                          className="patient-my-action-btn"
                          onClick={() => handleDownloadPdf('prescription', p.id, 'recipe')}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> PDF
                        </button>
                        <button
                          type="button"
                          className="patient-my-action-btn text-teal-600"
                          onClick={() => handleShare('prescription', p)}
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1" /> WhatsApp
                        </button>
                        <button
                          type="button"
                          className="patient-my-action-btn text-slate-600"
                          onClick={() => {
                            setSelectedQrDoc({
                              type: 'prescription',
                              code: p.verificationCode,
                              title: 'Récipe Médico'
                            });
                            setDrawerType('qr_modal');
                          }}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> Ver QR
                        </button>
                      </div>
                    </div>
                  );
                })}

                {/* Otros documentos médicos */}
                {documents.map((d) => {
                  const docDoctor = d.doctor || {};
                  const docTitle = docDoctor.gender === 'femenino' ? 'Dra.' : 'Dr.';
                  const doctorName = docDoctor.firstName
                    ? `${docTitle} ${docDoctor.firstName} ${docDoctor.lastName || ''}`.trim()
                    : 'Médico tratante';

                  let badgeColor = 'slate';
                  if (d.type === 'lab_order') badgeColor = 'teal';
                  else if (d.type === 'rest_note') badgeColor = 'amber';
                  else if (d.type === 'certificate') badgeColor = 'orange';
                  else if (d.type === 'medical_report') badgeColor = 'indigo';

                  return (
                    <div key={`d_${d.id}`} className="patient-my-doc-card">
                      <div className="patient-my-doc-top">
                        <span className={`patient-doc-badge ${badgeColor}`}>
                          {d.type === 'lab_order'
                            ? 'Orden de exámenes'
                            : d.type === 'rest_note'
                            ? 'Reposo médico'
                            : d.type === 'certificate'
                            ? 'Constancia médica'
                            : 'Informe médico'}
                        </span>
                        <span
                          className={`patient-my-status-pill ${d.status === 'active' ? 'active' : 'voided'}`}
                        >
                          {d.status === 'active' ? 'Válido' : 'Anulado'}
                        </span>
                      </div>

                      <h3 className="patient-my-doc-title">{d.title || 'Documento Médico'}</h3>
                      <p className="patient-my-doc-doctor">Emitido por: {doctorName}</p>
                      <p className="patient-my-doc-date">Fecha: {formatDate(d.createdAt)}</p>

                      <div className="patient-my-doc-code-wrap">
                        <span className="text-xs text-slate-500 font-medium">Verificación:</span>
                        <code className="patient-my-doc-code">{d.verificationCode}</code>
                      </div>

                      <div className="patient-my-doc-actions">
                        <button
                          type="button"
                          className="patient-my-action-btn"
                          onClick={() => handleDownloadPdf(d.type, d.id, d.title)}
                        >
                          <Download className="w-3.5 h-3.5 mr-1" /> PDF
                        </button>
                        <button
                          type="button"
                          className="patient-my-action-btn text-teal-600"
                          onClick={() => handleShare(d.type, d)}
                        >
                          <Share2 className="w-3.5 h-3.5 mr-1" /> WhatsApp
                        </button>
                        <button
                          type="button"
                          className="patient-my-action-btn text-slate-600"
                          onClick={() => {
                            setSelectedQrDoc({
                              type: d.type,
                              code: d.verificationCode,
                              title: d.title || 'Documento médico'
                            });
                            setDrawerType('qr_modal');
                          }}
                        >
                          <QrCode className="w-3.5 h-3.5 mr-1" /> Ver QR
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="patient-my-record-empty-card">
                <FileText className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  No tienes documentos emitidos aún
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tus recetas electrónicas, reposos y constancias generados en consultas médicas
                  estarán disponibles aquí.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. SECCIÓN MIS ARCHIVOS */}
        {activeTab === 'archivos' && (
          <div className="patient-my-record-section">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Tus Estudios y Archivos Adjuntos</h2>
                <p className="text-xs text-slate-500">
                  Guarda tus resultados de laboratorio, ecografías y radiografías
                </p>
              </div>
              <button
                type="button"
                className="patient-my-btn-primary text-xs py-2 px-3"
                onClick={() => setDrawerType('upload_file')}
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Subir archivo
              </button>
            </div>

            {attachments.length > 0 ? (
              <div className="patient-my-attachments-list">
                {attachments.map((att) => (
                  <div key={att.id} className="patient-my-attachment-item">
                    <div className="patient-my-att-icon">
                      <Paperclip className="w-5 h-5 text-slate-600" />
                    </div>
                    <div className="patient-my-att-details">
                      <h4 className="patient-my-att-title">{att.title || 'Archivo adjunto'}</h4>
                      <p className="patient-my-att-meta">
                        {formatDate(att.createdAt)}
                        {att.fileSize && ` · ${Math.round(att.fileSize / 1024)} KB`}
                      </p>
                    </div>
                    <div className="patient-my-att-actions">
                      <button
                        type="button"
                        className="patient-my-icon-btn text-teal-600"
                        title="Abrir archivo"
                        onClick={() => handleOpenFile(att.id)}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        className="patient-my-icon-btn text-rose-600"
                        title="Eliminar archivo"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'file',
                            id: att.id,
                            title: att.title || 'este archivo'
                          })
                        }
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="patient-my-record-empty-card">
                <Paperclip className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700 mb-1">
                  No has subido ningún archivo
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
                  Sube tus exámenes en formato PDF o imagen para tenerlos a mano durante tus citas.
                </p>
                <button
                  type="button"
                  className="patient-my-btn-primary"
                  onClick={() => setDrawerType('upload_file')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Subir mi primer archivo
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. SECCIÓN MIS DATOS MÉDICOS */}
        {activeTab === 'datos_medicos' && (
          <div className="patient-my-record-section space-y-6">
            <h2 className="sr-only">Mis Datos Médicos</h2>
            {/* Alergias */}
            <div className="patient-my-data-card">
              <div className="patient-my-data-card-header">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Alergias Conocidas ({allergies.length})
                  </h3>
                </div>
                <button
                  type="button"
                  className="patient-my-data-add-btn"
                  onClick={() => setDrawerType('new_allergy')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </button>
              </div>

              {allergies.length > 0 ? (
                <div className="patient-my-data-list">
                  {allergies.map((alg) => (
                    <div key={alg.id} className="patient-my-data-row">
                      <div>
                        <strong className="text-rose-700 text-sm">{alg.allergen}</strong>
                        <div className="text-xs text-slate-500">
                          {alg.reaction ? `Reacción: ${alg.reaction}` : 'Sin reacción detallada'}
                          {alg.severity && ` · Severidad: ${alg.severity}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        className="patient-my-icon-btn text-rose-500"
                        title="Eliminar alergia"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'allergy',
                            id: alg.id,
                            title: `alergia a ${alg.allergen}`
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center">
                  Sin alergias registradas. Si tienes alguna, agrégala para alertar a tus médicos.
                </p>
              )}
            </div>

            {/* Antecedentes Médicos */}
            <div className="patient-my-data-card">
              <div className="patient-my-data-card-header">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Antecedentes Médicos ({medicalHistory.length})
                  </h3>
                </div>
                <button
                  type="button"
                  className="patient-my-data-add-btn"
                  onClick={() => setDrawerType('new_condition')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </button>
              </div>

              {medicalHistory.length > 0 ? (
                <div className="patient-my-data-list">
                  {medicalHistory.map((cond) => (
                    <div key={cond.id} className="patient-my-data-row">
                      <div>
                        <strong className="text-slate-800 text-sm">{cond.condition}</strong>
                        <div className="text-xs text-slate-500">
                          Estado: {cond.status || 'activa'}
                          {cond.diagnosedDate && ` · Diagnosticada: ${formatDate(cond.diagnosedDate)}`}
                        </div>
                        {cond.notes && (
                          <p className="text-xs text-slate-600 mt-0.5 italic">{cond.notes}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="patient-my-icon-btn text-rose-500"
                        title="Eliminar antecedente"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'condition',
                            id: cond.id,
                            title: `antecedente de ${cond.condition}`
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center">
                  Sin antecedentes patológicos registrados.
                </p>
              )}
            </div>

            {/* Medicamentos Habituales */}
            <div className="patient-my-data-card">
              <div className="patient-my-data-card-header">
                <div className="flex items-center gap-2">
                  <Pill className="w-4 h-4 text-purple-600" />
                  <h3 className="text-sm font-bold text-slate-800">
                    Medicamentos que Tomas Habitualmente ({medications.length})
                  </h3>
                </div>
                <button
                  type="button"
                  className="patient-my-data-add-btn"
                  onClick={() => setDrawerType('new_medication')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </button>
              </div>

              {medications.length > 0 ? (
                <div className="patient-my-data-list">
                  {medications.map((med) => (
                    <div key={med.id} className="patient-my-data-row">
                      <div>
                        <strong className="text-slate-800 text-sm">{med.medicationName}</strong>
                        <div className="text-xs text-slate-500">
                          {med.dose && `${med.dose} `}
                          {med.frequency && `· ${med.frequency}`}
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-slate-600 mt-0.5">{med.instructions}</p>
                        )}
                      </div>
                      <button
                        type="button"
                        className="patient-my-icon-btn text-rose-500"
                        title="Eliminar medicamento"
                        onClick={() =>
                          setDeleteConfirm({
                            type: 'medication',
                            id: med.id,
                            title: `medicamento ${med.medicationName}`
                          })
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-3 text-center">
                  Sin medicamentos habituales registrados.
                </p>
              )}
            </div>
          </div>
        )}
      </main>

      {/* SIDEDRAWER: DETALLE DE CONSULTA (SIN NOTAS PRIVADAS) */}
      <SideDrawer
        open={drawerType === 'consultation' && !!selectedConsultation}
        onClose={() => {
          setDrawerType(null);
          setSelectedConsultation(null);
        }}
        title={`Consulta del ${formatDate(selectedConsultation?.appointmentDate)}`}
        footer={
          <button
            type="button"
            className="patient-my-btn-secondary w-full justify-center"
            onClick={() => {
              setDrawerType(null);
              setSelectedConsultation(null);
            }}
          >
            Cerrar panel
          </button>
        }
      >
        {selectedConsultation && (
          <div className="space-y-5 text-sm">
            {/* Médico y Especialidad */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                Profesional Tratante
              </span>
              <p className="text-slate-900 font-bold text-base">
                {selectedConsultation.doctor?.fullName || 'Médico tratante'}
              </p>
              <p className="text-xs text-slate-600">
                {selectedConsultation.doctor?.specialty || 'Medicina General'}
              </p>
            </div>

            {/* Diagnóstico */}
            {selectedConsultation.diagnosis && (
              <div>
                <span className="text-xs font-bold text-teal-700 uppercase block mb-1">
                  Diagnóstico Médico
                </span>
                <p className="text-slate-800 font-medium bg-teal-50/50 p-2.5 rounded border border-teal-100">
                  {selectedConsultation.diagnosis}
                </p>
              </div>
            )}

            {/* Plan e indicaciones */}
            {(selectedConsultation.treatment || selectedConsultation.soapNote?.plan) && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Indicaciones y Tratamiento
                </span>
                <p className="text-slate-700 whitespace-pre-wrap bg-slate-50 p-2.5 rounded border border-slate-100">
                  {selectedConsultation.treatment || selectedConsultation.soapNote?.plan}
                </p>
              </div>
            )}

            {/* Signos vitales */}
            {selectedConsultation.vitalSigns && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Tus Signos Vitales en esta Consulta
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {selectedConsultation.vitalSigns.systolic && selectedConsultation.vitalSigns.diastolic && (
                    <div className="p-2 bg-slate-50 rounded">
                      <strong>Tensión Arterial:</strong> {selectedConsultation.vitalSigns.systolic}/{selectedConsultation.vitalSigns.diastolic} mmHg
                    </div>
                  )}
                  {selectedConsultation.vitalSigns.heartRate && (
                    <div className="p-2 bg-slate-50 rounded">
                      <strong>Frecuencia Cardíaca:</strong> {selectedConsultation.vitalSigns.heartRate} lpm
                    </div>
                  )}
                  {selectedConsultation.vitalSigns.weightKg && (
                    <div className="p-2 bg-slate-50 rounded">
                      <strong>Peso:</strong> {selectedConsultation.vitalSigns.weightKg} kg
                    </div>
                  )}
                  {selectedConsultation.vitalSigns.bmi && (
                    <div className="p-2 bg-slate-50 rounded">
                      <strong>IMC:</strong> {selectedConsultation.vitalSigns.bmi} kg/m²
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Examen físico */}
            {selectedConsultation.physicalExam && typeof selectedConsultation.physicalExam === 'object' && (
              <div>
                <span className="text-xs font-bold text-slate-700 uppercase block mb-1">
                  Examen Físico Evaluado
                </span>
                <div className="space-y-1.5 text-xs">
                  {Object.entries(selectedConsultation.physicalExam)
                    .filter(([, val]) => val && val.status && val.status !== 'not_evaluated')
                    .map(([key, val]) => (
                      <div key={key} className="p-2 bg-slate-50 rounded flex justify-between items-center">
                        <span className="capitalize font-medium text-slate-800">{key}</span>
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                            val.status === 'normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {val.status === 'normal' ? 'Normal' : 'Hallazgos'}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Documentos emitidos en la cita */}
            {(selectedConsultation.prescriptions?.length > 0 ||
              selectedConsultation.medicalDocuments?.length > 0) && (
              <div className="pt-2 border-t">
                <span className="text-xs font-bold text-slate-700 uppercase block mb-2">
                  Documentos Emitidos
                </span>
                <div className="space-y-2">
                  {selectedConsultation.prescriptions?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-purple-50/50 rounded border border-purple-100">
                      <span className="text-xs font-bold text-purple-900">
                        Récipe #{p.verificationCode}
                      </span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => handleDownloadPdf('prescription', p.id, 'recipe')}
                      >
                        Descargar
                      </button>
                    </div>
                  ))}
                  {selectedConsultation.medicalDocuments?.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-teal-50/50 rounded border border-teal-100">
                      <span className="text-xs font-bold text-teal-900">
                        {d.title || d.type} #{d.verificationCode}
                      </span>
                      <button
                        type="button"
                        className="text-xs font-semibold text-primary hover:underline"
                        onClick={() => handleDownloadPdf(d.type, d.id, d.title)}
                      >
                        Descargar
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* SIDEDRAWER: VER QR Y ENLACE DE VERIFICACIÓN */}
      <SideDrawer
        open={drawerType === 'qr_modal' && !!selectedQrDoc}
        onClose={() => {
          setDrawerType(null);
          setSelectedQrDoc(null);
        }}
        title="Verificación del Documento"
        footer={
          <button
            type="button"
            className="patient-my-btn-secondary w-full justify-center"
            onClick={() => {
              setDrawerType(null);
              setSelectedQrDoc(null);
            }}
          >
            Cerrar
          </button>
        }
      >
        {selectedQrDoc && (
          <div className="space-y-5 text-center text-sm">
            <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-full flex items-center justify-center mx-auto">
              <QrCode className="w-8 h-8" />
            </div>

            <div>
              <h3 className="font-bold text-slate-900 text-base">{selectedQrDoc.title}</h3>
              <p className="text-xs text-slate-500 mt-1">
                Cualquier persona, farmacia o empleador puede comprobar la validez oficial de este
                documento en la plataforma CitaMed.
              </p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-xs font-bold text-slate-500 uppercase block mb-1">
                Código de Autenticidad
              </span>
              <span className="text-xl font-mono font-extrabold text-primary tracking-wider">
                {selectedQrDoc.code}
              </span>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block text-left">
                Enlace público de verificación:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  className="flex-1 text-xs px-3 py-2 bg-slate-50 border rounded-lg font-mono"
                  value={`${window.location.origin}/verificar/${selectedQrDoc.code}`}
                />
                <button
                  type="button"
                  className="patient-my-btn-primary px-3 py-2 text-xs"
                  onClick={() => handleCopyLink(selectedQrDoc.code)}
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              {copiedLink && (
                <span className="text-xs text-teal-600 font-semibold block text-left">
                  ¡Enlace copiado al portapapeles!
                </span>
              )}
            </div>

            <div className="pt-2">
              <a
                href={`/verificar/${selectedQrDoc.code}`}
                target="_blank"
                rel="noopener noreferrer"
                className="patient-my-link-more inline-flex items-center text-xs"
              >
                Abrir página pública de verificación <ExternalLink className="w-3.5 h-3.5 ml-1" />
              </a>
            </div>
          </div>
        )}
      </SideDrawer>

      {/* SIDEDRAWER: AGREGAR ALERGIA PROPIA */}
      <SideDrawer
        open={drawerType === 'new_allergy'}
        onClose={() => setDrawerType(null)}
        title="Agregar Alergia a Mi Perfil"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-my-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-my-btn-primary"
              onClick={handleSaveAllergy}
              disabled={submittingAction || !allergyForm.allergen.trim()}
            >
              {submittingAction ? 'Guardando...' : 'Guardar Alergia'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveAllergy} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la sustancia o alérgeno *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Penicilina, Mariscos, Maní, Ibuprofeno..."
              value={allergyForm.allergen}
              onChange={(e) => setAllergyForm({ ...allergyForm, allergen: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de alergia</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white"
              value={allergyForm.allergyType}
              onChange={(e) => setAllergyForm({ ...allergyForm, allergyType: e.target.value })}
            >
              <option value="medication">Medicamento</option>
              <option value="food">Alimento</option>
              <option value="environmental">Ambiental</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reacción o síntomas al exponerte
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Ronchas en la piel, hinchazón, dificultad para respirar..."
              value={allergyForm.reaction}
              onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* SIDEDRAWER: AGREGAR CONDICIÓN / ANTECEDENTE */}
      <SideDrawer
        open={drawerType === 'new_condition'}
        onClose={() => setDrawerType(null)}
        title="Agregar Antecedente Médico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-my-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-my-btn-primary"
              onClick={handleSaveCondition}
              disabled={submittingAction || !conditionForm.condition.trim()}
            >
              {submittingAction ? 'Guardando...' : 'Guardar Condición'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveCondition} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Condición, diagnóstico o cirugía previa *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Asma, Hipertensión, Apendicectomía..."
              value={conditionForm.condition}
              onChange={(e) => setConditionForm({ ...conditionForm, condition: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Estado</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white"
              value={conditionForm.status}
              onChange={(e) => setConditionForm({ ...conditionForm, status: e.target.value })}
            >
              <option value="active">Activa</option>
              <option value="resolved">Resuelta / Curada</option>
              <option value="chronic">Crónica</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas u observaciones</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Detalles sobre tratamientos previos..."
              value={conditionForm.notes}
              onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* SIDEDRAWER: AGREGAR MEDICAMENTO HABITUAL */}
      <SideDrawer
        open={drawerType === 'new_medication'}
        onClose={() => setDrawerType(null)}
        title="Agregar Medicamento Habitual"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-my-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-my-btn-primary"
              onClick={handleSaveMedication}
              disabled={submittingAction || !medicationForm.medicationName.trim()}
            >
              {submittingAction ? 'Guardando...' : 'Guardar Medicamento'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleSaveMedication} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nombre del medicamento *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Losartán potásico, Eutirox, Metformina..."
              value={medicationForm.medicationName}
              onChange={(e) => setMedicationForm({ ...medicationForm, medicationName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Dosis</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: 50 mg, 1 tableta"
                value={medicationForm.dose}
                onChange={(e) => setMedicationForm({ ...medicationForm, dose: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frecuencia</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg"
                placeholder="Ej: Cada 12 horas, Diaria"
                value={medicationForm.frequency}
                onChange={(e) => setMedicationForm({ ...medicationForm, frequency: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Instrucciones</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Tomar en ayunas, con abundante agua..."
              value={medicationForm.instructions}
              onChange={(e) => setMedicationForm({ ...medicationForm, instructions: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* SIDEDRAWER: SUBIR ARCHIVO */}
      <SideDrawer
        open={drawerType === 'upload_file'}
        onClose={() => setDrawerType(null)}
        title="Subir Archivo o Estudio Médico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-my-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-my-btn-primary"
              onClick={handleUploadFile}
              disabled={submittingAction || !uploadForm.file || !uploadForm.title.trim()}
            >
              {submittingAction ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUploadFile} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Título del archivo *</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Hematología completa, Ecografía abdominal..."
              value={uploadForm.title}
              onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Categoría</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white"
              value={uploadForm.category}
              onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value })}
            >
              <option value="lab_result">Resultado de laboratorio</option>
              <option value="imaging">Imagenología / Ecografía / Rayos X</option>
              <option value="report">Informe de especialista</option>
              <option value="other">Otro documento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar archivo *</label>
            <input
              type="file"
              className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              required
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Formatos: PDF, PNG, JPG, WEBP (máx. 10 MB)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción (opcional)</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={2}
              placeholder="Notas o comentarios..."
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* DIÁLOGO CORTO DE CONFIRMACIÓN DE ELIMINACIÓN */}
      {deleteConfirm && (
        <div className="patient-my-confirm-overlay" role="dialog" aria-modal="true">
          <div className="patient-my-confirm-box">
            <h3 className="patient-my-confirm-title">¿Eliminar {deleteConfirm.title}?</h3>
            <p className="patient-my-confirm-desc">
              Esta acción no se puede deshacer. Se removerá de tu expediente personal.
            </p>
            <div className="patient-my-confirm-actions">
              <button
                type="button"
                className="patient-my-btn-secondary"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="patient-my-btn-danger"
                onClick={handleConfirmDelete}
                disabled={deleting}
              >
                {deleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

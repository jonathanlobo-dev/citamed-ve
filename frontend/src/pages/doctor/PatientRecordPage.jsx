import { useState, useEffect, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  User,
  Heart,
  AlertTriangle,
  Pill,
  FileText,
  Activity,
  Download,
  Share2,
  Trash2,
  Paperclip,
  ExternalLink,
  Plus,
  Stethoscope,
  FileCheck,
  FileBadge,
  ShieldAlert,
  Lock,
  Eye,
  CheckCircle2,
  XCircle,
  RefreshCw
} from 'lucide-react';
import Navbar from '../../components/common/Navbar/Navbar';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import clinicalRecordService from '../../services/clinicalRecordService';
import medicalDocumentService from '../../services/medicalDocumentService';
import prescriptionAPI from '../../services/prescriptionService';
import { prefetchDocumentPdf, shareDocument } from '../../utils/shareDocument';
import './PatientRecordPage.css';

// Lazy loading de Recharts
const EvolutionCharts = lazy(() => import('../../components/clinical/EvolutionCharts'));

export default function PatientRecordPage() {
  const { patientId } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [forbidden, setForbidden] = useState(false);
  const [record, setRecord] = useState(null);

  // Tabs
  const [activeTab, setActiveTab] = useState('resumen'); // resumen | timeline | consultas | documentos | archivos | evolucion
  const [timelineFilter, setTimelineFilter] = useState('todos');

  // SideDrawers
  const [selectedConsultation, setSelectedConsultation] = useState(null);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState(null);
  const [drawerType, setDrawerType] = useState(null); // 'consultation' | 'timeline_item' | 'new_allergy' | 'new_condition' | 'upload_file'

  // Diálogo corto de confirmación para anular documento
  const [voidConfirm, setVoidConfirm] = useState(null); // { id, type, title }
  const [voidReason, setVoidReason] = useState('');
  const [voiding, setVoiding] = useState(false);

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
  const [uploadForm, setUploadForm] = useState({
    title: '',
    category: 'lab_result',
    description: '',
    file: null
  });
  const [submittingAction, setSubmittingAction] = useState(false);

  // Carga de la ficha clínica del paciente
  const fetchPatientRecord = () => {
    setLoading(true);
    setError(null);
    setForbidden(false);

    clinicalRecordService
      .getPatientRecordForDoctor(patientId)
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
        console.error('Error al cargar expediente del paciente:', err);
        if (err.response?.status === 403) {
          setForbidden(true);
        } else {
          setError(
            err.response?.data?.message || 'Error al obtener la historia clínica del paciente.'
          );
        }
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (patientId) {
      fetchPatientRecord();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId]);

  // Formato de fechas
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

  // Compartir por WhatsApp / Web Share (SIN AWAIT EN EL CLIC)
  const handleShare = (type, doc) => {
    const p = record?.patient || {};
    shareDocument({
      type,
      documentId: doc.id,
      verificationCode: doc.verificationCode,
      patientName: p.fullName || `${p.firstName} ${p.lastName}`,
      doctorName: 'tu médico tratante',
      date: formatDate(doc.createdAt || doc.date),
      patientPhone: p.phone || '',
      isPatientSharing: false
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

  // Confirmar y anular documento médico o récipe
  const handleConfirmVoid = async () => {
    if (!voidConfirm) return;
    setVoiding(true);
    try {
      if (voidConfirm.type === 'prescription') {
        await prescriptionAPI.void(voidConfirm.id);
      } else {
        await medicalDocumentService.void(voidConfirm.id, voidReason);
      }
      setVoidConfirm(null);
      setVoidReason('');
      fetchPatientRecord();
    } catch (err) {
      console.error('Error al anular documento:', err);
      alert(err.response?.data?.message || 'Error al anular el documento.');
    } finally {
      setVoiding(false);
    }
  };

  // Guardar nueva alergia desde SideDrawer
  const handleSaveAllergy = async (e) => {
    e.preventDefault();
    if (!allergyForm.allergen.trim()) return;
    setSubmittingAction(true);
    try {
      await clinicalRecordService.addPatientAllergy(patientId, allergyForm);
      setDrawerType(null);
      setAllergyForm({ allergen: '', allergyType: 'medication', severity: 'mild', reaction: '', notes: '' });
      fetchPatientRecord();
    } catch (err) {
      console.error('Error al agregar alergia:', err);
      alert(err.response?.data?.message || 'Error al registrar la alergia.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Guardar nueva condición / antecedente desde SideDrawer
  const handleSaveCondition = async (e) => {
    e.preventDefault();
    if (!conditionForm.condition.trim()) return;
    setSubmittingAction(true);
    try {
      await clinicalRecordService.addPatientCondition(patientId, conditionForm);
      setDrawerType(null);
      setConditionForm({ condition: '', status: 'active', severity: 'moderate', diagnosedDate: '', notes: '' });
      fetchPatientRecord();
    } catch (err) {
      console.error('Error al agregar condición:', err);
      alert(err.response?.data?.message || 'Error al registrar el antecedente.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Subir archivo adjunto privado desde SideDrawer
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
      // Si hay al menos una consulta, asociar a la última
      if (record?.consultations?.[0]?.id) {
        formData.append('appointmentId', record.consultations[0].id);
      }

      await medicalDocumentService.uploadAttachment(formData);
      setDrawerType(null);
      setUploadForm({ title: '', category: 'lab_result', description: '', file: null });
      fetchPatientRecord();
    } catch (err) {
      console.error('Error al subir archivo:', err);
      alert(err.response?.data?.message || 'Error al subir el archivo adjunto.');
    } finally {
      setSubmittingAction(false);
    }
  };

  // Construcción de la línea de tiempo unificada
  const buildTimeline = () => {
    if (!record) return [];

    const items = [];

    // Consultas
    (record.consultations || []).forEach((c) => {
      items.push({
        id: `consultation_${c.id}`,
        rawId: c.id,
        category: 'consultas',
        date: c.appointmentDate,
        time: c.appointmentTime,
        title: `Consulta médica ${c.status === 'completed' ? 'finalizada' : 'en curso'}`,
        subtitle: c.diagnosis ? `Diagnóstico: ${c.diagnosis}` : c.reasonForVisit || 'Consulta clínica',
        icon: Stethoscope,
        color: 'blue',
        data: c,
        type: 'consultation'
      });
    });

    // Récipes
    (record.prescriptions || []).forEach((p) => {
      const count = p.medications?.length || 0;
      items.push({
        id: `prescription_${p.id}`,
        rawId: p.id,
        category: 'recipes',
        date: p.createdAt ? p.createdAt.slice(0, 10) : p.appointmentDate,
        time: p.createdAt ? p.createdAt.slice(11, 16) : null,
        title: 'Récipe Médico emitido',
        subtitle: `${count} ${count === 1 ? 'medicamento' : 'medicamentos'} prescritos`,
        status: p.status,
        code: p.verificationCode,
        icon: Pill,
        color: 'purple',
        data: p,
        type: 'prescription'
      });
    });

    // Documentos médicos emitidos
    (record.documents || []).forEach((d) => {
      if (d.type === 'attachment') return;
      let cat = 'otros';
      let icon = FileText;
      let color = 'slate';

      if (d.type === 'lab_order') {
        cat = 'ordenes';
        icon = FileCheck;
        color = 'teal';
      } else if (d.type === 'rest_note') {
        cat = 'reposos';
        icon = Calendar;
        color = 'amber';
      } else if (d.type === 'certificate') {
        cat = 'constancias';
        icon = FileBadge;
        color = 'orange';
      } else if (d.type === 'medical_report') {
        cat = 'informes';
        icon = FileText;
        color = 'indigo';
      }

      items.push({
        id: `doc_${d.id}`,
        rawId: d.id,
        category: cat,
        date: d.createdAt ? d.createdAt.slice(0, 10) : '',
        time: d.createdAt ? d.createdAt.slice(11, 16) : null,
        title: d.title || 'Documento médico',
        subtitle: `Código: ${d.verificationCode || 'N/A'}`,
        status: d.status,
        code: d.verificationCode,
        icon,
        color,
        data: d,
        type: d.type
      });
    });

    // Archivos adjuntos
    (record.patientAttachments || []).forEach((att) => {
      items.push({
        id: `att_${att.id}`,
        rawId: att.id,
        category: 'archivos',
        date: att.createdAt ? att.createdAt.slice(0, 10) : '',
        time: att.createdAt ? att.createdAt.slice(11, 16) : null,
        title: att.title || 'Archivo adjunto del paciente',
        subtitle: att.category || 'Adjunto clínico',
        icon: Paperclip,
        color: 'emerald',
        data: att,
        type: 'attachment'
      });
    });

    // Ordenar descendente por fecha y hora
    items.sort((a, b) => {
      const dtA = `${a.date || ''} ${a.time || '00:00'}`;
      const dtB = `${b.date || ''} ${b.time || '00:00'}`;
      return dtB.localeCompare(dtA);
    });

    if (timelineFilter === 'todos') return items;
    return items.filter((item) => item.category === timelineFilter);
  };

  // Render caso 403 Forbidden
  if (forbidden) {
    return (
      <div className="patient-record-page">
        <Navbar />
        <main className="patient-record-container">
          <div className="patient-record-forbidden">
            <ShieldAlert className="w-16 h-16 text-rose-500 mx-auto mb-4" />
            <h1 className="text-2xl font-extrabold text-slate-800 mb-2">
              Acceso no autorizado
            </h1>
            <p className="text-slate-600 max-w-lg mx-auto mb-6 text-sm leading-relaxed">
              No tienes acceso al expediente de este paciente. Por confidencialidad y normativas
              médicas de CitaMed, solo puedes consultar expedientes de pacientes con los que tengas o
              hayas tenido consultas programadas.
            </p>
            <button
              type="button"
              className="patient-record-btn-primary"
              onClick={() => navigate('/medico/pacientes')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver a Mis Pacientes
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Render Loading o Error
  if (loading) {
    return (
      <div className="patient-record-page">
        <Navbar />
        <main className="patient-record-container">
          <div className="patient-record-loading">
            <div className="patient-record-spinner"></div>
            <p>Cargando historia clínica del paciente...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !record) {
    return (
      <div className="patient-record-page">
        <Navbar />
        <main className="patient-record-container">
          <div className="patient-record-error">
            <AlertTriangle className="w-6 h-6 text-rose-600" />
            <p>{error || 'No se pudo cargar la información del paciente.'}</p>
            <button
              type="button"
              className="patient-record-retry-btn"
              onClick={fetchPatientRecord}
            >
              <RefreshCw className="w-4 h-4 mr-1" /> Reintentar
            </button>
          </div>
        </main>
      </div>
    );
  }

  const { patient, allergies = [], medicalHistory = [], medications = [], consultations = [], documents = [], prescriptions = [], patientAttachments = [] } = record;
  const timelineItems = buildTimeline();

  // Buscar última consulta y próxima cita
  const lastConsultation = consultations[0] || null;
  const latestVitals = lastConsultation?.vitalSigns || null;

  return (
    <div className="patient-record-page">
      <Navbar />

      <main className="patient-record-container">
        {/* Barra superior de navegación */}
        <div className="patient-record-topbar">
          <button
            type="button"
            className="patient-record-back-btn"
            onClick={() => navigate('/medico/pacientes')}
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Mis Pacientes
          </button>
          <div className="patient-record-topbar-actions">
            <button
              type="button"
              className="patient-record-btn-secondary"
              onClick={() => navigate('/medico/agenda')}
            >
              <Calendar className="w-4 h-4 mr-1.5 text-teal-600" />
              Agendar consulta
            </button>
          </div>
        </div>

        {/* Encabezado del paciente */}
        <header className="patient-record-header-card">
          <div className="patient-record-header-main">
            <div className="patient-record-avatar">
              {`${patient.firstName?.[0] || ''}${patient.lastName?.[0] || ''}`.toUpperCase() || 'P'}
            </div>
            <div className="patient-record-header-details">
              <div className="patient-record-name-row">
                <h1 className="patient-record-name">{patient.fullName}</h1>
                <span className="patient-record-id-chip">
                  C.I. {patient.identificationNumber || 'No registrada'}
                </span>
                {patient.gender && (
                  <span className="patient-record-gender-chip">
                    {patient.gender === 'femenino' ? 'Femenino' : 'Masculino'}
                  </span>
                )}
                {patient.bloodType && (
                  <span className="patient-record-blood-chip">
                    Grupo: {patient.bloodType}
                  </span>
                )}
              </div>

              <div className="patient-record-demographics">
                <span>{patient.age ? `${patient.age} años` : 'Edad no registrada'}</span>
                {patient.phone && <span>· Tel: {patient.phone}</span>}
                {patient.email && <span>· {patient.email}</span>}
              </div>

              {/* Alergias como chips rojos */}
              <div className="patient-record-allergies-row">
                <span className="patient-record-allergies-label">
                  <AlertTriangle className="w-3.5 h-3.5 mr-1 text-rose-600" />
                  Alergias:
                </span>
                {allergies.length > 0 ? (
                  allergies.map((alg) => (
                    <span
                      key={alg.id}
                      className="patient-record-allergy-chip"
                      title={alg.reaction ? `Reacción: ${alg.reaction}` : 'Alergia registrada'}
                    >
                      {alg.allergen}
                      {alg.severity && alg.severity !== 'mild' && (
                        <span className="text-[10px] font-bold uppercase ml-1 opacity-80">
                          ({alg.severity === 'severe' ? 'severa' : alg.severity})
                        </span>
                      )}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-500 italic">
                    Sin alergias conocidas registradas
                  </span>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Pestañas de navegación */}
        <nav className="patient-record-tabs-nav">
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'resumen' ? 'active' : ''}`}
            onClick={() => setActiveTab('resumen')}
          >
            <Activity className="w-4 h-4 mr-2" />
            Resumen
          </button>
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'timeline' ? 'active' : ''}`}
            onClick={() => setActiveTab('timeline')}
          >
            <Clock className="w-4 h-4 mr-2" />
            Línea de tiempo
            <span className="patient-record-tab-badge">{timelineItems.length}</span>
          </button>
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'consultas' ? 'active' : ''}`}
            onClick={() => setActiveTab('consultas')}
          >
            <Stethoscope className="w-4 h-4 mr-2" />
            Consultas
            <span className="patient-record-tab-badge">{consultations.length}</span>
          </button>
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'documentos' ? 'active' : ''}`}
            onClick={() => setActiveTab('documentos')}
          >
            <FileText className="w-4 h-4 mr-2" />
            Documentos
            <span className="patient-record-tab-badge">
              {documents.filter((d) => d.type !== 'attachment').length + prescriptions.length}
            </span>
          </button>
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'archivos' ? 'active' : ''}`}
            onClick={() => setActiveTab('archivos')}
          >
            <Paperclip className="w-4 h-4 mr-2" />
            Archivos
            <span className="patient-record-tab-badge">{patientAttachments.length}</span>
          </button>
          <button
            type="button"
            className={`patient-record-tab ${activeTab === 'evolucion' ? 'active' : ''}`}
            onClick={() => setActiveTab('evolucion')}
          >
            <Heart className="w-4 h-4 mr-2" />
            Evolución
          </button>
        </nav>

        {/* CONTENIDO DE PESTAÑAS */}

        {/* 1. RESUMEN */}
        {activeTab === 'resumen' && (
          <div className="patient-record-grid-2col">
            {/* Antecedentes Médicos */}
            <section className="patient-record-card">
              <div className="patient-record-card-header">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-indigo-600" />
                  <h2 className="text-base font-bold text-slate-800">
                    Antecedentes y Condiciones ({medicalHistory.length})
                  </h2>
                </div>
                <button
                  type="button"
                  className="patient-record-card-add-btn"
                  onClick={() => setDrawerType('new_condition')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </button>
              </div>

              {medicalHistory.length > 0 ? (
                <ul className="patient-record-items-list">
                  {medicalHistory.map((item) => (
                    <li key={item.id} className="patient-record-list-row">
                      <div>
                        <strong className="text-slate-800 text-sm">{item.condition}</strong>
                        <div className="text-xs text-slate-500">
                          Estado: {item.status || 'activa'}
                          {item.diagnosedDate && ` · Diagnóstico: ${formatDate(item.diagnosedDate)}`}
                          {item.diagnosedBy && ` · Registrado por: ${item.diagnosedBy}`}
                        </div>
                        {item.notes && (
                          <p className="text-xs text-slate-600 mt-1 italic">{item.notes}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Sin antecedentes patológicos registrados.
                </p>
              )}
            </section>

            {/* Medicamentos Habituales */}
            <section className="patient-record-card">
              <div className="patient-record-card-header">
                <div className="flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600" />
                  <h2 className="text-base font-bold text-slate-800">
                    Medicamentos Habituales ({medications.length})
                  </h2>
                </div>
              </div>

              {medications.length > 0 ? (
                <ul className="patient-record-items-list">
                  {medications.map((med) => (
                    <li key={med.id} className="patient-record-list-row">
                      <div>
                        <strong className="text-slate-800 text-sm">{med.medicationName}</strong>
                        <div className="text-xs text-slate-500">
                          {med.dose && `${med.dose} `}
                          {med.frequency && `· ${med.frequency}`}
                          {med.isActive === false && ' (Inactivo)'}
                        </div>
                        {med.instructions && (
                          <p className="text-xs text-slate-600 mt-1">{med.instructions}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Sin medicamentos habituales reportados.
                </p>
              )}
            </section>

            {/* Alergias detalladas */}
            <section className="patient-record-card">
              <div className="patient-record-card-header">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-rose-600" />
                  <h2 className="text-base font-bold text-slate-800">
                    Alergias Registradas ({allergies.length})
                  </h2>
                </div>
                <button
                  type="button"
                  className="patient-record-card-add-btn"
                  onClick={() => setDrawerType('new_allergy')}
                >
                  <Plus className="w-3.5 h-3.5 mr-1" /> Agregar
                </button>
              </div>

              {allergies.length > 0 ? (
                <ul className="patient-record-items-list">
                  {allergies.map((alg) => (
                    <li key={alg.id} className="patient-record-list-row">
                      <div className="flex items-start justify-between w-full">
                        <div>
                          <strong className="text-rose-700 text-sm font-bold">
                            {alg.allergen}
                          </strong>
                          <div className="text-xs text-slate-500">
                            Tipo: {alg.allergyType || 'medicamento'}
                            {alg.severity && ` · Severidad: ${alg.severity}`}
                          </div>
                          {alg.reaction && (
                            <p className="text-xs text-slate-600 mt-1">Reacción: {alg.reaction}</p>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Sin alergias registradas para este paciente.
                </p>
              )}
            </section>

            {/* Últimos Signos Vitales */}
            <section className="patient-record-card">
              <div className="patient-record-card-header">
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-600" />
                  <h2 className="text-base font-bold text-slate-800">Últimos Signos Vitales</h2>
                </div>
                {lastConsultation && (
                  <span className="text-xs text-slate-500 font-medium">
                    {formatDate(lastConsultation.appointmentDate)}
                  </span>
                )}
              </div>

              {latestVitals ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4">
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Tensión Arterial</span>
                    <span className="patient-vital-value">
                      {latestVitals.systolic && latestVitals.diastolic
                        ? `${latestVitals.systolic}/${latestVitals.diastolic}`
                        : 'N/A'}{' '}
                      <small className="text-xs text-slate-400">mmHg</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Frec. Cardíaca</span>
                    <span className="patient-vital-value">
                      {latestVitals.heartRate || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">lpm</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Temperatura</span>
                    <span className="patient-vital-value">
                      {latestVitals.temperature || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">°C</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Saturación O₂</span>
                    <span className="patient-vital-value">
                      {latestVitals.oxygenSaturation || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">%</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Peso</span>
                    <span className="patient-vital-value">
                      {latestVitals.weightKg || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">kg</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Talla</span>
                    <span className="patient-vital-value">
                      {latestVitals.heightCm || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">cm</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">IMC Calculado</span>
                    <span className="patient-vital-value">
                      {latestVitals.bmi || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">kg/m²</small>
                    </span>
                  </div>
                  <div className="patient-vital-tile">
                    <span className="patient-vital-label">Glucemia</span>
                    <span className="patient-vital-value">
                      {latestVitals.glucose || 'N/A'}{' '}
                      <small className="text-xs text-slate-400">mg/dL</small>
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic p-4 text-center">
                  Aún no se han registrado signos vitales en consultas previas.
                </p>
              )}
            </section>
          </div>
        )}

        {/* 2. LÍNEA DE TIEMPO */}
        {activeTab === 'timeline' && (
          <div className="patient-record-timeline-wrap">
            {/* Filtros */}
            <div className="patient-timeline-filters">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'consultas', label: 'Consultas' },
                { id: 'recipes', label: 'Récipes' },
                { id: 'ordenes', label: 'Órdenes' },
                { id: 'reposos', label: 'Reposos' },
                { id: 'constancias', label: 'Constancias' },
                { id: 'informes', label: 'Informes' },
                { id: 'archivos', label: 'Archivos' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`patient-timeline-filter-btn ${timelineFilter === f.id ? 'active' : ''}`}
                  onClick={() => setTimelineFilter(f.id)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Elementos de línea de tiempo */}
            {timelineItems.length > 0 ? (
              <div className="patient-timeline-feed">
                {timelineItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.id}
                      className="patient-timeline-item"
                      onClick={() => {
                        setSelectedTimelineItem(item);
                        setDrawerType('timeline_item');
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      <div className={`patient-timeline-badge ${item.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="patient-timeline-card">
                        <div className="patient-timeline-header">
                          <h3 className="patient-timeline-title">{item.title}</h3>
                          <span className="patient-timeline-date">
                            {formatDate(item.date)} {item.time ? `· ${item.time}` : ''}
                          </span>
                        </div>
                        <p className="patient-timeline-subtitle">{item.subtitle}</p>
                        {item.status && (
                          <span
                            className={`patient-status-chip ${item.status === 'active' || item.status === 'completed' ? 'active' : 'voided'}`}
                          >
                            {item.status === 'active' ? 'Válido' : item.status === 'voided' ? 'Anulado' : item.status}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="patient-record-empty">
                <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  No hay eventos registrados para el filtro seleccionado.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. CONSULTAS */}
        {activeTab === 'consultas' && (
          <div className="patient-record-consultations-list">
            {consultations.length > 0 ? (
              consultations.map((c) => (
                <div
                  key={c.id}
                  className="patient-consultation-row"
                  onClick={() => {
                    setSelectedConsultation(c);
                    setDrawerType('consultation');
                  }}
                  role="button"
                  tabIndex={0}
                >
                  <div className="patient-consultation-date-box">
                    <span className="day">{c.appointmentDate?.split('-')[2] || '—'}</span>
                    <span className="month">
                      {c.appointmentDate
                        ? new Date(c.appointmentDate).toLocaleString('es-VE', { month: 'short' })
                        : ''}
                    </span>
                    <span className="year">{c.appointmentDate?.split('-')[0] || ''}</span>
                  </div>

                  <div className="patient-consultation-info">
                    <div className="flex items-center gap-2">
                      <h3 className="patient-consultation-title">
                        {c.diagnosis || c.reasonForVisit || 'Consulta médica'}
                      </h3>
                      <span className="patient-status-chip active">
                        {c.status === 'completed' ? 'Completada' : 'En curso'}
                      </span>
                    </div>

                    <p className="patient-consultation-notes">
                      {c.soapNote?.assessment
                        ? `Diagnóstico: ${c.soapNote.assessment}`
                        : c.soapNote?.subjective || 'Sin descripción adicional'}
                    </p>

                    <div className="patient-consultation-counts">
                      <span>Récipes: {c.prescriptions?.length || 0}</span>
                      <span>·</span>
                      <span>Documentos: {c.medicalDocuments?.length || 0}</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    className="patient-consultation-open-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedConsultation(c);
                      setDrawerType('consultation');
                    }}
                  >
                    Ver detalles
                  </button>
                </div>
              ))
            ) : (
              <div className="patient-record-empty">
                <Stethoscope className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  Aún no has completado consultas con este paciente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. DOCUMENTOS */}
        {activeTab === 'documentos' && (
          <div className="patient-record-documents-list">
            <h2 className="sr-only">Documentos Médicos</h2>
            <div className="patient-documents-table-wrap">
              <table className="patient-documents-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Título / Detalle</th>
                    <th>Fecha</th>
                    <th>Código</th>
                    <th>Estado</th>
                    <th className="text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Prescripciones */}
                  {prescriptions.map((p) => (
                    <tr key={`p_${p.id}`}>
                      <td>
                        <span className="patient-doc-type-badge purple">
                          <Pill className="w-3.5 h-3.5 mr-1" /> Récipe
                        </span>
                      </td>
                      <td>
                        <strong className="text-slate-800 text-sm">Récipe Médico</strong>
                        <div className="text-xs text-slate-500">
                          {p.medications?.length || 0} medicamentos prescritos
                        </div>
                      </td>
                      <td>{formatDate(p.createdAt || p.appointmentDate)}</td>
                      <td>
                        <code className="patient-doc-code">{p.verificationCode}</code>
                      </td>
                      <td>
                        <span
                          className={`patient-status-chip ${p.status === 'active' ? 'active' : 'voided'}`}
                        >
                          {p.status === 'active' ? 'Válido' : 'Anulado'}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="patient-doc-actions">
                          <button
                            type="button"
                            className="patient-doc-action-btn"
                            title="Descargar PDF"
                            onClick={() => handleDownloadPdf('prescription', p.id, 'recipe')}
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            className="patient-doc-action-btn text-teal-600"
                            title="Enviar por WhatsApp"
                            onClick={() => handleShare('prescription', p)}
                          >
                            <Share2 className="w-4 h-4" />
                          </button>
                          {p.status === 'active' && (
                            <button
                              type="button"
                              className="patient-doc-action-btn text-rose-600"
                              title="Anular récipe"
                              onClick={() =>
                                setVoidConfirm({
                                  id: p.id,
                                  type: 'prescription',
                                  title: 'Récipe Médico'
                                })
                              }
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}

                  {/* Documentos Médicos */}
                  {documents
                    .filter((d) => d.type !== 'attachment')
                    .map((doc) => (
                      <tr key={`d_${doc.id}`}>
                        <td>
                          <span
                            className={`patient-doc-type-badge ${
                              doc.type === 'lab_order'
                                ? 'teal'
                                : doc.type === 'rest_note'
                                ? 'amber'
                                : doc.type === 'certificate'
                                ? 'orange'
                                : 'indigo'
                            }`}
                          >
                            {doc.type === 'lab_order'
                              ? 'Orden'
                              : doc.type === 'rest_note'
                              ? 'Reposo'
                              : doc.type === 'certificate'
                              ? 'Constancia'
                              : 'Informe'}
                          </span>
                        </td>
                        <td>
                          <strong className="text-slate-800 text-sm">
                            {doc.title || 'Documento Médico'}
                          </strong>
                          <div className="text-xs text-slate-500">
                            {doc.type === 'rest_note' && doc.content?.days
                              ? `${doc.content.days} días de reposo`
                              : doc.type === 'lab_order' && doc.content?.exams?.length
                              ? `${doc.content.exams.length} exámenes solicitados`
                              : 'Emitido en consulta'}
                          </div>
                        </td>
                        <td>{formatDate(doc.createdAt)}</td>
                        <td>
                          <code className="patient-doc-code">{doc.verificationCode}</code>
                        </td>
                        <td>
                          <span
                            className={`patient-status-chip ${doc.status === 'active' ? 'active' : 'voided'}`}
                          >
                            {doc.status === 'active' ? 'Válido' : 'Anulado'}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="patient-doc-actions">
                            <button
                              type="button"
                              className="patient-doc-action-btn"
                              title="Descargar PDF"
                              onClick={() => handleDownloadPdf(doc.type, doc.id, doc.title)}
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              className="patient-doc-action-btn text-teal-600"
                              title="Enviar por WhatsApp"
                              onClick={() => handleShare(doc.type, doc)}
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                            {doc.status === 'active' && (
                              <button
                                type="button"
                                className="patient-doc-action-btn text-rose-600"
                                title="Anular documento"
                                onClick={() =>
                                  setVoidConfirm({
                                    id: doc.id,
                                    type: doc.type,
                                    title: doc.title || 'Documento médico'
                                  })
                                }
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>

              {prescriptions.length === 0 &&
                documents.filter((d) => d.type !== 'attachment').length === 0 && (
                  <div className="patient-record-empty">
                    <FileText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm">
                      No hay récipes ni documentos emitidos para este paciente.
                    </p>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* 5. ARCHIVOS */}
        {activeTab === 'archivos' && (
          <div className="patient-record-files-tab">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-base font-bold text-slate-800">
                  Archivos y Estudios del Paciente ({patientAttachments.length})
                </h2>
                <p className="text-xs text-slate-500">
                  Documentos, exámenes de laboratorio e imágenes clínicas almacenadas
                </p>
              </div>
              <button
                type="button"
                className="patient-record-btn-primary text-sm py-2 px-3"
                onClick={() => setDrawerType('upload_file')}
              >
                <Plus className="w-4 h-4 mr-1.5" /> Subir archivo
              </button>
            </div>

            {patientAttachments.length > 0 ? (
              <div className="patient-files-grid">
                {patientAttachments.map((file) => {
                  const isImage = file.mimeType?.startsWith('image/');
                  return (
                    <div key={file.id} className="patient-file-card">
                      <div className="patient-file-icon-box">
                        {isImage ? (
                          <Eye className="w-6 h-6 text-teal-600" />
                        ) : (
                          <Paperclip className="w-6 h-6 text-slate-500" />
                        )}
                      </div>
                      <div className="patient-file-info">
                        <h4 className="patient-file-title" title={file.title}>
                          {file.title || 'Archivo adjunto'}
                        </h4>
                        <div className="patient-file-meta">
                          <span>{formatDate(file.createdAt)}</span>
                          {file.fileSize && (
                            <span>· {Math.round(file.fileSize / 1024)} KB</span>
                          )}
                        </div>
                      </div>
                      <div className="patient-file-actions">
                        <button
                          type="button"
                          className="patient-file-action-btn"
                          title="Abrir archivo"
                          onClick={() => handleOpenFile(file.id)}
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="patient-record-empty">
                <Paperclip className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 text-sm">
                  El paciente no tiene archivos ni estudios adjuntos.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 6. EVOLUCIÓN (RECHARTS DIFERIDO) */}
        {activeTab === 'evolucion' && (
          <div className="patient-record-evolution-tab">
            <Suspense
              fallback={
                <div className="p-12 text-center text-slate-500">
                  <div className="patient-record-spinner"></div>
                  <p className="text-sm">Cargando gráficos de evolución clínica...</p>
                </div>
              }
            >
              <EvolutionCharts vitalsSeries={record.vitalsSeries || []} />
            </Suspense>
          </div>
        )}
      </main>

      {/* SIDEDRAWER: DETALLE DE CONSULTA */}
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
            className="patient-record-btn-secondary w-full justify-center"
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
          <div className="space-y-6 text-sm">
            {/* Motivo de consulta */}
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                Motivo de la cita
              </span>
              <p className="text-slate-800 font-medium mt-0.5">
                {selectedConsultation.reasonForVisit || 'Consulta clínica general'}
              </p>
            </div>

            {/* SOAP */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1">
                Nota Clínica SOAP
              </h3>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">1. Subjetivo:</span>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {selectedConsultation.soapNote?.subjective || 'Sin registro subjetivo.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">2. Objetivo:</span>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {selectedConsultation.soapNote?.objective || 'Sin registro objetivo.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">3. Evaluación (Diagnóstico):</span>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {selectedConsultation.soapNote?.assessment || selectedConsultation.diagnosis || 'Sin diagnóstico registrado.'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">4. Plan:</span>
                <p className="text-slate-600 whitespace-pre-wrap">
                  {selectedConsultation.soapNote?.plan || selectedConsultation.treatment || 'Sin plan especificado.'}
                </p>
              </div>
            </div>

            {/* Signos Vitales */}
            {selectedConsultation.vitalSigns && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1 mb-2">
                  Signos Vitales
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>TA:</strong>{' '}
                    {selectedConsultation.vitalSigns.systolic && selectedConsultation.vitalSigns.diastolic
                      ? `${selectedConsultation.vitalSigns.systolic}/${selectedConsultation.vitalSigns.diastolic} mmHg`
                      : 'N/A'}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>FC:</strong> {selectedConsultation.vitalSigns.heartRate ? `${selectedConsultation.vitalSigns.heartRate} lpm` : 'N/A'}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>Temperatura:</strong> {selectedConsultation.vitalSigns.temperature ? `${selectedConsultation.vitalSigns.temperature} °C` : 'N/A'}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>Sat. O₂:</strong> {selectedConsultation.vitalSigns.oxygenSaturation ? `${selectedConsultation.vitalSigns.oxygenSaturation} %` : 'N/A'}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>Peso:</strong> {selectedConsultation.vitalSigns.weightKg ? `${selectedConsultation.vitalSigns.weightKg} kg` : 'N/A'}
                  </div>
                  <div className="p-2 bg-slate-50 rounded">
                    <strong>IMC:</strong> {selectedConsultation.vitalSigns.bmi ? `${selectedConsultation.vitalSigns.bmi} kg/m²` : 'N/A'}
                  </div>
                </div>
              </div>
            )}

            {/* Examen Físico (Solo sistemas evaluados) */}
            {selectedConsultation.physicalExam && typeof selectedConsultation.physicalExam === 'object' && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1 mb-2">
                  Examen Físico por Sistemas
                </h3>
                <div className="space-y-2">
                  {Object.entries(selectedConsultation.physicalExam)
                    .filter(([, val]) => val && val.status && val.status !== 'not_evaluated')
                    .map(([key, val]) => (
                      <div key={key} className="p-2.5 bg-slate-50 rounded border border-slate-100 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <strong className="capitalize text-slate-800">{key}</strong>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                              val.status === 'normal'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {val.status === 'normal' ? 'Normal' : 'Anormal'}
                          </span>
                        </div>
                        {val.findings && <p className="text-slate-600 italic">{val.findings}</p>}
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Notas privadas (doctorNotes) */}
            {selectedConsultation.doctorNotes && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <div className="flex items-center gap-1.5 text-amber-800 font-bold mb-1">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Notas privadas</span>
                </div>
                <p className="text-xs text-amber-900 whitespace-pre-wrap">
                  {selectedConsultation.doctorNotes}
                </p>
                <span className="text-[11px] text-amber-700 block mt-2 italic">
                  Solo tú puedes ver estas notas.
                </span>
              </div>
            )}

            {/* Documentos de la cita */}
            {(selectedConsultation.prescriptions?.length > 0 ||
              selectedConsultation.medicalDocuments?.length > 0) && (
              <div>
                <h3 className="text-xs font-bold text-primary uppercase tracking-wider border-b pb-1 mb-2">
                  Documentos Emitidos en esta Consulta
                </h3>
                <div className="space-y-2">
                  {selectedConsultation.prescriptions?.map((p) => (
                    <div key={p.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium">Récipe #{p.verificationCode}</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-primary font-semibold hover:underline"
                          onClick={() => handleDownloadPdf('prescription', p.id, 'recipe')}
                        >
                          Descargar
                        </button>
                        <button
                          type="button"
                          className="text-xs text-teal-600 font-semibold hover:underline"
                          onClick={() => handleShare('prescription', p)}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                  {selectedConsultation.medicalDocuments?.map((d) => (
                    <div key={d.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                      <span className="text-xs font-medium">
                        {d.title || d.type} #{d.verificationCode}
                      </span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className="text-xs text-primary font-semibold hover:underline"
                          onClick={() => handleDownloadPdf(d.type, d.id, d.title)}
                        >
                          Descargar
                        </button>
                        <button
                          type="button"
                          className="text-xs text-teal-600 font-semibold hover:underline"
                          onClick={() => handleShare(d.type, d)}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* SIDEDRAWER: DETALLE DE ELEMENTO DE LÍNEA DE TIEMPO */}
      <SideDrawer
        open={drawerType === 'timeline_item' && !!selectedTimelineItem}
        onClose={() => {
          setDrawerType(null);
          setSelectedTimelineItem(null);
        }}
        title={selectedTimelineItem?.title || 'Detalle del Evento'}
        footer={
          <button
            type="button"
            className="patient-record-btn-secondary w-full justify-center"
            onClick={() => {
              setDrawerType(null);
              setSelectedTimelineItem(null);
            }}
          >
            Cerrar panel
          </button>
        }
      >
        {selectedTimelineItem && (
          <div className="space-y-4 text-sm">
            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Fecha del registro</span>
              <p className="text-slate-800 font-medium">
                {formatDate(selectedTimelineItem.date)} {selectedTimelineItem.time || ''}
              </p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-500 uppercase">Detalle</span>
              <p className="text-slate-700 mt-1">{selectedTimelineItem.subtitle}</p>
            </div>

            {selectedTimelineItem.code && (
              <div>
                <span className="text-xs font-bold text-slate-500 uppercase">Código de verificación</span>
                <p className="mt-1">
                  <code className="patient-doc-code text-sm">{selectedTimelineItem.code}</code>
                </p>
              </div>
            )}

            {/* Acciones de descarga o WhatsApp si es documento */}
            {selectedTimelineItem.data && selectedTimelineItem.type !== 'consultation' && selectedTimelineItem.type !== 'attachment' && (
              <div className="pt-4 border-t flex gap-3">
                <button
                  type="button"
                  className="patient-record-btn-primary flex-1 justify-center"
                  onClick={() =>
                    handleDownloadPdf(
                      selectedTimelineItem.type,
                      selectedTimelineItem.rawId,
                      selectedTimelineItem.title
                    )
                  }
                >
                  <Download className="w-4 h-4 mr-1.5" /> Descargar PDF
                </button>
                <button
                  type="button"
                  className="patient-record-btn-secondary flex-1 justify-center text-teal-700"
                  onClick={() => handleShare(selectedTimelineItem.type, selectedTimelineItem.data)}
                >
                  <Share2 className="w-4 h-4 mr-1.5" /> WhatsApp
                </button>
              </div>
            )}

            {selectedTimelineItem.type === 'attachment' && (
              <div className="pt-4 border-t">
                <button
                  type="button"
                  className="patient-record-btn-primary w-full justify-center"
                  onClick={() => handleOpenFile(selectedTimelineItem.rawId)}
                >
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Ver archivo adjunto
                </button>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* SIDEDRAWER: AGREGAR ALERGIA */}
      <SideDrawer
        open={drawerType === 'new_allergy'}
        onClose={() => setDrawerType(null)}
        title="Registrar Alergia del Paciente"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-record-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-record-btn-primary"
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
              Nombre del alérgeno *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Penicilina, Dipirona, Mariscos..."
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
            <label className="block text-xs font-bold text-slate-700 mb-1">Severidad</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white"
              value={allergyForm.severity}
              onChange={(e) => setAllergyForm({ ...allergyForm, severity: e.target.value })}
            >
              <option value="mild">Leve</option>
              <option value="moderate">Moderada</option>
              <option value="severe">Severa</option>
              <option value="life_threatening">Peligro de muerte</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reacción observada / Síntomas
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Urticaria, edema facial, dificultad respiratoria..."
              value={allergyForm.reaction}
              onChange={(e) => setAllergyForm({ ...allergyForm, reaction: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas adicionales</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Comentarios o indicaciones..."
              value={allergyForm.notes}
              onChange={(e) => setAllergyForm({ ...allergyForm, notes: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* SIDEDRAWER: AGREGAR CONDICIÓN / ANTECEDENTE */}
      <SideDrawer
        open={drawerType === 'new_condition'}
        onClose={() => setDrawerType(null)}
        title="Registrar Condición o Antecedente"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-record-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-record-btn-primary"
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
              Nombre de la condición o antecedente *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Hipertensión arterial esencial, Diabetes mellitus tipo 2..."
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
              <option value="resolved">Resuelta</option>
              <option value="chronic">Crónica</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Severidad</label>
            <select
              className="w-full px-3 py-2 border rounded-lg bg-white"
              value={conditionForm.severity}
              onChange={(e) => setConditionForm({ ...conditionForm, severity: e.target.value })}
            >
              <option value="mild">Leve</option>
              <option value="moderate">Moderada</option>
              <option value="severe">Severa</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Fecha de diagnóstico</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg"
              value={conditionForm.diagnosedDate}
              onChange={(e) => setConditionForm({ ...conditionForm, diagnosedDate: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Notas</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Observaciones o tratamiento previo..."
              value={conditionForm.notes}
              onChange={(e) => setConditionForm({ ...conditionForm, notes: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* SIDEDRAWER: SUBIR ARCHIVO ADJUNTO */}
      <SideDrawer
        open={drawerType === 'upload_file'}
        onClose={() => setDrawerType(null)}
        title="Subir Archivo o Estudio Clínico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              className="patient-record-btn-secondary"
              onClick={() => setDrawerType(null)}
              disabled={submittingAction}
            >
              Cancelar
            </button>
            <button
              type="button"
              className="patient-record-btn-primary"
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
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Título del archivo *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              placeholder="Ej: Perfil lipídico - Septiembre 2026"
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
              <option value="imaging">Imagenología / Rayos X / Eco</option>
              <option value="report">Informe externo / Biopsia</option>
              <option value="other">Otro documento</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Seleccionar archivo *</label>
            <input
              type="file"
              className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              onChange={(e) => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })}
              required
            />
            <span className="text-[11px] text-slate-400 block mt-1">
              Formatos permitidos: PDF, PNG, JPG, WEBP (máx. 10 MB)
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Descripción / Hallazgos</label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              placeholder="Resumen o notas sobre el archivo..."
              value={uploadForm.description}
              onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
            />
          </div>
        </form>
      </SideDrawer>

      {/* DIÁLOGO CORTO DE CONFIRMACIÓN PARA ANULAR DOCUMENTO */}
      {voidConfirm && (
        <div className="patient-confirm-overlay" role="dialog" aria-modal="true">
          <div className="patient-confirm-modal">
            <h3 className="patient-confirm-title">¿Anular {voidConfirm.title}?</h3>
            <p className="patient-confirm-desc">
              Esta acción es irreversible. El documento perderá su validez médica y al ser verificado
              se mostrará como <strong>Anulado</strong>.
            </p>

            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo de la anulación (opcional):
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg text-sm"
                placeholder="Ej: Corrección de dosis, cambio de indicación..."
                value={voidReason}
                onChange={(e) => setVoidReason(e.target.value)}
              />
            </div>

            <div className="patient-confirm-actions">
              <button
                type="button"
                className="patient-record-btn-secondary"
                onClick={() => setVoidConfirm(null)}
                disabled={voiding}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="patient-record-btn-danger"
                onClick={handleConfirmVoid}
                disabled={voiding}
              >
                {voiding ? 'Anulando...' : 'Confirmar anulación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

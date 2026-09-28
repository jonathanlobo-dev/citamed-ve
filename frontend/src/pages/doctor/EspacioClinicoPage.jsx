/**
 * EspacioClinicoPage - CITAMED.VE
 * M03 / Semana 6 - Espacio Clínico de Página Completa
 *
 * Registro clínico de la consulta: SOAP, signos vitales con rangos e IMC en vivo,
 * examen físico por 8 sistemas, notas privadas, emisión de documentos médicos,
 * guardado automático y panel lateral para antecedentes e historia.
 */

import { useState, useEffect, useLayoutEffect, useRef, useMemo, useCallback } from 'react';
import { useParams, useNavigate, Link, useSearchParams, useLocation } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileCheck,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  Heart,
  History,
  Info,
  Lock,
  Mic,
  Paperclip,
  Pill,
  Plus,
  RefreshCw,
  Search,
  Share2,
  ShieldAlert,
  Sparkles,
  Square,
  Stethoscope,
  Trash2,
  Upload,
  User,
  UserCheck,
  UserPlus,
  WifiOff,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';
import appointmentService from '../../services/appointmentService';
import prescriptionAPI from '../../services/prescriptionService';
import medicalDocumentService from '../../services/medicalDocumentService';
import clinicalRecordService from '../../services/clinicalRecordService';
import ClinicalTextField from '../../components/clinical/ClinicalTextField';
import SideDrawer from '../../components/common/SideDrawer/SideDrawer';
import IdentifyPatientDrawer from '../../components/clinical/IdentifyPatientDrawer';
import useSpeechDictation from '../../hooks/useSpeechDictation';
import aiService from '../../services/aiService';
import useAudioRecorder from '../../hooks/useAudioRecorder';
import AiSoapReviewDrawer from '../../components/clinical/AiSoapReviewDrawer';
import AiImproveReviewDrawer from '../../components/clinical/AiImproveReviewDrawer';
import AiRxReviewDrawer from '../../components/clinical/AiRxReviewDrawer';
import AiRxTextDrawer from '../../components/clinical/AiRxTextDrawer';
import { ADULT_VITAL_RANGES, isVitalAbnormal, calculateBMI } from '../../utils/vitalRanges';
import { shareDocument, prefetchDocumentPdf } from '../../utils/shareDocument';
import { getCompanionSuggestions, checkMedicationAllergy } from '../../utils/companionRules';
import './EspacioClinicoPage.css';

const SEVERITY_LABELS = {
  mild: 'leve',
  moderate: 'moderada',
  severe: 'severa',
  life_threatening: 'grave'
};

function doctorTitle(gender) {
  const g = String(gender || '').toLowerCase();
  if (g === 'masculino' || g === 'male' || g === 'm') return 'Dr.';
  if (g === 'femenino' || g === 'female' || g === 'f') return 'Dra.';
  return 'Dr(a).';
}

const PHYSICAL_EXAM_SYSTEMS = [
  { key: 'general', label: 'General' },
  { key: 'headNeck', label: 'Cabeza y cuello' },
  { key: 'cardiovascular', label: 'Cardiovascular' },
  { key: 'respiratory', label: 'Respiratorio' },
  { key: 'abdomen', label: 'Abdomen' },
  { key: 'extremities', label: 'Extremidades' },
  { key: 'neurological', label: 'Neurológico' },
  { key: 'skin', label: 'Piel' }
];

export default function EspacioClinicoPage() {
  const { appointmentId } = useParams();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDraftMode = !appointmentId || appointmentId === 'nueva';
  const urlPatientId = searchParams.get('patientId');

  // Estados de consulta sin cita (Walk-in)
  const [identifiedPatient, setIdentifiedPatient] = useState(null);
  const [drawerIdentifyPatient, setDrawerIdentifyPatient] = useState(false);
  const [identifyingLoading, setIdentifyingLoading] = useState(false);
  const [identifyError, setIdentifyError] = useState('');
  const [newDraftAlert, setNewDraftAlert] = useState(null);
  const autoIdentifyRef = useRef(false);
  const identifyAndContinueRef = useRef(null);

  // Estados de carga inicial y permisos
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const [patientRecord, setPatientRecord] = useState(null);
  const [loadingRecord, setLoadingRecord] = useState(false);

  // Estado clínico principal
  const [soapNote, setSoapNote] = useState({
    subjective: '',
    objective: '',
    assessment: '',
    plan: ''
  });

  const [vitalSigns, setVitalSigns] = useState({
    systolic: '',
    diastolic: '',
    heartRate: '',
    respiratoryRate: '',
    temperature: '',
    oxygenSaturation: '',
    weightKg: '',
    heightCm: '',
    glucose: ''
  });

  const [physicalExam, setPhysicalExam] = useState(() => {
    const initial = {};
    PHYSICAL_EXAM_SYSTEMS.forEach((sys) => {
      initial[sys.key] = { status: 'not_evaluated', findings: '' };
    });
    return initial;
  });

  const [doctorNotes, setDoctorNotes] = useState('');

  // Récipe médico (medicamentos en la consulta actual)
  const [recipeItems, setRecipeItems] = useState([
    { medication: '', presentation: '', dose: '', frequency: '', duration: '', instructions: '' }
  ]);
  const [recipeIndications, setRecipeIndications] = useState('');
  const [dismissedCompanionCategories, setDismissedCompanionCategories] = useState([]);

  // Documentos médicos emitidos en esta consulta
  const [documents, setDocuments] = useState([]);

  // Récipes ya emitidos para esta cita (se muestran al finalizar y en modo lectura)
  const [issuedPrescriptions, setIssuedPrescriptions] = useState([]);

  // Errores de validación de signos vitales (de API 400)
  const [vitalErrors, setVitalErrors] = useState({});

  // Estado de guardado automático
  const [saveStatus, setSaveStatus] = useState('saved'); // 'saved', 'saving', 'offline', 'error'
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const lastSavedPayloadRef = useRef('');
  const autoSaveTimerRef = useRef(null);

  // Aviso de borrador local
  const [localDraftAlert, setLocalDraftAlert] = useState(null);

  // Estados para SideDrawers
  const [drawerFullRecord, setDrawerFullRecord] = useState(false);
  const [drawerAddAllergy, setDrawerAddAllergy] = useState(false);
  const [drawerAddCondition, setDrawerAddCondition] = useState(false);
  const [drawerPastConsultation, setDrawerPastConsultation] = useState(null);
  const [drawerLabOrder, setDrawerLabOrder] = useState(false);
  const [drawerRestNote, setDrawerRestNote] = useState(false);
  const [drawerCertificate, setDrawerCertificate] = useState(false);
  const [drawerReport, setDrawerReport] = useState(false);
  const [drawerAttachment, setDrawerAttachment] = useState(false);
  const [drawerSummary, setDrawerSummary] = useState(false);

  // Catálogo de laboratorio
  const [labCatalog, setLabCatalog] = useState([]);
  const [labSearch, setLabSearch] = useState('');
  const [selectedExams, setSelectedExams] = useState([]); // [{ category, name }]
  const [labOtherExams, setLabOtherExams] = useState('');
  const [labIndication, setLabIndication] = useState('');
  const [labDiagnosis, setLabDiagnosis] = useState('');
  const [submittingDoc, setSubmittingDoc] = useState(false);

  // Formulario Reposo
  const [restDays, setRestDays] = useState(3);
  const [restStartDate, setRestStartDate] = useState('');
  const [restIncludeDiag, setRestIncludeDiag] = useState(true);
  const [restObservations, setRestObservations] = useState('');

  // Formulario Constancia
  const [certReason, setCertReason] = useState('Atención en consulta médica');
  const [certFrom, setCertFrom] = useState('');
  const [certTo, setCertTo] = useState('');
  const [certObservations, setCertObservations] = useState('');

  // Formulario Informe Médico
  const [reportBody, setReportBody] = useState('');

  // Formulario Adjunto
  const [attachmentFile, setAttachmentFile] = useState(null);
  const [attachmentTitle, setAttachmentTitle] = useState('');
  const [storageAvailable, setStorageAvailable] = useState(true);

  // Formulario Agregar Alergia
  const [newAllergen, setNewAllergen] = useState('');
  const [newAllergySeverity, setNewAllergySeverity] = useState('moderate');
  const [newAllergyReaction, setNewAllergyReaction] = useState('');

  // Formulario Agregar Antecedente
  const [newConditionName, setNewConditionName] = useState('');
  const [newConditionType, setNewConditionType] = useState('pathological');
  const [newConditionNotes, setNewConditionNotes] = useState('');

  // Diálogo corto de confirmación para finalizar consulta
  const [confirmCompleteOpen, setConfirmCompleteOpen] = useState(false);
  const [completing, setCompleting] = useState(false);

  // Ancla activa de navegación rápida
  const [activeAnchor, setActiveAnchor] = useState('subjetivo');

  const isReadOnly = !isDraftMode && appointment?.status === 'completed';

  // --- Estados de Inteligencia Artificial (Bloque D) ---
  const [aiStatus, setAiStatus] = useState(null);
  const [aiDraftText, setAiDraftText] = useState('');
  const aiDraftTextareaRef = useRef(null);

  // Grabación de audio para dictado
  const audioRecorder = useAudioRecorder();
  const [audioTarget, setAudioTarget] = useState(null); // 'draft' | 'recipe'
  const [isTranscribing, setIsTranscribing] = useState(false);

  // Estructuración paralela SOAP + Rx (D3/D4)
  const [aiStructuringLoading, setAiStructuringLoading] = useState(false);
  const [aiSoapProposal, setAiSoapProposal] = useState({});
  const [aiRxProposal, setAiRxProposal] = useState({});
  const [aiSoapError, setAiSoapError] = useState(null);
  const [aiRxError, setAiRxError] = useState(null);
  const [drawerAiSoapReview, setDrawerAiSoapReview] = useState(false);

  // Corrección de redacción (D5)
  const [drawerAiImprove, setDrawerAiImprove] = useState(false);
  const [improveData, setImproveData] = useState({ fieldName: '', originalText: '', improvedText: '', onApply: null });
  const [improvingFieldId, setImprovingFieldId] = useState(null);
  const [aiDraftImproving, setAiDraftImproving] = useState(false);

  // Récipe desde dictado / texto (D6)
  const [drawerAiRxReview, setDrawerAiRxReview] = useState(false);
  const [drawerAiRxText, setDrawerAiRxText] = useState(false);
  const [aiRxLoadingSingle, setAiRxLoadingSingle] = useState(false);
  const [aiRxProposalSingle, setAiRxProposalSingle] = useState({});
  const [aiRxErrorSingle, setAiRxErrorSingle] = useState(null);
  const [aiAppliedToRecipe, setAiAppliedToRecipe] = useState(false);

  // Examen físico desplegable (D9)
  const [isPhysicalExamExpanded, setIsPhysicalExamExpanded] = useState(false);

  // Dictado por voz nativo del navegador para el borrador
  const handleDraftBrowserTranscript = useCallback((text) => {
    setAiDraftText((prev) => (prev ? `${prev.trim()} ${text}` : text));
  }, []);
  const draftBrowserSpeech = useSpeechDictation(handleDraftBrowserTranscript);

  // Auto-ajuste de altura para el borrador de consulta (D8). También cuando la tarjeta de IA
  // aparece después de que el texto ya llegó (consulta sin cita identificada o borrador restaurado)
  useLayoutEffect(() => {
    const el = aiDraftTextareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.6 : 500;
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [aiDraftText, aiStatus, loading]);

  // Dictado con IA solo si hay transcripción disponible y la consulta ya existe; si no, el navegador
  const aiDictationReady = Boolean(aiStatus?.transcriptionAvailable && appointment && !isReadOnly);
  const transcribeForField = useCallback(
    async (blob, mimeType) => {
      const res = await aiService.transcribe({ appointmentId: appointment.id, audioBlob: blob, mimeType });
      return res?.text || '';
    },
    [appointment]
  );

  // Carga de estado de IA
  const fetchAiStatus = useCallback(async () => {
    try {
      const data = await aiService.status();
      setAiStatus(data);
    } catch (e) {
      console.warn('[EspacioClinico] Error consultando estado de IA:', e);
    }
  }, []);

  // Helper para formatear tiempo de grabación MM:SS
  const formatTimer = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  // Resumen textual del estado del examen físico (D9)
  const physicalExamSummary = useMemo(() => {
    let evaluated = 0;
    let abnormal = 0;
    PHYSICAL_EXAM_SYSTEMS.forEach((sys) => {
      const s = physicalExam[sys.key]?.status;
      if (s === 'normal') evaluated++;
      else if (s === 'abnormal') {
        evaluated++;
        abnormal++;
      }
    });
    if (evaluated === 0 && !soapNote.objective?.trim()) {
      return 'Sin evaluar';
    }
    const evalText = `${evaluated} ${evaluated === 1 ? 'sistema evaluado' : 'sistemas evaluados'}`;
    if (abnormal > 0) {
      return `${evalText}, ${abnormal} ${abnormal === 1 ? 'anormal' : 'anormales'}`;
    }
    return evalText;
  }, [physicalExam, soapNote.objective]);

  useEffect(() => {
    fetchAiStatus();
  }, [fetchAiStatus]);

  // Restaurar estado transferido si viene de vincular paciente en consulta sin cita
  useEffect(() => {
    if (location.state?.recipeItems && Array.isArray(location.state.recipeItems)) {
      setRecipeItems(location.state.recipeItems);
    }
    if (location.state?.recipeIndications) {
      setRecipeIndications(location.state.recipeIndications);
    }
    if (location.state?.aiDraftText) {
      setAiDraftText(location.state.aiDraftText);
    }
    if (location.state?.successMessage) {
      toast.success(location.state.successMessage, { duration: 5000 });
      navigate(location.pathname, { replace: true, state: { ...location.state, successMessage: undefined } });
    }
  }, [location.state, location.pathname, navigate]);

  // Consultas anteriores del paciente, sin incluir la que se está atendiendo
  const pastConsultations = (patientRecord?.consultations || []).filter(
    (c) => !appointment?.id || c.id !== appointment.id
  );

  // vitalsSeries viene en orden ascendente: el último elemento es el más reciente
  const latestSeriesVitals = patientRecord?.vitalsSeries?.length
    ? patientRecord.vitalsSeries[patientRecord.vitalsSeries.length - 1]
    : null;

  // Helper para edad del paciente
  const patientAge = useMemo(() => {
    // El backend envía la edad como texto ("34 años"); aquí se necesita el número
    const recordAge = parseInt(patientRecord?.patient?.age, 10);
    if (!Number.isNaN(recordAge)) return recordAge;
    const dob = isDraftMode
      ? (identifiedPatient?.patientProfile?.dateOfBirth || patientRecord?.patientProfile?.dateOfBirth)
      : appointment?.patient?.patientProfile?.dateOfBirth;
    if (!dob) return null;
    const birth = new Date(dob);
    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const m = now.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }, [appointment, patientRecord, isDraftMode, identifiedPatient]);

  // Cálculo en vivo de IMC
  const bmiInfo = useMemo(() => {
    return calculateBMI(vitalSigns.weightKg, vitalSigns.heightCm);
  }, [vitalSigns.weightKg, vitalSigns.heightCm]);

  // Fecha de inicio por defecto para reposo
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setRestStartDate(today);
  }, []);

  // 1. Cargar cita médica al montar
  useEffect(() => {
    let mounted = true;

    async function loadAppointmentData() {
      if (isDraftMode) {
        setLoading(false);
        // Comprobar borrador en localStorage para consulta sin cita
        try {
          const rawDraft = localStorage.getItem('citamed_draft_new');
          if (rawDraft) {
            const draftData = JSON.parse(rawDraft);
            setNewDraftAlert(draftData);
          }
        } catch (e) {
          console.warn('[EspacioClinico] Error leyendo borrador local walk-in:', e);
        }

        // Si viene ?patientId=123 (desde la ficha del paciente) se identifica directo
        if (urlPatientId && !autoIdentifyRef.current) {
          autoIdentifyRef.current = true;
          identifyAndContinueRef.current?.({
            patientId: Number(urlPatientId),
            reasonForVisit: 'Consulta sin cita'
          });
        }
        return;
      }

      try {
        setLoading(true);
        const res = await appointmentService.getById(appointmentId);
        const apt = res.data;

        if (!apt) {
          throw new Error('Cita no encontrada');
        }

        // Verificar que pertenezca al médico autenticado (salvo admin)
        if (user && user.role !== 'admin' && apt.doctorId !== user.id) {
          if (mounted) {
            setAccessDenied(true);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setAppointment(apt);

          // Cargar notas SOAP existentes si las hay
          if (apt.soapNote) {
            setSoapNote({
              subjective: apt.soapNote.subjective || '',
              objective: apt.soapNote.objective || '',
              assessment: apt.soapNote.assessment || apt.diagnosis || '',
              plan: apt.soapNote.plan || ''
            });
          } else if (apt.diagnosis) {
            setSoapNote((prev) => ({ ...prev, assessment: apt.diagnosis }));
          }

          // Cargar signos vitales existentes
          if (apt.vitalSigns && typeof apt.vitalSigns === 'object') {
            setVitalSigns((prev) => ({ ...prev, ...apt.vitalSigns }));
          }

          // Cargar examen físico existente
          if (apt.physicalExam && typeof apt.physicalExam === 'object') {
            setPhysicalExam((prev) => ({ ...prev, ...apt.physicalExam }));
            const hasAnyEvaluated = Object.values(apt.physicalExam).some(
              (v) => v && v.status && v.status !== 'not_evaluated'
            );
            if (hasAnyEvaluated || Boolean(apt.soapNote?.objective?.trim())) {
              setIsPhysicalExamExpanded(true);
            }
          }

          // Cargar notas privadas
          if (apt.doctorNotes) {
            setDoctorNotes(apt.doctorNotes);
          }

          // Si la cita está confirmada y es hoy, iniciarla automáticamente (PUT /start)
          if (apt.status === 'confirmed') {
            try {
              await appointmentService.start(apt.id);
              apt.status = 'in_progress';
            } catch (startErr) {
              console.warn('[EspacioClinico] Auto-start no aplicable o ya iniciada:', startErr);
            }
          }

          // Comprobar borrador en localStorage
          try {
            const draftKey = `citamed_draft_apt_${apt.id}`;
            const rawDraft = localStorage.getItem(draftKey);
            if (rawDraft) {
              const draftData = JSON.parse(rawDraft);
              const serverTime = apt.clinicalNoteSavedAt ? new Date(apt.clinicalNoteSavedAt).getTime() : 0;
              if (draftData.savedAt && draftData.savedAt > serverTime) {
                setLocalDraftAlert(draftData);
              }
            }
          } catch (e) {
            console.warn('[EspacioClinico] Error leyendo borrador local:', e);
          }
        }

        // Cargar ficha y antecedentes del paciente
        const pId = apt.patientId || apt.patient?.id;
        if (pId) {
          setLoadingRecord(true);
          try {
            const recRes = await clinicalRecordService.getPatientRecordForDoctor(pId);
            if (mounted) {
              setPatientRecord(recRes.data);
            }
          } catch (recErr) {
            console.error('[EspacioClinico] Error cargando ficha del paciente:', recErr);
          } finally {
            if (mounted) setLoadingRecord(false);
          }

          // Cargar documentos del paciente
          try {
            const docRes = await medicalDocumentService.getByPatient(pId);
            if (mounted) {
              const docs = docRes.data || [];
              setDocuments(docs);
              docs
                .filter((d) => d.appointmentId === apt.id && d.type !== 'attachment' && d.status === 'active')
                .forEach((d) => prefetchDocumentPdf(d.type, d.id, medicalDocumentService.downloadPdf));
            }
          } catch (docErr) {
            console.error('[EspacioClinico] Error cargando documentos:', docErr);
          }
        }

        // Cargar récipes ya emitidos en esta cita
        try {
          const prescRes = await prescriptionAPI.getByAppointment(apt.id);
          const list = prescRes.data?.data || [];
          if (mounted) setIssuedPrescriptions(list);
          list
            .filter((p) => p.status === 'active')
            .forEach((p) => prefetchDocumentPdf('prescription', p.id, prescriptionAPI.downloadPdf));
        } catch (prescErr) {
          console.error('[EspacioClinico] Error cargando récipes de la cita:', prescErr);
        }
      } catch (err) {
        console.error('[EspacioClinico] Error cargando datos de la cita:', err);
        if (mounted) setAccessDenied(true);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadAppointmentData();

    return () => {
      mounted = false;
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [appointmentId, user, isDraftMode, urlPatientId]);

  // Handlers para identificar paciente en consulta sin cita (Walk-in)
  const identifyAndContinue = async (body) => {
    try {
      setIdentifyingLoading(true);
      setIdentifyError('');
      const res = await appointmentService.createWalkIn(body);
      const newApt = res.appointment;
      const payload = { soapNote, vitalSigns, physicalExam, doctorNotes };
      try {
        await appointmentService.saveClinicalNote(newApt.id, payload);
      } catch (errSave) {
        // Si el servidor no guardó la nota, queda como borrador local de la cita
        // para que la página de la consulta ofrezca restaurarla
        console.warn('[EspacioClinico] Error guardando nota clínica al identificar:', errSave);
        try {
          localStorage.setItem(
            `citamed_draft_apt_${newApt.id}`,
            JSON.stringify({ ...payload, aiDraftText, savedAt: Date.now() })
          );
        } catch {
          // Ignorar
        }
      }
      try {
        localStorage.removeItem('citamed_draft_new');
      } catch {
        // Ignorar
      }
      setDrawerIdentifyPatient(false);
      const fullName = `${res.patient?.firstName || ''} ${res.patient?.lastName || ''}`.trim();
      navigate(`/medico/consulta/${newApt.id}`, {
        replace: true,
        state: {
          recipeItems,
          recipeIndications,
          aiDraftText,
          successMessage: res.linkedExisting && body.newPatient
            ? 'Este paciente ya estaba registrado en CitaMed; la consulta quedó asociada a su historia.'
            : `Consulta asociada a ${fullName}`
        }
      });
    } catch (err) {
      console.error('[EspacioClinico] Error identificando al paciente:', err);
      const data = err.response?.data;
      setIdentifyError(data?.errors?.[0]?.message || data?.message || 'No se pudo identificar al paciente. Intenta de nuevo.');
      setDrawerIdentifyPatient(true);
    } finally {
      setIdentifyingLoading(false);
    }
  };
  identifyAndContinueRef.current = identifyAndContinue;

  const handleIdentifyExistingPatient = (patient) =>
    identifyAndContinue({ patientId: patient.id, reasonForVisit: 'Consulta sin cita' });

  const handleCreateNewPatient = ({ reasonForVisit, ...newPatientData }) =>
    identifyAndContinue({ newPatient: newPatientData, reasonForVisit: reasonForVisit || 'Consulta sin cita' });

  const guardDraftMode = (actionDescription) => {
    if (isDraftMode) {
      setDrawerIdentifyPatient(true);
      toast(`Identifica al paciente para ${actionDescription}`, { icon: 'ℹ️' });
      return true;
    }
    return false;
  };

  // Cargar catálogo de laboratorio al abrir drawer de órdenes
  const handleOpenLabDrawer = async () => {
    setDrawerLabOrder(true);
    if (labCatalog.length === 0) {
      try {
        const res = await medicalDocumentService.getLabCatalog();
        setLabCatalog(res.data || []);
      } catch (err) {
        console.error('[EspacioClinico] Error cargando catálogo de laboratorios:', err);
      }
    }
  };

  // Pre-llenar informe médico con SOAP actual
  const handleOpenReportDrawer = () => {
    const defaultBody = [
      `MOTIVO DE CONSULTA Y ENFERMEDAD ACTUAL:\n${soapNote.subjective || 'No especificado'}\n`,
      `EXAMEN FÍSICO Y SIGNOS VITALES:\n${soapNote.objective || 'Sin hallazgos adicionales registrados'}\n` +
        `TA: ${vitalSigns.systolic || '-'}/${vitalSigns.diastolic || '-'} mmHg, ` +
        `FC: ${vitalSigns.heartRate || '-'} lpm, FR: ${vitalSigns.respiratoryRate || '-'} rpm, ` +
        `Temp: ${vitalSigns.temperature || '-'} °C, SpO2: ${vitalSigns.oxygenSaturation || '-'} %, ` +
        `Peso: ${vitalSigns.weightKg || '-'} kg, Talla: ${vitalSigns.heightCm || '-'} cm, ` +
        `IMC: ${bmiInfo.bmi || '-'} (${bmiInfo.category || 'N/A'})\n`,
      `EVALUACIÓN Y DIAGNÓSTICO:\n${soapNote.assessment || 'En estudio'}\n`,
      `PLAN DE TRATAMIENTO E INDICACIONES:\n${soapNote.plan || 'Continuar medidas generales'}`
    ].join('\n');

    setReportBody(defaultBody);
    setDrawerReport(true);
  };

  // 2. Guardado automático (Debounce 3 segundos)
  const executeAutoSave = useCallback(
    async (payload) => {
      if (isReadOnly) return;

      if (isDraftMode) {
        // Mientras se ofrece continuar un borrador previo no se sobrescribe
        if (newDraftAlert) return;
        const hasContent =
          Object.values(payload.soapNote || {}).some((v) => String(v || '').trim()) ||
          Object.values(payload.vitalSigns || {}).some((v) => String(v ?? '').trim()) ||
          Object.values(payload.physicalExam || {}).some((v) => v?.status && v.status !== 'not_evaluated') ||
          String(payload.doctorNotes || '').trim() ||
          recipeItems.some((it) => String(it.medication || '').trim()) ||
          String(recipeIndications || '').trim() ||
          String(aiDraftText || '').trim();
        if (!hasContent) return;
        try {
          const draftData = {
            ...payload,
            recipeItems,
            recipeIndications,
            aiDraftText,
            identifiedPatient,
            savedAt: Date.now()
          };
          localStorage.setItem('citamed_draft_new', JSON.stringify(draftData));
          setSaveStatus('saved');
        } catch (lsErr) {
          console.warn('[EspacioClinico] Fallo al escribir borrador en localStorage:', lsErr);
        }
        return;
      }

      if (!appointment) return;

      // Copia local primero: incluye el borrador de IA, que no va al servidor
      try {
        const draftKey = `citamed_draft_apt_${appointment.id}`;
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            ...payload,
            aiDraftText,
            savedAt: Date.now()
          })
        );
      } catch (lsErr) {
        console.warn('[EspacioClinico] Fallo al escribir en localStorage:', lsErr);
      }

      const payloadStr = JSON.stringify(payload);
      if (payloadStr === lastSavedPayloadRef.current) {
        return; // Sin cambios para el servidor
      }

      setSaveStatus('saving');
      setSaveErrorMessage('');

      try {
        await appointmentService.saveClinicalNote(appointment.id, payload);
        lastSavedPayloadRef.current = payloadStr;
        setSaveStatus('saved');
        setVitalErrors({});
      } catch (err) {
        console.error('[EspacioClinico] Error en guardado automático:', err);
        if (!navigator.onLine || err.message?.includes('Network')) {
          setSaveStatus('offline');
        } else {
          setSaveStatus('error');
          const msg = err.response?.data?.message || 'Error al guardar cambios';
          setSaveErrorMessage(msg);

          // Si hay errores de campos específicos en vitalSigns
          if (err.response?.data?.errors) {
            const errMap = {};
            err.response.data.errors.forEach((e) => {
              errMap[e.field] = e.message;
            });
            setVitalErrors(errMap);
          }
        }
      }
    },
    [isReadOnly, isDraftMode, appointment, recipeItems, recipeIndications, aiDraftText, identifiedPatient, newDraftAlert]
  );

  // Disparar temporizador al modificar notas, signos o examen físico
  useEffect(() => {
    if (loading || isReadOnly || (!appointment && !isDraftMode)) return;

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    const payload = {
      soapNote,
      vitalSigns,
      physicalExam,
      doctorNotes
    };

    autoSaveTimerRef.current = setTimeout(() => {
      executeAutoSave(payload);
    }, 3000);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [soapNote, vitalSigns, physicalExam, doctorNotes, recipeItems, recipeIndications, aiDraftText, loading, isReadOnly, appointment, isDraftMode, executeAutoSave]);

  // Restaurar borrador local
  const handleRestoreLocalDraft = () => {
    if (!localDraftAlert) return;
    if (localDraftAlert.soapNote) setSoapNote(localDraftAlert.soapNote);
    if (localDraftAlert.vitalSigns) setVitalSigns(localDraftAlert.vitalSigns);
    if (localDraftAlert.physicalExam) {
      setPhysicalExam(localDraftAlert.physicalExam);
      const hasAnyEvaluated = Object.values(localDraftAlert.physicalExam).some(
        (v) => v && v.status && v.status !== 'not_evaluated'
      );
      if (hasAnyEvaluated || Boolean(localDraftAlert.soapNote?.objective?.trim())) {
        setIsPhysicalExamExpanded(true);
      }
    }
    if (localDraftAlert.doctorNotes) setDoctorNotes(localDraftAlert.doctorNotes);
    if (localDraftAlert.aiDraftText) setAiDraftText(localDraftAlert.aiDraftText);
    setLocalDraftAlert(null);
  };

  const handleDiscardLocalDraft = () => {
    if (isDraftMode) {
      try {
        localStorage.removeItem('citamed_draft_new');
      } catch {
        // Ignorar
      }
      setNewDraftAlert(null);
      return;
    }
    if (appointment) {
      try {
        localStorage.removeItem(`citamed_draft_apt_${appointment.id}`);
      } catch {
        // Ignorar error al limpiar storage
      }
    }
    setLocalDraftAlert(null);
  };

  // Manejadores de examen físico
  const handleSystemStatusChange = (systemKey, status) => {
    if (isReadOnly) return;
    setPhysicalExam((prev) => ({
      ...prev,
      [systemKey]: {
        ...prev[systemKey],
        status,
        findings: status === 'normal' || status === 'not_evaluated' ? '' : prev[systemKey]?.findings || ''
      }
    }));
  };

  const handleSystemFindingsChange = (systemKey, findings) => {
    if (isReadOnly) return;
    setPhysicalExam((prev) => ({
      ...prev,
      [systemKey]: {
        ...prev[systemKey],
        findings
      }
    }));
  };

  const handleMarkAllNormal = () => {
    if (isReadOnly) return;
    setIsPhysicalExamExpanded(true);
    const allNormal = {};
    PHYSICAL_EXAM_SYSTEMS.forEach((sys) => {
      allNormal[sys.key] = { status: 'normal', findings: '' };
    });
    setPhysicalExam(allNormal);
  };

  // --- Handlers de Inteligencia Artificial (Bloque D) ---
  function formatAiErrorMessage(err) {
    if (!err) return 'Error desconocido al procesar con IA';
    const code = err.response?.data?.code || err.code;
    const status = err.response?.status;
    if (status === 402 || code === 'AI_QUOTA_EXCEEDED') {
      return 'Se agotaron tus acciones de IA de este mes.';
    }
    if (status === 503 || code === 'AI_UNAVAILABLE') {
      return 'La IA no está disponible en este momento; puedes seguir escribiendo normalmente.';
    }
    if (status === 409 || code === 'AI_CONSENT_REQUIRED') {
      return 'Debes autorizar el uso de IA con el consentimiento del paciente.';
    }
    if (status === 422 || code === 'AUDIO_UNINTELLIGIBLE') {
      return 'No se entendió el audio; intenta de nuevo más cerca del micrófono.';
    }
    return err.response?.data?.message || err.message || 'Error al comunicarse con el servicio de IA.';
  }

  const handleAiError = (err) => {
    const msg = formatAiErrorMessage(err);
    toast.error(msg);
  };


  const handleStartDraftAudio = () => {
    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para usar la IA', { icon: 'ℹ️' });
      return;
    }
    setAudioTarget('draft');
    audioRecorder.start().catch((err) => {
      console.error('[EspacioClinico] Error iniciando grabación:', err);
      toast.error(err.message || 'Error al acceder al micrófono');
      setAudioTarget(null);
    });
  };

  const handleStopDraftAudio = async () => {
    const res = await audioRecorder.stop();
    setAudioTarget(null);
    if (!res || !res.blob) return;

    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para usar la transcripción con IA', { icon: 'ℹ️' });
      return;
    }

    try {
      setIsTranscribing(true);
      const tRes = await aiService.transcribe({
        appointmentId: appointment.id,
        audioBlob: res.blob,
        mimeType: res.mimeType
      });
      fetchAiStatus();
      if (tRes?.text) {
        setAiDraftText((prev) => (prev ? `${prev.trim()}\n${tRes.text.trim()}` : tRes.text.trim()));
        toast.success('Audio transcrito y agregado al borrador');
      } else {
        toast('No se detectó texto en el audio dictado', { icon: 'ℹ️' });
      }
    } catch (err) {
      console.error('[EspacioClinico] Error transcribiendo audio:', err);
      handleAiError(err);
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleImproveDraft = async () => {
    if (!aiDraftText?.trim()) return;
    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para usar la IA', { icon: 'ℹ️' });
      return;
    }

    try {
      setAiDraftImproving(true);
      const res = await aiService.improve({
        appointmentId: appointment.id,
        text: aiDraftText
      });
      fetchAiStatus();
      setImproveData({
        fieldName: 'Borrador de la consulta',
        originalText: aiDraftText,
        improvedText: res.text,
        onApply: (improved) => {
          setAiDraftText(improved);
          toast.success('Borrador corregido');
        }
      });
      setDrawerAiImprove(true);
    } catch (err) {
      console.error('[EspacioClinico] Error corrigiendo borrador:', err);
      handleAiError(err);
    } finally {
      setAiDraftImproving(false);
    }
  };

  const handleStructureWithAi = async () => {
    if (!aiDraftText?.trim()) return;
    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para estructurar la consulta con IA', { icon: 'ℹ️' });
      return;
    }

    try {
      setAiStructuringLoading(true);
      setAiSoapError(null);
      setAiRxError(null);

      const [soapResult, rxResult] = await Promise.allSettled([
        aiService.soap({ appointmentId: appointment.id, text: aiDraftText }),
        aiService.rx({ appointmentId: appointment.id, text: aiDraftText })
      ]);

      fetchAiStatus();

      let soapProp = {};
      let rxProp = {};
      let sErr = null;
      let rErr = null;

      if (soapResult.status === 'fulfilled') {
        soapProp = soapResult.value.proposal || {};
      } else {
        sErr = formatAiErrorMessage(soapResult.reason);
      }

      if (rxResult.status === 'fulfilled') {
        rxProp = rxResult.value.proposal || {};
      } else {
        rErr = formatAiErrorMessage(rxResult.reason);
      }

      if (soapResult.status === 'rejected' && rxResult.status === 'rejected') {
        toast.error(sErr || rErr || 'Error estructurando consulta con IA');
        return;
      }

      setAiSoapProposal(soapProp);
      setAiRxProposal(rxProp);
      setAiSoapError(sErr);
      setAiRxError(rErr);
      setDrawerAiSoapReview(true);
    } catch (err) {
      console.error('[EspacioClinico] Error inesperado estructurando consulta:', err);
      handleAiError(err);
    } finally {
      setAiStructuringLoading(false);
    }
  };

  const handleApplyAiSoapProposal = ({
    soapUpdates,
    vitalsUpdates,
    examUpdates,
    recipeItemsUpdates,
    recipeIndicationsUpdate,
    hasRecipeApplied,
    hasExamApplied
  }) => {
    // 1. SOAP
    setSoapNote((prev) => ({
      ...prev,
      ...soapUpdates
    }));

    // 2. Signos vitales
    setVitalSigns((prev) => ({
      ...prev,
      ...vitalsUpdates
    }));

    // 3. Examen físico
    if (Object.keys(examUpdates || {}).length > 0) {
      setPhysicalExam((prev) => ({
        ...prev,
        ...examUpdates
      }));
    }
    if (hasExamApplied) {
      setIsPhysicalExamExpanded(true);
    }

    // 4. Medicamentos del récipe
    if (recipeItemsUpdates && recipeItemsUpdates.length > 0) {
      setRecipeItems((prev) => {
        const isSingleEmpty =
          prev.length === 1 &&
          !prev[0].medication?.trim() &&
          !prev[0].presentation?.trim() &&
          !prev[0].dose?.trim();
        return isSingleEmpty ? recipeItemsUpdates : [...prev, ...recipeItemsUpdates];
      });
    }

    // Indicaciones del récipe
    if (recipeIndicationsUpdate) {
      setRecipeIndications((prev) => {
        if (!prev?.trim()) return recipeIndicationsUpdate;
        return `${prev.trim()}\n${recipeIndicationsUpdate}`;
      });
    }

    if (hasRecipeApplied) {
      setAiAppliedToRecipe(true);
    }

    toast.success('Propuesta de IA aplicada a la consulta');
  };

  const handleImproveField = async (fieldName, text, setter) => {
    if (!text?.trim()) return;
    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para usar la IA', { icon: 'ℹ️' });
      return;
    }

    try {
      setImprovingFieldId(fieldName);
      const res = await aiService.improve({
        appointmentId: appointment.id,
        field: fieldName,
        text
      });
      fetchAiStatus();
      setImproveData({
        fieldName,
        originalText: text,
        improvedText: res.text,
        onApply: (improved) => {
          setter(improved);
          toast.success(`Texto de ${fieldName} actualizado`);
        }
      });
      setDrawerAiImprove(true);
    } catch (err) {
      console.error(`[EspacioClinico] Error mejorando campo ${fieldName}:`, err);
      handleAiError(err);
    } finally {
      setImprovingFieldId(null);
    }
  };

  const handleStartRecipeAudio = () => {
    if (isDraftMode && !appointment) {
      toast('Identifica al paciente para usar la IA', { icon: 'ℹ️' });
      return;
    }
    setAudioTarget('recipe');
    audioRecorder.start().catch((err) => {
      console.error('[EspacioClinico] Error iniciando grabación de récipe:', err);
      toast.error(err.message || 'Error al acceder al micrófono');
      setAudioTarget(null);
    });
  };

  const handleStopRecipeAudio = async () => {
    const res = await audioRecorder.stop();
    setAudioTarget(null);
    if (!res || !res.blob) return;

    try {
      setIsTranscribing(true);
      const tRes = await aiService.transcribe({
        appointmentId: appointment.id,
        audioBlob: res.blob,
        mimeType: res.mimeType
      });
      fetchAiStatus();
      if (!tRes?.text) {
        toast.error('No se obtuvo texto de la grabación');
        return;
      }

      setAiRxLoadingSingle(true);
      setDrawerAiRxReview(true);
      const rxRes = await aiService.rx({
        appointmentId: appointment.id,
        text: tRes.text
      });
      setAiRxProposalSingle(rxRes.proposal || {});
      setAiRxErrorSingle(null);
      fetchAiStatus();
    } catch (err) {
      console.error('[EspacioClinico] Error procesando dictado de récipe:', err);
      handleAiError(err);
      setAiRxErrorSingle(formatAiErrorMessage(err));
    } finally {
      setIsTranscribing(false);
      setAiRxLoadingSingle(false);
    }
  };

  const handleRxFromText = async (text) => {
    if (!text?.trim()) return;
    setDrawerAiRxText(false);
    setDrawerAiRxReview(true);
    setAiRxLoadingSingle(true);
    setAiRxErrorSingle(null);

    try {
      const rxRes = await aiService.rx({
        appointmentId: appointment.id,
        text
      });
      setAiRxProposalSingle(rxRes.proposal || {});
      setAiRxErrorSingle(null);
      fetchAiStatus();
    } catch (err) {
      console.error('[EspacioClinico] Error generando récipe desde texto:', err);
      handleAiError(err);
      setAiRxErrorSingle(formatAiErrorMessage(err));
    } finally {
      setAiRxLoadingSingle(false);
    }
  };

  const handleApplyAiRxProposal = ({ items, indications }) => {
    if (items && items.length > 0) {
      setRecipeItems((prev) => {
        const isSingleEmpty =
          prev.length === 1 &&
          !prev[0].medication?.trim() &&
          !prev[0].presentation?.trim() &&
          !prev[0].dose?.trim();
        return isSingleEmpty ? items : [...prev, ...items];
      });
      setAiAppliedToRecipe(true);
    }

    if (indications) {
      setRecipeIndications((prev) => {
        if (!prev?.trim()) return indications;
        return `${prev.trim()}\n${indications}`;
      });
    }

    toast.success('Medicamentos agregados al récipe');
  };

  // Manejadores de récipe
  const handleAddRecipeItem = () => {
    if (isReadOnly) return;
    setRecipeItems((prev) => [
      ...prev,
      { medication: '', presentation: '', dose: '', frequency: '', duration: '', instructions: '' }
    ]);
  };

  const handleUpdateRecipeItem = (index, field, value) => {
    if (isReadOnly) return;
    setRecipeItems((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleRemoveRecipeItem = (index) => {
    if (isReadOnly) return;
    setRecipeItems((prev) => prev.filter((_, i) => i !== index));
  };

  const companionSuggestions = useMemo(() => {
    return getCompanionSuggestions(recipeItems, dismissedCompanionCategories);
  }, [recipeItems, dismissedCompanionCategories]);

  const handleAddCompanionMedication = (suggestion) => {
    setRecipeItems((prev) => [
      ...prev,
      {
        medication: suggestion.defaultMedication,
        presentation: '',
        dose: '1 dosis diaria',
        frequency: 'Cada 24 horas',
        duration: '7 días',
        instructions: 'Tomar según indicación médica'
      }
    ]);
    setDismissedCompanionCategories((prev) => [...prev, suggestion.id]);
  };

  const handleDismissCompanion = (categoryId) => {
    setDismissedCompanionCategories((prev) => [...prev, categoryId]);
  };

  // Emisión de Orden de Exámenes
  const handleCreateLabOrder = async (e) => {
    e.preventDefault();
    if (guardDraftMode('emitir orden de exámenes')) return;
    if (selectedExams.length === 0 && !labOtherExams.trim()) {
      alert('Debes seleccionar al menos un examen o escribir uno en otros exámenes.');
      return;
    }

    setSubmittingDoc(true);
    try {
      const res = await medicalDocumentService.create({
        appointmentId: appointment.id,
        type: 'lab_order',
        content: {
          exams: selectedExams,
          otherExams: labOtherExams.trim() || undefined,
          clinicalIndication: labIndication.trim() || undefined,
          presumptiveDiagnosis: labDiagnosis.trim() || soapNote.assessment.trim() || undefined
        }
      });
      addIssuedDocument(res.data);
      setDrawerLabOrder(false);
      setSelectedExams([]);
      setLabOtherExams('');
      setLabIndication('');
      setLabDiagnosis('');
      alert('Orden de exámenes emitida exitosamente.');
    } catch (err) {
      console.error('Error emitiendo orden de exámenes:', err);
      alert(err.response?.data?.message || 'Error al emitir orden de exámenes');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Emisión de Reposo Médico
  const handleCreateRestNote = async (e) => {
    e.preventDefault();
    if (guardDraftMode('emitir reposo médico')) return;
    setSubmittingDoc(true);
    try {
      const res = await medicalDocumentService.create({
        appointmentId: appointment.id,
        type: 'rest_note',
        content: {
          days: parseInt(restDays, 10),
          startDate: restStartDate,
          includeDiagnosis: restIncludeDiag,
          diagnosis: restIncludeDiag ? soapNote.assessment : undefined,
          observations: restObservations.trim() || undefined
        }
      });
      addIssuedDocument(res.data);
      setDrawerRestNote(false);
      alert('Reposo médico emitido exitosamente.');
    } catch (err) {
      console.error('Error emitiendo reposo:', err);
      alert(err.response?.data?.message || 'Error al emitir reposo');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Emisión de Constancia
  const handleCreateCertificate = async (e) => {
    e.preventDefault();
    if (guardDraftMode('emitir constancia médica')) return;
    setSubmittingDoc(true);
    try {
      const res = await medicalDocumentService.create({
        appointmentId: appointment.id,
        type: 'certificate',
        content: {
          reason: certReason.trim() || undefined,
          attendedFrom: certFrom.trim() || undefined,
          attendedTo: certTo.trim() || undefined,
          observations: certObservations.trim() || undefined
        }
      });
      addIssuedDocument(res.data);
      setDrawerCertificate(false);
      alert('Constancia médica emitida exitosamente.');
    } catch (err) {
      console.error('Error emitiendo constancia:', err);
      alert(err.response?.data?.message || 'Error al emitir constancia');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Emisión de Informe Médico
  const handleCreateReport = async (e) => {
    e.preventDefault();
    if (guardDraftMode('emitir informe médico')) return;
    if (!reportBody.trim()) {
      alert('El informe médico debe contener texto.');
      return;
    }
    setSubmittingDoc(true);
    try {
      const res = await medicalDocumentService.create({
        appointmentId: appointment.id,
        type: 'medical_report',
        content: {
          body: reportBody.trim()
        }
      });
      addIssuedDocument(res.data);
      setDrawerReport(false);
      alert('Informe médico emitido exitosamente.');
    } catch (err) {
      console.error('Error emitiendo informe:', err);
      alert(err.response?.data?.message || 'Error al emitir informe');
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Subir Archivo Adjunto
  const handleUploadAttachment = async (e) => {
    e.preventDefault();
    if (guardDraftMode('adjuntar archivos')) return;
    if (!attachmentFile) {
      alert('Por favor selecciona un archivo.');
      return;
    }
    setSubmittingDoc(true);
    try {
      const formData = new FormData();
      formData.append('file', attachmentFile);
      formData.append('appointmentId', appointment.id);
      formData.append('title', attachmentTitle.trim() || attachmentFile.name);

      const res = await medicalDocumentService.uploadAttachment(formData);
      addIssuedDocument(res.data);
      setDrawerAttachment(false);
      setAttachmentFile(null);
      setAttachmentTitle('');
      alert('Archivo adjuntado exitosamente.');
    } catch (err) {
      console.error('Error subiendo adjunto:', err);
      if (err.response?.status === 503) {
        setStorageAvailable(false);
        alert('El servicio de almacenamiento de archivos adjuntos no está activo actualmente.');
      } else {
        alert(err.response?.data?.message || 'Error al subir archivo');
      }
    } finally {
      setSubmittingDoc(false);
    }
  };

  // Descarga de PDF de documento médico
  const handleDownloadDocPdf = async (doc) => {
    try {
      const res = await medicalDocumentService.downloadPdf(doc.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${doc.type}-${doc.verificationCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('Error al descargar el PDF.');
    }
  };

  // Anular documento médico
  const handleVoidDoc = async (docId) => {
    const reason = window.prompt('Indica el motivo de la anulación del documento:');
    if (!reason || !reason.trim()) return;

    try {
      await medicalDocumentService.void(docId, reason.trim());
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, status: 'voided', voidReason: reason.trim() } : d))
      );
      alert('Documento anulado.');
    } catch (err) {
      console.error('Error anulando documento:', err);
      alert(err.response?.data?.message || 'Error al anular documento');
    }
  };

  // Agregar Alergia al paciente
  const handleAddAllergySubmit = async (e) => {
    e.preventDefault();
    if (guardDraftMode('registrar alergias')) return;
    if (!newAllergen.trim()) return;
    const pId = appointment?.patientId || appointment?.patient?.id || identifiedPatient?.id;
    try {
      const res = await clinicalRecordService.addPatientAllergy(pId, {
        allergen: newAllergen.trim(),
        severity: newAllergySeverity,
        reaction: newAllergyReaction.trim() || undefined
      });
      // Actualizar registro en memoria
      setPatientRecord((prev) => ({
        ...prev,
        allergies: [...(prev?.allergies || []), res.data]
      }));
      setDrawerAddAllergy(false);
      setNewAllergen('');
      setNewAllergyReaction('');
      alert('Alergia registrada.');
    } catch (err) {
      console.error('Error registrando alergia:', err);
      alert(err.response?.data?.message || 'Error al registrar alergia');
    }
  };

  // Agregar Antecedente al paciente
  const handleAddConditionSubmit = async (e) => {
    e.preventDefault();
    if (guardDraftMode('registrar antecedentes')) return;
    if (!newConditionName.trim()) return;
    const pId = appointment?.patientId || appointment?.patient?.id || identifiedPatient?.id;
    try {
      const res = await clinicalRecordService.addPatientCondition(pId, {
        condition: newConditionName.trim(),
        type: newConditionType,
        notes: newConditionNotes.trim() || undefined
      });
      setPatientRecord((prev) => ({
        ...prev,
        conditions: [...(prev?.conditions || []), res.data]
      }));
      setDrawerAddCondition(false);
      setNewConditionName('');
      setNewConditionNotes('');
      alert('Condición médica registrada.');
    } catch (err) {
      console.error('Error registrando condición:', err);
      alert(err.response?.data?.message || 'Error al registrar condición');
    }
  };

  // Compartir documento médico verificado
  const handleShareDocument = (doc) => {
    shareDocument({
      type: doc.type,
      documentId: doc.id,
      verificationCode: doc.verificationCode,
      patientName: patientFullName,
      doctorName: `${doctorTitle(user?.gender)} ${user?.firstName || ''} ${user?.lastName || ''}`.trim(),
      date: new Intl.DateTimeFormat('es-VE', {
        timeZone: 'America/Caracas',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      }).format(new Date()),
      patientPhone: patient?.phone || '',
      isPatientSharing: false
    });
  };

  // Agrega un documento recién emitido y deja su PDF listo para compartir desde el clic
  const addIssuedDocument = (doc) => {
    if (!doc) return;
    setDocuments((prev) => [doc, ...prev]);
    if (doc.type !== 'attachment' && doc.id) {
      prefetchDocumentPdf(doc.type, doc.id, medicalDocumentService.downloadPdf);
    }
  };

  const handleDownloadPrescriptionPdf = async (presc) => {
    try {
      const res = await prescriptionAPI.downloadPdf(presc.id);
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `recipe-CitaMed-${presc.verificationCode}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando récipe:', err);
      alert('Error al descargar el récipe.');
    }
  };

  const renderIssuedPrescriptions = () => {
    const active = issuedPrescriptions.filter((p) => p.status === 'active');
    if (active.length === 0) {
      return <p className="text-xs text-slate-400 italic">No se emitió récipe en esta consulta.</p>;
    }
    return (
      <div className="space-y-2">
        {active.map((presc) => (
          <div
            key={presc.id}
            className="p-3 rounded-lg border border-slate-200 bg-white flex flex-wrap justify-between items-center gap-2 text-xs"
          >
            <div className="min-w-0">
              <span className="font-bold text-slate-800 block">
                Récipe con {presc.items?.length || 0} medicamento{presc.items?.length === 1 ? '' : 's'}
              </span>
              {presc.items?.length > 0 && (
                <span className="text-slate-600 block truncate">
                  {presc.items.map((it) => it.medication).join(', ')}
                </span>
              )}
              <span className="text-[10px] text-slate-500 font-mono">Código: {presc.verificationCode}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleDownloadPrescriptionPdf(presc)}
                className="px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded text-xs hover:bg-primary/20 transition flex items-center gap-1"
              >
                <Download className="w-3 h-3" /> Descargar PDF
              </button>
              <button
                type="button"
                onClick={() => handleShareDocument({ ...presc, type: 'prescription' })}
                className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded text-xs hover:bg-emerald-100 transition flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" /> WhatsApp
              </button>
            </div>
          </div>
        ))}
      </div>
    );
  };

  // 3. Finalizar Consulta Médica
  const handleCompleteConsultation = async () => {
    if (isDraftMode) {
      setConfirmCompleteOpen(false);
      setDrawerIdentifyPatient(true);
      toast.error('Debes identificar al paciente para finalizar y registrar la consulta');
      return;
    }
    setCompleting(true);
    try {
      // 3.1 PUT /api/appointments/:id/complete
      const payload = {
        soapNote,
        vitalSigns,
        physicalExam,
        doctorNotes,
        diagnosis: soapNote.assessment.trim() || undefined
      };

      await appointmentService.complete(appointment.id, payload);

      // 3.2 Si hay medicamentos, emitir récipe con POST /api/prescriptions
      const validItems = recipeItems.filter((i) => i.medication && i.medication.trim());
      if (validItems.length > 0) {
        try {
          const prescRes = await prescriptionAPI.create({
            appointmentId: appointment.id,
            items: validItems,
            indications: recipeIndications.trim() || undefined
          });
          const createdPresc = prescRes.data?.data;
          if (createdPresc?.id) {
            prefetchDocumentPdf('prescription', createdPresc.id, prescriptionAPI.downloadPdf);
            setIssuedPrescriptions((prev) => [createdPresc, ...prev]);
          }
        } catch (prescErr) {
          console.error('[EspacioClinico] Error emitiendo récipe:', prescErr);
          alert('Consulta completada, pero hubo un detalle con el récipe: ' + (prescErr.response?.data?.error || prescErr.message));
        }
      }

      // 3.3 Borrar borrador local
      try {
        localStorage.removeItem(`citamed_draft_apt_${appointment.id}`);
      } catch {
        // Ignorar error al limpiar storage
      }

      // Actualizar estado de cita local
      setAppointment((prev) => ({ ...prev, status: 'completed' }));
      setConfirmCompleteOpen(false);
      setDrawerSummary(true);
    } catch (err) {
      console.error('[EspacioClinico] Error al finalizar consulta:', err);
      alert(err.response?.data?.message || 'Error al finalizar la consulta');
    } finally {
      setCompleting(false);
    }
  };

  // Filtrado de catálogo de exámenes por búsqueda
  const filteredCatalog = useMemo(() => {
    if (!labSearch.trim()) return labCatalog;
    const term = labSearch.toLowerCase();
    return labCatalog.filter(
      (item) => item.name.toLowerCase().includes(term) || item.category.toLowerCase().includes(term)
    );
  }, [labCatalog, labSearch]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-primary animate-spin" />
          <p className="text-sm font-medium text-slate-600">Cargando Espacio Clínico...</p>
        </div>
      </div>
    );
  }

  if (!isDraftMode && (accessDenied || !appointment)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg border border-slate-200 p-6 text-center">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-lg font-bold text-slate-900 mb-2">Acceso no autorizado</h2>
          <p className="text-sm text-slate-600 mb-6">
            No tienes permiso para consultar este espacio clínico o la cita no existe.
          </p>
          <button
            onClick={() => navigate('/medico/agenda')}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition"
          >
            <ArrowLeft className="w-4 h-4" /> Volver a mi agenda
          </button>
        </div>
      </div>
    );
  }

  const patient = isDraftMode
    ? (identifiedPatient || {})
    : (appointment?.patient || {});
  const patientProfile = isDraftMode
    ? (identifiedPatient?.patientProfile || patientRecord?.patientProfile || {})
    : (patient.patientProfile || patientRecord?.patientProfile || {});
  const patientFullName = isDraftMode
    ? (identifiedPatient
        ? `${identifiedPatient.firstName || ''} ${identifiedPatient.lastName || ''}`.trim()
        : 'Paciente sin identificar')
    : (`${patient.firstName || ''} ${patient.lastName || ''}`.trim() || 'Paciente sin nombre');
  const allergiesList = patientRecord?.allergies || patientProfile?.allergies || [];
  const currentDocs = isDraftMode ? [] : documents.filter((d) => d.appointmentId === appointment?.id);

  return (
    <div className="espacio-clinico-container">
      {/* 1. ENCABEZADO FIJO SUPERIOR */}
      <header className="ec-header">
        <div className="ec-header-top">
          <div className="flex items-center gap-3">
            <Link
              to="/medico/agenda"
              className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Volver a la Agenda"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="ec-patient-meta">
              <span className="ec-patient-name">{patientFullName}</span>
              {isDraftMode && !identifiedPatient && (
                <button
                  type="button"
                  onClick={() => setDrawerIdentifyPatient(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary/90 transition animate-pulse"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Identificar paciente
                </button>
              )}
              {isDraftMode && identifiedPatient && (
                <div className="inline-flex items-center gap-1">
                  <span className="ec-chip font-bold text-teal-800 bg-teal-100">
                    <Check className="w-3 h-3 text-teal-600 inline mr-0.5" /> Identificado
                  </span>
                  <button
                    type="button"
                    onClick={() => setDrawerIdentifyPatient(true)}
                    className="text-xs text-primary font-medium hover:underline ml-1"
                  >
                    Cambiar
                  </button>
                </div>
              )}
              {patientAge !== null && <span className="ec-chip">{patientAge} años</span>}
              {patientProfile.gender && (
                <span className="ec-chip">
                  {patientProfile.gender === 'female' ? 'Femenino' : 'Masculino'}
                </span>
              )}
              {patientProfile.identificationNumber && (
                <span className="ec-chip">CI: {patientProfile.identificationNumber}</span>
              )}
              <span className="ec-chip flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                {appointment?.appointmentDate || 'Hoy'} · {appointment?.appointmentTime || 'Ahora'}
              </span>
              <span className={`ec-chip ${isDraftMode ? 'ec-chip-draft bg-amber-100 text-amber-800 border-amber-300' : isReadOnly ? 'ec-chip-completed' : 'ec-chip-in-progress'}`}>
                {isDraftMode ? 'Consulta sin cita' : isReadOnly ? 'Consulta finalizada' : 'En consulta'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (isDraftMode && !identifiedPatient) {
                  setDrawerIdentifyPatient(true);
                  toast('Identifica al paciente para consultar su historia clínica', { icon: 'ℹ️' });
                } else {
                  setDrawerFullRecord(true);
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 border border-primary/20 rounded-lg hover:bg-primary/20 transition"
            >
              <History className="w-3.5 h-3.5" />
              Ver historia completa
            </button>
          </div>
        </div>

        {/* Alergias en chips rojos destacados */}
        {allergiesList.length > 0 && (
          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 flex-wrap">
            <span className="text-xs font-bold text-rose-700 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-600" /> Alergias conocidas:
            </span>
            {allergiesList.map((a, i) => (
              <span key={i} className="ec-chip ec-chip-allergy">
                {a.allergen || a} {a.severity ? `(${SEVERITY_LABELS[a.severity] || a.severity})` : ''}
              </span>
            ))}
          </div>
        )}

        {/* Anclas de navegación rápida */}
        <nav className="ec-nav-anchors">
          <a
            href="#subjetivo"
            onClick={() => setActiveAnchor('subjetivo')}
            className={`ec-anchor-btn ${activeAnchor === 'subjetivo' ? 'active' : ''}`}
          >
            1. Subjetivo
          </a>
          <a
            href="#objetivo"
            onClick={() => setActiveAnchor('objetivo')}
            className={`ec-anchor-btn ${activeAnchor === 'objetivo' ? 'active' : ''}`}
          >
            2. Objetivo (Signos y Examen)
          </a>
          <a
            href="#evaluacion"
            onClick={() => setActiveAnchor('evaluacion')}
            className={`ec-anchor-btn ${activeAnchor === 'evaluacion' ? 'active' : ''}`}
          >
            3. Evaluación
          </a>
          <a
            href="#plan"
            onClick={() => setActiveAnchor('plan')}
            className={`ec-anchor-btn ${activeAnchor === 'plan' ? 'active' : ''}`}
          >
            4. Plan
          </a>
          <a
            href="#recipe"
            onClick={() => setActiveAnchor('recipe')}
            className={`ec-anchor-btn ${activeAnchor === 'recipe' ? 'active' : ''}`}
          >
            5. Récipe
          </a>
          <a
            href="#documentos"
            onClick={() => setActiveAnchor('documentos')}
            className={`ec-anchor-btn ${activeAnchor === 'documentos' ? 'active' : ''}`}
          >
            6. Órdenes y Documentos ({currentDocs.length})
          </a>
          <a
            href="#notas-privadas"
            onClick={() => setActiveAnchor('notas-privadas')}
            className={`ec-anchor-btn ${activeAnchor === 'notas-privadas' ? 'active' : ''}`}
          >
            7. Notas Privadas
          </a>
        </nav>
      </header>

      {/* Banner de aviso de borrador no guardado para nueva consulta sin cita */}
      {isDraftMode && newDraftAlert && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span>
              Tienes un borrador previo de consulta sin cita en este equipo (guardado a las{' '}
              {new Date(newDraftAlert.savedAt).toLocaleTimeString('es-VE')}). ¿Deseas continuarlo?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (newDraftAlert.soapNote) setSoapNote(newDraftAlert.soapNote);
                if (newDraftAlert.vitalSigns) setVitalSigns(newDraftAlert.vitalSigns);
                if (newDraftAlert.physicalExam) {
                  setPhysicalExam(newDraftAlert.physicalExam);
                  const hasAnyEvaluated = Object.values(newDraftAlert.physicalExam).some(
                    (v) => v && v.status && v.status !== 'not_evaluated'
                  );
                  if (hasAnyEvaluated || Boolean(newDraftAlert.soapNote?.objective?.trim())) {
                    setIsPhysicalExamExpanded(true);
                  }
                }
                if (newDraftAlert.doctorNotes) setDoctorNotes(newDraftAlert.doctorNotes);
                if (newDraftAlert.recipeItems) setRecipeItems(newDraftAlert.recipeItems);
                if (newDraftAlert.recipeIndications) setRecipeIndications(newDraftAlert.recipeIndications);
                if (newDraftAlert.aiDraftText) setAiDraftText(newDraftAlert.aiDraftText);
                if (newDraftAlert.identifiedPatient) setIdentifiedPatient(newDraftAlert.identifiedPatient);
                setNewDraftAlert(null);
                toast.success('Borrador restaurado');
              }}
              className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition"
            >
              Continuar borrador
            </button>
            <button
              type="button"
              onClick={() => {
                try {
                  localStorage.removeItem('citamed_draft_new');
                } catch {
                  // Ignorar
                }
                setNewDraftAlert(null);
                toast('Borrador descartado', { icon: '🗑️' });
              }}
              className="px-3 py-1 border border-amber-300 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 transition"
            >
              Empezar de cero
            </button>
          </div>
        </div>
      )}

      {/* Banner de aviso de borrador local no guardado para cita existente */}
      {!isDraftMode && localDraftAlert && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-amber-800 text-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-amber-600" />
            <span>
              Existe un borrador local más reciente en este equipo (guardado a las{' '}
              {new Date(localDraftAlert.savedAt).toLocaleTimeString('es-VE')}). ¿Deseas restaurarlo?
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleRestoreLocalDraft}
              className="px-3 py-1 bg-amber-600 text-white rounded text-xs font-semibold hover:bg-amber-700 transition"
            >
              Restaurar
            </button>
            <button
              type="button"
              onClick={handleDiscardLocalDraft}
              className="px-3 py-1 border border-amber-300 text-amber-700 rounded text-xs font-medium hover:bg-amber-100 transition"
            >
              Descartar
            </button>
          </div>
        </div>
      )}

      {/* 2. LAYOUT PRINCIPAL: COLUMNA LATERAL Y ÁREA PRINCIPAL */}
      <div className="ec-main-layout">
        {/* COLUMNA LATERAL IZQUIERDA (Plegable) */}
        <aside className="ec-sidebar">
          {/* Tarjeta: Motivo de la Cita */}
          <div className="ec-card">
            <div className="ec-card-header">
              <span className="ec-card-title">
                <Calendar className="w-4 h-4 text-primary" /> Motivo de consulta
              </span>
            </div>
            <p className="text-xs text-slate-700 italic">
              "{appointment?.reasonForVisit || (isDraftMode ? 'Consulta sin cita previa' : 'Sin motivo registrado al agendar')}"
            </p>
          </div>

          {/* Tarjeta: Antecedentes del paciente */}
          <div className="ec-card">
            <div className="ec-card-header">
              <span className="ec-card-title">
                <FileText className="w-4 h-4 text-primary" /> Antecedentes
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (!guardDraftMode('registrar antecedentes')) setDrawerAddCondition(true);
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              )}
            </div>
            <div className="space-y-1.5">
              {loadingRecord ? (
                <p className="text-xs text-slate-400 animate-pulse">Cargando ficha del paciente...</p>
              ) : patientRecord?.conditions?.length > 0 ? (
                patientRecord.conditions.map((c, i) => (
                  <div key={i} className="text-xs text-slate-700 py-0.5 border-b border-slate-50">
                    <span className="font-semibold text-slate-800">{c.condition || c.name}</span>
                    {c.type && <span className="text-slate-400 ml-1">({c.type})</span>}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  {isDraftMode && !identifiedPatient
                    ? 'Identifica al paciente para ver antecedentes'
                    : 'Sin antecedentes patológicos registrados'}
                </p>
              )}
            </div>
          </div>

          {/* Tarjeta: Alergias */}
          <div className="ec-card">
            <div className="ec-card-header">
              <span className="ec-card-title">
                <ShieldAlert className="w-4 h-4 text-rose-600" /> Alergias
              </span>
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (!guardDraftMode('registrar alergias')) setDrawerAddAllergy(true);
                  }}
                  className="text-xs font-semibold text-primary hover:underline flex items-center gap-0.5"
                >
                  <Plus className="w-3 h-3" /> Agregar
                </button>
              )}
            </div>
            <div className="space-y-1">
              {allergiesList.length > 0 ? (
                allergiesList.map((a, i) => (
                  <div key={i} className="text-xs text-rose-700 font-medium">
                    • {a.allergen || a} {a.reaction ? `— ${a.reaction}` : ''}
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">
                  {isDraftMode && !identifiedPatient
                    ? 'Identifica al paciente para ver alergias'
                    : 'Sin alergias conocidas'}
                </p>
              )}
            </div>
          </div>

          {/* Tarjeta: Últimas 5 Consultas con este médico */}
          <div className="ec-card">
            <div className="ec-card-header">
              <span className="ec-card-title">
                <History className="w-4 h-4 text-primary" /> Consultas anteriores
              </span>
            </div>
            <div className="space-y-2">
              {isDraftMode && !identifiedPatient ? (
                <p className="text-xs text-slate-400">Identifica al paciente para ver consultas anteriores</p>
              ) : pastConsultations.length > 0 ? (
                pastConsultations.slice(0, 5).map((past) => (
                  <div
                    key={past.id}
                    onClick={() => setDrawerPastConsultation(past)}
                    className="p-2 rounded border border-slate-100 bg-slate-50 hover:bg-slate-100 cursor-pointer transition text-xs"
                  >
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{past.appointmentDate}</span>
                      <span className="text-primary font-normal">Ver detalle →</span>
                    </div>
                    <p className="text-slate-600 truncate mt-0.5">
                      {past.diagnosis || past.reasonForVisit || 'Consulta médica'}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400">Primera consulta con este médico</p>
              )}
            </div>
          </div>

          {/* Tarjeta: Últimos signos vitales registrados */}
          {patientRecord?.vitalsSeries && patientRecord.vitalsSeries.length > 0 && (
            <div className="ec-card">
              <div className="ec-card-header">
                <span className="ec-card-title">
                  <Activity className="w-4 h-4 text-primary" /> Últimos signos
                </span>
              </div>
              <div className="text-xs space-y-1 text-slate-600">
                {latestSeriesVitals && (
                  <>
                    <p>
                      <strong>TA:</strong>{' '}
                      {latestSeriesVitals.systolic || '-'}/
                      {latestSeriesVitals.diastolic || '-'} mmHg
                    </p>
                    <p>
                      <strong>FC:</strong> {latestSeriesVitals.heartRate || '-'} lpm
                    </p>
                    <p>
                      <strong>Peso:</strong> {latestSeriesVitals.weightKg || '-'} kg
                    </p>
                    <p>
                      <strong>Temp:</strong> {latestSeriesVitals.temperature || '-'} °C
                    </p>
                    <span className="text-[10px] text-slate-400">
                      Registrados el {latestSeriesVitals.date}
                    </span>
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        {/* ÁREA PRINCIPAL: SECCIONES ANCLADAS */}
        <main className="space-y-6">
          {/* TARJETA ASISTENTE IA (D3) */}
          {!isReadOnly && aiStatus?.enabled && aiStatus?.available && (
            <div className="ec-card border-sky-300 bg-gradient-to-b from-sky-50/50 via-white to-white shadow-sm overflow-hidden" id="asistente-ia">
              {/* AVISO FIJO DENTRO DE LA TARJETA (NO SE PUEDE CERRAR) */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-900 mb-4">
                <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  <strong>Función experimental de asistencia:</strong> La IA puede equivocarse u omitir datos.
                  Revisa todo antes de aplicarlo: el diagnóstico, los medicamentos y las dosis son responsabilidad exclusiva del médico tratante.
                </p>
              </div>

              {/* ENCABEZADO DE LA TARJETA */}
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-4 h-4 text-sky-600" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      Asistente IA en el Espacio Clínico
                    </h2>
                    <span className="text-[11px] text-slate-500">
                      Dicta o escribe la consulta completa en bruto; la IA organizará y estructurará los campos.
                    </span>
                  </div>
                </div>

              </div>

              {/* ÁREA DE TEXTO: BORRADOR DE LA CONSULTA */}
              <div className="space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <label htmlFor="ai-draft-textarea" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Borrador de la consulta
                  </label>

                  {/* BOTONES SOBRE EL ÁREA: DICTAR Y CORREGIR */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Un solo botón Dictar: con IA si hay transcripción disponible; si no, el dictado del navegador */}
                    {!aiDictationReady ? (
                      draftBrowserSpeech.isSupported && (
                        <button
                          type="button"
                          onClick={draftBrowserSpeech.toggleListening}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border transition ${
                            draftBrowserSpeech.isListening
                              ? 'bg-rose-50 border-rose-300 text-rose-700 animate-pulse'
                              : 'border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100'
                          }`}
                          title="Dictar por voz"
                        >
                          {draftBrowserSpeech.isListening ? (
                            <>
                              <Square className="w-3 h-3 fill-current text-rose-600" />
                              <span>Detener</span>
                            </>
                          ) : (
                            <>
                              <Mic className="w-3.5 h-3.5 text-purple-600" />
                              <span>Dictar</span>
                            </>
                          )}
                        </button>
                      )
                    ) : audioRecorder.isRecording && audioTarget === 'draft' ? (
                      <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-md text-xs font-semibold text-rose-700 animate-pulse">
                        <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                        <span>{formatTimer(audioRecorder.seconds)}</span>
                        <button
                          type="button"
                          onClick={handleStopDraftAudio}
                          className="ml-1 px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700"
                        >
                          Detener
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            audioRecorder.cancel();
                            setAudioTarget(null);
                          }}
                          className="px-1.5 py-0.5 text-slate-500 hover:text-slate-700 text-[11px]"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={
                          isTranscribing
                        }
                        onClick={handleStartDraftAudio}
                        title={
                          isDraftMode && !appointment
                            ? 'Identifica al paciente para usar la IA'
                            : 'Dictar consulta completa por micrófono'
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {isTranscribing && audioTarget === 'draft' ? (
                          <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                            <span>Transcribiendo...</span>
                          </>
                        ) : (
                          <>
                            <Mic className="w-3.5 h-3.5 text-purple-600" />
                            <span>Dictar</span>
                          </>
                        )}
                      </button>
                    )}

                    {/* Botón Corregir Redacción (improve) */}
                    <button
                      type="button"
                      disabled={
                        !aiDraftText?.trim() ||
                        aiDraftImproving ||
                        (isDraftMode && !appointment)
                      }
                      onClick={handleImproveDraft}
                      title={
                        isDraftMode && !appointment
                          ? 'Identifica al paciente para usar la IA'
                          : 'Corregir redacción ortográfica y gramatical del borrador'
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {aiDraftImproving ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
                          <span>Corrigiendo...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
                          <span>Corregir</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <textarea
                  ref={aiDraftTextareaRef}
                  id="ai-draft-textarea"
                  value={aiDraftText}
                  onChange={(e) => setAiDraftText(e.target.value)}
                  placeholder="Dicta o escribe libremente: síntomas, signos vitales, examen físico, diagnóstico y tratamiento..."
                  maxLength={15000}
                  style={{ minHeight: '120px', maxHeight: '60vh', overflowY: 'auto' }}
                  className="w-full p-3 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white transition leading-relaxed"
                />
              </div>

              {/* BOTÓN PRINCIPAL ANCHO: ESTRUCTURAR CONSULTA CON IA */}
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleStructureWithAi}
                  disabled={
                    !aiDraftText?.trim() ||
                    aiStructuringLoading ||
                    (isDraftMode && !appointment)
                  }
                  title="Estructurar consulta médica completa (2 acciones de IA: SOAP y Récipe)"
                  className="w-full sm:w-auto flex-1 py-3 px-5 bg-gradient-to-r from-sky-600 to-indigo-600 hover:from-sky-700 hover:to-indigo-700 text-white font-bold rounded-lg shadow-sm hover:shadow transition flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {aiStructuringLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Estructurando con IA (SOAP y Récipe)...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Estructurar consulta con IA</span>
                    </>
                  )}
                </button>

                {isDraftMode && !appointment && (
                  <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md border border-amber-200">
                    Identifica al paciente para usar la IA
                  </span>
                )}
              </div>
            </div>
          )}

          {/* SECCIÓN 1: SUBJETIVO */}
          <section id="subjetivo" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  1
                </span>
                Subjetivo: Motivo de Consulta y Enfermedad Actual
              </h2>
            </div>
            <ClinicalTextField
              id="soap-subjective"
              label="Relato del paciente, síntomas referidos y evolución cronológica:"
              value={soapNote.subjective}
              onChange={(e) => setSoapNote((prev) => ({ ...prev, subjective: e.target.value }))}
              placeholder="Paciente refiere que desde hace 3 días presenta fiebre, malestar general y congestión nasal..."
              rows={4}
              readOnly={isReadOnly}
              onAiTranscribe={aiDictationReady ? transcribeForField : null}
              onImprove={(t) =>
                handleImproveField('Subjetivo', t, (val) => setSoapNote((p) => ({ ...p, subjective: val })))
              }
              improving={improvingFieldId === 'Subjetivo'}
            />
          </section>

          {/* SECCIÓN 2: OBJETIVO (Signos Vitales y Examen Físico) */}
          <section id="objetivo" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  2
                </span>
                Objetivo: Signos Vitales y Examen Físico
              </h2>
            </div>

            {/* Grilla de Signos Vitales */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-emerald-600" /> Signos Vitales del Paciente
                </h3>
                {bmiInfo.bmi && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${bmiInfo.color}`}
                  >
                    IMC: {bmiInfo.bmi} kg/m² ({bmiInfo.category})
                  </span>
                )}
              </div>

              <div className="ec-vitals-grid">
                {/* TA Sistólica */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('systolic', vitalSigns.systolic, patientAge)
                      ? 'abnormal'
                      : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>TA Sistólica</span>
                    <span className="text-slate-400">mmHg</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.systolic}
                    onChange={(e) =>
                      setVitalSigns((prev) => ({ ...prev, systolic: e.target.value }))
                    }
                    placeholder="120"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.systolic && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.systolic}</span>
                  )}
                </div>

                {/* TA Diastólica */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('diastolic', vitalSigns.diastolic, patientAge)
                      ? 'abnormal'
                      : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>TA Diastólica</span>
                    <span className="text-slate-400">mmHg</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.diastolic}
                    onChange={(e) =>
                      setVitalSigns((prev) => ({ ...prev, diastolic: e.target.value }))
                    }
                    placeholder="80"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.diastolic && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.diastolic}</span>
                  )}
                </div>

                {/* Frecuencia Cardíaca */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('heartRate', vitalSigns.heartRate, patientAge) ? 'abnormal' : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>FC</span>
                    <span className="text-slate-400">lpm</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.heartRate}
                    onChange={(e) => setVitalSigns((prev) => ({ ...prev, heartRate: e.target.value }))}
                    placeholder="75"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.heartRate && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.heartRate}</span>
                  )}
                </div>

                {/* Frecuencia Respiratoria */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('respiratoryRate', vitalSigns.respiratoryRate, patientAge) ? 'abnormal' : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>FR</span>
                    <span className="text-slate-400">rpm</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.respiratoryRate}
                    onChange={(e) =>
                      setVitalSigns((prev) => ({ ...prev, respiratoryRate: e.target.value }))
                    }
                    placeholder="16"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.respiratoryRate && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.respiratoryRate}</span>
                  )}
                </div>

                {/* Temperatura */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('temperature', vitalSigns.temperature, patientAge) ? 'abnormal' : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>Temperatura</span>
                    <span className="text-slate-400">°C</span>
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalSigns.temperature}
                    onChange={(e) => setVitalSigns((prev) => ({ ...prev, temperature: e.target.value }))}
                    placeholder="36.5"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.temperature && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.temperature}</span>
                  )}
                </div>

                {/* Saturación O2 */}
                <div
                  className={`ec-vital-input-box ${
                    isVitalAbnormal('oxygenSaturation', vitalSigns.oxygenSaturation, patientAge) ? 'abnormal' : ''
                  }`}
                >
                  <span className="ec-vital-label">
                    <span>Saturación O₂</span>
                    <span className="text-slate-400">%</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.oxygenSaturation}
                    onChange={(e) =>
                      setVitalSigns((prev) => ({ ...prev, oxygenSaturation: e.target.value }))
                    }
                    placeholder="98"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                  {vitalErrors.oxygenSaturation && (
                    <span className="text-[10px] text-red-600 mt-1">{vitalErrors.oxygenSaturation}</span>
                  )}
                </div>

                {/* Peso */}
                <div className="ec-vital-input-box">
                  <span className="ec-vital-label">
                    <span>Peso</span>
                    <span className="text-slate-400">kg</span>
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={vitalSigns.weightKg}
                    onChange={(e) => setVitalSigns((prev) => ({ ...prev, weightKg: e.target.value }))}
                    placeholder="70"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Talla */}
                <div className="ec-vital-input-box">
                  <span className="ec-vital-label">
                    <span>Talla</span>
                    <span className="text-slate-400">cm</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.heightCm}
                    onChange={(e) => setVitalSigns((prev) => ({ ...prev, heightCm: e.target.value }))}
                    placeholder="170"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                </div>

                {/* Glucemia */}
                <div className="ec-vital-input-box">
                  <span className="ec-vital-label">
                    <span>Glucemia</span>
                    <span className="text-slate-400">mg/dL</span>
                  </span>
                  <input
                    type="number"
                    value={vitalSigns.glucose}
                    onChange={(e) => setVitalSigns((prev) => ({ ...prev, glucose: e.target.value }))}
                    placeholder="95"
                    className="ec-vital-input"
                    readOnly={isReadOnly}
                  />
                </div>
              </div>
            </div>

            {/* Subsección plegable: Examen Físico por Sistemas y Observaciones (D9) */}
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
              <div className="p-3 bg-white flex items-center justify-between gap-3 border-b border-slate-200">
                <button
                  type="button"
                  aria-expanded={isPhysicalExamExpanded}
                  onClick={() => setIsPhysicalExamExpanded((prev) => !prev)}
                  className="flex items-center gap-2.5 text-left flex-1 hover:opacity-80 transition group"
                >
                  <span className="p-1 rounded bg-sky-50 text-sky-700 group-hover:bg-sky-100 transition">
                    {isPhysicalExamExpanded ? (
                      <ChevronUp className="w-4 h-4 text-primary" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-primary" />
                    )}
                  </span>
                  <div>
                    <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                      <Stethoscope className="w-4 h-4 text-primary" /> Examen Físico por Sistemas
                    </h3>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Estado: <span className="font-semibold text-slate-700">{physicalExamSummary}</span>
                    </span>
                  </div>
                </button>

                {!isReadOnly && (
                  <button
                    type="button"
                    onClick={handleMarkAllNormal}
                    className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 transition flex-shrink-0"
                  >
                    ✓ Todo normal
                  </button>
                )}
              </div>

              {isPhysicalExamExpanded && (
                <div className="p-3 space-y-4">
                  <div className="ec-systems-grid">
                    {PHYSICAL_EXAM_SYSTEMS.map((sys) => {
                      const currentSys = physicalExam[sys.key] || { status: 'not_evaluated', findings: '' };
                      const isAbnormal = currentSys.status === 'abnormal';

                      return (
                        <div key={sys.key} className={`ec-system-card ${isAbnormal ? 'abnormal' : ''}`}>
                          <div className="ec-system-header">
                            <span className="ec-system-name">{sys.label}</span>
                            <div className="ec-system-buttons">
                              <button
                                type="button"
                                onClick={() => handleSystemStatusChange(sys.key, 'normal')}
                                className={`ec-sys-btn ${currentSys.status === 'normal' ? 'active-normal' : ''}`}
                                disabled={isReadOnly}
                              >
                                Normal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSystemStatusChange(sys.key, 'abnormal')}
                                className={`ec-sys-btn ${currentSys.status === 'abnormal' ? 'active-abnormal' : ''}`}
                                disabled={isReadOnly}
                              >
                                Anormal
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSystemStatusChange(sys.key, 'not_evaluated')}
                                className={`ec-sys-btn ${currentSys.status === 'not_evaluated' ? 'active-ne' : ''}`}
                                disabled={isReadOnly}
                              >
                                N/E
                              </button>
                            </div>
                          </div>

                          {isAbnormal && (
                            <input
                              type="text"
                              value={currentSys.findings || ''}
                              onChange={(e) => handleSystemFindingsChange(sys.key, e.target.value)}
                              placeholder="Describe el hallazgo anormal..."
                              className="w-full text-xs p-2 rounded border border-red-200 bg-white focus:outline-none focus:border-red-400 mt-2"
                              readOnly={isReadOnly}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Texto libre adicional para Objetivo */}
                  <ClinicalTextField
                    id="soap-objective"
                    label="Observaciones adicionales del examen físico:"
                    value={soapNote.objective}
                    onChange={(e) => setSoapNote((prev) => ({ ...prev, objective: e.target.value }))}
                    placeholder="Otros hallazgos, estado mental, hidratación general..."
                    rows={3}
                    readOnly={isReadOnly}
                    onAiTranscribe={aiDictationReady ? transcribeForField : null}
                    onImprove={(t) =>
                      handleImproveField('Objetivo', t, (val) => setSoapNote((p) => ({ ...p, objective: val })))
                    }
                    improving={improvingFieldId === 'Objetivo'}
                  />
                </div>
              )}
            </div>
          </section>

          {/* SECCIÓN 3: EVALUACIÓN / DIAGNÓSTICO */}
          <section id="evaluacion" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  3
                </span>
                Evaluación: Diagnóstico Clínico
              </h2>
            </div>
            <ClinicalTextField
              id="soap-assessment"
              label="Diagnóstico presuntivo o definitivo (requerido para completar):"
              value={soapNote.assessment}
              onChange={(e) => setSoapNote((prev) => ({ ...prev, assessment: e.target.value }))}
              placeholder="Ej. Rinofaringitis aguda (J00), Hipertensión arterial esencial..."
              rows={3}
              readOnly={isReadOnly}
              required
              onAiTranscribe={aiDictationReady ? transcribeForField : null}
              onImprove={(t) =>
                handleImproveField('Evaluación', t, (val) => setSoapNote((p) => ({ ...p, assessment: val })))
              }
              improving={improvingFieldId === 'Evaluación'}
            />
          </section>

          {/* SECCIÓN 4: PLAN */}
          <section id="plan" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  4
                </span>
                Plan: Tratamiento, Indicaciones y Próximo Control
              </h2>
            </div>
            <ClinicalTextField
              id="soap-plan"
              label="Conducta terapéutica, medidas higiénico-dietéticas y citas de control:"
              value={soapNote.plan}
              onChange={(e) => setSoapNote((prev) => ({ ...prev, plan: e.target.value }))}
              placeholder="Reposo relativo por 48 horas, hidratación oral abundante, acudir a control en 7 días si persisten los síntomas..."
              rows={3}
              readOnly={isReadOnly}
              onAiTranscribe={aiDictationReady ? transcribeForField : null}
              onImprove={(t) =>
                handleImproveField('Plan', t, (val) => setSoapNote((p) => ({ ...p, plan: val })))
              }
              improving={improvingFieldId === 'Plan'}
            />
          </section>

          {/* SECCIÓN 5: RÉCIPE MÉDICO */}
          <section id="recipe" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <Pill className="w-5 h-5 text-primary" /> Récipe Médico Electrónico
              </h2>
              {!isReadOnly && (
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Dictar Récipe (D6) */}
                  {audioRecorder.isRecording && audioTarget === 'recipe' ? (
                    <div className="inline-flex items-center gap-1.5 bg-rose-50 border border-rose-300 px-2.5 py-1 rounded-lg text-xs font-semibold text-rose-700 animate-pulse">
                      <span className="w-2 h-2 rounded-full bg-rose-600"></span>
                      <span>{formatTimer(audioRecorder.seconds)}</span>
                      <button
                        type="button"
                        onClick={handleStopRecipeAudio}
                        className="ml-1 px-2 py-0.5 bg-rose-600 text-white rounded text-[11px] font-bold hover:bg-rose-700"
                      >
                        Detener
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          audioRecorder.cancel();
                          setAudioTarget(null);
                        }}
                        className="px-1.5 py-0.5 text-slate-500 hover:text-slate-700 text-[11px]"
                      >
                        Cancelar
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={
                        isTranscribing ||
                        !aiStatus?.transcriptionAvailable ||
                        (isDraftMode && !appointment)
                      }
                      onClick={handleStartRecipeAudio}
                      title={
                        isDraftMode && !appointment
                          ? 'Identifica al paciente para usar la IA'
                          : 'Dictar récipe con micrófono e IA'
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isTranscribing && audioTarget === 'recipe' ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-purple-600" />
                          <span>Transcribiendo...</span>
                        </>
                      ) : (
                        <>
                          <Mic className="w-3.5 h-3.5 text-purple-600" />
                          <span>Dictar récipe</span>
                        </>
                      )}
                    </button>
                  )}

                  {/* Desde Texto (D6) */}
                  <button
                    type="button"
                    disabled={
                      (isDraftMode && !appointment)
                    }
                    onClick={() => setDrawerAiRxText(true)}
                    title={
                      isDraftMode && !appointment
                        ? 'Identifica al paciente para usar la IA'
                        : 'Estructurar récipe a partir de texto libre'
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <FileText className="w-3.5 h-3.5 text-sky-600" />
                    <span>Desde texto</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleAddRecipeItem}
                    className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 rounded-lg transition"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Medicamento
                  </button>
                </div>
              )}
            </div>

            {isReadOnly ? (
              renderIssuedPrescriptions()
            ) : (
            <div className="space-y-4">
              {recipeItems.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-700">Medicamento #{idx + 1}</span>
                    {recipeItems.length > 1 && !isReadOnly && (
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipeItem(idx)}
                        className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    <div className="sm:col-span-2 md:col-span-3">
                      <label className="text-xs font-medium text-slate-600 block mb-1">
                        Nombre comercial o genérico *
                      </label>
                      <input
                        type="text"
                        value={item.medication}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'medication', e.target.value)}
                        placeholder="Ej. Amoxicilina + Ácido Clavulánico"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Presentación</label>
                      <input
                        type="text"
                        value={item.presentation}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'presentation', e.target.value)}
                        placeholder="Ej. Comprimidos 875/125 mg"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Dosis</label>
                      <input
                        type="text"
                        value={item.dose}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'dose', e.target.value)}
                        placeholder="Ej. 1 comprimido"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Frecuencia</label>
                      <input
                        type="text"
                        value={item.frequency}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'frequency', e.target.value)}
                        placeholder="Ej. Cada 12 horas"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-slate-600 block mb-1">Duración</label>
                      <input
                        type="text"
                        value={item.duration}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'duration', e.target.value)}
                        placeholder="Ej. Por 7 días"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="text-xs font-medium text-slate-600 block mb-1">
                        Instrucciones específicas
                      </label>
                      <input
                        type="text"
                        value={item.instructions}
                        onChange={(e) => handleUpdateRecipeItem(idx, 'instructions', e.target.value)}
                        placeholder="Ej. Tomar al inicio de una comida principal"
                        className="w-full text-sm px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                        readOnly={isReadOnly}
                      />
                    </div>
                  </div>

                  {/* Alerta de alergia registrada para este medicamento */}
                  {(() => {
                    const allergyConflict = checkMedicationAllergy(item.medication, allergiesList);
                    if (!allergyConflict) return null;
                    return (
                      <div className="flex items-center gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs font-semibold rounded-lg animate-pulse">
                        <ShieldAlert className="w-4 h-4 text-red-600 flex-shrink-0" />
                        <span>
                          Atención: el paciente tiene alergia registrada a{' '}
                          <strong>{allergyConflict.allergen}</strong>.
                        </span>
                      </div>
                    );
                  })()}
                </div>
              ))}

              {/* Sugerencias Acompañantes fijas */}
              {companionSuggestions.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <span className="text-xs font-bold text-amber-800 uppercase tracking-wider block">
                    Sugerencias Acompañantes
                  </span>
                  {companionSuggestions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3 bg-amber-50/90 border border-amber-300 rounded-lg flex items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                        <span>{s.message}</span>
                      </div>
                      {!isReadOnly && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAddCompanionMedication(s)}
                            className="px-2.5 py-1 bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 transition"
                          >
                            Agregar
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDismissCompanion(s.id)}
                            className="px-2 py-1 text-slate-500 hover:text-slate-800 transition"
                          >
                            Descartar
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Indicaciones generales del récipe:
                </label>
                <textarea
                  value={recipeIndications}
                  onChange={(e) => setRecipeIndications(e.target.value)}
                  placeholder="Dieta blanda, abundantes líquidos, evitar exposición solar..."
                  rows={2}
                  className="w-full text-sm p-3 border border-slate-300 rounded-lg focus:outline-none focus:border-primary bg-white"
                  readOnly={isReadOnly}
                />
              </div>
            </div>
            )}
          </section>

          {/* SECCIÓN 6: ÓRDENES Y DOCUMENTOS MÉDICOS */}
          <section id="documentos" className="ec-card">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-xs font-bold">
                  6
                </span>
                <FileCheck className="w-5 h-5 text-primary" /> Órdenes y Documentos Médicos
              </h2>
            </div>

            {/* Banner en modo borrador */}
            {isDraftMode && (
              <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                <span className="flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                  Identifica al paciente para emitir órdenes, reposos, constancias e informes oficiales.
                </span>
                <button
                  type="button"
                  onClick={() => setDrawerIdentifyPatient(true)}
                  className="px-2.5 py-1 bg-primary text-white font-bold rounded text-xs hover:bg-primary/90 flex-shrink-0 shadow-sm"
                >
                  Identificar paciente
                </button>
              </div>
            )}

            {/* Botones de Emisión Rápida */}
            <div className="flex items-center gap-2.5 flex-wrap mb-4 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => {
                  if (!guardDraftMode('emitir orden de exámenes')) handleOpenLabDrawer();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200 rounded-lg text-xs font-semibold transition"
              >
                <FileSpreadsheet className="w-4 h-4" /> Orden de exámenes
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!guardDraftMode('emitir reposo médico')) setDrawerRestNote(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-semibold transition"
              >
                <Clock className="w-4 h-4" /> Reposo médico
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!guardDraftMode('emitir constancia médica')) setDrawerCertificate(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200 rounded-lg text-xs font-semibold transition"
              >
                <FileCheck className="w-4 h-4" /> Constancia médica
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!guardDraftMode('emitir informe médico')) handleOpenReportDrawer();
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold transition"
              >
                <FileText className="w-4 h-4" /> Informe médico
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!guardDraftMode('adjuntar archivos')) setDrawerAttachment(true);
                }}
                disabled={!storageAvailable}
                className={`inline-flex items-center gap-1.5 px-3 py-2 border rounded-lg text-xs font-semibold transition ${
                  storageAvailable
                    ? 'bg-amber-50 text-amber-800 hover:bg-amber-100 border-amber-200'
                    : 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                }`}
                title={!storageAvailable ? 'Servicio de almacenamiento no disponible' : 'Adjuntar archivo privado'}
              >
                <Paperclip className="w-4 h-4" /> Adjuntar archivo
              </button>
            </div>

            {/* Listado de Documentos de esta consulta */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Documentos emitidos en esta cita ({currentDocs.length})
              </h3>
              {currentDocs.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center border border-dashed border-slate-200 rounded-lg">
                  No se han emitido órdenes ni documentos para esta consulta todavía.
                </p>
              ) : (
                currentDocs.map((doc) => {
                  const isVoided = doc.status === 'voided';
                  return (
                    <div
                      key={doc.id}
                      className={`p-3 rounded-lg border flex items-center justify-between gap-4 transition ${
                        isVoided ? 'bg-slate-50 border-slate-200 opacity-60' : 'bg-white border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                          {doc.type === 'lab_order'
                            ? 'LAB'
                            : doc.type === 'rest_note'
                            ? 'REP'
                            : doc.type === 'certificate'
                            ? 'CST'
                            : doc.type === 'medical_report'
                            ? 'INF'
                            : 'ADJ'}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-slate-800">{doc.title}</span>
                            {doc.verificationCode && (
                              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                {doc.verificationCode}
                              </span>
                            )}
                            {isVoided && (
                              <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">
                                Anulado
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">
                            Emitido el {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('es-VE') : 'hoy'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {doc.type !== 'attachment' && !isVoided && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleDownloadDocPdf(doc)}
                              className="p-1.5 text-slate-600 hover:text-primary hover:bg-slate-100 rounded-lg transition"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleShareDocument(doc)}
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
                              title="Enviar por WhatsApp"
                            >
                              <Share2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                        {!isVoided && !isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleVoidDoc(doc.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Anular documento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </section>

          {/* SECCIÓN 7: NOTAS PRIVADAS (doctorNotes) */}
          <section id="notas-privadas" className="ec-card border-amber-200 bg-amber-50/20">
            <div className="ec-card-header">
              <h2 className="ec-card-title text-base text-amber-900">
                <Lock className="w-5 h-5 text-amber-600" /> Notas Privadas (doctorNotes)
              </h2>
              <span className="text-xs font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-full">
                Solo tú puedes ver estas notas
              </span>
            </div>
            <ClinicalTextField
              id="soap-doctor-notes"
              label="Anotaciones confidenciales exclusivas del médico (el paciente nunca tiene acceso):"
              value={doctorNotes}
              onChange={(e) => setDoctorNotes(e.target.value)}
              placeholder="Impresiones subjetivas del comportamiento, sospechas clínicas preliminares, recordatorios personales..."
              rows={3}
              readOnly={isReadOnly}
              hint="Estas notas no se incluyen en ningún informe, récipe ni resumen que se entregue al paciente."
              onAiTranscribe={aiDictationReady ? transcribeForField : null}
              onImprove={(t) =>
                handleImproveField('Notas privadas', t, (val) => setDoctorNotes(val))
              }
              improving={improvingFieldId === 'Notas privadas'}
            />
          </section>
        </main>
      </div>

      {/* 3. BARRA INFERIOR FIJA */}
      <footer className="ec-bottom-bar">
        <div className="ec-save-indicator">
          {saveStatus === 'saved' && (
            <span className="text-emerald-700 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {isDraftMode ? 'Borrador guardado en este equipo' : 'Guardado'}
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-blue-700 flex items-center gap-1.5">
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" /> Guardando...
            </span>
          )}
          {saveStatus === 'offline' && (
            <span className="text-amber-700 flex items-center gap-1.5">
              <WifiOff className="w-4 h-4 text-amber-600" /> Sin conexión: guardado en este equipo
            </span>
          )}
          {saveStatus === 'error' && (
            <span className="text-rose-700 flex items-center gap-1.5" title={saveErrorMessage}>
              <AlertCircle className="w-4 h-4 text-rose-600" /> Error al guardar cambios
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {isReadOnly ? (
            <button
              type="button"
              onClick={() => setDrawerSummary(true)}
              className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-semibold hover:bg-slate-700 transition"
            >
              Ver resumen de documentos
            </button>
          ) : isDraftMode ? (
            <button
              type="button"
              onClick={() => {
                setDrawerIdentifyPatient(true);
                toast('Identifica al paciente para finalizar y guardar la consulta', { icon: 'ℹ️' });
              }}
              className="px-5 py-2.5 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition flex items-center gap-2"
            >
              <UserPlus className="w-4 h-4" /> Identificar paciente para finalizar
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmCompleteOpen(true)}
              className="px-5 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow hover:bg-emerald-700 transition flex items-center gap-2"
            >
              <Check className="w-4 h-4" /> Finalizar Consulta
            </button>
          )}
        </div>
      </footer>

      {/* DIÁLOGO CORTO DE CONFIRMACIÓN PARA FINALIZAR CONSULTA */}
      {confirmCompleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-5 text-center">
            <h3 className="text-base font-bold text-slate-900 mb-2">¿Finalizar consulta médica?</h3>
            <p className="text-xs text-slate-600 mb-3">
              Se registrarán la nota SOAP, signos vitales y examen físico. La consulta pasará a estado completado.
            </p>
            {aiAppliedToRecipe && (
              <div className="p-2.5 mb-4 bg-amber-50 border border-amber-200 rounded-lg text-left text-xs text-amber-900 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <span>
                  Este récipe incluye medicamentos sugeridos por IA. Confirma que revisaste cada medicamento, dosis y duración.
                </span>
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={() => setConfirmCompleteOpen(false)}
                disabled={completing}
                className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleCompleteConsultation}
                disabled={completing}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition flex items-center gap-1.5"
              >
                {completing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Finalizando...
                  </>
                ) : (
                  'Sí, finalizar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. SIDEDRAWERS DEL ESPACIO CLÍNICO */}

      {/* SideDrawer: Historia Clínica Completa del Paciente */}
      <SideDrawer
        open={drawerFullRecord}
        onClose={() => setDrawerFullRecord(false)}
        title={`Ficha Clínica: ${patientFullName}`}
      >
        <div className="space-y-4">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
            <p><strong>Cédula:</strong> {patientProfile.identificationNumber || 'N/A'}</p>
            <p><strong>Teléfono:</strong> {patient.phone || 'N/A'}</p>
            <p><strong>Tipo de sangre:</strong> {patientProfile.bloodType || 'No especificado'}</p>
            <p><strong>Contacto de emergencia:</strong> {patientProfile.emergencyContactName || 'N/A'} ({patientProfile.emergencyContactPhone || 'N/A'})</p>
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Alergias</h4>
            {allergiesList.length > 0 ? (
              <div className="space-y-1">
                {allergiesList.map((a, i) => (
                  <span key={i} className="ec-chip ec-chip-allergy mr-1 mb-1">
                    {a.allergen || a} {a.reaction ? `— ${a.reaction}` : ''}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin alergias registradas</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Antecedentes Médicos</h4>
            {patientRecord?.conditions?.length > 0 ? (
              <ul className="text-xs space-y-1 list-disc list-inside text-slate-700">
                {patientRecord.conditions.map((c, i) => (
                  <li key={i}>
                    <strong>{c.condition || c.name}:</strong> {c.notes || c.type || ''}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-slate-400">Sin condiciones médicas registradas</p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase mb-1">Historial de Consultas</h4>
            {patientRecord?.consultations?.length > 0 ? (
              <div className="space-y-2">
                {patientRecord.consultations.map((c) => (
                  <div key={c.id} className="p-2.5 rounded border border-slate-200 bg-white text-xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-800">
                      <span>{c.appointmentDate} · {c.appointmentTime}</span>
                      <span className="text-emerald-700">{c.status}</span>
                    </div>
                    <p><strong>Diagnóstico:</strong> {c.diagnosis || 'N/A'}</p>
                    {c.soapNote?.assessment && <p><strong>SOAP:</strong> {c.soapNote.assessment}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Sin consultas registradas previamente</p>
            )}
          </div>
        </div>
      </SideDrawer>

      {/* SideDrawer: Detalle de Consulta Anterior */}
      <SideDrawer
        open={Boolean(drawerPastConsultation)}
        onClose={() => setDrawerPastConsultation(null)}
        title={drawerPastConsultation ? `Consulta del ${drawerPastConsultation.appointmentDate}` : 'Consulta'}
      >
        {drawerPastConsultation && (
          <div className="space-y-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Motivo de consulta:</span>
              <p className="font-semibold text-slate-800">{drawerPastConsultation.reasonForVisit || 'N/A'}</p>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Diagnóstico registrado:</span>
              <p className="font-semibold text-emerald-800 bg-emerald-50 p-2 rounded border border-emerald-200">
                {drawerPastConsultation.diagnosis || 'Sin diagnóstico registrado'}
              </p>
            </div>
            {drawerPastConsultation.soapNote && (
              <div className="space-y-2 border-t pt-2 border-slate-100">
                <span className="font-bold text-slate-700 block">Detalles SOAP:</span>
                {drawerPastConsultation.soapNote.subjective && (
                  <p><strong>Subjetivo:</strong> {drawerPastConsultation.soapNote.subjective}</p>
                )}
                {drawerPastConsultation.soapNote.objective && (
                  <p><strong>Objetivo:</strong> {drawerPastConsultation.soapNote.objective}</p>
                )}
                {drawerPastConsultation.soapNote.plan && (
                  <p><strong>Plan:</strong> {drawerPastConsultation.soapNote.plan}</p>
                )}
              </div>
            )}
            {drawerPastConsultation.vitalSigns && (
              <div className="border-t pt-2 border-slate-100">
                <span className="font-bold text-slate-700 block mb-1">Signos Vitales:</span>
                <p>
                  TA: {drawerPastConsultation.vitalSigns.systolic || '-'}/
                  {drawerPastConsultation.vitalSigns.diastolic || '-'} mmHg | FC:{' '}
                  {drawerPastConsultation.vitalSigns.heartRate || '-'} lpm | Temp:{' '}
                  {drawerPastConsultation.vitalSigns.temperature || '-'} °C | Peso:{' '}
                  {drawerPastConsultation.vitalSigns.weightKg || '-'} kg
                </p>
              </div>
            )}
            {drawerPastConsultation.doctorNotes && (
              <div className="bg-amber-50 p-2.5 rounded border border-amber-200">
                <span className="font-bold text-amber-900 block mb-1">Tus notas privadas en esta cita:</span>
                <p className="text-amber-800">{drawerPastConsultation.doctorNotes}</p>
              </div>
            )}
          </div>
        )}
      </SideDrawer>

      {/* SideDrawer: Agregar Alergia */}
      <SideDrawer
        open={drawerAddAllergy}
        onClose={() => setDrawerAddAllergy(false)}
        title="Registrar Alergia del Paciente"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerAddAllergy(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddAllergySubmit}
              className="px-4 py-1.5 text-xs bg-primary text-white font-semibold rounded hover:bg-primary/90"
            >
              Guardar Alergia
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddAllergySubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Alérgeno *</label>
            <input
              type="text"
              value={newAllergen}
              onChange={(e) => setNewAllergen(e.target.value)}
              placeholder="Ej. Penicilina, AINES, Mariscos..."
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Severidad</label>
            <select
              value={newAllergySeverity}
              onChange={(e) => setNewAllergySeverity(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary bg-white"
            >
              <option value="mild">Leve</option>
              <option value="moderate">Moderada</option>
              <option value="severe">Severa / Anafiláctica</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Reacción típica</label>
            <input
              type="text"
              value={newAllergyReaction}
              onChange={(e) => setNewAllergyReaction(e.target.value)}
              placeholder="Ej. Urticaria, broncoespasmo, edema..."
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Agregar Antecedente / Condición */}
      <SideDrawer
        open={drawerAddCondition}
        onClose={() => setDrawerAddCondition(false)}
        title="Registrar Condición o Antecedente"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerAddCondition(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleAddConditionSubmit}
              className="px-4 py-1.5 text-xs bg-primary text-white font-semibold rounded hover:bg-primary/90"
            >
              Guardar Antecedente
            </button>
          </div>
        }
      >
        <form onSubmit={handleAddConditionSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Condición / Diagnóstico *</label>
            <input
              type="text"
              value={newConditionName}
              onChange={(e) => setNewConditionName(e.target.value)}
              placeholder="Ej. Diabetes Mellitus Tipo 2, Asma bronquial..."
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Tipo de antecedente</label>
            <select
              value={newConditionType}
              onChange={(e) => setNewConditionType(e.target.value)}
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary bg-white"
            >
              <option value="pathological">Patológico</option>
              <option value="surgical">Quirúrgico</option>
              <option value="allergic">Alérgico</option>
              <option value="family">Familiar</option>
              <option value="other">Otro</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">Notas u observaciones</label>
            <textarea
              value={newConditionNotes}
              onChange={(e) => setNewConditionNotes(e.target.value)}
              placeholder="Año de diagnóstico, tratamiento actual, evolución..."
              rows={3}
              className="w-full text-xs p-2.5 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Orden de Exámenes */}
      <SideDrawer
        open={drawerLabOrder}
        onClose={() => setDrawerLabOrder(false)}
        title="Emitir Orden de Exámenes"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerLabOrder(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              disabled={submittingDoc}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateLabOrder}
              disabled={submittingDoc}
              className="px-4 py-1.5 text-xs bg-primary text-white font-semibold rounded hover:bg-primary/90 flex items-center gap-1"
            >
              {submittingDoc ? 'Emitiendo...' : 'Emitir Orden (PDF)'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateLabOrder} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Buscar examen en catálogo:</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={labSearch}
                onChange={(e) => setLabSearch(e.target.value)}
                placeholder="Ej. Hematología, Perfil 20, Urocultivo..."
                className="w-full pl-8 pr-3 py-2 border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          <div className="border border-slate-200 rounded-lg p-2 max-h-56 overflow-y-auto space-y-1">
            {filteredCatalog.length === 0 ? (
              <p className="text-slate-400 p-2 text-center">No se encontraron exámenes con ese término</p>
            ) : (
              filteredCatalog.map((exam, idx) => {
                const isSelected = selectedExams.some((e) => e.name === exam.name);
                return (
                  <label
                    key={idx}
                    className={`flex items-center gap-2 p-1.5 rounded hover:bg-slate-50 cursor-pointer ${
                      isSelected ? 'bg-blue-50/60 font-semibold text-blue-900' : ''
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {
                        if (isSelected) {
                          setSelectedExams((prev) => prev.filter((e) => e.name !== exam.name));
                        } else {
                          setSelectedExams((prev) => [...prev, exam]);
                        }
                      }}
                      className="rounded text-primary focus:ring-primary"
                    />
                    <span className="flex-1">{exam.name}</span>
                    <span className="text-[10px] text-slate-400">{exam.category}</span>
                  </label>
                );
              })
            )}
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">
              Otros exámenes (no presentes en catálogo):
            </label>
            <textarea
              value={labOtherExams}
              onChange={(e) => setLabOtherExams(e.target.value)}
              placeholder="Indica otros estudios especiales..."
              rows={2}
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Indicación clínica / Sospecha:</label>
            <input
              type="text"
              value={labIndication}
              onChange={(e) => setLabIndication(e.target.value)}
              placeholder="Ej. Evaluación de síndrome anémico, control metabólico..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="font-semibold text-slate-700 block mb-1">Diagnóstico presuntivo:</label>
            <input
              type="text"
              value={labDiagnosis}
              onChange={(e) => setLabDiagnosis(e.target.value)}
              placeholder={soapNote.assessment || 'Diagnóstico de la consulta actual'}
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Reposo Médico */}
      <SideDrawer
        open={drawerRestNote}
        onClose={() => setDrawerRestNote(false)}
        title="Emitir Reposo Médico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerRestNote(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              disabled={submittingDoc}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateRestNote}
              disabled={submittingDoc}
              className="px-4 py-1.5 text-xs bg-emerald-600 text-white font-semibold rounded hover:bg-emerald-700 flex items-center gap-1"
            >
              {submittingDoc ? 'Emitiendo...' : 'Emitir Reposo (PDF)'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateRestNote} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Días de reposo (1 a 90) *</label>
            <input
              type="number"
              min="1"
              max="90"
              value={restDays}
              onChange={(e) => setRestDays(e.target.value)}
              className="w-full p-2.5 border rounded-lg focus:outline-none focus:border-primary font-bold text-sm"
              required
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Fecha de inicio</label>
            <input
              type="date"
              value={restStartDate}
              onChange={(e) => setRestStartDate(e.target.value)}
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
            <input
              type="checkbox"
              checked={restIncludeDiag}
              onChange={(e) => setRestIncludeDiag(e.target.checked)}
              className="rounded text-primary"
            />
            Incluir diagnóstico médico en el documento
          </label>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Observaciones o recomendaciones:</label>
            <textarea
              value={restObservations}
              onChange={(e) => setRestObservations(e.target.value)}
              placeholder="Reposo absoluto en cama, aislamiento respiratorio..."
              rows={3}
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Constancia Médica */}
      <SideDrawer
        open={drawerCertificate}
        onClose={() => setDrawerCertificate(false)}
        title="Emitir Constancia de Atención"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerCertificate(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              disabled={submittingDoc}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateCertificate}
              disabled={submittingDoc}
              className="px-4 py-1.5 text-xs bg-sky-600 text-white font-semibold rounded hover:bg-sky-700 flex items-center gap-1"
            >
              {submittingDoc ? 'Emitiendo...' : 'Emitir Constancia (PDF)'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateCertificate} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Motivo de la constancia:</label>
            <input
              type="text"
              value={certReason}
              onChange={(e) => setCertReason(e.target.value)}
              placeholder="Ej. Asistencia a consulta médica programada"
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hora de llegada:</label>
              <input
                type="time"
                value={certFrom}
                onChange={(e) => setCertFrom(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-700 block mb-1">Hora de salida:</label>
              <input
                type="time"
                value={certTo}
                onChange={(e) => setCertTo(e.target.value)}
                className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
              />
            </div>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Observaciones adicionales:</label>
            <textarea
              value={certObservations}
              onChange={(e) => setCertObservations(e.target.value)}
              placeholder="Constancia expedida a petición de la parte interesada para fines laborales/académicos..."
              rows={3}
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Informe Médico */}
      <SideDrawer
        open={drawerReport}
        onClose={() => setDrawerReport(false)}
        title="Emitir Informe Médico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerReport(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              disabled={submittingDoc}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleCreateReport}
              disabled={submittingDoc}
              className="px-4 py-1.5 text-xs bg-purple-600 text-white font-semibold rounded hover:bg-purple-700 flex items-center gap-1"
            >
              {submittingDoc ? 'Emitiendo...' : 'Emitir Informe (PDF)'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleCreateReport} className="space-y-4 text-xs">
          <p className="text-slate-500">
            El texto ha sido pre-llenado con el contenido SOAP de la consulta actual. Puedes editar cualquier detalle antes de emitirlo.
          </p>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Cuerpo del informe médico *</label>
            <textarea
              value={reportBody}
              onChange={(e) => setReportBody(e.target.value)}
              rows={12}
              className="w-full p-3 font-mono text-xs border rounded-lg focus:outline-none focus:border-primary"
              required
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Adjuntar Archivo */}
      <SideDrawer
        open={drawerAttachment}
        onClose={() => setDrawerAttachment(false)}
        title="Adjuntar Archivo Clínico"
        footer={
          <div className="flex gap-2 w-full justify-end">
            <button
              type="button"
              onClick={() => setDrawerAttachment(false)}
              className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded"
              disabled={submittingDoc}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleUploadAttachment}
              disabled={submittingDoc || !attachmentFile}
              className="px-4 py-1.5 text-xs bg-amber-600 text-white font-semibold rounded hover:bg-amber-700 flex items-center gap-1"
            >
              {submittingDoc ? 'Subiendo...' : 'Subir Archivo'}
            </button>
          </div>
        }
      >
        <form onSubmit={handleUploadAttachment} className="space-y-4 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Título o descripción del archivo:</label>
            <input
              type="text"
              value={attachmentTitle}
              onChange={(e) => setAttachmentTitle(e.target.value)}
              placeholder="Ej. Resultados de tomografía de tórax..."
              className="w-full p-2 border rounded-lg focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Seleccionar archivo (PDF, JPG, PNG máx. 10 MB) *</label>
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => setAttachmentFile(e.target.files[0] || null)}
              className="w-full text-xs p-2 border rounded-lg"
              required
            />
          </div>
        </form>
      </SideDrawer>

      {/* SideDrawer: Resumen tras finalizar consulta */}
      <SideDrawer
        open={drawerSummary}
        onClose={() => setDrawerSummary(false)}
        title="Consulta Finalizada Exitosamente"
        footer={
          <div className="flex items-center justify-between w-full">
            <button
              type="button"
              onClick={() => navigate('/medico/sala-espera')}
              className="px-3 py-2 bg-slate-100 text-slate-700 font-semibold rounded-lg text-xs hover:bg-slate-200 transition"
            >
              Volver a la sala de espera
            </button>
            <button
              type="button"
              onClick={() => navigate('/medico/agenda')}
              className="px-4 py-2 bg-primary text-white font-semibold rounded-lg text-xs hover:bg-primary/90 transition"
            >
              Volver a la agenda
            </button>
          </div>
        }
      >
        <div className="space-y-4 text-xs">
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-center space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
            <h4 className="font-bold text-sm text-emerald-900">¡Registro Clínico Guardado!</h4>
            <p className="text-emerald-700">
              La consulta de {patientFullName} ha sido completada y certificada en CitaMed.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-slate-800 uppercase mb-2">Récipe</h4>
            {renderIssuedPrescriptions()}
          </div>

          <div>
            <h4 className="font-bold text-slate-800 uppercase mb-2">
              Documentos Emitidos en esta Consulta ({currentDocs.length})
            </h4>
            {currentDocs.length === 0 ? (
              <p className="text-slate-400 italic">No se emitieron documentos adicionales durante esta cita.</p>
            ) : (
              <div className="space-y-2">
                {currentDocs.map((doc) => (
                  <div key={doc.id} className="p-2.5 rounded border border-slate-200 bg-white flex justify-between items-center">
                    <div>
                      <span className="font-bold text-slate-800 block">{doc.title}</span>
                      <span className="text-[10px] text-slate-500 font-mono">Código: {doc.verificationCode}</span>
                    </div>
                    {doc.type !== 'attachment' && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleDownloadDocPdf(doc)}
                          className="px-2.5 py-1 bg-primary/10 text-primary font-semibold rounded text-xs hover:bg-primary/20 transition flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> Descargar PDF
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShareDocument(doc)}
                          className="px-2.5 py-1 bg-emerald-50 text-emerald-700 font-semibold rounded text-xs hover:bg-emerald-100 transition flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" /> WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </SideDrawer>

      {/* SideDrawer: Identificar Paciente (Consulta sin cita / Walk-in) */}
      <IdentifyPatientDrawer
        open={drawerIdentifyPatient}
        onClose={() => {
          setDrawerIdentifyPatient(false);
          setIdentifyError('');
        }}
        onSelectExistingPatient={handleIdentifyExistingPatient}
        onCreateNewPatient={handleCreateNewPatient}
        loading={identifyingLoading}
        errorMessage={identifyError}
      />

      {/* SideDrawer: Revisión SOAP e IA (D4) */}
      <AiSoapReviewDrawer
        open={drawerAiSoapReview}
        onClose={() => setDrawerAiSoapReview(false)}
        soapProposal={aiSoapProposal}
        rxProposal={aiRxProposal}
        soapError={aiSoapError}
        rxError={aiRxError}
        currentSoap={soapNote}
        currentVitals={vitalSigns}
        currentPhysicalExam={physicalExam}
        onApply={handleApplyAiSoapProposal}
        onCreateLabOrders={(orders) => {
          if (orders && orders.length > 0) {
            setLabOtherExams((prev) =>
              prev ? `${prev}, ${orders.join(', ')}` : orders.join(', ')
            );
            setDrawerLabOrder(true);
          }
        }}
      />

      {/* SideDrawer: Mejorar Redacción (D5) */}
      <AiImproveReviewDrawer
        open={drawerAiImprove}
        onClose={() => setDrawerAiImprove(false)}
        fieldName={improveData.fieldName}
        originalText={improveData.originalText}
        improvedText={improveData.improvedText}
        onApply={improveData.onApply}
      />

      {/* SideDrawer: Récipe desde Texto (D6) */}
      <AiRxTextDrawer
        open={drawerAiRxText}
        onClose={() => setDrawerAiRxText(false)}
        onSubmitText={handleRxFromText}
        loading={aiRxLoadingSingle}
        error={aiRxErrorSingle}
      />

      {/* SideDrawer: Revisión de Récipe Médico con IA (D6) */}
      <AiRxReviewDrawer
        open={drawerAiRxReview}
        onClose={() => setDrawerAiRxReview(false)}
        rxProposal={aiRxProposalSingle}
        loading={aiRxLoadingSingle}
        error={aiRxErrorSingle}
        onApply={handleApplyAiRxProposal}
      />
    </div>
  );
}

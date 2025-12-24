/**
 * PatientProfilePage - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Página de visualización del perfil del paciente - VERSIÓN ESPECTACULAR
 */

import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  AlertTriangle,
  Pill,
  Phone,
  Shield,
  Edit,
  Activity,
  Droplet,
  Scale,
  Ruler,
  Cigarette,
  Wine,
  Dumbbell,
  Calendar,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  ArrowLeft,
  Home,
  Users,
  FileDown,
  Share2,
  Download,
  Printer,
  Copy,
  Check,
  ChevronRight,
  Stethoscope,
  Baby,
  HeartPulse,
  Brain,
  Bone,
  Eye,
  Ear,
  Sparkles,
  TrendingUp,
  MapPin,
  Mail,
  BadgeCheck,
  QrCode
} from 'lucide-react';
import usePatientProfile from '../../hooks/usePatientProfile';
import patientService from '../../services/patientService';
import Navbar from '../../components/common/Navbar/Navbar';

// Componente de Barra de Progreso
const ProgressBar = ({ percentage }) => (
  <div className="w-full bg-gray-200 rounded-full h-2.5">
    <div
      className={`h-2.5 rounded-full transition-all duration-500 ${
        percentage >= 80 ? 'bg-green-500' :
        percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
      }`}
      style={{ width: `${percentage}%` }}
    ></div>
  </div>
);

// Componente de Badge de Severidad
const SeverityBadge = ({ severity }) => {
  const config = {
    mild: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Leve' },
    moderate: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Moderada' },
    severe: { bg: 'bg-red-100', text: 'text-red-800', label: 'Severa' },
    life_threatening: { bg: 'bg-purple-100', text: 'text-purple-800', label: 'Riesgo vital' }
  };
  const { bg, text, label } = config[severity] || { bg: 'bg-gray-100', text: 'text-gray-800', label: severity };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  );
};

// Componente de Estado de Condición
const ConditionStatusBadge = ({ status }) => {
  const config = {
    active: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Activa', icon: Activity },
    resolved: { bg: 'bg-green-100', text: 'text-green-800', label: 'Resuelta', icon: CheckCircle },
    chronic: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'Crónica', icon: Clock }
  };
  const { bg, text, label, icon: Icon } = config[status] || { bg: 'bg-gray-100', text: 'text-gray-800', label: status, icon: AlertCircle };

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      <Icon className="w-3 h-3" />
      {label}
    </span>
  );
};

// Componente de Tarjeta de Alergia
const AllergyCard = ({ allergy }) => (
  <div className={`p-4 rounded-lg border-l-4 ${
    allergy.severity === 'life_threatening' ? 'border-purple-500 bg-purple-50' :
    allergy.severity === 'severe' ? 'border-red-500 bg-red-50' :
    allergy.severity === 'moderate' ? 'border-orange-500 bg-orange-50' :
    'border-yellow-500 bg-yellow-50'
  }`}>
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-gray-900">{allergy.allergen}</h4>
      <SeverityBadge severity={allergy.severity} />
    </div>
    <p className="text-sm text-gray-600 mb-1">
      {patientService.formatAllergyType(allergy.allergyType)}
    </p>
    {allergy.reaction && (
      <p className="text-sm text-gray-500 mt-2">
        Reacción: {allergy.reaction}
      </p>
    )}
  </div>
);

// Componente de Tarjeta de Condición Médica
const MedicalHistoryCard = ({ condition }) => (
  <div className="p-4 bg-white rounded-lg border border-gray-200">
    <div className="flex justify-between items-start mb-2">
      <h4 className="font-semibold text-gray-900">{condition.condition}</h4>
      <ConditionStatusBadge status={condition.status} />
    </div>
    {condition.diagnosedDate && (
      <p className="text-sm text-gray-500">
        Diagnosticado: {patientService.formatDate(condition.diagnosedDate)}
      </p>
    )}
    {condition.severity && (
      <div className="mt-2">
        <SeverityBadge severity={condition.severity} />
      </div>
    )}
    {condition.notes && (
      <p className="text-sm text-gray-600 mt-2">{condition.notes}</p>
    )}
  </div>
);

// Componente de Tarjeta de Medicamento
const MedicationCard = ({ medication }) => (
  <div className={`p-4 rounded-lg border ${
    medication.isActive ? 'bg-white border-gray-200' : 'bg-gray-50 border-gray-300'
  }`}>
    <div className="flex justify-between items-start mb-2">
      <div>
        <h4 className={`font-semibold ${medication.isActive ? 'text-gray-900' : 'text-gray-500'}`}>
          {medication.medicationName}
        </h4>
        <p className="text-sm text-gray-600">{medication.dosage}</p>
      </div>
      {medication.isActive ? (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          Activo
        </span>
      ) : (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
          Suspendido
        </span>
      )}
    </div>
    <p className="text-sm text-gray-500">{medication.frequency}</p>
    {medication.route && (
      <p className="text-sm text-gray-500">Vía: {medication.route}</p>
    )}
    <p className="text-xs text-gray-400 mt-2">
      Desde: {patientService.formatDate(medication.startDate)}
      {medication.endDate && ` - Hasta: ${patientService.formatDate(medication.endDate)}`}
    </p>
  </div>
);

// Componente de Timeline Visual para Historial Médico
const MedicalTimeline = ({ conditions }) => {
  if (!conditions || conditions.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
        <p>No hay eventos médicos registrados</p>
      </div>
    );
  }

  // Ordenar por fecha de diagnóstico
  const sortedConditions = [...conditions].sort((a, b) => {
    const dateA = a.diagnosedDate ? new Date(a.diagnosedDate) : new Date(0);
    const dateB = b.diagnosedDate ? new Date(b.diagnosedDate) : new Date(0);
    return dateB - dateA;
  });

  const getStatusColor = (status) => {
    switch(status) {
      case 'active': return 'bg-blue-500';
      case 'resolved': return 'bg-green-500';
      case 'chronic': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'active': return Activity;
      case 'resolved': return CheckCircle;
      case 'chronic': return Clock;
      default: return AlertCircle;
    }
  };

  return (
    <div className="relative">
      {/* Línea vertical del timeline */}
      <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-teal-500 via-blue-500 to-purple-500"></div>

      <div className="space-y-6">
        {sortedConditions.map((condition, index) => {
          const StatusIcon = getStatusIcon(condition.status);
          return (
            <motion.div
              key={condition.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="relative pl-16"
            >
              {/* Punto en el timeline */}
              <div className={`absolute left-4 w-5 h-5 rounded-full ${getStatusColor(condition.status)} border-4 border-white shadow-md`}>
              </div>

              {/* Tarjeta del evento */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <StatusIcon className={`w-4 h-4 ${
                      condition.status === 'active' ? 'text-blue-500' :
                      condition.status === 'resolved' ? 'text-green-500' :
                      condition.status === 'chronic' ? 'text-orange-500' : 'text-gray-500'
                    }`} />
                    <h4 className="font-semibold text-gray-900">{condition.condition}</h4>
                  </div>
                  <ConditionStatusBadge status={condition.status} />
                </div>

                {condition.diagnosedDate && (
                  <p className="text-sm text-gray-500 mb-2 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {patientService.formatDate(condition.diagnosedDate)}
                  </p>
                )}

                {condition.severity && (
                  <div className="mb-2">
                    <SeverityBadge severity={condition.severity} />
                  </div>
                )}

                {condition.notes && (
                  <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded-lg">{condition.notes}</p>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// Componente de Antecedentes Familiares
const FamilyHistorySection = ({ familyHistory = [] }) => {
  const familyConditions = [
    { id: 'diabetes', label: 'Diabetes', icon: Activity, color: 'blue' },
    { id: 'heart_disease', label: 'Enfermedades Cardíacas', icon: HeartPulse, color: 'red' },
    { id: 'cancer', label: 'Cáncer', icon: AlertTriangle, color: 'purple' },
    { id: 'hypertension', label: 'Hipertensión', icon: TrendingUp, color: 'orange' },
    { id: 'stroke', label: 'Accidente Cerebrovascular', icon: Brain, color: 'pink' },
    { id: 'arthritis', label: 'Artritis', icon: Bone, color: 'yellow' },
    { id: 'eye_disease', label: 'Enfermedades Oculares', icon: Eye, color: 'cyan' },
    { id: 'hearing_loss', label: 'Pérdida Auditiva', icon: Ear, color: 'green' }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: { bg: 'bg-blue-50', border: 'border-blue-200', icon: 'text-blue-500', badge: 'bg-blue-100 text-blue-800' },
      red: { bg: 'bg-red-50', border: 'border-red-200', icon: 'text-red-500', badge: 'bg-red-100 text-red-800' },
      purple: { bg: 'bg-purple-50', border: 'border-purple-200', icon: 'text-purple-500', badge: 'bg-purple-100 text-purple-800' },
      orange: { bg: 'bg-orange-50', border: 'border-orange-200', icon: 'text-orange-500', badge: 'bg-orange-100 text-orange-800' },
      pink: { bg: 'bg-pink-50', border: 'border-pink-200', icon: 'text-pink-500', badge: 'bg-pink-100 text-pink-800' },
      yellow: { bg: 'bg-yellow-50', border: 'border-yellow-200', icon: 'text-yellow-500', badge: 'bg-yellow-100 text-yellow-800' },
      cyan: { bg: 'bg-cyan-50', border: 'border-cyan-200', icon: 'text-cyan-500', badge: 'bg-cyan-100 text-cyan-800' },
      green: { bg: 'bg-green-50', border: 'border-green-200', icon: 'text-green-500', badge: 'bg-green-100 text-green-800' }
    };
    return colors[color] || colors.blue;
  };

  // Agrupar por condición
  const groupedHistory = familyHistory.reduce((acc, item) => {
    if (!acc[item.condition]) {
      acc[item.condition] = [];
    }
    acc[item.condition].push(item);
    return acc;
  }, {});

  if (familyHistory.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="w-16 h-16 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin Antecedentes Familiares</h3>
        <p className="text-gray-500 mb-4">No has registrado antecedentes médicos familiares</p>
        <Link
          to="/perfil-paciente/editar?tab=family"
          className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700"
        >
          <Edit className="w-4 h-4" />
          Agregar antecedentes
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {familyConditions.map(condition => {
        const conditionData = groupedHistory[condition.id] || [];
        const colors = getColorClasses(condition.color);
        const Icon = condition.icon;

        if (conditionData.length === 0) return null;

        return (
          <motion.div
            key={condition.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`p-4 rounded-xl border ${colors.bg} ${colors.border}`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg bg-white shadow-sm`}>
                <Icon className={`w-5 h-5 ${colors.icon}`} />
              </div>
              <h4 className="font-semibold text-gray-900">{condition.label}</h4>
            </div>

            <div className="space-y-2">
              {conditionData.map((item, idx) => (
                <div key={idx} className="flex items-center justify-between bg-white rounded-lg px-3 py-2">
                  <span className="text-sm text-gray-700">{item.relationship}</span>
                  {item.ageAtDiagnosis && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${colors.badge}`}>
                      {item.ageAtDiagnosis} años
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

// Componente de Acciones Rápidas del Perfil
const ProfileActions = ({ onExportPDF, onShare, onPrint }) => {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <button
          onClick={onExportPDF}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Download className="w-4 h-4" />
          <span className="hidden sm:inline">Exportar PDF</span>
        </button>

        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Compartir</span>
        </button>
      </div>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 top-full mt-2 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-20 min-w-[200px]"
          >
            <button
              onClick={() => { onPrint(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Printer className="w-4 h-4" />
              Imprimir perfil
            </button>
            <button
              onClick={() => { handleCopyLink(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
              {copied ? 'Enlace copiado' : 'Copiar enlace'}
            </button>
            <button
              onClick={() => { onShare(); setShowMenu(false); }}
              className="w-full flex items-center gap-3 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <QrCode className="w-4 h-4" />
              Mostrar QR
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente de Resumen de Salud (Dashboard Card)
const HealthSummaryCard = ({ title, value, subtitle, icon: Icon, color, trend }) => {
  const colorClasses = {
    teal: 'from-teal-500 to-teal-600',
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600',
    purple: 'from-purple-500 to-purple-600'
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colorClasses[color]} rounded-2xl p-4 text-white shadow-lg`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="w-5 h-5" />
        </div>
        {trend && (
          <span className={`text-xs px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-green-400/30' : trend < 0 ? 'bg-red-400/30' : 'bg-white/20'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <div className="text-2xl font-bold mb-1">{value}</div>
      <div className="text-sm text-white/80">{title}</div>
      {subtitle && <div className="text-xs text-white/60 mt-1">{subtitle}</div>}
    </motion.div>
  );
};

const PatientProfilePage = () => {
  const {
    profile,
    loading,
    error,
    completeness,
    medicalHistory,
    allergies,
    medications,
    fetchMyProfile,
    getCriticalAllergies,
    getChronicConditions,
    getActiveMedications
  } = usePatientProfile({ autoFetch: true });

  const [activeTab, setActiveTab] = useState('overview');
  const [showQRModal, setShowQRModal] = useState(false);
  const printRef = useRef(null);

  // Función para exportar PDF
  const handleExportPDF = async () => {
    // Implementación básica - abrir vista de impresión
    window.print();
  };

  // Función para compartir
  const handleShare = () => {
    setShowQRModal(true);
  };

  // Función para imprimir
  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Error al cargar perfil</h2>
          <p className="text-gray-500 mt-2">{error || 'No se pudo cargar tu perfil'}</p>
          <button
            onClick={fetchMyProfile}
            className="mt-4 text-teal-600 hover:underline"
          >
            Intentar de nuevo
          </button>
        </div>
      </div>
    );
  }

  const bmiData = patientService.calculateBMI(profile.height, profile.weight);
  const criticalAllergies = getCriticalAllergies();
  const chronicConditions = getChronicConditions();
  const activeMeds = getActiveMedications();

  // Datos de ejemplo para antecedentes familiares (vendrían del profile)
  const familyHistory = profile.familyHistory || [];

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: Sparkles },
    { id: 'info', label: 'Datos Personales', icon: User },
    { id: 'history', label: 'Historial Médico', icon: Heart },
    { id: 'family', label: 'Antecedentes Familiares', icon: Users },
    { id: 'allergies', label: 'Alergias', icon: AlertTriangle },
    { id: 'medications', label: 'Medicamentos', icon: Pill }
  ];

  return (
    <div className="min-h-screen bg-gray-50" ref={printRef}>
      {/* Header Espectacular */}
      <div className="relative overflow-hidden">
        {/* Fondo con gradiente y patrón */}
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-700 to-emerald-800">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 left-0 w-full h-full" style={{
              backgroundImage: `radial-gradient(circle at 25% 25%, white 2px, transparent 2px),
                               radial-gradient(circle at 75% 75%, white 2px, transparent 2px)`,
              backgroundSize: '60px 60px'
            }}></div>
          </div>
          {/* Decoraciones flotantes */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-teal-400/10 rounded-full blur-2xl"></div>
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8">
          {/* Navegación superior */}
          <div className="flex items-center justify-between mb-8">
            <Link
              to="/dashboard"
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Volver al panel</span>
            </Link>

            <ProfileActions
              onExportPDF={handleExportPDF}
              onShare={handleShare}
              onPrint={handlePrint}
            />
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
            {/* Foto/Avatar Mejorado */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="relative"
            >
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-white/10 backdrop-blur-sm flex items-center justify-center overflow-hidden border-4 border-white/30 shadow-2xl">
                {profile.photoUrl ? (
                  <img
                    src={profile.photoUrl}
                    alt="Foto de perfil"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-16 h-16 md:w-20 md:h-20 text-white/60" />
                )}
              </div>
              {/* Badge de verificado */}
              {profile.isVerified && (
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1.5 shadow-lg">
                  <BadgeCheck className="w-6 h-6 text-teal-500" />
                </div>
              )}
              {/* Indicador de completitud circular */}
              <div className="absolute -top-2 -left-2 bg-white rounded-full p-2 shadow-lg">
                <div className="relative w-10 h-10">
                  <svg className="w-10 h-10 transform -rotate-90">
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke="#e5e7eb"
                      strokeWidth="4"
                      fill="none"
                    />
                    <circle
                      cx="20"
                      cy="20"
                      r="16"
                      stroke={completeness?.percentage >= 80 ? '#10b981' : completeness?.percentage >= 50 ? '#f59e0b' : '#ef4444'}
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(completeness?.percentage || 0) * 1.005} 100`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-700">
                    {completeness?.percentage || 0}%
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Info principal */}
            <div className="flex-1 text-white">
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <h1 className="text-3xl md:text-4xl font-bold mb-2">
                  Mi Perfil de Salud
                </h1>
                <p className="text-teal-100 text-lg mb-4">
                  Tu historial médico completo en un solo lugar
                </p>

                {/* Info rápida del paciente */}
                {profile.User && (
                  <div className="flex flex-wrap items-center gap-4 text-sm text-teal-100 mb-4">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {profile.User.firstName} {profile.User.lastName}
                    </span>
                    {profile.User.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="w-4 h-4" />
                        {profile.User.email}
                      </span>
                    )}
                    {profile.bloodType && (
                      <span className="flex items-center gap-1 bg-red-500/20 px-2 py-0.5 rounded-full">
                        <Droplet className="w-4 h-4" />
                        {patientService.formatBloodType(profile.bloodType)}
                      </span>
                    )}
                  </div>
                )}

                {/* Alertas rápidas mejoradas */}
                <div className="flex flex-wrap gap-3">
                  {criticalAllergies.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-2 bg-red-500/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-red-400/30"
                    >
                      <AlertTriangle className="w-5 h-5 text-red-300" />
                      <span className="font-medium">{criticalAllergies.length} alergia(s) crítica(s)</span>
                    </motion.div>
                  )}
                  {chronicConditions.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-2 bg-orange-500/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-orange-400/30"
                    >
                      <Activity className="w-5 h-5 text-orange-300" />
                      <span className="font-medium">{chronicConditions.length} condición(es) crónica(s)</span>
                    </motion.div>
                  )}
                  {activeMeds.length > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.2 }}
                      className="flex items-center gap-2 bg-blue-500/30 backdrop-blur-sm px-4 py-2 rounded-xl border border-blue-400/30"
                    >
                      <Pill className="w-5 h-5 text-blue-300" />
                      <span className="font-medium">{activeMeds.length} medicamento(s) activo(s)</span>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Botón editar */}
            <motion.div
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Link
                to="/perfil-paciente/editar"
                className="flex items-center gap-3 bg-white text-teal-600 px-8 py-4 rounded-xl font-semibold hover:bg-teal-50 transition-all hover:shadow-xl shadow-lg group"
              >
                <Edit className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                Editar Perfil
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Tabs Mejorados */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto scrollbar-hide">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 font-medium border-b-2 transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600 bg-teal-50/50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-teal-500' : ''}`} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Tab: Resumen (Overview) */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Tarjetas de resumen de salud */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <HealthSummaryCard
                  title="Alergias"
                  value={allergies.length}
                  subtitle={criticalAllergies.length > 0 ? `${criticalAllergies.length} crítica(s)` : 'Ninguna crítica'}
                  icon={AlertTriangle}
                  color={criticalAllergies.length > 0 ? 'red' : 'green'}
                />
                <HealthSummaryCard
                  title="Condiciones"
                  value={medicalHistory.length}
                  subtitle={chronicConditions.length > 0 ? `${chronicConditions.length} crónica(s)` : 'Sin crónicas'}
                  icon={Heart}
                  color={chronicConditions.length > 0 ? 'orange' : 'teal'}
                />
                <HealthSummaryCard
                  title="Medicamentos"
                  value={activeMeds.length}
                  subtitle="Activos actualmente"
                  icon={Pill}
                  color="blue"
                />
                <HealthSummaryCard
                  title="Perfil"
                  value={`${completeness?.percentage || 0}%`}
                  subtitle={completeness?.percentage >= 80 ? 'Completo' : 'Por completar'}
                  icon={User}
                  color={completeness?.percentage >= 80 ? 'green' : 'purple'}
                />
              </div>

              {/* Grid de información rápida */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Datos vitales */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-500" />
                    Datos Vitales
                  </h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Droplet className="w-5 h-5 text-red-500" />
                        <span className="text-sm text-gray-500">Tipo de Sangre</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {patientService.formatBloodType(profile.bloodType)}
                      </p>
                    </div>
                    {bmiData && (
                      <div className="bg-gray-50 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Scale className="w-5 h-5 text-blue-500" />
                          <span className="text-sm text-gray-500">IMC</span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{bmiData.bmi}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          bmiData.color === 'green' ? 'bg-green-100 text-green-700' :
                          bmiData.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {bmiData.category}
                        </span>
                      </div>
                    )}
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Ruler className="w-5 h-5 text-purple-500" />
                        <span className="text-sm text-gray-500">Altura</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {profile.height ? `${profile.height} cm` : '-'}
                      </p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Scale className="w-5 h-5 text-green-500" />
                        <span className="text-sm text-gray-500">Peso</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {profile.weight ? `${profile.weight} kg` : '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Alergias críticas */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    Alergias Importantes
                  </h3>
                  {criticalAllergies.length > 0 ? (
                    <div className="space-y-3">
                      {criticalAllergies.slice(0, 4).map(allergy => (
                        <div
                          key={allergy.id}
                          className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100"
                        >
                          <div>
                            <p className="font-semibold text-gray-900">{allergy.allergen}</p>
                            <p className="text-sm text-gray-500">{patientService.formatAllergyType(allergy.allergyType)}</p>
                          </div>
                          <SeverityBadge severity={allergy.severity} />
                        </div>
                      ))}
                      {criticalAllergies.length > 4 && (
                        <button
                          onClick={() => setActiveTab('allergies')}
                          className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                        >
                          Ver todas <ChevronRight className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-6 bg-gray-50 rounded-xl">
                      <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                      <p className="text-gray-500">Sin alergias críticas registradas</p>
                    </div>
                  )}
                </div>

                {/* Timeline rápido de historial */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 lg:col-span-2">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Heart className="w-5 h-5 text-teal-500" />
                      Historial Médico Reciente
                    </h3>
                    {medicalHistory.length > 3 && (
                      <button
                        onClick={() => setActiveTab('history')}
                        className="text-sm text-teal-600 hover:text-teal-700 flex items-center gap-1"
                      >
                        Ver todo <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <MedicalTimeline conditions={medicalHistory.slice(0, 3)} />
                </div>
              </div>

              {/* Completar perfil */}
              {completeness?.percentage < 80 && completeness?.missing?.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-teal-500 to-emerald-500 rounded-2xl p-6 text-white"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-white/20 rounded-xl">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-xl font-semibold mb-2">Completa tu perfil</h3>
                      <p className="text-teal-100 mb-4">
                        Un perfil completo ayuda a los médicos a brindarte mejor atención.
                        Te faltan {completeness.missing.length} campos por completar.
                      </p>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {completeness.missing.slice(0, 4).map((field, idx) => (
                          <span key={idx} className="bg-white/20 px-3 py-1 rounded-full text-sm">
                            {field}
                          </span>
                        ))}
                      </div>
                      <Link
                        to="/perfil-paciente/editar"
                        className="inline-flex items-center gap-2 bg-white text-teal-600 px-6 py-2 rounded-lg font-semibold hover:bg-teal-50 transition-colors"
                      >
                        Completar ahora
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {/* Tab: Información Personal */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Datos físicos */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-teal-500" />
                  Datos Físicos
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-red-50 rounded-lg">
                      <Droplet className="w-5 h-5 text-red-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tipo de sangre</p>
                      <p className="font-semibold">{patientService.formatBloodType(profile.bloodType)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      <Ruler className="w-5 h-5 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Altura</p>
                      <p className="font-semibold">{profile.height ? `${profile.height} cm` : 'No especificada'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-green-50 rounded-lg">
                      <Scale className="w-5 h-5 text-green-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Peso</p>
                      <p className="font-semibold">{profile.weight ? `${profile.weight} kg` : 'No especificado'}</p>
                    </div>
                  </div>
                  {bmiData && (
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${
                        bmiData.color === 'green' ? 'bg-green-50' :
                        bmiData.color === 'yellow' ? 'bg-yellow-50' :
                        bmiData.color === 'orange' ? 'bg-orange-50' : 'bg-red-50'
                      }`}>
                        <Activity className={`w-5 h-5 ${
                          bmiData.color === 'green' ? 'text-green-500' :
                          bmiData.color === 'yellow' ? 'text-yellow-500' :
                          bmiData.color === 'orange' ? 'text-orange-500' : 'text-red-500'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">IMC</p>
                        <p className="font-semibold">{bmiData.bmi} ({bmiData.category})</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Estilo de vida */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-teal-500" />
                  Estilo de Vida
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gray-50 rounded-lg">
                      <Cigarette className="w-5 h-5 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Tabaco</p>
                      <p className="font-semibold">{patientService.formatSmokingStatus(profile.smokingStatus)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-purple-50 rounded-lg">
                      <Wine className="w-5 h-5 text-purple-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Alcohol</p>
                      <p className="font-semibold">{patientService.formatAlcoholConsumption(profile.alcoholConsumption)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-50 rounded-lg">
                      <Dumbbell className="w-5 h-5 text-orange-500" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ejercicio</p>
                      <p className="font-semibold">{patientService.formatExerciseFrequency(profile.exerciseFrequency)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contacto de emergencia */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-teal-500" />
                  Contacto de Emergencia
                </h3>
                {profile.emergencyContactName ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{profile.emergencyContactName}</p>
                    <p className="text-gray-600">{profile.emergencyContactPhone}</p>
                    {profile.emergencyContactRelationship && (
                      <p className="text-sm text-gray-500">Relación: {profile.emergencyContactRelationship}</p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No has agregado un contacto de emergencia</p>
                )}
              </div>

              {/* Seguro médico */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-teal-500" />
                  Seguro Médico
                </h3>
                {profile.hasInsurance && profile.insuranceProvider ? (
                  <div className="space-y-2">
                    <p className="font-semibold text-gray-900">{profile.insuranceProvider}</p>
                    {profile.insurancePolicyNumber && (
                      <p className="text-gray-600">Póliza: {profile.insurancePolicyNumber}</p>
                    )}
                    {profile.insuranceExpiryDate && (
                      <p className={`text-sm ${
                        new Date(profile.insuranceExpiryDate) >= new Date()
                          ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {new Date(profile.insuranceExpiryDate) >= new Date()
                          ? `Vigente hasta: ${patientService.formatDate(profile.insuranceExpiryDate)}`
                          : `Expirado: ${patientService.formatDate(profile.insuranceExpiryDate)}`
                        }
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 italic">Sin seguro médico registrado</p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Historial Médico con Timeline */}
          {activeTab === 'history' && (
            <div className="space-y-6">
              {/* Resumen de condiciones */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-4 text-white">
                  <Activity className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{medicalHistory.filter(c => c.status === 'active').length}</div>
                  <div className="text-sm text-blue-100">Condiciones Activas</div>
                </div>
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-4 text-white">
                  <Clock className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{chronicConditions.length}</div>
                  <div className="text-sm text-orange-100">Condiciones Crónicas</div>
                </div>
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-4 text-white">
                  <CheckCircle className="w-6 h-6 mb-2 opacity-80" />
                  <div className="text-2xl font-bold">{medicalHistory.filter(c => c.status === 'resolved').length}</div>
                  <div className="text-sm text-green-100">Condiciones Resueltas</div>
                </div>
              </div>

              {/* Condiciones crónicas destacadas */}
              {chronicConditions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5"
                >
                  <h4 className="font-semibold text-orange-800 mb-3 flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Condiciones Crónicas Activas
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {chronicConditions.map(c => (
                      <span key={c.id} className="bg-white text-orange-800 px-4 py-2 rounded-full text-sm font-medium shadow-sm border border-orange-100">
                        {c.condition}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Timeline visual */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <Heart className="w-6 h-6 text-teal-500" />
                    Línea de Tiempo Médica
                  </h3>
                  <Link
                    to="/perfil-paciente/editar?tab=history"
                    className="text-teal-600 hover:text-teal-700 flex items-center gap-1 text-sm"
                  >
                    <Edit className="w-4 h-4" />
                    Editar historial
                  </Link>
                </div>
                <MedicalTimeline conditions={medicalHistory} />
              </div>
            </div>
          )}

          {/* Tab: Antecedentes Familiares */}
          {activeTab === 'family' && (
            <div className="space-y-6">
              {/* Header */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <Users className="w-6 h-6 text-teal-500" />
                      Antecedentes Familiares
                    </h3>
                    <p className="text-gray-500 mt-1">
                      Historial médico de tus familiares directos
                    </p>
                  </div>
                  <Link
                    to="/perfil-paciente/editar?tab=family"
                    className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm bg-teal-50 px-4 py-2 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </Link>
                </div>

                <FamilyHistorySection familyHistory={familyHistory} />
              </div>

              {/* Información sobre importancia */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm">
                    <Stethoscope className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">¿Por qué es importante?</h4>
                    <p className="text-gray-600 text-sm">
                      Los antecedentes familiares ayudan a tu médico a identificar posibles riesgos
                      genéticos y a tomar decisiones preventivas. Condiciones como diabetes,
                      enfermedades cardíacas y algunos tipos de cáncer pueden tener componentes hereditarios.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Alergias */}
          {activeTab === 'allergies' && (
            <div className="space-y-6">
              {/* Alergias críticas destacadas */}
              {criticalAllergies.length > 0 && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Alergias Críticas - ¡Atención!
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {criticalAllergies.map(a => (
                      <span key={a.id} className="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-medium">
                        {a.allergen}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Lista de alergias */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Todas las Alergias</h3>
                {allergies.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {allergies.map(allergy => (
                      <AllergyCard key={allergy.id} allergy={allergy} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No hay alergias registradas
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Tab: Medicamentos */}
          {activeTab === 'medications' && (
            <div className="space-y-6">
              {/* Medicamentos activos */}
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  Medicamentos Activos ({activeMeds.length})
                </h3>
                {activeMeds.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {activeMeds.map(medication => (
                      <MedicationCard key={medication.id} medication={medication} />
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">
                    No hay medicamentos activos
                  </p>
                )}
              </div>

              {/* Medicamentos suspendidos */}
              {medications.filter(m => !m.isActive).length > 0 && (
                <div className="bg-white rounded-xl p-6 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5 text-gray-400" />
                    Medicamentos Suspendidos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {medications.filter(m => !m.isActive).map(medication => (
                      <MedicationCard key={medication.id} medication={medication} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Modal de QR para compartir */}
      <AnimatePresence>
        {showQRModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQRModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="mb-6">
                <QrCode className="w-16 h-16 text-teal-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Compartir Perfil
                </h3>
                <p className="text-gray-500 text-sm">
                  Escanea este código para ver tu perfil de salud
                </p>
              </div>

              {/* Placeholder QR - En producción se usaría una librería de QR */}
              <div className="bg-gray-100 rounded-xl p-4 mb-6">
                <div className="w-48 h-48 mx-auto bg-white rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                  <div className="text-center text-gray-400">
                    <QrCode className="w-20 h-20 mx-auto mb-2" />
                    <span className="text-xs">Código QR</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    setShowQRModal(false);
                  }}
                  className="w-full flex items-center justify-center gap-2 bg-teal-500 text-white px-4 py-3 rounded-xl font-medium hover:bg-teal-600 transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copiar enlace
                </button>
                <button
                  onClick={() => setShowQRModal(false)}
                  className="w-full text-gray-500 hover:text-gray-700 py-2"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Estilos de impresión */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
        }
      `}</style>
    </div>
  );
};

export default PatientProfilePage;

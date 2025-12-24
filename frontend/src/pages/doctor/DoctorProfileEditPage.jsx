/**
 * DoctorProfileEditPage - CITAMED.VE
 * M02 Sub-Partida 3.1 - Perfil Médico Completo
 *
 * Página de edición del perfil médico - Basada en la vista pública premium
 * El médico ve su perfil como lo ven los pacientes, con opciones de editar cada sección
 */

import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  MapPin,
  Phone,
  Clock,
  Star,
  Award,
  GraduationCap,
  Briefcase,
  Calendar,
  Video,
  Home,
  Shield,
  ShieldCheck,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  CheckCircle,
  Languages,
  Stethoscope,
  Building2,
  BadgeCheck,
  Users,
  Edit3,
  Save,
  X,
  Plus,
  Trash2,
  Camera,
  Upload,
  Search,
  Eye,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import Navbar from '../../components/common/Navbar/Navbar';
import useDoctorProfile from '../../hooks/useDoctorProfile';
import specialtiesService from '../../services/specialtiesService';

// ═══════════════════════════════════════════════════════════════
// COMPONENTES REUTILIZABLES
// ═══════════════════════════════════════════════════════════════

// Botón de editar que aparece en cada sección
const EditButton = ({ onClick, label = 'Modificar' }) => (
  <button
    onClick={onClick}
    className="inline-flex items-center gap-2 px-4 py-2 bg-white/90 hover:bg-white text-teal-700 rounded-xl font-medium transition-all shadow-sm hover:shadow-md border border-teal-200"
  >
    <Edit3 className="w-4 h-4" />
    {label}
  </button>
);

// Modal genérico para editar secciones
const EditModal = ({ isOpen, onClose, title, children, onSave, saving }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-teal-50 to-cyan-50">
            <h3 className="text-xl font-bold text-gray-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {children}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t bg-gray-50">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 text-gray-700 hover:bg-gray-100 rounded-xl font-medium transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-sm disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Guardar Cambios
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// Componente de estadísticas destacadas
const StatCard = ({ icon: Icon, value, label, color, editable, onEdit }) => (
  <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center relative group">
    <div className={`w-10 h-10 mx-auto mb-2 rounded-lg ${color} flex items-center justify-center`}>
      <Icon className="w-5 h-5 text-white" />
    </div>
    <div className="text-2xl font-bold text-white">{value}</div>
    <div className="text-sm text-white/70">{label}</div>
    {editable && (
      <button
        onClick={onEdit}
        className="absolute top-2 right-2 p-1.5 bg-white/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <Edit3 className="w-3 h-3 text-white" />
      </button>
    )}
  </div>
);

// Badge de verificación
const VerificationBadge = ({ isVerified, verificationStatus }) => {
  if (isVerified || verificationStatus === 'approved') {
    return (
      <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-100 px-3 py-1.5 rounded-full text-sm font-medium">
        <ShieldCheck className="w-4 h-4" />
        Médico Verificado
      </div>
    );
  }
  return (
    <Link
      to="/verificacion/kyc"
      className="inline-flex items-center gap-1.5 bg-amber-500/20 text-amber-100 px-3 py-1.5 rounded-full text-sm font-medium hover:bg-amber-500/30 transition-colors"
    >
      <AlertCircle className="w-4 h-4" />
      Verificar perfil
    </Link>
  );
};

// Componente de Badge para especialidades
const SpecialtyBadge = ({ specialty, isPrimary, onRemove, editable }) => (
  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${
    isPrimary
      ? 'bg-white text-teal-700 shadow-lg'
      : 'bg-white/20 text-white backdrop-blur-sm'
  }`}>
    {isPrimary && <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />}
    {specialty?.name || specialty}
    {editable && onRemove && (
      <button
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className="ml-1 p-0.5 hover:bg-black/10 rounded-full"
      >
        <X className="w-3 h-3" />
      </button>
    )}
  </span>
);

// Componente de sección con icono y botón de editar
const SectionHeader = ({ icon: Icon, title, color = 'teal', onEdit, editable = true }) => (
  <div className="flex items-center justify-between mb-6">
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl bg-${color}-50 flex items-center justify-center`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
    </div>
    {editable && onEdit && <EditButton onClick={onEdit} />}
  </div>
);

// ═══════════════════════════════════════════════════════════════
// COMPONENTES DE EDICIÓN ESPECÍFICOS
// ═══════════════════════════════════════════════════════════════

// Editor de Información Básica
const BasicInfoEditor = ({ profile, onSave, saving }) => {
  const [formData, setFormData] = useState({
    bio: profile?.bio || '',
    experienceYears: profile?.experienceYears || 0,
    consultationFee: profile?.consultationFee || 0,
    priceTeleconsultation: profile?.priceTeleconsultation || 0,
    priceHomeVisit: profile?.priceHomeVisit || 0,
    consultationDuration: profile?.consultationDuration || 30,
    acceptsInsurance: profile?.acceptsInsurance || false,
    telemedicineEnabled: profile?.telemedicineEnabled || false,
    homeVisitsEnabled: profile?.homeVisitsEnabled || false,
    availableForEmergencies: profile?.availableForEmergencies || false,
    acceptingNewPatients: profile?.acceptingNewPatients ?? true,
    languages: profile?.languages || ['Español']
  });

  const [newLanguage, setNewLanguage] = useState('');

  const handleSubmit = () => {
    onSave(formData);
  };

  const addLanguage = () => {
    if (newLanguage.trim() && !formData.languages.includes(newLanguage.trim())) {
      setFormData(prev => ({
        ...prev,
        languages: [...prev.languages, newLanguage.trim()]
      }));
      setNewLanguage('');
    }
  };

  const removeLanguage = (lang) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.filter(l => l !== lang)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Biografía */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Biografía profesional
        </label>
        <textarea
          value={formData.bio}
          onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
          rows={4}
          placeholder="Describe tu experiencia, enfoque médico, y qué te hace único como profesional..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/500 caracteres</p>
      </div>

      {/* Experiencia y duración */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Años de experiencia</label>
          <input
            type="number"
            value={formData.experienceYears}
            onChange={(e) => setFormData(prev => ({ ...prev, experienceYears: parseInt(e.target.value) || 0 }))}
            min="0"
            max="70"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Duración consulta</label>
          <select
            value={formData.consultationDuration}
            onChange={(e) => setFormData(prev => ({ ...prev, consultationDuration: parseInt(e.target.value) }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          >
            <option value={15}>15 minutos</option>
            <option value={30}>30 minutos</option>
            <option value={45}>45 minutos</option>
            <option value={60}>60 minutos</option>
            <option value={90}>90 minutos</option>
          </select>
        </div>
      </div>

      {/* Tarifas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Tarifas (USD)</label>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Presencial</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.consultationFee}
                onChange={(e) => setFormData(prev => ({ ...prev, consultationFee: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Teleconsulta</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.priceTeleconsultation}
                onChange={(e) => setFormData(prev => ({ ...prev, priceTeleconsultation: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Domicilio</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
              <input
                type="number"
                value={formData.priceHomeVisit}
                onChange={(e) => setFormData(prev => ({ ...prev, priceHomeVisit: parseFloat(e.target.value) || 0 }))}
                className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Idiomas */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Idiomas</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {formData.languages.map((lang, idx) => (
            <span key={idx} className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium">
              {lang}
              <button onClick={() => removeLanguage(lang)} className="hover:text-indigo-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newLanguage}
            onChange={(e) => setNewLanguage(e.target.value)}
            placeholder="Agregar idioma..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLanguage())}
          />
          <button onClick={addLanguage} className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200">
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Servicios */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-3">Servicios disponibles</label>
        <div className="grid grid-cols-2 gap-3">
          {[
            { key: 'acceptsInsurance', label: 'Acepta seguros médicos', icon: Shield },
            { key: 'telemedicineEnabled', label: 'Ofrece telemedicina', icon: Video },
            { key: 'homeVisitsEnabled', label: 'Visitas a domicilio', icon: Home },
            { key: 'availableForEmergencies', label: 'Disponible para emergencias', icon: AlertCircle },
            { key: 'acceptingNewPatients', label: 'Acepta nuevos pacientes', icon: Users }
          ].map(opt => {
            const Icon = opt.icon;
            return (
              <label
                key={opt.key}
                className={`flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                  formData[opt.key]
                    ? 'border-teal-500 bg-teal-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData[opt.key]}
                  onChange={(e) => setFormData(prev => ({ ...prev, [opt.key]: e.target.checked }))}
                  className="sr-only"
                />
                <Icon className={`w-5 h-5 ${formData[opt.key] ? 'text-teal-600' : 'text-gray-400'}`} />
                <span className={`text-sm font-medium ${formData[opt.key] ? 'text-teal-700' : 'text-gray-600'}`}>
                  {opt.label}
                </span>
                {formData[opt.key] && <CheckCircle className="w-4 h-4 text-teal-500 ml-auto" />}
              </label>
            );
          })}
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium hover:from-teal-600 hover:to-cyan-600 transition-all shadow-md"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Cambios
        </button>
      </div>
    </div>
  );
};

// Editor de Ubicación
const LocationEditor = ({ profile, onSave, saving }) => {
  const [formData, setFormData] = useState({
    clinicName: profile?.clinicName || '',
    clinicAddress: profile?.clinicAddress || '',
    city: profile?.city || '',
    state: profile?.state || '',
    country: profile?.country || 'Venezuela',
    postalCode: profile?.postalCode || '',
    phoneNumber: profile?.phoneNumber || '',
    whatsappNumber: profile?.whatsappNumber || '',
    officeLatitude: profile?.officeLatitude || null,
    officeLongitude: profile?.officeLongitude || null
  });

  const [gettingLocation, setGettingLocation] = useState(false);

  const venezuelaStates = [
    'Amazonas', 'Anzoátegui', 'Apure', 'Aragua', 'Barinas', 'Bolívar',
    'Carabobo', 'Cojedes', 'Delta Amacuro', 'Distrito Capital', 'Falcón',
    'Guárico', 'Lara', 'Mérida', 'Miranda', 'Monagas', 'Nueva Esparta',
    'Portuguesa', 'Sucre', 'Táchira', 'Trujillo', 'Vargas', 'Yaracuy', 'Zulia'
  ];

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocalización no disponible en este navegador');
      return;
    }

    setGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          officeLatitude: position.coords.latitude,
          officeLongitude: position.coords.longitude
        }));
        toast.success('Ubicación obtenida correctamente');
        setGettingLocation(false);
      },
      (error) => {
        toast.error('No se pudo obtener la ubicación');
        setGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleSubmit = () => {
    onSave(formData);
  };

  return (
    <div className="space-y-6">
      {/* Nombre del consultorio */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nombre del consultorio / clínica
        </label>
        <input
          type="text"
          value={formData.clinicName}
          onChange={(e) => setFormData(prev => ({ ...prev, clinicName: e.target.value }))}
          placeholder="Ej: Consultorio Médico Dr. García"
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* Estado y Ciudad */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
          <select
            value={formData.state}
            onChange={(e) => setFormData(prev => ({ ...prev, state: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Seleccionar estado</option>
            {venezuelaStates.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ciudad</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            placeholder="Ej: Caracas"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Dirección */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Dirección completa</label>
        <input
          type="text"
          value={formData.clinicAddress}
          onChange={(e) => setFormData(prev => ({ ...prev, clinicAddress: e.target.value }))}
          placeholder="Av. Principal, Centro Comercial, Torre, Piso, Consultorio..."
          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {/* GPS */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Ubicación GPS del consultorio
        </label>
        <div className="flex gap-4">
          <div className="flex-1 grid grid-cols-2 gap-2">
            <input
              type="number"
              step="any"
              value={formData.officeLatitude || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, officeLatitude: parseFloat(e.target.value) || null }))}
              placeholder="Latitud"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
            <input
              type="number"
              step="any"
              value={formData.officeLongitude || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, officeLongitude: parseFloat(e.target.value) || null }))}
              placeholder="Longitud"
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
            />
          </div>
          <button
            onClick={getCurrentLocation}
            disabled={gettingLocation}
            className="px-4 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors flex items-center gap-2"
          >
            {gettingLocation ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
            {gettingLocation ? 'Obteniendo...' : 'Usar mi ubicación'}
          </button>
        </div>
        {formData.officeLatitude && formData.officeLongitude && (
          <p className="text-xs text-green-600 mt-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" />
            Coordenadas guardadas: {formData.officeLatitude.toFixed(6)}, {formData.officeLongitude.toFixed(6)}
          </p>
        )}
      </div>

      {/* Teléfonos */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Teléfono</label>
          <input
            type="tel"
            value={formData.phoneNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder="+58 212 1234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp</label>
          <input
            type="tel"
            value={formData.whatsappNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, whatsappNumber: e.target.value }))}
            placeholder="+58 414 1234567"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
        </div>
      </div>

      {/* Botón guardar */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSubmit}
          disabled={saving}
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium"
        >
          {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
          Guardar Ubicación
        </button>
      </div>
    </div>
  );
};

// Editor de Educación
const EducationEditor = ({ education = [], onAdd, onUpdate, onDelete, saving }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    degree: '',
    institution: '',
    country: 'Venezuela',
    startYear: new Date().getFullYear() - 4,
    endYear: new Date().getFullYear()
  });

  const handleSubmit = async () => {
    if (!formData.degree || !formData.institution) {
      toast.error('Completa los campos requeridos');
      return;
    }

    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }
    resetForm();
  };

  const handleEdit = (edu) => {
    setFormData({
      degree: edu.degree,
      institution: edu.institution,
      country: edu.country || 'Venezuela',
      startYear: edu.startYear,
      endYear: edu.endYear
    });
    setEditingId(edu.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      degree: '',
      institution: '',
      country: 'Venezuela',
      startYear: new Date().getFullYear() - 4,
      endYear: new Date().getFullYear()
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      {/* Lista de educación */}
      {education.map((edu) => (
        <div key={edu.id} className="flex items-start justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
          <div className="flex gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <GraduationCap className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{edu.degree}</h4>
              <p className="text-blue-600">{edu.institution}</p>
              <p className="text-sm text-gray-500">{edu.startYear} - {edu.endYear || 'Presente'} | {edu.country}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEdit(edu)} className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(edu.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Formulario */}
      {showForm ? (
        <div className="p-4 border-2 border-dashed border-teal-300 rounded-xl bg-teal-50/50 space-y-4">
          <input
            type="text"
            value={formData.degree}
            onChange={(e) => setFormData(prev => ({ ...prev, degree: e.target.value }))}
            placeholder="Título / Grado (ej: Doctor en Medicina)"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
          <input
            type="text"
            value={formData.institution}
            onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
            placeholder="Universidad / Institución"
            className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
          />
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              value={formData.country}
              onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
              placeholder="País"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            />
            <input
              type="number"
              value={formData.startYear}
              onChange={(e) => setFormData(prev => ({ ...prev, startYear: parseInt(e.target.value) }))}
              placeholder="Año inicio"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            />
            <input
              type="number"
              value={formData.endYear || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, endYear: e.target.value ? parseInt(e.target.value) : null }))}
              placeholder="Año fin"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-700 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-teal-500 hover:text-teal-600 hover:bg-teal-50/50 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Agregar formación académica
        </button>
      )}
    </div>
  );
};

// Editor de Experiencia
const ExperienceEditor = ({ experience = [], onAdd, onUpdate, onDelete, saving }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    position: '',
    institution: '',
    institutionType: 'hospital_privado',
    city: '',
    startDate: '',
    endDate: '',
    isCurrent: false,
    description: ''
  });

  const institutionTypes = [
    { value: 'hospital_publico', label: 'Hospital Público' },
    { value: 'hospital_privado', label: 'Hospital Privado' },
    { value: 'clinica', label: 'Clínica' },
    { value: 'consultorio', label: 'Consultorio Privado' },
    { value: 'centro_medico', label: 'Centro Médico' },
    { value: 'universidad', label: 'Universidad' },
    { value: 'laboratorio', label: 'Laboratorio' },
    { value: 'otro', label: 'Otro' }
  ];

  const handleSubmit = async () => {
    if (!formData.position || !formData.institution) {
      toast.error('Completa los campos requeridos');
      return;
    }

    const data = {
      ...formData,
      endDate: formData.isCurrent ? null : formData.endDate
    };

    if (editingId) {
      await onUpdate(editingId, data);
    } else {
      await onAdd(data);
    }
    resetForm();
  };

  const handleEdit = (exp) => {
    setFormData({
      position: exp.position || '',
      institution: exp.institution || '',
      institutionType: exp.institutionType || 'hospital_privado',
      city: exp.city || '',
      startDate: exp.startDate ? exp.startDate.substring(0, 10) : '',
      endDate: exp.endDate ? exp.endDate.substring(0, 10) : '',
      isCurrent: !exp.endDate,
      description: exp.description || ''
    });
    setEditingId(exp.id);
    setShowForm(true);
  };

  const resetForm = () => {
    setFormData({
      position: '',
      institution: '',
      institutionType: 'hospital_privado',
      city: '',
      startDate: '',
      endDate: '',
      isCurrent: false,
      description: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-VE', { year: 'numeric', month: 'short' }) : 'Presente';

  return (
    <div className="space-y-4">
      {/* Lista de experiencia */}
      {experience.map((exp) => (
        <div key={exp.id} className="flex items-start justify-between p-4 bg-purple-50 rounded-xl border border-purple-100">
          <div className="flex gap-3">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Briefcase className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-semibold text-gray-900">{exp.position}</h4>
                {!exp.endDate && (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Actual</span>
                )}
              </div>
              <p className="text-purple-600">{exp.institution}</p>
              <p className="text-sm text-gray-500">
                {formatDate(exp.startDate)} - {formatDate(exp.endDate)}
                {exp.city && ` • ${exp.city}`}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleEdit(exp)} className="p-2 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-lg">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(exp.id)} className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ))}

      {/* Formulario */}
      {showForm ? (
        <div className="p-4 border-2 border-dashed border-purple-300 rounded-xl bg-purple-50/50 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData(prev => ({ ...prev, position: e.target.value }))}
              placeholder="Cargo (ej: Médico Internista)"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
            <input
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData(prev => ({ ...prev, institution: e.target.value }))}
              placeholder="Institución"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <select
              value={formData.institutionType}
              onChange={(e) => setFormData(prev => ({ ...prev, institutionType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            >
              {institutionTypes.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
              placeholder="Ciudad"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha inicio</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Fecha fin</label>
              <input
                type="date"
                value={formData.endDate}
                disabled={formData.isCurrent}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl disabled:bg-gray-100"
              />
            </div>
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isCurrent}
              onChange={(e) => setFormData(prev => ({ ...prev, isCurrent: e.target.checked, endDate: '' }))}
              className="w-5 h-5 text-purple-600 rounded"
            />
            <span className="text-gray-700">Trabajo actual</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descripción breve del cargo (opcional)"
            rows={2}
            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {editingId ? 'Actualizar' : 'Agregar'}
            </button>
            <button onClick={resetForm} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-xl">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="w-full py-4 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-purple-500 hover:text-purple-600 hover:bg-purple-50/50 flex items-center justify-center gap-2 transition-all"
        >
          <Plus className="w-5 h-5" />
          Agregar experiencia profesional
        </button>
      )}
    </div>
  );
};

// Editor de Especialidades
const SpecialtiesEditor = ({ specialties = [], onAdd, onRemove, saving }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [allSpecialties, setAllSpecialties] = useState([]);
  const [loadingSpecialties, setLoadingSpecialties] = useState(false);

  useEffect(() => {
    const fetchSpecialties = async () => {
      setLoadingSpecialties(true);
      try {
        const response = await specialtiesService.getSpecialties();
        if (response.success) setAllSpecialties(response.data);
      } catch (err) {
        console.error('Error loading specialties:', err);
      } finally {
        setLoadingSpecialties(false);
      }
    };
    fetchSpecialties();
  }, []);

  const filteredSpecialties = allSpecialties.filter(s => {
    const isAssigned = specialties.some(assigned => assigned.specialtyId === s.id);
    if (isAssigned) return false;
    if (searchTerm) return s.name.toLowerCase().includes(searchTerm.toLowerCase());
    return true;
  });

  const handleAdd = async (specialty) => {
    await onAdd({ specialtyId: specialty.id, isPrimary: specialties.length === 0 });
    setSearchTerm('');
  };

  return (
    <div className="space-y-4">
      {/* Especialidades actuales */}
      {specialties.length > 0 && (
        <div className="space-y-2">
          {specialties.map((spec, idx) => (
            <div
              key={spec.specialtyId || idx}
              className={`flex items-center justify-between p-4 rounded-xl ${
                spec.isPrimary ? 'bg-teal-50 border-2 border-teal-200' : 'bg-gray-50 border border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3">
                <Stethoscope className={`w-5 h-5 ${spec.isPrimary ? 'text-teal-600' : 'text-gray-500'}`} />
                <span className="font-medium">{spec.specialty?.name || `Especialidad #${spec.specialtyId}`}</span>
                {spec.isPrimary && (
                  <span className="text-xs bg-teal-600 text-white px-2 py-0.5 rounded-full">Principal</span>
                )}
              </div>
              <button
                onClick={() => onRemove(spec.specialtyId)}
                className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar especialidad para agregar..."
          className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-teal-500"
        />
      </div>

      {searchTerm && (
        <div className="max-h-48 overflow-y-auto border rounded-xl bg-white shadow-lg">
          {loadingSpecialties ? (
            <div className="p-4 text-center text-gray-500 flex items-center justify-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              Cargando especialidades...
            </div>
          ) : filteredSpecialties.length === 0 ? (
            <div className="p-4 text-center text-gray-500">No se encontraron especialidades</div>
          ) : (
            filteredSpecialties.slice(0, 10).map(spec => (
              <button
                key={spec.id}
                onClick={() => handleAdd(spec)}
                className="w-full flex items-center justify-between p-4 hover:bg-teal-50 text-left border-b last:border-0"
              >
                <span className="font-medium text-gray-700">{spec.name}</span>
                <Plus className="w-5 h-5 text-teal-600" />
              </button>
            ))
          )}
        </div>
      )}

      {specialties.length === 0 && !searchTerm && (
        <p className="text-center text-gray-500 py-4">
          Usa el buscador arriba para agregar tus especialidades médicas
        </p>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENTE PRINCIPAL
// ═══════════════════════════════════════════════════════════════

const DoctorProfileEditPage = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const {
    profile, loading, error, saving, completeness, specialties,
    fetchMyProfile, fetchCompleteness, updateBasicInfo, uploadProfilePhoto,
    addSpecialty, removeSpecialty,
    addEducation, updateEducation, deleteEducation,
    addExperience, updateExperience, deleteExperience
  } = useDoctorProfile({ autoFetch: true });

  const [activeTab, setActiveTab] = useState('info');
  const [editingSection, setEditingSection] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Manejo de foto de perfil
  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Formato no válido. Use JPG, PNG o WebP.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen es muy grande. Máximo 5MB.');
      return;
    }

    setUploadingPhoto(true);
    try {
      const result = await uploadProfilePhoto(file);
      if (result?.success) {
        toast.success('Foto actualizada correctamente');
        fetchMyProfile();
      }
    } catch (err) {
      toast.error('Error al subir la foto');
    } finally {
      setUploadingPhoto(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Guardar información básica
  const handleSaveBasicInfo = async (data) => {
    const result = await updateBasicInfo(data);
    if (result?.success) {
      setEditingSection(null);
      fetchCompleteness();
    }
  };

  // Guardar ubicación
  const handleSaveLocation = async (data) => {
    const result = await updateBasicInfo(data);
    if (result?.success) {
      setEditingSection(null);
      fetchCompleteness();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="flex items-center justify-center py-32">
          <div className="text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400 animate-pulse flex items-center justify-center">
              <Stethoscope className="w-10 h-10 text-white animate-bounce" />
            </div>
            <p className="text-gray-500 font-medium">Cargando tu perfil...</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información', icon: User },
    { id: 'services', label: 'Servicios y Tarifas', icon: Briefcase },
    { id: 'schedule', label: 'Horarios', icon: Calendar },
    { id: 'location', label: 'Ubicación', icon: MapPin }
  ];

  const stats = {
    experience: profile?.experienceYears || 0,
    rating: profile?.averageRating ? parseFloat(profile.averageRating).toFixed(1) : null,
    reviews: profile?.totalReviews || 0,
    completeness: completeness?.percentage || 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-teal-50/30">
      <Navbar />

      {/* Hero Header - Similar al perfil público pero con opciones de edición */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-600 via-teal-500 to-cyan-500">
          <svg className="absolute inset-0 w-full h-full opacity-10" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="heroPattern" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1" fill="white" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#heroPattern)" />
          </svg>
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-cyan-400/20 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 py-8 lg:py-12">
          {/* Breadcrumb y acciones */}
          <div className="flex items-center justify-between mb-8">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 text-white/70 text-sm"
            >
              <Link to="/medico/dashboard" className="hover:text-white transition-colors flex items-center gap-1">
                <ArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <ChevronRight className="w-4 h-4" />
              <span className="text-white">Editar Mi Perfil</span>
            </motion.div>

            <Link
              to={`/doctor/${profile?.id}`}
              target="_blank"
              className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-xl font-medium transition-colors backdrop-blur-sm"
            >
              <Eye className="w-4 h-4" />
              Ver perfil público
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Foto de perfil - Editable */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full lg:w-auto flex flex-col items-center"
            >
              <div
                className="relative cursor-pointer group"
                onClick={handlePhotoClick}
              >
                <div className="w-40 h-40 lg:w-48 lg:h-48 rounded-full bg-white p-1.5 shadow-2xl">
                  <div className="w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    {profile?.profilePhoto ? (
                      <img
                        src={profile.profilePhoto}
                        alt={`Dr. ${profile.firstName}`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-20 h-20 text-gray-400" />
                    )}
                  </div>
                </div>

                {/* Overlay de edición */}
                <div className="absolute inset-0 bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploadingPhoto ? (
                    <Loader2 className="w-10 h-10 text-white animate-spin" />
                  ) : (
                    <div className="text-center text-white">
                      <Camera className="w-10 h-10 mx-auto mb-1" />
                      <span className="text-sm font-medium">Cambiar foto</span>
                    </div>
                  )}
                </div>

                {/* Badge de verificación */}
                {(profile?.isVerified || profile?.verificationStatus === 'approved') && (
                  <div className="absolute -bottom-2 -right-2 w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg border-4 border-white">
                    <BadgeCheck className="w-7 h-7 text-white" />
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
            </motion.div>

            {/* Info principal */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex-1 text-center lg:text-left"
            >
              <div className="mb-3">
                <VerificationBadge isVerified={profile?.isVerified} verificationStatus={profile?.verificationStatus} />
              </div>

              <h1 className="text-3xl lg:text-4xl font-extrabold text-white mb-3">
                Dr. {profile?.firstName} {profile?.lastName}
              </h1>

              {/* Especialidades */}
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start mb-4">
                {specialties?.map((spec, idx) => (
                  <SpecialtyBadge key={idx} specialty={spec.specialty} isPrimary={spec.isPrimary || idx === 0} />
                ))}
                {specialties?.length === 0 && (
                  <button
                    onClick={() => setEditingSection('specialties')}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-white/20 text-white rounded-full text-sm hover:bg-white/30 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Agregar especialidad
                  </button>
                )}
              </div>

              {/* Bio corta */}
              {profile?.bio ? (
                <p className="text-white/80 text-lg max-w-xl mb-4 leading-relaxed">
                  {profile.bio.length > 150 ? `${profile.bio.substring(0, 150)}...` : profile.bio}
                </p>
              ) : (
                <button
                  onClick={() => setEditingSection('basic')}
                  className="text-white/60 hover:text-white text-lg mb-4 flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  Agregar biografía profesional
                </button>
              )}

              {/* Ubicación */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start text-white/80">
                {profile?.city ? (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5" />
                    <span>{profile.city}{profile.state && `, ${profile.state}`}</span>
                  </div>
                ) : (
                  <button
                    onClick={() => setEditingSection('location')}
                    className="flex items-center gap-2 text-white/60 hover:text-white"
                  >
                    <MapPin className="w-5 h-5" />
                    <span>+ Agregar ubicación</span>
                  </button>
                )}
                {profile?.languages?.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Languages className="w-5 h-5" />
                    <span>{profile.languages.join(', ')}</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Card de completitud */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="w-full lg:w-auto"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 min-w-[280px]">
                <div className="text-center mb-4">
                  <p className="text-gray-500 text-sm mb-1">Completitud del perfil</p>
                  <div className="relative w-24 h-24 mx-auto">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                      <circle
                        cx="48" cy="48" r="40" fill="none"
                        stroke="url(#gradient)"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.completeness * 2.51} 251`}
                      />
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#14b8a6" />
                          <stop offset="100%" stopColor="#06b6d4" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-2xl font-bold text-teal-600">{stats.completeness}%</span>
                    </div>
                  </div>
                </div>

                {stats.completeness < 100 && completeness?.missingFields?.length > 0 && (
                  <div className="space-y-2 mb-4">
                    <p className="text-xs text-gray-500 font-medium">Campos pendientes:</p>
                    {completeness.missingFields.slice(0, 3).map((field, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span>{field}</span>
                      </div>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => setEditingSection('basic')}
                  className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-3 rounded-xl font-bold hover:from-teal-600 hover:to-cyan-600 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  <Edit3 className="w-5 h-5" />
                  Editar Perfil
                </button>
              </div>
            </motion.div>
          </div>

          {/* Estadísticas */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8"
          >
            <StatCard
              icon={Award}
              value={stats.experience > 0 ? `${stats.experience}+` : '—'}
              label="Años de experiencia"
              color="bg-amber-500"
              editable
              onEdit={() => setEditingSection('basic')}
            />
            <StatCard
              icon={Star}
              value={stats.rating || '—'}
              label={`${stats.reviews} reseñas`}
              color="bg-yellow-500"
            />
            <StatCard
              icon={Users}
              value={profile?.acceptingNewPatients ? 'Sí' : 'No'}
              label="Acepta pacientes"
              color="bg-green-500"
              editable
              onEdit={() => setEditingSection('basic')}
            />
            <StatCard
              icon={Video}
              value={profile?.telemedicineEnabled ? 'Sí' : 'No'}
              label="Telemedicina"
              color="bg-blue-500"
              editable
              onEdit={() => setEditingSection('basic')}
            />
          </motion.div>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="sticky top-0 z-20 bg-white border-b shadow-sm">
        <div className="max-w-6xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-5 py-4 font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.id
                      ? 'border-teal-500 text-teal-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-6xl mx-auto px-4 py-10">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Tab: Información */}
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                {/* Sobre mí */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <SectionHeader icon={User} title="Sobre mí" onEdit={() => setEditingSection('basic')} />
                  {profile?.bio ? (
                    <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-line">{profile.bio}</p>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <User className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Agrega una biografía profesional</p>
                      <button
                        onClick={() => setEditingSection('basic')}
                        className="mt-3 text-teal-600 hover:underline text-sm font-medium"
                      >
                        + Agregar biografía
                      </button>
                    </div>
                  )}
                </div>

                {/* Formación Académica */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <SectionHeader icon={GraduationCap} title="Formación Académica" color="blue" onEdit={() => setEditingSection('education')} />
                  {profile?.education?.length > 0 ? (
                    <div className="space-y-4">
                      {profile.education.map((edu, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-gradient-to-r from-blue-50 to-transparent rounded-xl border border-blue-100">
                          <div className="p-3 bg-blue-100 rounded-xl h-fit">
                            <GraduationCap className="w-6 h-6 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg">{edu.degree}</h4>
                            <p className="text-blue-600 font-medium">{edu.institution}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              <Calendar className="w-4 h-4" />
                              <span>{edu.startYear} - {edu.endYear || 'Presente'}</span>
                              {edu.country && (
                                <>
                                  <span className="text-gray-300">•</span>
                                  <MapPin className="w-4 h-4" />
                                  <span>{edu.country}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Agrega tu formación académica</p>
                      <button
                        onClick={() => setEditingSection('education')}
                        className="mt-3 text-teal-600 hover:underline text-sm font-medium"
                      >
                        + Agregar educación
                      </button>
                    </div>
                  )}
                </div>

                {/* Experiencia Profesional */}
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <SectionHeader icon={Briefcase} title="Experiencia Profesional" color="purple" onEdit={() => setEditingSection('experience')} />
                  {profile?.experience?.length > 0 ? (
                    <div className="space-y-4">
                      {profile.experience.map((exp, idx) => (
                        <div key={idx} className="flex gap-4 p-4 bg-gradient-to-r from-purple-50 to-transparent rounded-xl border border-purple-100">
                          <div className="p-3 bg-purple-100 rounded-xl h-fit">
                            <Briefcase className="w-6 h-6 text-purple-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-bold text-gray-900 text-lg">{exp.position}</h4>
                              {!exp.endDate && (
                                <span className="text-xs bg-green-100 text-green-700 px-2.5 py-1 rounded-full font-semibold">
                                  Actualmente
                                </span>
                              )}
                            </div>
                            <p className="text-purple-600 font-medium">{exp.institution}</p>
                            <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
                              <Clock className="w-4 h-4" />
                              <span>
                                {exp.startDate && new Date(exp.startDate).toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })}
                                {' → '}
                                {exp.endDate
                                  ? new Date(exp.endDate).toLocaleDateString('es-VE', { month: 'short', year: 'numeric' })
                                  : 'Presente'}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>Agrega tu experiencia profesional</p>
                      <button
                        onClick={() => setEditingSection('experience')}
                        className="mt-3 text-teal-600 hover:underline text-sm font-medium"
                      >
                        + Agregar experiencia
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Especialidades */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-teal-600" />
                      Especialidades
                    </h3>
                    <button onClick={() => setEditingSection('specialties')} className="text-teal-600 hover:text-teal-700">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  {specialties?.length > 0 ? (
                    <div className="space-y-2">
                      {specialties.map((spec, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-teal-50 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-teal-600" />
                          <span className="font-medium text-teal-800">{spec.specialty?.name}</span>
                          {spec.isPrimary && (
                            <span className="text-xs bg-teal-200 text-teal-700 px-2 py-0.5 rounded-full">Principal</span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingSection('specialties')}
                      className="w-full py-4 border-2 border-dashed border-gray-200 rounded-xl text-gray-400 hover:border-teal-500 hover:text-teal-600 flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar especialidades
                    </button>
                  )}
                </div>

                {/* Idiomas */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Languages className="w-5 h-5 text-indigo-600" />
                      Idiomas
                    </h3>
                    <button onClick={() => setEditingSection('basic')} className="text-teal-600 hover:text-teal-700">
                      <Edit3 className="w-4 h-4" />
                    </button>
                  </div>
                  {profile?.languages?.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {profile.languages.map((lang, idx) => (
                        <span key={idx} className="bg-indigo-50 text-indigo-700 px-4 py-2 rounded-xl text-sm font-medium">
                          {lang}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingSection('basic')}
                      className="text-gray-400 hover:text-teal-600 text-sm"
                    >
                      + Agregar idiomas
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tab: Servicios */}
          {activeTab === 'services' && (
            <div className="space-y-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <SectionHeader icon={Briefcase} title="Servicios y Tarifas" onEdit={() => setEditingSection('basic')} />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className={`relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 ${profile?.consultationFee > 0 ? '' : 'opacity-60'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-4">
                      <User className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Consulta Presencial</h4>
                    <p className="text-sm text-gray-500 mb-3">Atención en consultorio</p>
                    {profile?.consultationFee > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-teal-600">${profile.consultationFee}</span>
                        <span className="text-gray-400 text-sm">USD</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No configurado</span>
                    )}
                  </div>

                  <div className={`relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 ${profile?.telemedicineEnabled && profile?.priceTeleconsultation > 0 ? '' : 'opacity-60'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-4">
                      <Video className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Teleconsulta</h4>
                    <p className="text-sm text-gray-500 mb-3">Consulta por videollamada</p>
                    {profile?.telemedicineEnabled && profile?.priceTeleconsultation > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-blue-600">${profile.priceTeleconsultation}</span>
                        <span className="text-gray-400 text-sm">USD</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
                  </div>

                  <div className={`relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-5 ${profile?.homeVisitsEnabled && profile?.priceHomeVisit > 0 ? '' : 'opacity-60'}`}>
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-4">
                      <Home className="w-7 h-7 text-white" />
                    </div>
                    <h4 className="font-bold text-gray-900 text-lg mb-1">Visita a Domicilio</h4>
                    <p className="text-sm text-gray-500 mb-3">Atención en tu hogar</p>
                    {profile?.homeVisitsEnabled && profile?.priceHomeVisit > 0 ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold text-purple-600">${profile.priceHomeVisit}</span>
                        <span className="text-gray-400 text-sm">USD</span>
                      </div>
                    ) : (
                      <span className="text-gray-400">No disponible</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab: Horarios */}
          {activeTab === 'schedule' && (
            <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
              <SectionHeader icon={Calendar} title="Horarios de Atención" color="green" onEdit={() => navigate('/medico/disponibilidad')} />
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                  <Calendar className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Configura tu disponibilidad</h3>
                <p className="text-gray-500 max-w-md mx-auto mb-6">
                  Define los días y horarios en que estás disponible para atender consultas.
                </p>
                <button
                  onClick={() => navigate('/medico/disponibilidad')}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium"
                >
                  <Calendar className="w-5 h-5" />
                  Configurar Horarios
                </button>
              </div>
            </div>
          )}

          {/* Tab: Ubicación */}
          {activeTab === 'location' && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <SectionHeader icon={Building2} title="Consultorio" color="red" onEdit={() => setEditingSection('location')} />

                {profile?.clinicName || profile?.clinicAddress || profile?.city ? (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      {profile?.clinicName && (
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <Building2 className="w-6 h-6 text-gray-400 mt-0.5" />
                          <div>
                            <p className="font-bold text-gray-900 text-lg">{profile.clinicName}</p>
                            <p className="text-gray-500 text-sm">Nombre del consultorio</p>
                          </div>
                        </div>
                      )}

                      {profile?.clinicAddress && (
                        <div className="flex items-start gap-4 p-4 bg-gray-50 rounded-xl">
                          <MapPin className="w-6 h-6 text-red-500 mt-0.5" />
                          <div>
                            <p className="font-medium text-gray-900">{profile.clinicAddress}</p>
                            <p className="text-gray-600">{profile.city}{profile.state && `, ${profile.state}`}</p>
                          </div>
                        </div>
                      )}

                      {profile?.phoneNumber && (
                        <div className="flex items-center gap-4 p-4 bg-teal-50 rounded-xl">
                          <Phone className="w-6 h-6 text-teal-600" />
                          <div>
                            <p className="font-medium text-teal-800">{profile.phoneNumber}</p>
                            <p className="text-teal-600 text-sm">Teléfono</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="h-64 lg:h-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                      {profile?.officeLatitude && profile?.officeLongitude ? (
                        <div className="text-center text-gray-600">
                          <MapPin className="w-12 h-12 mx-auto mb-3 text-teal-500" />
                          <p className="font-medium">Ubicación GPS guardada</p>
                          <p className="text-sm text-gray-400 mt-1">
                            {profile.officeLatitude.toFixed(4)}, {profile.officeLongitude.toFixed(4)}
                          </p>
                        </div>
                      ) : (
                        <div className="text-center text-gray-400">
                          <MapPin className="w-12 h-12 mx-auto mb-3" />
                          <p>Ubicación GPS no configurada</p>
                          <button
                            onClick={() => setEditingSection('location')}
                            className="mt-2 text-teal-600 hover:underline text-sm"
                          >
                            + Agregar ubicación
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">Agrega la ubicación de tu consultorio</h3>
                    <p className="text-gray-500 max-w-md mx-auto mb-6">
                      Los pacientes podrán encontrarte más fácilmente si agregas tu dirección y ubicación GPS.
                    </p>
                    <button
                      onClick={() => setEditingSection('location')}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 text-white rounded-xl font-medium"
                    >
                      <MapPin className="w-5 h-5" />
                      Agregar Ubicación
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </motion.div>
      </div>

      {/* Modales de edición */}
      <EditModal
        isOpen={editingSection === 'basic'}
        onClose={() => setEditingSection(null)}
        title="Información Profesional"
        saving={saving}
      >
        <BasicInfoEditor profile={profile} onSave={handleSaveBasicInfo} saving={saving} />
      </EditModal>

      <EditModal
        isOpen={editingSection === 'location'}
        onClose={() => setEditingSection(null)}
        title="Ubicación y Contacto"
        saving={saving}
      >
        <LocationEditor profile={profile} onSave={handleSaveLocation} saving={saving} />
      </EditModal>

      <EditModal
        isOpen={editingSection === 'education'}
        onClose={() => setEditingSection(null)}
        title="Formación Académica"
        saving={saving}
      >
        <EducationEditor
          education={profile?.education || []}
          onAdd={addEducation}
          onUpdate={updateEducation}
          onDelete={deleteEducation}
          saving={saving}
        />
      </EditModal>

      <EditModal
        isOpen={editingSection === 'experience'}
        onClose={() => setEditingSection(null)}
        title="Experiencia Profesional"
        saving={saving}
      >
        <ExperienceEditor
          experience={profile?.experience || []}
          onAdd={addExperience}
          onUpdate={updateExperience}
          onDelete={deleteExperience}
          saving={saving}
        />
      </EditModal>

      <EditModal
        isOpen={editingSection === 'specialties'}
        onClose={() => setEditingSection(null)}
        title="Especialidades Médicas"
        saving={saving}
      >
        <SpecialtiesEditor
          specialties={specialties || []}
          onAdd={addSpecialty}
          onRemove={removeSpecialty}
          saving={saving}
        />
      </EditModal>
    </div>
  );
};

export default DoctorProfileEditPage;

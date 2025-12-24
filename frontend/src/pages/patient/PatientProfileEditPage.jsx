/**
 * PatientProfileEditPage - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Página de edición del perfil del paciente con 4 tabs
 */

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Heart,
  AlertTriangle,
  Pill,
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  AlertCircle,
  Loader
} from 'lucide-react';
import usePatientProfile from '../../hooks/usePatientProfile';
import patientService from '../../services/patientService';
import toast from 'react-hot-toast';

// Componente para manejar iconos con loading (evita error de React 19 con lucide-react)
const ButtonIcon = ({ loading, LoadingIcon = Loader, DefaultIcon, className = "w-4 h-4" }) => {
  if (loading) {
    return <LoadingIcon className={`${className} animate-spin`} />;
  }
  return <DefaultIcon className={className} />;
};

// Componente de Input
const FormInput = ({ label, name, value, onChange, type = 'text', required = false, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      type={type}
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      {...props}
    />
  </div>
);

// Componente de Select
const FormSelect = ({ label, name, value, onChange, options, required = false }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <select
      name={name}
      value={value || ''}
      onChange={onChange}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
    >
      <option value="">Seleccionar...</option>
      {options.map(opt => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

// Componente de Textarea
const FormTextarea = ({ label, name, value, onChange, rows = 3, ...props }) => (
  <div>
    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <textarea
      name={name}
      value={value || ''}
      onChange={onChange}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
      {...props}
    />
  </div>
);

// Modal de confirmación
const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-xl p-6 max-w-md w-full"
          onClick={e => e.stopPropagation()}
        >
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
          <p className="text-gray-600 mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

// Tab de Información Personal
const PersonalInfoTab = ({ profile, onUpdate, saving }) => {
  const [formData, setFormData] = useState({
    bloodType: profile?.bloodType || '',
    height: profile?.height || '',
    weight: profile?.weight || '',
    smokingStatus: profile?.smokingStatus || '',
    alcoholConsumption: profile?.alcoholConsumption || '',
    exerciseFrequency: profile?.exerciseFrequency || '',
    notes: profile?.notes || ''
  });

  const [emergencyContact, setEmergencyContact] = useState({
    name: profile?.emergencyContactName || '',
    phone: profile?.emergencyContactPhone || '',
    relationship: profile?.emergencyContactRelationship || ''
  });

  const [insurance, setInsurance] = useState({
    company: profile?.insuranceProvider || '',
    policyNumber: profile?.insurancePolicyNumber || '',
    validUntil: profile?.insuranceExpiryDate || '',
    type: profile?.insuranceType || ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleEmergencyChange = (e) => {
    const { name, value } = e.target;
    setEmergencyContact(prev => ({ ...prev, [name]: value }));
  };

  const handleInsuranceChange = (e) => {
    const { name, value } = e.target;
    setInsurance(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveBasic = () => onUpdate('basic', formData);
  const handleSaveEmergency = () => onUpdate('emergency', emergencyContact);
  const handleSaveInsurance = () => onUpdate('insurance', insurance);

  const bloodTypes = [
    { value: 'A+', label: 'A+' },
    { value: 'A-', label: 'A-' },
    { value: 'B+', label: 'B+' },
    { value: 'B-', label: 'B-' },
    { value: 'AB+', label: 'AB+' },
    { value: 'AB-', label: 'AB-' },
    { value: 'O+', label: 'O+' },
    { value: 'O-', label: 'O-' },
    { value: 'unknown', label: 'No sé' }
  ];

  const smokingOptions = [
    { value: 'never', label: 'Nunca he fumado' },
    { value: 'former', label: 'Ex-fumador' },
    { value: 'current', label: 'Fumador activo' },
    { value: 'unknown', label: 'Prefiero no decir' }
  ];

  const alcoholOptions = [
    { value: 'never', label: 'No consumo' },
    { value: 'occasional', label: 'Ocasional' },
    { value: 'moderate', label: 'Moderado' },
    { value: 'heavy', label: 'Frecuente' },
    { value: 'unknown', label: 'Prefiero no decir' }
  ];

  const exerciseOptions = [
    { value: 'sedentary', label: 'Sedentario' },
    { value: 'light', label: 'Ligero (1-2 días/semana)' },
    { value: 'moderate', label: 'Moderado (3-4 días/semana)' },
    { value: 'active', label: 'Activo (5-6 días/semana)' },
    { value: 'very_active', label: 'Muy activo (diario)' },
    { value: 'unknown', label: 'Prefiero no decir' }
  ];

  return (
    <div className="space-y-8">
      {/* Datos físicos */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Datos Físicos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormSelect
            label="Tipo de sangre"
            name="bloodType"
            value={formData.bloodType}
            onChange={handleChange}
            options={bloodTypes}
          />
          <FormInput
            label="Altura (cm)"
            name="height"
            type="number"
            value={formData.height}
            onChange={handleChange}
            min="50"
            max="250"
            step="1"
          />
          <FormInput
            label="Peso (kg)"
            name="weight"
            type="number"
            value={formData.weight}
            onChange={handleChange}
            min="2"
            max="300"
            step="0.1"
          />
        </div>
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Estilo de vida</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormSelect
              label="Tabaco"
              name="smokingStatus"
              value={formData.smokingStatus}
              onChange={handleChange}
              options={smokingOptions}
            />
            <FormSelect
              label="Alcohol"
              name="alcoholConsumption"
              value={formData.alcoholConsumption}
              onChange={handleChange}
              options={alcoholOptions}
            />
            <FormSelect
              label="Ejercicio"
              name="exerciseFrequency"
              value={formData.exerciseFrequency}
              onChange={handleChange}
              options={exerciseOptions}
            />
          </div>
        </div>
        <div className="mt-4">
          <FormTextarea
            label="Notas adicionales"
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            placeholder="Información adicional relevante..."
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveBasic}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <ButtonIcon loading={saving} DefaultIcon={Save} />
            Guardar
          </button>
        </div>
      </div>

      {/* Contacto de emergencia */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Contacto de Emergencia</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormInput
            label="Nombre completo"
            name="name"
            value={emergencyContact.name}
            onChange={handleEmergencyChange}
            required
          />
          <FormInput
            label="Teléfono"
            name="phone"
            value={emergencyContact.phone}
            onChange={handleEmergencyChange}
            required
          />
          <FormInput
            label="Relación"
            name="relationship"
            value={emergencyContact.relationship}
            onChange={handleEmergencyChange}
            placeholder="Ej: Esposo/a, Madre, Hermano/a"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveEmergency}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <ButtonIcon loading={saving} DefaultIcon={Save} />
            Guardar
          </button>
        </div>
      </div>

      {/* Seguro médico */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Seguro Médico</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <FormInput
            label="Aseguradora"
            name="company"
            value={insurance.company}
            onChange={handleInsuranceChange}
          />
          <FormInput
            label="Número de póliza"
            name="policyNumber"
            value={insurance.policyNumber}
            onChange={handleInsuranceChange}
          />
          <FormInput
            label="Válido hasta"
            name="validUntil"
            type="date"
            value={insurance.validUntil}
            onChange={handleInsuranceChange}
          />
          <FormInput
            label="Tipo de plan"
            name="type"
            value={insurance.type}
            onChange={handleInsuranceChange}
            placeholder="Ej: Premium, Básico"
          />
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveInsurance}
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
          >
            <ButtonIcon loading={saving} DefaultIcon={Save} />
            Guardar
          </button>
        </div>
      </div>
    </div>
  );
};

// Tab de Historial Médico
const MedicalHistoryTab = ({ medicalHistory, onAdd, onUpdate, onDelete, saving }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    condition: '',
    diagnosedDate: '',
    status: 'active',
    severity: '',
    diagnosedBy: '',
    notes: ''
  });

  const statusOptions = [
    { value: 'active', label: 'Activa' },
    { value: 'resolved', label: 'Resuelta' },
    { value: 'chronic', label: 'Crónica' }
  ];

  const severityOptions = [
    { value: 'mild', label: 'Leve' },
    { value: 'moderate', label: 'Moderada' },
    { value: 'severe', label: 'Severa' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.condition) {
      toast.error('El nombre de la condición es requerido');
      return;
    }
    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData({
      condition: item.condition,
      diagnosedDate: item.diagnosedDate || '',
      status: item.status || 'active',
      severity: item.severity || '',
      diagnosedBy: item.diagnosedBy || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setFormData({
      condition: '',
      diagnosedDate: '',
      status: 'active',
      severity: '',
      diagnosedBy: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Historial Médico</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Agregar Condición
        </button>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">
                {editingId ? 'Editar Condición' : 'Nueva Condición Médica'}
              </h4>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                label="Condición"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                required
                placeholder="Ej: Diabetes tipo 2"
              />
              <FormInput
                label="Fecha de diagnóstico"
                name="diagnosedDate"
                type="date"
                value={formData.diagnosedDate}
                onChange={handleChange}
              />
              <FormSelect
                label="Estado"
                name="status"
                value={formData.status}
                onChange={handleChange}
                options={statusOptions}
              />
              <FormSelect
                label="Severidad"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                options={severityOptions}
              />
              <FormInput
                label="Diagnosticado por"
                name="diagnosedBy"
                value={formData.diagnosedBy}
                onChange={handleChange}
                placeholder="Nombre del médico"
              />
            </div>
            <div className="mt-4">
              <FormTextarea
                label="Notas"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
              />
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                <ButtonIcon loading={saving} DefaultIcon={Check} />
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de condiciones */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {medicalHistory.length > 0 ? (
          <div className="space-y-4">
            {medicalHistory.map(item => (
              <div key={item.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.condition}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.status === 'chronic' ? 'bg-orange-100 text-orange-800' :
                      item.status === 'resolved' ? 'bg-green-100 text-green-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {patientService.formatConditionStatus(item.status)}
                    </span>
                    {item.severity && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        item.severity === 'severe' ? 'bg-red-100 text-red-800' :
                        item.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {item.severity}
                      </span>
                    )}
                  </div>
                  {item.diagnosedDate && (
                    <p className="text-sm text-gray-500 mt-1">
                      Diagnosticado: {patientService.formatDate(item.diagnosedDate)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay condiciones médicas registradas
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar condición médica"
        message="¿Estás seguro de que deseas eliminar esta condición de tu historial médico?"
      />
    </div>
  );
};

// Tab de Alergias
const AllergiesTab = ({ allergies, onAdd, onUpdate, onDelete, saving }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [formData, setFormData] = useState({
    allergyType: 'medication',
    allergen: '',
    severity: 'mild',
    reaction: '',
    diagnosedDate: '',
    notes: ''
  });

  const typeOptions = [
    { value: 'medication', label: 'Medicamento' },
    { value: 'food', label: 'Alimento' },
    { value: 'environmental', label: 'Ambiental' },
    { value: 'other', label: 'Otro' }
  ];

  const severityOptions = [
    { value: 'mild', label: 'Leve' },
    { value: 'moderate', label: 'Moderada' },
    { value: 'severe', label: 'Severa' },
    { value: 'life_threatening', label: 'Riesgo vital' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.allergen) {
      toast.error('El alérgeno es requerido');
      return;
    }
    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData({
      allergyType: item.allergyType,
      allergen: item.allergen,
      severity: item.severity,
      reaction: item.reaction || '',
      diagnosedDate: item.diagnosedDate || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  const resetForm = () => {
    setFormData({
      allergyType: 'medication',
      allergen: '',
      severity: 'mild',
      reaction: '',
      diagnosedDate: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Alergias</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Agregar Alergia
        </button>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">
                {editingId ? 'Editar Alergia' : 'Nueva Alergia'}
              </h4>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormSelect
                label="Tipo de alergia"
                name="allergyType"
                value={formData.allergyType}
                onChange={handleChange}
                options={typeOptions}
                required
              />
              <FormInput
                label="Alérgeno"
                name="allergen"
                value={formData.allergen}
                onChange={handleChange}
                required
                placeholder="Ej: Penicilina, Maní"
              />
              <FormSelect
                label="Severidad"
                name="severity"
                value={formData.severity}
                onChange={handleChange}
                options={severityOptions}
                required
              />
              <div className="md:col-span-2 lg:col-span-3">
                <FormTextarea
                  label="Descripción de la reacción"
                  name="reaction"
                  value={formData.reaction}
                  onChange={handleChange}
                  placeholder="Describe cómo reaccionas a este alérgeno..."
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                <ButtonIcon loading={saving} DefaultIcon={Check} />
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Lista de alergias */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        {allergies.length > 0 ? (
          <div className="space-y-4">
            {allergies.map(item => (
              <div key={item.id} className={`flex items-start justify-between p-4 rounded-lg border-l-4 ${
                item.severity === 'life_threatening' ? 'border-purple-500 bg-purple-50' :
                item.severity === 'severe' ? 'border-red-500 bg-red-50' :
                item.severity === 'moderate' ? 'border-orange-500 bg-orange-50' :
                'border-yellow-500 bg-yellow-50'
              }`}>
                <div>
                  <h4 className="font-semibold text-gray-900">{item.allergen}</h4>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700">
                      {patientService.formatAllergyType(item.allergyType)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      item.severity === 'life_threatening' ? 'bg-purple-100 text-purple-800' :
                      item.severity === 'severe' ? 'bg-red-100 text-red-800' :
                      item.severity === 'moderate' ? 'bg-orange-100 text-orange-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {patientService.formatAllergySeverity(item.severity)}
                    </span>
                  </div>
                  {item.reaction && (
                    <p className="text-sm text-gray-600 mt-2">{item.reaction}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-white rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">
            No hay alergias registradas
          </p>
        )}
      </div>

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar alergia"
        message="¿Estás seguro de que deseas eliminar esta alergia de tu perfil?"
      />
    </div>
  );
};

// Tab de Medicamentos
const MedicationsTab = ({ medications, onAdd, onUpdate, onDelete, onStop, saving }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [stopConfirm, setStopConfirm] = useState(null);
  const [formData, setFormData] = useState({
    medicationName: '',
    dosage: '',
    frequency: '',
    route: '',
    startDate: '',
    endDate: '',
    prescribedBy: '',
    reason: '',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.medicationName || !formData.dosage || !formData.frequency || !formData.startDate) {
      toast.error('Nombre, dosis, frecuencia y fecha de inicio son requeridos');
      return;
    }
    if (editingId) {
      await onUpdate(editingId, formData);
    } else {
      await onAdd(formData);
    }
    resetForm();
  };

  const handleEdit = (item) => {
    setFormData({
      medicationName: item.medicationName,
      dosage: item.dosage,
      frequency: item.frequency,
      route: item.route || '',
      startDate: item.startDate,
      endDate: item.endDate || '',
      prescribedBy: item.prescribedBy || '',
      reason: item.reason || '',
      notes: item.notes || ''
    });
    setEditingId(item.id);
    setShowForm(true);
  };

  const handleDelete = async () => {
    await onDelete(deleteConfirm);
    setDeleteConfirm(null);
  };

  const handleStop = async () => {
    await onStop(stopConfirm);
    setStopConfirm(null);
  };

  const resetForm = () => {
    setFormData({
      medicationName: '',
      dosage: '',
      frequency: '',
      route: '',
      startDate: '',
      endDate: '',
      prescribedBy: '',
      reason: '',
      notes: ''
    });
    setEditingId(null);
    setShowForm(false);
  };

  const activeMeds = medications.filter(m => m.isActive);
  const inactiveMeds = medications.filter(m => !m.isActive);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Medicamentos</h3>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
        >
          <Plus className="w-4 h-4" />
          Agregar Medicamento
        </button>
      </div>

      {/* Formulario */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white rounded-xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-semibold text-gray-900">
                {editingId ? 'Editar Medicamento' : 'Nuevo Medicamento'}
              </h4>
              <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <FormInput
                label="Nombre del medicamento"
                name="medicationName"
                value={formData.medicationName}
                onChange={handleChange}
                required
                placeholder="Ej: Metformina"
              />
              <FormInput
                label="Dosis"
                name="dosage"
                value={formData.dosage}
                onChange={handleChange}
                required
                placeholder="Ej: 500mg"
              />
              <FormInput
                label="Frecuencia"
                name="frequency"
                value={formData.frequency}
                onChange={handleChange}
                required
                placeholder="Ej: Cada 8 horas"
              />
              <FormInput
                label="Vía de administración"
                name="route"
                value={formData.route}
                onChange={handleChange}
                placeholder="Ej: Oral, IV, Tópica"
              />
              <FormInput
                label="Fecha de inicio"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                required
              />
              <FormInput
                label="Fecha de fin (si aplica)"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
              <FormInput
                label="Prescrito por"
                name="prescribedBy"
                value={formData.prescribedBy}
                onChange={handleChange}
                placeholder="Nombre del médico"
              />
              <div className="md:col-span-2">
                <FormInput
                  label="Razón de la prescripción"
                  name="reason"
                  value={formData.reason}
                  onChange={handleChange}
                  placeholder="Para qué se toma este medicamento"
                />
              </div>
            </div>
            <div className="mt-4 flex gap-3 justify-end">
              <button onClick={resetForm} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50"
              >
                <ButtonIcon loading={saving} DefaultIcon={Check} />
                {editingId ? 'Actualizar' : 'Agregar'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Medicamentos activos */}
      <div className="bg-white rounded-xl p-6 shadow-sm">
        <h4 className="font-semibold text-gray-900 mb-4">Medicamentos Activos ({activeMeds.length})</h4>
        {activeMeds.length > 0 ? (
          <div className="space-y-4">
            {activeMeds.map(item => (
              <div key={item.id} className="flex items-start justify-between p-4 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-900">{item.medicationName}</h4>
                  <p className="text-sm text-gray-600">{item.dosage} - {item.frequency}</p>
                  {item.route && <p className="text-xs text-gray-500">Vía: {item.route}</p>}
                  <p className="text-xs text-gray-500 mt-1">
                    Desde: {patientService.formatDate(item.startDate)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(item)}
                    className="p-2 text-gray-400 hover:text-teal-600 hover:bg-teal-50 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setStopConfirm(item.id)}
                    className="p-2 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg"
                    title="Suspender"
                  >
                    <AlertCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(item.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-4">
            No hay medicamentos activos
          </p>
        )}
      </div>

      {/* Medicamentos suspendidos */}
      {inactiveMeds.length > 0 && (
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h4 className="font-semibold text-gray-500 mb-4">Medicamentos Suspendidos ({inactiveMeds.length})</h4>
          <div className="space-y-4">
            {inactiveMeds.map(item => (
              <div key={item.id} className="flex items-start justify-between p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div>
                  <h4 className="font-semibold text-gray-500">{item.medicationName}</h4>
                  <p className="text-sm text-gray-400">{item.dosage} - {item.frequency}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {patientService.formatDate(item.startDate)} - {patientService.formatDate(item.endDate)}
                  </p>
                </div>
                <button
                  onClick={() => setDeleteConfirm(item.id)}
                  className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm !== null}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={handleDelete}
        title="Eliminar medicamento"
        message="¿Estás seguro de que deseas eliminar este medicamento?"
      />

      <ConfirmModal
        isOpen={stopConfirm !== null}
        onClose={() => setStopConfirm(null)}
        onConfirm={handleStop}
        title="Suspender medicamento"
        message="¿Deseas marcar este medicamento como suspendido? Se registrará la fecha de hoy como fecha de fin."
      />
    </div>
  );
};

// Componente principal
const PatientProfileEditPage = () => {
  const navigate = useNavigate();
  const {
    profile,
    loading,
    error,
    saving,
    medicalHistory,
    allergies,
    medications,
    updateBasicInfo,
    updateEmergencyContact,
    updateInsurance,
    addMedicalHistory,
    updateMedicalHistory: updateHistory,
    deleteMedicalHistory: deleteHistory,
    addAllergy,
    updateAllergy,
    deleteAllergy,
    addMedication,
    updateMedication,
    deleteMedication,
    stopMedication
  } = usePatientProfile({ autoFetch: true });

  const [activeTab, setActiveTab] = useState('info');

  const handleUpdateSection = async (section, data) => {
    switch (section) {
      case 'basic':
        await updateBasicInfo(data);
        break;
      case 'emergency':
        await updateEmergencyContact(data);
        break;
      case 'insurance':
        await updateInsurance(data);
        break;
    }
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
          <p className="text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'info', label: 'Información Personal', icon: User },
    { id: 'history', label: 'Historial Médico', icon: Heart },
    { id: 'allergies', label: 'Alergias', icon: AlertTriangle },
    { id: 'medications', label: 'Medicamentos', icon: Pill }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/paciente/perfil"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg"
                title="Volver al perfil"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-xl font-bold text-gray-900">Editar Perfil de Salud</h1>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4">
          <nav className="flex gap-1 overflow-x-auto">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-3 font-medium border-b-2 transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-teal-500 text-teal-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Contenido */}
      <div className="max-w-5xl mx-auto px-4 py-8">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'info' && (
            <PersonalInfoTab
              profile={profile}
              onUpdate={handleUpdateSection}
              saving={saving}
            />
          )}

          {activeTab === 'history' && (
            <MedicalHistoryTab
              medicalHistory={medicalHistory}
              onAdd={addMedicalHistory}
              onUpdate={updateHistory}
              onDelete={deleteHistory}
              saving={saving}
            />
          )}

          {activeTab === 'allergies' && (
            <AllergiesTab
              allergies={allergies}
              onAdd={addAllergy}
              onUpdate={updateAllergy}
              onDelete={deleteAllergy}
              saving={saving}
            />
          )}

          {activeTab === 'medications' && (
            <MedicationsTab
              medications={medications}
              onAdd={addMedication}
              onUpdate={updateMedication}
              onDelete={deleteMedication}
              onStop={stopMedication}
              saving={saving}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default PatientProfileEditPage;

/**
 * PatientStep4Confirmation - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 4: Confirmación
 * - Resumen de todos los datos ingresados
 * - Checkbox de confirmación
 * - Botón de envío final
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, User, CreditCard, Calendar, Phone, Heart, Droplet,
  AlertTriangle, Check, Edit2, Loader2, AlertCircle
} from 'lucide-react';

const GENDER_LABELS = {
  male: 'Masculino',
  female: 'Femenino',
  other: 'Otro',
  prefer_not_to_say: 'Prefiero no decir'
};

const RELATION_LABELS = {
  spouse: 'Esposo/a',
  parent: 'Padre/Madre',
  child: 'Hijo/a',
  sibling: 'Hermano/a',
  friend: 'Amigo/a',
  other: 'Otro'
};

/**
 * Componente para mostrar un campo de resumen
 */
function SummaryField({ icon: Icon, label, value, iconColor = 'text-gray-400' }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3">
      <Icon className={`h-5 w-5 ${iconColor} mt-0.5 flex-shrink-0`} />
      <div>
        <p className="text-sm text-gray-500">{label}</p>
        <p className="text-gray-800 font-medium">{value}</p>
      </div>
    </div>
  );
}

/**
 * Componente Paso 4: Confirmación
 */
function PatientStep4Confirmation({
  formData,
  updateField,
  errors,
  setFieldErrors,
  onPrev,
  onSubmit,
  isSubmitting,
  goToStep
}) {
  const [confirmInfo, setConfirmInfo] = useState(false);

  // Formatear fecha (evita problema de timezone)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    // Agregar T00:00:00 para evitar conversión UTC
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-VE', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  // Formatear teléfono
  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{4})(\d{7})/, '$1-$2');
  };

  // Validar y enviar
  const handleSubmit = async () => {
    if (!confirmInfo) {
      setFieldErrors({ confirmInfo: 'Debe confirmar que la información es correcta' });
      return;
    }

    setFieldErrors({});
    await onSubmit();
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Confirma tus datos</h2>
        <p className="text-gray-600 mt-2">
          Revisa que toda la información sea correcta
        </p>
      </div>

      {/* Sección: Credenciales */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Credenciales</h3>
          <button
            type="button"
            onClick={() => goToStep(1)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
        </div>
        <div className="p-4 space-y-4">
          <SummaryField
            icon={Mail}
            label="Correo electrónico"
            value={formData.email}
            iconColor="text-blue-500"
          />
        </div>
      </div>

      {/* Sección: Datos personales */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Datos personales</h3>
          <button
            type="button"
            onClick={() => goToStep(2)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryField
            icon={User}
            label="Nombre completo"
            value={`${formData.firstName || ''} ${formData.lastName || ''}`}
          />
          <SummaryField
            icon={CreditCard}
            label="Cédula de identidad"
            value={formData.identificationNumber}
          />
          <SummaryField
            icon={Calendar}
            label="Fecha de nacimiento"
            value={formatDate(formData.dateOfBirth)}
          />
          <SummaryField
            icon={User}
            label="Género"
            value={GENDER_LABELS[formData.gender]}
          />
          <SummaryField
            icon={Phone}
            label="Teléfono"
            value={formatPhone(formData.phone)}
            iconColor="text-green-500"
          />
        </div>
      </div>

      {/* Sección: Información médica */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Información médica</h3>
          <button
            type="button"
            onClick={() => goToStep(3)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm"
          >
            <Edit2 className="h-4 w-4" />
            Editar
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <SummaryField
              icon={Droplet}
              label="Tipo de sangre"
              value={formData.bloodType === 'unknown' ? 'No sé' : formData.bloodType}
              iconColor="text-red-500"
            />
            {formData.allergies && (
              <SummaryField
                icon={AlertTriangle}
                label="Alergias"
                value={formData.allergies}
                iconColor="text-orange-500"
              />
            )}
            {formData.chronicConditions && (
              <SummaryField
                icon={Heart}
                label="Condiciones crónicas"
                value={formData.chronicConditions}
                iconColor="text-red-500"
              />
            )}
          </div>

          {/* Contacto de emergencia */}
          <div className="mt-4 pt-4 border-t">
            <h4 className="text-sm font-medium text-gray-600 mb-3">Contacto de emergencia</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <SummaryField
                icon={User}
                label="Nombre"
                value={formData.emergencyContactName}
              />
              <SummaryField
                icon={Phone}
                label="Teléfono"
                value={formatPhone(formData.emergencyContactPhone)}
                iconColor="text-green-500"
              />
              {formData.emergencyContactRelation && (
                <SummaryField
                  icon={User}
                  label="Relación"
                  value={RELATION_LABELS[formData.emergencyContactRelation] || formData.emergencyContactRelation}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmación */}
      <div className="bg-primary/5 p-4 rounded-lg border border-primary/20">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmInfo}
            onChange={(e) => {
              setConfirmInfo(e.target.checked);
              if (e.target.checked) {
                setFieldErrors({});
              }
            }}
            className="mt-1 h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            Confirmo que toda la información proporcionada es correcta y verdadera.
            Entiendo que esta información será utilizada para mi atención médica y
            que puedo actualizarla en cualquier momento desde mi perfil.
          </span>
        </label>
        {errors.confirmInfo && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" />
            {errors.confirmInfo}
          </p>
        )}
      </div>

      {/* Error general de envío */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            {errors.submit}
          </p>
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="pt-4 flex gap-4">
        <button
          type="button"
          onClick={onPrev}
          disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-200
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200"
        >
          Anterior
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isSubmitting || !confirmInfo}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors duration-200 flex items-center justify-center gap-2"
        >
          {isSubmitting && <Loader2 className="h-5 w-5 animate-spin" />}
          {!isSubmitting && <Check className="h-5 w-5" />}
          <span>{isSubmitting ? 'Registrando...' : 'Completar registro'}</span>
        </button>
      </div>
    </motion.div>
  );
}

export default PatientStep4Confirmation;

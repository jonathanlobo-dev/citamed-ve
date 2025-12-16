/**
 * DoctorStep6Confirmation - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Paso 6: Confirmación
 * - Resumen de todos los datos
 * - Checkbox de confirmación
 * - Envío final
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mail, User, CreditCard, Calendar, Phone, Award, GraduationCap,
  Building, MapPin, Clock, DollarSign, Shield, Check, Edit2,
  Loader2, AlertCircle
} from 'lucide-react';

const GENDER_LABELS = {
  male: 'Masculino', female: 'Femenino', other: 'Otro', prefer_not_to_say: 'Prefiero no decir'
};

const WEEKDAY_LABELS = {
  monday: 'Lunes', tuesday: 'Martes', wednesday: 'Miércoles', thursday: 'Jueves',
  friday: 'Viernes', saturday: 'Sábado', sunday: 'Domingo'
};

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

function DoctorStep6Confirmation({
  formData,
  errors,
  setFieldErrors,
  onPrev,
  onSubmit,
  isSubmitting,
  goToStep,
  specialties = []
}) {
  const [confirmInfo, setConfirmInfo] = useState(false);

  // Formatear fecha (evita problema de timezone)
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  const formatPhone = (phone) => {
    if (!phone) return '';
    return phone.replace(/(\d{4})(\d{7})/, '$1-$2');
  };

  const formatDays = (days) => {
    if (!days || days.length === 0) return '';
    return days.map(d => WEEKDAY_LABELS[d] || d).join(', ');
  };

  const getSpecialtyName = () => {
    const spec = specialties.find(s => s.id === parseInt(formData.specialtyId));
    return spec?.name || formData.specialtyId;
  };

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
        <p className="text-gray-600 mt-2">Revisa que toda la información sea correcta</p>
      </div>

      {/* Sección: Credenciales */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Credenciales</h3>
          <button type="button" onClick={() => goToStep(1)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4">
          <SummaryField icon={Mail} label="Correo electrónico" value={formData.email} iconColor="text-blue-500" />
        </div>
      </div>

      {/* Sección: Datos personales */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Datos personales</h3>
          <button type="button" onClick={() => goToStep(2)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryField icon={User} label="Nombre completo" value={`${formData.firstName || ''} ${formData.lastName || ''}`} />
          <SummaryField icon={CreditCard} label="Cédula" value={formData.identificationNumber} />
          <SummaryField icon={Calendar} label="Fecha de nacimiento" value={formatDate(formData.dateOfBirth)} />
          <SummaryField icon={User} label="Género" value={GENDER_LABELS[formData.gender]} />
          <SummaryField icon={Phone} label="Teléfono" value={formatPhone(formData.phone)} iconColor="text-green-500" />
        </div>
      </div>

      {/* Sección: Información profesional */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Información profesional</h3>
          <button type="button" onClick={() => goToStep(3)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <SummaryField icon={Award} label="Número MPPS" value={formData.mppsNumber} iconColor="text-teal-500" />
          <SummaryField icon={GraduationCap} label="Especialidad" value={getSpecialtyName()} iconColor="text-purple-500" />
          <SummaryField icon={Building} label="Universidad" value={formData.university} />
          <SummaryField icon={Calendar} label="Año graduación" value={formData.graduationYear} />
          {formData.subspecialties && (
            <div className="md:col-span-2">
              <SummaryField icon={GraduationCap} label="Subespecialidades" value={formData.subspecialties} />
            </div>
          )}
        </div>
      </div>

      {/* Sección: Ubicación y horarios */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Ubicación y horarios</h3>
          <button type="button" onClick={() => goToStep(4)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 space-y-4">
          <SummaryField icon={MapPin} label="Dirección" value={formData.consultationAddress} iconColor="text-red-500" />
          <div className="grid grid-cols-2 gap-4">
            <SummaryField icon={Building} label="Ciudad" value={formData.city} />
            <SummaryField icon={MapPin} label="Estado" value={formData.state} />
          </div>
          <SummaryField icon={Calendar} label="Días de atención" value={formatDays(formData.availableDays)} iconColor="text-blue-500" />
          <SummaryField icon={Clock} label="Horario" value={formData.startTime && formData.endTime ? `${formData.startTime} - ${formData.endTime}` : ''} iconColor="text-orange-500" />
          {formData.acceptsHomeVisits && (
            <p className="text-sm text-green-600 flex items-center gap-2">
              <Check className="h-4 w-4" /> Ofrece visitas a domicilio
            </p>
          )}
        </div>
      </div>

      {/* Sección: Tarifas */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-700">Tarifas y servicios</h3>
          <button type="button" onClick={() => goToStep(5)}
            className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm">
            <Edit2 className="h-4 w-4" /> Editar
          </button>
        </div>
        <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryField icon={DollarSign} label="Consulta" value={formData.priceConsultation ? `$${formData.priceConsultation}` : 'No definido'} iconColor="text-green-500" />
          <SummaryField icon={DollarSign} label="Teleconsulta" value={formData.priceTeleconsultation ? `$${formData.priceTeleconsultation}` : 'No definido'} iconColor="text-blue-500" />
          {formData.acceptsHomeVisits && (
            <SummaryField icon={DollarSign} label="Domicilio" value={formData.priceHomeVisit ? `$${formData.priceHomeVisit}` : 'No definido'} iconColor="text-orange-500" />
          )}
        </div>
        {formData.acceptsInsurance && (
          <div className="px-4 pb-4">
            <SummaryField icon={Shield} label="Seguros aceptados" value={formData.acceptedInsurances || 'Ninguno seleccionado'} iconColor="text-purple-500" />
          </div>
        )}
      </div>

      {/* Confirmación */}
      <div className="bg-teal-50 p-4 rounded-lg border border-teal-200">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={confirmInfo}
            onChange={(e) => {
              setConfirmInfo(e.target.checked);
              if (e.target.checked) setFieldErrors({});
            }}
            className="mt-1 h-5 w-5 text-primary border-gray-300 rounded focus:ring-primary"
          />
          <span className="text-sm text-gray-700">
            Confirmo que toda la información proporcionada es correcta y verdadera.
            Entiendo que mi cuenta quedará en estado de <strong>revisión</strong> hasta que el equipo
            de CITAMED.VE verifique mis credenciales profesionales (MPPS).
          </span>
        </label>
        {errors.confirmInfo && (
          <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
            <AlertCircle className="h-4 w-4" /> {errors.confirmInfo}
          </p>
        )}
      </div>

      {/* Error de envío */}
      {errors.submit && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5" /> {errors.submit}
          </p>
        </div>
      )}

      {/* Navigation */}
      <div className="pt-4 flex gap-4">
        <button type="button" onClick={onPrev} disabled={isSubmitting}
          className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 font-semibold rounded-lg
                     hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          Anterior
        </button>
        <button type="button" onClick={handleSubmit} disabled={isSubmitting || !confirmInfo}
          className="flex-1 py-3 px-4 bg-primary text-white font-semibold rounded-lg
                     hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed
                     transition-colors flex items-center justify-center gap-2">
          {isSubmitting ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Registrando...</>
          ) : (
            <><Check className="h-5 w-5" /> Completar registro</>
          )}
        </button>
      </div>
    </motion.div>
  );
}

export default DoctorStep6Confirmation;

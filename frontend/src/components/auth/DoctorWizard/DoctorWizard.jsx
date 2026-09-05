/**
 * DoctorWizard - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Wizard de registro de médicos en 6 pasos:
 * 1. Credenciales de acceso
 * 2. Datos personales
 * 3. Información profesional
 * 4. Ubicación y horarios
 * 5. Tarifas y servicios
 * 6. Confirmación
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Stethoscope, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useWizard } from '../../../hooks/useWizard';
import StepIndicator from '../StepIndicator';
import DoctorStep1Credentials from './DoctorStep1Credentials';
import DoctorStep2Personal from './DoctorStep2Personal';
import DoctorStep3Professional from './DoctorStep3Professional';
import DoctorStep4Location from './DoctorStep4Location';
import DoctorStep5Pricing from './DoctorStep5Pricing';
import DoctorStep6Confirmation from './DoctorStep6Confirmation';
import authService from '../../../services/authService';
import api from '../../../services/api';

const TOTAL_STEPS = 6;
const STEP_LABELS = [
  'Credenciales',
  'Personal',
  'Profesional',
  'Ubicación',
  'Tarifas',
  'Confirmación'
];

const INITIAL_DATA = {
  // Step 1
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  // Step 2
  firstName: '',
  lastName: '',
  identificationNumber: '',
  dateOfBirth: '',
  gender: '',
  phone: '',
  // Step 3
  mppsNumber: '',
  specialtyId: '',
  university: '',
  graduationYear: '',
  subspecialties: '',
  // Step 4
  consultationAddress: '',
  city: '',
  state: '',
  availableDays: [],
  startTime: '',
  endTime: '',
  acceptsHomeVisits: false,
  // Step 5
  priceConsultation: '',
  priceTeleconsultation: '',
  priceHomeVisit: '',
  acceptsInsurance: false,
  acceptedInsurances: '',
  paymentMethods: ''
};

function DoctorWizard() {
  const navigate = useNavigate();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [specialties, setSpecialties] = useState([]);

  const {
    currentStep,
    totalSteps,
    formData,
    errors,
    isSubmitting,
    nextStep,
    prevStep,
    goToStep,
    updateField,
    setFieldErrors,
    setIsSubmitting,
    clearWizard
  } = useWizard({
    wizardId: 'doctor',
    totalSteps: TOTAL_STEPS,
    initialData: INITIAL_DATA,
    persistData: true
  });

  // Cargar especialidades
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        if (response.data.success) {
          setSpecialties(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      }
    };
    fetchSpecialties();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      const registrationData = {
        // Paso 1
        email: formData.email,
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
        // Paso 2
        firstName: formData.firstName,
        lastName: formData.lastName,
        identificationNumber: formData.identificationNumber,
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        phone: formData.phone,
        // Paso 3
        mppsNumber: formData.mppsNumber,
        specialtyId: parseInt(formData.specialtyId),
        university: formData.university,
        graduationYear: parseInt(formData.graduationYear),
        subspecialties: formData.subspecialties || null,
        // Paso 4
        consultationAddress: formData.consultationAddress,
        city: formData.city,
        state: formData.state,
        availableDays: formData.availableDays,
        startTime: formData.startTime,
        endTime: formData.endTime,
        acceptsHomeVisits: formData.acceptsHomeVisits || false,
        // Paso 5
        priceConsultation: formData.priceConsultation ? parseFloat(formData.priceConsultation) : null,
        priceTeleconsultation: formData.priceTeleconsultation ? parseFloat(formData.priceTeleconsultation) : null,
        priceHomeVisit: formData.priceHomeVisit ? parseFloat(formData.priceHomeVisit) : null,
        acceptsInsurance: formData.acceptsInsurance || false,
        acceptedInsurances: formData.acceptedInsurances || null
      };

      const response = await authService.registerDoctor(registrationData);

      if (response.success) {
        clearWizard();
        setRegistrationSuccess(true);

        // Redirigir después de 4 segundos
        setTimeout(() => {
          navigate('/login', {
            state: {
              message: 'Registro exitoso. Su cuenta está en revisión. Le notificaremos cuando sea aprobada.',
              email: formData.email
            }
          });
        }, 4000);
      }
    } catch (error) {
      console.error('Error en registro:', error);

      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setFieldErrors(serverErrors);
      }

      // Mostrar el detalle de los errores en el paso actual, no solo en el campo de origen
      const detalles = (error.response?.data?.errors || [])
        .map(err => err.message)
        .filter(Boolean)
        .join(' · ');

      setRegistrationError(
        error.response?.data?.message
          ? (detalles ? `${error.response.data.message}: ${detalles}` : error.response.data.message)
          : 'Error al registrar. Por favor intenta nuevamente.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Pantalla de éxito
  if (registrationSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-[400px] flex flex-col items-center justify-center text-center p-8"
      >
        <div className="w-20 h-20 bg-teal-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="w-12 h-12 text-teal-500" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          ¡Registro enviado!
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Su solicitud de registro ha sido recibida. Nuestro equipo verificará
          sus credenciales profesionales.
        </p>
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg">
          <Clock className="w-5 h-5" />
          <span className="text-sm font-medium">Estado: En revisión</span>
        </div>
        <p className="text-sm text-gray-500 mt-4">
          Serás redirigido automáticamente...
        </p>
      </motion.div>
    );
  }

  const renderStep = () => {
    const commonProps = {
      formData,
      updateField,
      errors,
      setFieldErrors
    };

    switch (currentStep) {
      case 1:
        return <DoctorStep1Credentials {...commonProps} onNext={nextStep} />;
      case 2:
        return <DoctorStep2Personal {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 3:
        return <DoctorStep3Professional {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 4:
        return <DoctorStep4Location {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 5:
        return <DoctorStep5Pricing {...commonProps} onNext={nextStep} onPrev={prevStep} />;
      case 6:
        return (
          <DoctorStep6Confirmation
            {...commonProps}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            goToStep={goToStep}
            specialties={specialties}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-teal-100 rounded-full mb-4">
          <Stethoscope className="w-8 h-8 text-teal-600" />
        </div>
        <h1 className="text-3xl font-bold text-gray-800">Registro de Médico</h1>
        <p className="text-gray-600 mt-2">
          Completa tu perfil profesional para atender pacientes
        </p>
      </div>

      {/* Step Indicator */}
      <StepIndicator
        currentStep={currentStep}
        totalSteps={totalSteps}
        stepLabels={STEP_LABELS}
      />

      {/* Error general */}
      {registrationError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <p className="text-red-600 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            {registrationError}
          </p>
        </motion.div>
      )}

      {/* Form Container */}
      <div className="bg-white rounded-xl shadow-lg p-6 md:p-8">
        <AnimatePresence mode="wait">
          {renderStep()}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="text-center mt-6">
        <p className="text-gray-600">
          ¿Ya tienes cuenta?{' '}
          <a href="/login" className="text-primary font-semibold hover:underline">
            Inicia sesión
          </a>
        </p>
      </div>
    </div>
  );
}

export default DoctorWizard;

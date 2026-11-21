/**
 * DoctorWizard - CITAMED.VE
 * Registro corto del médico en 2 pasos:
 * 1. Cuenta: nombre, apellido, teléfono, correo, clave y términos
 * 2. Datos profesionales: MPPS y especialidad
 * Consultorio, horarios, precios, foto y documentos se completan después en el panel
 * (tarjeta "Prepara tu consultorio").
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Stethoscope, AlertCircle, CheckCircle } from 'lucide-react';
import { useWizard } from '../../../hooks/useWizard';
import StepIndicator from '../StepIndicator';
import DoctorStep1Credentials from './DoctorStep1Credentials';
import DoctorStep2Professional from './DoctorStep2Professional';
import authService from '../../../services/authService';
import api from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';

const TOTAL_STEPS = 2;
const STEP_LABELS = ['Tu cuenta', 'Profesional'];

// Si el servidor rechaza un campo, se vuelve al paso donde está
const FIELD_STEP = {
  firstName: 1, lastName: 1, phone: 1, email: 1, password: 1, confirmPassword: 1, acceptTerms: 1,
  mppsNumber: 2, specialtyId: 2
};

const INITIAL_DATA = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  acceptTerms: false,
  mppsNumber: '',
  specialtyId: ''
};

function DoctorWizard() {
  const navigate = useNavigate();
  const { startSession } = useAuth();
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationError, setRegistrationError] = useState(null);
  const [specialties, setSpecialties] = useState(null);

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
    wizardId: 'doctor-corto',
    totalSteps: TOTAL_STEPS,
    initialData: INITIAL_DATA,
    persistData: true
  });

  // Cargar especialidades
  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await api.get('/specialties');
        setSpecialties(response.data.success ? (response.data.data || []) : []);
      } catch (error) {
        console.error('Error cargando especialidades:', error);
        setSpecialties([]);
      }
    };
    fetchSpecialties();
  }, []);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setRegistrationError(null);

    try {
      const registrationData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phone: formData.phone,
        email: formData.email.trim(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        acceptTerms: formData.acceptTerms,
        mppsNumber: formData.mppsNumber.trim(),
        specialtyId: parseInt(formData.specialtyId, 10)
      };

      const response = await authService.registerDoctor(registrationData);

      if (response.success) {
        clearWizard();
        setRegistrationSuccess(true);

        // Abre la sesión y lleva a verificar el correo; la verificación profesional queda en revisión
        if (response.data?.token) {
          const sessionUser = startSession(response.data.token, response.data.user, response.data.profile);
          setTimeout(() => {
            navigate(`/verificar/email?userId=${sessionUser.id}&email=${encodeURIComponent(sessionUser.email)}&returnTo=${encodeURIComponent('/medico/dashboard')}`);
          }, 1500);
        } else {
          setTimeout(() => {
            navigate('/login', {
              state: {
                message: 'Registro exitoso. Su cuenta está en revisión. Le notificaremos cuando sea aprobada.',
                email: formData.email
              }
            });
          }, 4000);
        }
      }
    } catch (error) {
      console.error('Error en registro:', error);

      if (error.response?.data?.errors) {
        const serverErrors = {};
        error.response.data.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setFieldErrors(serverErrors);

        // Llevar al usuario al primer paso que tenga un error, para que lo corrija en contexto
        const errorSteps = Object.keys(serverErrors)
          .map((field) => FIELD_STEP[field])
          .filter(Boolean);
        if (errorSteps.length > 0) {
          goToStep(Math.min(...errorSteps));
        }
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
          ¡Cuenta creada!
        </h2>
        <p className="text-gray-600 mb-4 max-w-md">
          Ahora confirma tu correo con el código que te enviamos.
        </p>
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
        return (
          <DoctorStep2Professional
            {...commonProps}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            specialties={specialties}
          />
        );
      default:
        return <DoctorStep1Credentials {...commonProps} onNext={nextStep} />;
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
          Dos pasos y entras a tu panel
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

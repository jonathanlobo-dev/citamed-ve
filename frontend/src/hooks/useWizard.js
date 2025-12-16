/**
 * useWizard Hook - CITAMED.VE
 * M01.3 Registro Multi-Paso
 *
 * Hook para gestionar el estado del wizard de registro:
 * - Navegación entre pasos
 * - Validación por paso
 * - Guardado en localStorage (recovery)
 * - Estado del formulario
 */

import { useState, useCallback, useEffect } from 'react';

const STORAGE_KEY_PREFIX = 'citamed_wizard_';

/**
 * Hook para gestionar wizards multi-paso
 * @param {Object} config - Configuración del wizard
 * @param {string} config.wizardId - ID único del wizard (patient, doctor, provider)
 * @param {number} config.totalSteps - Número total de pasos
 * @param {Object} config.initialData - Datos iniciales del formulario
 * @param {boolean} config.persistData - Si guardar en localStorage (default: true)
 * @returns {Object} Estado y funciones del wizard
 */
export function useWizard({
  wizardId,
  totalSteps,
  initialData = {},
  persistData = true
}) {
  const storageKey = `${STORAGE_KEY_PREFIX}${wizardId}`;

  // Cargar datos guardados de localStorage
  const loadSavedData = useCallback(() => {
    if (!persistData) return { step: 1, data: initialData };

    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Verificar que los datos no sean muy viejos (24 horas)
        const savedAt = parsed.savedAt || 0;
        const dayInMs = 24 * 60 * 60 * 1000;
        if (Date.now() - savedAt < dayInMs) {
          return {
            step: parsed.step || 1,
            data: { ...initialData, ...parsed.data }
          };
        }
      }
    } catch (error) {
      console.error('Error loading wizard data:', error);
    }
    return { step: 1, data: initialData };
  }, [storageKey, initialData, persistData]);

  const savedState = loadSavedData();
  const [currentStep, setCurrentStep] = useState(savedState.step);
  const [formData, setFormData] = useState(savedState.data);
  const [errors, setErrors] = useState({});
  const [stepCompleted, setStepCompleted] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Guardar en localStorage cuando cambian los datos
  useEffect(() => {
    if (persistData && Object.keys(formData).length > 0) {
      try {
        localStorage.setItem(storageKey, JSON.stringify({
          step: currentStep,
          data: formData,
          savedAt: Date.now()
        }));
      } catch (error) {
        console.error('Error saving wizard data:', error);
      }
    }
  }, [formData, currentStep, storageKey, persistData]);

  /**
   * Actualizar un campo del formulario
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    // Limpiar error del campo
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  }, [errors]);

  /**
   * Actualizar múltiples campos
   */
  const updateFields = useCallback((fields) => {
    setFormData(prev => ({
      ...prev,
      ...fields
    }));
  }, []);

  /**
   * Establecer errores de validación
   */
  const setFieldErrors = useCallback((newErrors) => {
    setErrors(newErrors);
  }, []);

  /**
   * Ir al siguiente paso
   */
  const nextStep = useCallback(() => {
    if (currentStep < totalSteps) {
      setStepCompleted(prev => ({ ...prev, [currentStep]: true }));
      setCurrentStep(prev => prev + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep, totalSteps]);

  /**
   * Ir al paso anterior
   */
  const prevStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [currentStep]);

  /**
   * Ir a un paso específico
   */
  const goToStep = useCallback((step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
      setErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [totalSteps]);

  /**
   * Verificar si un paso está completado
   */
  const isStepCompleted = useCallback((step) => {
    return stepCompleted[step] || false;
  }, [stepCompleted]);

  /**
   * Limpiar datos del wizard
   */
  const clearWizard = useCallback(() => {
    setCurrentStep(1);
    setFormData(initialData);
    setErrors({});
    setStepCompleted({});
    if (persistData) {
      localStorage.removeItem(storageKey);
    }
  }, [initialData, persistData, storageKey]);

  /**
   * Verificar si hay datos guardados
   */
  const hasSavedData = useCallback(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return !!saved;
    } catch {
      return false;
    }
  }, [storageKey]);

  /**
   * Calcular progreso del wizard
   */
  const progress = Math.round((currentStep / totalSteps) * 100);

  /**
   * Verificar si es el primer paso
   */
  const isFirstStep = currentStep === 1;

  /**
   * Verificar si es el último paso
   */
  const isLastStep = currentStep === totalSteps;

  return {
    // Estado
    currentStep,
    totalSteps,
    formData,
    errors,
    isSubmitting,
    progress,
    isFirstStep,
    isLastStep,

    // Funciones de navegación
    nextStep,
    prevStep,
    goToStep,

    // Funciones de datos
    updateField,
    updateFields,
    setFieldErrors,
    setIsSubmitting,

    // Funciones de utilidad
    clearWizard,
    hasSavedData,
    isStepCompleted
  };
}

export default useWizard;

/**
 * IdentifyPatientDrawer.jsx - CITAMED.VE
 * M03 / Semana 7 - Bloque E: Consulta sin cita (Walk-in)
 *
 * SideDrawer para vincular a un paciente a una consulta abierta:
 * - Pestaña "Mis pacientes": Búsqueda en tiempo real sobre el directorio del médico.
 * - Pestaña "Paciente nuevo": Registro rápido (20 segundos) con cédula venezolana,
 *   teléfono, sexo, fecha de nacimiento y motivo de consulta.
 */

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  UserCheck,
  UserPlus,
  Users,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  Phone,
  CreditCard,
  X
} from 'lucide-react';
import SideDrawer from '../common/SideDrawer/SideDrawer';
import clinicalRecordService from '../../services/clinicalRecordService';

export default function IdentifyPatientDrawer({
  open,
  onClose,
  onSelectExistingPatient,
  onCreateNewPatient,
  loading = false,
  errorMessage = ''
}) {
  const [activeTab, setActiveTab] = useState('existing'); // 'existing' | 'new'

  // Estado pestaña "Mis pacientes"
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [patients, setPatients] = useState([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [patientSearchError, setPatientSearchError] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const debounceTimerRef = useRef(null);

  // Estado pestaña "Paciente nuevo"
  const [newPatient, setNewPatient] = useState({
    firstName: '',
    lastName: '',
    identificationType: 'V',
    identificationNumber: '',
    noIdentification: false,
    phone: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    reasonForVisit: 'Consulta sin cita'
  });
  const [formErrors, setFormErrors] = useState({});

  // Debounce para búsqueda de pacientes existentes
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // Cargar pacientes cuando abre el drawer o cambia el debouncedSearch
  useEffect(() => {
    if (!open) return;
    let mounted = true;

    async function fetchPatients() {
      setLoadingPatients(true);
      setPatientSearchError(null);
      try {
        const res = await clinicalRecordService.getDoctorPatients({
          search: debouncedSearch,
          limit: 20
        });
        if (mounted) {
          setPatients(res.data?.patients || []);
        }
      } catch (err) {
        if (mounted) {
          console.error('[IdentifyPatientDrawer] Error buscando pacientes:', err);
          setPatientSearchError('No se pudieron cargar los pacientes');
        }
      } finally {
        if (mounted) setLoadingPatients(false);
      }
    }

    fetchPatients();

    return () => {
      mounted = false;
    };
  }, [open, debouncedSearch]);

  // Limpiar estados al cerrar
  useEffect(() => {
    if (!open) {
      setSelectedPatient(null);
      setSearch('');
      setDebouncedSearch('');
      setFormErrors({});
    }
  }, [open]);

  // Manejar selección de paciente existente
  const handleConfirmExisting = (patientToSelect) => {
    const p = patientToSelect || selectedPatient;
    if (!p) return;
    onSelectExistingPatient(p);
  };

  // Manejar envío de paciente nuevo
  const handleSubmitNewPatient = (e) => {
    e.preventDefault();
    const errors = {};

    if (!newPatient.firstName.trim()) {
      errors.firstName = 'El nombre es obligatorio';
    }
    if (!newPatient.lastName.trim()) {
      errors.lastName = 'El apellido es obligatorio';
    }

    if (!newPatient.noIdentification) {
      const cleanDigits = (newPatient.identificationNumber || '').replace(/\D/g, '');
      if (!cleanDigits) {
        errors.identificationNumber = 'Indica el número de cédula o marca "Menor de edad sin cédula"';
      } else if (cleanDigits.length < 6 || cleanDigits.length > 9) {
        errors.identificationNumber = 'La cédula debe contener entre 6 y 9 dígitos';
      }
    }

    const phoneDigits = (newPatient.phone || '').replace(/\D/g, '');
    if (!phoneDigits) {
      errors.phone = newPatient.noIdentification
        ? 'El teléfono del representante es obligatorio'
        : 'El teléfono es obligatorio';
    } else if (!/^(0|58)?[24]\d{9}$/.test(phoneDigits)) {
      errors.phone = 'Teléfono no válido (ej. 0414-1234567)';
    }

    if (newPatient.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newPatient.email.trim())) {
      errors.email = 'El formato del correo es inválido';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});
    onCreateNewPatient({
      firstName: newPatient.firstName.trim(),
      lastName: newPatient.lastName.trim(),
      identificationType: newPatient.noIdentification ? null : newPatient.identificationType,
      identificationNumber: newPatient.noIdentification ? null : newPatient.identificationNumber.trim(),
      noIdentification: newPatient.noIdentification,
      phone: newPatient.phone.trim() || undefined,
      dateOfBirth: newPatient.dateOfBirth || undefined,
      gender: newPatient.gender || undefined,
      email: newPatient.email.trim() || undefined,
      reasonForVisit: newPatient.reasonForVisit.trim() || 'Consulta sin cita'
    });
  };

  return (
    <SideDrawer
      open={open}
      onClose={onClose}
      title="Identificar Paciente de la Consulta"
    >
      <div className="space-y-4">
        {/* Selector de pestañas */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => setActiveTab('existing')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'existing'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            Mis pacientes
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('new')}
            className={`flex-1 pb-3 text-sm font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              activeTab === 'new'
                ? 'border-primary text-primary'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            Paciente nuevo
          </button>
        </div>

        {/* Mensaje global de error si falla la llamada */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PESTAÑA 1: MIS PACIENTES */}
        {activeTab === 'existing' && (
          <div className="space-y-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre, apellido o cédula..."
                className="w-full pl-9 pr-9 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {loadingPatients ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="text-xs">Buscando pacientes...</span>
              </div>
            ) : patientSearchError ? (
              <div className="p-4 text-center text-xs text-rose-600">
                {patientSearchError}
              </div>
            ) : patients.length === 0 ? (
              <div className="py-8 text-center bg-slate-50 rounded-lg border border-slate-200 p-4">
                <Users className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold text-slate-700">No se encontraron pacientes</p>
                <p className="text-xs text-slate-500 mt-1 mb-3">
                  {search
                    ? 'No hay coincidencias con tu búsqueda en tu directorio.'
                    : 'Aún no tienes pacientes registrados en tu historial.'}
                </p>
                <button
                  type="button"
                  onClick={() => setActiveTab('new')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-semibold rounded-lg hover:bg-primary/20 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Registrar paciente nuevo
                </button>
              </div>
            ) : (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                {patients.map((p) => {
                  const isSelected = selectedPatient?.id === p.id;
                  const initials = `${(p.firstName || '')[0] || ''}${(p.lastName || '')[0] || ''}`.toUpperCase();

                  return (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPatient(p)}
                      className={`p-3 rounded-lg border transition cursor-pointer flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                          {initials || <Users className="w-4 h-4" />}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-slate-800 truncate">
                            {p.fullName || `${p.firstName} ${p.lastName}`}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-slate-500 flex-wrap">
                            {p.identificationNumber && (
                              <span className="font-mono bg-slate-100 px-1 py-0.5 rounded text-[11px]">
                                {String(p.identificationNumber).replace(/^CI-/, '')}
                              </span>
                            )}
                            {p.age && <span>{p.age}</span>}
                            {p.phone && <span>{p.phone}</span>}
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleConfirmExisting(p);
                        }}
                        disabled={loading}
                        className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-primary text-white hover:bg-primary/90 shadow-sm'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {loading && isSelected ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Vinculando...
                          </>
                        ) : (
                          <>
                            <UserCheck className="w-3.5 h-3.5" />
                            Vincular
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 2: PACIENTE NUEVO */}
        {activeTab === 'new' && (
          <form onSubmit={handleSubmitNewPatient} className="space-y-3.5">
            <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-semibold mb-0.5">Creación rápida en 20 segundos</p>
              <p className="text-blue-700">
                Se creará el expediente clínico del paciente y se vinculará de inmediato a esta consulta.
              </p>
            </div>

            {/* Nombre y Apellido */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newPatient.firstName}
                  onChange={(e) =>
                    setNewPatient((prev) => ({ ...prev, firstName: e.target.value }))
                  }
                  placeholder="Ej. Carlos"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.firstName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                  disabled={loading}
                />
                {formErrors.firstName && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.firstName}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Apellido <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={newPatient.lastName}
                  onChange={(e) =>
                    setNewPatient((prev) => ({ ...prev, lastName: e.target.value }))
                  }
                  placeholder="Ej. Mendoza"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.lastName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                  disabled={loading}
                />
                {formErrors.lastName && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.lastName}</p>
                )}
              </div>
            </div>

            {/* Cédula y Tipo */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-bold text-slate-700">
                  Documento de Identidad (Cédula)
                </label>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newPatient.noIdentification}
                    onChange={(e) =>
                      setNewPatient((prev) => ({
                        ...prev,
                        noIdentification: e.target.checked,
                        identificationNumber: e.target.checked ? '' : prev.identificationNumber
                      }))
                    }
                    className="rounded text-primary focus:ring-primary"
                    disabled={loading}
                  />
                  <span>Menor de edad sin cédula</span>
                </label>
              </div>

              {!newPatient.noIdentification && (
                <div className="flex gap-2">
                  <select
                    value={newPatient.identificationType}
                    onChange={(e) =>
                      setNewPatient((prev) => ({ ...prev, identificationType: e.target.value }))
                    }
                    className="w-20 px-2 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary font-bold text-slate-700"
                    disabled={loading}
                  >
                    <option value="V">V-</option>
                    <option value="E">E-</option>
                  </select>
                  <input
                    type="text"
                    value={newPatient.identificationNumber}
                    onChange={(e) =>
                      setNewPatient((prev) => ({
                        ...prev,
                        identificationNumber: e.target.value.replace(/\D/g, '')
                      }))
                    }
                    placeholder="Número (ej. 20111222)"
                    maxLength={9}
                    className={`flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      formErrors.identificationNumber
                        ? 'border-rose-400 bg-rose-50/30'
                        : 'border-slate-300'
                    }`}
                    disabled={loading}
                  />
                </div>
              )}
              {formErrors.identificationNumber && (
                <p className="text-[11px] text-rose-600 mt-1">
                  {formErrors.identificationNumber}
                </p>
              )}
            </div>

            {/* Teléfono y Fecha de Nacimiento */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {newPatient.noIdentification ? 'Teléfono del representante' : 'Teléfono'}
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
                  <input
                    type="tel"
                    value={newPatient.phone}
                    onChange={(e) =>
                      setNewPatient((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="0414-1234567"
                    className={`w-full pl-8 pr-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                      formErrors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                    disabled={loading}
                  />
                </div>
                {formErrors.phone && (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.phone}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Fecha de Nacimiento
                </label>
                <input
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) =>
                    setNewPatient((prev) => ({ ...prev, dateOfBirth: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Sexo y Correo Electrónico */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Sexo</label>
                <select
                  value={newPatient.gender}
                  onChange={(e) =>
                    setNewPatient((prev) => ({ ...prev, gender: e.target.value }))
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={loading}
                >
                  <option value="">Sin indicar</option>
                  <option value="female">Femenino</option>
                  <option value="male">Masculino</option>
                  <option value="other">Otro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Correo (opcional)
                </label>
                <input
                  type="email"
                  value={newPatient.email}
                  onChange={(e) =>
                    setNewPatient((prev) => ({ ...prev, email: e.target.value }))
                  }
                  placeholder="paciente@correo.com"
                  className={`w-full px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary ${
                    formErrors.email ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                  }`}
                  disabled={loading}
                />
                {formErrors.email ? (
                  <p className="text-[11px] text-rose-600 mt-1">{formErrors.email}</p>
                ) : (
                  <p className="text-[11px] text-slate-500 mt-1">
                    Recomendado: sirve para enviarle sus documentos y para que active su cuenta.
                  </p>
                )}
              </div>
            </div>

            {/* Motivo de consulta */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Motivo de Consulta
              </label>
              <input
                type="text"
                value={newPatient.reasonForVisit}
                onChange={(e) =>
                  setNewPatient((prev) => ({ ...prev, reasonForVisit: e.target.value }))
                }
                placeholder="Ej. Malestar general, control de rutina, dolor lumbar..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={loading}
              />
            </div>

            {/* Botón Guardar */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-primary text-white rounded-lg text-sm font-bold shadow hover:bg-primary/90 transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creando e iniciando consulta...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Crear e Iniciar Consulta
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </SideDrawer>
  );
}

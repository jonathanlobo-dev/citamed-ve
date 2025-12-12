import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowLeft, Calendar, Droplet, Users as UsersIcon, Briefcase, FileText, DollarSign, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '../components/common/button/button';
import toast from 'react-hot-toast';
import axios from 'axios';

function RegistroPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { register, getDashboardPath } = useAuth();
  const [step, setStep] = useState(1);
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [specialties, setSpecialties] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const roleFromURL = searchParams.get('role');
    if (roleFromURL && ['patient', 'doctor', 'provider'].includes(roleFromURL)) {
      setRole(roleFromURL);
      setStep(2);
    }
  }, [searchParams]);

  const [commonData, setCommonData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [patientData, setPatientData] = useState({
    dateOfBirth: '',
    gender: '',
    bloodType: ''
  });

  const [doctorData, setDoctorData] = useState({
    licenseNumber: '',
    specialty: '',
    yearsExperience: '',
    consultationFee: ''
  });

  const [providerData, setProviderData] = useState({
    companyName: '',
    providerType: ''
  });

  const roles = [
    { id: 'patient', name: 'Paciente', icon: '👤', description: 'Agenda citas y consulta médicos' },
    { id: 'doctor', name: 'Médico', icon: '👨‍⚕️', description: 'Gestiona tus pacientes y consultas' },
    { id: 'provider', name: 'Proveedor', icon: '🏢', description: 'Ofrece servicios y productos médicos' }
  ];

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const genderOptions = [
    { value: 'male', label: 'Masculino' },
    { value: 'female', label: 'Femenino' },
    { value: 'other', label: 'Otro' }
  ];
  const providerTypes = ['Farmacia', 'Laboratorio', 'Clínica', 'Hospital', 'Centro de Diagnóstico', 'Otro'];

  useEffect(() => {
    const fetchSpecialties = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/specialties');
        if (response.data.success) {
          setSpecialties(response.data.data);
        }
      } catch (error) {
        console.error('Error cargando especialidades:', error);
      }
    };

    if (role === 'doctor') {
      fetchSpecialties();
    }
  }, [role]);

  const validateField = (name, value) => {
    const newErrors = { ...errors };

    switch (name) {
      case 'name':
        if (!value || value.trim().length < 3) {
          newErrors.name = 'El nombre debe tener al menos 3 caracteres';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value) {
          newErrors.email = 'El correo es obligatorio';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Ingresa un correo válido';
        } else {
          delete newErrors.email;
        }
        break;
      case 'phone':
        if (value && !/^[+]?[0-9\s-]{10,}$/.test(value.replace(/\s/g, ''))) {
          newErrors.phone = 'Ingresa un teléfono válido';
        } else {
          delete newErrors.phone;
        }
        break;
      case 'password':
        if (!value) {
          newErrors.password = 'La contraseña es obligatoria';
        } else if (value.length < 6) {
          newErrors.password = 'Mínimo 6 caracteres';
        } else {
          delete newErrors.password;
        }
        if (commonData.confirmPassword && value !== commonData.confirmPassword) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else if (commonData.confirmPassword) {
          delete newErrors.confirmPassword;
        }
        break;
      case 'confirmPassword':
        if (!value) {
          newErrors.confirmPassword = 'Confirma tu contraseña';
        } else if (value !== commonData.password) {
          newErrors.confirmPassword = 'Las contraseñas no coinciden';
        } else {
          delete newErrors.confirmPassword;
        }
        break;
      case 'licenseNumber':
        if (role === 'doctor' && (!value || value.trim().length < 3)) {
          newErrors.licenseNumber = 'El número de matrícula es obligatorio';
        } else {
          delete newErrors.licenseNumber;
        }
        break;
      case 'specialty':
        if (role === 'doctor' && !value) {
          newErrors.specialty = 'Selecciona una especialidad';
        } else {
          delete newErrors.specialty;
        }
        break;
      case 'companyName':
        if (role === 'provider' && (!value || value.trim().length < 2)) {
          newErrors.companyName = 'El nombre de la empresa es obligatorio';
        } else {
          delete newErrors.companyName;
        }
        break;
      case 'providerType':
        if (role === 'provider' && !value) {
          newErrors.providerType = 'Selecciona el tipo de proveedor';
        } else {
          delete newErrors.providerType;
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return !newErrors[name];
  };

  const handleCommonChange = (e) => {
    const { name, value } = e.target;
    setCommonData({ ...commonData, [name]: value });
    if (errors[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    validateField(name, value);
  };

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
    setStep(2);
    setErrors({});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validar campos obligatorios
    let hasErrors = false;
    const fieldsToValidate = ['name', 'email', 'password', 'confirmPassword'];

    if (role === 'doctor') {
      fieldsToValidate.push('licenseNumber', 'specialty');
    }
    if (role === 'provider') {
      fieldsToValidate.push('companyName', 'providerType');
    }

    fieldsToValidate.forEach(field => {
      let value;
      if (['name', 'email', 'password', 'confirmPassword', 'phone'].includes(field)) {
        value = commonData[field];
      } else if (['licenseNumber', 'specialty'].includes(field)) {
        value = doctorData[field];
      } else if (['companyName', 'providerType'].includes(field)) {
        value = providerData[field];
      }
      if (!validateField(field, value)) {
        hasErrors = true;
      }
    });

    if (hasErrors) {
      toast.error('Por favor corrige los errores en el formulario');
      setLoading(false);
      return;
    }

    let payload = {
      role: role,
      email: commonData.email,
      password: commonData.password,
      name: commonData.name,
      phone: commonData.phone
    };

    if (role === 'patient') {
      payload = {
        ...payload,
        dateOfBirth: patientData.dateOfBirth || null,
        gender: patientData.gender || null,
        bloodType: patientData.bloodType || 'unknown'
      };
    } else if (role === 'doctor') {
      payload = {
        ...payload,
        licenseNumber: doctorData.licenseNumber,
        specialty: doctorData.specialty,
        yearsExperience: parseInt(doctorData.yearsExperience) || 0,
        consultationFee: parseFloat(doctorData.consultationFee) || 0
      };
    } else if (role === 'provider') {
      payload = {
        ...payload,
        companyName: providerData.companyName,
        providerType: providerData.providerType
      };
    }

    try {
      const result = await register(payload);

      if (result.success) {
        const userRole = result.user.role;
        const dashboardPath = getDashboardPath(userRole);

        toast.success('¡Bienvenido a CITAMED.VE!');
        setTimeout(() => {
          navigate(dashboardPath);
        }, 1000);
      } else {
        const errorMessage = result.message || 'Error en el registro';
        setErrors({ general: errorMessage });
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error('Error en registro:', error);
      const errorMessage = error.response?.data?.message || 'Error de conexión con el servidor';
      setErrors({ general: errorMessage });
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === role);
  const titleText = step === 1 ? 'Selecciona tu tipo de cuenta' : 'Registro como ' + (selectedRole ? selectedRole.name : '');

  const InputField = ({ label, name, type = 'text', value, onChange, onBlur, placeholder, required, icon: Icon, showToggle, onToggle, toggleState }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors[name] ? 'text-red-400' : 'text-gray-400'}`} />
        )}
        <input
          type={showToggle ? (toggleState ? 'text' : 'password') : type}
          name={name}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          className={`w-full ${Icon ? 'pl-10' : 'px-4'} ${showToggle ? 'pr-12' : 'pr-4'} py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors[name] ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
          placeholder={placeholder}
        />
        {showToggle && (
          <button
            type="button"
            onClick={onToggle}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
            tabIndex={-1}
            title={toggleState ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {toggleState ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        )}
      </div>
      {errors[name] && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1 text-sm text-red-600 flex items-center gap-1"
        >
          <AlertCircle className="w-4 h-4" />
          {errors[name]}
        </motion.p>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary via-primary-light to-secondary flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <button
          onClick={() => step === 1 ? navigate('/') : setStep(1)}
          className="mb-6 flex items-center gap-2 text-white/80 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          {step === 1 ? 'Volver al inicio' : 'Volver a selección de rol'}
        </button>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-primary mb-2">
              CITAMED<span className="text-accent">.VE</span>
            </h1>
            <p className="text-gray-600">{titleText}</p>
          </div>

          {errors.general && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-red-700 font-medium">Error en el registro</p>
                <p className="text-red-600 text-sm">{errors.general}</p>
              </div>
            </motion.div>
          )}

          {step === 1 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {roles.map((r, index) => (
                <motion.div
                  key={r.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => handleRoleSelect(r.id)}
                  className="p-6 border-2 border-gray-200 rounded-xl hover:border-primary hover:shadow-lg transition-all cursor-pointer text-center"
                >
                  <div className="text-5xl mb-3">{r.icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{r.name}</h3>
                  <p className="text-sm text-gray-600">{r.description}</p>
                </motion.div>
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <InputField
                label="Nombre Completo"
                name="name"
                value={commonData.name}
                onChange={handleCommonChange}
                onBlur={handleBlur}
                placeholder="Juan Pérez"
                required
                icon={User}
              />

              <InputField
                label="Correo Electrónico"
                name="email"
                type="email"
                value={commonData.email}
                onChange={handleCommonChange}
                onBlur={handleBlur}
                placeholder="tu@email.com"
                required
                icon={Mail}
              />

              <InputField
                label="Teléfono"
                name="phone"
                type="tel"
                value={commonData.phone}
                onChange={handleCommonChange}
                onBlur={handleBlur}
                placeholder="+58 412 1234567"
                icon={Phone}
              />

              {role === 'patient' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha de Nacimiento
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="date"
                        value={patientData.dateOfBirth}
                        onChange={(e) => setPatientData({ ...patientData, dateOfBirth: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Género
                    </label>
                    <div className="relative">
                      <UsersIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={patientData.gender}
                        onChange={(e) => setPatientData({ ...patientData, gender: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        {genderOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Sangre
                    </label>
                    <div className="relative">
                      <Droplet className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={patientData.bloodType}
                        onChange={(e) => setPatientData({ ...patientData, bloodType: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      >
                        <option value="">Seleccionar...</option>
                        {bloodTypes.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </>
              )}

              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Matrícula Profesional <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <FileText className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.licenseNumber ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        name="licenseNumber"
                        value={doctorData.licenseNumber}
                        onChange={(e) => {
                          setDoctorData({ ...doctorData, licenseNumber: e.target.value });
                          if (errors.licenseNumber) validateField('licenseNumber', e.target.value);
                        }}
                        onBlur={(e) => validateField('licenseNumber', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.licenseNumber ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                        placeholder="Ej: MPPS-12345"
                      />
                    </div>
                    {errors.licenseNumber && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />{errors.licenseNumber}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.specialty ? 'text-red-400' : 'text-gray-400'}`} />
                      <select
                        name="specialty"
                        value={doctorData.specialty}
                        onChange={(e) => {
                          setDoctorData({ ...doctorData, specialty: e.target.value });
                          if (errors.specialty) validateField('specialty', e.target.value);
                        }}
                        onBlur={(e) => validateField('specialty', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.specialty ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                      >
                        <option value="">Seleccionar especialidad...</option>
                        {specialties.map(spec => (
                          <option key={spec.id} value={spec.name}>{spec.name}</option>
                        ))}
                      </select>
                    </div>
                    {errors.specialty && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />{errors.specialty}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Años de Experiencia
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={doctorData.yearsExperience}
                      onChange={(e) => setDoctorData({ ...doctorData, yearsExperience: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Ej: 5"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tarifa de Consulta (USD)
                    </label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={doctorData.consultationFee}
                        onChange={(e) => setDoctorData({ ...doctorData, consultationFee: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: 30.00"
                      />
                    </div>
                  </div>
                </>
              )}

              {role === 'provider' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.companyName ? 'text-red-400' : 'text-gray-400'}`} />
                      <input
                        type="text"
                        name="companyName"
                        value={providerData.companyName}
                        onChange={(e) => {
                          setProviderData({ ...providerData, companyName: e.target.value });
                          if (errors.companyName) validateField('companyName', e.target.value);
                        }}
                        onBlur={(e) => validateField('companyName', e.target.value)}
                        className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.companyName ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                        placeholder="Ej: Farmacia San José"
                      />
                    </div>
                    {errors.companyName && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />{errors.companyName}
                      </motion.p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Proveedor <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="providerType"
                      value={providerData.providerType}
                      onChange={(e) => {
                        setProviderData({ ...providerData, providerType: e.target.value });
                        if (errors.providerType) validateField('providerType', e.target.value);
                      }}
                      onBlur={(e) => validateField('providerType', e.target.value)}
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.providerType ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                    >
                      <option value="">Seleccionar tipo...</option>
                      {providerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                    {errors.providerType && (
                      <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="w-4 h-4" />{errors.providerType}
                      </motion.p>
                    )}
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.password ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={commonData.password}
                    onChange={handleCommonChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.password ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                    placeholder="••••••••"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password ? (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />{errors.password}
                  </motion.p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 ${errors.confirmPassword ? 'text-red-400' : 'text-gray-400'}`} />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={commonData.confirmPassword}
                    onChange={handleCommonChange}
                    onBlur={handleBlur}
                    className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:border-transparent transition-colors ${errors.confirmPassword ? 'border-red-300 focus:ring-red-200 bg-red-50' : 'border-gray-300 focus:ring-primary'}`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                    title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword ? (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-4 h-4" />{errors.confirmPassword}
                  </motion.p>
                ) : commonData.confirmPassword && commonData.password === commonData.confirmPassword && (
                  <motion.p initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} className="mt-1 text-sm text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" />Las contraseñas coinciden
                  </motion.p>
                )}
              </div>

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                disabled={loading}
              >
                {loading ? 'Registrando...' : 'Crear Cuenta'}
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <p className="text-gray-600">
              ¿Ya tienes cuenta?{' '}
              <button
                onClick={() => navigate('/login')}
                className="text-primary font-semibold hover:underline"
              >
                Inicia sesión aquí
              </button>
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default RegistroPage;

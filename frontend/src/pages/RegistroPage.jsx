import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { User, Mail, Lock, Phone, ArrowLeft, Calendar, Droplet, Users as UsersIcon, Briefcase, FileText, DollarSign } from 'lucide-react';
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

  // Detectar role desde URL y saltar al paso 2 automáticamente
  useEffect(() => {
    const roleFromURL = searchParams.get('role');
    if (roleFromURL && ['patient', 'doctor', 'provider'].includes(roleFromURL)) {
      setRole(roleFromURL);
      setStep(2);
    }
  }, [searchParams]);

  // Datos comunes para todos los roles
  const [commonData, setCommonData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  // Datos específicos para pacientes
  const [patientData, setPatientData] = useState({
    dateOfBirth: '',
    gender: '',
    bloodType: ''
  });

  // Datos específicos para médicos
  const [doctorData, setDoctorData] = useState({
    licenseNumber: '',
    specialty: '',
    yearsExperience: '',
    consultationFee: ''
  });

  // Datos específicos para proveedores
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

  // Cargar especialidades desde el backend
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

  const handleRoleSelect = (roleId) => {
    setRole(roleId);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Validaciones comunes
    if (!commonData.name || !commonData.email || !commonData.password) {
      toast.error('Por favor complete todos los campos obligatorios');
      setLoading(false);
      return;
    }

    if (commonData.password !== commonData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      setLoading(false);
      return;
    }

    if (commonData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      setLoading(false);
      return;
    }

    // Validaciones específicas por rol
    if (role === 'doctor') {
      if (!doctorData.licenseNumber || !doctorData.specialty) {
        toast.error('El número de matrícula y la especialidad son obligatorios para médicos');
        setLoading(false);
        return;
      }
    }

    if (role === 'provider') {
      if (!providerData.companyName || !providerData.providerType) {
        toast.error('El nombre de la empresa y el tipo de proveedor son obligatorios');
        setLoading(false);
        return;
      }
    }

    // Construir el payload según el rol
    let payload = {
      role: role,
      email: commonData.email,
      password: commonData.password,
      name: commonData.name,
      phone: commonData.phone
    };

    // Agregar datos específicos según el rol
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

        toast.success(`¡Bienvenido a CITAMED.VE!`);
        setTimeout(() => {
          navigate(dashboardPath);
        }, 1000);
      } else {
        toast.error(result.message || 'Error en el registro');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      toast.error('Error al registrar usuario');
    } finally {
      setLoading(false);
    }
  };

  const selectedRole = roles.find(r => r.id === role);
  const titleText = step === 1 ? 'Selecciona tu tipo de cuenta' : 'Registro como ' + (selectedRole ? selectedRole.name : '');

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
              {/* CAMPOS COMUNES PARA TODOS LOS ROLES */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={commonData.name}
                    onChange={(e) => setCommonData({ ...commonData, name: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Juan Pérez"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico *
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={commonData.email}
                    onChange={(e) => setCommonData({ ...commonData, email: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="tu@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Teléfono
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="tel"
                    value={commonData.phone}
                    onChange={(e) => setCommonData({ ...commonData, phone: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="+58 412 1234567"
                  />
                </div>
              </div>

              {/* CAMPOS ESPECÍFICOS PARA PACIENTES */}
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

              {/* CAMPOS ESPECÍFICOS PARA MÉDICOS */}
              {role === 'doctor' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Número de Matrícula Profesional *
                    </label>
                    <div className="relative">
                      <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={doctorData.licenseNumber}
                        onChange={(e) => setDoctorData({ ...doctorData, licenseNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: MPPS-12345"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Especialidad *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <select
                        value={doctorData.specialty}
                        onChange={(e) => setDoctorData({ ...doctorData, specialty: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        required
                      >
                        <option value="">Seleccionar especialidad...</option>
                        {specialties.map(spec => (
                          <option key={spec.id} value={spec.name}>{spec.name}</option>
                        ))}
                      </select>
                    </div>
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

              {/* CAMPOS ESPECÍFICOS PARA PROVEEDORES */}
              {role === 'provider' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nombre de la Empresa *
                    </label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        value={providerData.companyName}
                        onChange={(e) => setProviderData({ ...providerData, companyName: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                        placeholder="Ej: Farmacia San José"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Tipo de Proveedor *
                    </label>
                    <select
                      value={providerData.providerType}
                      onChange={(e) => setProviderData({ ...providerData, providerType: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      required
                    >
                      <option value="">Seleccionar tipo...</option>
                      {providerTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* CAMPOS DE CONTRASEÑA (COMUNES PARA TODOS) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={commonData.password}
                    onChange={(e) => setCommonData({ ...commonData, password: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    required
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar Contraseña *
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="password"
                    value={commonData.confirmPassword}
                    onChange={(e) => setCommonData({ ...commonData, confirmPassword: e.target.value })}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="••••••••"
                    required
                  />
                </div>
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

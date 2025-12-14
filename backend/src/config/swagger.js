const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CITAMED.VE API',
      version: '1.0.0',
      description: `
## API del Ecosistema Digital de Salud para Venezuela

CITAMED.VE conecta pacientes, médicos y proveedores de servicios de salud en una plataforma integral.

### Características principales:
- **Autenticación JWT** segura para todos los roles
- **Directorio de médicos** con búsqueda por especialidad y ubicación
- **Gestión de citas** en tiempo real
- **Perfiles completos** para pacientes, médicos y proveedores

### Roles de usuario:
- \`patient\` - Pacientes que buscan atención médica
- \`doctor\` - Profesionales de la salud
- \`provider\` - Farmacias, laboratorios y clínicas
- \`admin\` - Administradores del sistema
      `,
      contact: {
        name: 'CITAMED.VE Team',
        email: 'info@citamed.ve',
        url: 'https://citamed.ve'
      },
      license: {
        name: 'Proprietary',
        url: 'https://citamed.ve/terms'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Servidor de Desarrollo'
      },
      {
        url: 'https://api.citamed.ve',
        description: 'Servidor de Producción'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Token JWT obtenido del endpoint /api/auth/login'
        }
      },
      schemas: {
        // ==================== SCHEMAS DE ENTIDADES ====================
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'doctor@citamed.ve' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            phone: { type: 'string', example: '+584121234567' },
            role: { type: 'string', enum: ['patient', 'doctor', 'provider', 'admin'], example: 'doctor' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Doctor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 5 },
            firstName: { type: 'string', example: 'María' },
            lastName: { type: 'string', example: 'González' },
            email: { type: 'string', example: 'dra.gonzalez@citamed.ve' },
            specialty: { type: 'string', example: 'Cardiología' },
            specialtyId: { type: 'integer', example: 15 },
            licenseNumber: { type: 'string', example: 'MPPS-12345' },
            experienceYears: { type: 'integer', example: 10 },
            bio: { type: 'string', example: 'Especialista en enfermedades cardiovasculares con 10 años de experiencia' },
            city: { type: 'string', example: 'Caracas' },
            state: { type: 'string', example: 'Distrito Capital' },
            consultationFee: { type: 'number', example: 50.00 },
            followUpFee: { type: 'number', example: 30.00 },
            isVerified: { type: 'boolean', example: true },
            profileStatus: { type: 'string', enum: ['active', 'inactive', 'incomplete'], example: 'active' },
            averageRating: { type: 'number', example: 4.8 },
            totalReviews: { type: 'integer', example: 156 },
            telemedicineEnabled: { type: 'boolean', example: true },
            acceptingNewPatients: { type: 'boolean', example: true },
            languages: { type: 'array', items: { type: 'string' }, example: ['Español', 'Inglés'] }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 3 },
            firstName: { type: 'string', example: 'Ana' },
            lastName: { type: 'string', example: 'Rodríguez' },
            email: { type: 'string', example: 'ana.rodriguez@example.com' },
            birthDate: { type: 'string', format: 'date', example: '1990-05-15' },
            gender: { type: 'string', enum: ['male', 'female', 'other'], example: 'female' },
            bloodType: { type: 'string', enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'], example: 'O+' },
            allergies: { type: 'string', example: 'Penicilina, Aspirina' },
            emergencyContact: { type: 'string', example: '+584129876543' },
            emergencyContactName: { type: 'string', example: 'Carlos Rodríguez' }
          }
        },
        Specialty: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 15 },
            name: { type: 'string', example: 'Cardiología' },
            description: { type: 'string', example: 'Especialidad médica que se ocupa de las enfermedades del corazón y sistema circulatorio' },
            category: { type: 'string', example: 'especialidad_clinica' },
            isActive: { type: 'boolean', example: true }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            patientId: { type: 'integer', example: 3 },
            doctorId: { type: 'integer', example: 5 },
            specialtyId: { type: 'integer', example: 15 },
            appointmentDate: { type: 'string', format: 'date-time', example: '2025-12-15T10:00:00Z' },
            endTime: { type: 'string', format: 'date-time', example: '2025-12-15T10:30:00Z' },
            status: { type: 'string', enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'], example: 'confirmed' },
            type: { type: 'string', enum: ['presencial', 'telemedicina'], example: 'presencial' },
            reason: { type: 'string', example: 'Consulta de control cardiovascular' },
            notes: { type: 'string', example: 'Paciente refiere dolor en el pecho ocasional' },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        // ==================== SCHEMAS DE REQUEST ====================
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@citamed.ve' },
            password: { type: 'string', format: 'password', example: 'MiPassword123!' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role', 'name'],
          properties: {
            email: { type: 'string', format: 'email', example: 'nuevo@citamed.ve' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'Password123!' },
            name: { type: 'string', example: 'Carlos Rodríguez' },
            firstName: { type: 'string', example: 'Carlos' },
            lastName: { type: 'string', example: 'Rodríguez' },
            role: { type: 'string', enum: ['patient', 'doctor', 'provider'], example: 'patient' },
            phone: { type: 'string', example: '+584121234567' }
          }
        },
        // ==================== SCHEMAS DE RESPONSE ====================
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login exitoso' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Operación exitosa' },
            data: { type: 'object' }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error en la operación' },
            error: { type: 'string', example: 'Descripción detallada del error' }
          }
        },
        ValidationError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error de validación' },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string', example: 'email' },
                  message: { type: 'string', example: 'Email inválido' }
                }
              }
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            totalPages: { type: 'integer', example: 5 },
            data: { type: 'array', items: {} }
          }
        },
        DoctorListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            total: { type: 'integer', example: 50 },
            page: { type: 'integer', example: 1 },
            totalPages: { type: 'integer', example: 3 },
            showingVerifiedOnly: { type: 'boolean', example: true },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Doctor' }
            }
          }
        },
        SpecialtyListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            total: { type: 'integer', example: 102 },
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Specialty' }
            }
          }
        }
      },
      responses: {
        // ==================== RESPONSES REUTILIZABLES ====================
        Success: {
          description: 'Operación exitosa',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' }
            }
          }
        },
        BadRequest: {
          description: 'Solicitud inválida - Error de validación',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ValidationError' },
              example: {
                success: false,
                message: 'Error de validación',
                errors: [{ field: 'email', message: 'Email inválido' }]
              }
            }
          }
        },
        Unauthorized: {
          description: 'No autenticado - Token faltante o inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'No autorizado',
                error: 'Token inválido o expirado'
              }
            }
          }
        },
        Forbidden: {
          description: 'Acceso denegado - Sin permisos suficientes',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Acceso denegado',
                error: 'No tienes permisos para realizar esta acción'
              }
            }
          }
        },
        NotFound: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'No encontrado',
                error: 'El recurso solicitado no existe'
              }
            }
          }
        },
        ServerError: {
          description: 'Error interno del servidor',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ErrorResponse' },
              example: {
                success: false,
                message: 'Error interno',
                error: 'Ha ocurrido un error en el servidor'
              }
            }
          }
        }
      }
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Endpoints de registro, login y gestión de sesión'
      },
      {
        name: 'Profiles',
        description: 'Gestión de perfiles de usuario'
      },
      {
        name: 'Protected',
        description: 'Rutas protegidas por rol'
      },
      {
        name: 'Doctors',
        description: 'Directorio y búsqueda de médicos'
      },
      {
        name: 'Specialties',
        description: 'Catálogo de especialidades médicas'
      },
      {
        name: 'Appointments',
        description: 'Gestión de citas médicas'
      },
      {
        name: 'Patients',
        description: 'Gestión de perfiles de pacientes'
      },
      {
        name: 'Providers',
        description: 'Proveedores de servicios de salud'
      },
      {
        name: 'Statistics',
        description: 'Estadísticas generales del sistema'
      }
    ]
  },
  apis: ['./src/routes/*.js', './src/server.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;

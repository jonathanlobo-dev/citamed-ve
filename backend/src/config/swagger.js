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
        User: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            email: { type: 'string', format: 'email', example: 'usuario@citamed.ve' },
            firstName: { type: 'string', example: 'Juan' },
            lastName: { type: 'string', example: 'Pérez' },
            role: { type: 'string', enum: ['patient', 'doctor', 'provider', 'admin'], example: 'patient' },
            isActive: { type: 'boolean', example: true },
            createdAt: { type: 'string', format: 'date-time' }
          }
        },
        Doctor: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            userId: { type: 'integer', example: 10 },
            firstName: { type: 'string', example: 'María' },
            lastName: { type: 'string', example: 'González' },
            specialtyId: { type: 'integer', example: 1 },
            licenseNumber: { type: 'string', example: 'MPPS-12345' },
            consultationFee: { type: 'number', example: 30.00 },
            city: { type: 'string', example: 'Caracas' },
            state: { type: 'string', example: 'Distrito Capital' },
            isVerified: { type: 'boolean', example: true },
            averageRating: { type: 'number', example: 4.5 }
          }
        },
        Specialty: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            name: { type: 'string', example: 'Medicina General' },
            description: { type: 'string', example: 'Atención médica integral' },
            category: { type: 'string', example: 'especialidad_clinica' },
            isActive: { type: 'boolean', example: true }
          }
        },
        LoginRequest: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email', example: 'usuario@citamed.ve' },
            password: { type: 'string', format: 'password', example: 'MiPassword123!' }
          }
        },
        LoginResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: 'Login exitoso' },
            token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
            user: { $ref: '#/components/schemas/User' }
          }
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'password', 'role'],
          properties: {
            email: { type: 'string', format: 'email', example: 'nuevo@citamed.ve' },
            password: { type: 'string', format: 'password', minLength: 6, example: 'Password123!' },
            firstName: { type: 'string', example: 'Carlos' },
            lastName: { type: 'string', example: 'Rodríguez' },
            role: { type: 'string', enum: ['patient', 'doctor', 'provider'], example: 'patient' },
            phone: { type: 'string', example: '+584121234567' }
          }
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Error en la solicitud' },
            error: { type: 'string', example: 'Descripción del error' }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            total: { type: 'integer', example: 100 },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            totalPages: { type: 'integer', example: 10 },
            data: { type: 'array', items: {} }
          }
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Token de acceso faltante o inválido',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'No autorizado',
                error: 'Token inválido o expirado'
              }
            }
          }
        },
        NotFoundError: {
          description: 'Recurso no encontrado',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'No encontrado',
                error: 'El recurso solicitado no existe'
              }
            }
          }
        },
        ValidationError: {
          description: 'Error de validación',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Error de validación',
                errors: [{ field: 'email', message: 'Email inválido' }]
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

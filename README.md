# CITAMED.VE

![Build Status](https://img.shields.io/badge/build-passing-brightgreen)
![Tests](https://img.shields.io/badge/tests-50%20passing-success)
![Coverage](https://img.shields.io/badge/coverage-32%25-yellow)
![Node](https://img.shields.io/badge/node-22%2B-brightgreen)
![License](https://img.shields.io/badge/license-Private-red)

> Ecosistema Digital de Salud Privada para Venezuela

CITAMED.VE conecta pacientes, medicos y proveedores de servicios de salud en una plataforma integral que revoluciona el acceso a la atencion medica en Venezuela.

---

## Caracteristicas Principales

- **Sala de Espera Virtual** - Sistema de turnos en tiempo real con "Las Sillitas"
- **Directorio Medico** - Busqueda por especialidad, ciudad y disponibilidad
- **Sistema de Perfiles** - Pacientes, Medicos y Proveedores
- **Autenticacion JWT** - Sistema seguro con roles y permisos
- **API Documentada** - Swagger OpenAPI 3.0 con 11 endpoints
- **Testing Completo** - 50 tests automatizados (Jest + Cypress)
- **CI/CD** - GitHub Actions con tests automaticos

---

## Proyeccion del Negocio

| Metrica | Ano 1 | Ano 2 | Ano 3 |
|---------|-------|-------|-------|
| Medicos Activos | 850 | 2,040 | 2,890 |
| Ingresos | $785K | $1.88M | $2.67M |
| Margen EBITDA | 54% | 72% | 73% |
| ROI | - | - | **25X** |

---

## Stack Tecnologico

### Backend
- **Runtime:** Node.js 22+
- **Framework:** Express.js 4.21+
- **Base de Datos:** PostgreSQL 16
- **ORM:** Sequelize 6.37+
- **Cache:** Redis (ioredis) + Memory fallback
- **WebSocket:** Socket.io 4.8+
- **Autenticacion:** JWT + bcryptjs
- **Documentacion:** Swagger OpenAPI 3.0
- **Testing:** Jest 29+ (44 tests)

### Frontend
- **Framework:** React 19
- **Build Tool:** Vite 6+
- **Styling:** Tailwind CSS 4+
- **Routing:** React Router 7+
- **State:** Context API
- **WebSocket:** Socket.io-client 4.8+
- **Testing:** Cypress 13+ (6 tests E2E)

### Infraestructura
- **CI/CD:** GitHub Actions
- **Control de Versiones:** Git
- **Package Manager:** npm 10+

---

## Estructura del Proyecto

```
proyecto/
├── backend/
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js          # Configuracion PostgreSQL
│   │   │   ├── redis.js             # Conexion Redis + fallback
│   │   │   ├── socket.js            # Socket.io server
│   │   │   └── swagger.js           # OpenAPI 3.0 (14 schemas)
│   │   ├── controllers/             # Logica de negocio
│   │   │   ├── authController.js
│   │   │   ├── doctorController.js
│   │   │   └── profileController.js
│   │   ├── models/                  # Sequelize models
│   │   │   ├── User.js
│   │   │   ├── DoctorProfile.js
│   │   │   ├── PatientProfile.js
│   │   │   └── Specialty.js
│   │   ├── routes/                  # Definicion de endpoints
│   │   │   ├── auth.js
│   │   │   ├── profiles.js
│   │   │   └── protected.js
│   │   ├── middleware/              # Auth, validacion, cache
│   │   │   ├── auth.js
│   │   │   ├── cache.js             # Cache middleware
│   │   │   └── socketAuth.js        # JWT auth para WebSocket
│   │   ├── socket/                  # WebSocket handlers
│   │   │   ├── events.js            # Event constants
│   │   │   └── handlers/            # Namespace handlers
│   │   ├── services/                # Servicios compartidos
│   │   │   └── cacheService.js      # Operaciones de cache
│   │   └── server.js                # Punto de entrada
│   ├── migrations/                  # Sequelize migrations
│   ├── __tests__/                   # Tests Jest
│   │   ├── unit/
│   │   └── integration/
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/              # Componentes reutilizables
│   │   ├── pages/                   # Vistas principales
│   │   ├── context/                 # AuthContext
│   │   ├── hooks/                   # Custom hooks
│   │   │   ├── useSocket.js         # Hook conexion WebSocket
│   │   │   └── useSocketEvent.js    # Hook eventos WebSocket
│   │   └── utils/
│   │       └── socket.js            # Cliente Socket.io
│   ├── cypress/                     # Tests E2E
│   │   └── e2e/
│   └── package.json
├── .github/
│   └── workflows/
│       ├── ci.yml                   # Tests automaticos
│       └── deploy.yml               # Deploy staging/prod
├── docker-compose.yml               # Orquestacion servicios
└── README.md
```

---

## Instalacion y Setup

### Prerrequisitos

- Node.js 18+ ([Descargar](https://nodejs.org/))
- PostgreSQL 16+ ([Descargar](https://www.postgresql.org/download/))
- Git ([Descargar](https://git-scm.com/))
- npm 10+ (incluido con Node.js)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu-usuario/citamed-ve.git
cd citamed-ve/proyecto
```

### 2. Configurar Base de Datos

```bash
# Crear base de datos PostgreSQL
psql -U postgres
CREATE DATABASE citamed_development;
\q
```

### 3. Configurar Backend

```bash
cd backend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env con tus credenciales:
# DB_NAME=citamed_development
# DB_USER=postgres
# DB_PASSWORD=tu_password
# DB_HOST=localhost
# DB_PORT=5432
# JWT_SECRET=tu_secret_key_super_seguro
# PORT=5000

# Ejecutar migraciones (crear tablas)
npm run migrate

# Ejecutar seeders (datos iniciales)
npm run seed

# Iniciar servidor de desarrollo
npm run dev
```

**Backend corriendo en:** http://localhost:5000

### 4. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm install

# Crear archivo .env
cp .env.example .env

# Editar .env:
# VITE_API_URL=http://localhost:5000

# Iniciar servidor de desarrollo
npm run dev
```

**Frontend corriendo en:** http://localhost:5173

---

## Testing

### Tests Backend (Jest)

```bash
cd backend

# Ejecutar todos los tests
npm test

# Tests con coverage
npm run test:coverage

# Tests en modo watch
npm run test:watch

# Tests de un archivo especifico
npm test auth.test.js
```

**Cobertura actual:** 32% (Objetivo: 70%)

### Tests E2E (Cypress)

```bash
cd frontend

# Abrir Cypress UI
npm run cypress:open

# Ejecutar tests headless
npm run cypress:run

# Test especifico
npm run cypress:run -- --spec "cypress/e2e/auth/register.cy.js"
```

### CI/CD (GitHub Actions)

Tests automaticos en cada push:

- Tests backend (Jest)
- Lint frontend
- Build frontend
- Tests E2E (Cypress)

Ver: `.github/workflows/ci.yml`

---

## Documentacion API

### Swagger UI Interactivo

**Acceder a:** http://localhost:5000/api-docs

Documentacion completa con:

- 11 endpoints documentados
- 14 schemas reutilizables
- 6 responses HTTP estandarizadas
- Ejemplos con datos reales de Venezuela
- Boton "Try it out" para probar endpoints

### Endpoints Principales

| Metodo | Endpoint | Descripcion |
|--------|----------|-------------|
| POST | /api/auth/register | Registrar nuevo usuario |
| POST | /api/auth/login | Iniciar sesion |
| GET | /api/doctors | Buscar medicos (filtros disponibles) |
| GET | /api/doctors/:id | Obtener medico especifico |
| GET | /api/specialties | Listar especialidades |
| GET | /api/specialties/search | Buscar especialidades |
| GET | /api/profiles/me | Obtener mi perfil |
| PUT | /api/profiles/me | Actualizar mi perfil |
| GET | /api/stats | Estadisticas del sistema |

---

## Autenticacion

### Usuarios Demo

```javascript
// Paciente
Email: paciente@demo.com
Password: Demo1234!

// Medico
Email: medico@demo.com
Password: Demo1234!

// Proveedor
Email: proveedor@demo.com
Password: Demo1234!
```

### Usar Token JWT

```bash
# 1. Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"paciente@demo.com","password":"Demo1234!"}'

# 2. Usar token en requests protegidos
curl http://localhost:5000/api/profiles/me \
  -H "Authorization: Bearer TU_TOKEN_AQUI"
```

---

## Arquitectura

### Patron MVC Deterministico

```
Request -> Routes -> Middleware -> Controller -> Model -> Database
                                       |
                                   Response
```

**Caracteristicas:**

- Separacion clara de responsabilidades
- Facil de debuggear y mantener
- Escalable a millones de usuarios
- Testing simplificado

### Base de Datos (PostgreSQL)

**Filosofia:** CERO mocks - Todo datos reales

**Modelos principales:**

- `User` - Usuarios del sistema
- `PatientProfile` - Perfil de pacientes
- `DoctorProfile` - Perfil de medicos con verificacion
- `ProviderProfile` - Proveedores de servicios
- `Specialty` - 102 especialidades medicas de Venezuela
- `Appointment` - Sistema de citas

### Caching (Redis)

El proyecto implementa una capa de cache con Redis para mejorar performance:

**Arquitectura:**
```
Request → Cache Check → [HIT] → Response (cached)
                      → [MISS] → Database → Cache Set → Response
```

**TTLs por Categoria:**

| Categoria | TTL | Descripcion |
|-----------|-----|-------------|
| `sessions` | 24h | Sesiones JWT |
| `specialties` | 1h | Lista de especialidades |
| `doctors` | 5min | Busqueda de medicos |
| `stats` | 1min | Estadisticas del sistema |

**Graceful Degradation:**
- Si Redis no esta disponible, el sistema usa cache en memoria
- La aplicacion sigue funcionando sin interrupciones

**Endpoints de Cache:**

| Endpoint | Descripcion | Acceso |
|----------|-------------|--------|
| `GET /api/cache/stats` | Estadisticas del cache | Admin |
| `POST /api/cache/flush` | Limpiar todo el cache | Admin |

**Variables de Entorno:**
```bash
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0
REDIS_TTL=300
```

**Bypass de Cache:**
```bash
# Agregar ?nocache=true para saltear cache
curl http://localhost:5000/api/specialties?nocache=true
```

### WebSocket (Socket.io)

Infraestructura de comunicacion real-time para:
- Sala de Espera Virtual en tiempo real
- Notificaciones push instantaneas
- Actualizaciones de cola de pacientes

**Arquitectura:**
```
Client → Socket.io → JWT Auth → Namespace Handler → Room/Broadcast
```

**Namespaces Disponibles:**

| Namespace | Proposito | Eventos Principales |
|-----------|-----------|---------------------|
| `/` | Conexion base | `join-room`, `leave-room` |
| `/waiting-room` | Sala de espera | `wr:doctor-online`, `wr:queue-update` |
| `/notifications` | Notificaciones | `notif:new`, `notif:read` |

**Frontend - Uso de Hooks:**

```jsx
import useSocket from './hooks/useSocket';
import useSocketEvent from './hooks/useSocketEvent';

// Conectar al namespace
const { socket, isConnected, emit } = useSocket('/waiting-room');

// Escuchar evento especifico
const { lastData } = useSocketEvent('/waiting-room', 'wr:queue-update');

// Emitir evento
emit('wr:patient-checkin', { appointmentId: 123, doctorId: 456 });
```

**Backend - Emitir desde Controlador:**

```javascript
const { emitToRoom, emitToUser } = require('./socket');

// Notificar a sala de un doctor
emitToRoom('doctor:123', 'wr:queue-update', { position: 1 });

// Notificar a usuario especifico
emitToUser(userId, 'notif:new', { message: 'Tu turno esta proximo' });
```

**Autenticacion:**
- JWT requerido en conexion (query, auth object, o header)
- Socket recibe `userId` y `userRole` del token
- Rechazo automatico de conexiones sin token valido

**Variables de Entorno:**
```bash
# Backend
SOCKET_CORS_ORIGIN=http://localhost:5173
SOCKET_PING_TIMEOUT=30000
SOCKET_PING_INTERVAL=25000

# Frontend
VITE_SOCKET_URL=http://localhost:5000
```

### Rate Limiting

Proteccion contra abuso de API y ataques DDoS:
- Multiples estrategias segun tipo de endpoint
- Storage en Redis (con fallback a memoria)
- Headers informativos RateLimit-*
- Whitelist de IPs configurable

**Estrategias por Categoria:**

| Categoria | Limite | Ventana | Endpoints |
|-----------|--------|---------|-----------|
| `authLimiter` | 5 req | 15 min | /api/auth/login, /api/auth/register |
| `searchLimiter` | 30 req | 1 min | /api/doctors, /api/specialties |
| `generalLimiter` | 100 req | 15 min | GET endpoints generales |
| `creationLimiter` | 10 req | 1 min | POST appointments, reviews |
| `adminLimiter` | 200 req | 15 min | Admin endpoints |
| `socketLimiter` | 100 eventos | 1 min | WebSocket events |

**Respuesta cuando se excede el limite:**
```json
{
  "error": "Rate limit exceeded",
  "message": "Demasiados intentos. Intente nuevamente en 14 minutos",
  "code": "RATE_LIMIT_AUTH",
  "retryAfter": 840,
  "limit": 5,
  "remaining": 0
}
```

**Uso en Rutas:**
```javascript
const { authLimiter, searchLimiter } = require('./middleware/rateLimiter');

// Aplicar a rutas de autenticacion
app.use('/api/auth', authLimiter, authRoutes);

// Aplicar a rutas de busqueda
app.get('/api/doctors', searchLimiter, doctorController.search);
```

**Whitelist de IPs:**
- Configurar via RATE_LIMIT_WHITELIST env var
- Paths excluidos: /api/health, /api-docs
- API keys de servicios confiables

**Variables de Entorno:**
```bash
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WHITELIST=127.0.0.1,::1
RATE_LIMIT_GENERAL_MAX=100
RATE_LIMIT_GENERAL_WINDOW=900000
RATE_LIMIT_AUTH_MAX=5
RATE_LIMIT_AUTH_WINDOW=900000
```

**Graceful Degradation:**
- Si Redis no esta disponible, usa almacenamiento en memoria
- La aplicacion sigue funcionando sin interrupciones

### Security Hardening

Implementacion de medidas de seguridad enterprise (OWASP Top 10):

**Security Headers (Helmet.js):**

| Header | Proteccion |
|--------|------------|
| Content-Security-Policy | XSS, Injection |
| X-Frame-Options | Clickjacking |
| X-Content-Type-Options | MIME sniffing |
| Strict-Transport-Security | MITM (produccion) |
| Referrer-Policy | Information leakage |

**Input Sanitization:**
- NoSQL Injection protection (express-mongo-sanitize)
- XSS sanitization (custom implementation)
- HTTP Parameter Pollution protection (hpp)
- Content-Type validation
- Payload size limits

**Input Validation (express-validator):**
```javascript
// Ejemplo de validacion en rutas
const { registerValidator, validationErrorHandler } = require('./validators');

router.post('/register', registerValidator, validationErrorHandler, controller.register);
```

**Validators Disponibles:**
- `authValidator.js` - Login, Register, Password reset
- `doctorValidator.js` - Busqueda, Perfil
- `appointmentValidator.js` - Crear, Actualizar, Cancelar

**CORS Configuration:**
```javascript
// Development
allowedOrigins: ['http://localhost:5173']

// Production
allowedOrigins: ['https://citamed.ve']
```

**Variables de Entorno:**
```bash
ENFORCE_HTTPS=false
ALLOWED_ORIGINS=http://localhost:5173,http://127.0.0.1:5173
MAX_PAYLOAD_SIZE=10485760
```

**npm audit:**
```bash
# Verificar vulnerabilidades
npm audit

# Corregir automaticamente
npm audit fix
```

**Documentacion completa:** `backend/docs/SECURITY_AUDIT.md`

### Monitoring & Logging

Sistema completo de monitoreo y logging estructurado para observabilidad en produccion:

**Winston Logger:**
- Logs estructurados en formato JSON
- Rotacion diaria automatica de archivos
- Niveles: error, warn, info, http, debug
- Console colorizado en desarrollo

**Morgan HTTP Logging:**
- Request logging integrado con Winston
- Skip automatico de health checks
- Formato JSON para parsing automatizado

**Metricas de Performance:**
- Response time tracking por endpoint
- Deteccion automatica de requests lentos (>1s)
- Memory usage snapshots
- Query timing de base de datos

**Archivos de Log:**
```
backend/logs/
├── error.log      # Solo errores (max 5MB, 5 files)
├── combined.log   # Todos los niveles (max 10MB, 5 files)
└── http-YYYY-MM-DD.log  # HTTP requests (14 dias)
```

**Endpoints de Metricas:**

| Endpoint | Descripcion | Acceso |
|----------|-------------|--------|
| `GET /api/health` | Health check basico | Publico |
| `GET /api/metrics/health` | Health check detallado | Publico |
| `GET /api/metrics` | Dashboard completo | Admin |
| `GET /api/metrics/requests` | Metricas de requests | Admin |
| `GET /api/metrics/errors` | Metricas de errores | Admin |
| `GET /api/metrics/database` | Queries lentas | Admin |

**Ejemplo de Health Check:**
```json
{
  "status": "healthy",
  "timestamp": "2024-12-14T10:30:00.000Z",
  "responseTime": "15ms",
  "version": "1.0.0",
  "checks": {
    "database": { "status": "healthy", "latency": "12ms" },
    "memory": { "status": "healthy", "heapUsed": "85MB" }
  },
  "uptime": 3600
}
```

**Variables de Entorno:**
```bash
LOG_LEVEL=debug              # error, warn, info, http, debug
SLOW_REQUEST_THRESHOLD=1000  # Umbral para alertas (ms)
SLOW_QUERY_THRESHOLD=200     # Umbral para queries lentas (ms)
```

**Process Error Handling:**
- Captura de uncaught exceptions
- Captura de unhandled rejections
- Graceful shutdown en SIGTERM
- Flush de logs antes de exit

---

## Deployment

### Desarrollo Local

```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### Docker (Recomendado)

```bash
# Configurar variables de entorno
cp .env.docker.example .env
# Editar .env con tus valores

# Levantar todos los servicios
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

### CI/CD Pipeline (GitHub Actions)

El proyecto incluye un pipeline completo de CI/CD en `.github/workflows/deploy.yml`.

#### Flujo de Deploy

```
push develop → build → staging (auto) → smoke tests → rollback si falla
manual trigger → build → production (con aprobación)
```

#### Jobs del Pipeline

| Job | Descripcion | Trigger |
|-----|-------------|---------|
| `build-backend` | Construye imagen Docker backend | Auto |
| `build-frontend` | Construye imagen Docker frontend | Auto |
| `deploy-staging` | Deploy automatico a staging | Push a develop |
| `smoke-tests` | Health checks post-deploy | Auto |
| `rollback` | Revierte si smoke tests fallan | Auto si falla |
| `deploy-production` | Deploy manual a produccion | workflow_dispatch |

#### Configurar GitHub Secrets

En tu repositorio: **Settings → Secrets and variables → Actions**

| Secret | Descripcion | Ejemplo |
|--------|-------------|---------|
| `STAGING_HOST` | IP/hostname servidor staging | `staging.citamed.ve` |
| `STAGING_URL` | URL completa staging | `https://staging.citamed.ve` |
| `PRODUCTION_HOST` | IP/hostname servidor produccion | `citamed.ve` |
| `PRODUCTION_URL` | URL completa produccion | `https://citamed.ve` |
| `DEPLOY_USER` | Usuario SSH para deploy | `deploy` |
| `DEPLOY_KEY` | Clave SSH privada | `-----BEGIN OPENSSH...` |
| `VITE_API_URL` | URL del backend API | `https://api.citamed.ve` |

#### Deploy Manual a Produccion

1. Ir a **Actions** en GitHub
2. Seleccionar **Deploy Pipeline**
3. Click **Run workflow**
4. Seleccionar `environment: production`
5. Opcional: especificar `image_tag` (default: latest)
6. Click **Run workflow**

#### Rollback Manual

Si el rollback automatico falla:

```bash
# SSH al servidor
ssh deploy@citamed.ve

# Ir al directorio
cd /opt/citamed

# Restaurar imagenes anteriores
docker tag ghcr.io/usuario/citamed/backend:rollback ghcr.io/usuario/citamed/backend:current
docker tag ghcr.io/usuario/citamed/frontend:rollback ghcr.io/usuario/citamed/frontend:current

# Reiniciar servicios
docker-compose down
docker-compose up -d
```

#### Troubleshooting

| Problema | Solucion |
|----------|----------|
| Build falla | Verificar Dockerfile y dependencias |
| Push a ghcr.io falla | Verificar permisos del GITHUB_TOKEN |
| SSH connection refused | Verificar DEPLOY_KEY y firewall |
| Smoke tests fallan | Revisar logs: `docker-compose logs` |
| Rollback no funciona | Verificar que exista imagen :rollback |

### Infraestructura Recomendada

| Componente | Opcion Recomendada | Alternativas |
|------------|-------------------|--------------|
| Backend | Railway / AWS ECS | Heroku, DigitalOcean |
| Frontend | Vercel / Netlify | CloudFlare Pages |
| Base de Datos | Railway PostgreSQL | AWS RDS, Supabase |
| Registry | GitHub Container Registry | Docker Hub |

---

## Contribucion

### Flujo de Trabajo

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/NuevaFuncionalidad`)
3. Commit cambios (`git commit -m 'feat: Agregar nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/NuevaFuncionalidad`)
5. Abrir Pull Request

### Estandares de Codigo

- ESLint configurado
- Tests para nuevas funcionalidades
- Documentacion Swagger para nuevos endpoints
- Commits semanticos (feat, fix, docs, test)

---

## Roadmap

### Completado (Fundaciones)

- [x] Autenticacion JWT multi-rol
- [x] Directorio de medicos
- [x] Sistema de perfiles
- [x] Testing automatizado (50 tests)
- [x] CI/CD con GitHub Actions
- [x] Documentacion Swagger OpenAPI 3.0

### En Desarrollo (MVP)

- [ ] Sistema de citas (Agendamiento)
- [ ] Sala de espera virtual ("Las Sillitas")
- [ ] Integracion WhatsApp Business API
- [ ] Panel de medicos
- [ ] Dashboard pacientes

### Proximamente (Modulos Core)

- [ ] MARKETMED (Marketplace)
- [ ] CITAMED PAGA (Garante de pagos)
- [ ] Telemedicina
- [ ] Sistema de reputacion
- [ ] Plan de fidelizacion

---

## Contacto

**CITAMED.VE - Ecosistema Digital de Salud**

- Website: [www.citamed.ve](https://www.citamed.ve)
- Email: info@citamed.ve
- WhatsApp: +58 XXX XXX XXXX

---

## Licencia

Proyecto privado. Todos los derechos reservados 2025 CITAMED.VE

---

**Desarrollado con amor en Venezuela**

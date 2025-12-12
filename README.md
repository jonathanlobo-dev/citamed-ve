# CITAMED.VE - Ecosistema de Salud Digital para Venezuela

![CI Tests](https://github.com/USUARIO/CITAMED.VE/actions/workflows/ci.yml/badge.svg)

## Estado del Proyecto

| Aspecto | Estado |
|---------|--------|
| Tests Automatizados | 44 passed |
| CI/CD | GitHub Actions |
| Coverage | 32% |
| Backend | Node.js + PostgreSQL |
| Frontend | React + Vite |

## Testing Local

```bash
cd backend
npm test
npm run test:coverage
```

---


## 🏥 Descripción del Proyecto

CITAMED.VE es una plataforma integral de salud digital diseñada para conectar pacientes, médicos y proveedores en Venezuela. El ecosistema incluye 4 módulos principales:

1. **Agendamiento Inteligente** - Sistema de turnos virtuales (ACTIVO)
2. **Telemedicina** - Consultas por videollamada HD
3. **MarketMed** - Marketplace médico con sistema de referidos
4. **Citamed Paga** - Sistema de escrow y financiamiento

---

## 📋 Tabla de Contenidos

- [Stack Tecnológico](#-stack-tecnológico)
- [Estructura del Proyecto](#-estructura-del-proyecto)
- [Instalación y Configuración](#-instalación-y-configuración)
- [Funcionalidades Implementadas](#-funcionalidades-implementadas)
- [Pendientes](#-pendientes)
- [Scripts Disponibles](#-scripts-disponibles)
- [Base de Datos](#-base-de-datos)
- [API Endpoints](#-api-endpoints)

---

## 🛠 Stack Tecnológico

### Frontend
- **React 19** - Framework principal
- **Vite** - Build tool y dev server
- **React Router DOM v7.9.6** - Navegación y rutas
- **Tailwind CSS** - Estilos utility-first
- **Framer Motion** - Animaciones
- **Axios** - HTTP client
- **React Hot Toast** - Notificaciones
- **Lucide React** - Iconos

### Backend
- **Node.js + Express.js** - Servidor API REST
- **PostgreSQL** - Base de datos relacional
- **Sequelize ORM** - Manejo de base de datos
- **bcrypt** - Hash de contraseñas
- **jsonwebtoken (JWT)** - Autenticación
- **dotenv** - Variables de entorno
- **CORS** - Cross-origin requests

---

## 📁 Estructura del Proyecto

```
proyecto/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── common/
│   │   │       ├── Navbar/
│   │   │       │   └── Navbar.jsx          # Navbar enterprise (NUEVO)
│   │   │       ├── ModuleCard/
│   │   │       └── button/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx             # Página principal + Buscador (ACTUALIZADO)
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegistroPage.jsx            # Con parámetro role en URL
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── DirectorioMedicoPage.jsx    # Conectado a médicos reales (ACTUALIZADO)
│   │   │   ├── ClinicasPage.jsx            # Nueva página (NUEVO)
│   │   │   ├── SegurosPage.jsx             # Nueva página (NUEVO)
│   │   │   └── modules/
│   │   │       ├── AgendamientoPage.jsx
│   │   │       ├── TelemedicinaPage.jsx
│   │   │       ├── MarketMedPage.jsx
│   │   │       └── CitamedPagaPage.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   └── App.jsx                         # Rutas principales
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   │   ├── index.js                    # Configuración Sequelize
│   │   │   ├── User.js
│   │   │   ├── DoctorProfile.js
│   │   │   ├── PatientProfile.js
│   │   │   ├── Specialty.js
│   │   │   └── Appointment.js
│   │   ├── controllers/
│   │   │   └── authController.js           # Login y registro
│   │   ├── middleware/
│   │   │   └── auth.js                     # JWT verification
│   │   └── server.js                       # Servidor principal
│   ├── routes/
│   │   └── auth.js
│   ├── reset-users.js                      # Script para limpiar usuarios de prueba (NUEVO)
│   └── package.json
│
└── README.md                                # Este archivo
```

---

## 🚀 Instalación y Configuración

### Requisitos Previos
- Node.js 18+
- PostgreSQL 14+
- Git

### 1. Clonar el repositorio
```bash
git clone <repository-url>
cd proyecto
```

### 2. Configurar Backend

```bash
cd backend
npm install
```

**Crear archivo `.env`:**
```env
PORT=5000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=citamed_development
DB_USER=postgres
DB_PASSWORD=tu_password
JWT_SECRET=tu_secret_key_muy_segura
JWT_EXPIRES_IN=7d
NODE_ENV=development
```

**Crear base de datos PostgreSQL:**
```sql
CREATE DATABASE citamed_development;
```

**Iniciar backend:**
```bash
npm start
# O en modo desarrollo:
npm run dev
```

El servidor estará en: `http://localhost:5000`

### 3. Configurar Frontend

```bash
cd frontend
npm install
npm run dev
```

El frontend estará en: `http://localhost:5173`

---

## ✅ Funcionalidades Implementadas

### 1. **Navbar Enterprise** ⭐ NUEVO
- Visible en TODAS las páginas de la aplicación
- Navegación completa:
  - Inicio
  - Módulos (scroll suave)
  - Directorio Médico
  - Clínicas Afiliadas
  - Seguros Afiliados
  - Beneficios (scroll suave)
  - FAQ (scroll suave)
- **Saludo personalizado con nombre del usuario**
  - Muestra "Dr. [Nombre]" para médicos
  - Muestra primer nombre para pacientes
  - Muestra rol (Médico/Paciente/Proveedor)
  - Diseño destacado con gradiente
- Botón "Crear Cuenta" más visible (tamaño md, con shadow)
- Responsive desktop y mobile con menú hamburguesa
- Integrado con AuthContext

### 2. **Sistema de Autenticación JWT**
- Registro de usuarios (patient, doctor, provider)
- Login con JWT tokens
- Protección de rutas privadas
- Almacenamiento seguro en localStorage
- Validación de correos duplicados
- Hash de contraseñas con bcrypt

### 3. **Landing Page Profesional** ⭐ ACTUALIZADO
- Hero section con animaciones
- **Buscador de médicos por especialidad** ⭐ NUEVO
  - Selector dropdown con todas las especialidades
  - 6 especialidades populares como botones rápidos
  - Redirige a Directorio con filtro aplicado
- Sección de beneficios (Pacientes, Médicos, Proveedores)
- 4 módulos del ecosistema con ModuleCards
- FAQ profesional con 6 preguntas frecuentes
- Footer completo

### 4. **Directorio Médico Dinámico** ⭐ ACTUALIZADO
- **Conectado a base de datos real**
- Muestra médicos registrados desde PostgreSQL
- Filtros funcionales:
  - Por especialidad (dropdown + chips)
  - Por nombre/ciudad (search bar)
  - Acepta parámetro `?specialty=` desde URL
- Cards de médicos con:
  - Foto de perfil o iniciales
  - Nombre completo con "Dr."
  - Especialidad y matrícula MPPS
  - Rating con estrellas
  - Años de experiencia
  - Ubicación (ciudad, estado)
  - Tarifa de consulta
  - Bio/descripción
  - Botón "Agendar Cita"
- Estados vacíos profesionales
- Loading y error states

### 5. **Página Clínicas Afiliadas** ⭐ NUEVO
- Diseño enterprise profesional
- Filtros por ciudad
- Banner informativo sobre red CITAMED
- Empty state con CTA para afiliación
- Beneficios destacados
- Estructura lista para backend

### 6. **Página Seguros Afiliados** ⭐ NUEVO
- Diseño enterprise profesional
- Filtros por tipo de seguro
- Beneficios para aseguradoras
- Beneficios para usuarios con seguro
- CTA para contacto de alianzas
- Estructura lista para backend

### 7. **Páginas de Módulos**
- AgendamientoPage (placeholder profesional)
- TelemedicinaPage (placeholder profesional)
- MarketMedPage (placeholder profesional)
- CitamedPagaPage (placeholder profesional)

### 8. **Dashboard**
- Página protegida con autenticación
- Placeholder para futuras funcionalidades

### 9. **Base de Datos PostgreSQL**
- Modelos Sequelize configurados:
  - `users` - Usuarios del sistema
  - `doctor_profiles` - Perfiles de médicos
  - `patient_profiles` - Perfiles de pacientes
  - `specialties` - Especialidades médicas (41 especialidades precargadas)
  - `appointments` - Citas médicas
- Relaciones establecidas
- Migraciones automáticas con Sequelize

---

## 🔄 Pendientes

### Prioridad Alta 🔴

1. **Dashboards Separados por Rol**
   - Dashboard específico para Pacientes
   - Dashboard específico para Médicos
   - Dashboard específico para Proveedores
   - Cada uno con funcionalidades propias

2. **Sistema de Agendamiento Completo**
   - Calendario de disponibilidad de médicos
   - Reserva de citas por pacientes
   - Notificaciones por email/SMS
   - Gestión de turnos

3. **Verificación de Médicos**
   - Workflow de aprobación de médicos
   - Validación de matrícula MPPS
   - Subida de documentos (título, cédula)
   - Panel de administración

4. **Sistema de Pagos (Citamed Paga)**
   - Integración con pasarelas de pago Venezuela
   - Sistema de escrow
   - Manejo de múltiples monedas (Bs, USD)
   - Procesamiento de pagos móviles

### Prioridad Media 🟡

5. **Telemedicina**
   - Integración de videollamadas (Twilio/Agora)
   - Chat en tiempo real
   - Compartir archivos médicos
   - Grabación de consultas (opcional)

6. **MarketMed**
   - Catálogo de farmacias
   - Catálogo de laboratorios
   - Sistema de referidos (3% para médicos)
   - Recetas digitales

7. **Historial Médico**
   - Registro de consultas
   - Subida de exámenes
   - Diagnósticos y tratamientos
   - Exportar historial (PDF)

8. **Sistema de Reviews**
   - Calificación de médicos (1-5 estrellas)
   - Comentarios de pacientes
   - Moderación de reviews
   - Estadísticas de satisfacción

### Prioridad Baja 🟢

9. **Clínicas Afiliadas (Backend)**
   - Modelo de base de datos para clínicas
   - Registro de clínicas
   - Directorio de clínicas
   - Integración con agenda

10. **Seguros Afiliados (Backend)**
    - Modelo de base de datos para seguros
    - Integración con aseguradoras
    - Verificación de cobertura
    - Procesamiento de reembolsos

11. **Notificaciones Push**
    - Firebase Cloud Messaging
    - Notificaciones de citas
    - Recordatorios automáticos

12. **App Móvil (PWA)**
    - Convertir a Progressive Web App
    - Instalable en móviles
    - Offline functionality
    - Push notifications

13. **Analytics y Reportes**
    - Dashboard de estadísticas
    - Reportes de citas
    - Ingresos de médicos
    - Métricas de uso

---

## 📜 Scripts Disponibles

### Backend

```bash
# Iniciar servidor
npm start

# Iniciar en modo desarrollo (con nodemon)
npm run dev

# Resetear usuarios de prueba
node reset-users.js

# Sincronizar base de datos
node sync-db-module2.js
```

### Frontend

```bash
# Iniciar servidor de desarrollo
npm run dev

# Build para producción
npm run build

# Preview build de producción
npm run preview

# Limpiar cache de Vite
rm -rf node_modules/.vite dist .vite
```

---

## 🗄 Base de Datos

### Modelos Principales

#### Users
```javascript
{
  id: INTEGER (PK),
  email: STRING (unique),
  password: STRING (hashed),
  name: STRING,
  phone: STRING,
  role: ENUM('patient', 'doctor', 'provider', 'admin', 'clinic', 'insurer'),
  isActive: BOOLEAN
}
```

#### DoctorProfile
```javascript
{
  id: INTEGER (PK),
  userId: INTEGER (FK -> users),
  firstName: STRING,
  lastName: STRING,
  licenseNumber: STRING,
  subSpecialty: STRING,
  experienceYears: INTEGER,
  consultationFee: DECIMAL,
  city: STRING,
  state: STRING,
  averageRating: DECIMAL,
  totalReviews: INTEGER,
  bio: TEXT,
  profilePhoto: STRING,
  isVerified: BOOLEAN,
  acceptingNewPatients: BOOLEAN,
  profileStatus: ENUM('pending', 'active', 'suspended')
}
```

#### PatientProfile
```javascript
{
  id: INTEGER (PK),
  userId: INTEGER (FK -> users),
  firstName: STRING,
  lastName: STRING,
  dateOfBirth: DATE,
  gender: ENUM('male', 'female', 'other'),
  bloodType: STRING,
  emergencyContactName: STRING,
  emergencyContactPhone: STRING
}
```

#### Specialty
```javascript
{
  id: INTEGER (PK),
  name: STRING,
  description: TEXT,
  category: STRING,
  isActive: BOOLEAN
}
```

### Especialidades Precargadas (41)

Medicina General, Cardiología, Pediatría, Ginecología y Obstetricia, Traumatología, Dermatología, Oftalmología, Otorrinolaringología, Psiquiatría, Psicología Clínica, Neurología, Endocrinología, Gastroenterología, Neumología, Urología, Nefrología, Oncología, Hematología, Reumatología, Infectología, Medicina Interna, Cirugía General, Anestesiología, Radiología, Patología, Medicina Física y Rehabilitación, Nutrición y Dietética, Odontología General, Ortodoncia, Medicina del Deporte, Geriatría, Neonatología, Medicina de Emergencia, Cirugía Cardiovascular, Neurocirugía, Cirugía Plástica y Reconstructiva, Alergología e Inmunología, Medicina Familiar, Cirugía Pediátrica, Genética Médica, Medicina del Trabajo.

---

## 🌐 API Endpoints

### Autenticación

**POST** `/api/auth/register`
```json
{
  "role": "doctor | patient | provider",
  "email": "email@example.com",
  "password": "password123",
  "name": "Juan Pérez",
  "phone": "+58 424-1234567",
  "licenseNumber": "12345" // solo para médicos
}
```

**POST** `/api/auth/login`
```json
{
  "email": "email@example.com",
  "password": "password123"
}
```

**GET** `/api/auth/profile`
- Headers: `Authorization: Bearer <token>`

### Especialidades

**GET** `/api/specialties`
- Retorna todas las especialidades activas

**GET** `/api/specialties/search?q=cardio`
- Busca especialidades por nombre o descripción

### Médicos

**GET** `/api/doctors`
- Query params opcionales:
  - `specialty`: Filtrar por especialidad
  - `city`: Filtrar por ciudad
  - `search`: Buscar por nombre

**GET** `/api/stats`
- Estadísticas generales del sistema

---

## 🎨 Diseño y UX

### Colores del Sistema (Tailwind)
```javascript
primary: '#0B2D4A',        // Azul oscuro institucional
'primary-light': '#1565C0', // Azul medio
secondary: '#00BFA6',       // Verde turquesa
accent: '#FB8C00',          // Naranja
```

### Componentes Reutilizables
- **Navbar** - Enterprise, responsive, con scroll suave
- **Button** - Variantes: primary, secondary, outline, ghost
- **ModuleCard** - Cards animadas para los 4 módulos
- **Toast** - Notificaciones con react-hot-toast

---

## 🔒 Seguridad

### Implementado
- ✅ Hash de contraseñas con bcrypt (10 rounds)
- ✅ JWT tokens con expiración (7 días)
- ✅ Validación de correos duplicados
- ✅ CORS configurado
- ✅ Variables de entorno (.env)
- ✅ SQL injection protection (Sequelize ORM)

### Pendiente
- ⏳ Rate limiting
- ⏳ Validación de entrada (Joi/Yup)
- ⏳ HTTPS en producción
- ⏳ Refresh tokens
- ⏳ 2FA (autenticación de dos factores)

---

## 📊 Estado del Proyecto

**Versión:** 2.5 - Primera Vista Frontend Enterprise

**Progreso General:** ~35% completado

**Módulos Completados:**
- ✅ Infraestructura base (Frontend + Backend)
- ✅ Autenticación JWT
- ✅ Navbar Enterprise
- ✅ Landing Page con buscador
- ✅ Directorio Médico dinámico
- ✅ Páginas Clínicas y Seguros (frontend)
- ✅ Base de datos con especialidades

**Próximos Pasos:**
1. Dashboards separados por rol
2. Sistema de agendamiento
3. Verificación de médicos
4. Sistema de pagos

---

## 👥 Roles de Usuario

### Paciente
- Buscar médicos por especialidad
- Agendar citas
- Ver historial médico
- Pagar consultas

### Médico
- Gestionar agenda y disponibilidad
- Atender consultas presenciales y virtuales
- Ver historial de pacientes
- Recibir pagos automáticos
- Ganar comisiones por referidos (3%)

### Proveedor
- Registrar clínica/farmacia/laboratorio
- Recibir órdenes de médicos
- Gestionar catálogo de servicios
- Pagar comisión a plataforma

---

## 🚨 Solución de Problemas Comunes

### Error: "El email ya está registrado"
```bash
cd backend
node reset-users.js
```

### Error: Cache de Vite mostrando contenido antiguo
```bash
cd frontend
rm -rf node_modules/.vite dist .vite
npm run dev
```

### Error: No se conecta a PostgreSQL
1. Verificar que PostgreSQL esté corriendo
2. Revisar credenciales en `.env`
3. Crear base de datos: `CREATE DATABASE citamed_development;`

### Error: CORS en producción
- Configurar CORS en `backend/src/server.js`
- Agregar dominio del frontend a lista blanca

---

## 📞 Contacto y Soporte

**Proyecto:** CITAMED.VE - Ecosistema de Salud Digital
**Objetivo:** Lanzamiento Nacional Venezuela
**Filosofía:** *"No estamos haciendo paginitas web, estamos haciendo un ecosistema funcional que va a tener miles de usuarios registrados de diferentes roles"*

---

## 📝 Notas de Desarrollo

### Convenciones de Código
- **React**: Functional components con hooks
- **Nombres de archivos**: PascalCase para componentes
- **CSS**: Tailwind utility classes
- **Commits**: Mensajes descriptivos en español

### Estructura de Commits Recomendada
```
feat: Agregar buscador de médicos en Landing Page
fix: Corregir error de registro de médicos
docs: Actualizar README con nuevas funcionalidades
refactor: Mejorar navbar enterprise
```

---

**Última Actualización:** Enero 2025
**Estado:** En Desarrollo Activo
**Licencia:** Privada - CITAMED.VE

---

## 🎯 Visión del Proyecto

CITAMED.VE busca revolucionar la salud digital en Venezuela, conectando a miles de médicos con millones de pacientes a través de una plataforma robusta, escalable y fácil de usar.

**Meta 2025:** 1,000,000+ citas agendadas al año 🚀

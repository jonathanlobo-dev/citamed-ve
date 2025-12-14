# 🏥 CITAMED.VE - ROADMAP MAESTRO DEFINITIVO v3.0

## Ecosistema Integral de Salud Digital para Venezuela

---

**Fecha de Actualización:** 14 de Diciembre, 2025  
**Versión:** 3.0 DEFINITIVA  
**Estado del Proyecto:** En Desarrollo Activo  
**Calificación Actual:** 8.9/10  
**Fase Actual:** Fundaciones - Semana 4 (Deploy Profesional)

---

## 📊 RESUMEN EJECUTIVO

CITAMED.VE es el ecosistema digital de salud más completo de Venezuela, diseñado para conectar pacientes, médicos y proveedores de servicios de salud en una plataforma integral, segura y escalable. El proyecto se encuentra en fase de fundaciones técnicas, con 14 de 100 tareas completadas y una arquitectura sólida basada en principios enterprise.

### Cifras Clave del Proyecto

| Métrica | Valor |
|---------|-------|
| Progreso Global | 14% (14/100 tareas) |
| Módulos Principales | 12 módulos core |
| Calificación Técnica | 8.9/10 |
| Inversión Requerida | $160,000 USD |
| ROI Proyectado (3 años) | 25X |
| Break-even | Mes 10 del Año 1 |
| Mercado Objetivo | 60,000 médicos |
| TAM Venezuela | 3,400 médicos privados |

### Estado Global del Desarrollo

```
Progreso General: ████░░░░░░░░░░░░░░░░ 14%
Módulos Completados: 0/12
Módulos En Progreso: 2/12
Módulos Pendientes: 10/12
```

---

## 🌐 ARQUITECTURA DEL ECOSISTEMA

### Diagrama de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                    CITAMED.VE ECOSYSTEM                      │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
    ┌───▼────┐          ┌────▼────┐          ┌────▼────┐
    │FRONTEND│          │ BACKEND │          │DATABASE │
    │  (PWA) │◄────────►│  (API)  │◄────────►│  (SQL)  │
    └───┬────┘          └────┬────┘          └────┬────┘
        │                    │                     │
┌───────▼──────────┬─────────▼──────────┬──────────▼─────────┐
│ MÓDULOS PÚBLICOS │   MÓDULOS CORE     │   INTEGRACIONES    │
└──────────────────┴────────────────────┴────────────────────┘
```

### Stack Tecnológico

**Frontend:**
- React 18 con Vite
- Tailwind CSS para estilos
- Zustand para estado global
- Socket.io Client para real-time
- WebRTC para videollamadas

**Backend:**
- Node.js 20+ con Express.js
- Sequelize ORM
- JWT para autenticación
- Socket.io para WebSockets
- Redis para cache

**Base de Datos:**
- PostgreSQL 16 (principal)
- Redis 7 (cache y sessions)

**Integraciones Externas:**
- WhatsApp Business API
- Google Maps API
- Stripe/PayPal (pagos)
- Twilio (SMS)
- SendGrid (email)
- Anthropic Claude / OpenAI GPT-4 (IA)

**Infraestructura:**
- Docker + Docker Compose
- GitHub Actions (CI/CD)
- AWS / Railway (producción)
- Cloudflare (CDN)

---

## ⭐ LOS 12 MÓDULOS PRINCIPALES

### Orden de Prioridad y Dependencias

El desarrollo de CITAMED.VE está organizado en 12 módulos principales, cada uno con submódulos específicos. La estructura modular permite desarrollo paralelo mientras se respetan las dependencias técnicas. A continuación se presenta cada módulo en orden de prioridad de implementación.

---

## 🔐 M01: AUTENTICACIÓN Y GESTIÓN DE USUARIOS

**Prioridad:** 🔴 CRÍTICA  
**Estado:** 🟡 EN PROGRESO (40%)  
**Dependencias:** Ninguna (Módulo base)  
**Tiempo Estimado:** 2 semanas

### Descripción General

Este módulo constituye la base de seguridad de toda la plataforma. Proporciona autenticación robusta con JWT, registro multi-paso diferenciado por roles, verificación de identidad y gestión completa de permisos basada en roles (RBAC). Es el primer módulo que debe completarse antes de avanzar con cualquier otro.

### Submódulos

**M01.1: Autenticación JWT** - ✅ COMPLETADO (100%)
Sistema de tokens seguros con refresh tokens, expiración configurable y validación en cada request. Implementación completa con middleware de autenticación.

**M01.2: Registro Básico** - ✅ COMPLETADO (100%)
Formulario de registro simple con validación de email, contraseña segura y selección de rol inicial. Base de datos configurada con tabla users.

**M01.3: Registro Multi-Paso por Rol** - ⏸️ PENDIENTE (0%)
Wizard de registro diferenciado para pacientes (4 pasos), médicos (6 pasos) y proveedores (5 pasos). Incluye validación progresiva y guardado de estado.

**M01.4: Verificación Email/SMS** - ⏸️ PENDIENTE (0%)
Sistema de tokens temporales para verificación de cuenta por email y SMS. Integración con SendGrid y Twilio.

**M01.5: Autenticación de Dos Factores (2FA)** - ⏸️ PENDIENTE (0%)
Capa adicional de seguridad con códigos TOTP o SMS para usuarios que requieran mayor protección.

**M01.6: Recuperación de Contraseña** - ⏸️ PENDIENTE (0%)
Flow completo de "olvidé mi contraseña" con tokens únicos, validación temporal y reseteo seguro.

**M01.7: Gestión de Permisos (RBAC)** - ⏸️ PENDIENTE (0%)
Sistema de roles y permisos granulares: patient, doctor, provider, admin. Middleware de autorización por endpoint.

**M01.8: Gestión de Sesiones** - ⏸️ PENDIENTE (0%)
Control de sesiones activas, logout remoto, detección de dispositivos múltiples y límite de sesiones simultáneas.

**M01.9: Auditoría de Accesos** - ⏸️ PENDIENTE (0%)
Registro completo de intentos de login, cambios de contraseña, actividad sospechosa y alertas de seguridad.

### Componentes Frontend

- ✅ LoginForm.jsx (100%)
- 🟡 RegisterForm.jsx (60%)
- ⏸️ RegisterWizard.jsx (0%)
- ⏸️ RoleSelector.jsx (0%)
- ⏸️ TwoFactorAuth.jsx (0%)
- ⏸️ PasswordRecovery.jsx (0%)
- ⏸️ ProfileSettings.jsx (0%)

### Endpoints Backend

- ✅ POST /api/auth/register
- ✅ POST /api/auth/login
- ✅ GET /api/auth/profile
- ⏸️ POST /api/auth/verify-email
- ⏸️ POST /api/auth/resend-verification
- ⏸️ POST /api/auth/forgot-password
- ⏸️ POST /api/auth/reset-password
- ⏸️ POST /api/auth/enable-2fa
- ⏸️ POST /api/auth/verify-2fa

### Tablas de Base de Datos

- ✅ users (100%)
- ⏸️ verification_tokens (0%)
- ⏸️ sessions (0%)
- ⏸️ audit_logs (0%)

---

## 👨‍⚕️ M02: PERFILES MÉDICOS Y DE PACIENTES

**Prioridad:** 🔴 CRÍTICA  
**Estado:** 🟢 EN PROGRESO (20%)  
**Dependencias:** M01 (Autenticación)  
**Tiempo Estimado:** 3 semanas

### Descripción General

Este módulo gestiona los perfiles completos de médicos y pacientes, incluyendo información profesional, verificación KYC, especialidades, ubicaciones con mapas, horarios de atención, sistema de reputación con estrellas, y búsqueda avanzada con filtros geográficos. También incluye la gestión de clínicas y centros médicos como organizaciones.

### Submódulos

**M02.1: Perfil de Médico Completo** - 🟡 EN PROGRESO (10%)

Este submódulo abarca toda la información profesional del médico. La tabla base doctor_profiles está creada, pero requiere expansión para soportar especialidades múltiples, educación detallada, certificaciones, experiencia laboral, horarios configurables por día, precios diferenciados por tipo de consulta, geolocalización precisa con mapas, y portafolio visual del consultorio.

Incluye:
- ✅ Tabla base doctor_profiles (100%)
- ⏸️ Especialidades múltiples con tabla de relación many-to-many (0%)
- ⏸️ Educación y certificaciones detalladas (0%)
- ⏸️ Experiencia laboral cronológica (0%)
- ⏸️ Horarios de atención configurables por día y ubicación (0%)
- ⏸️ Precios de consulta diferenciados (presencial, video, domicilio) (0%)
- ⏸️ Ubicación en mapa con geolocalización (latitud, longitud) (0%)
- ⏸️ Portafolio con fotos del consultorio, equipo médico, instalaciones (0%)

**M02.2: Perfil de Paciente Completo** - 🟡 EN PROGRESO (10%)

Perfil completo del paciente con historial médico básico, alergias conocidas, condiciones crónicas, contacto de emergencia, grupo sanguíneo, información de seguro médico, preferencias de comunicación y consentimientos médicos.

Incluye:
- ✅ Tabla base patient_profiles (100%)
- ⏸️ Historial médico básico (condiciones, cirugías previas) (0%)
- ⏸️ Alergias y medicamentos que no puede tomar (0%)
- ⏸️ Contacto de emergencia con relación familiar (0%)
- ⏸️ Grupo sanguíneo y factor RH (0%)
- ⏸️ Información de seguro médico (aseguradora, número de póliza) (0%)

**M02.3: Verificación KYC de Médicos** - ⏸️ PENDIENTE (0%)

Sistema completo de verificación de identidad médica. Los médicos suben documentos oficiales (título universitario, certificado MPPS, cédula), el sistema valida automáticamente cuando es posible, y casos especiales pasan a revisión manual por el equipo de CITAMED. Médicos verificados reciben badge visual y mejor posicionamiento en búsquedas.

**M02.4: Sistema de Reputación con Estrellas ⭐** - ⏸️ PENDIENTE (0%)

Sistema de calificación tipo Mercado Libre / Amazon con niveles progresivos. Los pacientes califican después de cada consulta en cinco dimensiones: puntualidad, trato, claridad, instalaciones y recomendación general. El sistema calcula rating promedio ponderado y asigna niveles según cantidad de consultas y calificación sostenida.

Niveles de reputación:
- ⭐ Nuevo: 0-50 citas, sin requisitos
- ⭐⭐ Bronce: 51-200 citas, rating mínimo 4.0
- ⭐⭐⭐ Plata: 201-500 citas, rating mínimo 4.3
- ⭐⭐⭐⭐ Oro: 501-1000 citas, rating mínimo 4.5
- ⭐⭐⭐⭐⭐ Platino: 1000+ citas, rating mínimo 4.7

Beneficios por nivel:
- Badge visible en perfil
- Prioridad en búsquedas
- Comisiones preferenciales en MARKETMED
- Acceso a premios exclusivos del programa de fidelización

**M02.5: Búsqueda y Filtrado Avanzado** - ⏸️ PENDIENTE (0%)

Motor de búsqueda robusto con múltiples filtros combinables. Los usuarios pueden buscar por especialidad, ubicación con radio en kilómetros usando Google Maps, rango de precio, disponibilidad en fechas específicas, calificación mínima, años de experiencia, idiomas hablados, género del médico, y si acepta seguros específicos. Resultados ordenables por relevancia, precio, distancia o rating.

**M02.6: Clínicas y Centros Médicos** - ⏸️ PENDIENTE (0%)

Gestión de organizaciones médicas. Las clínicas se registran como entidades separadas, pueden tener múltiples sedes con ubicaciones diferentes, administran varios médicos asociados, definen servicios ofrecidos por sede, configuran horarios por ubicación, suben galería de imágenes de instalaciones, y asignan médicos a sedes específicas. Dashboard administrativo para clínicas.

### Componentes Frontend

- ⏸️ DoctorProfile.jsx (0%)
- ⏸️ DoctorOnboarding.jsx (0%)
- ⏸️ PatientProfile.jsx (0%)
- ⏸️ PatientOnboarding.jsx (0%)
- ⏸️ DoctorSearch.jsx (0%)
- ⏸️ DoctorCard.jsx (0%)
- ⏸️ SpecialtySelector.jsx (0%)
- ⏸️ DocumentUpload.jsx (0%)
- ⏸️ MapLocation.jsx (0%)
- ⏸️ RatingStars.jsx (0%)
- ⏸️ ReviewCard.jsx (0%)
- ⏸️ ClinicProfile.jsx (0%)
- ⏸️ ClinicDoctorsList.jsx (0%)

### Endpoints Backend

- ⏸️ GET /api/doctors
- ⏸️ GET /api/doctors/:id
- ⏸️ PUT /api/doctors/:id
- ⏸️ POST /api/doctors/verify
- ⏸️ GET /api/doctors/search
- ⏸️ GET /api/doctors/nearby
- ⏸️ POST /api/doctors/availability
- ⏸️ GET /api/patients/:id
- ⏸️ PUT /api/patients/:id
- ⏸️ POST /api/reviews
- ⏸️ GET /api/reviews/doctor/:doctorId
- ⏸️ GET /api/clinics
- ⏸️ GET /api/clinics/:id/doctors

### Tablas de Base de Datos

- ✅ doctor_profiles (100%)
- ✅ patient_profiles (100%)
- ✅ specialties (100%)
- ⏸️ doctor_specialties (many-to-many) (0%)
- ⏸️ doctor_education (0%)
- ⏸️ doctor_experience (0%)
- ⏸️ doctor_documents (0%)
- ⏸️ doctor_locations (lat, lng, address) (0%)
- ⏸️ patient_medical_history (0%)
- ⏸️ patient_allergies (0%)
- ⏸️ patient_medications (0%)
- ⏸️ reviews (0%)
- ⏸️ rating_stats (0%)
- ⏸️ clinics (0%)
- ⏸️ clinic_doctors (0%)

---

## 📅 M03: AGENDAMIENTO INTELIGENTE + SALA DE ESPERA VIRTUAL ⭐⭐⭐

**Prioridad:** 🔴 CRÍTICA  
**Estado:** ⏸️ NO INICIADO (5%)  
**Dependencias:** M01, M02  
**Tiempo Estimado:** 4 semanas

### Descripción General

Este es el módulo más innovador de CITAMED.VE. Combina un sistema completo de gestión de citas con la revolucionaria "Sala de Espera Virtual", que permite a los pacientes ver su posición en tiempo real y evitar largas esperas en el consultorio. Funciona tanto para consultas presenciales como para teleconsultas.

### 🎯 CONCEPTO CLAVE: SALA DE ESPERA VIRTUAL HÍBRIDA

La sala de espera virtual es una innovación central que transforma la experiencia de atención médica en dos escenarios:

**Escenario 1: Consultas Presenciales (Física)**
El paciente reserva una cita presencial, recibe un link a la sala de espera virtual, ve en tiempo real cuántas personas están antes que él, recibe notificaciones progresivas ("faltan 5 personas", "faltan 2 personas"), puede quedarse en casa o trabajo hasta que sea casi su turno, hace check-in digital al llegar físicamente al consultorio, y es atendido sin largas esperas innecesarias.

**Escenario 2: Teleconsultas (Virtual)**
El paciente reserva una videoconsulta, entra a la sala de espera virtual desde casa, ve su posición en la cola, espera cómodamente, recibe notificación cuando el médico está listo, y se conecta directamente a la videollamada.

### Submódulos

**M03.1: Gestión de Agenda del Médico** - ⏸️ PENDIENTE (0%)

Panel completo para que los médicos configuren su disponibilidad. Permite establecer horarios base por día de la semana, modificar disponibilidad para fechas específicas (vacaciones, eventos), hacer overrides puntuales, visualizar dashboard del día completo con todas las citas, ver lista de pacientes agendados, monitorear en tiempo real la sala de espera física y virtual, enviar notificaciones de cambios o imprevistos, bloquear o liberar slots dinámicamente, gestionar múltiples ubicaciones de atención, y configurar tiempo promedio por consulta y límite diario de citas.

**M03.2: Reserva de Citas por Paciente** - ⏸️ PENDIENTE (0%)

Interfaz amigable donde los pacientes ven disponibilidad real del médico en tiempo real, seleccionan fecha y hora preferida, especifican motivo de consulta, reciben confirmación automática o esperan aprobación manual según configuración del médico, y agregan la cita automáticamente a su calendario personal con recordatorios.

**M03.3: Gestión de Citas** - ⏸️ PENDIENTE (0%)

Sistema completo de administración de citas. Pacientes y médicos pueden cancelar citas con políticas configurables, reprogramar con disponibilidad automática, ver historial completo, gestionar estados (pendiente, confirmada, en espera, en consulta, completada, cancelada, no asistió), hacer check-in digital cuando el paciente llega al consultorio, y recibir notificaciones de cada cambio de estado.

**M03.4: SALA DE ESPERA VIRTUAL ⭐⭐⭐** - ⏸️ PENDIENTE (0%)

El corazón innovador de CITAMED.VE. Sistema de cola visual en tiempo real con dos interfaces diferenciadas:

**Interfaz del Paciente:**
El paciente visualiza "sillitas" representando su posición en la cola, ve exactamente cuántas personas están delante, recibe tiempo estimado de espera dinámico, observa actualizaciones en tiempo real conforme avanza la cola, recibe notificaciones push progresivas ("faltan 5 personas - aprox 30 min", "faltan 2 personas - sal ahora", "siguiente en ser atendido - 5 min", "es tu turno - dirígete al consultorio"), ve ubicación del consultorio en Google Maps con tiempo de viaje estimado desde su ubicación actual, y hace check-in digital al llegar físicamente.

**Interfaz del Médico:**
Dashboard completo del día con todas las citas programadas, lista segmentada de pacientes (por llegar, en sala física, en consulta, completados), vista de sala de espera en tiempo real mostrando quién está físicamente presente, motivo de consulta de cada paciente visible antes de llamarlo, estadísticas de tiempo promedio por consulta, notificación automática cuando paciente hace check-in, botón prominente "Llamar Siguiente Paciente" que actualiza estado y envía notificación al paciente, notas rápidas pre-consulta para preparar atención, y temporizador de consulta actual.

**M03.5: Recordatorios Automatizados** - ⏸️ PENDIENTE (0%)

Sistema multi-canal de recordatorios. Email 24 horas antes con detalles de la cita, SMS 2 horas antes con ubicación, push notification en la app, solicitud de confirmación de asistencia, recordatorio de check-in al llegar, y recordatorios de seguimiento post-consulta si corresponde.

### Componentes Frontend

**Paciente:**
- ⏸️ AppointmentBooking.jsx (0%)
- ⏸️ VirtualWaitingRoom.jsx (0%) ⭐ CORE
- ⏸️ WaitingQueueView.jsx (0%) ⭐ Vista de sillitas
- ⏸️ QueuePosition.jsx (0%) ⭐ Tu posición
- ⏸️ EstimatedWaitTime.jsx (0%) ⭐ Tiempo estimado
- ⏸️ CheckInButton.jsx (0%) ⭐ "Ya llegué"
- ⏸️ NavigationToClinic.jsx (0%) ⭐ Mapa + tiempo
- ⏸️ AppointmentCard.jsx (0%)
- ⏸️ AppointmentList.jsx (0%)
- ⏸️ TimeSlotSelector.jsx (0%)
- ⏸️ CancelAppointment.jsx (0%)
- ⏸️ RescheduleAppointment.jsx (0%)

**Médico:**
- ⏸️ DoctorDayDashboard.jsx (0%) ⭐ CORE
- ⏸️ TodayPatientsView.jsx (0%) ⭐ Lista del día
- ⏸️ WaitingRoomMonitor.jsx (0%) ⭐ Monitoreo sala
- ⏸️ PatientQueueCard.jsx (0%) ⭐ Card de cada paciente
- ⏸️ CallNextPatientButton.jsx (0%) ⭐ Llamar siguiente
- ⏸️ ConsultationTimer.jsx (0%) ⭐ Temporizador
- ⏸️ Calendar.jsx (0%)
- ⏸️ AppointmentDetails.jsx (0%)

### Endpoints Backend

**CRUD Básico:**
- ⏸️ GET /api/appointments
- ⏸️ POST /api/appointments
- ⏸️ GET /api/appointments/:id
- ⏸️ PUT /api/appointments/:id
- ⏸️ DELETE /api/appointments/:id
- ⏸️ GET /api/appointments/availability
- ⏸️ POST /api/appointments/cancel
- ⏸️ POST /api/appointments/reschedule

**SALA DE ESPERA VIRTUAL ⭐:**
- ⏸️ GET /api/queue/doctor/:doctorId (cola completa del médico)
- ⏸️ GET /api/queue/patient/:appointmentId (posición del paciente)
- ⏸️ POST /api/queue/check-in (paciente llegó físicamente)
- ⏸️ POST /api/queue/call-next (médico llama siguiente)
- ⏸️ GET /api/queue/estimate-wait/:appointmentId (tiempo estimado dinámico)
- ⏸️ PUT /api/queue/status (actualizar estado consulta)
- ⏸️ WebSocket /ws/queue/:doctorId (actualizaciones tiempo real)

**GESTIÓN MÉDICO:**
- ⏸️ GET /api/appointments/doctor/today (resumen completo del día)
- ⏸️ PUT /api/appointments/availability/override (cambiar disponibilidad puntual)
- ⏸️ POST /api/appointments/notify-change (notificar cambios masivos)

### Tablas de Base de Datos

- ✅ appointments (100%)
- ⏸️ appointment_slots (0%)
- ⏸️ availability_overrides (0%)
- ⏸️ appointment_reminders (0%)
- ⏸️ appointment_history (0%)
- ⏸️ waiting_queue (0%) ⭐ CORE

### Tabla waiting_queue (CRÍTICA)

```sql
waiting_queue:
  - id (PK)
  - appointment_id (FK)
  - doctor_id (FK)
  - patient_id (FK)
  - position (número en cola)
  - status (waiting, called, in_consultation, completed)
  - check_in_time (timestamp cuando llegó)
  - called_time (timestamp cuando lo llamaron)
  - estimated_wait_minutes (calculado dinámicamente)
  - created_at
  - updated_at
```

### Tecnologías Especiales

- **Socket.io:** Actualizaciones en tiempo real de posición en cola
- **Redis:** Cache de cola, posiciones y estados para performance
- **Google Maps API:** Navegación, cálculo de tiempo de viaje, ubicación

### Flujo de Uso Completo

1. **Paciente Reserva Cita:** Selecciona médico, fecha, hora, motivo
2. **Recibe Confirmación:** Email/SMS/WhatsApp con link a sala de espera virtual
3. **Día de la Cita:** Abre app o navegador
4. **Entra a Sala Virtual:** Ve "Posición #3 - Faltan aprox. 45 min"
5. **Se Queda Cómodo:** En casa o trabajo, no en sala física
6. **Primera Notificación:** "Faltan 2 personas - 20 min aprox"
7. **Sale Rumbo:** Se dirige al consultorio
8. **Llega y Check-In:** Hace check-in en app al llegar
9. **Médico Notificado:** Ve "Paciente llegó ✅" en su dashboard
10. **Avanza Cola:** Ve "Posición #1 - Siguiente"
11. **Notificación Final:** "Es su turno - Pase al consultorio"
12. **Consulta:** Atención sin espera innecesaria

---

## 💬 M04: TELEMEDICINA

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M02, M03  
**Tiempo Estimado:** 3 semanas

### Descripción General

Sistema completo de teleconsulta con videollamadas HD, chat seguro médico-paciente, notas de consulta digitales y recetas electrónicas. Reutiliza la sala de espera virtual de M03 para gestionar cola de teleconsultas.

### Nota Importante

La sala de espera virtual está en M03 ya que es funcionalidad CORE del agendamiento. M04 la reutiliza para organizar teleconsultas de manera que los pacientes también vean su posición cuando esperan videollamada.

### Submódulos

**M04.1: Videoconsulta WebRTC** - ⏸️ PENDIENTE (0%)

Implementación de videollamadas peer-to-peer o mediadas por servidor. Integra con sala de espera de M03 para que paciente entre a sala virtual, espere su turno, y cuando el médico lo llama, se abra automáticamente la videollamada. Incluye sala privada con encriptación, grabación opcional de consulta (con consentimiento), compartir pantalla para mostrar estudios, controles de audio y video, indicadores de calidad de conexión, y chat durante la llamada.

**M04.2: Chat Médico-Paciente** - ⏸️ PENDIENTE (0%)

Sistema de mensajería segura en tiempo real. Chat en vivo con Socket.io, historial completo de conversaciones organizadas por consulta, envío de archivos adjuntos (imágenes, PDFs de estudios), estado "escribiendo..." para feedback inmediato, encriptación end-to-end, y notificaciones push de mensajes nuevos.

**M04.3: Notas de Consulta** - ⏸️ PENDIENTE (0%)

Herramienta para que el médico documente la teleconsulta. Plantillas personalizables por especialidad, campos estructurados para diagnóstico, tratamiento recomendado, observaciones, exámenes solicitados, recetas generadas, y próxima cita sugerida. Almacenamiento en historia clínica electrónica.

**M04.4: Recetas Electrónicas** - ⏸️ PENDIENTE (0%)

Generación de recetas digitales con validez legal. El médico genera receta con formato estándar, firma digitalmente con certificado, envía automáticamente al paciente por email y WhatsApp, incluye QR code para validación en farmacias, y queda registrada en historia clínica con trazabilidad completa.

### Componentes Frontend

- ⏸️ VideoCallRoom.jsx (0%)
- ⏸️ VideoControls.jsx (0%)
- ⏸️ ChatWindow.jsx (0%)
- ⏸️ ConsultationNotes.jsx (0%)
- ⏸️ PrescriptionGenerator.jsx (0%)
- ⏸️ PrescriptionViewer.jsx (0%)
- ⏸️ ScreenShare.jsx (0%)
- ⏸️ ConnectionQuality.jsx (0%)

### Endpoints Backend

- ⏸️ POST /api/telemedicine/room
- ⏸️ GET /api/telemedicine/room/:id
- ⏸️ POST /api/telemedicine/end-call
- ⏸️ GET /api/chat/messages
- ⏸️ POST /api/chat/messages
- ⏸️ POST /api/chat/upload
- ⏸️ POST /api/prescriptions
- ⏸️ GET /api/prescriptions/:id
- ⏸️ POST /api/prescriptions/sign

### Tablas de Base de Datos

- ⏸️ telemedicine_sessions (0%)
- ⏸️ chat_messages (0%)
- ⏸️ prescriptions (0%)
- ⏸️ consultation_notes (0%)

### Integraciones

- **Twilio / Agora:** Infraestructura de video profesional
- **Socket.io:** Chat en tiempo real
- **AWS S3:** Almacenamiento de grabaciones

---

## 📋 M05: HISTORIA CLÍNICA ELECTRÓNICA (EHR)

**Prioridad:** 🔴 CRÍTICA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M02, M04  
**Tiempo Estimado:** 4 semanas

### Descripción General

Sistema completo de historia clínica electrónica que centraliza toda la información médica del paciente. Incluye consultas anteriores, diagnósticos, tratamientos, resultados de laboratorio, imagenología, vacunas, alergias y medicamentos actuales.

### Submódulos

**M05.1: Historial Médico Completo** - ⏸️ PENDIENTE (0%)

Registro cronológico completo de todas las consultas del paciente. Incluye fecha de consulta, médico que atendió, especialidad, motivo de consulta, diagnóstico establecido, tratamiento prescrito, evolución del paciente, próximos pasos, y referencias a otros especialistas si aplica.

**M05.2: Resultados de Laboratorio** - ⏸️ PENDIENTE (0%)

Gestión de resultados de exámenes. Upload de PDFs con resultados, visualización estructurada de valores, gráficos de evolución temporal (comparar hemoglobina en el tiempo, por ejemplo), alertas automáticas de valores anormales fuera de rango, y opción de compartir con otros médicos.

**M05.3: Imagenología (DICOM)** - ⏸️ PENDIENTE (0%)

Visor de imágenes médicas. Upload de archivos DICOM (rayos X, TAC, resonancias), visor especializado con herramientas de zoom, contraste y anotaciones, comparación temporal de estudios (ver evolución de fractura), anotaciones del radiólogo, y almacenamiento seguro en la nube.

**M05.4: Vacunas y Alergias** - ⏸️ PENDIENTE (0%)

Carnet de vacunación digital completo con fechas, lotes y próximas dosis recomendadas. Registro detallado de alergias conocidas (medicamentos, alimentos, sustancias), severidad de cada alergia, reacciones previas documentadas, y alertas automáticas al médico cuando prescribe algo contraindicado.

**M05.5: Medicamentos Actuales** - ⏸️ PENDIENTE (0%)

Lista de medicamentos que el paciente está tomando actualmente. Incluye nombre del medicamento, dosis, frecuencia de toma, hora específica, médico que lo prescribió, fecha de inicio, duración del tratamiento, alarmas de recordatorio de toma en el móvil, detección automática de interacciones medicamentosas peligrosas, y historial de adherencia al tratamiento.

### Componentes Frontend

- ⏸️ MedicalHistory.jsx (0%)
- ⏸️ LabResults.jsx (0%)
- ⏸️ LabResultChart.jsx (0%)
- ⏸️ ImagingViewer.jsx (0%)
- ⏸️ VaccinationCard.jsx (0%)
- ⏸️ MedicationList.jsx (0%)
- ⏸️ AllergyCard.jsx (0%)
- ⏸️ Timeline.jsx (0%)
- ⏸️ HealthSummary.jsx (0%)

### Endpoints Backend

- ⏸️ GET /api/ehr/:patientId
- ⏸️ POST /api/ehr/consultation
- ⏸️ POST /api/ehr/lab-result
- ⏸️ POST /api/ehr/imaging
- ⏸️ GET /api/ehr/medications
- ⏸️ POST /api/ehr/medications
- ⏸️ GET /api/ehr/allergies
- ⏸️ POST /api/ehr/allergies
- ⏸️ GET /api/ehr/vaccinations
- ⏸️ POST /api/ehr/vaccinations

### Tablas de Base de Datos

- ⏸️ medical_history (0%)
- ⏸️ lab_results (0%)
- ⏸️ imaging_studies (0%)
- ⏸️ vaccinations (0%)
- ⏸️ current_medications (0%)
- ⏸️ allergies (0%)

---

## 🛒 M06: MARKETMED (Marketplace Médico) ⭐

**Prioridad:** 🟢 MEDIA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M02, M04, M05  
**Tiempo Estimado:** 5 semanas

### Descripción General

MARKETMED es el marketplace integral de productos y servicios médicos de CITAMED.VE. Unifica farmacias, laboratorios, insumos médicos y servicios de salud en una sola plataforma. Opera con modelo de comisiones: 7% total (3% para el médico que refiere + 4% para CITAMED), permitiendo a los médicos generar ingresos pasivos por cada referencia exitosa.

### 🎯 CONCEPTO CLAVE: ECOSISTEMA UNIFICADO

MARKETMED no son módulos separados de farmacia y laboratorio. Es un marketplace completo donde proveedores de cualquier categoría (farmacias, laboratorios, equipos médicos, servicios) ofrecen sus productos, y los médicos obtienen comisión cuando sus pacientes compran a través de sus referencias.

### Categorías del Marketplace

**1. 💊 Farmacias**
Medicamentos con receta y venta libre. Recetas digitales verificadas automáticamente, validación de stock en tiempo real, envío a domicilio o retiro en sucursal, trazabilidad completa de medicamentos controlados, y alertas de disponibilidad.

**2. 🔬 Laboratorios**
Exámenes clínicos de todo tipo. Órdenes médicas digitales enviadas directamente desde consulta, agendamiento de toma de muestra, resultados automáticos integrados en EHR del paciente, paquetes de exámenes con descuento, y comparación de precios entre laboratorios.

**3. 🏥 Insumos Médicos**
Equipamiento y suministros. Desde nebulizadores y glucómetros hasta sillas de ruedas, oxígeno medicinal, suministros post-operatorios, equipos de protección, y dispositivos de monitoreo.

**4. 💉 Servicios de Salud**
Profesionales y servicios especializados. Enfermería a domicilio, terapias físicas y ocupacionales, rehabilitación, cuidadores profesionales, nutricionistas, psicólogos, y servicios de traslado médico.

### Modelo de Comisiones

| Concepto | Porcentaje | Ejemplo ($100) |
|----------|------------|----------------|
| **Comisión Total** | 7% | $7.00 |
| → Médico Referidor | 3% | **$3.00** |
| → CITAMED | 4% | $4.00 |
| **Proveedor Recibe** | 93% | $93.00 |

**Ejemplo Real:**
Un paciente compra medicamentos por $100 referido por su médico. El proveedor (farmacia) recibe $93 inmediatamente, el médico gana $3 por la referencia, y CITAMED retiene $4 por operar la plataforma.

### Sistema de Niveles para Proveedores

Similar al sistema de reputación de médicos, los proveedores tienen niveles según ventas y calificaciones:

- **🪙 Básico:** $0-$5K/mes, comisión estándar 7%
- **🥉 Bronce:** $5K-$15K/mes, rating 4.0+, comisión 6.5%
- **🥈 Plata:** $15K-$50K/mes, rating 4.3+, comisión 6%
- **🥇 Oro:** $50K+/mes, rating 4.5+, comisión 5%

### Submódulos

**M06.1: Gestión de Proveedores** - ⏸️ PENDIENTE (0%)

Registro y administración de proveedores. Onboarding completo con verificación KYC empresarial, categorización por tipo de servicio, configuración de zonas de cobertura, horarios de atención, políticas de envío, métodos de pago aceptados, y dashboard administrativo.

**M06.2: Catálogo de Productos/Servicios** - ⏸️ PENDIENTE (0%)

Sistema robusto de productos. CRUD completo de productos con fotos, descripciones, especificaciones técnicas, precios, stock en tiempo real, variantes (presentaciones, dosis), categorización multinivel, búsqueda con filtros, y comparador de precios entre proveedores.

**M06.3: Órdenes y Procesamiento** - ⏸️ PENDIENTE (0%)

Gestión completa del ciclo de compra. Carrito de compras multi-proveedor, checkout integrado con pasarelas de pago, orden digital enviada automáticamente al proveedor, estados (recibida, preparando, enviando, entregada), tracking en tiempo real, confirmación de entrega, y sistema de devoluciones.

**M06.4: Sistema de Referidos Médicos** - ⏸️ PENDIENTE (0%)

Motor de afiliación para médicos. Link de referido único por médico, tracking automático de ventas por referencia, cálculo de comisión del 3%, dashboard de ingresos pasivos, pago quincenal de comisiones acumuladas, y reporte fiscal para declaraciones.

**M06.5: Integraciones con Proveedores** - ⏸️ PENDIENTE (0%)

APIs para conectar con sistemas de proveedores. Sincronización de inventario en tiempo real, actualización automática de precios, procesamiento de órdenes, generación de guías de envío, y webhooks para notificaciones de estado.

### Componentes Frontend

**Marketplace General:**
- ⏸️ MarketplaceHome.jsx (0%)
- ⏸️ CategoryBrowser.jsx (0%)
- ⏸️ ProductCard.jsx (0%)
- ⏸️ ProductDetail.jsx (0%)
- ⏸️ ProductSearch.jsx (0%)
- ⏸️ ShoppingCart.jsx (0%)
- ⏸️ Checkout.jsx (0%)
- ⏸️ OrderTracking.jsx (0%)

**Dashboard Proveedor:**
- ⏸️ ProviderDashboard.jsx (0%)
- ⏸️ ProductManagement.jsx (0%)
- ⏸️ OrderManagement.jsx (0%)
- ⏸️ InventoryControl.jsx (0%)

**Dashboard Médico:**
- ⏸️ ReferralDashboard.jsx (0%)
- ⏸️ ReferralLink.jsx (0%)
- ⏸️ CommissionReport.jsx (0%)

### Endpoints Backend

**Productos:**
- ⏸️ GET /api/marketplace/products
- ⏸️ GET /api/marketplace/products/:id
- ⏸️ POST /api/marketplace/products (admin)
- ⏸️ PUT /api/marketplace/products/:id (admin)
- ⏸️ GET /api/marketplace/categories
- ⏸️ GET /api/marketplace/search

**Órdenes:**
- ⏸️ POST /api/marketplace/orders
- ⏸️ GET /api/marketplace/orders/:id
- ⏸️ PUT /api/marketplace/orders/:id/status
- ⏸️ GET /api/marketplace/orders/user/:userId
- ⏸️ GET /api/marketplace/orders/provider/:providerId

**Proveedores:**
- ⏸️ POST /api/marketplace/providers
- ⏸️ GET /api/marketplace/providers/:id
- ⏸️ PUT /api/marketplace/providers/:id
- ⏸️ GET /api/marketplace/providers/search

**Referidos:**
- ⏸️ GET /api/marketplace/referrals/doctor/:doctorId
- ⏸️ GET /api/marketplace/commissions/doctor/:doctorId
- ⏸️ POST /api/marketplace/commissions/payout

### Tablas de Base de Datos

- ⏸️ marketplace_categories (0%)
- ⏸️ marketplace_providers (0%)
- ⏸️ marketplace_products (0%)
- ⏸️ marketplace_inventory (0%)
- ⏸️ marketplace_orders (0%)
- ⏸️ marketplace_order_items (0%)
- ⏸️ marketplace_referrals (0%)
- ⏸️ marketplace_commissions (0%)
- ⏸️ provider_ratings (0%)

---

## 💳 M07: PAGOS Y FACTURACIÓN

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M03, M04, M06  
**Tiempo Estimado:** 3 semanas

### Descripción General

Sistema completo de procesamiento de pagos, facturación electrónica, gestión de comisiones de plataforma, suscripciones y programa de fidelización con puntos canjeables.

### Submódulos

**M07.1: Pasarelas de Pago** - ⏸️ PENDIENTE (0%)

Integración con múltiples métodos de pago. Stripe y PayPal como pasarelas principales, pagos con tarjeta de crédito y débito, transferencias bancarias, pagos móviles (Zelle, Pago Móvil en Venezuela), billeteras electrónicas, procesamiento seguro con PCI compliance, y guardado seguro de métodos de pago para compras recurrentes.

**M07.2: Facturación Electrónica** - ⏸️ PENDIENTE (0%)

Generación automática de facturas. Cumplimiento con SENIAT en Venezuela, numeración correlativa automática, datos fiscales completos, envío por email en PDF, descarga desde dashboard, reporte mensual para contabilidad, y exportación a Excel o formato contable estándar.

**M07.3: Comisiones de Plataforma** - ⏸️ PENDIENTE (0%)

Cálculo y distribución de comisiones. Gestión de citas presenciales ($0.49/cita), teleconsultas (7% del valor), MARKETMED (4% neto para CITAMED + 3% médico), CITAMED PAGA (5-8% según tier), procesamiento automático, retención de impuestos cuando aplica, y pago a médicos y proveedores según calendario establecido.

**M07.4: Suscripciones** - ⏸️ PENDIENTE (0%)

Planes de suscripción opcionales. Plan básico gratuito con comisiones estándar, plan premium con comisiones reducidas y beneficios adicionales, facturación recurrente automática, upgrades y downgrades prorrateados, y período de prueba gratuito.

**M07.5: Programa de Fidelización "CITAMED POINTS"** - ⏸️ PENDIENTE (0%)

Sistema de puntos y recompensas para médicos y pacientes.

**Para Médicos:**
Ganan puntos por citas presenciales atendidas (10 pts), teleconsultas realizadas (15 pts), calificaciones 5 estrellas (25 pts), ventas referidas en MARKETMED (5 pts/$100), bonus por 100 citas/mes (500 pts), bonus por rating 4.8+ sostenido trimestral (1000 pts).

Catálogo de premios:
- Cursos online de especialización (2,000 pts = $100 aprox)
- Equipamiento médico básico (5,000 pts = $250)
- Congreso médico nacional (10,000 pts = $500)
- Viaje + congreso internacional (50,000 pts = $2,500)
- Bono en efectivo (1 pt = $0.05)

**Para Pacientes:**
Ganan puntos por asistencia puntual (5 pts), dejar reseña (10 pts), compras en MARKETMED (2 pts/$10), referir amigos (100 pts).

Canje: Descuentos en consultas, cashback en MARKETMED, consultas gratis, exámenes con descuento.

### Componentes Frontend

- ⏸️ PaymentForm.jsx (0%)
- ⏸️ PaymentMethods.jsx (0%)
- ⏸️ InvoiceList.jsx (0%)
- ⏸️ InvoiceDetail.jsx (0%)
- ⏸️ SubscriptionPlan.jsx (0%)
- ⏸️ SubscriptionManagement.jsx (0%)
- ⏸️ LoyaltyDashboard.jsx (0%)
- ⏸️ PointsBalance.jsx (0%)
- ⏸️ RewardsCatalog.jsx (0%)
- ⏸️ RedeemPoints.jsx (0%)

### Endpoints Backend

- ⏸️ POST /api/payments/charge
- ⏸️ POST /api/payments/methods
- ⏸️ GET /api/invoices
- ⏸️ GET /api/invoices/:id
- ⏸️ POST /api/subscriptions
- ⏸️ PUT /api/subscriptions/:id
- ⏸️ GET /api/loyalty/points/:userId
- ⏸️ POST /api/loyalty/earn
- ⏸️ POST /api/loyalty/redeem
- ⏸️ GET /api/loyalty/rewards

### Tablas de Base de Datos

- ⏸️ payments (0%)
- ⏸️ payment_methods (0%)
- ⏸️ invoices (0%)
- ⏸️ subscriptions (0%)
- ⏸️ loyalty_points (0%)
- ⏸️ loyalty_transactions (0%)
- ⏸️ loyalty_rewards (0%)
- ⏸️ commissions (0%)

---

## 🔔 M08: NOTIFICACIONES MULTI-CANAL

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M03, M04, M05  
**Tiempo Estimado:** 2 semanas

### Descripción General

Sistema completo de notificaciones con múltiples canales de comunicación: email, SMS, WhatsApp Business API, push notifications e in-app. Incluye preferencias configurables por usuario y tipos de notificación.

### Submódulos

**M08.1: Email Notifications** - ⏸️ PENDIENTE (0%)

Notificaciones por correo electrónico. Integración con SendGrid, templates HTML profesionales personalizables, confirmaciones de cita, recordatorios, resultados disponibles, facturas, y reporte de entregas y aperturas.

**M08.2: SMS Notifications** - ⏸️ PENDIENTE (0%)

Mensajes de texto vía Twilio. Recordatorios urgentes 2 horas antes de cita, notificaciones de turno ("es tu turno"), códigos de verificación, y alertas importantes.

**M08.3: WhatsApp Notifications ⭐** - ⏸️ PENDIENTE (0%)

Integración con WhatsApp Business API. El canal preferido en Venezuela con 95% de adopción. Confirmaciones de cita con detalles, recordatorios 24h y 2h antes, notificaciones de sala de espera ("faltan X personas"), alertas de turno ("es tu turno, pasa al consultorio"), resultados de laboratorio disponibles, mensajes del médico, recetas listas, y confirmación de pagos.

**M08.4: Push Notifications** - ⏸️ PENDIENTE (0%)

Notificaciones push móviles vía Firebase Cloud Messaging. Alertas instantáneas en la app, notificaciones de sala de espera en tiempo real, mensajes nuevos del médico, cambios de estado de cita, y recordatorios importantes.

**M08.5: In-App Notifications** - ⏸️ PENDIENTE (0%)

Centro de notificaciones dentro de la aplicación. Bandeja de mensajes no leídos, notificaciones agrupadas por tipo, marcado de leído/no leído, archivo de notificaciones antiguas, y acceso rápido a acciones relacionadas.

**M08.6: Preferencias de Notificación** - ⏸️ PENDIENTE (0%)

Control granular por usuario. Configurar qué notificaciones recibir por qué canal, horarios permitidos (no molestar), frecuencia máxima, idioma preferido, y modo "solo urgentes".

### Tipos de Notificaciones por Prioridad

**Alta Prioridad (WhatsApp + Push + SMS):**
- Cita confirmada
- Recordatorio 2h antes
- "Es tu turno" (sala de espera)
- Cambio de horario por médico
- Cancelación de cita

**Media Prioridad (Email + WhatsApp):**
- Recordatorio 24h antes
- Resultados disponibles
- Receta lista
- Mensaje nuevo del médico
- Pago procesado

**Baja Prioridad (Email + In-App):**
- Newsletter
- Promociones
- Nuevos servicios
- Actualizaciones de plataforma

### Componentes Frontend

- ⏸️ NotificationCenter.jsx (0%)
- ⏸️ NotificationItem.jsx (0%)
- ⏸️ NotificationBadge.jsx (0%)
- ⏸️ NotificationSettings.jsx (0%)
- ⏸️ ChannelPreferences.jsx (0%)

### Endpoints Backend

- ⏸️ GET /api/notifications
- ⏸️ GET /api/notifications/:id
- ⏸️ PUT /api/notifications/:id/read
- ⏸️ PUT /api/notifications/read-all
- ⏸️ PUT /api/notifications/settings
- ⏸️ POST /api/notifications/send

### Tablas de Base de Datos

- ⏸️ notifications (0%)
- ⏸️ notification_preferences (0%)
- ⏸️ notification_log (0%)

### Integraciones

- **SendGrid:** Email transaccional
- **Twilio:** SMS
- **WhatsApp Business API:** Mensajes WhatsApp oficiales
- **Firebase Cloud Messaging:** Push notifications

---

## 💰 M09: CITAMED PAGA (Garante de Financiamiento)

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M07  
**Tiempo Estimado:** 4 semanas

### Descripción General

CITAMED PAGA es un sistema revolucionario de financiamiento médico donde CITAMED actúa como garante de pagos para CUALQUIER proveedor de salud (médicos, farmacias, laboratorios, cirugías, tratamientos). Opera con un modelo de tiers según score crediticio del paciente, siempre con 0% de interés para el paciente.

### 🎯 CONCEPTO CLAVE: GARANTE, NO SOLO PASARELA

CITAMED PAGA no es simplemente un sistema de pagos. Es una GARANTÍA donde CITAMED asume el riesgo de mora. Si el paciente no paga alguna cuota, CITAMED paga al proveedor de todos modos. El paciente siempre paga 0% de interés.

### Modelo de Negocio

| Actor | Función | Beneficio |
|-------|---------|-----------|
| **Paciente** | Paga en cuotas sin interés | Acceso a salud financiado 0% interés |
| **Proveedor** | Recibe pago inmediato menos comisión | Liquide inmediata, sin riesgo |
| **CITAMED** | Cobra comisión + asume riesgo mora | Gana comisión, construye historial crediticio |

### Sistema de Tiers (según Score Crediticio)

**TIER 1 - BÁSICO:**
- Límite de crédito: $100
- Paciente paga: 0% interés
- Cuotas disponibles: 2-3 cuotas
- Comisión CITAMED: 8%
- Ejemplo: Compra $100 → Paga $33.33 x 3 meses

**TIER 2 - INTERMEDIO:**
- Límite de crédito: $500
- Paciente paga: 0% interés
- Cuotas disponibles: 3-6 cuotas
- Comisión CITAMED: 6%
- Ejemplo: Compra $500 → Paga $83.33 x 6 meses

**TIER 3 - AVANZADO:**
- Límite de crédito: $2,000
- Paciente paga: 0% interés
- Cuotas disponibles: 6-12 cuotas
- Comisión CITAMED: 5%
- Ejemplo: Compra $2,000 → Paga $166.67 x 12 meses

**TIER 4 - PREMIUM:**
- Límite de crédito: $5,000
- Paciente paga: 0% interés
- Cuotas disponibles: 12-24 cuotas
- Comisión CITAMED: 4%
- Ejemplo: Compra $5,000 → Paga $208.33 x 24 meses

### Ejemplo de Flujo Completo

**Consulta Médica de $50 (Tier 2):**

1. Paciente agenda cita de $50
2. Selecciona "Financiar en 3 cuotas" (Tier 2 permite hasta 6)
3. Paga 1ra cuota de $16.67 al confirmar cita
4. CITAMED recibe los $16.67 y los retiene (escrow)
5. Paciente asiste a consulta
6. CITAMED libera inmediatamente $47 al médico (50 - 6% comisión)
7. CITAMED se queda $3 de comisión
8. A los 30 días: CITAMED cobra automáticamente $16.67 (2da cuota)
9. A los 60 días: CITAMED cobra automáticamente $16.67 (3ra cuota)
10. Si el paciente NO paga la 2da o 3ra cuota: CITAMED asume la pérdida (el médico ya cobró su 100%)

### Aplica para Múltiples Servicios

- ✅ Consultas médicas
- ✅ Medicamentos (farmacias)
- ✅ Exámenes de laboratorio
- ✅ Procedimientos médicos
- ✅ Cirugías
- ✅ Tratamientos prolongados
- ✅ Cualquier producto/servicio en MARKETMED

### Submódulos

**M09.1: Evaluación Crediticia de Pacientes** - ⏸️ PENDIENTE (0%)

Sistema de scoring automático. Análisis de historial de pagos en plataforma, comportamiento de pago (puntualidad), cantidad de financiamientos anteriores, monto promedio financiado, tasa de mora histórica, cálculo de límite de crédito dinámico, aprobación instantánea para montos bajos, revisión manual para montos altos, y upgrade/downgrade automático de tier según comportamiento.

**M09.2: Planes de Financiamiento** - ⏸️ PENDIENTE (0%)

Motor de cálculo de cuotas. Opciones de 2, 3, 6, 12 y 24 cuotas según tier, cálculo automático de cuota mensual, generación de calendario de pagos, visualización clara para el paciente, y confirmación antes de procesar.

**M09.3: Gestión de Créditos y Cobranza** - ⏸️ PENDIENTE (0%)

Administración completa del ciclo de crédito. Solicitud de financiamiento desde checkout, aprobación instantánea o manual según monto y tier, desembolso inmediato a proveedor, cobro automático de cuotas vía tarjeta guardada, gestión de mora con recordatorios progresivos, refinanciamiento en casos especiales, y reportes de cartera.

**M09.4: Garantías y Fondo de Reserva** - ⏸️ PENDIENTE (0%)

Gestión del riesgo financiero. Fondo de garantía capitalizando porcentaje de comisiones, seguro opcional de impago para pacientes, cobertura automática de mora, procesamiento de claims, y reportes actuariales.

**M09.5: Dashboard de Proveedores** - ⏸️ PENDIENTE (0%)

Panel para proveedores adheridos. Registro y onboarding de proveedores (médicos, farmacias, labs), configuración de planes de financiamiento que ofrecen, visualización de financiamientos activos, reporte de cobros recibidos, calendario de pagos de CITAMED, y estadísticas de uso.

### Componentes Frontend

- ⏸️ CreditApplication.jsx (0%)
- ⏸️ CreditApproval.jsx (0%)
- ⏸️ PaymentPlanSelector.jsx (0%)
- ⏸️ InstallmentCalculator.jsx (0%)
- ⏸️ CreditDashboard.jsx (0%)
- ⏸️ PaymentSchedule.jsx (0%)
- ⏸️ CreditScore.jsx (0%)
- ⏸️ TierBadge.jsx (0%)
- ⏸️ ProviderFinancingSettings.jsx (0%)
- ⏸️ FinancingHistory.jsx (0%)

### Endpoints Backend

- ⏸️ POST /api/citamed-paga/apply
- ⏸️ GET /api/citamed-paga/credit-score/:userId
- ⏸️ POST /api/citamed-paga/approve
- ⏸️ GET /api/citamed-paga/loans/:userId
- ⏸️ POST /api/citamed-paga/payment
- ⏸️ GET /api/citamed-paga/installments/:loanId
- ⏸️ GET /api/citamed-paga/provider/dashboard
- ⏸️ GET /api/citamed-paga/available-plans
- ⏸️ POST /api/citamed-paga/calculate-installment

### Tablas de Base de Datos

- ⏸️ credit_applications (0%)
- ⏸️ credit_scores (0%)
- ⏸️ credit_tiers (0%)
- ⏸️ loans (0%)
- ⏸️ loan_installments (0%)
- ⏸️ financing_providers (0%)
- ⏸️ guarantee_fund (0%)
- ⏸️ credit_events (0%)

---

## 🏥 M10: INTEGRACIÓN CON ASEGURADORAS

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M02, M03, M05  
**Tiempo Estimado:** 6 semanas

### Descripción General

Sistema completo de integración con compañías de seguros médicos en Venezuela. Permite validación de cobertura en tiempo real, procesamiento de claims, reembolsos automatizados y sincronización bidireccional con sistemas de aseguradoras.

### Submódulos

**M10.1: Registro de Aseguradoras** - ⏸️ PENDIENTE (0%)

Onboarding de compañías de seguros. Registro de aseguradora con datos legales, configuración de planes ofrecidos, definición de coberturas por plan, exclusiones y limitaciones, red de médicos y proveedores cubiertos, y credenciales para integración API.

**M10.2: Validación de Cobertura** - ⏸️ PENDIENTE (0%)

Verificación en tiempo real. El paciente ingresa número de póliza, el sistema consulta API de aseguradora, valida que la póliza esté activa, verifica cobertura para el servicio solicitado, muestra copago o deducible si aplica, y pre-autoriza procedimientos cuando es necesario.

**M10.3: Procesamiento de Claims** - ⏸️ PENDIENTE (0%)

Gestión de reclamos. Generación automática de claim después de consulta, envío a aseguradora vía API o formato estándar, seguimiento de estado (recibido, en revisión, aprobado, rechazado), manejo de rechazos y apelaciones, y reportes de claims por médico o paciente.

**M10.4: Reembolsos** - ⏸️ PENDIENTE (0%)

Procesamiento de reembolsos. Solicitud de reembolso por paciente cuando pagó de su bolsillo, upload de facturas y soportes, envío a aseguradora, tracking de estado, notificación de aprobación, y recepción de pago.

**M10.5: Integración API de Aseguradoras** - ⏸️ PENDIENTE (0%)

Conectores técnicos. Desarrollo de adaptadores para APIs de principales aseguradoras venezolanas (Seguros Caracas, Seguros Mercantil, Seguros Occidental, La Previsora), sincronización de datos, webhooks para actualizaciones, manejo de errores y reintentos, y logs de integración para debugging.

### Aseguradoras Objetivo

1. **Seguros Caracas**
2. **Seguros Mercantil**
3. **Seguros Occidental**
4. **La Previsora**
5. **Multinacional de Seguros**

### Componentes Frontend

- ⏸️ InsuranceCard.jsx (0%)
- ⏸️ PolicyValidator.jsx (0%)
- ⏸️ CoverageDetails.jsx (0%)
- ⏸️ ClaimForm.jsx (0%)
- ⏸️ ClaimStatus.jsx (0%)
- ⏸️ ReimbursementRequest.jsx (0%)
- ⏸️ ReimbursementTracking.jsx (0%)

### Endpoints Backend

- ⏸️ POST /api/insurance/register
- ⏸️ POST /api/insurance/validate-coverage
- ⏸️ POST /api/insurance/pre-authorize
- ⏸️ POST /api/insurance/claims
- ⏸️ GET /api/insurance/claims/:id
- ⏸️ PUT /api/insurance/claims/:id
- ⏸️ POST /api/insurance/reimbursement
- ⏸️ GET /api/insurance/reimbursement/:id

### Tablas de Base de Datos

- ⏸️ insurers (0%)
- ⏸️ insurance_plans (0%)
- ⏸️ insurance_policies (0%)
- ⏸️ insurance_claims (0%)
- ⏸️ reimbursements (0%)
- ⏸️ coverage_validations (0%)

---

## 🤖 M11: ASISTENTE VIRTUAL CON IA (CHATBOT)

**Prioridad:** 🟡 ALTA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** M01, M02, M03  
**Tiempo Estimado:** 4 semanas

### Descripción General

Asistente virtual inteligente 24/7 integrado en toda la plataforma. Utiliza Claude AI o GPT-4 para responder preguntas, ayudar a agendar citas, buscar médicos, hacer triage básico de síntomas y escalar a humano cuando es necesario. Disponible vía web, app y WhatsApp.

### Casos de Uso

**Paciente:**
- "¿Cómo agendo una cita con un cardiólogo?"
- "¿Cuánto cuesta una consulta?"
- "Tengo dolor de cabeza fuerte, ¿qué debo hacer?"
- "¿Dónde veo mis resultados de laboratorio?"
- "¿El Dr. Juan tiene disponibilidad mañana?"
- "Necesito cancelar mi cita del viernes"

**Médico:**
- "¿Cómo cambio mi disponibilidad?"
- "¿Cuántas citas tengo hoy?"
- "¿Cómo genero una receta digital?"
- "Muéstrame las citas de la próxima semana"

### Submódulos

**M11.1: Motor de IA Conversacional** - ⏸️ PENDIENTE (0%)

Integración con modelos de lenguaje avanzados. Anthropic Claude API o OpenAI GPT-4, procesamiento de lenguaje natural en español, mantenimiento de contexto conversacional multi-turn, entrenamiento con FAQs específicas de salud y plataforma, ajuste fino con casos de uso médicos, y aprendizaje continuo de conversaciones.

**M11.2: Funcionalidades Core** - ⏸️ PENDIENTE (0%)

Capacidades principales del chatbot. Responder preguntas frecuentes sobre uso de plataforma, ayudar a agendar citas paso a paso, buscar médicos por especialidad y ubicación, explicar procesos (cómo funciona CITAMED PAGA, cómo ver resultados), triage básico de síntomas con disclaimers médicos, recordatorios y seguimiento proactivo, y sugerencias contextuales.

**M11.3: Integración Multi-Canal** - ⏸️ PENDIENTE (0%)

Disponibilidad en múltiples plataformas. Widget de chat en web y app móvil, integración con WhatsApp Business API (el canal más usado en Venezuela), Telegram opcional, Facebook Messenger opcional, y experiencia unificada con historial sincronizado.

**M11.4: Base de Conocimiento** - ⏸️ PENDIENTE (0%)

Repositorio de información. FAQs médicas generales, procedimientos específicos de la plataforma, términos y conceptos médicos explicados, guías paso a paso ilustradas, actualización continua con nuevas preguntas detectadas, y versionado de respuestas.

**M11.5: Escalamiento a Humano** - ⏸️ PENDIENTE (0%)

Transfer inteligente a soporte humano. Detección automática de cuándo el chatbot no puede resolver (frustración del usuario, complejidad alta), botón manual "Hablar con una persona", transfer a equipo de soporte con historial completo de conversación, transfer a médico de guardia para consultas urgentes, y continuidad sin repetir información.

### Componentes Frontend

- ⏸️ ChatbotWidget.jsx (0%)
- ⏸️ ChatbotWindow.jsx (0%)
- ⏸️ ChatMessage.jsx (0%)
- ⏸️ QuickReplies.jsx (0%)
- ⏸️ TypingIndicator.jsx (0%)
- ⏸️ EscalationButton.jsx (0%)
- ⏸️ ChatHistory.jsx (0%)

### Endpoints Backend

- ⏸️ POST /api/chatbot/message
- ⏸️ GET /api/chatbot/conversation/:id
- ⏸️ POST /api/chatbot/escalate
- ⏸️ GET /api/chatbot/suggestions
- ⏸️ POST /api/chatbot/feedback
- ⏸️ GET /api/chatbot/history/:userId

### Tablas de Base de Datos

- ⏸️ chatbot_conversations (0%)
- ⏸️ chatbot_messages (0%)
- ⏸️ chatbot_knowledge_base (0%)
- ⏸️ chatbot_feedback (0%)
- ⏸️ chatbot_escalations (0%)

### Integraciones

- **Anthropic Claude API:** Motor de IA principal
- **OpenAI GPT-4:** Alternativa o complemento
- **WhatsApp Business API:** Chat vía WhatsApp
- **Twilio:** SMS para notificaciones
- **Firebase:** Push notifications

---

## 📊 M12: ADMINISTRACIÓN Y ANALÍTICAS

**Prioridad:** 🟢 MEDIA  
**Estado:** ⏸️ NO INICIADO (0%)  
**Dependencias:** Todos los módulos  
**Tiempo Estimado:** 3 semanas

### Descripción General

Panel administrativo completo para operadores de CITAMED. Incluye dashboard ejecutivo con KPIs, gestión de usuarios, reportes financieros, métricas de plataforma, configuración general y auditoría completa.

### Submódulos

**M12.1: Dashboard Administrativo** - ⏸️ PENDIENTE (0%)

Panel ejecutivo con métricas clave en tiempo real. Usuarios activos (pacientes, médicos, proveedores), citas del día y del mes, ingresos generados, comisiones procesadas, tasa de conversión, usuarios nuevos vs recurrentes, y gráficos de tendencias.

**M12.2: Gestión de Usuarios** - ⏸️ PENDIENTE (0%)

Administración de cuentas. Listado completo de usuarios con filtros, búsqueda avanzada, verificación manual de médicos, suspensión de cuentas problemáticas, edición de perfiles, reseteo de contraseñas, y asignación de roles especiales.

**M12.3: Reportes Financieros** - ⏸️ PENDIENTE (0%)

Informes detallados de finanzas. Reporte de ingresos por módulo (citas, telemedicina, MARKETMED, CITAMED PAGA), comisiones generadas, pagos procesados, suscripciones activas, mora y cartera vencida, proyecciones, y exportación a Excel/PDF.

**M12.4: Configuración de Plataforma** - ⏸️ PENDIENTE (0%)

Parámetros globales del sistema. Comisiones por servicio, tarifas de plataforma, límites de uso, textos de términos y condiciones, políticas de privacidad, configuración de emails transaccionales, y feature flags para activar/desactivar módulos.

**M12.5: Logs y Auditoría** - ⏸️ PENDIENTE (0%)

Registro completo de actividad. Logs de acceso al sistema, cambios críticos (usuarios, pagos, configuración), detección de actividad sospechosa, alertas de seguridad, exportación de logs para cumplimiento, y retención configurable.

### Componentes Frontend

- ⏸️ AdminDashboard.jsx (0%)
- ⏸️ KPICard.jsx (0%)
- ⏸️ FinancialStats.jsx (0%)
- ⏸️ PlatformPerformance.jsx (0%)
- ⏸️ UserManagement.jsx (0%)
- ⏸️ Reports.jsx (0%)
- ⏸️ ConfigurationPanel.jsx (0%)
- ⏸️ AuditLogs.jsx (0%)

### Endpoints Backend

- ⏸️ GET /api/admin/dashboard
- ⏸️ GET /api/admin/financial-stats
- ⏸️ GET /api/admin/platform-performance
- ⏸️ GET /api/admin/users
- ⏸️ PUT /api/admin/users/:id
- ⏸️ GET /api/admin/reports
- ⏸️ GET /api/admin/audit-logs
- ⏸️ PUT /api/admin/settings

### Tablas de Base de Datos

- ⏸️ admin_logs (0%)
- ⏸️ platform_settings (0%)
- ⏸️ performance_metrics (0%)
- ⏸️ financial_reports (0%)

---

## 🔗 MATRIZ DE DEPENDENCIAS

### Diagrama de Interdependencias

```
M01 (Auth) ────────────────┐
                           │
M02 (Profiles) ◄───────────┼─────┐
                           │     │
M03 (Agendamiento) ◄───────┼─────┼────┐ ⭐ SALA ESPERA
                           │     │    │
M04 (Telemedicine) ◄───────┼─────┼────┼────┐ (usa sala M03)
                           │     │    │    │
M05 (EHR) ◄────────────────┼─────┼────┼────┤
                           │     │    │    │
M06 (MARKETMED) ◄──────────┼─────┼────┤    │
                           │     │    │    │
M07 (Payments) ◄───────────┴─────┴────┴────┴────┐
                                                 │
M08 (Notifications) ◄────────────────────────────┤
                                                 │
M09 (CITAMED PAGA) ◄───────┬─────────────────────┤
                           │                     │
M10 (Insurance) ◄──────────┼─────────────────────┤
                           │                     │
M11 (AI Chatbot) ◄─────────┴─────────────────────┤
                                                 │
M12 (Admin) ◄────────────────────────────────────┘
```

### Orden de Implementación Recomendado

**Fase 1: Fundaciones (Actual - En Curso)**
1. M01: Auth & User Management
2. M02: Medical Profiles
3. Infraestructura técnica (Deploy, CI/CD, Testing)

**Fase 2: MVP Core (Enero-Febrero 2026)**
4. M03: Agendamiento + Sala de Espera Virtual ⭐
5. M05: Historia Clínica (EHR)
6. M08: Notificaciones (incluyendo WhatsApp)

**Fase 3: Servicios Avanzados (Marzo 2026)**
7. M04: Telemedicina
8. M07: Pagos y Facturación
9. M09: CITAMED PAGA
10. M06: MARKETMED

**Fase 4: Expansión (Abril-Mayo 2026)**
11. M10: Integración Aseguradoras
12. M11: AI Chatbot
13. M12: Admin y Analíticas

---

## 📅 CRONOGRAMA DE EJECUCIÓN

### Diciembre 2025 (Actual)

**Semana 4 (9-15 Diciembre):** 🔄 EN PROGRESO
- ✅ Dockerfile backend completado
- 🔄 Dockerfile frontend en progreso
- ⏸️ Docker Compose pendiente
- ⏸️ GitHub Actions deploy pendiente

**Semana 5 (16-22 Diciembre):**
- Optimizaciones (Redis, indexes, WebSocket base)
- Rate limiting y security hardening
- Performance monitoring

**Semana 6 (23-29 Diciembre):**
- Finalizar M01 completo (registro multi-paso, 2FA, recuperación contraseña)
- Testing exhaustivo de autenticación

**Semana 7 (30 Dic - 5 Enero):**
- Buffer para ajustes
- Cierre año y planificación detallada 2026

### Enero 2026

**Semanas 1-2:**
- Iniciar M02: Perfiles completos de médicos
- Verificación KYC
- Sistema de reputación con estrellas
- Búsqueda y filtrado

**Semanas 3-4:**
- Completar M02
- Iniciar M03: Agendamiento básico
- Gestión de agenda del médico

### Febrero 2026

**Semanas 1-3:**
- M03: Sala de Espera Virtual completa ⭐
- Interfaz paciente (sillitas)
- Interfaz médico (dashboard del día)
- WebSocket real-time
- Notificaciones progresivas

**Semana 4:**
- M05: Iniciar Historia Clínica
- Estructura de datos
- Consultas y evolución

### Marzo 2026

**Semanas 1-2:**
- M05: Completar EHR
- Laboratorios e imagenología
- Vacunas y medicamentos

**Semanas 3-4:**
- M04: Telemedicina
- WebRTC videollamadas
- Chat médico-paciente
- Recetas electrónicas

### Abril 2026

**Semanas 1-2:**
- M07: Pagos y facturación
- Pasarelas de pago
- Programa de fidelización

**Semanas 3-4:**
- M09: CITAMED PAGA
- Sistema de tiers
- Evaluación crediticia

### Mayo 2026

**Semanas 1-3:**
- M06: MARKETMED
- Catálogo de productos
- Sistema de órdenes
- Comisiones de referidos

**Semana 4:**
- M10: Integración con aseguradoras (inicio)

### Junio 2026

**Semanas 1-2:**
- Completar M10: Insurance
- APIs de aseguradoras

**Semanas 3-4:**
- M11: AI Chatbot
- Integración Claude/GPT
- WhatsApp bot

### Julio 2026

**Semanas 1-2:**
- M12: Admin y Analíticas
- Dashboard ejecutivo
- Reportes financieros

**Semanas 3-4:**
- Testing integración completa
- Optimización y ajustes finales
- Preparación para lanzamiento

---

## 🎯 CAMBIOS CLAVE EN VERSIÓN 3.0

### Principales Actualizaciones

**1. MARKETMED Unificado** ⭐
Pharmacy (M06) y Laboratory (M07) se fusionaron en un solo módulo MARKETMED (M06), reflejando correctamente el concepto de marketplace integral del Plan Maestro V5.1. Esto incluye farmacias, laboratorios, insumos médicos y servicios de salud en una plataforma unificada con sistema de comisiones (3% médico + 4% CITAMED).

**2. Actualización de Fechas**
Todas las fechas actualizadas a 14 de diciembre 2025, reflejando el estado actual real del proyecto.

**3. Integración con Plan Maestro V5.1**
Incorporación completa de:
- Sistema de Reputación con estrellas (en M02)
- Plan de Fidelización CITAMED POINTS (en M07)
- CITAMED PAGA como garante con tiers (M09)
- Integración Aseguradoras clarificada (M10)

**4. Estructura Profesional Enterprise**
Formato profesional con:
- Descripciones detalladas de cada módulo
- Submódulos explicados con contexto
- Componentes, endpoints y tablas especificados
- Dependencias claras
- Tiempos estimados realistas

**5. Armonización con Estado Actual**
Progreso real reflejado:
- 14/100 tareas completadas
- Calificación 8.9/10
- Semana 4 en curso (Deploy)
- M01 40% completado
- M02 20% completado

---

## 📊 MÉTRICAS DE PROGRESO

### Estado Actual del Proyecto

| Categoría | Métrica | Valor Actual | Objetivo | Progreso |
|-----------|---------|--------------|----------|----------|
| **Tareas** | Completadas | 14 | 100 | 14% |
| **Módulos** | Completados | 0 | 12 | 0% |
| **Módulos** | En Progreso | 2 | - | - |
| **Testing** | Tests Backend | 44 | 150 | 29% |
| **Testing** | Tests E2E | 6 | 30 | 20% |
| **Testing** | Coverage | 32% | 80% | 40% |
| **Docs** | Endpoints API | 11 | 60 | 18% |
| **Docs** | Schemas Swagger | 14 | 50 | 28% |
| **Calidad** | Calificación | 8.9 | 9.5 | 94% |

### Progreso por Módulo

| Módulo | Estado | Progreso | Prioridad |
|--------|--------|----------|-----------|
| M01: Auth | 🟡 En Progreso | 40% | 🔴 Crítica |
| M02: Profiles | 🟢 En Progreso | 20% | 🔴 Crítica |
| M03: Agendamiento | ⚪ Pendiente | 5% | 🔴 Crítica |
| M04: Telemedicina | ⚪ Pendiente | 0% | 🟡 Alta |
| M05: EHR | ⚪ Pendiente | 0% | 🔴 Crítica |
| M06: MARKETMED | ⚪ Pendiente | 0% | 🟢 Media |
| M07: Payments | ⚪ Pendiente | 0% | 🟡 Alta |
| M08: Notifications | ⚪ Pendiente | 0% | 🟡 Alta |
| M09: CITAMED PAGA | ⚪ Pendiente | 0% | 🟡 Alta |
| M10: Insurance | ⚪ Pendiente | 0% | 🟡 Alta |
| M11: AI Chatbot | ⚪ Pendiente | 0% | 🟡 Alta |
| M12: Admin | ⚪ Pendiente | 0% | 🟢 Media |

---

## 💼 INVERSIÓN Y PROYECCIÓN FINANCIERA

### Inversión Requerida

| Concepto | Monto | Porcentaje |
|----------|-------|------------|
| Desarrollo Tecnológico | $80,000 | 50% |
| Marketing y Operaciones | $40,000 | 25% |
| Legal y Respaldo Financiero | $40,000 | 25% |
| **TOTAL** | **$160,000** | **100%** |

**Runway:** 6 meses garantizados

### Proyección de Ingresos (3 años)

| Año | Médicos Activos | Ingresos | Costos | Beneficio Bruto | Margen EBITDA |
|-----|-----------------|----------|--------|-----------------|---------------|
| Año 1 | 850 | $785K | $358K | $427K | 54% |
| Año 2 | 2,040 | $1.88M | $523K | $1.36M | 72% |
| Año 3 | 2,890 | $2.67M | $721K | $1.95M | 73% |

### ROI

- **Inversión:** $160,000 USD
- **Beneficio acumulado 3 años:** ~$3.7M USD
- **ROI:** **23X**
- **Break-even:** Mes 10 del Año 1

---

## 📞 INFORMACIÓN DE CONTACTO

**Proyecto:** CITAMED.VE  
**Ubicación Código:** C:/Users/corpo/CITAMED.VE/proyecto  
**Repositorio:** Git (branch master)  

**Documentación Relacionada:**
- Plan Maestro V5.1: CITAMED_VE_PLAN_MAESTRO_V5_1_COMPLETO.md
- Planificación y Control: PLANIFICACION_Y_CONTROL.md
- Arquitectura: Manual_Profesional_de_Arquitectura_y_Desarrollo.docx
- Swagger API: http://localhost:5000/api-docs

---

## 🏆 PRINCIPIOS DE DESARROLLO

### Filosofía Técnica

1. **Cero Mocks, Todo Real:** Desarrollo con PostgreSQL desde el inicio, sin datos simulados.
2. **Testing First:** Cada feature se desarrolla con tests automatizados desde el principio.
3. **Documentación Automática:** Swagger OpenAPI actualizado en cada endpoint nuevo.
4. **CI/CD Obligatorio:** GitHub Actions ejecuta tests en cada commit, deploy automático.
5. **Código Limpio:** Arquitectura MVC determinística, fácil de entender y mantener.
6. **Escalabilidad desde Día 1:** Diseño para soportar millones de usuarios sin refactorización mayor.
7. **Seguridad Prioritaria:** JWT, HTTPS, sanitización, protección contra ataques comunes.
8. **Monitoreo Constante:** Logs estructurados, métricas en tiempo real, alertas configuradas.

### Estándares de Calidad

- **Cobertura de Tests:** Mínimo 70%, objetivo 80%
- **Performance:** Respuesta API < 200ms percentil 95
- **Disponibilidad:** 99.9% uptime (objetivo)
- **Escalabilidad:** Soportar 1M+ citas/año
- **Seguridad:** Cumplimiento OWASP Top 10

---

## 📝 HISTORIAL DE VERSIONES

### v3.0 (14 Diciembre 2025) - ACTUAL ⭐⭐⭐

**Cambios Principales:**
- ✅ MARKETMED unificado como M06 (fusiona Pharmacy + Laboratory)
- ✅ Renumeración de módulos posteriores
- ✅ Actualización de fechas a 14-DIC-2025
- ✅ Integración completa con Plan Maestro V5.1
- ✅ Sistema de Reputación incorporado en M02
- ✅ Plan de Fidelización detallado en M07
- ✅ CITAMED PAGA con tiers y modelo garante clarificado en M09
- ✅ Estructura profesional enterprise
- ✅ Descripciones detalladas de todos los submódulos
- ✅ Armonización con estado real del proyecto (8.9/10, 14% progreso)
- ✅ Cronograma actualizado hasta Julio 2026

### v2.2 FINAL (30 Octubre 2025)

- ✅ WhatsApp agregado en Notificaciones
- ✅ M13: AI Chatbot módulo nuevo
- ✅ CITAMED PAGA corregido: 0% interés paciente, sistema de tiers
- ✅ Multi-proveedor (médicos, farmacias, labs)
- ✅ Sala de Espera movida a M03 (corrección arquitectónica)
- ✅ 13 módulos totales

### v2.1 (30 Octubre 2025)

- Expansiones en M02, M03, M10
- +2 módulos nuevos (M11, M12)
- +2 submódulos (M02.5, M08.5)

### v2.0 (29 Octubre 2025)

- Roadmap inicial con 10 módulos
- Sala de espera en M04 (luego corregido)

---

## ✅ APROBACIÓN Y ESTATUS

**Estado del Documento:** ✅ COMPLETO Y APROBADO  
**Listo para Ejecución:** ✅ SÍ  
**Próxima Revisión:** Mensual o cuando se complete fase

---

**CITAMED.VE - Revolucionando la Salud Digital en Venezuela**  
*"Conectando pacientes, médicos y proveedores en un ecosistema integral"*

---

*Roadmap Maestro v3.0 | 14 de Diciembre 2025 | Documento Profesional Enterprise*

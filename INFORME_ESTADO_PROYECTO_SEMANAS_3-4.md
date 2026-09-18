# CITAMED.VE - Informe de Estado del Proyecto
**Semanas 3-4 · Motor de Citas, Consultorios Clínicos, Agenda Médica y Sala de Espera Virtual**
**Elaborado por:** Jonathan Lobo
**Corresponde a:** Entregables de las Semanas 3 y 4 del Plan de Entrega del MVP

---

## 1. Resumen ejecutivo

Durante esta etapa se consolidó el núcleo operativo de CITAMED.VE: la conexión real entre el paciente que necesita atención y el médico que gestiona su consulta. Se pasó de pantallas estáticas y modelos aislados a un **flujo transaccional completo en producción**.

El diagnóstico inicial de esta fase reveló que la lógica básica de citas existía en el código, pero presentaba vacíos estructurales severos: las citas no estaban vinculadas a consultorios físicos o clínicas (quedaban "flotando en el vacío"), la agenda médica no cargaba la disponibilidad guardada, el agendamiento fallaba contra PostgreSQL por incompatibilidad de estados, y la agenda médica solo permitía ver un día a la vez.

**Estado al cierre de esta etapa:**

- ✅ **Motor de citas 100% transaccional y en vivo:** el paciente busca al especialista, consulta sus horarios reales disponibles, selecciona el consultorio físico y envía su solicitud de cita sin colisiones ni choques de horario.
- ✅ **Integración estructural de Consultorios y Clínicas:** cada cita ahora pertenece a una clínica o consultorio privado físico (`clinicId`, `locationId`), con dirección, ciudad y sede claramente identificadas para el paciente y el médico.
- ✅ **Agenda Médica Enterprise (Día / Semana / Mes):** se transformó la pantalla del médico incorporando un conmutador de 3 vistas (Día, Semana de 7 columnas y Mes completo de 35-42 celdas), permitiendo al especialista auditar y navegar todo su calendario de pacientes.
- ✅ **Respaldo automatizado de calidad (Suite E2E):** se creó una suite de pruebas automatizadas en Jest (`appointments-journey.test.js`) que valida los 6 pasos críticos del recorrido en 16 segundos con 100% de éxito.
- ✅ **Identificador de versión y trazabilidad:** se integró en la barra de navegación el badge de versión y commit hash (`v0.4.0#hash`) para saber con certeza exacta qué código está viendo el usuario en producción.
- ✅ **Infraestructura en la nube estabilizada:** Render configurado en despliegue continuo automático (`On Commit`), frontend en Cloudflare Pages con SPA routing nativo, y UptimeRobot monitoreando el endpoint `/api/health` 24/7 para eliminar los tiempos de arranque en frío.

---

## 2. Metodología

Al igual que en las Semanas 1 y 2, el trabajo se basó estrictamente en **ejecución verificable contra entornos reales**:
1. Base de datos PostgreSQL gestionada en la nube (Supabase).
2. Servidor backend Node.js en Render (`https://citamed-api.onrender.com`).
3. Aplicación web React en Cloudflare Pages (`https://citamed-ve.pages.dev`).

Cada funcionalidad se probó de punta a punta creando usuarios reales de prueba (médico y paciente), agendando turnos, confirmando en el panel médico y auditando la persistencia en base de datos.

---

## 3. Hallazgos críticos, bugs detectados y decisiones de diseño

### 3.1 La decisión clave: Integración obligatoria de Consultorios y Clínicas al Motor de Citas
- **El problema:** En el diseño heredado, la tabla `appointments` guardaba únicamente `doctorId` y `patientId`. No existía ninguna relación con el módulo de clínicas. En la realidad médica de Venezuela, un doctor atiende en un consultorio privado específico (ej. Torre Médica, piso 4) o en una o más clínicas afiliadas. Sin este dato, el paciente no sabía a dónde acudir y el médico no podía filtrar su agenda por sede.
- **La decisión:** Se ejecutó una migración estructural en la base de datos agregando las columnas `clinicId` y `locationId` con claves foráneas e índices a la tabla `appointments`. Si el médico no pertenece a una clínica institucional, el sistema le crea o vincula automáticamente su **Consultorio Privado** (ej. "Unidad Médica Especializada"), asegurando que el 100% de las citas tengan sede física asignada.
- **Resultado:** En la tarjeta de la cita (tanto para el médico como para el paciente) se muestra con total claridad: nombre del centro, dirección exacta y ciudad.

### 3.2 Bug de PostgreSQL: Estado `scheduled` inexistente en el ENUM de citas
- **El problema:** Al intentar crear citas desde el flujo de agendamiento, la base de datos rechazaba la inserción con un error `invalid input value for enum enum_appointments_status: "scheduled"`.
- **La solución:** Se escribió y ejecutó el script de migración DDL `ALTER TYPE enum_appointments_status ADD VALUE IF NOT EXISTS 'scheduled'`. El catálogo de estados quedó normalizado (`pending`, `confirmed`, `scheduled`, `in_consultation`, `completed`, `cancelled_patient`, `cancelled_doctor`, `no_show`).

### 3.3 Bug en la Agenda del Médico: Carga de disponibilidad horaria rota
- **El problema:** Al ingresar a `/medico/agenda` en la pestaña "Configurar Disponibilidad", la pantalla arrojaba errores en consola y no reflejaba los días y horas que el médico ya había guardado. El código intentaba llamar a una función `getWeeklySummary` no implementada en el servicio.
- **La solución:** Se corrigió `doctorService.js` y `DoctorAgendaPage.jsx` para leer directamente la matriz `availability` persistida en el perfil del médico. Ahora el médico puede activar días (Lunes a Domingo), agregar bloques horarios, modificar duración de consulta y guardar los cambios con confirmación inmediata.

### 3.4 Evolución de la Agenda Médica: Vistas de Día, Semana y Mes
- **El problema:** La agenda inicial solo permitía visualizar las citas del día actual. Si un paciente agendaba para la semana siguiente, el médico no tenía manera visual de planificar su semana o evaluar el volumen de citas del mes sin cambiar manualmente día por día.
- **La solución:** Se implementó un conmutador de triple vista (`[ Día | Semana | Mes ]`):
  - **Vista Día:** Lista detallada de pacientes con botones de acción (Confirmar, Cancelar/Rechazar, Ver detalle).
  - **Vista Semana:** Grilla de 7 columnas (Lunes a Domingo) que distribuye las citas en sus respectivos días con badges interactivos.
  - **Vista Mes:** Calendario completo de 35 a 42 celdas con cálculo de desfase de inicio de mes, destacando el día actual y mostrando indicadores de citas agendadas por día.
- **Ajuste en Backend:** Se adaptó el endpoint `/api/appointments/doctor/today` para recibir rangos de consulta (`startDate` y `endDate`), permitiendo traer todas las citas del período en una sola petición de alta velocidad.

### 3.5 Eliminación de alertas falsas en GitHub Actions
- **El problema:** Con cada `git push` al repositorio, el propietario recibía un correo de alerta de GitHub diciendo *"Run failed: deploy.yml: No jobs were run"*.
- **El origen:** Existía un archivo residual [`.github/workflows/deploy.yml`](file:///.github/workflows/deploy.yml) de la fase inicial cuando se pensaba desplegar con Docker en un servidor privado `/opt/citamed`. Como CitaMed ahora se despliega de forma nativa en Cloudflare Pages y Render, ese workflow no encontraba tareas que ejecutar y fallaba por configuración.
- **La solución:** Se pausó el disparador automático `push` en dicho archivo (dejándolo manual con `workflow_dispatch`), deteniendo por completo los correos de spam en la bandeja de entrada.

### 3.6 Automatización del despliegue en Render (`On Commit`)
- **El problema:** El frontend desplegaba de inmediato en Cloudflare en cada push, pero Render requería despliegue manual desde el panel, lo que generaba desincronizaciones temporales entre la versión del backend y del frontend.
- **La solución:** Se configuró Render con **Auto-Deploy: On Commit** sobre la rama `master`. Además, en el frontend se implementó un respaldo de contingencia para que la vista de semana pueda resolver consultas en paralelo incluso durante los minutos de compilación del backend.

---

## 4. Sala de Espera Virtual y Consulta Médica (Semana 4 en curso)

Con el motor de citas y la agenda médica estabilizados, la plataforma cuenta con los cimientos activos para el flujo de atención en vivo ("La joya de la corona"):

1. **Check-in del Paciente:** Al llegar el día de la cita, el paciente ingresa a `/paciente/sala-espera`, hace check-in y se incorpora a la cola virtual con su número de turno asignado.
2. **Monitor en Tiempo Real ("Las Sillitas"):** El paciente visualiza su posición en la fila, la cantidad de personas por delante y el tiempo estimado para su llamado.
3. **Control del Médico (`/medico/sala-espera`):** El especialista visualiza su cola de pacientes del día y cuenta con los controles operativos:
   - **"Llamar paciente":** Emite el evento por WebSocket (Socket.io) para notificar al paciente en pantalla.
   - **"Iniciar consulta":** Cambia el estado a `in_consultation`.
   - **"Finalizar consulta":** Cierra la cita en estado `completed` y la registra en el historial clínico.

---

## 5. El proyecto en cifras al cierre de la etapa

| Métrica | Valor |
|---|---|
| **Pruebas automatizadas E2E** | ✅ 6 de 6 superadas (16 segundos) |
| **Tablas en Base de Datos** | 32 tablas (con RLS activo en todas) |
| **Modelos Sequelize vinculados** | 31 modelos |
| **Vistas de Agenda Médica** | 3 (Día, Semana, Mes) |
| **Integración de Sedes/Clínicas** | 100% de citas vinculadas a sede física |
| **Monitoreo UptimeRobot** | Activo (ping cada 5 min a `/api/health`) |
| **Despliegue Continuo (CI/CD)** | ✅ Activo en Cloudflare Pages y Render |

---

## 6. Próximos pasos inmediatos (Hacia la Semana 5)

1. **Validación del ciclo completo de Sala de Espera:** pruebas de cambio de estado en vivo (Llamar -> Atender -> Finalizar consulta).
2. **Módulo de Cobro (Semana 5):**
   - Configuración de datos de cobro del médico (Pago Móvil, Zelle, Transferencia bancaria).
   - Cálculo automático en bolívares a la tasa oficial del BCV.
   - Reporte de pago por el paciente y validación administrativa por el médico o su asistente.
3. **Notificaciones por mensajería:** integración de confirmaciones y alertas de turno.

---

*Informe de estado y avance - Proyecto CitaMed. Cifras y resultados comprobados por ejecución directa en los entornos de producción y staging.*

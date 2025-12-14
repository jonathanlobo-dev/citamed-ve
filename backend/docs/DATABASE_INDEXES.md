# Database Indexes - CITAMED.VE

## Resumen

Este documento describe la estrategia de indexación de base de datos para optimizar el rendimiento de queries críticas en CITAMED.VE.

**Total de indexes:** 16
**Mejora esperada:** >70% en queries críticas
**Migration file:** `migrations/20251214180000-add-performance-indexes.js`

---

## Indexes por Tabla

### 1. users

| Index | Columnas | Tipo | Propósito |
|-------|----------|------|-----------|
| `idx_users_email` | email | UNIQUE | Login rápido por email |
| `idx_users_role` | role | BTREE | Filtrar por tipo de usuario |
| `idx_users_email_role` | email, role | BTREE | Queries combinadas |

**Query optimizada:**
```sql
-- Login de usuario (<50ms target)
SELECT * FROM users WHERE email = 'user@example.com';
```

---

### 2. doctor_profiles

| Index | Columnas | Tipo | Propósito |
|-------|----------|------|-----------|
| `idx_doctor_specialty` | specialtyId | BTREE | Búsqueda por especialidad |
| `idx_doctor_city` | city | BTREE | Búsqueda por ciudad |
| `idx_doctor_specialty_city` | specialtyId, city | BTREE | Búsqueda combinada |
| `idx_doctor_user` | userId | BTREE | JOINs con users |
| `idx_doctor_rating` | averageRating | BTREE | Ordenar por calificación |
| `idx_doctor_verified` | isVerified | BTREE | Filtrar verificados |

**Queries optimizadas:**
```sql
-- Búsqueda por especialidad (<100ms target)
SELECT * FROM doctor_profiles WHERE "specialtyId" = 1;

-- Búsqueda por ciudad (<100ms target)
SELECT * FROM doctor_profiles WHERE city = 'Caracas';

-- Búsqueda combinada (<80ms target)
SELECT * FROM doctor_profiles
WHERE "specialtyId" = 1 AND city = 'Caracas';

-- Médicos verificados ordenados por rating
SELECT * FROM doctor_profiles
WHERE "isVerified" = true
ORDER BY "averageRating" DESC;
```

---

### 3. patient_profiles

| Index | Columnas | Tipo | Propósito |
|-------|----------|------|-----------|
| `idx_patient_user` | userId | BTREE | JOINs con users |

**Query optimizada:**
```sql
-- Obtener perfil de paciente
SELECT pp.*, u.email FROM patient_profiles pp
JOIN users u ON pp."userId" = u.id
WHERE pp."userId" = 123;
```

---

### 4. appointments

| Index | Columnas | Tipo | Propósito |
|-------|----------|------|-----------|
| `idx_appointments_doctor` | doctorId | BTREE | Citas de un médico |
| `idx_appointments_patient` | patientId | BTREE | Citas de un paciente |
| `idx_appointments_date` | appointmentDate | BTREE | Búsqueda por fecha |
| `idx_appointments_doctor_date` | doctorId, appointmentDate | BTREE | Agenda diaria |
| `idx_appointments_patient_date` | patientId, appointmentDate | BTREE | Historial paciente |
| `idx_appointments_status` | status | BTREE | Filtrar por estado |

**Queries optimizadas:**
```sql
-- Agenda del médico para hoy (<80ms target)
SELECT * FROM appointments
WHERE "doctorId" = 123
AND DATE("appointmentDate") = CURRENT_DATE
ORDER BY "appointmentDate";

-- Historial del paciente (<100ms target)
SELECT * FROM appointments
WHERE "patientId" = 456
ORDER BY "appointmentDate" DESC;

-- Citas pendientes
SELECT * FROM appointments
WHERE status = 'scheduled'
AND "appointmentDate" > NOW();
```

---

### 5. specialties

| Index | Columnas | Tipo | Propósito |
|-------|----------|------|-----------|
| `idx_specialties_name` | name | BTREE | Búsqueda/autocomplete |
| `idx_specialties_active` | isActive | BTREE | Filtrar activas |

**Query optimizada:**
```sql
-- Autocomplete de especialidades (<50ms target)
SELECT * FROM specialties
WHERE name ILIKE '%cardio%'
AND "isActive" = true;
```

---

## Metas de Performance

| Query | Sin Index | Con Index | Mejora |
|-------|-----------|-----------|--------|
| Login (email) | ~200ms | <50ms | >75% |
| Médicos por especialidad | ~400ms | <100ms | >75% |
| Médicos por ciudad | ~350ms | <100ms | >71% |
| Agenda diaria | ~300ms | <80ms | >73% |
| Historial paciente | ~350ms | <100ms | >71% |
| Especialidades search | ~150ms | <50ms | >66% |

---

## Uso

### Aplicar Indexes

```bash
# Ejecutar migration
npx sequelize-cli db:migrate

# O directamente
node -e "require('./migrations/20251214180000-add-performance-indexes').up(sequelize.getQueryInterface(), Sequelize)"
```

### Verificar Indexes

```bash
# Ejecutar benchmark
node scripts/benchmark-queries.js

# Con EXPLAIN ANALYZE
node scripts/benchmark-queries.js --explain
```

### Rollback

```bash
# Revertir migration
npx sequelize-cli db:migrate:undo

# O SQL directo
DROP INDEX IF EXISTS idx_users_email;
DROP INDEX IF EXISTS idx_users_role;
-- ... etc
```

---

## Mantenimiento

### REINDEX Periódico

Ejecutar mensualmente para mantener eficiencia:

```sql
-- Reindexar tabla específica
REINDEX TABLE users;
REINDEX TABLE doctor_profiles;
REINDEX TABLE appointments;

-- O toda la base de datos (con cuidado en producción)
REINDEX DATABASE citamed_production;
```

### Monitoreo

```sql
-- Ver uso de indexes
SELECT
  schemaname,
  relname AS table_name,
  indexrelname AS index_name,
  idx_scan AS times_used,
  pg_size_pretty(pg_relation_size(indexrelid)) AS index_size
FROM pg_stat_user_indexes
WHERE schemaname = 'public'
ORDER BY idx_scan DESC;
```

### Indexes No Utilizados

```sql
-- Detectar indexes sin uso (candidatos a eliminar)
SELECT
  indexrelname AS index_name,
  relname AS table_name,
  idx_scan AS times_used
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexrelname LIKE 'idx_%';
```

---

## Best Practices

1. **No indexar todo:** Solo columnas frecuentemente consultadas
2. **Orden de columnas:** Columna más selectiva primero en indexes compuestos
3. **Evitar duplicados:** No crear index si ya existe uno que lo cubra
4. **Monitorear uso:** Eliminar indexes no utilizados
5. **REINDEX periódico:** Mantener eficiencia después de muchos INSERTs/DELETEs

---

## Trade-offs

| Ventaja | Desventaja |
|---------|------------|
| SELECT más rápidos | INSERT/UPDATE más lentos |
| Menos I/O en disco | Más espacio en disco |
| Menor carga CPU en queries | Overhead de mantenimiento |

**Nota:** Los indexes ocupan ~10-15% del tamaño de los datos indexados.

---

## Contacto

Para dudas sobre optimización de base de datos:
- Revisar logs de queries lentas
- Ejecutar `EXPLAIN ANALYZE` en queries problemáticas
- Considerar indexes adicionales según patrones de uso real

---

*Última actualización: 14 de Diciembre, 2025*

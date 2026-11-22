# Respaldos y recuperación de la base de datos

Los datos de CitaMed son datos de salud. Esta guía explica cómo sacar una copia, cómo comprobar que sirve, dónde guardarla y qué hacer si algo se pierde.

## 1. Qué protege hoy cada cosa

| Riesgo | Protección |
|---|---|
| Se cae el servidor (Render) | Render lo reinicia solo. No se pierden datos: están en Supabase. |
| Se borra o daña un dato por error | Solo una copia anterior lo recupera (sección 2 y 3). |
| Se pierde el proyecto de Supabase | Solo una copia fuera de Supabase lo recupera (sección 2). |

El plan gratuito de Supabase **no garantiza copias que se puedan restaurar**. Antes del lanzamiento hay que escoger una de estas dos vías, o las dos:

1. **Plan Pro de Supabase** (copias diarias gestionadas y, con complemento, recuperación a un punto en el tiempo). Es la vía recomendada para producción.
2. **Copia propia programada** con el script de abajo, guardada fuera de Supabase y de GitHub.

## 2. Sacar una copia

Desde la carpeta `backend`, con las variables `DB_*` del entorno que se quiere copiar:

```bash
BACKUP_PASSPHRASE="una frase larga y única" npm run backup
```

Crea `backend/backups/AAAA-MM-DD_HHMMSS/` con un archivo por tabla (una fila por línea, comprimido y **cifrado con AES-256**) y un `manifest.json` con el conteo de filas y la huella de cada archivo. El script solo lee: no modifica nada.

Reglas:

- **Siempre con `BACKUP_PASSPHRASE`.** Sin ella la copia queda sin cifrar y contiene historias clínicas en claro.
- Guarda la frase en el gestor de contraseñas del proyecto, no junto a la copia. Sin la frase la copia no se puede abrir.
- La carpeta `backend/backups/` está fuera del repositorio. **Nunca** subas una copia a GitHub, a un chat ni a un correo.
- Guarda las copias en un lugar privado del cliente (disco cifrado o almacenamiento privado de su cuenta) y conserva al menos las últimas 4 semanales y 3 mensuales.

Frecuencia sugerida: una copia antes de cada liberación a producción y una por semana mientras no esté el plan Pro.

## 3. Comprobar que la copia sirve

Una copia que nunca se comprobó no es una copia.

```bash
BACKUP_PASSPHRASE="la misma frase" node scripts/backup-db.js --verify backups/AAAA-MM-DD_HHMMSS
```

Revisa que cada archivo exista, que su huella coincida (no está alterado ni dañado), que se pueda descifrar y descomprimir, y que el número de filas sea el anotado. Termina con código 1 si algo falla.

## 4. Recuperar (qué se puede hacer hoy)

1. **Con Supabase Pro:** panel de Supabase, Database, Backups, elegir el punto y restaurar. Es lo más rápido y seguro.
2. **Con una copia propia, para recuperar un dato puntual:** descifrar la tabla afectada, buscar la fila y volver a insertarla con SQL.
3. **Con una copia propia, para reconstruir toda la base:** crear un proyecto de Supabase nuevo y vacío, aplicar el esquema, cargar las tablas en el orden de sus llaves foráneas (por ejemplo con `INSERT INTO tabla SELECT * FROM jsonb_populate_recordset(null::tabla, '[...]'::jsonb)`), actualizar las variables `DB_*` en Render y verificar con los recorridos completos.

**Estado honesto:** la copia y su verificación están probadas contra la base de Pruebas (41 tablas, 1455 filas, íntegra). **La reconstrucción completa en un proyecto vacío (punto 3) todavía no se ha ensayado.** Antes del lanzamiento conviene hacer ese ensayo una vez en un proyecto de Supabase de prueba y anotar el tiempo que toma.

## 5. Ensayo de recuperación (hacerlo una vez antes del lanzamiento)

- [ ] Sacar una copia cifrada de Pruebas y verificarla.
- [ ] Crear un proyecto de Supabase vacío para el ensayo.
- [ ] Aplicar el esquema y cargar las tablas siguiendo la sección 4, punto 3.
- [ ] Apuntar un servidor local a ese proyecto y correr `npm run test:flows`.
- [ ] Anotar cuánto tardó y qué faltó, y actualizar esta guía.
- [ ] Borrar el proyecto de ensayo.

## 6. Respaldo automático diario (gratis, en dos lugares)

El archivo `.github/workflows/db-backup.yml` corre todos los días a las 02:00 hora de Caracas (y a mano desde GitHub, Actions, "Respaldo diario de la base", Run workflow). Hace:

1. `pg_dump` completo de la base (esquema y datos).
2. Copia de los archivos clínicos de Storage (bucket `clinical-files`).
3. Lo comprime y lo **cifra con AES-256** (`gpg`) con `BACKUP_PASSPHRASE`. Si falta la frase, no corre.
4. Guarda la copia cifrada en:
   - **Copia A:** Releases de un repositorio **privado** aparte (por ejemplo `citamed-backups`). Nunca en `citamed-ve`, que es público: el flujo se niega si se intenta. Conserva 30 días.
   - **Copia B:** Cloudflare R2 (10 GB gratis), carpeta por fecha.

No deja nada en los artifacts de Actions.

### Secretos que hay que crear en GitHub (citamed-ve, Settings, Secrets and variables, Actions)

| Secreto | Contenido |
|---|---|
| `BACKUP_DATABASE_URL` | Cadena del session pooler de Supabase de producción (puerto 5432, con la clave y `?sslmode=require`) |
| `BACKUP_PASSPHRASE` | Frase larga y única. Guardarla en el gestor de contraseñas: sin ella la copia no se abre |
| `BACKUP_REPO` | `jonathanlobo-dev/citamed-backups` (repositorio privado y vacío) |
| `BACKUP_REPO_TOKEN` | Token de GitHub de grano fino con permiso Contents: lectura y escritura solo sobre ese repositorio |
| `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` | Para copiar los archivos clínicos (opcional, pero recomendado) |
| `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` | Para la copia B (opcional) |

Basta con uno de los dos destinos para que corra; lo ideal son los dos.

### Restaurar una copia del flujo automático

```bash
sha256sum -c citamed-AAAA-MM-DD.sha256
gpg --decrypt citamed-AAAA-MM-DD.tar.gz.gpg | tar -xzf - -C restaurado/
psql "$DATABASE_URL_DESTINO" -f restaurado/citamed-db-AAAA-MM-DD.sql
```

El volcado lleva `--clean --if-exists`: **borra las tablas antes de recrearlas**. Usarlo solo contra un proyecto vacío o cuando se acepta perder el estado actual. Los archivos de `restaurado/storage/` se vuelven a subir al bucket con la misma ruta.

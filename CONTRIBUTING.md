# Guia de Contribucion - CITAMED.VE

Gracias por tu interes en contribuir a CITAMED.VE. Este documento describe las pautas para contribuir al proyecto.

## Codigo de Conducta

Este proyecto sigue estandares profesionales de desarrollo. Esperamos que todos los contribuidores:

- Sean respetuosos y profesionales
- Proporcionen feedback constructivo
- Se enfoquen en lo mejor para el proyecto

## Como Contribuir

### 1. Fork y Clone

```bash
# Fork el proyecto en GitHub
# Luego clona tu fork
git clone https://github.com/tu-usuario/citamed-ve.git
cd citamed-ve/proyecto
```

### 2. Crear Rama Feature

```bash
git checkout -b feature/mi-nueva-funcionalidad
```

### 3. Desarrollar

- Escribe codigo limpio y documentado
- Agrega tests para nuevas funcionalidades
- Documenta endpoints nuevos en Swagger

### 4. Commit

```bash
git commit -m 'feat: Agregar nueva funcionalidad'
```

### 5. Push y Pull Request

```bash
git push origin feature/mi-nueva-funcionalidad
```

Luego abre un Pull Request en GitHub.

---

## Estandares de Commits

Usamos [Conventional Commits](https://www.conventionalcommits.org/):

| Tipo | Descripcion |
|------|-------------|
| `feat:` | Nueva funcionalidad |
| `fix:` | Correccion de bug |
| `docs:` | Cambios en documentacion |
| `test:` | Agregar o actualizar tests |
| `refactor:` | Refactorizacion de codigo |
| `style:` | Cambios de formato (sin cambios de logica) |
| `chore:` | Tareas de mantenimiento |
| `perf:` | Mejoras de rendimiento |

### Ejemplos

```bash
feat: Agregar endpoint de busqueda de medicos
fix: Corregir validacion de email en registro
docs: Actualizar documentacion de API
test: Agregar tests para authController
refactor: Simplificar logica de autenticacion
```

---

## Testing

### Requisitos

- Todos los PRs deben incluir tests
- Coverage minimo: 70% para codigo nuevo
- Tests E2E para flujos criticos

### Ejecutar Tests

```bash
# Backend
cd backend
npm test
npm run test:coverage

# Frontend E2E
cd frontend
npm run cypress:run
```

---

## Documentacion

### API (Swagger)

- Documentar todos los endpoints nuevos
- Incluir ejemplos con datos reales
- Usar schemas reutilizables cuando sea posible

### Codigo

- JSDoc en funciones complejas
- Comentarios explicativos donde sea necesario
- Nombres descriptivos para variables y funciones

---

## Revision de Codigo

### Requisitos para Merge

- Minimo 1 aprobacion requerida
- CI/CD debe pasar (todos los tests)
- Sin conflictos con main branch
- Codigo formateado con ESLint

### Checklist PR

- [ ] Tests pasan localmente
- [ ] Documentacion actualizada
- [ ] Sin console.log en produccion
- [ ] Variables de entorno documentadas
- [ ] Migraciones incluidas si hay cambios en BD

---

## Estructura de Archivos

### Backend

```
backend/src/
├── config/       # Configuracion (DB, Swagger)
├── controllers/  # Logica de negocio
├── middleware/   # Auth, validacion
├── models/       # Sequelize models
├── routes/       # Definicion de endpoints
└── server.js     # Punto de entrada
```

### Frontend

```
frontend/src/
├── components/   # Componentes reutilizables
├── pages/        # Vistas principales
├── context/      # Estado global (Auth)
├── hooks/        # Custom hooks
└── utils/        # Funciones utilitarias
```

---

## Preguntas

Si tienes dudas, abre un Issue o contacta al equipo:

- Email: dev@citamed.ve
- GitHub Issues: [Crear Issue](https://github.com/tu-usuario/citamed-ve/issues)

---

**Gracias por contribuir a CITAMED.VE**

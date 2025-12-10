# 🧪 GUÍA DE PRUEBAS - CITAMED.VE ENTERPRISE

## ✅ SERVIDOR ACTIVO

El servidor de desarrollo está corriendo en:
**http://localhost:5173/**

---

## 📋 CHECKLIST DE PRUEBAS

### 1. ABRIR LA APLICACIÓN
- [ ] Abrir http://localhost:5173/ en Chrome/Edge/Firefox
- [ ] Verificar que la página carga sin errores en consola (F12)

### 2. NAVBAR ENTERPRISE
- [ ] Verificar que el navbar tiene efecto glassmorphism
- [ ] Scroll hacia abajo: el navbar debe cambiar de estilo
- [ ] Hover sobre los links: deben tener animación sutil
- [ ] Click en "Módulos": debe hacer scroll suave a esa sección
- [ ] Logo debe tener hover effect (scale 1.05)

### 3. SECCIÓN DE MÓDULOS (PROTAGONISTAS)
- [ ] Verificar background animado con blobs de colores
- [ ] Ver título con gradient text (colores corporativos)
- [ ] Cards deben aparecer con fade-in desde abajo
- [ ] Hover sobre cada card: elevación 3D + glow effect
- [ ] Verificar badges: "ACTIVO" (verde) y "PRÓXIMAMENTE" (naranja)
- [ ] Checkmarks deben animarse al hacer scroll

### 4. RESPONSIVE DESIGN
Abrir DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)

**Mobile (320px):**
- [ ] Navbar muestra hamburger menu
- [ ] Cards apiladas verticalmente (1 columna)
- [ ] Botones full-width
- [ ] Texto legible y bien espaciado

**Tablet (768px):**
- [ ] Grid de 2 columnas para módulos
- [ ] Navbar adaptado

**Desktop (1440px):**
- [ ] Grid de 2 columnas con gaps amplios
- [ ] Todo centrado con container

### 5. ANIMACIONES
- [ ] Scroll suave entre secciones
- [ ] Background blobs animándose (scale + opacity loop)
- [ ] Stagger animation en lista de componentes de cada módulo
- [ ] Hover effects fluidos (60fps, sin lag)

### 6. COLORES CORPORATIVOS
- [ ] Primary: #0B2D4A (Azul marino oscuro) ✅
- [ ] Secondary: #00BFA6 (Teal vibrante) ✅
- [ ] Accent: #FB8C00 (Naranja) ✅
- [ ] Gradientes únicos por módulo ✅

### 7. TOAST NOTIFICATIONS
- [ ] Ir a sección de registro
- [ ] Intentar enviar formulario vacío
- [ ] Debe aparecer toast de error en top-right
- [ ] Toast debe desaparecer después de 5s

---

## 🐛 PROBLEMAS COMUNES Y SOLUCIONES

### Error: "Module not found"
```bash
cd C:\Users\corpo\CITAMED.VE\proyecto\frontend
npm install
```

### Tailwind no genera clases
```bash
# Reiniciar servidor
Ctrl+C
npm run dev
```

### Framer Motion no anima
- Verificar que framer-motion está instalado
- Revisar consola del navegador (F12)

---

## ✨ CARACTERÍSTICAS A VALIDAR

### NIVEL ENTERPRISE
- [x] Glassmorphism en navbar y cards
- [x] Gradientes sutiles y profesionales
- [x] Animaciones fluidas con Framer Motion
- [x] Hover effects en todos los elementos interactivos
- [x] Sistema de diseño consistente
- [x] Código limpio y bien estructurado

### MÓDULOS COMO PROTAGONISTAS
- [x] Cards grandes y visualmente atractivas
- [x] Gradientes únicos por módulo
- [x] Glow effects en hover
- [x] Badges de estado claros
- [x] Lista de features con checkmarks

---

## 📊 MÉTRICAS ESPERADAS

### Lighthouse Audit (DevTools → Lighthouse)
- Performance: > 85
- Accessibility: > 90
- Best Practices: > 90
- SEO: > 85

---

## 🎯 PRÓXIMOS PASOS DESPUÉS DE PROBAR

Si todo funciona correctamente:
1. ✅ Modernizar otras secciones con el mismo estilo
2. ✅ Agregar lazy loading a secciones pesadas
3. ✅ Mejorar manejo de errores en registro (timeout 30s)
4. ✅ Optimizar imágenes (webp)
5. ✅ Implementar page transitions

---

## 💡 NOTAS

- El servidor debe estar corriendo (npm run dev)
- Usar navegadores modernos (Chrome 90+, Firefox 88+, Safari 14+)
- Para mejor experiencia, probar en pantalla grande (1440px+)

---

**Estado:** ✅ Listo para pruebas
**Servidor:** http://localhost:5173/
**Nivel:** Enterprise Gamma Alta ⭐⭐⭐⭐⭐

# 🔧 SCRIPT DE REPARACIÓN AUTOMÁTICA - CITAMED.VE
# Este script arregla todos los problemas del frontend

Write-Host "🔍 DIAGNÓSTICO CITAMED.VE" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

$frontendPath = "C:\Users\corpo\CITAMED.VE\proyecto\frontend"
$srcPath = "$frontendPath\src"

# PASO 1: Verificar estructura
Write-Host "`n📁 Verificando estructura..." -ForegroundColor Yellow
if (Test-Path $srcPath) {
    Write-Host "✅ Carpeta src encontrada" -ForegroundColor Green
} else {
    Write-Host "❌ ERROR: No se encuentra la carpeta src" -ForegroundColor Red
    exit
}

# PASO 2: Detener servidor si está corriendo
Write-Host "`n🛑 Deteniendo servidor..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
Start-Sleep -Seconds 2
Write-Host "✅ Servidor detenido" -ForegroundColor Green

# PASO 3: Limpiar cache
Write-Host "`n🧹 Limpiando cache..." -ForegroundColor Yellow
Remove-Item "$frontendPath\node_modules\.vite" -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item "$frontendPath\dist" -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "✅ Cache limpiado" -ForegroundColor Green

# PASO 4: Listar archivos App actuales
Write-Host "`n📋 Archivos App encontrados:" -ForegroundColor Yellow
Get-ChildItem -Path $srcPath -Filter "*app*" | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor White
}

# PASO 5: Buscar contenido problemático
Write-Host "`n🔍 Buscando 'Quiénes Somos'..." -ForegroundColor Yellow
$appFiles = Get-ChildItem -Path $srcPath -Filter "*app*.jsx"
foreach ($file in $appFiles) {
    $content = Get-Content $file.FullName -Raw
    if ($content -match "Quiénes Somos") {
        Write-Host "  ❌ Encontrado en: $($file.Name)" -ForegroundColor Red
    } else {
        Write-Host "  ✅ NO encontrado en: $($file.Name)" -ForegroundColor Green
    }
}

# PASO 6: Borrar TODOS los archivos App
Write-Host "`n🗑️  Borrando todos los archivos App..." -ForegroundColor Yellow
Remove-Item "$srcPath\App.jsx" -Force -ErrorAction SilentlyContinue
Remove-Item "$srcPath\app.jsx" -Force -ErrorAction SilentlyContinue
Remove-Item "$srcPath\App-*.jsx" -Force -ErrorAction SilentlyContinue
Write-Host "✅ Archivos borrados" -ForegroundColor Green

# PASO 7: Verificar que se borraron
Write-Host "`n✔️  Verificando borrado..." -ForegroundColor Yellow
$remaining = Get-ChildItem -Path $srcPath -Filter "*app*.jsx" -ErrorAction SilentlyContinue
if ($remaining.Count -eq 0) {
    Write-Host "✅ Todos los archivos App borrados correctamente" -ForegroundColor Green
} else {
    Write-Host "⚠️  Aún quedan archivos:" -ForegroundColor Yellow
    $remaining | ForEach-Object { Write-Host "  - $($_.Name)" -ForegroundColor White }
}

# PASO 8: Instrucciones finales
Write-Host "`n" -NoNewline
Write-Host "================================" -ForegroundColor Cyan
Write-Host "✅ DIAGNÓSTICO COMPLETADO" -ForegroundColor Green
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`n📥 AHORA:" -ForegroundColor Yellow
Write-Host "1. Descarga: App-REALMENTE-LIMPIO.jsx" -ForegroundColor White
Write-Host "2. Guárdalo en: $srcPath\App.jsx" -ForegroundColor White
Write-Host "3. Ejecuta: cd $frontendPath" -ForegroundColor White
Write-Host "4. Ejecuta: npm run dev" -ForegroundColor White
Write-Host "5. Abre navegador incógnito: http://localhost:5173" -ForegroundColor White

Write-Host "`n✨ Presiona cualquier tecla para salir..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
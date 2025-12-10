# 🔍 DIAGNÓSTICO COMPLETO CITAMED.VE
Write-Host "================================" -ForegroundColor Cyan
Write-Host "🔍 DIAGNÓSTICO COMPLETO" -ForegroundColor Cyan
Write-Host "================================`n" -ForegroundColor Cyan

$srcPath = "C:\Users\corpo\CITAMED.VE\proyecto\frontend\src"

# 1. NAVBAR
Write-Host "📋 REVISANDO NAVBAR.JSX..." -ForegroundColor Yellow
$navbarPath = "$srcPath\components\layout\Navbar.jsx"
if (Test-Path $navbarPath) {
    $navbarContent = Get-Content $navbarPath -Raw
    
    Write-Host "`nBuscando 'Manifestación':" -ForegroundColor White
    if ($navbarContent -match "Manifestación") {
        Write-Host "  ❌ ENCONTRADO 'Manifestación' en Navbar" -ForegroundColor Red
        $lines = Select-String -Path $navbarPath -Pattern "Manifestación"
        foreach ($line in $lines) {
            Write-Host "    Línea $($line.LineNumber): $($line.Line.Trim())" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ NO tiene 'Manifestación'" -ForegroundColor Green
    }
    
    Write-Host "`nBuscando 'Demo':" -ForegroundColor White
    if ($navbarContent -match "Demo") {
        Write-Host "  ✅ TIENE 'Demo'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ NO tiene 'Demo'" -ForegroundColor Red
    }
    
    Write-Host "`nBuscando 'FAQ':" -ForegroundColor White
    if ($navbarContent -match "FAQ") {
        Write-Host "  ✅ TIENE 'FAQ'" -ForegroundColor Green
    } else {
        Write-Host "  ❌ NO tiene 'FAQ'" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ NO EXISTE Navbar.jsx" -ForegroundColor Red
}

# 2. APP.JSX
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📋 REVISANDO APP.JSX..." -ForegroundColor Yellow
$appPath = "$srcPath\App.jsx"
if (Test-Path $appPath) {
    $appContent = Get-Content $appPath -Raw
    
    Write-Host "`nBuscando 'Quiénes Somos':" -ForegroundColor White
    if ($appContent -match "Quiénes Somos") {
        Write-Host "  ❌ ENCONTRADO 'Quiénes Somos'" -ForegroundColor Red
        $lines = Select-String -Path $appPath -Pattern "Quiénes Somos"
        foreach ($line in $lines) {
            Write-Host "    Línea $($line.LineNumber)" -ForegroundColor Red
        }
    } else {
        Write-Host "  ✅ NO tiene 'Quiénes Somos'" -ForegroundColor Green
    }
} else {
    Write-Host "  ❌ NO EXISTE App.jsx" -ForegroundColor Red
}

# 3. CACHE
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📋 REVISANDO CACHE..." -ForegroundColor Yellow
$cachePath = "C:\Users\corpo\CITAMED.VE\proyecto\frontend\node_modules\.vite"
if (Test-Path $cachePath) {
    Write-Host "  ⚠️ Cache de Vite existe" -ForegroundColor Yellow
} else {
    Write-Host "  ✅ Sin cache" -ForegroundColor Green
}

# 4. SERVIDOR
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📋 REVISANDO SERVIDOR..." -ForegroundColor Yellow
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcesses) {
    Write-Host "  ✅ Servidor corriendo (PID: $($nodeProcesses.Id -join ', '))" -ForegroundColor Green
} else {
    Write-Host "  ⚠️ Servidor NO corriendo" -ForegroundColor Yellow
}

# RESUMEN
Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "📊 RESUMEN" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

Write-Host "`n🔧 ACCIONES NECESARIAS:" -ForegroundColor Yellow

# Determinar qué arreglar
$needsNavbarFix = $false
$needsAppFix = $false
$needsCacheClear = $false

if (Test-Path $navbarPath) {
    $navContent = Get-Content $navbarPath -Raw
    if ($navContent -match "Manifestación") {
        $needsNavbarFix = $true
        Write-Host "  ❌ Navbar.jsx tiene 'Manifestación'" -ForegroundColor Red
    }
}

if (Test-Path $appPath) {
    $appCont = Get-Content $appPath -Raw
    if ($appCont -match "Quiénes Somos") {
        $needsAppFix = $true
        Write-Host "  ❌ App.jsx tiene 'Quiénes Somos'" -ForegroundColor Red
    }
}

if (Test-Path $cachePath) {
    $needsCacheClear = $true
    Write-Host "  ⚠️ Limpiar cache de Vite" -ForegroundColor Yellow
}

if (-not $needsNavbarFix -and -not $needsAppFix -and -not $needsCacheClear) {
    Write-Host "`n✅ Todo está bien en los archivos" -ForegroundColor Green
    Write-Host "   El problema es CACHE DEL NAVEGADOR" -ForegroundColor Yellow
    Write-Host "`n   Solución:" -ForegroundColor White
    Write-Host "   1. Abre navegador incógnito (Ctrl+Shift+N)" -ForegroundColor White
    Write-Host "   2. Ve a http://localhost:5173" -ForegroundColor White
}

Write-Host "`n================================" -ForegroundColor Cyan
Write-Host "Diagnóstico guardado." -ForegroundColor Green
Write-Host "Presiona Enter para salir..." -ForegroundColor Cyan
Read-Host
# Script de limpieza - CITAMED Backend
# Elimina archivos duplicados y deja solo la estructura correcta

Write-Host "🧹 LIMPIANDO BACKEND..." -ForegroundColor Cyan
Write-Host ""

# 1. ELIMINAR .env de src/ (no debe estar ahí)
if (Test-Path "src/.env") {
    Remove-Item "src/.env" -Force
    Write-Host "✅ Eliminado: src/.env" -ForegroundColor Green
} else {
    Write-Host "ℹ️  No existe src/.env" -ForegroundColor Gray
}

# 2. VERIFICAR que .env raíz tenga JWT_SECRET
$envContent = Get-Content ".env" -Raw
if ($envContent -notmatch "JWT_SECRET") {
    Write-Host "⚠️  Agregando JWT_SECRET al .env raíz..." -ForegroundColor Yellow
    Add-Content ".env" "`nJWT_SECRET=citamed_super_secret_key_2025_muy_segura_para_produccion_cambiar"
    Add-Content ".env" "JWT_EXPIRES_IN=7d"
    Write-Host "✅ JWT_SECRET agregado" -ForegroundColor Green
} else {
    Write-Host "✅ .env raíz ya tiene JWT_SECRET" -ForegroundColor Green
}

# 3. ELIMINAR archivos de diagnóstico
if (Test-Path "diagnostico-tabla.js") {
    Remove-Item "diagnostico-tabla.js" -Force
    Write-Host "✅ Eliminado: diagnostico-tabla.js" -ForegroundColor Green
}

# 4. MOSTRAR .env final
Write-Host ""
Write-Host "📋 CONTENIDO FINAL DE .env:" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Gray
Get-Content ".env"
Write-Host "================================" -ForegroundColor Gray
Write-Host ""

Write-Host "✅ LIMPIEZA COMPLETADA" -ForegroundColor Green
Write-Host ""
Write-Host "🔄 AHORA EJECUTA:" -ForegroundColor Yellow
Write-Host "   node src/server.js" -ForegroundColor White
// scripts/diagnose-models.js
// Script de diagnóstico profundo para identificar problemas en modelos

require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔍 DIAGNÓSTICO PROFUNDO DE MODELOS');
console.log('=====================================\n');

const modelsDir = path.join(__dirname, '../src/models');
const modelFiles = ['User.js', 'Specialty.js', 'DoctorProfile.js', 'PatientProfile.js', 'Appointment.js'];

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  
  console.log(`\n📄 Analizando: ${file}`);
  console.log('─'.repeat(50));
  
  if (!fs.existsSync(filePath)) {
    console.log('  ❌ Archivo no encontrado');
    return;
  }
  
  try {
    // Leer el contenido del archivo
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Análisis 1: Verificar patrón de exportación
    console.log('\n  🔍 Análisis de exportación:');
    
    if (content.includes('module.exports = (sequelize)')) {
      console.log('    ✅ Exporta función con parámetro sequelize');
    } else if (content.includes('module.exports =') && content.includes('class')) {
      console.log('    ❌ PROBLEMA: Exporta clase directamente');
      console.log('    💡 Solución: Debe exportar función que retorne el modelo');
    } else if (content.includes('class') && content.includes('extends Model')) {
      console.log('    ⚠️  Define clase que extiende Model');
      
      if (content.includes('module.exports = ') && !content.includes('(sequelize)')) {
        console.log('    ❌ PROBLEMA: Exportación incorrecta de clase Model');
      }
    } else {
      console.log('    ⚠️  Patrón de exportación no reconocido');
    }
    
    // Análisis 2: Contar parámetros esperados
    const exportMatch = content.match(/module\.exports\s*=\s*\(([^)]*)\)/);
    if (exportMatch) {
      const params = exportMatch[1].split(',').map(p => p.trim()).filter(p => p);
      console.log(`    ℹ️  Parámetros: ${params.length} (${params.join(', ')})`);
      
      if (params.length !== 1) {
        console.log(`    ⚠️  Debería tener exactamente 1 parámetro (sequelize)`);
      }
    }
    
    // Análisis 3: Verificar si usa sequelize.define
    if (content.includes('sequelize.define(')) {
      console.log('    ✅ Usa sequelize.define()');
    } else if (content.includes('.define(')) {
      console.log('    ⚠️  Usa .define() pero verifica el objeto');
    } else {
      console.log('    ⚠️  No detecta uso de sequelize.define()');
    }
    
    // Análisis 4: Mostrar primeras líneas del archivo
    console.log('\n  📝 Primeras líneas del archivo:');
    const lines = content.split('\n').slice(0, 15);
    lines.forEach((line, i) => {
      console.log(`    ${String(i + 1).padStart(2, ' ')} | ${line}`);
    });
    
    // Análisis 5: Intentar cargar el módulo
    console.log('\n  🧪 Prueba de carga:');
    try {
      const ModelFunction = require(filePath);
      console.log(`    ℹ️  Tipo exportado: ${typeof ModelFunction}`);
      
      if (typeof ModelFunction === 'function') {
        console.log(`    ℹ️  Parámetros esperados: ${ModelFunction.length}`);
        
        if (ModelFunction.length !== 1) {
          console.log(`    ⚠️  Debería esperar 1 parámetro, no ${ModelFunction.length}`);
        } else {
          console.log('    ✅ Función correcta con 1 parámetro');
        }
      } else if (typeof ModelFunction === 'object' && ModelFunction.name) {
        console.log('    ❌ PROBLEMA CRÍTICO: Exporta clase/objeto, no función');
        console.log('    💡 Este es el error que causa "cannot be invoked without new"');
      }
    } catch (error) {
      console.log(`    ❌ Error al cargar: ${error.message}`);
    }
    
  } catch (error) {
    console.log(`  ❌ Error leyendo archivo: ${error.message}`);
  }
});

console.log('\n\n=====================================');
console.log('📊 RESUMEN DEL DIAGNÓSTICO');
console.log('=====================================\n');

console.log('Si ves "❌ PROBLEMA: Exporta clase directamente", ese es tu problema.');
console.log('Cada modelo debe seguir este formato:\n');
console.log('```javascript');
console.log('const { DataTypes } = require("sequelize");');
console.log('');
console.log('module.exports = (sequelize) => {');
console.log('  const ModelName = sequelize.define("ModelName", {');
console.log('    // campos...');
console.log('  });');
console.log('  return ModelName;');
console.log('};');
console.log('```\n');

console.log('🔧 Para corregir:');
console.log('1. Copia el contenido de User-CORRECTO.js');
console.log('2. Adapta los campos a tu modelo actual');
console.log('3. Aplica el mismo patrón a todos los modelos\n');
// scripts/verify-models.js
// Script para verificar que los modelos estén correctamente definidos

require('dotenv').config();

console.log('🔍 VERIFICACIÓN DE MODELOS - CITAMED.VE');
console.log('========================================\n');

// Función para verificar un modelo
function verifyModel(modelPath, modelName) {
  try {
    console.log(`📦 Verificando ${modelName}...`);
    
    // Intentar cargar el modelo
    const ModelFunction = require(modelPath);
    
    // Verificar que es una función
    if (typeof ModelFunction !== 'function') {
      console.log(`  ❌ ${modelName} no exporta una función`);
      console.log(`  ℹ️  Tipo exportado: ${typeof ModelFunction}`);
      return false;
    }
    
    // Verificar cuántos parámetros acepta
    const paramCount = ModelFunction.length;
    console.log(`  ℹ️  Parámetros esperados: ${paramCount}`);
    
    if (paramCount !== 1) {
      console.log(`  ⚠️  El modelo espera ${paramCount} parámetros, debería ser 1 (sequelize)`);
    }
    
    console.log(`  ✅ ${modelName} verificado\n`);
    return true;
    
  } catch (error) {
    console.log(`  ❌ Error cargando ${modelName}:`);
    console.log(`     ${error.message}\n`);
    return false;
  }
}

// Verificar todos los modelos
const modelsToVerify = [
  { path: '../src/models/User', name: 'User' },
  { path: '../src/models/Specialty', name: 'Specialty' },
  { path: '../src/models/DoctorProfile', name: 'DoctorProfile' },
  { path: '../src/models/PatientProfile', name: 'PatientProfile' },
  { path: '../src/models/Appointment', name: 'Appointment' }
];

let allValid = true;

modelsToVerify.forEach(model => {
  const isValid = verifyModel(model.path, model.name);
  if (!isValid) allValid = false;
});

console.log('========================================');
if (allValid) {
  console.log('✅ TODOS LOS MODELOS ESTÁN CORRECTOS');
  console.log('Puedes proceder con: node scripts/sync-db-module2.js\n');
} else {
  console.log('❌ ALGUNOS MODELOS TIENEN PROBLEMAS');
  console.log('Por favor, revisa los errores arriba.\n');
  process.exit(1);
}
// scripts/fix-env-definitivo.js
// Arregla el archivo .env de forma definitiva

const fs = require('fs');
const path = require('path');

console.log('\n🔧 ARREGLANDO .ENV DEFINITIVAMENTE');
console.log('='.repeat(50));

// Ruta al archivo .env
const envPath = path.join(__dirname, '..', '.env');
const envBackupPath = path.join(__dirname, '..', '.env.backup');

console.log('\n📍 PASO 1: Verificando archivo actual...');
console.log(`   Ubicación: ${envPath}`);

// Hacer backup del .env actual
if (fs.existsSync(envPath)) {
  console.log('   ℹ️  Archivo .env encontrado');
  
  // Leer contenido actual
  const currentContent = fs.readFileSync(envPath, 'utf8');
  console.log('\n   📄 Contenido actual:');
  console.log('   ' + '─'.repeat(40));
  currentContent.split('\n').forEach((line, i) => {
    // Ocultar la contraseña en el log
    if (line.includes('DB_PASSWORD=')) {
      console.log(`   ${i + 1}: DB_PASSWORD=***********`);
    } else {
      console.log(`   ${i + 1}: ${line}`);
    }
  });
  console.log('   ' + '─'.repeat(40));
  
  // Hacer backup
  fs.writeFileSync(envBackupPath, currentContent);
  console.log(`\n   💾 Backup creado: .env.backup`);
} else {
  console.log('   ⚠️  No se encontró archivo .env');
}

console.log('\n🗑️  PASO 2: Eliminando archivo problemático...');
if (fs.existsSync(envPath)) {
  fs.unlinkSync(envPath);
  console.log('   ✅ Archivo .env eliminado');
}

console.log('\n📝 PASO 3: Creando nuevo .env limpio...');

// Contenido del nuevo .env (sin BOM, sin caracteres raros)
const newEnvContent = `DB_HOST=localhost
DB_PORT=5432
DB_NAME=citamed_development
DB_USER=postgres
DB_PASSWORD=citamed1523`;

// Escribir con encoding UTF-8 sin BOM
fs.writeFileSync(envPath, newEnvContent, { encoding: 'utf8' });
console.log('   ✅ Nuevo .env creado');

// Verificar que se escribió correctamente
const verifyContent = fs.readFileSync(envPath, 'utf8');
console.log('\n   📄 Contenido del nuevo archivo:');
console.log('   ' + '─'.repeat(40));
verifyContent.split('\n').forEach((line, i) => {
  if (line.includes('DB_PASSWORD=')) {
    console.log(`   ${i + 1}: DB_PASSWORD=***********`);
  } else {
    console.log(`   ${i + 1}: ${line}`);
  }
});
console.log('   ' + '─'.repeat(40));

console.log('\n🧪 PASO 4: Probando conexión con el nuevo .env...');

// Limpiar el cache de dotenv
delete require.cache[require.resolve('dotenv')];
delete require.cache[require.resolve('../src/config/database')];

// Recargar dotenv
require('dotenv').config();

console.log('\n   📊 Variables cargadas:');
console.log(`   DB_HOST: ${process.env.DB_HOST}`);
console.log(`   DB_PORT: ${process.env.DB_PORT}`);
console.log(`   DB_NAME: ${process.env.DB_NAME}`);
console.log(`   DB_USER: ${process.env.DB_USER}`);
console.log(`   DB_PASSWORD: ${process.env.DB_PASSWORD ? '***********' : '⚠️  NO CARGADA'}`);

// Verificar que la contraseña es un string
if (typeof process.env.DB_PASSWORD === 'string') {
  console.log('   ✅ DB_PASSWORD es un string válido');
  console.log(`   ✅ Longitud: ${process.env.DB_PASSWORD.length} caracteres`);
} else {
  console.log(`   ❌ DB_PASSWORD NO es un string. Tipo: ${typeof process.env.DB_PASSWORD}`);
}

// Probar conexión real
console.log('\n🔌 PASO 5: Probando conexión a PostgreSQL...');

const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    dialect: 'postgres',
    logging: false
  }
);

sequelize.authenticate()
  .then(() => {
    console.log('   ✅ ¡CONEXIÓN EXITOSA!');
    console.log('\n' + '='.repeat(50));
    console.log('✅ PROBLEMA RESUELTO COMPLETAMENTE');
    console.log('='.repeat(50));
    console.log('\n🎉 El archivo .env está funcionando perfectamente');
    console.log('   Tu contraseña: citamed1523');
    console.log('   Archivo: backend/.env');
    console.log('\n🚀 PRÓXIMO PASO:');
    console.log('   Ejecuta: node scripts\\verify-module2.js\n');
    process.exit(0);
  })
  .catch(error => {
    console.log('   ❌ Error en la conexión');
    console.log(`   Mensaje: ${error.message}`);
    console.log('\n' + '='.repeat(50));
    console.log('❌ AÚN HAY UN PROBLEMA');
    console.log('='.repeat(50));
    console.log('\n🔍 Información de Debug:');
    console.log(`   DB_PASSWORD type: ${typeof process.env.DB_PASSWORD}`);
    console.log(`   DB_PASSWORD value: ${process.env.DB_PASSWORD || 'undefined'}`);
    console.log(`   DB_PASSWORD length: ${process.env.DB_PASSWORD?.length || 0}`);
    console.log('\n💡 Copia TODO este output y pégalo en el chat\n');
    process.exit(1);
  });
  
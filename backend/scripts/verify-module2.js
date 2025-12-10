// scripts/verify-module2.js
// VERIFICACIÓN COMPLETA DEL MÓDULO 2 - CITAMED.VE

require('dotenv').config();
const { User, Specialty, DoctorProfile, PatientProfile, Appointment } = require('../src/models');
const sequelize = require('../src/config/database');

async function verifyModule2() {
  console.log('\n🔍 VERIFICACIÓN DEL MÓDULO 2 - CITAMED.VE');
  console.log('='.repeat(50));
  
  const errors = [];
  const warnings = [];
  
  try {
    // 1. VERIFICAR CONEXIÓN
    console.log('\n📡 1. Verificando conexión a PostgreSQL...');
    await sequelize.authenticate();
    console.log('   ✅ Conexión exitosa');
    
    // 2. VERIFICAR MODELOS
    console.log('\n📦 2. Verificando modelos cargados...');
    const models = { User, Specialty, DoctorProfile, PatientProfile, Appointment };
    for (const [name, model] of Object.entries(models)) {
      if (model) {
        console.log(`   ✅ ${name} cargado correctamente`);
      } else {
        errors.push(`Modelo ${name} no está definido`);
        console.log(`   ❌ ${name} NO cargado`);
      }
    }
    
    // 3. VERIFICAR TABLAS EN LA BASE DE DATOS
    console.log('\n🗄️  3. Verificando tablas en la base de datos...');
    const tables = ['users', 'specialties', 'doctor_profiles', 'patient_profiles', 'appointments'];
    
    for (const table of tables) {
      try {
        const [results] = await sequelize.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = 'public' AND table_name = '${table}'`
        );
        
        if (results[0].count > 0) {
          const [countResult] = await sequelize.query(`SELECT COUNT(*) as count FROM "${table}"`);
          console.log(`   ✅ ${table} existe (${countResult[0].count} registros)`);
        } else {
          errors.push(`Tabla ${table} no existe`);
          console.log(`   ❌ ${table} NO existe`);
        }
      } catch (error) {
        errors.push(`Error verificando tabla ${table}: ${error.message}`);
        console.log(`   ❌ Error en ${table}`);
      }
    }
    
    // 4. VERIFICAR ESPECIALIDADES
    console.log('\n🏥 4. Verificando especialidades médicas...');
    const specialtyCount = await Specialty.count();
    
    if (specialtyCount === 0) {
      errors.push('No hay especialidades cargadas');
      console.log('   ❌ No hay especialidades en la base de datos');
      console.log('   💡 Ejecuta: node seeders/specialties-seed.js');
    } else {
      console.log(`   ✅ ${specialtyCount} especialidades cargadas`);
      
      // Mostrar algunas especialidades
      const specialties = await Specialty.findAll({
        attributes: ['name', 'category', 'displayOrder'],
        limit: 5,
        order: [['displayOrder', 'ASC']]
      });
      
      console.log('\n   📋 Primeras 5 especialidades:');
      specialties.forEach(s => {
        console.log(`      • ${s.name} (${s.category})`);
      });
    }
    
    // 5. VERIFICAR ASOCIACIONES
    console.log('\n🔗 5. Verificando asociaciones entre modelos...');
    
    const associations = [
      { model: 'User', hasMany: ['DoctorProfile', 'PatientProfile'] },
      { model: 'Specialty', hasMany: ['DoctorProfile'] },
      { model: 'DoctorProfile', belongsTo: ['User', 'Specialty'] },
      { model: 'PatientProfile', belongsTo: ['User'] },
      { model: 'Appointment', belongsTo: ['User', 'DoctorProfile', 'Specialty'] }
    ];
    
    for (const assoc of associations) {
      const modelName = assoc.model;
      const model = models[modelName];
      
      if (model && model.associations) {
        console.log(`   ✅ ${modelName}: ${Object.keys(model.associations).length} asociaciones`);
      } else {
        warnings.push(`${modelName} no tiene asociaciones definidas`);
        console.log(`   ⚠️  ${modelName}: Sin asociaciones`);
      }
    }
    
    // 6. VERIFICAR ÍNDICES
    console.log('\n📊 6. Verificando índices en las tablas...');
    
    const indexQueries = {
      users: "SELECT indexname FROM pg_indexes WHERE tablename = 'users'",
      specialties: "SELECT indexname FROM pg_indexes WHERE tablename = 'specialties'",
      doctor_profiles: "SELECT indexname FROM pg_indexes WHERE tablename = 'doctor_profiles'",
      patient_profiles: "SELECT indexname FROM pg_indexes WHERE tablename = 'patient_profiles'",
      appointments: "SELECT indexname FROM pg_indexes WHERE tablename = 'appointments'"
    };
    
    for (const [table, query] of Object.entries(indexQueries)) {
      try {
        const [indexes] = await sequelize.query(query);
        console.log(`   ✅ ${table}: ${indexes.length} índices`);
      } catch (error) {
        warnings.push(`No se pudieron verificar índices en ${table}`);
      }
    }
    
    // 7. VERIFICAR ENUMS
    console.log('\n🏷️  7. Verificando tipos ENUM...');
    
    const [enums] = await sequelize.query(`
      SELECT typname FROM pg_type 
      WHERE typname LIKE 'enum_%' 
      ORDER BY typname
    `);
    
    console.log(`   ✅ ${enums.length} tipos ENUM encontrados`);
    
    if (enums.length > 0) {
      console.log('\n   📋 ENUMs creados:');
      enums.slice(0, 5).forEach(e => {
        console.log(`      • ${e.typname}`);
      });
      if (enums.length > 5) {
        console.log(`      ... y ${enums.length - 5} más`);
      }
    }
    
    // 8. VERIFICAR CONSTRAINTS Y FOREIGN KEYS
    console.log('\n🔐 8. Verificando constraints y foreign keys...');
    
    const [constraints] = await sequelize.query(`
      SELECT 
        tc.table_name,
        tc.constraint_type,
        COUNT(*) as count
      FROM information_schema.table_constraints tc
      WHERE tc.table_schema = 'public'
        AND tc.table_name IN ('users', 'specialties', 'doctor_profiles', 'patient_profiles', 'appointments')
      GROUP BY tc.table_name, tc.constraint_type
      ORDER BY tc.table_name, tc.constraint_type
    `);
    
    console.log('   ✅ Constraints encontrados:');
    constraints.forEach(c => {
      console.log(`      • ${c.table_name}: ${c.count} ${c.constraint_type}`);
    });
    
    // RESUMEN FINAL
    console.log('\n' + '='.repeat(50));
    console.log('📊 RESUMEN DE VERIFICACIÓN');
    console.log('='.repeat(50));
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n✅ TODO PERFECTO - MÓDULO 2 COMPLETO');
      console.log('\n🎯 El Módulo 2 está correctamente configurado y listo.');
      console.log('   Puedes avanzar al siguiente módulo con confianza.\n');
      return true;
    } else {
      if (errors.length > 0) {
        console.log('\n❌ ERRORES ENCONTRADOS:');
        errors.forEach((err, i) => {
          console.log(`   ${i + 1}. ${err}`);
        });
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️  ADVERTENCIAS:');
        warnings.forEach((warn, i) => {
          console.log(`   ${i + 1}. ${warn}`);
        });
      }
      
      console.log('\n💡 Revisa los errores antes de continuar.\n');
      return false;
    }
    
  } catch (error) {
    console.error('\n❌ ERROR CRÍTICO EN LA VERIFICACIÓN:');
    console.error(error.message);
    console.error('\n📋 Stack trace:');
    console.error(error.stack);
    return false;
  } finally {
    await sequelize.close();
  }
}

// Ejecutar verificación
verifyModule2()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Error ejecutando verificación:', error);
    process.exit(1);
  });
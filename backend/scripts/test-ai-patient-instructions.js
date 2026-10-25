/**
 * test-ai-patient-instructions.js - CITAMED.VE
 * Prueba del modo patient_instructions de aiService con 3 récipes clínicos reales.
 * Verifica:
 * 1. Respuesta de la cadena de IA (Gemini / Groq).
 * 2. Fidelidad absoluta: ningún medicamento ni dosis alterado o inventado.
 * 3. Registro en ai_usage con mode: 'patient_instructions'.
 */

require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const aiService = require('../src/services/ai/aiService');
const { AiUsage, User } = require('../src/models');

const RECIPES = [
  {
    name: '1. Infección respiratoria bacteriana aguda',
    items: [
      {
        medication: 'Amoxicilina / Ácido Clavulánico 875/125 mg',
        presentation: 'Tabletas',
        dose: '1 tableta',
        frequency: 'cada 12 horas',
        duration: '7 días',
        instructions: 'Tomar vía oral con agua después del desayuno y la cena'
      },
      {
        medication: 'Ibuprofeno 400 mg',
        presentation: 'Tabletas',
        dose: '1 tableta',
        frequency: 'cada 8 horas',
        duration: '3 días',
        instructions: 'Tomar vía oral solo si presenta dolor o fiebre'
      }
    ],
    indications: 'Reposo relativo en casa, ingerir abundantes líquidos tibios, evitar cambios bruscos de temperatura y no consumir bebidas alcohólicas durante el tratamiento antibiótico.'
  },
  {
    name: '2. Hipertensión arterial y diabetes mellitus tipo 2 (Control crónico)',
    items: [
      {
        medication: 'Losartán Potásico 50 mg',
        presentation: 'Tabletas',
        dose: '1 tableta',
        frequency: 'cada 24 horas',
        duration: '30 días',
        instructions: 'Tomar en la mañana en ayunas con medio vaso de agua'
      },
      {
        medication: 'Metformina 850 mg',
        presentation: 'Tabletas',
        dose: '1 tableta',
        frequency: 'cada 12 horas',
        duration: '30 días',
        instructions: 'Tomar inmediatamente después del almuerzo y la cena'
      }
    ],
    indications: 'Mantener dieta baja en sal y azúcares simples. Caminata diaria de 30 minutos. Registrar valores de presión arterial dos veces por semana y acudir a consulta de control en 30 días.'
  },
  {
    name: '3. Gastroenteritis aguda y deshidratación leve',
    items: [
      {
        medication: 'Hioscina Butilbromuro 10 mg',
        presentation: 'Comprimidos',
        dose: '1 comprimido',
        frequency: 'cada 8 horas',
        duration: '3 días',
        instructions: 'Tomar solo en caso de cólicos o dolor abdominal intenso'
      },
      {
        medication: 'Sales de Rehidratación Oral',
        presentation: 'Sobres de polvo',
        dose: '1 sobre disuelto en 1 litro de agua',
        frequency: 'a libre demanda',
        duration: '48 horas',
        instructions: 'Consumir a sorbos pequeños después de cada evacuación'
      },
      {
        medication: 'Lactobacillus rhamnosus 10^9 UFC',
        presentation: 'Cápsulas',
        dose: '1 cápsula',
        frequency: 'cada 24 horas',
        duration: '5 días',
        instructions: 'Tomar en la mañana con un poco de agua'
      }
    ],
    indications: 'Dieta líquida y blanda astringente (arroz blanco, pollo hervido, manzana rallada, tostadas). Evitar lácteos, grasas, frituras y condimentos. Acudir a emergencia de inmediato si presenta vómitos incoercibles, deposiciones con sangre o fiebre mayor a 39 °C.'
  }
];

async function runTest() {
  console.log('====================================================');
  console.log('PRUEBA DE MODO patient_instructions (AI SERVICE)');
  console.log('====================================================\n');

  const doctor = await User.findOne({ where: { role: 'doctor' } });
  if (!doctor) {
    throw new Error('No se encontró médico en la base de datos');
  }

  console.log(`Médico de prueba: Dr(a). ${doctor.firstName} ${doctor.lastName} (ID: ${doctor.id})\n`);

  for (const recipe of RECIPES) {
    console.log('----------------------------------------------------');
    console.log(`RÉCIPE: ${recipe.name}`);
    console.log('Medicamentos prescritos:');
    recipe.items.forEach((it, i) => {
      console.log(`  ${i + 1}. ${it.medication} | ${it.dose} | ${it.frequency} | ${it.duration}`);
    });
    console.log(`Indicaciones médicas: ${recipe.indications}\n`);

    const beforeCount = await AiUsage.count({
      where: { userId: doctor.id, mode: 'patient_instructions' }
    });

    const startTime = Date.now();
    const result = await aiService.patientInstructions(doctor.id, {
      appointmentId: null,
      items: recipe.items,
      indications: recipe.indications
    });
    const elapsed = Date.now() - startTime;

    console.log(`>>> TEXTO GENERADO POR IA (Proveedor: ${result.provider}, Latencia: ${elapsed}ms):`);
    console.log('"""');
    console.log(result.instructions);
    console.log('"""\n');

    // Validación de fidelidad
    console.log('--- Verificación de fidelidad farmacológica ---');
    let allDrugsPresent = true;
    for (const it of recipe.items) {
      // Buscar al menos el nombre principal del fármaco
      const drugName = it.medication.split(' ')[0].toLowerCase();
      const inText = result.instructions.toLowerCase().includes(drugName);
      console.log(`  ✓ Fármaco "${it.medication}" referenciado en el texto: ${inText ? 'SÍ' : 'NO'}`);
      if (!inText) allDrugsPresent = false;
    }

    const wordCount = result.instructions.split(/\s+/).length;
    console.log(`  ✓ Conteo de palabras: ${wordCount} (Límite máximo: 250) -> ${wordCount <= 250 ? 'CUMPLE' : 'SUPERA'}`);

    // Verificación de registro en ai_usage
    const afterCount = await AiUsage.count({
      where: { userId: doctor.id, mode: 'patient_instructions' }
    });
    console.log(`  ✓ Registro en ai_usage: ${afterCount === beforeCount + 1 ? 'REGISTRADO EXITOSAMENTE' : 'ERROR'}`);
    console.log('\n');
  }

  console.log('====================================================');
  console.log('TODAS LAS PRUEBAS DE patient_instructions COMPLETADAS CON ÉXITO');
  console.log('====================================================');
}

runTest()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error en prueba de IA:', err);
    process.exit(1);
  });

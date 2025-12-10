// seeders/specialties-seed.js
// MÓDULO 2 - CITAMED.VE
// Script para cargar especialidades médicas iniciales

const specialtiesData = [
  {
    name: 'Medicina General',
    nameEnglish: 'General Medicine',
    slug: 'medicina-general',
    category: 'medicina_general',
    description: 'Médicos generales que atienden una amplia variedad de condiciones de salud y realizan chequeos de rutina.',
    shortDescription: 'Atención médica integral para todas las edades',
    commonConditions: ['Gripe', 'Resfriados', 'Infecciones', 'Dolor de cabeza', 'Fiebre', 'Chequeos de rutina'],
    commonProcedures: ['Examen físico', 'Control de presión arterial', 'Vacunación', 'Recetas médicas'],
    icon: 'stethoscope',
    color: '#3B82F6',
    displayOrder: 1,
    yearsOfTrainingRequired: 6
  },
  {
    name: 'Cardiología',
    nameEnglish: 'Cardiology',
    slug: 'cardiologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en el diagnóstico y tratamiento de enfermedades del corazón y sistema cardiovascular.',
    shortDescription: 'Cuidado del corazón y sistema circulatorio',
    subSpecialties: ['Cardiología Intervencionista', 'Electrofisiología', 'Insuficiencia Cardíaca'],
    commonConditions: ['Hipertensión', 'Arritmias', 'Infarto', 'Angina de pecho', 'Insuficiencia cardíaca'],
    commonProcedures: ['Electrocardiograma', 'Ecocardiograma', 'Prueba de esfuerzo', 'Cateterismo'],
    icon: 'heart-pulse',
    color: '#EF4444',
    displayOrder: 2,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Pediatría',
    nameEnglish: 'Pediatrics',
    slug: 'pediatria',
    category: 'pediatria',
    description: 'Especialistas en el cuidado de la salud de bebés, niños y adolescentes.',
    shortDescription: 'Atención médica especializada para niños',
    subSpecialties: ['Neonatología', 'Pediatría del Desarrollo', 'Oncología Pediátrica'],
    commonConditions: ['Infecciones respiratorias', 'Alergias', 'Asma', 'Vacunación', 'Desarrollo infantil'],
    commonProcedures: ['Control de niño sano', 'Vacunación', 'Evaluación del desarrollo', 'Tratamiento de infecciones'],
    icon: 'baby',
    color: '#F59E0B',
    displayOrder: 3,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'Ginecología y Obstetricia',
    nameEnglish: 'Gynecology and Obstetrics',
    slug: 'ginecologia-obstetricia',
    category: 'ginecologia',
    description: 'Especialistas en salud femenina, embarazo y parto.',
    shortDescription: 'Salud de la mujer y embarazo',
    subSpecialties: ['Medicina Materno-Fetal', 'Ginecología Oncológica', 'Endocrinología Reproductiva'],
    commonConditions: ['Embarazo', 'Menstruación irregular', 'Menopausia', 'Infecciones', 'Planificación familiar'],
    commonProcedures: ['Control prenatal', 'Papanicolaou', 'Ecografía obstétrica', 'Parto', 'Cesárea'],
    icon: 'female',
    color: '#EC4899',
    displayOrder: 4,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Dermatología',
    nameEnglish: 'Dermatology',
    slug: 'dermatologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en enfermedades de la piel, cabello y uñas.',
    shortDescription: 'Cuidado de la piel y anexos',
    subSpecialties: ['Dermatología Estética', 'Dermatología Pediátrica', 'Dermatopatología'],
    commonConditions: ['Acné', 'Psoriasis', 'Eczema', 'Melanoma', 'Infecciones cutáneas', 'Caída de cabello'],
    commonProcedures: ['Biopsia de piel', 'Criocirugía', 'Extracción de lesiones', 'Tratamientos láser'],
    icon: 'hand-sparkles',
    color: '#8B5CF6',
    displayOrder: 5,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'Oftalmología',
    nameEnglish: 'Ophthalmology',
    slug: 'oftalmologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en enfermedades de los ojos y cirugía ocular.',
    shortDescription: 'Cuidado de la salud visual',
    subSpecialties: ['Retina', 'Glaucoma', 'Córnea', 'Cirugía Refractiva'],
    commonConditions: ['Cataratas', 'Glaucoma', 'Miopía', 'Hipermetropía', 'Retinopatía diabética'],
    commonProcedures: ['Examen de la vista', 'Cirugía de cataratas', 'Cirugía LASIK', 'Inyecciones intravítreas'],
    icon: 'eye',
    color: '#06B6D4',
    displayOrder: 6,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Traumatología y Ortopedia',
    nameEnglish: 'Orthopedics and Traumatology',
    slug: 'traumatologia-ortopedia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en huesos, articulaciones, músculos y lesiones del sistema musculoesquelético.',
    shortDescription: 'Tratamiento de huesos y articulaciones',
    subSpecialties: ['Cirugía de Columna', 'Traumatología Deportiva', 'Artroplastia'],
    commonConditions: ['Fracturas', 'Esguinces', 'Artritis', 'Lesiones deportivas', 'Hernias discales'],
    commonProcedures: ['Reducción de fracturas', 'Artroscopia', 'Reemplazo articular', 'Cirugía de columna'],
    icon: 'bone',
    color: '#10B981',
    displayOrder: 7,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'Psiquiatría',
    nameEnglish: 'Psychiatry',
    slug: 'psiquiatria',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos mentales y salud emocional.',
    shortDescription: 'Salud mental y trastornos psiquiátricos',
    subSpecialties: ['Psiquiatría Infantil', 'Adicciones', 'Psicogeriatría'],
    commonConditions: ['Depresión', 'Ansiedad', 'Trastorno bipolar', 'Esquizofrenia', 'TDAH'],
    commonProcedures: ['Evaluación psiquiátrica', 'Psicoterapia', 'Manejo de medicamentos', 'Terapia cognitivo-conductual'],
    icon: 'brain',
    color: '#6366F1',
    displayOrder: 8,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Medicina Interna',
    nameEnglish: 'Internal Medicine',
    slug: 'medicina-interna',
    category: 'medicina_interna',
    description: 'Especialistas en prevención, diagnóstico y tratamiento de enfermedades en adultos.',
    shortDescription: 'Atención integral de adultos',
    subSpecialties: ['Gastroenterología', 'Nefrología', 'Endocrinología', 'Reumatología'],
    commonConditions: ['Diabetes', 'Hipertensión', 'Enfermedades crónicas', 'Infecciones complejas'],
    commonProcedures: ['Examen físico completo', 'Manejo de enfermedades crónicas', 'Prevención'],
    icon: 'hospital',
    color: '#0EA5E9',
    displayOrder: 9,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'Neurología',
    nameEnglish: 'Neurology',
    slug: 'neurologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos del sistema nervioso.',
    shortDescription: 'Enfermedades del cerebro y sistema nervioso',
    subSpecialties: ['Epilepsia', 'Trastornos del Movimiento', 'Cefaleas'],
    commonConditions: ['Migraña', 'Epilepsia', 'Parkinson', 'Esclerosis múltiple', 'ACV'],
    commonProcedures: ['Electroencefalograma', 'Evaluación neurológica', 'Punción lumbar'],
    icon: 'brain',
    color: '#7C3AED',
    displayOrder: 10,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Endocrinología',
    nameEnglish: 'Endocrinology',
    slug: 'endocrinologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos hormonales y metabólicos.',
    shortDescription: 'Trastornos hormonales y diabetes',
    subSpecialties: ['Diabetes', 'Tiroides', 'Obesidad'],
    commonConditions: ['Diabetes', 'Hipotiroidismo', 'Hipertiroidismo', 'Obesidad', 'Síndrome metabólico'],
    commonProcedures: ['Pruebas hormonales', 'Manejo de diabetes', 'Evaluación tiroidea'],
    icon: 'flask',
    color: '#14B8A6',
    displayOrder: 11,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Gastroenterología',
    nameEnglish: 'Gastroenterology',
    slug: 'gastroenterologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en el sistema digestivo.',
    shortDescription: 'Enfermedades del sistema digestivo',
    subSpecialties: ['Hepatología', 'Endoscopia Digestiva', 'Enfermedad Inflamatoria Intestinal'],
    commonConditions: ['Gastritis', 'Reflujo', 'Úlceras', 'Colitis', 'Hepatitis', 'Cirrosis'],
    commonProcedures: ['Endoscopia', 'Colonoscopia', 'Biopsia digestiva'],
    icon: 'utensils',
    color: '#F97316',
    displayOrder: 12,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Neumología',
    nameEnglish: 'Pulmonology',
    slug: 'neumologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en enfermedades respiratorias.',
    shortDescription: 'Enfermedades de los pulmones',
    subSpecialties: ['Medicina del Sueño', 'Cuidados Intensivos Respiratorios'],
    commonConditions: ['Asma', 'EPOC', 'Neumonía', 'Apnea del sueño', 'Tuberculosis'],
    commonProcedures: ['Espirometría', 'Broncoscopia', 'Pruebas de función pulmonar'],
    icon: 'lungs',
    color: '#84CC16',
    displayOrder: 13,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'Urología',
    nameEnglish: 'Urology',
    slug: 'urologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en el sistema urinario y reproductor masculino.',
    shortDescription: 'Sistema urinario y salud masculina',
    subSpecialties: ['Oncología Urológica', 'Andrología', 'Urología Pediátrica'],
    commonConditions: ['Infecciones urinarias', 'Cálculos renales', 'Próstata', 'Disfunción eréctil'],
    commonProcedures: ['Cistoscopia', 'Cirugía de próstata', 'Litotripsia'],
    icon: 'droplet',
    color: '#0891B2',
    displayOrder: 14,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'Otorrinolaringología',
    nameEnglish: 'Otolaryngology (ENT)',
    slug: 'otorrinolaringologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en oído, nariz y garganta.',
    shortDescription: 'Oído, nariz y garganta',
    subSpecialties: ['Otología', 'Rinología', 'Laringología'],
    commonConditions: ['Sinusitis', 'Amigdalitis', 'Otitis', 'Ronquidos', 'Pérdida auditiva'],
    commonProcedures: ['Audiometría', 'Endoscopia nasal', 'Cirugía de amígdalas', 'Cirugía de senos paranasales'],
    icon: 'ear',
    color: '#EAB308',
    displayOrder: 15,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'Cirugía General',
    nameEnglish: 'General Surgery',
    slug: 'cirugia-general',
    category: 'cirugia',
    description: 'Cirujanos especializados en procedimientos quirúrgicos diversos.',
    shortDescription: 'Cirugías abdominales y generales',
    subSpecialties: ['Cirugía Laparoscópica', 'Cirugía de Trauma', 'Cirugía Bariátrica'],
    commonConditions: ['Apendicitis', 'Hernias', 'Vesícula', 'Obesidad mórbida'],
    commonProcedures: ['Apendicectomía', 'Colecistectomía', 'Herniorrafia', 'Cirugía bariátrica'],
    icon: 'scissors',
    color: '#DC2626',
    displayOrder: 16,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'Nutrición y Dietética',
    nameEnglish: 'Nutrition and Dietetics',
    slug: 'nutricion-dietetica',
    category: 'especialidad_clinica',
    description: 'Especialistas en alimentación y nutrición.',
    shortDescription: 'Planes de alimentación y nutrición',
    commonConditions: ['Obesidad', 'Diabetes', 'Trastornos alimenticios', 'Desnutrición'],
    commonProcedures: ['Evaluación nutricional', 'Planes de alimentación', 'Educación nutricional'],
    icon: 'apple',
    color: '#22C55E',
    displayOrder: 17,
    yearsOfTrainingRequired: 5
  },
  {
    name: 'Psicología',
    nameEnglish: 'Psychology',
    slug: 'psicologia',
    category: 'especialidad_clinica',
    description: 'Profesionales de la salud mental y terapia psicológica.',
    shortDescription: 'Terapia y salud mental',
    subSpecialties: ['Psicología Clínica', 'Psicología Infantil', 'Neuropsicología'],
    commonConditions: ['Ansiedad', 'Depresión', 'Estrés', 'Duelo', 'Trastornos de conducta'],
    commonProcedures: ['Evaluación psicológica', 'Psicoterapia', 'Terapia cognitivo-conductual', 'Terapia familiar'],
    icon: 'user-circle',
    color: '#A855F7',
    displayOrder: 18,
    yearsOfTrainingRequired: 6
  },
  {
    name: 'Odontología',
    nameEnglish: 'Dentistry',
    slug: 'odontologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en salud bucal y dental.',
    shortDescription: 'Cuidado dental y bucal',
    subSpecialties: ['Ortodoncia', 'Periodoncia', 'Endodoncia', 'Cirugía Maxilofacial'],
    commonConditions: ['Caries', 'Gingivitis', 'Periodontitis', 'Maloclusión'],
    commonProcedures: ['Limpieza dental', 'Obturaciones', 'Extracciones', 'Ortodoncia', 'Implantes'],
    icon: 'tooth',
    color: '#06B6D4',
    displayOrder: 19,
    yearsOfTrainingRequired: 5
  },
  {
    name: 'Fisioterapia',
    nameEnglish: 'Physical Therapy',
    slug: 'fisioterapia',
    category: 'especialidad_clinica',
    description: 'Especialistas en rehabilitación física y movimiento.',
    shortDescription: 'Rehabilitación y terapia física',
    subSpecialties: ['Fisioterapia Deportiva', 'Fisioterapia Neurológica', 'Fisioterapia Pediátrica'],
    commonConditions: ['Lesiones deportivas', 'Dolor crónico', 'Rehabilitación post-cirugía', 'Problemas posturales'],
    commonProcedures: ['Terapia manual', 'Ejercicios terapéuticos', 'Electroterapia', 'Rehabilitación'],
    icon: 'dumbbell',
    color: '#16A34A',
    displayOrder: 20,
    yearsOfTrainingRequired: 4
  }
];

module.exports = {
  specialtiesData,
  
  async seedSpecialties(Specialty) {
    console.log('🌱 Iniciando carga de especialidades médicas...');
    
    try {
      let createdCount = 0;
      let skippedCount = 0;

      for (const specialty of specialtiesData) {
        const [instance, created] = await Specialty.findOrCreate({
          where: { slug: specialty.slug },
          defaults: specialty
        });

        if (created) {
          createdCount++;
          console.log(`  ✅ ${specialty.name} creada`);
        } else {
          skippedCount++;
          console.log(`  ⏭️  ${specialty.name} ya existe`);
        }
      }

      console.log('\n📊 Resumen de carga:');
      console.log(`  ✅ Especialidades creadas: ${createdCount}`);
      console.log(`  ⏭️  Especialidades omitidas: ${skippedCount}`);
      console.log(`  📈 Total en catálogo: ${specialtiesData.length}`);
      
      return { createdCount, skippedCount, total: specialtiesData.length };
      
    } catch (error) {
      console.error('❌ Error cargando especialidades:', error);
      throw error;
    }
  }
};

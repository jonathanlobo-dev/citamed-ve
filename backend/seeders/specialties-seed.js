require('dotenv').config();
// seeders/specialties-seed.js
// MÃ“DULO 2 - CITAMED.VE
// Script para cargar especialidades mÃ©dicas iniciales

const specialtiesData = [
  {
    name: 'Medicina General',
    nameEnglish: 'General Medicine',
    slug: 'medicina-general',
    category: 'medicina_general',
    description: 'MÃ©dicos generales que atienden una amplia variedad de condiciones de salud y realizan chequeos de rutina.',
    shortDescription: 'AtenciÃ³n mÃ©dica integral para todas las edades',
    commonConditions: ['Gripe', 'Resfriados', 'Infecciones', 'Dolor de cabeza', 'Fiebre', 'Chequeos de rutina'],
    commonProcedures: ['Examen fÃ­sico', 'Control de presiÃ³n arterial', 'VacunaciÃ³n', 'Recetas mÃ©dicas'],
    icon: 'stethoscope',
    color: '#3B82F6',
    displayOrder: 1,
    yearsOfTrainingRequired: 6
  },
  {
    name: 'CardiologÃ­a',
    nameEnglish: 'Cardiology',
    slug: 'cardiologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en el diagnÃ³stico y tratamiento de enfermedades del corazÃ³n y sistema cardiovascular.',
    shortDescription: 'Cuidado del corazÃ³n y sistema circulatorio',
    subSpecialties: ['CardiologÃ­a Intervencionista', 'ElectrofisiologÃ­a', 'Insuficiencia CardÃ­aca'],
    commonConditions: ['HipertensiÃ³n', 'Arritmias', 'Infarto', 'Angina de pecho', 'Insuficiencia cardÃ­aca'],
    commonProcedures: ['Electrocardiograma', 'Ecocardiograma', 'Prueba de esfuerzo', 'Cateterismo'],
    icon: 'heart-pulse',
    color: '#EF4444',
    displayOrder: 2,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'PediatrÃ­a',
    nameEnglish: 'Pediatrics',
    slug: 'pediatria',
    category: 'pediatria',
    description: 'Especialistas en el cuidado de la salud de bebÃ©s, niÃ±os y adolescentes.',
    shortDescription: 'AtenciÃ³n mÃ©dica especializada para niÃ±os',
    subSpecialties: ['NeonatologÃ­a', 'PediatrÃ­a del Desarrollo', 'OncologÃ­a PediÃ¡trica'],
    commonConditions: ['Infecciones respiratorias', 'Alergias', 'Asma', 'VacunaciÃ³n', 'Desarrollo infantil'],
    commonProcedures: ['Control de niÃ±o sano', 'VacunaciÃ³n', 'EvaluaciÃ³n del desarrollo', 'Tratamiento de infecciones'],
    icon: 'baby',
    color: '#F59E0B',
    displayOrder: 3,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'GinecologÃ­a y Obstetricia',
    nameEnglish: 'Gynecology and Obstetrics',
    slug: 'ginecologia-obstetricia',
    category: 'ginecologia',
    description: 'Especialistas en salud femenina, embarazo y parto.',
    shortDescription: 'Salud de la mujer y embarazo',
    subSpecialties: ['Medicina Materno-Fetal', 'GinecologÃ­a OncolÃ³gica', 'EndocrinologÃ­a Reproductiva'],
    commonConditions: ['Embarazo', 'MenstruaciÃ³n irregular', 'Menopausia', 'Infecciones', 'PlanificaciÃ³n familiar'],
    commonProcedures: ['Control prenatal', 'Papanicolaou', 'EcografÃ­a obstÃ©trica', 'Parto', 'CesÃ¡rea'],
    icon: 'female',
    color: '#EC4899',
    displayOrder: 4,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'DermatologÃ­a',
    nameEnglish: 'Dermatology',
    slug: 'dermatologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en enfermedades de la piel, cabello y uÃ±as.',
    shortDescription: 'Cuidado de la piel y anexos',
    subSpecialties: ['DermatologÃ­a EstÃ©tica', 'DermatologÃ­a PediÃ¡trica', 'DermatopatologÃ­a'],
    commonConditions: ['AcnÃ©', 'Psoriasis', 'Eczema', 'Melanoma', 'Infecciones cutÃ¡neas', 'CaÃ­da de cabello'],
    commonProcedures: ['Biopsia de piel', 'CriocirugÃ­a', 'ExtracciÃ³n de lesiones', 'Tratamientos lÃ¡ser'],
    icon: 'hand-sparkles',
    color: '#8B5CF6',
    displayOrder: 5,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'OftalmologÃ­a',
    nameEnglish: 'Ophthalmology',
    slug: 'oftalmologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en enfermedades de los ojos y cirugÃ­a ocular.',
    shortDescription: 'Cuidado de la salud visual',
    subSpecialties: ['Retina', 'Glaucoma', 'CÃ³rnea', 'CirugÃ­a Refractiva'],
    commonConditions: ['Cataratas', 'Glaucoma', 'MiopÃ­a', 'HipermetropÃ­a', 'RetinopatÃ­a diabÃ©tica'],
    commonProcedures: ['Examen de la vista', 'CirugÃ­a de cataratas', 'CirugÃ­a LASIK', 'Inyecciones intravÃ­treas'],
    icon: 'eye',
    color: '#06B6D4',
    displayOrder: 6,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'TraumatologÃ­a y Ortopedia',
    nameEnglish: 'Orthopedics and Traumatology',
    slug: 'traumatologia-ortopedia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en huesos, articulaciones, mÃºsculos y lesiones del sistema musculoesquelÃ©tico.',
    shortDescription: 'Tratamiento de huesos y articulaciones',
    subSpecialties: ['CirugÃ­a de Columna', 'TraumatologÃ­a Deportiva', 'Artroplastia'],
    commonConditions: ['Fracturas', 'Esguinces', 'Artritis', 'Lesiones deportivas', 'Hernias discales'],
    commonProcedures: ['ReducciÃ³n de fracturas', 'Artroscopia', 'Reemplazo articular', 'CirugÃ­a de columna'],
    icon: 'bone',
    color: '#10B981',
    displayOrder: 7,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'PsiquiatrÃ­a',
    nameEnglish: 'Psychiatry',
    slug: 'psiquiatria',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos mentales y salud emocional.',
    shortDescription: 'Salud mental y trastornos psiquiÃ¡tricos',
    subSpecialties: ['PsiquiatrÃ­a Infantil', 'Adicciones', 'PsicogeriatrÃ­a'],
    commonConditions: ['DepresiÃ³n', 'Ansiedad', 'Trastorno bipolar', 'Esquizofrenia', 'TDAH'],
    commonProcedures: ['EvaluaciÃ³n psiquiÃ¡trica', 'Psicoterapia', 'Manejo de medicamentos', 'Terapia cognitivo-conductual'],
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
    description: 'Especialistas en prevenciÃ³n, diagnÃ³stico y tratamiento de enfermedades en adultos.',
    shortDescription: 'AtenciÃ³n integral de adultos',
    subSpecialties: ['GastroenterologÃ­a', 'NefrologÃ­a', 'EndocrinologÃ­a', 'ReumatologÃ­a'],
    commonConditions: ['Diabetes', 'HipertensiÃ³n', 'Enfermedades crÃ³nicas', 'Infecciones complejas'],
    commonProcedures: ['Examen fÃ­sico completo', 'Manejo de enfermedades crÃ³nicas', 'PrevenciÃ³n'],
    icon: 'hospital',
    color: '#0EA5E9',
    displayOrder: 9,
    yearsOfTrainingRequired: 9
  },
  {
    name: 'NeurologÃ­a',
    nameEnglish: 'Neurology',
    slug: 'neurologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos del sistema nervioso.',
    shortDescription: 'Enfermedades del cerebro y sistema nervioso',
    subSpecialties: ['Epilepsia', 'Trastornos del Movimiento', 'Cefaleas'],
    commonConditions: ['MigraÃ±a', 'Epilepsia', 'Parkinson', 'Esclerosis mÃºltiple', 'ACV'],
    commonProcedures: ['Electroencefalograma', 'EvaluaciÃ³n neurolÃ³gica', 'PunciÃ³n lumbar'],
    icon: 'brain',
    color: '#7C3AED',
    displayOrder: 10,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'EndocrinologÃ­a',
    nameEnglish: 'Endocrinology',
    slug: 'endocrinologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en trastornos hormonales y metabÃ³licos.',
    shortDescription: 'Trastornos hormonales y diabetes',
    subSpecialties: ['Diabetes', 'Tiroides', 'Obesidad'],
    commonConditions: ['Diabetes', 'Hipotiroidismo', 'Hipertiroidismo', 'Obesidad', 'SÃ­ndrome metabÃ³lico'],
    commonProcedures: ['Pruebas hormonales', 'Manejo de diabetes', 'EvaluaciÃ³n tiroidea'],
    icon: 'flask',
    color: '#14B8A6',
    displayOrder: 11,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'GastroenterologÃ­a',
    nameEnglish: 'Gastroenterology',
    slug: 'gastroenterologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en el sistema digestivo.',
    shortDescription: 'Enfermedades del sistema digestivo',
    subSpecialties: ['HepatologÃ­a', 'Endoscopia Digestiva', 'Enfermedad Inflamatoria Intestinal'],
    commonConditions: ['Gastritis', 'Reflujo', 'Ãšlceras', 'Colitis', 'Hepatitis', 'Cirrosis'],
    commonProcedures: ['Endoscopia', 'Colonoscopia', 'Biopsia digestiva'],
    icon: 'utensils',
    color: '#F97316',
    displayOrder: 12,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'NeumologÃ­a',
    nameEnglish: 'Pulmonology',
    slug: 'neumologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en enfermedades respiratorias.',
    shortDescription: 'Enfermedades de los pulmones',
    subSpecialties: ['Medicina del SueÃ±o', 'Cuidados Intensivos Respiratorios'],
    commonConditions: ['Asma', 'EPOC', 'NeumonÃ­a', 'Apnea del sueÃ±o', 'Tuberculosis'],
    commonProcedures: ['EspirometrÃ­a', 'Broncoscopia', 'Pruebas de funciÃ³n pulmonar'],
    icon: 'lungs',
    color: '#84CC16',
    displayOrder: 13,
    yearsOfTrainingRequired: 10
  },
  {
    name: 'UrologÃ­a',
    nameEnglish: 'Urology',
    slug: 'urologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en el sistema urinario y reproductor masculino.',
    shortDescription: 'Sistema urinario y salud masculina',
    subSpecialties: ['OncologÃ­a UrolÃ³gica', 'AndrologÃ­a', 'UrologÃ­a PediÃ¡trica'],
    commonConditions: ['Infecciones urinarias', 'CÃ¡lculos renales', 'PrÃ³stata', 'DisfunciÃ³n erÃ©ctil'],
    commonProcedures: ['Cistoscopia', 'CirugÃ­a de prÃ³stata', 'Litotripsia'],
    icon: 'droplet',
    color: '#0891B2',
    displayOrder: 14,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'OtorrinolaringologÃ­a',
    nameEnglish: 'Otolaryngology (ENT)',
    slug: 'otorrinolaringologia',
    category: 'especialidad_quirurgica',
    description: 'Especialistas en oÃ­do, nariz y garganta.',
    shortDescription: 'OÃ­do, nariz y garganta',
    subSpecialties: ['OtologÃ­a', 'RinologÃ­a', 'LaringologÃ­a'],
    commonConditions: ['Sinusitis', 'Amigdalitis', 'Otitis', 'Ronquidos', 'PÃ©rdida auditiva'],
    commonProcedures: ['AudiometrÃ­a', 'Endoscopia nasal', 'CirugÃ­a de amÃ­gdalas', 'CirugÃ­a de senos paranasales'],
    icon: 'ear',
    color: '#EAB308',
    displayOrder: 15,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'CirugÃ­a General',
    nameEnglish: 'General Surgery',
    slug: 'cirugia-general',
    category: 'cirugia',
    description: 'Cirujanos especializados en procedimientos quirÃºrgicos diversos.',
    shortDescription: 'CirugÃ­as abdominales y generales',
    subSpecialties: ['CirugÃ­a LaparoscÃ³pica', 'CirugÃ­a de Trauma', 'CirugÃ­a BariÃ¡trica'],
    commonConditions: ['Apendicitis', 'Hernias', 'VesÃ­cula', 'Obesidad mÃ³rbida'],
    commonProcedures: ['ApendicectomÃ­a', 'ColecistectomÃ­a', 'Herniorrafia', 'CirugÃ­a bariÃ¡trica'],
    icon: 'scissors',
    color: '#DC2626',
    displayOrder: 16,
    yearsOfTrainingRequired: 11
  },
  {
    name: 'NutriciÃ³n y DietÃ©tica',
    nameEnglish: 'Nutrition and Dietetics',
    slug: 'nutricion-dietetica',
    category: 'especialidad_clinica',
    description: 'Especialistas en alimentaciÃ³n y nutriciÃ³n.',
    shortDescription: 'Planes de alimentaciÃ³n y nutriciÃ³n',
    commonConditions: ['Obesidad', 'Diabetes', 'Trastornos alimenticios', 'DesnutriciÃ³n'],
    commonProcedures: ['EvaluaciÃ³n nutricional', 'Planes de alimentaciÃ³n', 'EducaciÃ³n nutricional'],
    icon: 'apple',
    color: '#22C55E',
    displayOrder: 17,
    yearsOfTrainingRequired: 5
  },
  {
    name: 'PsicologÃ­a',
    nameEnglish: 'Psychology',
    slug: 'psicologia',
    category: 'especialidad_clinica',
    description: 'Profesionales de la salud mental y terapia psicolÃ³gica.',
    shortDescription: 'Terapia y salud mental',
    subSpecialties: ['PsicologÃ­a ClÃ­nica', 'PsicologÃ­a Infantil', 'NeuropsicologÃ­a'],
    commonConditions: ['Ansiedad', 'DepresiÃ³n', 'EstrÃ©s', 'Duelo', 'Trastornos de conducta'],
    commonProcedures: ['EvaluaciÃ³n psicolÃ³gica', 'Psicoterapia', 'Terapia cognitivo-conductual', 'Terapia familiar'],
    icon: 'user-circle',
    color: '#A855F7',
    displayOrder: 18,
    yearsOfTrainingRequired: 6
  },
  {
    name: 'OdontologÃ­a',
    nameEnglish: 'Dentistry',
    slug: 'odontologia',
    category: 'especialidad_clinica',
    description: 'Especialistas en salud bucal y dental.',
    shortDescription: 'Cuidado dental y bucal',
    subSpecialties: ['Ortodoncia', 'Periodoncia', 'Endodoncia', 'CirugÃ­a Maxilofacial'],
    commonConditions: ['Caries', 'Gingivitis', 'Periodontitis', 'MaloclusiÃ³n'],
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
    description: 'Especialistas en rehabilitaciÃ³n fÃ­sica y movimiento.',
    shortDescription: 'RehabilitaciÃ³n y terapia fÃ­sica',
    subSpecialties: ['Fisioterapia Deportiva', 'Fisioterapia NeurolÃ³gica', 'Fisioterapia PediÃ¡trica'],
    commonConditions: ['Lesiones deportivas', 'Dolor crÃ³nico', 'RehabilitaciÃ³n post-cirugÃ­a', 'Problemas posturales'],
    commonProcedures: ['Terapia manual', 'Ejercicios terapÃ©uticos', 'Electroterapia', 'RehabilitaciÃ³n'],
    icon: 'dumbbell',
    color: '#16A34A',
    displayOrder: 20,
    yearsOfTrainingRequired: 4
  }
];

module.exports = {
  specialtiesData,
  
  async seedSpecialties(Specialty) {
    console.log('ðŸŒ± Iniciando carga de especialidades mÃ©dicas...');
    
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
          console.log(`  âœ… ${specialty.name} creada`);
        } else {
          skippedCount++;
          console.log(`  â­ï¸  ${specialty.name} ya existe`);
        }
      }

      console.log('\nðŸ“Š Resumen de carga:');
      console.log(`  âœ… Especialidades creadas: ${createdCount}`);
      console.log(`  â­ï¸  Especialidades omitidas: ${skippedCount}`);
      console.log(`  ðŸ“ˆ Total en catÃ¡logo: ${specialtiesData.length}`);
      
      return { createdCount, skippedCount, total: specialtiesData.length };
      
    } catch (error) {
      console.error('âŒ Error cargando especialidades:', error);
      throw error;
    }
  }
};

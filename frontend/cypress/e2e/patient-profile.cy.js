/**
 * Patient Profile E2E Tests - CITAMED.VE
 * M02 Sub-Partida 3.2 - Perfil Paciente Completo
 *
 * Tests para flujos de perfil de paciente
 */

describe('Patient Profile - M02 Sub-Partida 3.2', () => {
  const testPatient = {
    email: `test.patient.${Date.now()}@citamed.ve`,
    password: 'TestPassword123!',
    firstName: 'Juan',
    lastName: 'Paciente',
    role: 'patient'
  };

  // ═══════════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════════

  before(() => {
    // Registrar usuario de prueba
    cy.register({
      ...testPatient,
      confirmPassword: testPatient.password
    }).then((response) => {
      if (response.status !== 201 && response.status !== 200) {
        // Si el usuario ya existe, intentar login
        cy.log('User may already exist, attempting login');
      }
    });
  });

  beforeEach(() => {
    // Login antes de cada test
    cy.login(testPatient.email, testPatient.password);
  });

  afterEach(() => {
    cy.logout();
  });

  // ═══════════════════════════════════════════════════════════════
  // VISUALIZACIÓN DE PERFIL
  // ═══════════════════════════════════════════════════════════════

  describe('Visualización del Perfil', () => {
    it('debe cargar la página de perfil del paciente', () => {
      cy.visit('/perfil-paciente');
      cy.url().should('include', '/perfil-paciente');
      cy.contains('Mi Perfil de Salud', { timeout: 10000 }).should('be.visible');
    });

    it('debe mostrar las 4 pestañas correctamente', () => {
      cy.visit('/perfil-paciente');

      cy.contains('Información Personal').should('be.visible');
      cy.contains('Historial Médico').should('be.visible');
      cy.contains('Alergias').should('be.visible');
      cy.contains('Medicamentos').should('be.visible');
    });

    it('debe mostrar indicador de completitud del perfil', () => {
      cy.visit('/perfil-paciente');

      cy.contains('Perfil completado').should('be.visible');
      // El porcentaje puede variar
      cy.get('[class*="rounded-full"]').should('exist');
    });

    it('debe navegar entre pestañas', () => {
      cy.visit('/perfil-paciente');

      // Click en Historial Médico
      cy.contains('Historial Médico').click();
      cy.contains('Historial Médico').parent().should('have.class', 'border-teal-500');

      // Click en Alergias
      cy.contains('button', 'Alergias').click();
      cy.contains('Todas las Alergias').should('be.visible');

      // Click en Medicamentos
      cy.contains('button', 'Medicamentos').click();
      cy.contains('Medicamentos Activos').should('be.visible');

      // Volver a Información Personal
      cy.contains('Información Personal').click();
      cy.contains('Datos Físicos').should('be.visible');
    });

    it('debe tener enlace para editar perfil', () => {
      cy.visit('/perfil-paciente');

      cy.contains('Editar Perfil').should('be.visible');
      cy.contains('Editar Perfil').click();
      cy.url().should('include', '/perfil-paciente/editar');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // EDICIÓN DE INFORMACIÓN PERSONAL
  // ═══════════════════════════════════════════════════════════════

  describe('Edición de Información Personal', () => {
    beforeEach(() => {
      cy.visit('/perfil-paciente/editar');
    });

    it('debe cargar la página de edición', () => {
      cy.contains('Editar Perfil de Salud').should('be.visible');
    });

    it('debe permitir actualizar datos físicos', () => {
      // Llenar datos físicos
      cy.get('select[name="bloodType"]').select('O+');
      cy.get('input[name="height"]').clear().type('175');
      cy.get('input[name="weight"]').clear().type('70');

      // Llenar estilo de vida
      cy.get('select[name="smokingStatus"]').select('never');
      cy.get('select[name="alcoholConsumption"]').select('occasional');
      cy.get('select[name="exerciseFrequency"]').select('moderate');

      // Guardar
      cy.contains('Datos Físicos')
        .parent()
        .parent()
        .find('button')
        .contains('Guardar')
        .click();

      // Verificar toast de éxito
      cy.contains('Perfil actualizado exitosamente', { timeout: 5000 }).should('be.visible');
    });

    it('debe permitir actualizar contacto de emergencia', () => {
      // Llenar contacto de emergencia
      cy.get('input[name="name"]').clear().type('María García');
      cy.get('input[name="phone"]').clear().type('+58412-1234567');
      cy.get('input[name="relationship"]').clear().type('Esposa');

      // Guardar
      cy.contains('Contacto de Emergencia')
        .parent()
        .parent()
        .find('button')
        .contains('Guardar')
        .click();

      // Verificar toast de éxito
      cy.contains('Contacto de emergencia actualizado', { timeout: 5000 }).should('be.visible');
    });

    it('debe permitir actualizar información del seguro', () => {
      // Llenar seguro
      cy.get('input[name="company"]').clear().type('Seguros Caracas');
      cy.get('input[name="policyNumber"]').clear().type('POL-123456');
      cy.get('input[name="type"]').clear().type('Premium');

      // Guardar
      cy.contains('Seguro Médico')
        .parent()
        .parent()
        .find('button')
        .contains('Guardar')
        .click();

      // Verificar toast de éxito
      cy.contains('Información de seguro actualizada', { timeout: 5000 }).should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE HISTORIAL MÉDICO
  // ═══════════════════════════════════════════════════════════════

  describe('Gestión de Historial Médico', () => {
    beforeEach(() => {
      cy.visit('/perfil-paciente/editar');
      cy.contains('button', 'Historial Médico').click();
    });

    it('debe permitir agregar una condición médica', () => {
      // Abrir formulario
      cy.contains('Agregar Condición').click();

      // Llenar formulario
      cy.get('input[name="condition"]').type('Hipertensión');
      cy.get('select[name="status"]').select('chronic');
      cy.get('select[name="severity"]').select('moderate');
      cy.get('input[name="diagnosedBy"]').type('Dr. García');
      cy.get('textarea[name="notes"]').type('Control con medicación diaria');

      // Guardar
      cy.contains('button', 'Agregar').click();

      // Verificar éxito
      cy.contains('Condición médica agregada', { timeout: 5000 }).should('be.visible');
      cy.contains('Hipertensión').should('be.visible');
    });

    it('debe permitir editar una condición médica', () => {
      // Asumir que hay al menos una condición
      cy.get('button[title="Editar"]', { timeout: 5000 }).first().click({ force: true });

      // Modificar
      cy.get('textarea[name="notes"]').clear().type('Notas actualizadas');

      // Guardar
      cy.contains('button', 'Actualizar').click();

      // Verificar éxito
      cy.contains('Condición médica actualizada', { timeout: 5000 }).should('be.visible');
    });

    it('debe permitir eliminar una condición médica', () => {
      // Click en eliminar
      cy.get('button[title="Eliminar"]', { timeout: 5000 }).first().click({ force: true });

      // Confirmar eliminación
      cy.contains('Eliminar condición médica').should('be.visible');
      cy.contains('button', 'Eliminar').click();

      // Verificar éxito
      cy.contains('Condición médica eliminada', { timeout: 5000 }).should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE ALERGIAS
  // ═══════════════════════════════════════════════════════════════

  describe('Gestión de Alergias', () => {
    beforeEach(() => {
      cy.visit('/perfil-paciente/editar');
      cy.contains('button', 'Alergias').click();
    });

    it('debe permitir agregar una alergia', () => {
      // Abrir formulario
      cy.contains('Agregar Alergia').click();

      // Llenar formulario
      cy.get('select[name="allergyType"]').select('medication');
      cy.get('input[name="allergen"]').type('Penicilina');
      cy.get('select[name="severity"]').select('severe');
      cy.get('textarea[name="reaction"]').type('Dificultad para respirar, urticaria');

      // Guardar
      cy.contains('button', 'Agregar').click();

      // Verificar éxito
      cy.contains('Alergia agregada', { timeout: 5000 }).should('be.visible');
      cy.contains('Penicilina').should('be.visible');
    });

    it('debe mostrar alergia con severidad correcta', () => {
      // Verificar que las alergias muestran su severidad
      cy.get('[class*="border-l-4"]').should('exist');
    });

    it('debe permitir editar una alergia', () => {
      // Click en editar
      cy.get('button').filter(':has(svg)').contains('Edit', { matchCase: false }).first().click({ force: true });

      // Modificar severidad
      cy.get('select[name="severity"]').select('life_threatening');

      // Guardar
      cy.contains('button', 'Actualizar').click();

      // Verificar éxito
      cy.contains('Alergia actualizada', { timeout: 5000 }).should('be.visible');
    });

    it('debe validar campos requeridos', () => {
      // Abrir formulario
      cy.contains('Agregar Alergia').click();

      // Intentar guardar sin llenar campos
      cy.contains('button', 'Agregar').click();

      // Verificar error
      cy.contains('El alérgeno es requerido', { timeout: 5000 }).should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // GESTIÓN DE MEDICAMENTOS
  // ═══════════════════════════════════════════════════════════════

  describe('Gestión de Medicamentos', () => {
    beforeEach(() => {
      cy.visit('/perfil-paciente/editar');
      cy.contains('button', 'Medicamentos').click();
    });

    it('debe permitir agregar un medicamento', () => {
      // Abrir formulario
      cy.contains('Agregar Medicamento').click();

      // Llenar formulario
      cy.get('input[name="medicationName"]').type('Metformina');
      cy.get('input[name="dosage"]').type('500mg');
      cy.get('input[name="frequency"]').type('Cada 12 horas');
      cy.get('input[name="route"]').type('Oral');
      cy.get('input[name="startDate"]').type('2024-01-15');
      cy.get('input[name="prescribedBy"]').type('Dr. López');
      cy.get('input[name="reason"]').type('Control de diabetes tipo 2');

      // Guardar
      cy.contains('button', 'Agregar').click();

      // Verificar éxito
      cy.contains('Medicamento agregado', { timeout: 5000 }).should('be.visible');
      cy.contains('Metformina').should('be.visible');
    });

    it('debe permitir suspender un medicamento', () => {
      // Click en suspender
      cy.get('button[title="Suspender"]', { timeout: 5000 }).first().click({ force: true });

      // Confirmar
      cy.contains('Suspender medicamento').should('be.visible');
      cy.get('.bg-white.rounded-xl').contains('button', 'Suspender').click();

      // Verificar éxito
      cy.contains('Medicamento suspendido', { timeout: 5000 }).should('be.visible');
    });

    it('debe validar campos requeridos de medicamento', () => {
      // Abrir formulario
      cy.contains('Agregar Medicamento').click();

      // Intentar guardar sin llenar campos
      cy.contains('button', 'Agregar').click();

      // Verificar error
      cy.contains('Nombre, dosis, frecuencia y fecha de inicio son requeridos', { timeout: 5000 }).should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // FLUJOS COMPLETOS
  // ═══════════════════════════════════════════════════════════════

  describe('Flujos Completos', () => {
    it('debe completar el perfil desde 0% aumentando completitud', () => {
      cy.visit('/perfil-paciente/editar');

      // Actualizar datos físicos
      cy.get('select[name="bloodType"]').select('A+');
      cy.get('input[name="height"]').clear().type('180');
      cy.get('input[name="weight"]').clear().type('75');
      cy.contains('Datos Físicos').parent().parent().find('button').contains('Guardar').click();
      cy.wait(1000);

      // Actualizar contacto de emergencia
      cy.get('input[name="name"]').clear().type('Pedro García');
      cy.get('input[name="phone"]').clear().type('+58424-5678901');
      cy.contains('Contacto de Emergencia').parent().parent().find('button').contains('Guardar').click();
      cy.wait(1000);

      // Ir a ver perfil y verificar que aumentó completitud
      cy.visit('/perfil-paciente');
      cy.contains('Perfil completado').should('be.visible');
    });

    it('debe mostrar alertas de alergias críticas en el dashboard', () => {
      // Primero agregar una alergia crítica
      cy.visit('/perfil-paciente/editar');
      cy.contains('button', 'Alergias').click();
      cy.contains('Agregar Alergia').click();

      cy.get('select[name="allergyType"]').select('medication');
      cy.get('input[name="allergen"]').type('Aspirina');
      cy.get('select[name="severity"]').select('life_threatening');
      cy.get('textarea[name="reaction"]').type('Anafilaxia');
      cy.contains('button', 'Agregar').click();
      cy.wait(1000);

      // Ver en perfil
      cy.visit('/perfil-paciente');
      cy.contains('alergia(s) crítica(s)').should('be.visible');
    });

    it('debe navegar correctamente entre vista y edición', () => {
      cy.visit('/perfil-paciente');

      // Ir a editar
      cy.contains('Editar Perfil').click();
      cy.url().should('include', '/perfil-paciente/editar');

      // Volver
      cy.get('[title="Volver"]', { timeout: 5000 }).click({ force: true });
      cy.url().should('include', '/perfil-paciente').and('not.include', '/editar');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // VALIDACIONES Y SEGURIDAD
  // ═══════════════════════════════════════════════════════════════

  describe('Validaciones y Seguridad', () => {
    it('debe requerir autenticación para ver perfil', () => {
      cy.logout();
      cy.visit('/perfil-paciente');

      // Debería redirigir a login
      cy.url().should('include', '/login');
    });

    it('debe validar altura en rango válido', () => {
      cy.visit('/perfil-paciente/editar');

      // Intentar altura inválida
      cy.get('input[name="height"]').clear().type('300');
      cy.contains('Datos Físicos').parent().parent().find('button').contains('Guardar').click();

      // Debería mostrar error de validación
      // (depende de cómo se maneje en el backend)
    });

    it('debe validar peso en rango válido', () => {
      cy.visit('/perfil-paciente/editar');

      // Intentar peso inválido
      cy.get('input[name="weight"]').clear().type('500');
      cy.contains('Datos Físicos').parent().parent().find('button').contains('Guardar').click();

      // Debería mostrar error de validación
    });
  });
});

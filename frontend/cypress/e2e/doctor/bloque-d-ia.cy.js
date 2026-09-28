describe('Bloque D - IA en el Espacio Clínico', () => {
  let appointmentId = null;

  beforeEach(() => {
    // Iniciar sesión como médico y guardar credenciales en localStorage
    cy.request({
      method: 'POST',
      url: 'http://localhost:5000/api/auth/login',
      body: {
        email: 'doctor@citamed.ve',
        password: 'Doctor123!'
      }
    }).then((res) => {
      const { token, user, profile } = res.body.data;
      window.localStorage.setItem('citamed_token', token);
      window.localStorage.setItem('citamed_user', JSON.stringify(user));
      if (profile) {
        window.localStorage.setItem('citamed_profile', JSON.stringify(profile));
      }
    });
  });

  it('Flujo completo de Asistente IA, revisión, récipe, alergias y capturas', () => {
    // ==========================================================
    // 1. Visitar /medico/consulta/nueva (Borrador sin paciente)
    // ==========================================================
    cy.viewport(1280, 800);
    cy.visit('/medico/consulta/nueva');

    cy.contains('Asistente IA en el Espacio Clínico').should('be.visible');
    cy.contains('Función experimental de asistencia:').should('be.visible');
    cy.contains('Identifica al paciente para usar la IA').should('be.visible');

    // Identificar a María Gómez (quien tiene alergia severa a Penicilina)
    cy.contains('button', 'Identificar paciente').click();
    cy.contains('Identificar Paciente de la Consulta').should('be.visible');
    cy.contains('María Gómez', { timeout: 10000 }).should('be.visible');
    
    // Pulsar el botón "Vincular" de la fila de María Gómez
    cy.contains('María Gómez')
      .parents('.flex.items-center.justify-between')
      .find('button')
      .contains('Vincular')
      .click();

    // Redirige a /medico/consulta/:id
    cy.url({ timeout: 15000 }).should('match', /\/medico\/consulta\/\d+/);
    cy.url().then((url) => {
      const match = url.match(/\/medico\/consulta\/(\d+)/);
      if (match) {
        appointmentId = match[1];
        cy.log('Consulta creada con ID:', appointmentId);
      }
    });

    // Esperar a que el Espacio Clínico termine de cargar completamente
    cy.contains('Cargando Espacio Clínico...', { timeout: 15000 }).should('not.exist');
    cy.contains('Asistente IA en el Espacio Clínico', { timeout: 15000 }).should('be.visible');
    cy.wait(800);

    // ==========================================================
    // 2. Tarjeta Asistente IA antes de consentimiento (1280px y 375px)
    // ==========================================================
    cy.viewport(1280, 800);
    cy.get('#asistente-ia').should('be.visible');
    cy.contains('Función experimental de asistencia:').should('be.visible');
    cy.get('#asistente-ia').within(() => {
      cy.contains('button', 'Dictar').should('be.disabled');
      cy.contains('button', 'Corregir').should('be.disabled');
      cy.contains('button', 'Estructurar consulta con IA').should('be.disabled');
    });
    cy.wait(400);
    cy.screenshot('01_tarjeta_ia_1280', { capture: 'viewport' });

    // Tarjeta a 375px
    cy.viewport(375, 812);
    cy.get('#asistente-ia').scrollIntoView();
    cy.wait(400);
    cy.screenshot('01_tarjeta_ia_375', { capture: 'viewport' });

    // Volver a 1280px
    cy.viewport(1280, 800);

    // ==========================================================
    // 3. Marcar consentimiento y llenar borrador de consulta
    // ==========================================================
    cy.get('#asistente-ia input[type="checkbox"]').first().check({ force: true });
    cy.get('#asistente-ia input[type="checkbox"]').first().should('be.checked');
    cy.get('#asistente-ia input[type="checkbox"]').first().should('be.disabled'); // Ya no se puede desmarcar

    const clinicalText = 'Paciente de 35 años con dolor de garganta y fiebre de 38,5 desde hace dos días. Tensión 120/80, frecuencia cardíaca 92, peso 70 kilos, talla 1,70. Orofaringe eritematosa con exudado amigdalino, adenopatías cervicales dolorosas, pulmones limpios. Impresión: faringoamigdalitis aguda bacteriana. Plan: amoxicilina 500 miligramos una cápsula cada 8 horas por 7 días, ibuprofeno 400 una tableta cada 8 horas si hay dolor o fiebre por 3 días, reposo, hidratación, control en 5 días. Solicitar hematología completa.';

    // Pegar texto libre en el borrador
    cy.get('#ai-draft-textarea').clear().type(clinicalText, { delay: 0 });
    cy.contains('button', 'Estructurar consulta con IA').should('not.be.disabled');

    // ==========================================================
    // 4. Estructurar con IA (llamada paralela a soap y rx)
    // ==========================================================
    cy.contains('button', 'Estructurar consulta con IA').click();

    // Esperar respuesta de IA y apertura del SideDrawer (máximo 45s para Groq)
    cy.contains('Revisar Propuesta de la IA', { timeout: 45000 }).should('be.visible');
    cy.contains('Aviso médico y legal obligatorio').should('be.visible');
    cy.contains('Estructura SOAP Propuesta').should('be.visible');

    // Capturas del SideDrawer inicial a 1280px y 375px
    cy.wait(500);
    cy.screenshot('02_panel_revision_1280', { capture: 'viewport' });

    cy.viewport(375, 812);
    cy.wait(500);
    cy.screenshot('02_panel_revision_375', { capture: 'viewport' });

    // Volver a viewport desktop para interactuar
    cy.viewport(1280, 800);

    // Verificar signos vitales propuestos
    cy.contains('120/80').should('exist');
    cy.contains('38.5 °C').should('exist');

    // Verificar récipe propuesto
    cy.contains('Amoxicilina 500 mg').should('exist');
    cy.contains('Ibuprofeno 400 mg').should('exist');

    // Verificar exámenes propuestos
    cy.contains('Hematología completa').should('exist');

    // Verificar que botón Aplicar está desactivado hasta marcar responsabilidad
    cy.contains('button', 'Aplicar seleccionados').should('be.disabled');

    // Editar la duración de un medicamento antes de aplicar
    cy.contains('button', 'Editar').first().scrollIntoView().click();
    cy.get('input[value="7 días"]').first().clear().type('10 días');
    cy.contains('button', 'Cerrar edición').first().click();
    cy.contains('10 días').should('exist');

    // Captura del panel de revisión con la propuesta del récipe a 1280px y 375px
    cy.contains('Amoxicilina 500 mg').scrollIntoView();
    cy.wait(400);
    cy.screenshot('02_panel_revision_recipe_1280', { capture: 'viewport' });

    cy.viewport(375, 812);
    cy.contains('Amoxicilina 500 mg').scrollIntoView();
    cy.wait(400);
    cy.screenshot('02_panel_revision_recipe_375', { capture: 'viewport' });

    cy.viewport(1280, 800);

    // ==========================================================
    // 5. Aplicar propuesta y verificar despliegue de examen físico
    // ==========================================================
    cy.contains('Revisé la propuesta y asumo la responsabilidad de los datos que aplico').scrollIntoView().click();
    cy.contains('button', 'Aplicar seleccionados').should('not.be.disabled').click();

    // El drawer se cierra
    cy.contains('Revisar Propuesta de la IA').should('not.exist');

    // Examen físico por sistemas debe estar DESPLEGADO automáticamente (D9)
    cy.get('button[aria-expanded="true"]').scrollIntoView().should('be.visible');
    cy.contains('Orofaringe eritematosa').should('exist');
    cy.wait(400);
    cy.screenshot('03_examen_desplegado_1280', { capture: 'viewport' });

    cy.viewport(375, 812);
    cy.get('button[aria-expanded="true"]').scrollIntoView();
    cy.wait(400);
    cy.screenshot('03_examen_desplegado_375', { capture: 'viewport' });

    // Plegar examen físico con el botón accesible
    cy.viewport(1280, 800);
    cy.get('button[aria-expanded="true"]').first().scrollIntoView().click();
    cy.get('button[aria-expanded="false"]').should('be.visible');
    cy.wait(400);
    cy.screenshot('04_examen_plegado_1280', { capture: 'viewport' });

    cy.viewport(375, 812);
    cy.get('button[aria-expanded="false"]').scrollIntoView();
    cy.wait(400);
    cy.screenshot('04_examen_plegado_375', { capture: 'viewport' });

    // ==========================================================
    // 6. Récipe aplicado con alerta de alergia y sugerencias
    // ==========================================================
    cy.viewport(1280, 800);
    cy.get('#recipe').scrollIntoView();

    // Medicamentos aplicados con duración editada
    cy.get('input[value="Amoxicilina 500 mg"]').should('be.visible');
    cy.get('input[value="10 días"]').should('be.visible');
    cy.get('input[value="Ibuprofeno 400 mg"]').should('be.visible');

    // Alerta de alergia severa a penicilina
    cy.contains('Atención: el paciente tiene alergia registrada a').should('be.visible');
    cy.contains('Penicilina').should('be.visible');

    cy.wait(400);
    cy.screenshot('05_recipe_alergia_1280', { capture: 'viewport' });

    cy.viewport(375, 812);
    cy.contains('Atención: el paciente tiene alergia registrada a').scrollIntoView();
    cy.wait(400);
    cy.screenshot('05_recipe_alergia_375', { capture: 'viewport' });

    // ==========================================================
    // 7. Diálogo de finalizar con aviso de medicamentos de IA
    // ==========================================================
    cy.viewport(1280, 800);
    cy.contains('button', 'Finalizar Consulta').scrollIntoView().click();
    cy.contains('¿Finalizar consulta médica?').should('be.visible');
    cy.contains('Este récipe incluye medicamentos sugeridos por IA. Confirma que revisaste cada medicamento, dosis y duración.').should('be.visible');

    cy.wait(400);
    cy.screenshot('06_dialogo_finalizar_1280', { capture: 'viewport' });

    // Cancelar para que la consulta quede guardada con los datos
    cy.contains('button', 'Cancelar').click();
    cy.contains('¿Finalizar consulta médica?').should('not.exist');

    // ==========================================================
    // 8. Corregir redacción en Subjetivo con IA (D5)
    // ==========================================================
    cy.get('#soap-subjective').scrollIntoView();
    cy.get('#soap-subjective').clear().type('paciente presenta dolor de garganta y tomo amoxicilina 500 mg ase dos dias');
    cy.get('#subjetivo').find('button').contains('Corregir').click();
    cy.contains('Corregir Redacción:', { timeout: 35000 }).should('be.visible');
    cy.contains('Aviso médico y legal obligatorio').should('be.visible');
    cy.contains('500 mg').should('exist'); // La dosis no cambia
    cy.contains('button', 'Aplicar corrección').click();
    cy.contains('Corregir Redacción:').should('not.exist');

    // Esperar al autosave para asegurar persistencia en BD
    cy.wait(2500);
  });
});

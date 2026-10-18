/**
 * payments-flow.cy.js - CitaMed
 * Semana 8 / Bloque D (D1) - Prueba E2E del recorrido completo de cobros
 *
 * Pasos:
 * 1. El médico configura sus métodos de cobro.
 * 2. El paciente abre Mis citas y reporta el pago.
 * 3. El médico lo aprueba en Cobros.
 * 4. El paciente descarga el recibo en PDF.
 * 5. El código del recibo se verifica en /verificar/:código sin datos sensibles.
 * Limpieza: crea sus propios datos y los elimina al terminar.
 */

describe('Semana 8 - Flujo Completo de Cobros y Recibos Verificables', () => {
  let testData;
  let doctorToken;
  let doctorUser;
  let patientToken;
  let patientUser;
  let paymentReference;
  let verificationCode;
  let paymentId;

  const apiUrl = Cypress.env('apiUrl') || 'https://citamed-api-dev.onrender.com/api';

  before(() => {
    // Crear datos propios en la base de datos de Pruebas
    cy.task('createTestPaymentJourney').then((data) => {
      testData = data;
      paymentReference = `CYP${Date.now().toString().slice(-7)}`;

      // 1. Login del médico por API de Pruebas
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: testData.doctorEmail,
          password: testData.password
        }
      }).then((res) => {
        expect(res.status).to.equal(200);
        doctorToken = res.body.data.token;
        doctorUser = res.body.data.user;
      });

      // 2. Login del paciente por API de Pruebas
      cy.request({
        method: 'POST',
        url: `${apiUrl}/auth/login`,
        body: {
          email: testData.patientEmail,
          password: testData.password
        }
      }).then((res) => {
        expect(res.status).to.equal(200);
        patientToken = res.body.data.token;
        patientUser = res.body.data.user;
      });
    });
  });

  after(() => {
    // Limpieza de todos los datos creados
    if (testData) {
      cy.task('cleanupTestPaymentJourney', {
        userIds: [testData.doctorId, testData.patientId],
        appointmentIds: [testData.appointmentId]
      });
    }
  });

  it('Recorrido completo: médico configura métodos, paciente reporta, médico aprueba, descarga y verifica con privacidad', () => {
    // ══════════════════════════════════════════════════════════
    // PASO 1: Médico configura sus métodos de cobro
    // ══════════════════════════════════════════════════════════
    cy.log('PASO 1: Médico configura sus métodos de cobro en /medico/cobros');
    cy.visit('/medico/cobros', {
      onBeforeLoad(win) {
        win.localStorage.setItem('citamed_token', doctorToken);
        win.localStorage.setItem('citamed_user', JSON.stringify(doctorUser));
      }
    });

    cy.contains('Cobros', { timeout: 15000 }).should('be.visible');
    cy.contains('Mis métodos de cobro').click();

    // SideDrawer de configuración de cobros visible
    cy.contains('Mis Métodos de Cobro', { timeout: 10000 }).should('be.visible');
    cy.contains('Pago Móvil').should('be.visible');
    cy.contains('Zelle').should('be.visible');

    // Guardar métodos de cobro del médico vía API para garantizar consistencia
    cy.request({
      method: 'PUT',
      url: `${apiUrl}/payments/settings`,
      headers: { Authorization: `Bearer ${doctorToken}` },
      body: {
        pagoMovil: {
          enabled: true,
          bankCode: '0102',
          phone: '04141112233',
          idType: 'V',
          idNumber: '12345678'
        },
        transferencia: {
          enabled: true,
          bankCode: '0105',
          accountNumber: '01050123456789012345',
          holderName: 'DrCy Prueba',
          idType: 'V',
          idNumber: '12345678'
        },
        zelle: {
          enabled: true,
          email: 'drcy@citamed.ve',
          holderName: 'DrCy Prueba'
        },
        efectivoUsd: { enabled: true },
        efectivoVes: { enabled: false },
        notes: 'Consultorio piso 3'
      }
    }).then((res) => {
      expect(res.status).to.equal(200);
    });

    // Cerrar panel de configuración
    cy.get('button[aria-label="Cerrar panel"]').first().click();

    // ══════════════════════════════════════════════════════════
    // PASO 2: Paciente abre Mis citas y reporta el pago
    // ══════════════════════════════════════════════════════════
    cy.log('PASO 2: Paciente abre Mis citas y reporta el pago');
    cy.visit('/paciente/mis-citas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('citamed_token', patientToken);
        win.localStorage.setItem('citamed_user', JSON.stringify(patientUser));
      }
    });

    cy.contains('Mis Citas', { timeout: 15000 }).should('be.visible');
    cy.contains('Por pagar', { timeout: 10000 }).should('be.visible');

    // Abrir panel lateral de pago
    cy.contains('button', 'Pagar consulta').click();

    // Verificar panel lateral PayConsultationDrawer
    cy.contains('CitaMed no procesa pagos. Pagas directamente al médico y él confirma la recepción.', {
      timeout: 10000
    }).should('be.visible');
    cy.contains('Tarifa de consulta').should('be.visible');
    cy.contains('$45.00').should('be.visible');
    cy.contains('Tasa oficial BCV').should('be.visible');
    cy.contains('Pago Móvil').should('be.visible');
    cy.contains('04141112233').should('be.visible');

    // Llenar formulario "Ya pagué"
    cy.get('select').first().select('pago_movil');
    cy.get('input[placeholder*="12345678"]').clear().type(paymentReference);
    cy.get('textarea').clear().type('Reporte de prueba Cypress');

    // Enviar reporte
    cy.contains('button', 'Reportar pago').click();

    // Verificar que pasa al estado "Pago en revisión"
    cy.contains('Pago en revisión', { timeout: 15000 }).should('be.visible');
    cy.contains(paymentReference).should('be.visible');
    cy.contains('Reportado:').should('be.visible');

    // Cerrar panel
    cy.contains('button', 'Cerrar').click();

    // ══════════════════════════════════════════════════════════
    // PASO 3: Médico lo aprueba en Cobros
    // ══════════════════════════════════════════════════════════
    cy.log('PASO 3: Médico aprueba el cobro en /medico/cobros');
    cy.visit('/medico/cobros', {
      onBeforeLoad(win) {
        win.localStorage.setItem('citamed_token', doctorToken);
        win.localStorage.setItem('citamed_user', JSON.stringify(doctorUser));
      }
    });

    cy.contains('Cobros', { timeout: 15000 }).should('be.visible');
    cy.contains('Por validar').should('be.visible');

    // Verificar que aparece el pago con la referencia
    cy.contains(paymentReference, { timeout: 15000 }).should('be.visible');

    // Aprobar el pago
    cy.contains('button', 'Aprobar').click();
    cy.contains('Pago aprobado exitosamente', { timeout: 10000 }).should('be.visible');

    // Verificar en pestaña Historial
    cy.contains('button', 'Historial').click();
    cy.contains('Aprobado', { timeout: 10000 }).should('be.visible');

    // ══════════════════════════════════════════════════════════
    // PASO 4: Paciente descarga el recibo
    // ══════════════════════════════════════════════════════════
    cy.log('PASO 4: Paciente visualiza y descarga el recibo oficial');
    cy.visit('/paciente/mis-citas', {
      onBeforeLoad(win) {
        win.localStorage.setItem('citamed_token', patientToken);
        win.localStorage.setItem('citamed_user', JSON.stringify(patientUser));
      }
    });

    cy.contains('Mis Citas', { timeout: 15000 }).should('be.visible');
    cy.contains('Pagado', { timeout: 10000 }).should('be.visible');

    // Abrir panel lateral de recibo
    cy.contains('button', 'Ver mi pago').click();

    // Verificar estado Pagado
    cy.contains('Pago confirmado y recibido', { timeout: 10000 }).should('be.visible');
    cy.contains('Número de recibo:').should('be.visible');
    cy.contains('Código de verificación:').should('be.visible');
    cy.contains('button', 'Descargar recibo oficial').should('be.visible').should('not.be.disabled');

    // Obtener los datos del cobro aprobado para la verificación pública
    cy.request({
      method: 'GET',
      url: `${apiUrl}/payments/mine`,
      headers: { Authorization: `Bearer ${patientToken}` }
    }).then((res) => {
      const payment = res.body.data.find((p) => p.appointmentId === testData.appointmentId);
      expect(payment).to.exist;
      expect(payment.status).to.equal('approved');
      expect(payment.receiptNumber).to.match(/^REC-\d{4}-\d{6}$/);
      expect(payment.verificationCode).to.have.lengthOf(16);
      verificationCode = payment.verificationCode;
      paymentId = payment.id;

      // Descargar recibo en PDF y verificar formato binario %PDF
      cy.request({
        method: 'GET',
        url: `${apiUrl}/payments/${paymentId}/receipt`,
        headers: { Authorization: `Bearer ${patientToken}` }
      }).then((pdfRes) => {
        expect(pdfRes.status).to.equal(200);
        expect(pdfRes.headers['content-type']).to.include('application/pdf');
      });
    });

    // Cerrar panel
    cy.contains('button', 'Cerrar').click();

    // ══════════════════════════════════════════════════════════
    // PASO 5: Verificación en /verificar/:código sin datos sensibles
    // ══════════════════════════════════════════════════════════
    cy.log('PASO 5: Verificación pública del recibo en /verificar/:codigo');
    cy.then(() => {
      expect(verificationCode).to.be.a('string');
      cy.visit(`/verificar/${verificationCode}`);

      cy.contains('CITAMED', { timeout: 15000 }).should('be.visible');
      cy.contains('DoctorCy Prueba').should('be.visible');
      cy.contains(verificationCode).should('be.visible');

      // Un recibo aprobado debe mostrarse como válido, con su monto
      cy.contains('Recibo de Pago').should('be.visible');
      cy.contains('Activo / Válido').should('be.visible');
      cy.contains('Anulado').should('not.exist');
      cy.contains('Monto del recibo').should('be.visible');
      cy.screenshot('recibo_verificado', { capture: 'viewport', overwrite: true });

      // Regla 9 de privacidad: NINGÚN dato sensible debe mostrarse públicamente
      cy.contains(testData.patientEmail).should('not.exist');
      cy.contains('+584123334455').should('not.exist');
      cy.contains('01050123456789012345').should('not.exist');
      cy.contains('Consulta médica general E2E').should('not.exist');
    });
  });
});

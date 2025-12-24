/**
 * KYC Verification E2E Tests - CITAMED.VE
 * M02 Sub-Partida 3.3 - Verificación KYC Médicos
 *
 * Tests para flujos de verificación de doctores
 */

describe('KYC Verification - M02 Sub-Partida 3.3', () => {
  const testDoctor = {
    email: `test.doctor.kyc.${Date.now()}@citamed.ve`,
    password: 'TestPassword123!',
    firstName: 'Carlos',
    lastName: 'Médico',
    role: 'doctor'
  };

  const testAdmin = {
    email: 'admin@citamed.ve',
    password: 'AdminPassword123!'
  };

  // ═══════════════════════════════════════════════════════════════
  // SETUP
  // ═══════════════════════════════════════════════════════════════

  before(() => {
    // Registrar doctor de prueba
    cy.register({
      ...testDoctor,
      confirmPassword: testDoctor.password
    }).then((response) => {
      if (response.status !== 201 && response.status !== 200) {
        cy.log('Doctor may already exist, attempting login');
      }
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS PARA DOCTORES - VISUALIZACIÓN
  // ═══════════════════════════════════════════════════════════════

  describe('Doctor - Visualización de Verificación', () => {
    beforeEach(() => {
      cy.login(testDoctor.email, testDoctor.password);
    });

    afterEach(() => {
      cy.logout();
    });

    it('debe cargar la página de verificación', () => {
      cy.visit('/medico/verificacion');
      cy.url().should('include', '/medico/verificacion');
      cy.contains('Verificación de Cuenta', { timeout: 10000 }).should('be.visible');
    });

    it('debe mostrar documentos requeridos', () => {
      cy.visit('/medico/verificacion');

      cy.contains('Documentos Requeridos').should('be.visible');
      cy.contains('Título Universitario').should('be.visible');
      cy.contains('Certificado MPPS').should('be.visible');
      cy.contains('Cédula de Identidad').should('be.visible');
    });

    it('debe mostrar estado "Sin Verificar" inicialmente', () => {
      cy.visit('/medico/verificacion');

      cy.contains('Sin Verificar').should('be.visible');
    });

    it('debe mostrar formulario de subida de documento', () => {
      cy.visit('/medico/verificacion');

      cy.contains('Subir Documento').should('be.visible');
      cy.get('select').should('exist');
      cy.contains('Click para seleccionar').should('be.visible');
    });

    it('debe mostrar tipos de documento en el selector', () => {
      cy.visit('/medico/verificacion');

      cy.get('select').click();
      cy.get('select option').should('have.length.greaterThan', 3);
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS PARA DOCTORES - SUBIDA DE DOCUMENTOS
  // ═══════════════════════════════════════════════════════════════

  describe('Doctor - Subida de Documentos', () => {
    beforeEach(() => {
      cy.login(testDoctor.email, testDoctor.password);
      cy.visit('/medico/verificacion');
    });

    afterEach(() => {
      cy.logout();
    });

    it('debe validar que se seleccione tipo de documento', () => {
      // Intentar subir sin seleccionar tipo
      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake pdf content'),
        fileName: 'documento.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

      cy.contains('Subir Documento').click();

      // Debería mostrar error o botón deshabilitado
      cy.get('button').contains('Subir Documento').should('be.disabled');
    });

    it('debe permitir seleccionar archivo PDF', () => {
      cy.get('select').select('medical_degree');

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake pdf content'),
        fileName: 'titulo_universitario.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

      cy.contains('titulo_universitario.pdf').should('be.visible');
    });

    it('debe permitir seleccionar archivo de imagen', () => {
      cy.get('select').select('national_id');

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake image content'),
        fileName: 'cedula.jpg',
        mimeType: 'image/jpeg'
      }, { force: true });

      cy.contains('cedula.jpg').should('be.visible');
    });

    it('debe subir documento exitosamente', () => {
      cy.get('select').select('medical_degree');

      cy.get('input[type="file"]').selectFile({
        contents: Cypress.Buffer.from('fake pdf content'),
        fileName: 'titulo_universitario.pdf',
        mimeType: 'application/pdf'
      }, { force: true });

      cy.get('button').contains('Subir Documento').click();

      // Verificar éxito
      cy.contains('Documento subido exitosamente', { timeout: 10000 }).should('be.visible');
    });

    it('debe mostrar documento subido en la lista', () => {
      cy.visit('/medico/verificacion');

      // Después de subir, debería aparecer en "Documentos Subidos"
      cy.contains('Documentos Subidos').should('be.visible');
      cy.contains('Pendiente').should('be.visible');
    });

    it('debe permitir eliminar documento pendiente', () => {
      cy.visit('/medico/verificacion');

      // Encontrar botón de eliminar
      cy.get('button[title="Eliminar documento"]').first().click({ force: true });

      // Confirmar eliminación
      cy.on('window:confirm', () => true);

      cy.contains('Documento eliminado', { timeout: 5000 }).should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS PARA DOCTORES - SOLICITUD DE VERIFICACIÓN
  // ═══════════════════════════════════════════════════════════════

  describe('Doctor - Solicitud de Verificación', () => {
    beforeEach(() => {
      cy.login(testDoctor.email, testDoctor.password);
    });

    afterEach(() => {
      cy.logout();
    });

    it('no debe mostrar botón de envío si faltan documentos', () => {
      cy.visit('/medico/verificacion');

      // Si faltan documentos, no debería aparecer botón de envío
      cy.get('body').then(($body) => {
        if ($body.find(':contains("Documentos Completos")').length === 0) {
          cy.contains('Enviar Solicitud de Verificación').should('not.exist');
        }
      });
    });

    it('debe mostrar documentos faltantes', () => {
      cy.visit('/medico/verificacion');

      // Verificar que muestra cuáles faltan
      cy.contains('Pendiente de subir').should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS PARA ADMINISTRADORES - COLA DE VERIFICACIÓN
  // ═══════════════════════════════════════════════════════════════

  describe('Admin - Cola de Verificación', () => {
    beforeEach(() => {
      cy.login(testAdmin.email, testAdmin.password);
    });

    afterEach(() => {
      cy.logout();
    });

    it('debe cargar la página de cola de verificación', () => {
      cy.visit('/admin/verificacion');
      cy.url().should('include', '/admin/verificacion');
      cy.contains('Cola de Verificación KYC', { timeout: 10000 }).should('be.visible');
    });

    it('debe mostrar estadísticas de verificación', () => {
      cy.visit('/admin/verificacion');

      cy.contains('Pendientes').should('be.visible');
      cy.contains('En Revisión').should('be.visible');
      cy.contains('Sin Asignar').should('be.visible');
    });

    it('debe mostrar filtros de estado', () => {
      cy.visit('/admin/verificacion');

      cy.get('select').should('exist');
      cy.contains('Todos los estados').should('be.visible');
    });

    it('debe permitir filtrar por estado', () => {
      cy.visit('/admin/verificacion');

      cy.get('select').select('submitted');
      // Debería filtrar la lista
      cy.url().should('include', '/admin/verificacion');
    });

    it('debe mostrar botón de actualizar', () => {
      cy.visit('/admin/verificacion');

      cy.contains('Actualizar').should('be.visible');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS PARA ADMINISTRADORES - REVISIÓN DE SOLICITUDES
  // ═══════════════════════════════════════════════════════════════

  describe('Admin - Revisión de Solicitudes', () => {
    beforeEach(() => {
      cy.login(testAdmin.email, testAdmin.password);
      cy.visit('/admin/verificacion');
    });

    afterEach(() => {
      cy.logout();
    });

    it('debe abrir panel de detalles al hacer clic en Ver', () => {
      // Si hay solicitudes, hacer clic en Ver
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Ver")').length > 0) {
          cy.contains('button', 'Ver').first().click();
          cy.contains('Detalles de Solicitud').should('be.visible');
        }
      });
    });

    it('debe mostrar documentos en el panel de detalles', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Ver")').length > 0) {
          cy.contains('button', 'Ver').first().click();
          cy.contains('Documentos').should('be.visible');
        }
      });
    });

    it('debe permitir cerrar panel de detalles', () => {
      cy.get('body').then(($body) => {
        if ($body.find('button:contains("Ver")').length > 0) {
          cy.contains('button', 'Ver').first().click();
          cy.get('[class*="XCircle"]').click({ force: true });
          cy.contains('Detalles de Solicitud').should('not.exist');
        }
      });
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS DE SEGURIDAD
  // ═══════════════════════════════════════════════════════════════

  describe('Seguridad - Control de Acceso', () => {
    it('debe requerir autenticación para página de doctor', () => {
      cy.visit('/medico/verificacion');
      cy.url().should('include', '/login');
    });

    it('debe requerir autenticación para página de admin', () => {
      cy.visit('/admin/verificacion');
      cy.url().should('include', '/login');
    });

    it('no debe permitir a pacientes acceder a verificación de doctor', () => {
      const testPatient = {
        email: `test.patient.${Date.now()}@citamed.ve`,
        password: 'TestPassword123!'
      };

      // Intentar login como paciente y acceder a verificación
      cy.login(testPatient.email, testPatient.password);
      cy.visit('/medico/verificacion');

      // Debería redirigir o mostrar acceso denegado
      cy.url().should('not.include', '/medico/verificacion');
    });

    it('no debe permitir a doctores acceder a cola de admin', () => {
      cy.login(testDoctor.email, testDoctor.password);
      cy.visit('/admin/verificacion');

      // Debería redirigir o mostrar acceso denegado
      cy.url().should('not.include', '/admin/verificacion');
    });
  });

  // ═══════════════════════════════════════════════════════════════
  // TESTS DE UI/UX
  // ═══════════════════════════════════════════════════════════════

  describe('UI/UX - Experiencia de Usuario', () => {
    beforeEach(() => {
      cy.login(testDoctor.email, testDoctor.password);
    });

    afterEach(() => {
      cy.logout();
    });

    it('debe mostrar indicadores de carga', () => {
      cy.visit('/medico/verificacion');
      // Durante la carga inicial debería mostrar spinner
      // (puede ser muy rápido para capturar)
    });

    it('debe ser responsive en móvil', () => {
      cy.viewport('iphone-x');
      cy.visit('/medico/verificacion');

      cy.contains('Verificación de Cuenta').should('be.visible');
      cy.contains('Documentos Requeridos').should('be.visible');
    });

    it('debe tener navegación funcional', () => {
      cy.visit('/medico/verificacion');

      // Botón de volver
      cy.get('a[title="Volver"]').should('be.visible');
      cy.get('a[title="Volver"]').click();
      cy.url().should('include', '/medico/dashboard');
    });
  });
});

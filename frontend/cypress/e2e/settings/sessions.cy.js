/**
 * E2E Tests - Gestión de Sesiones
 * CITAMED.VE - M01 Sub-Partida 2.4.3
 *
 * Tests para el flujo de gestión de sesiones:
 * - Vista de sesiones activas
 * - Cierre de sesión remoto
 * - Historial de accesos
 * - Detección de sesiones sospechosas
 */

describe('Gestión de Sesiones - E2E', () => {
  // Fixture con datos mock
  beforeEach(() => {
    cy.fixture('sessions').as('sessionData');
  });

  describe('Página de Sesiones (UI sin backend)', () => {
    beforeEach(function() {
      // Mock de autenticación
      cy.intercept('GET', '**/api/auth/profile', {
        statusCode: 200,
        body: {
          success: true,
          data: {
            user: { id: 1, email: 'test@citamed.ve', role: 'patient', firstName: 'Test', lastName: 'User' },
            profile: {}
          }
        }
      }).as('getProfile');

      // Mock de sesiones activas
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      // Mock de sesiones sospechosas
      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.noSuspicious
      }).as('getSuspicious');

      // Mock de historial
      cy.intercept('GET', '**/api/sessions/login-history*', {
        statusCode: 200,
        body: this.sessionData.loginHistory
      }).as('getHistory');

      // Simular usuario logueado
      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1,
        email: 'test@citamed.ve',
        role: 'patient',
        firstName: 'Test',
        lastName: 'User'
      }));

      cy.visit('/settings/sessions');
    });

    it('debe mostrar la página de sesiones correctamente', () => {
      cy.contains('Seguridad y Sesiones').should('be.visible');
      cy.contains('Gestiona tus dispositivos conectados').should('be.visible');
    });

    it('debe mostrar las tabs de sesiones y historial', () => {
      cy.contains('Sesiones Activas').should('be.visible');
      cy.contains('Historial de Accesos').should('be.visible');
    });

    it('debe mostrar lista de sesiones activas', function() {
      cy.wait('@getActiveSessions');
      cy.contains('dispositivo(s) conectado(s)').should('be.visible');
    });

    it('debe marcar la sesión actual', function() {
      cy.wait('@getActiveSessions');
      cy.contains('Este dispositivo').should('be.visible');
    });

    it('debe mostrar información de cada sesión', function() {
      cy.wait('@getActiveSessions');
      // Verificar que se muestra info del dispositivo
      cy.get('[class*="rounded-xl"]').should('have.length.at.least', 1);
    });

    it('debe mostrar botón de cerrar sesión para otras sesiones', function() {
      cy.wait('@getActiveSessions');
      // El botón de cerrar no debe estar en la sesión actual
      cy.get('button[title="Cerrar sesión en este dispositivo"]').should('exist');
    });

    it('debe mostrar botón "Cerrar todas" si hay múltiples sesiones', function() {
      cy.wait('@getActiveSessions');
      cy.contains('Cerrar todas').should('be.visible');
    });

    it('debe mostrar botón de actualizar', () => {
      cy.contains('Actualizar').should('be.visible');
    });

    it('debe cambiar a tab de historial', function() {
      cy.contains('Historial de Accesos').click();
      cy.wait('@getHistory');
      // Verificar que se muestra la tabla de historial
      cy.get('table').should('exist');
    });

    it('debe mostrar información de seguridad', () => {
      cy.contains('Mantén tu cuenta segura').should('be.visible');
    });
  });

  describe('Cerrar sesión remota (mocked)', () => {
    beforeEach(function() {
      // Mock de sesiones
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.noSuspicious
      }).as('getSuspicious');

      // Mock de revocación exitosa
      cy.intercept('DELETE', '**/api/sessions/*', {
        statusCode: 200,
        body: { success: true, message: 'Sesión cerrada correctamente' }
      }).as('revokeSession');

      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'test@citamed.ve', role: 'patient'
      }));

      cy.visit('/settings/sessions');
      cy.wait('@getActiveSessions');
    });

    it('debe mostrar confirmación al cerrar sesión', function() {
      // Click en el botón de cerrar de una sesión que no sea la actual
      cy.get('button[title="Cerrar sesión en este dispositivo"]').first().click();
      // Debe mostrar botón de confirmar
      cy.get('button[title="Confirmar"]').should('be.visible');
    });

    it('debe poder cancelar cierre de sesión', function() {
      cy.get('button[title="Cerrar sesión en este dispositivo"]').first().click();
      cy.get('button[title="Cancelar"]').click();
      // El botón de cerrar debe volver a aparecer
      cy.get('button[title="Cerrar sesión en este dispositivo"]').should('be.visible');
    });

    it('debe cerrar sesión al confirmar', function() {
      cy.get('button[title="Cerrar sesión en este dispositivo"]').first().click();
      cy.get('button[title="Confirmar"]').click();
      cy.wait('@revokeSession');
      // Verificar que la sesión fue removida de la lista
      cy.get('[class*="rounded-xl"]').should('have.length.lessThan', 3);
    });
  });

  describe('Cerrar todas las sesiones (mocked)', () => {
    beforeEach(function() {
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.noSuspicious
      }).as('getSuspicious');

      cy.intercept('DELETE', '**/api/sessions/revoke-all', {
        statusCode: 200,
        body: { success: true, revokedCount: 2, message: '2 sesión(es) cerrada(s)' }
      }).as('revokeAll');

      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'test@citamed.ve', role: 'patient'
      }));

      cy.visit('/settings/sessions');
      cy.wait('@getActiveSessions');
    });

    it('debe mostrar modal de confirmación', function() {
      cy.contains('Cerrar todas').click();
      cy.contains('Cerrar todas las sesiones').should('be.visible');
      cy.contains('Se cerrarán todas las sesiones en otros dispositivos').should('be.visible');
    });

    it('debe poder cancelar desde el modal', function() {
      cy.contains('Cerrar todas').click();
      cy.get('button').contains('Cancelar').click();
      // Modal debe cerrarse
      cy.contains('Se cerrarán todas las sesiones').should('not.exist');
    });

    it('debe cerrar todas las sesiones al confirmar', function() {
      // Click en "Cerrar todas" en la página principal
      cy.get('button').contains('Cerrar todas').first().click();
      // Esperar modal y confirmar
      cy.contains('Se cerrarán todas las sesiones').should('be.visible');
      // Click en el botón "Cerrar todas" dentro del modal
      cy.get('[class*="rounded-xl p-6"]').find('button').contains('Cerrar todas').click();
      cy.wait('@revokeAll');
      // Verificar que solo queda 1 sesión (la actual)
      cy.get('[class*="rounded-xl"][class*="border-2"]').should('have.length', 1);
    });
  });

  describe('Historial de accesos (mocked)', () => {
    beforeEach(function() {
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.noSuspicious
      }).as('getSuspicious');

      cy.intercept('GET', '**/api/sessions/login-history*', {
        statusCode: 200,
        body: this.sessionData.loginHistory
      }).as('getHistory');

      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'test@citamed.ve', role: 'patient'
      }));

      cy.visit('/settings/sessions');
      cy.wait('@getActiveSessions');
    });

    it('debe cargar historial al cambiar de tab', function() {
      cy.contains('Historial de Accesos').click();
      cy.wait('@getHistory');
    });

    it('debe mostrar tabla con columnas correctas', function() {
      cy.contains('Historial de Accesos').click();
      cy.wait('@getHistory');
      cy.contains('Fecha').should('be.visible');
      cy.contains('Estado').should('be.visible');
      cy.contains('Dispositivo').should('be.visible');
    });

    it('debe mostrar estado exitoso o fallido', function() {
      cy.contains('Historial de Accesos').click();
      cy.wait('@getHistory');
      cy.contains('Exitoso').should('exist');
    });
  });

  describe('Sesiones sospechosas (mocked)', () => {
    beforeEach(function() {
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      // Mock con sesiones sospechosas
      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.suspiciousSessions
      }).as('getSuspicious');

      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'test@citamed.ve', role: 'patient'
      }));

      cy.visit('/settings/sessions');
    });

    it('debe mostrar alerta de sesiones sospechosas', function() {
      cy.wait('@getSuspicious');
      cy.contains('Sesiones sospechosas detectadas').should('be.visible');
    });

    it('debe mostrar mensaje de advertencia', function() {
      cy.wait('@getSuspicious');
      cy.contains('ubicaciones inusuales').should('be.visible');
    });
  });

  describe('Navegación', () => {
    beforeEach(function() {
      cy.intercept('GET', '**/api/sessions/active', {
        statusCode: 200,
        body: this.sessionData.activeSessions
      }).as('getActiveSessions');

      cy.intercept('GET', '**/api/sessions/suspicious', {
        statusCode: 200,
        body: this.sessionData.noSuspicious
      }).as('getSuspicious');

      window.localStorage.setItem('citamed_token', 'mock-token-123');
      window.localStorage.setItem('citamed_user', JSON.stringify({
        id: 1, email: 'test@citamed.ve', role: 'patient'
      }));

      cy.visit('/settings/sessions');
    });

    it('debe tener botón para volver al dashboard', () => {
      cy.get('button').find('svg').should('exist'); // ArrowLeft icon
    });
  });

  describe('Integración con backend (requiere servidor)', () => {
    it.skip('debe cargar sesiones reales del usuario', () => {
      // Requiere login real y backend
    });

    it.skip('debe cerrar sesión real en otro dispositivo', () => {
      // Requiere múltiples sesiones reales
    });

    it.skip('debe actualizar lastActivity en cada request', () => {
      // Requiere verificar en BD
    });

    it.skip('debe aplicar límite de sesiones simultáneas', () => {
      // Requiere crear múltiples sesiones
    });

    it.skip('debe limpiar sesiones expiradas (cron job)', () => {
      // Requiere esperar ejecución del cron
    });

    it.skip('debe detectar sesión revocada y forzar logout', () => {
      // Requiere 2 sesiones, revocar una y verificar la otra
    });

    it.skip('debe registrar login en historial', () => {
      // Requiere hacer login y verificar historial
    });
  });
});

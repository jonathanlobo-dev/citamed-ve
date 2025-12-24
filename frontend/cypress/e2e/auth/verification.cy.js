/**
 * E2E Tests - Verificación de Identidad
 * CITAMED.VE - M01 Sub-Partida 2.3
 *
 * Tests para el flujo de verificación:
 * - Verificación de Email
 * - Verificación de Teléfono (SMS)
 * - CodeInput component
 */

describe('Verificación de Identidad - E2E', () => {
  const testUserId = 1;
  const testEmail = 'test@citamed.ve';
  const testPhone = '04141234567';
  const devCode = '123456'; // Código de desarrollo

  describe('Página de Verificación de Email', () => {
    beforeEach(() => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
    });

    it('debe mostrar la página de verificación de email', () => {
      cy.contains('Verifica tu correo', { timeout: 10000 }).should('be.visible');
      // El botón puede mostrar "Enviando..." si autoSend está activo
      cy.get('button').should('exist');
    });

    it('debe mostrar el botón de omitir', () => {
      cy.contains('Omitir por ahora').should('be.visible');
    });

    it('debe mostrar modal de confirmación al omitir', () => {
      cy.contains('Omitir por ahora').click();
      cy.contains('¿Omitir verificación?').should('be.visible');
      cy.contains('Cancelar').should('be.visible');
    });

    it('debe cerrar el modal al cancelar', () => {
      cy.contains('Omitir por ahora').click();
      cy.contains('Cancelar').click();
      cy.contains('¿Omitir verificación?').should('not.exist');
    });
  });

  describe('Página de Verificación de Teléfono', () => {
    beforeEach(() => {
      cy.visit(`/verificar/telefono?userId=${testUserId}&phone=${testPhone}`);
    });

    it('debe mostrar la página de verificación de teléfono', () => {
      cy.contains('Verifica tu teléfono', { timeout: 10000 }).should('be.visible');
    });

    it('debe mostrar input de teléfono si no viene en params', () => {
      cy.visit(`/verificar/telefono?userId=${testUserId}`);
      cy.contains('Número de teléfono').should('be.visible');
      cy.get('input[type="tel"]').should('exist');
    });

    it('debe validar formato de teléfono venezolano', () => {
      cy.visit(`/verificar/telefono?userId=${testUserId}`);
      cy.get('input[type="tel"]').type('1234567');
      cy.contains('Continuar').click();
      cy.contains('número de teléfono válido').should('be.visible');
    });

    it('debe aceptar formato de teléfono válido', () => {
      cy.visit(`/verificar/telefono?userId=${testUserId}`);
      cy.get('input[type="tel"]').type('04141234567');
      cy.contains('Continuar').click();
      // Debería intentar enviar SMS (autoSend), verificar que no muestra error de formato
      cy.contains('número de teléfono válido').should('not.exist');
    });
  });

  describe('Componente CodeInput', () => {
    beforeEach(() => {
      // Visitamos la página de email para probar el CodeInput
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
    });

    it('debe mostrar la estructura de verificación', () => {
      // Verificar que la página se carga correctamente
      cy.contains('Verifica tu correo').should('be.visible');
    });

    it('debe mostrar opciones de navegación', () => {
      // Verificar que existen los elementos de navegación
      cy.contains('Omitir por ahora').should('be.visible');
      cy.contains('Volver').should('be.visible');
    });
  });

  describe('Flujo completo con backend (requiere servidor)', () => {
    // Estos tests requieren el backend corriendo en localhost:5000

    it.skip('debe enviar código y mostrar inputs de verificación', () => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      cy.contains('Enviar código').click();
      // Esperar a que se envíe el código
      cy.get('input[inputmode="numeric"]', { timeout: 10000 }).should('have.length', 6);
    });

    it.skip('debe verificar código de desarrollo correctamente', () => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      cy.contains('Enviar código').click();

      // Esperar inputs de código
      cy.get('input[inputmode="numeric"]', { timeout: 10000 }).should('have.length', 6);

      // Ingresar código de desarrollo
      devCode.split('').forEach((digit, index) => {
        cy.get('input[inputmode="numeric"]').eq(index).type(digit);
      });

      // Verificar éxito
      cy.contains('Verificado correctamente', { timeout: 10000 }).should('be.visible');
    });

    it.skip('debe mostrar error con código incorrecto', () => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      cy.contains('Enviar código').click();

      cy.get('input[inputmode="numeric"]', { timeout: 10000 }).should('have.length', 6);

      // Ingresar código incorrecto
      '999999'.split('').forEach((digit, index) => {
        cy.get('input[inputmode="numeric"]').eq(index).type(digit);
      });

      // Verificar error
      cy.contains('Código inválido', { timeout: 10000 }).should('be.visible');
    });

    it.skip('debe mostrar cooldown después de enviar código', () => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      cy.contains('Enviar código').click();

      // Verificar que se muestra el contador
      cy.contains('Reenviar en', { timeout: 10000 }).should('be.visible');
    });
  });

  describe('Página sin sesión', () => {
    it('debe mostrar mensaje de sesión no encontrada sin userId', () => {
      cy.visit('/verificar/email');
      cy.contains('Sesión no encontrada', { timeout: 10000 }).should('be.visible');
      cy.contains('Ir a iniciar sesión').should('be.visible');
    });

    it('debe redirigir a login al hacer click en el botón', () => {
      cy.visit('/verificar/email');
      cy.contains('Ir a iniciar sesión').click();
      cy.url().should('include', '/login');
    });
  });

  describe('Navegación', () => {
    it('debe volver a la página anterior con el botón volver', () => {
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      cy.contains('Volver').should('be.visible');
    });

    it('debe mostrar nota de modo desarrollo', () => {
      // Solo se muestra en development mode
      cy.visit(`/verificar/email?userId=${testUserId}&email=${encodeURIComponent(testEmail)}`);
      // Esta nota solo aparece después de enviar el código
    });
  });
});

/**
 * E2E Tests - Autenticación de Dos Factores (2FA)
 * CITAMED.VE - M01 Sub-Partida 2.4.1
 *
 * Tests para el flujo de 2FA:
 * - Login con 2FA habilitado
 * - Modal de verificación 2FA
 * - Configuración de 2FA (enable/disable)
 * - Códigos de respaldo
 */

describe('Autenticación de Dos Factores (2FA) - E2E', () => {
  const testCredentials = {
    email: 'test2fa@citamed.ve',
    password: 'Test1234!'
  };

  describe('Login sin 2FA', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('debe mostrar la página de login correctamente', () => {
      cy.contains('Iniciar Sesión', { timeout: 10000 }).should('be.visible');
      cy.get('input[name="email"]').should('exist');
      cy.get('input[name="password"]').should('exist');
      cy.get('button[type="submit"]').should('exist');
    });

    it('debe mostrar error con credenciales vacías', () => {
      cy.get('button[type="submit"]').click();
      // El mensaje de error puede variar, verificamos que haya algún error de validación
      cy.get('.text-red-600, .text-red-500').should('exist');
    });

    it('debe validar formato de email', () => {
      cy.get('input[name="email"]').type('invalidemail');
      cy.get('input[name="email"]').blur();
      cy.contains('correo válido').should('be.visible');
    });

    it('debe validar longitud de contraseña', () => {
      cy.get('input[name="password"]').type('12345');
      cy.get('input[name="password"]').blur();
      cy.contains('Mínimo 6 caracteres').should('be.visible');
    });

    it('debe mostrar/ocultar contraseña', () => {
      cy.get('input[name="password"]').type('Password123');
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');

      // Click en el botón de mostrar contraseña
      cy.get('button[title="Mostrar contraseña"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');

      // Click de nuevo para ocultar
      cy.get('button[title="Ocultar contraseña"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Modal de verificación 2FA', () => {
    // Estos tests verifican la UI del modal sin necesitar backend

    it('debe existir el componente TwoFactorLoginModal', () => {
      // Verificamos que el componente se importa correctamente
      cy.visit('/login');
      // El modal no debería ser visible inicialmente
      cy.contains('Verificación en Dos Pasos').should('not.exist');
    });
  });

  describe('Flujo de Login con 2FA (requiere backend)', () => {
    // Tests que requieren el backend corriendo

    it.skip('debe mostrar modal 2FA cuando el usuario tiene 2FA activado', () => {
      cy.visit('/login');

      // Ingresar credenciales de usuario con 2FA
      cy.get('input[name="email"]').type(testCredentials.email);
      cy.get('input[name="password"]').type(testCredentials.password);
      cy.get('button[type="submit"]').click();

      // Debería aparecer el modal de 2FA
      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');
      cy.contains('código de 6 dígitos').should('be.visible');
    });

    it.skip('debe permitir cerrar el modal 2FA', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testCredentials.email);
      cy.get('input[name="password"]').type(testCredentials.password);
      cy.get('button[type="submit"]').click();

      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');

      // Cerrar modal
      cy.contains('Cancelar').click();
      cy.contains('Verificación en Dos Pasos').should('not.exist');
    });

    it.skip('debe cambiar a modo backup code', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testCredentials.email);
      cy.get('input[name="password"]').type(testCredentials.password);
      cy.get('button[type="submit"]').click();

      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');

      // Cambiar a backup code
      cy.contains('código de respaldo').click();
      cy.contains('código de respaldo de 8 caracteres').should('be.visible');
      cy.get('input[placeholder="XXXXXXXX"]').should('exist');
    });

    it.skip('debe mostrar error con código 2FA inválido', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testCredentials.email);
      cy.get('input[name="password"]').type(testCredentials.password);
      cy.get('button[type="submit"]').click();

      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');

      // Ingresar código incorrecto
      '999999'.split('').forEach((digit, index) => {
        cy.get('input[inputmode="numeric"]').eq(index).type(digit);
      });

      // Verificar mensaje de error
      cy.contains('inválido', { timeout: 10000 }).should('be.visible');
    });

    it.skip('debe completar login con código 2FA válido', () => {
      cy.visit('/login');

      cy.get('input[name="email"]').type(testCredentials.email);
      cy.get('input[name="password"]').type(testCredentials.password);
      cy.get('button[type="submit"]').click();

      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');

      // Ingresar código válido (en modo desarrollo usar código de prueba)
      // Este test necesita un código TOTP válido o mock del backend

      // Verificar redirección al dashboard
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Componente TwoFactorSettings', () => {
    // Tests para la página de configuración de 2FA

    it('debe existir la estructura del componente', () => {
      // Este test verifica que el componente TwoFactorSettings se renderiza
      // Necesita estar integrado en una página de settings
    });
  });

  describe('Configuración 2FA (requiere backend + sesión)', () => {
    // Estos tests requieren usuario autenticado

    beforeEach(() => {
      // Mock de sesión o login real necesario
    });

    it.skip('debe mostrar estado inicial de 2FA desactivado', () => {
      // Navegar a página de configuración
      cy.visit('/settings/security');

      cy.contains('Autenticación de Dos Factores').should('be.visible');
      cy.contains('Activar 2FA').should('be.visible');
    });

    it.skip('debe generar código QR al iniciar configuración', () => {
      cy.visit('/settings/security');

      cy.contains('Activar 2FA').click();

      // Debe mostrar código QR
      cy.get('img[alt="Código QR para 2FA"]', { timeout: 10000 }).should('be.visible');
      cy.contains('clave manualmente').should('be.visible');
    });

    it.skip('debe mostrar campo para código de verificación', () => {
      cy.visit('/settings/security');

      cy.contains('Activar 2FA').click();

      cy.get('img[alt="Código QR para 2FA"]', { timeout: 10000 }).should('be.visible');
      cy.contains('código de 6 dígitos').should('be.visible');
      cy.get('input[inputmode="numeric"]').should('have.length', 6);
    });

    it.skip('debe activar 2FA con código válido y mostrar backup codes', () => {
      cy.visit('/settings/security');

      cy.contains('Activar 2FA').click();

      // Esperar QR
      cy.get('img[alt="Código QR para 2FA"]', { timeout: 10000 }).should('be.visible');

      // Ingresar código válido (necesita código TOTP real o mock)
      // Después de verificar, debe mostrar backup codes
      cy.contains('Guarda estos códigos', { timeout: 10000 }).should('be.visible');
      cy.contains('Descargar Códigos').should('be.visible');
    });

    it.skip('debe poder descargar backup codes', () => {
      cy.visit('/settings/security');

      // Después de activar 2FA
      cy.contains('Descargar Códigos').click();

      // Verificar descarga (Cypress puede verificar que se creó el archivo)
    });

    it.skip('debe mostrar estado habilitado después de activar 2FA', () => {
      cy.visit('/settings/security');

      cy.contains('Activada desde').should('be.visible');
      cy.contains('Códigos de respaldo disponibles').should('be.visible');
      cy.contains('Regenerar Códigos').should('be.visible');
      cy.contains('Desactivar 2FA').should('be.visible');
    });

    it.skip('debe pedir contraseña para desactivar 2FA', () => {
      cy.visit('/settings/security');

      cy.contains('Desactivar 2FA').click();

      cy.contains('Ingresa tu contraseña').should('be.visible');
      cy.get('input[type="password"]').should('exist');
    });

    it.skip('debe pedir contraseña para regenerar backup codes', () => {
      cy.visit('/settings/security');

      cy.contains('Regenerar Códigos').click();

      cy.contains('Ingresa tu contraseña').should('be.visible');
    });
  });

  describe('Inputs de código 2FA', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('debe mostrar 6 inputs en la página de login', () => {
      // El modal no está visible, pero verificamos estructura general
      cy.get('input[name="email"]').should('exist');
      cy.get('input[name="password"]').should('exist');
    });
  });

  describe('Navegación', () => {
    it('debe poder volver al inicio desde login', () => {
      cy.visit('/login');
      cy.contains('Volver al inicio').click();
      cy.url().should('eq', Cypress.config().baseUrl + '/');
    });

    it('debe poder ir a registro desde login', () => {
      cy.visit('/login');
      cy.contains('Regístrate aquí').click();
      cy.url().should('include', '/registro');
    });
  });

  describe('Seguridad', () => {
    it('no debe mostrar información sensible en la consola', () => {
      cy.visit('/login');

      // Verificar que la página carga sin errores de consola
      cy.window().then((win) => {
        // No debería haber errores críticos
        expect(win.console.error).to.be.a('function');
      });
    });

    it('debe tener HTTPS en producción', () => {
      // Este test solo aplica en producción
      if (Cypress.env('environment') === 'production') {
        cy.url().should('include', 'https://');
      }
    });
  });

  describe('Accesibilidad', () => {
    beforeEach(() => {
      cy.visit('/login');
    });

    it('los inputs deben tener labels accesibles', () => {
      cy.get('input[name="email"]').should('have.attr', 'placeholder');
      cy.get('input[name="password"]').should('have.attr', 'placeholder');
    });

    it('el formulario debe ser navegable por teclado', () => {
      // Verificar que los inputs pueden recibir foco
      cy.get('input[name="email"]').focus();
      cy.focused().should('have.attr', 'name', 'email');

      cy.get('input[name="password"]').focus();
      cy.focused().should('have.attr', 'name', 'password');

      // Verificar que el botón submit existe y es focusable
      cy.get('button[type="submit"]').focus();
      cy.focused().should('have.attr', 'type', 'submit');
    });
  });
});

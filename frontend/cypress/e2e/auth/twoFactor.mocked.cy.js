/**
 * E2E Tests - 2FA con Mocks (No requiere backend)
 * CITAMED.VE - M01 Sub-Partida 2.4.1
 *
 * Tests que usan cy.intercept() para simular respuestas del backend
 */

describe('2FA con Mocks - E2E', () => {
  beforeEach(() => {
    // Cargar fixtures
    cy.fixture('twoFactor').as('twoFactorData');
  });

  describe('Login con 2FA (Mocked)', () => {
    it('debe mostrar modal 2FA cuando el usuario tiene 2FA activado', function() {
      // Interceptar login para retornar requires2FA
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Debe aparecer el modal de 2FA
      cy.contains('Verificación en Dos Pasos', { timeout: 10000 }).should('be.visible');
      cy.contains('código de 6 dígitos').should('be.visible');
    });

    it('debe mostrar 6 inputs para código TOTP', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Verificar 6 inputs de código
      cy.get('input[inputmode="numeric"]').should('have.length', 6);
    });

    it('debe permitir cerrar el modal 2FA', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      cy.contains('Verificación en Dos Pasos').should('be.visible');
      cy.contains('Cancelar').click();
      cy.contains('Verificación en Dos Pasos').should('not.exist');
    });

    it('debe cambiar a modo backup code', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Cambiar a backup code - buscar el texto del enlace
      cy.contains('Usa un código de respaldo').click();
      cy.contains('8 caracteres').should('be.visible');
      cy.get('input[placeholder="XXXXXXXX"]').should('exist');
    });

    it('debe volver a modo TOTP desde backup code', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Cambiar a backup code
      cy.contains('Usa un código de respaldo').click();
      cy.get('input[placeholder="XXXXXXXX"]').should('exist');

      // Volver a TOTP
      cy.contains('Usar código de aplicación').click();
      cy.get('input[inputmode="numeric"]').should('have.length', 6);
    });

    it('debe mostrar error con código 2FA inválido', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.intercept('POST', '**/api/auth/login/2fa', {
        statusCode: 401,
        body: this.twoFactorData.login2FAError
      }).as('verify2FA');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Ingresar código incorrecto
      '999999'.split('').forEach((digit, index) => {
        cy.get('input[inputmode="numeric"]').eq(index).type(digit);
      });

      cy.wait('@verify2FA');

      // Verificar mensaje de error
      cy.contains('inválido', { timeout: 10000 }).should('be.visible');
    });

    it('debe completar login con código 2FA válido', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.intercept('POST', '**/api/auth/login/2fa', {
        statusCode: 200,
        body: this.twoFactorData.login2FASuccess
      }).as('verify2FA');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Ingresar código válido
      '123456'.split('').forEach((digit, index) => {
        cy.get('input[inputmode="numeric"]').eq(index).type(digit);
      });

      cy.wait('@verify2FA');

      // Verificar redirección al dashboard
      cy.url().should('include', '/dashboard');
    });

    it('debe validar formato de backup code', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Cambiar a backup code
      cy.contains('Usa un código de respaldo').click();

      // Ingresar código inválido (muy corto)
      cy.get('input[placeholder="XXXXXXXX"]').type('ABC');
      cy.contains('Verificar Código de Respaldo').should('be.disabled');

      // Ingresar código válido (8 caracteres)
      cy.get('input[placeholder="XXXXXXXX"]').clear().type('A1B2C3D4');
      cy.contains('Verificar Código de Respaldo').should('not.be.disabled');
    });

    it('debe usar backup code para login', function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.intercept('POST', '**/api/auth/login/2fa', {
        statusCode: 200,
        body: this.twoFactorData.login2FASuccess
      }).as('verify2FA');

      cy.visit('/login');

      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // Cambiar a backup code
      cy.contains('Usa un código de respaldo').click();
      cy.get('input[placeholder="XXXXXXXX"]').type('A1B2C3D4');
      cy.contains('Verificar Código de Respaldo').click();

      cy.wait('@verify2FA');

      // Verificar redirección
      cy.url().should('include', '/dashboard');
    });
  });

  describe('Modal 2FA - UI', () => {
    beforeEach(function() {
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: this.twoFactorData.loginRequires2FA
      }).as('loginRequest');

      cy.visit('/login');
      cy.get('input[name="email"]').type('test2fa@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();
      cy.wait('@loginRequest');
    });

    it('debe mostrar icono de escudo', () => {
      // El modal debe tener un icono de escudo (Shield de lucide-react)
      cy.get('svg').should('exist');
      // Verificar que el header del modal existe
      cy.contains('Verificación en Dos Pasos').should('be.visible');
    });

    it('debe mostrar instrucciones claras', () => {
      cy.contains('Abre tu aplicación de autenticación').should('be.visible');
    });

    it('debe tener botón de cancelar visible', () => {
      cy.contains('Cancelar').should('be.visible').and('not.be.disabled');
    });

    it('debe auto-focus en el primer input', () => {
      cy.get('input[inputmode="numeric"]').first().should('have.focus');
    });

    it('debe avanzar automáticamente al siguiente input', () => {
      cy.get('input[inputmode="numeric"]').first().type('1');
      cy.get('input[inputmode="numeric"]').eq(1).should('have.focus');
    });

    it('debe permitir escribir código dígito por dígito', () => {
      // Verificar que los inputs aceptan dígitos
      cy.get('input[inputmode="numeric"]').first().type('1');
      cy.get('input[inputmode="numeric"]').first().should('have.value', '1');

      // Verificar auto-advance al segundo input
      cy.get('input[inputmode="numeric"]').eq(1).should('have.focus');
      cy.get('input[inputmode="numeric"]').eq(1).type('2');
      cy.get('input[inputmode="numeric"]').eq(1).should('have.value', '2');
    });
  });

  describe('Login sin 2FA (Mocked)', () => {
    it('debe hacer login directo sin modal 2FA', function() {
      // Login normal sin requires2FA
      cy.intercept('POST', '**/api/auth/login', {
        statusCode: 200,
        body: {
          success: true,
          data: this.twoFactorData.login2FASuccess.data
        }
      }).as('loginRequest');

      cy.visit('/login');

      cy.get('input[name="email"]').type('normal@citamed.ve');
      cy.get('input[name="password"]').type('Test1234!');
      cy.get('button[type="submit"]').click();

      cy.wait('@loginRequest');

      // No debe aparecer modal 2FA
      cy.contains('Verificación en Dos Pasos').should('not.exist');

      // Debe ir directo al dashboard
      cy.url().should('include', '/dashboard');
    });
  });
});

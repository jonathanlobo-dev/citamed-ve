/**
 * E2E Tests - Registro Multi-Paso
 * CITAMED.VE - M01.3
 *
 * Tests para los wizards de registro:
 * - Paciente (4 pasos)
 * - Médico (6 pasos)
 * - Proveedor (5 pasos)
 */

describe('Registro Multi-Paso - Flujo Completo E2E', () => {
  const timestamp = Date.now();

  beforeEach(() => {
    cy.visit('/registro');
  });

  describe('Selección de Rol', () => {
    it('debe mostrar las 3 opciones de registro', () => {
      cy.contains('Paciente', { timeout: 10000 }).should('be.visible');
      cy.contains('Médico').should('be.visible');
      cy.contains('Proveedor').should('be.visible');
    });

    it('debe navegar al wizard de paciente al seleccionar Paciente', () => {
      cy.contains('Paciente').click();
      cy.contains('Registro de Paciente', { timeout: 5000 }).should('be.visible');
      // Verificar step indicator activo (círculo con ring visible en desktop)
      cy.get('.ring-4').should('exist');
    });

    it('debe navegar al wizard de médico al seleccionar Médico', () => {
      cy.contains('Médico').click();
      cy.contains('Registro de Médico', { timeout: 5000 }).should('be.visible');
      // Verificar step indicator activo
      cy.get('.ring-4').should('exist');
    });

    it('debe navegar al wizard de proveedor al seleccionar Proveedor', () => {
      cy.contains('Proveedor').click();
      cy.contains('Registro de Proveedor', { timeout: 5000 }).should('be.visible');
      // Verificar step indicator activo
      cy.get('.ring-4').should('exist');
    });
  });

  describe('Wizard Paciente - 4 Pasos', () => {
    const patientData = {
      email: `paciente_e2e_${timestamp}@test.com`,
      password: 'TestPass123!',
      firstName: 'Juan',
      lastName: 'Pérez',
      cedula: 'V-12345678',
      phone: '04121234567',
      bloodType: 'O+',
      emergencyName: 'María Pérez',
      emergencyPhone: '04241234567'
    };

    beforeEach(() => {
      cy.contains('Paciente').click();
    });

    it('Paso 1: debe validar campos de credenciales', () => {
      // Intentar continuar sin llenar
      cy.contains('Continuar').click();
      cy.contains('Email es requerido').should('be.visible');

      // Llenar email inválido
      cy.get('input[type="email"]').type('email-invalido');
      cy.contains('Continuar').click();
      cy.contains('Email no es válido').should('be.visible');
    });

    it('Paso 1: debe mostrar indicador de fortaleza de contraseña', () => {
      cy.get('input[type="email"]').type(patientData.email);
      cy.get('input[type="password"]').first().type('abc');
      cy.contains('Débil').should('be.visible');

      cy.get('input[type="password"]').first().clear().type('Abc12345');
      cy.contains('Media').should('be.visible');

      cy.get('input[type="password"]').first().clear().type('Abc123456!@#');
      cy.contains('Fuerte').should('be.visible');
    });

    it('Paso 1: debe validar que las contraseñas coincidan', () => {
      cy.get('input[type="email"]').type(patientData.email);
      cy.get('input[type="password"]').first().type(patientData.password);
      cy.get('input[type="password"]').last().type('DiferentePass123!');
      cy.get('input[type="checkbox"]').check();
      cy.contains('Continuar').click();
      cy.contains('Las contraseñas no coinciden').should('be.visible');
    });

    it('debe completar el flujo de registro de paciente hasta confirmación', () => {
      // Paso 1: Credenciales
      cy.get('input[type="email"]').type(patientData.email);
      cy.get('input[type="password"]').first().type(patientData.password);
      cy.get('input[type="password"]').last().type(patientData.password);
      cy.get('input[type="checkbox"]').check();
      cy.contains('Continuar').click();

      // Paso 2: Datos personales
      cy.contains('Datos personales', { timeout: 5000 }).should('be.visible');
      cy.get('input[placeholder="Juan"]').type(patientData.firstName);
      cy.get('input[placeholder="Pérez"]').type(patientData.lastName);
      cy.get('input[placeholder="V-12345678"]').type(patientData.cedula);
      cy.get('input[type="date"]').type('1990-01-15');
      cy.contains('Masculino').click();
      cy.get('input[placeholder="04121234567"]').type(patientData.phone);
      cy.contains('Continuar').click();

      // Paso 3: Información médica
      cy.contains('Información médica', { timeout: 5000 }).should('be.visible');
      cy.contains('O+').click();
      cy.get('input[placeholder="María Pérez"]').type(patientData.emergencyName);
      cy.get('input[placeholder="04241234567"]').type(patientData.emergencyPhone);
      cy.contains('Continuar').click();

      // Paso 4: Confirmación
      cy.contains('Confirma tus datos', { timeout: 5000 }).should('be.visible');
      cy.contains(patientData.email).should('be.visible');
      cy.contains(patientData.firstName).should('be.visible');

      // Confirmar y enviar
      cy.get('input[type="checkbox"]').check();
      cy.contains('Completar registro').should('be.visible');

    });
  });

  describe('Wizard Médico - Validaciones', () => {
    beforeEach(() => {
      cy.contains('Médico').click();
    });

    it('debe mostrar nota sobre revisión de cuenta', () => {
      cy.contains('revisión').should('be.visible');
      cy.contains('MPPS').should('be.visible');
    });

    it('Paso 1: debe requerir aceptar términos y código de ética', () => {
      const email = `doctor_e2e_${timestamp}@test.com`;
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').first().type('DoctorPass123!');
      cy.get('input[type="password"]').last().type('DoctorPass123!');
      cy.contains('Continuar').click();
      cy.contains('Debe aceptar los términos').should('be.visible');
    });

    it('debe navegar entre pasos con botones Anterior/Continuar', () => {
      const email = `doctor_nav_${timestamp}@test.com`;

      // Paso 1
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').first().type('DoctorPass123!');
      cy.get('input[type="password"]').last().type('DoctorPass123!');
      cy.get('input[type="checkbox"]').check();
      cy.contains('Continuar').click();

      // Paso 2 - verificar que estamos aquí
      cy.contains('Datos personales', { timeout: 5000 }).should('be.visible');

      // Volver al paso 1
      cy.contains('Anterior').click();
      cy.contains('Crea tu cuenta de médico', { timeout: 5000 }).should('be.visible');

      // El email debe seguir ahí (persistencia)
      cy.get('input[type="email"]').should('have.value', email);
    });
  });

  describe('Wizard Proveedor - Validaciones', () => {
    beforeEach(() => {
      cy.contains('Proveedor').click();
    });

    it('debe mostrar nota sobre revisión de empresa', () => {
      cy.contains('revisión').should('be.visible');
      cy.contains('documentación').should('be.visible');
    });

    it('Paso 2: debe validar formato de RIF', () => {
      const email = `provider_e2e_${timestamp}@test.com`;

      // Completar paso 1
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').first().type('ProviderPass123!');
      cy.get('input[type="password"]').last().type('ProviderPass123!');
      cy.get('input[type="checkbox"]').check();
      cy.contains('Continuar').click();

      // Paso 2: Datos de empresa
      cy.contains('Datos de la empresa', { timeout: 5000 }).should('be.visible');
      cy.get('input[placeholder="Farmacia San José"]').type('Mi Empresa Test');
      cy.get('input[placeholder="J-12345678-9"]').type('INVALIDO');
      cy.contains('Continuar').click();
      cy.contains('Formato').should('be.visible');
    });

    it('Paso 3: debe mostrar tipos de proveedor', () => {
      const email = `provider_types_${timestamp}@test.com`;

      // Completar paso 1
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').first().type('ProviderPass123!');
      cy.get('input[type="password"]').last().type('ProviderPass123!');
      cy.get('input[type="checkbox"]').check();
      cy.contains('Continuar').click();

      // Paso 2: Datos de empresa (llenar mínimo)
      cy.get('input[placeholder="Farmacia San José"]').type('Mi Empresa');
      cy.get('input[placeholder="J-12345678-9"]').type('J-12345678-9');
      cy.get('input[placeholder*="Inversiones"]').type('Mi Empresa C.A.');
      cy.get('input[placeholder="Juan Carlos Pérez"]').type('Representante Test');
      cy.get('input[placeholder="02121234567"]').type('02121234567');
      cy.get('input[placeholder="contacto@empresa.com"]').type('contacto@test.com');
      cy.contains('Continuar').click();

      // Paso 3: Verificar tipos de proveedor
      cy.contains('Categoría y servicios', { timeout: 5000 }).should('be.visible');
      cy.contains('Farmacia').should('be.visible');
      cy.contains('Laboratorio').should('be.visible');
      cy.contains('Clínica').should('be.visible');
      cy.contains('Hospital').should('be.visible');
    });
  });

  describe('Persistencia de datos (localStorage)', () => {
    it('debe guardar progreso del wizard en localStorage', () => {
      const email = `persist_${timestamp}@test.com`;

      cy.contains('Paciente').click();
      cy.get('input[type="email"]').type(email);
      cy.get('input[type="password"]').first().type('TestPass123!');

      // Verificar que se guardó en localStorage
      cy.window().then((win) => {
        const saved = win.localStorage.getItem('citamed_wizard_patient');
        expect(saved).to.exist;
        const data = JSON.parse(saved);
        expect(data.data.email).to.equal(email);
      });
    });
  });

  describe('Verificación de Email Disponible', () => {
    it('debe verificar disponibilidad de email en tiempo real', () => {
      cy.contains('Paciente').click();

      // Email que probablemente existe (de tests anteriores)
      cy.get('input[type="email"]').type('admin@citamed.ve');

      // Esperar verificación (debounce de 500ms)
      cy.wait(1000);

      // Si el email existe, debería mostrar X roja
      // Si no existe, debería mostrar check verde
      cy.get('input[type="email"]').parent().find('svg').should('exist');
    });
  });
});

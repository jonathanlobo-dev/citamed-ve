describe('Registro de Usuario - Flujo Completo E2E', () => {
  const timestamp = Date.now();

  beforeEach(() => {
    cy.visit('/registro');
  });

  it('debe registrar un paciente exitosamente y redirigir a dashboard', () => {
    const userData = {
      name: 'Paciente Test E2E',
      email: `paciente_e2e_${timestamp}@test.com`,
      password: 'TestPass123!',
      phone: '+584121234567'
    };

    // Paso 1: Seleccionar rol de Paciente
    cy.contains('Paciente', { timeout: 10000 }).click();

    // Paso 2: Llenar formulario
    cy.get('input[name="name"]', { timeout: 10000 }).type(userData.name);
    cy.get('input[name="email"]').type(userData.email);
    cy.get('input[name="phone"]').type(userData.phone);
    cy.get('input[name="password"]').type(userData.password);
    cy.get('input[name="confirmPassword"]').type(userData.password);

    cy.get('button[type="submit"]').click();

    // Verificar redirección al dashboard
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Verificar token JWT guardado
    cy.window().then((win) => {
      const token = win.localStorage.getItem('citamed_token');
      expect(token).to.exist;
      expect(token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });
  });

  it('debe registrar un médico con especialidad exitosamente', () => {
    const userData = {
      name: 'Dr. Test E2E',
      email: `doctor_e2e_${timestamp + 1}@test.com`,
      password: 'DoctorPass123!',
      phone: '+584121234568',
      licenseNumber: `MPPS-E2E-${timestamp}`
    };

    // Paso 1: Seleccionar rol de Médico
    cy.contains('Médico', { timeout: 10000 }).click();

    // Paso 2: Llenar formulario
    cy.get('input[name="name"]', { timeout: 10000 }).type(userData.name);
    cy.get('input[name="email"]').type(userData.email);
    cy.get('input[name="phone"]').type(userData.phone);
    cy.get('input[name="licenseNumber"]').type(userData.licenseNumber);
    cy.get('select[name="specialty"]').select(1); // Primera especialidad disponible
    cy.get('input[name="password"]').type(userData.password);
    cy.get('input[name="confirmPassword"]').type(userData.password);

    cy.get('button[type="submit"]').click();

    // Verificar redirección al dashboard de médico
    cy.url({ timeout: 15000 }).should('include', '/dashboard');
  });

  it('debe mostrar error con email duplicado', () => {
    const email = `duplicado_e2e_${timestamp + 2}@test.com`;
    const password = 'TestPass123!';

    // Primer registro
    cy.contains('Paciente').click();
    cy.get('input[name="name"]', { timeout: 10000 }).type('Usuario 1');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.get('button[type="submit"]').click();

    // Esperar a que se complete el registro
    cy.url({ timeout: 15000 }).should('include', '/dashboard');

    // Intentar registrar otro usuario con el mismo email
    cy.visit('/registro');
    cy.contains('Paciente').click();
    cy.get('input[name="name"]', { timeout: 10000 }).type('Usuario 2');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type(password);
    cy.get('input[name="confirmPassword"]').type(password);
    cy.get('button[type="submit"]').click();

    // Verificar mensaje de error
    cy.contains(/email.*existe|email.*uso|ya.*registrado/i, { timeout: 10000 })
      .should('be.visible');
  });

  it('debe validar campos requeridos al enviar formulario vacío', () => {
    // Seleccionar rol primero para ver el formulario
    cy.contains('Paciente').click();

    // Intentar enviar sin llenar campos
    cy.get('button[type="submit"]', { timeout: 10000 }).click();

    // Verificar que aparecen errores de validación
    cy.contains(/nombre.*caracteres|nombre.*obligatorio/i, { timeout: 5000 })
      .should('be.visible');
  });

  it('debe validar formato de email', () => {
    cy.contains('Paciente').click();

    cy.get('input[name="name"]', { timeout: 10000 }).type('Test User');
    cy.get('input[name="email"]').type('email-sin-arroba');
    cy.get('input[name="password"]').type('TestPass123!');
    cy.get('input[name="confirmPassword"]').type('TestPass123!');

    // Hacer blur para activar validación
    cy.get('input[name="email"]').blur();

    cy.contains(/correo.*válido|email.*válido|ingresa.*correo/i, { timeout: 5000 })
      .should('be.visible');
  });

  it('debe validar que las contraseñas coincidan', () => {
    cy.contains('Paciente').click();

    cy.get('input[name="name"]', { timeout: 10000 }).type('Test User');
    cy.get('input[name="email"]').type('test@test.com');
    cy.get('input[name="password"]').type('Password123!');
    cy.get('input[name="confirmPassword"]').type('DiferentePass!');
    cy.get('input[name="confirmPassword"]').blur();

    cy.contains(/contraseñas no coinciden/i, { timeout: 5000 })
      .should('be.visible');
  });
});

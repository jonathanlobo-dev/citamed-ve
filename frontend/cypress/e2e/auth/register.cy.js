describe('Registro de Usuario - Flujo Completo E2E', () => {
  const timestamp = Date.now();

  beforeEach(() => {
    cy.visit('/register');
  });

  it('debe registrar un paciente exitosamente y redirigir a dashboard', () => {
    const userData = {
      name: 'Paciente Test E2E',
      email: `paciente_e2e_${timestamp}@test.com`,
      password: 'TestPass123!',
      phone: '+584121234567',
      role: 'patient'
    };

    cy.get('input[name="name"]', { timeout: 10000 }).type(userData.name);
    cy.get('input[name="email"]').type(userData.email);
    cy.get('input[name="password"]').type(userData.password);
    cy.get('input[name="phone"]').type(userData.phone);
    cy.get('select[name="role"]').select('patient');

    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard');

    cy.window().then((win) => {
      const token = win.localStorage.getItem('token');
      expect(token).to.exist;
      expect(token).to.match(/^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/);
    });

    cy.contains(userData.name, { timeout: 10000 }).should('be.visible');
  });

  it('debe registrar un médico con especialidad exitosamente', () => {
    const userData = {
      name: 'Dr. Test E2E',
      email: `doctor_e2e_${timestamp + 1}@test.com`,
      password: 'DoctorPass123!',
      phone: '+584121234568',
      role: 'doctor',
      licenseNumber: `LIC-E2E-${timestamp}`,
      specialtyId: '1'
    };

    cy.get('input[name="name"]').type(userData.name);
    cy.get('input[name="email"]').type(userData.email);
    cy.get('input[name="password"]').type(userData.password);
    cy.get('input[name="phone"]').type(userData.phone);
    cy.get('select[name="role"]').select('doctor');
    cy.get('input[name="licenseNumber"]').type(userData.licenseNumber);
    cy.get('select[name="specialtyId"]').select(userData.specialtyId);

    cy.get('button[type="submit"]').click();

    cy.url({ timeout: 10000 }).should('include', '/dashboard');
    cy.contains(userData.name).should('be.visible');
  });

  it('debe mostrar error con email duplicado', () => {
    const email = `duplicado_e2e_${timestamp}@test.com`;

    cy.register({
      name: 'Usuario 1',
      email: email,
      password: 'TestPass123!',
      role: 'patient'
    });

    cy.visit('/register');
    cy.get('input[name="name"]').type('Usuario 2');
    cy.get('input[name="email"]').type(email);
    cy.get('input[name="password"]').type('TestPass123!');
    cy.get('select[name="role"]').select('patient');
    cy.get('button[type="submit"]').click();

    cy.contains(/email.*existe|email.*uso|ya.*registrado/i, { timeout: 10000 })
      .should('be.visible');
  });

  it('debe validar campos requeridos', () => {
    cy.get('button[type="submit"]').click();

    cy.get('.error, .invalid, [role="alert"]', { timeout: 5000 })
      .should('have.length.greaterThan', 0);
  });

  it('debe validar formato de email', () => {
    cy.get('input[name="name"]').type('Test User');
    cy.get('input[name="email"]').type('email-sin-arroba');
    cy.get('input[name="password"]').type('TestPass123!');
    cy.get('select[name="role"]').select('patient');
    cy.get('button[type="submit"]').click();

    cy.contains(/email.*válido|email.*inválido|formato.*incorrecto/i, { timeout: 5000 })
      .should('be.visible');
  });
});

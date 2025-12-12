describe('Smoke Test', () => {
  it('debe cargar la aplicación', () => {
    cy.visit('/');
    cy.contains('CITAMED', { timeout: 10000 }).should('be.visible');
  });

  it('debe tener navegación funcionando', () => {
    cy.visit('/');
    cy.get('nav').should('exist');
  });

  it('debe poder acceder a la página de login', () => {
    cy.visit('/login');
    cy.url().should('include', '/login');
  });
});

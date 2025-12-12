// ***********************************************
// Custom commands for CITAMED.VE E2E testing
// ***********************************************

Cypress.Commands.add('register', (userData) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/register`,
    body: userData,
    failOnStatusCode: false
  });
});

Cypress.Commands.add('login', (email, password) => {
  return cy.request({
    method: 'POST',
    url: `${Cypress.env('apiUrl')}/auth/login`,
    body: { email, password }
  }).then((response) => {
    if (response.body.data && response.body.data.token) {
      window.localStorage.setItem('token', response.body.data.token);
    }
    return response;
  });
});

Cypress.Commands.add('logout', () => {
  window.localStorage.removeItem('token');
  window.localStorage.removeItem('user');
});

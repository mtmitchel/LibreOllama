describe('Authentication and Session Management', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('User successfully logs in with Google', () => {
    // Check we're on login page
    cy.contains('Sign in').should('be.visible');
    
    // Click Google login button
    cy.get('[data-testid="google-login-button"]').click();
    
    // Mock successful OAuth flow
    cy.window().then((win) => {
      // Simulate successful Google OAuth callback
      win.postMessage({
        type: 'oauth-success',
        account: {
          id: 'test-user-id',
          email: 'test@example.com',
          name: 'Test User'
        }
      }, '*');
    });
    
    // Should redirect to main task board
    cy.url().should('include', '/tasks');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
    cy.get('[data-testid="user-name"]').should('contain', 'Test User');
  });

  it('User session is persisted on page refresh', () => {
    // Login first
    cy.login();
    
    // Verify we're on task board
    cy.url().should('include', '/tasks');
    
    // Refresh page
    cy.reload();
    
    // Should still be on task board and logged in
    cy.url().should('include', '/tasks');
    cy.get('[data-testid="user-avatar"]').should('be.visible');
  });

  it('User logs out successfully', () => {
    // Login first
    cy.login();
    
    // Click avatar to open menu
    cy.get('[data-testid="user-avatar"]').click();
    
    // Click logout
    cy.get('[data-testid="logout-button"]').click();
    
    // Should redirect to login page
    cy.url().should('eq', Cypress.config().baseUrl + '/');
    cy.contains('Sign in').should('be.visible');
    
    // Check localStorage is cleared
    cy.window().then((win) => {
      expect(win.localStorage.getItem('google-auth')).to.be.null;
      expect(win.localStorage.getItem('kanban-store')).to.be.null;
    });
  });
});
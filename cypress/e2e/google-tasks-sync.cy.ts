describe('Google Tasks Synchronization', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/tasks');
  });

  it('Task created externally in Google Tasks appears in the app', () => {
    // Mock creating a task in Google Tasks API
    cy.intercept('GET', '**/tasks/v1/lists/*/tasks', (req) => {
      req.reply({
        items: [
          {
            id: 'google-external-task-1',
            title: 'External Google Task',
            status: 'needsAction',
            updated: new Date().toISOString()
          }
        ]
      });
    }).as('googleTasksFetch');

    // Trigger sync
    cy.get('[data-testid="sync-button"]').click();
    
    // Wait for sync to complete
    cy.wait('@googleTasksFetch');
    cy.wait(1000); // Wait for UI update

    // Verify the external task appears
    cy.contains('[data-testid="task-card"]', 'External Google Task').should('exist');
  });

  it('Task deleted locally is removed from Google Tasks', () => {
    // Create a task that's synced
    cy.createTask({
      title: 'Sync Delete Test',
      columnId: 'todo',
      googleTaskId: 'google-task-to-delete'
    });

    // Mock the delete API call
    cy.intercept('DELETE', '**/tasks/v1/lists/*/tasks/google-task-to-delete', {
      statusCode: 204
    }).as('googleTaskDelete');

    // Delete the task
    cy.contains('[data-testid="task-card"]', 'Sync Delete Test').rightclick();
    cy.get('[data-testid="context-menu"]').contains('Delete Task').click();

    // Verify Google API was called
    cy.wait('@googleTaskDelete');

    // Task should be gone from UI
    cy.contains('[data-testid="task-card"]', 'Sync Delete Test').should('not.exist');
  });

  it('Handles sync failures gracefully', () => {
    // Mock a sync failure
    cy.intercept('GET', '**/tasks/v1/lists/*/tasks', {
      statusCode: 500,
      body: { error: 'Internal Server Error' }
    }).as('googleTasksError');

    // Trigger sync
    cy.get('[data-testid="sync-button"]').click();
    
    // Wait for error
    cy.wait('@googleTasksError');

    // Should show error message
    cy.contains('Sync failed').should('be.visible');
    
    // App should still be functional
    cy.get('[data-testid="add-task-button"]').should('be.enabled');
  });
});
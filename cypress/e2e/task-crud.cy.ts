describe('Core Task Operations (CRUD)', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/tasks');
  });

  it('User creates a new task with full metadata', () => {
    // Find the To Do column
    cy.contains('[data-testid="kanban-column"]', 'To Do').within(() => {
      cy.get('[data-testid="add-task-button"]').click();
    });

    // Fill in task details
    cy.get('[data-testid="task-title-input"]').type('E2E Test: Full Task');
    
    // Add labels
    cy.get('[data-testid="label-input"]').type('testing');
    cy.get('[data-testid="add-label-button"]').click();
    cy.get('[data-testid="label-input"]').type('critical');
    cy.get('[data-testid="add-label-button"]').click();
    
    // Set priority
    cy.get('[data-testid="priority-select"]').select('high');
    
    // Set due date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    cy.get('[data-testid="due-date-input"]').type(tomorrow.toISOString().split('T')[0]);
    
    // Save the task
    cy.get('[data-testid="save-task-button"]').click();
    
    // Verify task appears with all metadata
    cy.contains('[data-testid="task-card"]', 'E2E Test: Full Task').within(() => {
      cy.get('[data-testid="priority-indicator-high"]').should('be.visible');
      cy.get('[data-testid="task-label"]').should('contain', 'testing');
      cy.get('[data-testid="task-label"]').should('contain', 'critical');
      cy.get('[data-testid="due-date"]').should('contain', tomorrow.toLocaleDateString());
    });
  });

  it('User updates a task\'s priority and labels without data loss', () => {
    // Create a task with initial metadata
    cy.createTask({
      title: 'Update Test Task',
      labels: ['backend'],
      priority: 'normal',
      columnId: 'todo'
    });

    // Right-click to update priority
    cy.contains('[data-testid="task-card"]', 'Update Test Task').rightclick();
    cy.get('[data-testid="context-menu"]').within(() => {
      cy.contains('Priority').trigger('mouseover');
      cy.contains('High').click();
    });

    // Verify priority updated but label remains
    cy.contains('[data-testid="task-card"]', 'Update Test Task').within(() => {
      cy.get('[data-testid="priority-indicator-high"]').should('be.visible');
      cy.get('[data-testid="task-label"]').should('contain', 'backend');
    });

    // Open task details and add another label
    cy.contains('[data-testid="task-card"]', 'Update Test Task').dblclick();
    cy.get('[data-testid="label-input"]').type('frontend');
    cy.get('[data-testid="add-label-button"]').click();
    cy.get('[data-testid="save-task-button"]').click();

    // Verify both labels exist and priority is still high
    cy.contains('[data-testid="task-card"]', 'Update Test Task').within(() => {
      cy.get('[data-testid="priority-indicator-high"]').should('be.visible');
      cy.get('[data-testid="task-label"]').should('contain', 'backend');
      cy.get('[data-testid="task-label"]').should('contain', 'frontend');
    });
  });

  it('User deletes a task and it does not reappear', () => {
    // Create a task to delete
    cy.createTask({
      title: 'Task to be deleted',
      columnId: 'todo'
    });

    // Right-click and delete
    cy.contains('[data-testid="task-card"]', 'Task to be deleted').rightclick();
    cy.get('[data-testid="context-menu"]').contains('Delete Task').click();
    
    // Confirm deletion if dialog appears
    cy.get('body').then($body => {
      if ($body.find('[data-testid="confirm-delete"]').length > 0) {
        cy.get('[data-testid="confirm-delete"]').click();
      }
    });

    // Task should be gone
    cy.contains('[data-testid="task-card"]', 'Task to be deleted').should('not.exist');

    // Refresh page
    cy.reload();

    // Task should still be gone
    cy.contains('[data-testid="task-card"]', 'Task to be deleted').should('not.exist');
  });
});
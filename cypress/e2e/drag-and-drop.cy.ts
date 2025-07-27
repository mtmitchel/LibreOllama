describe('Drag and Drop Functionality', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/tasks');
  });

  it('User moves a task to a different column', () => {
    // Create a task in To Do column
    cy.createTask({
      title: 'Move Me',
      columnId: 'todo'
    });

    // Get the task card
    cy.contains('[data-testid="task-card"]', 'Move Me').as('taskCard');
    
    // Get the target column
    cy.contains('[data-testid="kanban-column"]', 'In Progress').as('targetColumn');

    // Drag and drop
    cy.get('@taskCard').drag('@targetColumn');

    // Verify task is now in In Progress column
    cy.contains('[data-testid="kanban-column"]', 'In Progress').within(() => {
      cy.contains('[data-testid="task-card"]', 'Move Me').should('exist');
    });

    // Verify task is not in To Do column anymore
    cy.contains('[data-testid="kanban-column"]', 'To Do').within(() => {
      cy.contains('[data-testid="task-card"]', 'Move Me').should('not.exist');
    });

    // Refresh and verify persistence
    cy.reload();
    
    cy.contains('[data-testid="kanban-column"]', 'In Progress').within(() => {
      cy.contains('[data-testid="task-card"]', 'Move Me').should('exist');
    });
  });

  it('User reorders tasks within the same column', () => {
    // Create two tasks in To Do column
    cy.createTask({ title: 'Task A', columnId: 'todo' });
    cy.createTask({ title: 'Task B', columnId: 'todo' });

    // Wait for tasks to render
    cy.wait(500);

    // Get the column and verify initial order
    cy.contains('[data-testid="kanban-column"]', 'To Do').within(() => {
      cy.get('[data-testid="task-card"]').eq(0).should('contain', 'Task A');
      cy.get('[data-testid="task-card"]').eq(1).should('contain', 'Task B');
    });

    // Drag Task B above Task A
    cy.contains('[data-testid="task-card"]', 'Task B').as('taskB');
    cy.contains('[data-testid="task-card"]', 'Task A').as('taskA');
    
    cy.get('@taskB').drag('@taskA', { position: 'top' });

    // Verify new order
    cy.contains('[data-testid="kanban-column"]', 'To Do').within(() => {
      cy.get('[data-testid="task-card"]').eq(0).should('contain', 'Task B');
      cy.get('[data-testid="task-card"]').eq(1).should('contain', 'Task A');
    });

    // Refresh and verify persistence
    cy.reload();
    
    cy.contains('[data-testid="kanban-column"]', 'To Do').within(() => {
      cy.get('[data-testid="task-card"]').eq(0).should('contain', 'Task B');
      cy.get('[data-testid="task-card"]').eq(1).should('contain', 'Task A');
    });
  });
});
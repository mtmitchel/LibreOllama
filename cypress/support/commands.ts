/// <reference types="cypress" />

declare global {
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>
      createTask(options: {
        title: string
        columnId: string
        labels?: string[]
        priority?: 'low' | 'normal' | 'high'
        googleTaskId?: string
      }): Chainable<void>
      drag(targetSelector: string, options?: { position?: 'top' | 'bottom' | 'center' }): Chainable<void>
    }
  }
}

// Custom command to handle login
Cypress.Commands.add('login', () => {
  // Set auth data in localStorage
  cy.window().then((win) => {
    win.localStorage.setItem('google-auth', JSON.stringify({
      account: {
        id: 'test-user-id',
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/avatar.jpg'
      },
      isAuthenticated: true
    }));
  });
});

// Custom command to create a task programmatically
Cypress.Commands.add('createTask', (options) => {
  cy.window().then((win) => {
    const store = win.useKanbanStore?.getState();
    if (store) {
      const task = {
        id: `test-task-${Date.now()}`,
        title: options.title,
        notes: '',
        due: '',
        status: 'needsAction' as const,
        position: '',
        updated: new Date().toISOString(),
        metadata: {
          labels: options.labels || [],
          priority: options.priority || 'normal',
          subtasks: [],
          googleTaskId: options.googleTaskId
        }
      };
      store.createTask(options.columnId, task);
    }
  });
  cy.wait(100); // Wait for UI to update
});

// Custom drag and drop command
Cypress.Commands.add('drag', { prevSubject: 'element' }, (subject, targetSelector, options = {}) => {
  const position = options.position || 'center';
  
  cy.wrap(subject)
    .trigger('mousedown', { button: 0 })
    .wait(100);
  
  cy.get(targetSelector)
    .trigger('mousemove', position)
    .wait(100)
    .trigger('mouseup', { force: true });
});

export {};
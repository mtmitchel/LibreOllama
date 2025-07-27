import { describe, it, expect, beforeEach, vi } from 'vitest';
import { kanbanGoogleSync } from '../kanbanGoogleTasksSync';

// Create a simple test that doesn't require complex mocking
describe('kanbanGoogleTasksSync - Simple Tests', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should get Google list ID for a Kanban column', () => {
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'kanban-col-1', googleTaskListId: 'google-list-1' },
      { kanbanColumnId: 'kanban-col-2', googleTaskListId: 'google-list-2' }
    ]));
    
    // Create new instance to load mappings
    const sync = new (kanbanGoogleSync.constructor as any)();
    
    expect(sync.getGoogleListId('kanban-col-1')).toBe('google-list-1');
    expect(sync.getGoogleListId('kanban-col-2')).toBe('google-list-2');
    expect(sync.getGoogleListId('unknown-col')).toBeNull();
  });

  it('should get Kanban column ID for a Google list', () => {
    // Set up mappings
    localStorage.setItem('kanban-google-sync-mappings', JSON.stringify([
      { kanbanColumnId: 'kanban-col-1', googleTaskListId: 'google-list-1' },
      { kanbanColumnId: 'kanban-col-2', googleTaskListId: 'google-list-2' }
    ]));
    
    // Create new instance to load mappings
    const sync = new (kanbanGoogleSync.constructor as any)();
    
    expect(sync.getKanbanColumnId('google-list-1')).toBe('kanban-col-1');
    expect(sync.getKanbanColumnId('google-list-2')).toBe('kanban-col-2');
    expect(sync.getKanbanColumnId('unknown-list')).toBeNull();
  });

  it('should convert Kanban task to Google Task format', () => {
    const kanbanTask = {
      id: 'kanban-1',
      title: 'Test Task',
      notes: 'Test notes',
      due: '2025-12-01',
      status: 'needsAction' as const,
      position: '1000',
      updated: new Date().toISOString()
    };
    
    // Access private method through prototype
    const sync = new (kanbanGoogleSync.constructor as any)();
    const googleTask = sync.kanbanToGoogleTask(kanbanTask);
    
    expect(googleTask).toEqual({
      title: 'Test Task',
      notes: 'Test notes',
      due: '2025-12-01',
      status: 'needsAction',
      position: '1000'
    });
  });

  it('should convert Google Task to Kanban task format', () => {
    const googleTask = {
      id: 'google-1',
      title: 'Google Task',
      notes: 'Google notes',
      due: '2025-12-01',
      status: 'needsAction' as const,
      position: '2000',
      updated: new Date().toISOString()
    };
    
    // Access private method through prototype
    const sync = new (kanbanGoogleSync.constructor as any)();
    const kanbanTask = sync.googleToKanbanTask(googleTask);
    
    expect(kanbanTask).toEqual({
      title: 'Google Task',
      notes: 'Google notes',
      due: '2025-12-01',
      status: 'needsAction',
      position: '2000',
      updated: googleTask.updated
    });
  });
});
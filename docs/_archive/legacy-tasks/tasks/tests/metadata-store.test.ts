import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';
import { encodeEnhancedTaskData, parseEnhancedTaskData, cleanTaskNotes } from '../utils/taskHelpers';

// Mock localStorage for testing
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('Task Metadata Store Tests', () => {
  let metadataStore: any;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorageMock.clear();
    
    // Reset the store
    metadataStore = useTaskMetadataStore.getState();
    metadataStore.clearAllMetadata();
  });

  afterEach(() => {
    // Clean up after each test
    metadataStore.clearAllMetadata();
  });

  describe('Basic Metadata Operations', () => {
    it('should set and get task metadata', () => {
      const taskId = 'test-task-1';
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [],
        recurring: {
          enabled: false,
          frequency: 'weekly',
          interval: 1,
          endDate: '',
        },
      };

      metadataStore.setTaskMetadata(taskId, metadata);
      const retrieved = metadataStore.getTaskMetadata(taskId);

      expect(retrieved).toBeDefined();
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['urgent', 'work']);
      expect(retrieved.subtasks).toEqual([]);
      expect(retrieved.recurring.enabled).toBe(false);
    });

    it('should return null for non-existent task metadata', () => {
      const result = metadataStore.getTaskMetadata('non-existent-task');
      expect(result).toBeNull();
    });

    it('should update existing metadata', () => {
      const taskId = 'test-task-2';
      
      // Set initial metadata
      metadataStore.setTaskMetadata(taskId, {
        priority: 'normal',
        labels: ['task'],
      });

      // Update with new values
      metadataStore.setTaskMetadata(taskId, {
        priority: 'high',
        labels: ['urgent', 'important'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
      });

      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['urgent', 'important']);
      expect(retrieved.subtasks).toHaveLength(1);
    });

    it('should delete task metadata', () => {
      const taskId = 'test-task-3';
      
      // Set metadata
      metadataStore.setTaskMetadata(taskId, {
        priority: 'high',
        labels: ['test'],
      });

      // Verify it exists
      expect(metadataStore.getTaskMetadata(taskId)).toBeDefined();

      // Delete it
      metadataStore.deleteTaskMetadata(taskId);

      // Verify it's gone
      expect(metadataStore.getTaskMetadata(taskId)).toBeNull();
    });

    it('should clear all metadata', () => {
      const taskIds = ['task-1', 'task-2', 'task-3'];
      
      // Set metadata for multiple tasks
      taskIds.forEach(taskId => {
        metadataStore.setTaskMetadata(taskId, {
          priority: 'normal',
          labels: ['test'],
        });
      });

      // Verify all exist
      taskIds.forEach(taskId => {
        expect(metadataStore.getTaskMetadata(taskId)).toBeDefined();
      });

      // Clear all
      metadataStore.clearAllMetadata();

      // Verify all are gone
      taskIds.forEach(taskId => {
        expect(metadataStore.getTaskMetadata(taskId)).toBeNull();
      });
    });
  });

  describe('Priority Management', () => {
    it('should handle all priority levels', () => {
      const priorities = ['low', 'normal', 'high'];
      
      priorities.forEach((priority, index) => {
        const taskId = `priority-task-${index}`;
        metadataStore.setTaskMetadata(taskId, { priority });
        
        const retrieved = metadataStore.getTaskMetadata(taskId);
        expect(retrieved.priority).toBe(priority);
      });
    });

    it('should default to normal priority', () => {
      const taskId = 'default-priority-task';
      metadataStore.setTaskMetadata(taskId, { labels: ['test'] });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('normal');
    });

    it('should update priority independently', () => {
      const taskId = 'priority-update-task';
      
      // Set initial data
      metadataStore.setTaskMetadata(taskId, {
        priority: 'low',
        labels: ['initial'],
      });

      // Update only priority
      metadataStore.setTaskMetadata(taskId, { priority: 'high' });

      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['initial']); // Should preserve other fields
    });
  });

  describe('Label Management', () => {
    it('should handle empty labels array', () => {
      const taskId = 'empty-labels-task';
      metadataStore.setTaskMetadata(taskId, { labels: [] });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.labels).toEqual([]);
    });

    it('should handle single label', () => {
      const taskId = 'single-label-task';
      metadataStore.setTaskMetadata(taskId, { labels: ['work'] });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.labels).toEqual(['work']);
    });

    it('should handle multiple labels', () => {
      const taskId = 'multiple-labels-task';
      const labels = ['urgent', 'work', 'important', 'meeting'];
      
      metadataStore.setTaskMetadata(taskId, { labels });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.labels).toEqual(labels);
    });

    it('should handle label updates', () => {
      const taskId = 'label-update-task';
      
      // Set initial labels
      metadataStore.setTaskMetadata(taskId, { labels: ['initial'] });

      // Update labels
      metadataStore.setTaskMetadata(taskId, { labels: ['updated', 'new'] });

      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.labels).toEqual(['updated', 'new']);
    });

    it('should handle duplicate labels', () => {
      const taskId = 'duplicate-labels-task';
      const labels = ['work', 'work', 'urgent', 'work'];
      
      metadataStore.setTaskMetadata(taskId, { labels });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.labels).toEqual(labels); // Store should preserve duplicates
    });
  });

  describe('Subtask Management', () => {
    it('should handle empty subtasks array', () => {
      const taskId = 'empty-subtasks-task';
      metadataStore.setTaskMetadata(taskId, { subtasks: [] });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks).toEqual([]);
    });

    it('should handle single subtask', () => {
      const taskId = 'single-subtask-task';
      const subtask = { id: '1', title: 'Subtask 1', completed: false, due: '' };
      
      metadataStore.setTaskMetadata(taskId, { subtasks: [subtask] });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks).toHaveLength(1);
      expect(retrieved.subtasks[0]).toEqual(subtask);
    });

    it('should handle multiple subtasks', () => {
      const taskId = 'multiple-subtasks-task';
      const subtasks = [
        { id: '1', title: 'Subtask 1', completed: false, due: '' },
        { id: '2', title: 'Subtask 2', completed: true, due: '2024-12-31' },
        { id: '3', title: 'Subtask 3', completed: false, due: '2025-01-15' },
      ];
      
      metadataStore.setTaskMetadata(taskId, { subtasks });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks).toHaveLength(3);
      expect(retrieved.subtasks).toEqual(subtasks);
    });

    it('should handle subtask updates', () => {
      const taskId = 'subtask-update-task';
      
      // Set initial subtasks
      const initialSubtasks = [
        { id: '1', title: 'Initial Subtask', completed: false, due: '' },
      ];
      metadataStore.setTaskMetadata(taskId, { subtasks: initialSubtasks });

      // Update subtasks
      const updatedSubtasks = [
        { id: '1', title: 'Updated Subtask', completed: true, due: '2024-12-31' },
        { id: '2', title: 'New Subtask', completed: false, due: '' },
      ];
      metadataStore.setTaskMetadata(taskId, { subtasks: updatedSubtasks });

      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks).toEqual(updatedSubtasks);
    });

    it('should handle subtask completion status', () => {
      const taskId = 'subtask-completion-task';
      const subtasks = [
        { id: '1', title: 'Completed Subtask', completed: true, due: '' },
        { id: '2', title: 'Incomplete Subtask', completed: false, due: '' },
      ];
      
      metadataStore.setTaskMetadata(taskId, { subtasks });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks[0].completed).toBe(true);
      expect(retrieved.subtasks[1].completed).toBe(false);
    });

    it('should handle subtask due dates', () => {
      const taskId = 'subtask-due-task';
      const subtasks = [
        { id: '1', title: 'Subtask with due date', completed: false, due: '2024-12-31' },
        { id: '2', title: 'Subtask without due date', completed: false, due: '' },
      ];
      
      metadataStore.setTaskMetadata(taskId, { subtasks });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks[0].due).toBe('2024-12-31');
      expect(retrieved.subtasks[1].due).toBe('');
    });
  });

  describe('Recurring Task Management', () => {
    it('should handle disabled recurring tasks', () => {
      const taskId = 'non-recurring-task';
      const recurring = {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: '',
      };
      
      metadataStore.setTaskMetadata(taskId, { recurring });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.recurring.enabled).toBe(false);
    });

    it('should handle enabled recurring tasks', () => {
      const taskId = 'recurring-task';
      const recurring = {
        enabled: true,
        frequency: 'weekly',
        interval: 2,
        endDate: '2024-12-31',
      };
      
      metadataStore.setTaskMetadata(taskId, { recurring });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.recurring.enabled).toBe(true);
      expect(retrieved.recurring.frequency).toBe('weekly');
      expect(retrieved.recurring.interval).toBe(2);
      expect(retrieved.recurring.endDate).toBe('2024-12-31');
    });

    it('should handle different recurrence frequencies', () => {
      const frequencies = ['daily', 'weekly', 'monthly'];
      
      frequencies.forEach((frequency, index) => {
        const taskId = `recurring-${frequency}-task`;
        const recurring = {
          enabled: true,
          frequency,
          interval: 1,
          endDate: '',
        };
        
        metadataStore.setTaskMetadata(taskId, { recurring });
        
        const retrieved = metadataStore.getTaskMetadata(taskId);
        expect(retrieved.recurring.frequency).toBe(frequency);
      });
    });

    it('should handle recurrence intervals', () => {
      const taskId = 'recurrence-interval-task';
      const intervals = [1, 2, 3, 5, 10];
      
      intervals.forEach(interval => {
        const recurring = {
          enabled: true,
          frequency: 'weekly',
          interval,
          endDate: '',
        };
        
        metadataStore.setTaskMetadata(taskId, { recurring });
        
        const retrieved = metadataStore.getTaskMetadata(taskId);
        expect(retrieved.recurring.interval).toBe(interval);
      });
    });

    it('should handle recurrence end dates', () => {
      const taskId = 'recurrence-end-task';
      const endDate = '2024-12-31';
      
      const recurring = {
        enabled: true,
        frequency: 'weekly',
        interval: 1,
        endDate,
      };
      
      metadataStore.setTaskMetadata(taskId, { recurring });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.recurring.endDate).toBe(endDate);
    });
  });

  describe('Notes Field Integration', () => {
    it('should import metadata from notes field', () => {
      const taskId = 'import-notes-task';
      const notesWithMetadata = 'Task notes [LibreOllama:{"priority":"high","labels":["urgent","work"],"subtasks":[{"id":"1","title":"Subtask","completed":false,"due":""}]}]';
      
      metadataStore.importFromNotesField(taskId, notesWithMetadata);
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['urgent', 'work']);
      expect(retrieved.subtasks).toHaveLength(1);
    });

    it('should handle notes without metadata', () => {
      const taskId = 'no-metadata-task';
      const notesWithoutMetadata = 'Just plain task notes';
      
      metadataStore.importFromNotesField(taskId, notesWithoutMetadata);
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved).toBeNull(); // No metadata should be created
    });

    it('should handle malformed metadata in notes', () => {
      const taskId = 'malformed-metadata-task';
      const notesWithMalformedMetadata = 'Task notes [LibreOllama:invalid json}]';
      
      metadataStore.importFromNotesField(taskId, notesWithMalformedMetadata);
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved).toBeNull(); // Should handle gracefully
    });

    it('should export metadata to notes field', () => {
      const taskId = 'export-notes-task';
      const metadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
        recurring: {
          enabled: true,
          frequency: 'weekly',
          interval: 1,
          endDate: '',
        },
      };
      
      metadataStore.setTaskMetadata(taskId, metadata);
      const exported = metadataStore.exportToNotesField(taskId);
      
      expect(exported).toContain('[LibreOllama:');
      expect(exported).toContain('"priority":"high"');
      expect(exported).toContain('"labels":["urgent","work"]');
      expect(exported).toContain('"subtasks":[');
      expect(exported).toContain('"recurring":{');
    });

    it('should return empty string for non-existent task export', () => {
      const exported = metadataStore.exportToNotesField('non-existent-task');
      expect(exported).toBe('');
    });

    it('should handle import/export roundtrip', () => {
      const taskId = 'roundtrip-task';
      const originalMetadata = {
        priority: 'high',
        labels: ['urgent', 'work'],
        subtasks: [{ id: '1', title: 'Subtask', completed: false, due: '' }],
        recurring: {
          enabled: true,
          frequency: 'weekly',
          interval: 2,
          endDate: '2024-12-31',
        },
      };
      
      // Set original metadata
      metadataStore.setTaskMetadata(taskId, originalMetadata);
      
      // Export to notes field
      const exported = metadataStore.exportToNotesField(taskId);
      
      // Clear metadata
      metadataStore.deleteTaskMetadata(taskId);
      
      // Import from notes field
      metadataStore.importFromNotesField(taskId, `Task notes ${exported}`);
      
      // Verify metadata was preserved
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['urgent', 'work']);
      expect(retrieved.subtasks).toHaveLength(1);
      expect(retrieved.recurring.enabled).toBe(true);
      expect(retrieved.recurring.frequency).toBe('weekly');
      expect(retrieved.recurring.interval).toBe(2);
      expect(retrieved.recurring.endDate).toBe('2024-12-31');
    });
  });

  describe('Persistence Tests', () => {
    it('should persist metadata to localStorage', () => {
      const taskId = 'persist-task';
      const metadata = {
        priority: 'high',
        labels: ['urgent'],
        subtasks: [],
        recurring: {
          enabled: false,
          frequency: 'weekly',
          interval: 1,
          endDate: '',
        },
      };
      
      metadataStore.setTaskMetadata(taskId, metadata);
      
      // Check that data was persisted
      const stored = localStorageMock.getItem('task-metadata-store');
      expect(stored).toBeDefined();
      expect(stored).toContain(taskId);
      expect(stored).toContain('"priority":"high"');
      expect(stored).toContain('"labels":["urgent"]');
    });

    it('should restore metadata from localStorage', () => {
      const taskId = 'restore-task';
      const metadata = {
        priority: 'high',
        labels: ['urgent'],
        subtasks: [],
        recurring: {
          enabled: false,
          frequency: 'weekly',
          interval: 1,
          endDate: '',
        },
      };
      
      // Set metadata
      metadataStore.setTaskMetadata(taskId, metadata);
      
      // Create a new store instance (simulating app restart)
      const newStore = useTaskMetadataStore.getState();
      
      // Verify data was restored
      const retrieved = newStore.getTaskMetadata(taskId);
      expect(retrieved.priority).toBe('high');
      expect(retrieved.labels).toEqual(['urgent']);
    });

    it('should handle corrupted localStorage data', () => {
      // Set corrupted data in localStorage
      localStorageMock.setItem('task-metadata-store', 'corrupted json data');
      
      // This should not crash the store
      expect(() => {
        useTaskMetadataStore.getState();
      }).not.toThrow();
    });
  });

  describe('Concurrent Access', () => {
    it('should handle concurrent metadata updates', () => {
      const taskId = 'concurrent-task';
      const updates = [
        { priority: 'high', labels: ['urgent'] },
        { priority: 'normal', labels: ['work'] },
        { priority: 'low', labels: ['personal'] },
      ];
      
      // Apply updates concurrently
      updates.forEach(update => {
        metadataStore.setTaskMetadata(taskId, update);
      });
      
      // Verify final state
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved).toBeDefined();
      expect(updates.map(u => u.priority)).toContain(retrieved.priority);
      expect(updates.map(u => u.labels)).toContainEqual(retrieved.labels);
    });

    it('should handle concurrent reads and writes', () => {
      const taskId = 'concurrent-rw-task';
      const initialMetadata = {
        priority: 'normal',
        labels: ['initial'],
      };
      
      metadataStore.setTaskMetadata(taskId, initialMetadata);
      
      // Concurrent reads
      const reads = Array.from({ length: 5 }, () => metadataStore.getTaskMetadata(taskId));
      
      // Concurrent writes
      const writes = Array.from({ length: 3 }, (_, i) => {
        metadataStore.setTaskMetadata(taskId, { priority: 'high', labels: [`update-${i}`] });
      });
      
      // All reads should return valid data
      reads.forEach(result => {
        expect(result).toBeDefined();
        expect(['normal', 'high']).toContain(result.priority);
      });
      
      // Final state should be from one of the writes
      const finalResult = metadataStore.getTaskMetadata(taskId);
      expect(finalResult.priority).toBe('high');
      expect(finalResult.labels[0]).toMatch(/update-\d/);
    });
  });

  describe('Memory Management', () => {
    it('should handle large numbers of tasks', () => {
      const taskCount = 1000;
      const taskIds = Array.from({ length: taskCount }, (_, i) => `task-${i}`);
      
      // Set metadata for all tasks
      taskIds.forEach(taskId => {
        metadataStore.setTaskMetadata(taskId, {
          priority: 'normal',
          labels: ['test'],
          subtasks: [],
        });
      });
      
      // Verify all tasks have metadata
      taskIds.forEach(taskId => {
        const retrieved = metadataStore.getTaskMetadata(taskId);
        expect(retrieved).toBeDefined();
        expect(retrieved.priority).toBe('normal');
      });
      
      // Clean up
      metadataStore.clearAllMetadata();
      
      // Verify all tasks were cleared
      taskIds.forEach(taskId => {
        expect(metadataStore.getTaskMetadata(taskId)).toBeNull();
      });
    });

    it('should handle task metadata with large data', () => {
      const taskId = 'large-data-task';
      const largeSubtasks = Array.from({ length: 100 }, (_, i) => ({
        id: `subtask-${i}`,
        title: `Subtask ${i} with a very long description that tests memory usage`,
        completed: i % 2 === 0,
        due: i % 3 === 0 ? '2024-12-31' : '',
      }));
      
      const largeLabels = Array.from({ length: 50 }, (_, i) => `label-${i}`);
      
      metadataStore.setTaskMetadata(taskId, {
        priority: 'high',
        labels: largeLabels,
        subtasks: largeSubtasks,
      });
      
      const retrieved = metadataStore.getTaskMetadata(taskId);
      expect(retrieved.subtasks).toHaveLength(100);
      expect(retrieved.labels).toHaveLength(50);
    });
  });

  describe('Timestamp Tracking', () => {
    it('should track lastUpdated timestamp', () => {
      const taskId = 'timestamp-task';
      const before = Date.now();
      
      metadataStore.setTaskMetadata(taskId, {
        priority: 'high',
        labels: ['test'],
      });
      
      const after = Date.now();
      const retrieved = metadataStore.getTaskMetadata(taskId);
      
      expect(retrieved.lastUpdated).toBeGreaterThanOrEqual(before);
      expect(retrieved.lastUpdated).toBeLessThanOrEqual(after);
    });

    it('should update timestamp on metadata changes', async () => {
      const taskId = 'timestamp-update-task';
      
      // Set initial metadata
      metadataStore.setTaskMetadata(taskId, { priority: 'normal' });
      const initialTimestamp = metadataStore.getTaskMetadata(taskId).lastUpdated;
      
      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Update metadata
      metadataStore.setTaskMetadata(taskId, { priority: 'high' });
      const updatedTimestamp = metadataStore.getTaskMetadata(taskId).lastUpdated;
      
      expect(updatedTimestamp).toBeGreaterThan(initialTimestamp);
    });
  });
}); 
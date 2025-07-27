import { describe, it, expect, beforeEach } from 'vitest';
import { act } from '@testing-library/react';
import { useTaskMetadataStore } from '../taskMetadataStore';

describe('useTaskMetadataStore', () => {
  beforeEach(() => {
    // Clear localStorage and reset store state before each test
    localStorage.clear();
    useTaskMetadataStore.setState({ metadata: {} });
  });

  it('should correctly set initial metadata', () => {
    const taskId = 'task-1';

    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, {
        labels: ['frontend', 'bug'],
        priority: 'high',
        subtasks: []
      });
    });

    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata).toBeTruthy();
    expect(metadata?.labels).toEqual(['frontend', 'bug']);
    expect(metadata?.priority).toBe('high');
    expect(metadata?.subtasks).toEqual([]);
  });

  it('should perform a deep merge when updating metadata', () => {
    const taskId = 'task-1';

    // 1. Set initial state with a label and default priority
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, { labels: ['initial'] });
    });
    
    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)?.labels).toEqual(['initial']);
    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)?.priority).toBe('normal');

    // 2. Update only the priority
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, { priority: 'high' });
    });

    // 3. Verify priority is updated AND label is preserved
    const updatedMeta = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(updatedMeta?.priority).toBe('high');
    expect(updatedMeta?.labels).toEqual(['initial']);
  });

  it('should handle updates for a non-existent task by creating it', () => {
    const taskId = 'new-task';

    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, { priority: 'low' });
    });

    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata).toBeTruthy();
    expect(metadata?.priority).toBe('low');
    expect(metadata?.labels).toEqual([]); // Default empty array
  });

  it('should delete task metadata', () => {
    const taskId = 'task-to-delete';

    // Create metadata
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, {
        labels: ['test'],
        priority: 'high'
      });
    });

    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)).toBeTruthy();

    // Delete metadata
    act(() => {
      useTaskMetadataStore.getState().deleteTaskMetadata(taskId);
    });

    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)).toBeNull();
  });

  it('should clear all metadata', () => {
    // Create multiple metadata entries
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata('task-1', { labels: ['label1'] });
      useTaskMetadataStore.getState().setTaskMetadata('task-2', { labels: ['label2'] });
      useTaskMetadataStore.getState().setTaskMetadata('task-3', { labels: ['label3'] });
    });

    expect(Object.keys(useTaskMetadataStore.getState().metadata).length).toBe(3);

    // Clear all
    act(() => {
      useTaskMetadataStore.getState().clearAllMetadata();
    });

    expect(Object.keys(useTaskMetadataStore.getState().metadata).length).toBe(0);
  });

  it('should import metadata from notes field', () => {
    const taskId = 'import-task';
    const notesWithMetadata = 'Some notes here [LibreOllama:{"labels":["imported","test"],"priority":"high","subtasks":[{"id":"sub1","title":"Subtask 1","completed":false}]}]';

    act(() => {
      useTaskMetadataStore.getState().importFromNotesField(taskId, notesWithMetadata);
    });

    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata?.labels).toEqual(['imported', 'test']);
    expect(metadata?.priority).toBe('high');
    expect(metadata?.subtasks).toHaveLength(1);
    expect(metadata?.subtasks[0].title).toBe('Subtask 1');
  });

  it('should export metadata to notes field format', () => {
    const taskId = 'export-task';

    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, {
        labels: ['export', 'test'],
        priority: 'low',
        subtasks: [
          { id: 'sub1', title: 'Do something', completed: true, due: '' }
        ]
      });
    });

    const exported = useTaskMetadataStore.getState().exportToNotesField(taskId);
    expect(exported).toContain('[LibreOllama:');
    expect(exported).toContain('"labels":["export","test"]');
    expect(exported).toContain('"priority":"low"');
    expect(exported).toContain('"title":"Do something"');
  });

  it('should handle partial updates without losing other fields', () => {
    const taskId = 'partial-update-task';

    // Set full metadata
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, {
        labels: ['label1', 'label2'],
        priority: 'normal',
        subtasks: [{ id: 'sub1', title: 'Subtask', completed: false, due: '' }],
        recurring: {
          enabled: true,
          frequency: 'weekly',
          interval: 2,
          endDate: '2025-12-31'
        }
      });
    });

    // Update only labels
    act(() => {
      useTaskMetadataStore.getState().setTaskMetadata(taskId, {
        labels: ['label3', 'label4']
      });
    });

    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata?.labels).toEqual(['label3', 'label4']);
    expect(metadata?.priority).toBe('normal'); // Should remain
    expect(metadata?.subtasks).toHaveLength(1); // Should remain
    expect(metadata?.recurring?.enabled).toBe(true); // Should remain
  });
});
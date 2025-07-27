import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskMetadataStore } from '../taskMetadataStore';

describe('useTaskMetadataStore - Simple Tests', () => {
  beforeEach(() => {
    // Clear localStorage and reset store
    localStorage.clear();
    // Get initial state and reset
    const store = useTaskMetadataStore.getState();
    store.clearAllMetadata();
  });

  it('should set and get metadata', () => {
    const taskId = 'test-task-1';
    
    // Set metadata
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['test', 'bug'],
      priority: 'high'
    });
    
    // Get metadata - need to get fresh state
    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    
    expect(metadata).toBeTruthy();
    expect(metadata?.taskId).toBe(taskId);
    expect(metadata?.labels).toEqual(['test', 'bug']);
    expect(metadata?.priority).toBe('high');
  });

  it('should merge updates without losing existing data', () => {
    const taskId = 'test-task-2';
    
    // Set initial metadata
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['frontend'],
      priority: 'normal'
    });
    
    // Update only priority
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      priority: 'high'
    });
    
    // Check that labels were preserved
    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata?.priority).toBe('high');
    expect(metadata?.labels).toEqual(['frontend']);
  });

  it('should delete metadata', () => {
    const taskId = 'test-task-3';
    
    // Set metadata
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['delete-me']
    });
    
    // Verify it exists
    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)).toBeTruthy();
    
    // Delete it
    useTaskMetadataStore.getState().deleteTaskMetadata(taskId);
    
    // Verify it's gone
    expect(useTaskMetadataStore.getState().getTaskMetadata(taskId)).toBeNull();
  });

  it('should handle the real-world metadata update scenario', () => {
    const taskId = 'google-task-id-123';
    
    // Simulate what happens in the app:
    // 1. User creates task with labels
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['backend', 'bug'],
      priority: 'normal'
    });
    
    // 2. User updates priority via context menu (only sends priority)
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      priority: 'high'
    });
    
    // 3. Verify labels weren't lost
    const afterPriorityUpdate = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(afterPriorityUpdate?.priority).toBe('high');
    expect(afterPriorityUpdate?.labels).toEqual(['backend', 'bug']);
    
    // 4. User adds a label (sends updated labels array)
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['backend', 'bug', 'urgent']
    });
    
    // 5. Verify priority wasn't lost
    const afterLabelUpdate = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(afterLabelUpdate?.priority).toBe('high');
    expect(afterLabelUpdate?.labels).toEqual(['backend', 'bug', 'urgent']);
  });
});
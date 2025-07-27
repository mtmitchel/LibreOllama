import { describe, it, expect, beforeEach } from 'vitest';
import { useTaskMetadataStore } from '../taskMetadataStore';

describe('TaskMetadataStore - Deleted Flag Tests', () => {
  beforeEach(() => {
    localStorage.clear();
    useTaskMetadataStore.getState().clearAllMetadata();
  });

  it('should set deleted flag on a task', () => {
    const taskId = 'task-to-delete';
    
    // Create task metadata
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      labels: ['important'],
      priority: 'high'
    });
    
    // Mark as deleted
    useTaskMetadataStore.getState().setTaskMetadata(taskId, {
      deleted: true
    });
    
    // Verify deleted flag is set and other data preserved
    const metadata = useTaskMetadataStore.getState().getTaskMetadata(taskId);
    expect(metadata?.deleted).toBe(true);
    expect(metadata?.labels).toEqual(['important']);
    expect(metadata?.priority).toBe('high');
  });

  it('should handle the real delete flow', () => {
    const googleTaskId = 'google-task-123';
    
    // 1. Create task with metadata
    useTaskMetadataStore.getState().setTaskMetadata(googleTaskId, {
      labels: ['work'],
      priority: 'normal'
    });
    
    // 2. User deletes task - mark as deleted first
    useTaskMetadataStore.getState().setTaskMetadata(googleTaskId, {
      deleted: true
    });
    
    // 3. Verify metadata is preserved with deleted flag
    const afterDelete = useTaskMetadataStore.getState().getTaskMetadata(googleTaskId);
    expect(afterDelete?.deleted).toBe(true);
    expect(afterDelete?.labels).toEqual(['work']);
    
    // 4. Later, actually delete the metadata
    useTaskMetadataStore.getState().deleteTaskMetadata(googleTaskId);
    
    // 5. Verify it's gone
    expect(useTaskMetadataStore.getState().getTaskMetadata(googleTaskId)).toBeNull();
  });

  it('should prevent recreation of deleted tasks in sync', () => {
    const googleTaskId = 'sync-test-task';
    
    // Mark task as deleted
    useTaskMetadataStore.getState().setTaskMetadata(googleTaskId, {
      deleted: true
    });
    
    // Simulate sync service checking if task should be recreated
    const metadata = useTaskMetadataStore.getState().getTaskMetadata(googleTaskId);
    const shouldSkipCreation = metadata?.deleted === true;
    
    expect(shouldSkipCreation).toBe(true);
  });
});
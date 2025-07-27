# Critical Task System Issues - Final Deep Research

## Current State of Failures

### 1. Metadata Overwrites on Update
**Problem**: When updating priority via context menu, labels get deleted. When updating labels, priority gets reset.
**Root Cause**: The metadata store's `setTaskMetadata` method is not properly merging updates.
**Evidence**: User reports "when i add a label then try to change the priroity, it deletes the label and vice versa"

### 2. Task Recreation After Delete
**Problem**: Deleted tasks reappear after deletion
**Root Cause**: 
- Task is deleted locally but not from Google Tasks
- Sync runs and recreates the task from Google
- The delete operation is not properly checking for Google Task IDs

### 3. Sync Loop Chaos
**Problem**: Every sync updates EVERY task, causing massive console spam
**Root Cause**: The sync service is comparing timestamps and updating all tasks on every sync cycle
**Evidence**: "Updated Google task from Kanban" appears for every single task on every sync

### 4. Date Persistence Issues
**Problem**: Dates are not persisting when creating tasks
**Root Cause**: The due date is being sent to Google Tasks API but may not be in the correct format or timezone

## Code Analysis

### Metadata Store Issue
```typescript
// Current broken implementation
const updatedMetadata: TaskMetadata = {
  taskId,
  labels: updates.labels !== undefined ? updates.labels : (existing?.labels || []),
  priority: updates.priority !== undefined ? updates.priority : (existing?.priority || 'normal'),
  // ...
};
```

**Problem**: When context menu updates priority, it sends:
```typescript
{ priority: 'high' }
```
But `labels` is `undefined`, so it keeps existing labels. However, the form modal sends ALL fields, potentially with empty arrays.

### Delete Flow Issue
```typescript
// Current implementation tries to be smart about Google IDs
const googleTaskId = task?.metadata?.googleTaskId || task?.id;
const isGoogleTaskId = /^[A-Za-z0-9_-]{10,}$/.test(taskId);
```

**Problem**: Complex logic trying to determine if a task is from Google, but the sync recreates it anyway.

### Sync Service Issue
```typescript
// This runs on EVERY sync for EVERY task
if (existingGoogleTask && new Date(kanbanTask.updated) > new Date(existingGoogleTask.updated)) {
  await googleStore.updateTask(...);
}
```

**Problem**: Causes update cascade, updating every task on every sync.

## Critical Design Flaws

### 1. ID System Confusion
- Kanban tasks have local IDs (e.g., `task-1753504015368-tdkgeqhbq`)
- Google tasks have Google IDs (e.g., `V3JiWnpGOVZYdTUyamxrUg`)
- Metadata is stored by Google ID when available, local ID otherwise
- This causes lookup failures and sync issues

### 2. Multiple Sources of Truth
- Google Tasks store has tasks
- Kanban store has tasks
- Metadata store has metadata
- No single source of truth, constant sync conflicts

### 3. Sync Timing Issues
- Sync runs after create/update/delete
- But also runs on intervals
- Operations can overlap causing race conditions

## Recommended Complete Fix

### Step 1: Fix Metadata Merge
```typescript
setTaskMetadata: (taskId: string, updates: Partial<TaskMetadata>) => {
  set(state => {
    const existing = state.metadata[taskId] || {};
    
    // Deep merge - only update provided fields
    const updatedMetadata: TaskMetadata = {
      ...existing,
      ...updates,
      taskId,
      lastUpdated: Date.now()
    };
    
    return { 
      metadata: {
        ...state.metadata,
        [taskId]: updatedMetadata
      }
    };
  });
}
```

### Step 2: Fix Delete Flow
```typescript
// Delete from Google first, then local
if (task?.metadata?.googleTaskId && isAuthenticated) {
  await deleteGoogleTask(googleTaskListId, task.metadata.googleTaskId);
}
await deleteTask(columnId, taskId);
```

### Step 3: Disable Auto-Sync Updates
Already done, but ensure it stays disabled.

### Step 4: Fix ID Consistency
Always use Google Task ID as the primary key when available:
- Store metadata by Google ID
- Update Kanban task to include Google ID in main object
- Use Google ID for all lookups

## Immediate Actions Required

1. **Fix metadata merge** - Use spread operator for proper merging
2. **Fix delete order** - Delete from Google first
3. **Keep sync updates disabled** - Already done
4. **Test each operation individually** - Create, update priority, update labels, delete

## Testing Checklist

1. Create task with label and priority ✓/✗
2. Update priority - labels should remain ✓/✗
3. Update labels - priority should remain ✓/✗
4. Delete task - should not reappear ✓/✗
5. Refresh page - all data persists ✓/✗
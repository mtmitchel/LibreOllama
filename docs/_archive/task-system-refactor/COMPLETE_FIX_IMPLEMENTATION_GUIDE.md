# Complete Fix Implementation Guide - Task System

Based on the comprehensive analysis, here's the exact fix you need to implement:

## The Core Problem
1. **Initialization Order Issue**: `setupColumnMappings()` is clearing all data AFTER tasks are fetched
2. **Sync Logic Bug**: The sync process was using `syncedTaskIds` incorrectly, causing tasks to be skipped
3. **Metadata Not Preserved**: Updates during sync don't include metadata, causing backend to wipe it

## Immediate Fixes Required

### Fix 1: Remove the problematic syncedTaskIds logic
The recent changes to sync logic are causing tasks to disappear. The `syncedTaskIds` was meant to prevent duplicates but is now preventing ALL tasks from showing.

**In `src/services/kanbanGoogleTasksSync.ts`:**

Already done - we removed the `syncedTaskIds` check that was skipping tasks.

### Fix 2: Fix the initialization order in TasksAsanaClean.tsx

**In `src/app/pages/TasksAsanaClean.tsx`:**

Change the initialization order to prevent clearing data after it's loaded:

```typescript
const performInitialSync = async () => {
  try {
    console.log('[DEBUG] Fetching task lists...');
    await fetchTaskLists();
    
    // CRITICAL: Fetch tasks BEFORE setting up columns
    console.log('[DEBUG] Task lists fetched, syncing all tasks...');
    await syncAllTasks();
    
    // Check what we have in GoogleTasksStore
    const googleState = useGoogleTasksStore.getState();
    for (const [listId, tasks] of Object.entries(googleState.tasks)) {
      console.log(`[DEBUG] Google list ${listId} has ${tasks.length} tasks`);
    }
    
    // NOW setup columns - this might clear data so do it after fetching
    console.log('[DEBUG] Setting up column mappings...');
    await kanbanGoogleSync.setupColumnMappings();
    
    // Finally sync to Kanban
    console.log('[DEBUG] Syncing all data...');
    await kanbanGoogleSync.syncAll();
    
    console.log('[DEBUG] Initial sync complete');
  } catch (error) {
    console.error('[DEBUG] Initial sync failed:', error);
  }
};
```

### Fix 3: Prevent aggressive data clearing

**In `src/services/kanbanGoogleTasksSync.ts`:**

Modify `setupColumnMappings` to be less aggressive about clearing data:

```typescript
async setupColumnMappings() {
  const kanbanStore = useKanbanStore.getState();
  const googleStore = useGoogleTasksStore.getState();

  if (!googleStore.isAuthenticated || googleStore.taskLists.length === 0) {
    logger.warn('[SYNC] Google Tasks not authenticated or no task lists');
    return;
  }

  // Clear existing mappings
  this.syncMappings = [];
  
  console.log('[SYNC] setupColumnMappings - current columns:', kanbanStore.columns.length);
  console.log('[SYNC] Google task lists:', googleStore.taskLists.length);
  
  // ONLY clear if we have NO columns at all
  // Don't clear if we have columns that don't match - just add missing ones
  if (kanbanStore.columns.length === 0) {
    console.log('[SYNC] No columns exist - creating fresh');
    kanbanStore.clearAllData();
  } else {
    console.log('[SYNC] Columns exist - preserving data');
  }

  // Create Kanban columns for each Google Task list
  for (const taskList of googleStore.taskLists) {
    const existingColumn = kanbanStore.columns.find(col => col.id === taskList.id);
    
    if (!existingColumn) {
      // Add column if it doesn't exist
      kanbanStore.addColumn(taskList.id, taskList.title);
    }
    
    // Create mapping
    this.syncMappings.push({
      kanbanColumnId: taskList.id,
      googleTaskListId: taskList.id
    });
    
    logger.info(`[SYNC] Mapped column "${taskList.title}" (${taskList.id})`);
  }

  this.saveMappings();
  logger.info('[SYNC] Column mappings established:', this.syncMappings);
}
```

### Fix 4: Ensure sync preserves all tasks

**In `src/services/kanbanGoogleTasksSync.ts`:**

The sync logic should not skip tasks. Make sure the `syncColumn` method processes ALL tasks:

```typescript
private async syncColumn(mapping: SyncMapping) {
  const googleStore = useGoogleTasksStore.getState();

  // Always get fresh column data
  let column = useKanbanStore.getState().columns.find(c => c.id === mapping.kanbanColumnId);
  if (!column) {
    console.error(`[SYNC] Column not found: ${mapping.kanbanColumnId}`);
    return;
  }

  const googleTasks = googleStore.tasks[mapping.googleTaskListId] || [];
  
  console.log(`[SYNC] ===== STARTING SYNC FOR COLUMN ${mapping.kanbanColumnId} =====`);
  console.log(`[SYNC] Found ${googleTasks.length} Google tasks to sync`);
  console.log(`[SYNC] Current Kanban tasks in column: ${column.tasks.length}`);

  // Track Google task IDs we've seen
  const googleTaskIds = new Set(googleTasks.map(t => t.id));
  
  // Track Kanban task IDs that map to Google tasks
  const kanbanTasksToKeep = new Set<string>();

  // Sync Google Tasks to Kanban
  for (const googleTask of googleTasks) {
    // Always get fresh column data for each task
    column = useKanbanStore.getState().columns.find(c => c.id === mapping.kanbanColumnId)!;
    
    // Check if we already have this task in Kanban (by Google ID)
    const existingKanbanTask = column.tasks.find(
      t => t.metadata?.googleTaskId === googleTask.id
    );

    if (!existingKanbanTask) {
      // Create new task
      console.log(`[SYNC] Creating new Kanban task from Google task:`, {
        googleId: googleTask.id,
        title: googleTask.title,
        metadata: googleTask.metadata
      });
      
      const newTask = await kanbanStore.createTask(column.id, {
        title: googleTask.title,
        notes: googleTask.notes,
        due: googleTask.due,
        metadata: {
          labels: googleTask.metadata?.labels || [],
          priority: (googleTask.metadata?.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
          subtasks: [],
          googleTaskId: googleTask.id,
          lastGoogleSync: new Date().toISOString()
        }
      });
      kanbanTasksToKeep.add(newTask.id);
    } else {
      // Update existing task
      kanbanTasksToKeep.add(existingKanbanTask.id);
      
      // ALWAYS update to ensure metadata is fresh
      const updatedMetadata = {
        labels: googleTask.metadata?.labels || [],
        priority: (googleTask.metadata?.priority as 'low' | 'normal' | 'high' | 'urgent') || 'normal',
        subtasks: existingKanbanTask.metadata?.subtasks || [],
        recurring: existingKanbanTask.metadata?.recurring,
        googleTaskId: googleTask.id,
        lastGoogleSync: new Date().toISOString()
      };
      
      console.log(`[SYNC] Updating Kanban task ${existingKanbanTask.id} with metadata:`, updatedMetadata);
      
      await kanbanStore.updateTask(column.id, existingKanbanTask.id, {
        ...this.googleToKanbanTask(googleTask),
        metadata: updatedMetadata
      });
    }
  }

  // Remove Kanban tasks that no longer exist in Google
  // Be careful - only remove tasks that have a googleTaskId and aren't in Google anymore
  const tasksToRemove = column.tasks.filter(t => 
    t.metadata?.googleTaskId && 
    !googleTaskIds.has(t.metadata.googleTaskId) &&
    !kanbanTasksToKeep.has(t.id)
  );

  console.log(`[SYNC] Tasks to remove: ${tasksToRemove.length}`);
  
  for (const taskToRemove of tasksToRemove) {
    console.log(`[SYNC] Removing orphaned task: ${taskToRemove.title} (${taskToRemove.id})`);
    await kanbanStore.deleteTask(column.id, taskToRemove.id);
  }
}
```

## Testing Steps

1. **Clear everything**:
   ```javascript
   localStorage.clear();
   console.log('Cleared localStorage');
   ```

2. **Refresh the page** (F5)

3. **Watch the console logs**:
   - Should see tasks being fetched from backend
   - Should see "Google list X has Y tasks"
   - Should see "Creating new Kanban task" or "Updating Kanban task"
   - Should NOT see "CLEARING ALL DATA" after tasks are loaded

4. **Create a test task** with metadata

5. **Refresh again** and verify tasks appear with metadata

## Summary of Changes

1. **Fixed initialization order** - Fetch tasks BEFORE setting up columns
2. **Fixed column setup** - Don't clear data if columns already exist
3. **Removed problematic syncedTaskIds** - Was causing tasks to be skipped
4. **Always sync metadata** - Ensure metadata is preserved during updates

The key insight is that the initialization order was wrong - we were clearing data AFTER loading it. The sync logic was also too aggressive about skipping tasks.
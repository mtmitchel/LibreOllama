# SYSTEMATIC DEBUG IMPLEMENTATION PLAN

## PHASE 1: DISABLE SYNC (RESTORE BASIC CRUD)

### Step 1.1: Comment Out Sync Calls
```typescript
// In TasksAsanaClean.tsx, find and comment out:
// setupAutoSync();
// await kanbanGoogleSync.setupColumnMappings();
// await kanbanGoogleSync.syncAll();
```

### Step 1.2: Verify What Works
- [ ] Can you see task lists/columns?
- [ ] Can you click "Add task" button?
- [ ] Does modal open?
- [ ] Can you create a task?
- [ ] Can you delete a task?

## PHASE 2: UNIFY TO SINGLE STORE

### Step 2.1: Identify Active Store
```javascript
// Run in console:
console.log('=== STORE INVENTORY ===');
console.log('useKanbanStore:', useKanbanStore.getState());
console.log('useGoogleTasksStore:', useGoogleTasksStore.getState());
console.log('useGoogleTasksStoreV2:', typeof useGoogleTasksStoreV2 !== 'undefined' ? useGoogleTasksStoreV2.getState() : 'NOT FOUND');
```

### Step 2.2: Pick ONE Store
**IF using useKanbanStore:**
- Tasks are in: `columns[].tasks[]`
- Replace all `useGoogleTasksStore` imports

**IF using useGoogleTasksStore:**
- Tasks are in: `tasks[listId][]`
- Replace all `useKanbanStore` imports

## PHASE 3: FIX BUTTON CLICKS

### Step 3.1: Add Task Button Debug
```typescript
// In openCreateTaskModal function, add:
console.log('=== ADD TASK BUTTON DEBUG ===');
console.log('1. Button clicked');
console.log('2. Column ID:', columnId);
console.log('3. Setting showTaskModal to true');
console.log('4. Current showTaskModal:', showTaskModal);
console.log('5. editingTaskData:', editingTaskData);
```

### Step 3.2: Modal Render Debug
```typescript
// Before modal JSX:
console.log('=== MODAL RENDER CHECK ===');
console.log('showTaskModal:', showTaskModal);
console.log('editingTaskData:', editingTaskData);
console.log('Should render modal?', showTaskModal && editingTaskData);
```

### Step 3.3: Context Menu Delete Debug
```typescript
// In handleDeleteTask:
console.log('=== DELETE TASK DEBUG ===');
console.log('Task ID:', taskId);
console.log('Column ID:', columnId);
console.log('Delete function exists?', typeof deleteTask);
```

## PHASE 4: ID CONSISTENCY CHECK

### Step 4.1: Log All IDs
```typescript
// In DraggableTaskCard render:
console.log('=== TASK CARD IDS ===');
console.log('Kanban Task ID:', task.id);
console.log('Google Task ID:', task.metadata?.googleTaskId);
console.log('Which ID for metadata?', task.metadata?.googleTaskId || task.id);
```

### Step 4.2: Check Metadata Store Keys
```javascript
// Console command:
const allMetadata = useTaskMetadataStore.getState().metadata;
console.log('=== METADATA STORE KEYS ===');
Object.entries(allMetadata).forEach(([key, value]) => {
  console.log(`Key: ${key}`, 'Value:', value);
});
```

## PHASE 5: METADATA HARDCODE TEST

### Step 5.1: Temporarily Hardcode Display
```typescript
// In DraggableTaskCard, replace metadata fetch with:
const metadata = {
  labels: ['TEST_LABEL'],
  priority: 'high',
  subtasks: []
};
console.log('Using hardcoded metadata for testing');
```

### Step 5.2: Verify Display Works
- [ ] Do labels show up now?
- [ ] Does priority badge appear?
- [ ] If YES: ID mismatch confirmed
- [ ] If NO: Rendering issue

## PHASE 6: STORE METHOD AUDIT

### Step 6.1: Find All Task Creation Paths
```bash
# Search for all task creation methods:
grep -r "createTask" src/ --include="*.tsx" --include="*.ts"
```

### Step 6.2: Pick ONE Method
**Option A: Direct Store**
```typescript
const { createTask } = useGoogleTasksStore();
await createTask(listId, taskData);
```

**Option B: React Query**
```typescript
const createTaskMutation = useCreateTask();
await createTaskMutation.mutateAsync({ listId, taskData });
```

## PHASE 7: EMERGENCY FIXES

### Fix 1: Clear Everything and Restart
```javascript
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

### Fix 2: Force Authentication
```javascript
// In console:
const store = useGoogleTasksStore.getState();
console.log('Auth status:', store.isAuthenticated);
console.log('Current account:', store.getCurrentAccount());
```

### Fix 3: Use Mock Data (Bypass Google)
```typescript
// Temporarily replace store with:
const mockColumns = [{
  id: 'test-column',
  title: 'Test List',
  tasks: [{
    id: 'test-task-1',
    title: 'Test Task',
    metadata: {
      labels: ['Test Label'],
      priority: 'high',
      googleTaskId: 'test-google-id'
    }
  }]
}];
```

## PHASE 8: CHECKLIST BEFORE RE-ENABLING SYNC

- [ ] Basic CRUD works (Add/Edit/Delete)
- [ ] Modal opens and closes
- [ ] Tasks display in UI
- [ ] IDs are consistent
- [ ] Single store pattern
- [ ] No console errors

## PHASE 9: REBUILD INCREMENTALLY

1. **Get basic tasks working first**
2. **Then add metadata display**
3. **Then add metadata editing**
4. **Finally re-enable sync**

## CRITICAL CONSOLE COMMANDS

```javascript
// 1. Check all stores
['useKanbanStore', 'useGoogleTasksStore', 'useTaskMetadataStore'].forEach(storeName => {
  try {
    const store = window[storeName];
    console.log(`${storeName}:`, store?.getState ? store.getState() : 'NOT FOUND');
  } catch (e) {
    console.log(`${storeName}: ERROR`, e);
  }
});

// 2. Check authentication
console.log('Google Auth:', useGoogleTasksStore.getState().isAuthenticated);

// 3. Check localStorage
console.log('LocalStorage Keys:', Object.keys(localStorage));

// 4. Try direct task creation
try {
  const testTask = {
    title: 'Debug Test Task',
    notes: 'Testing direct creation'
  };
  console.log('Attempting to create test task...');
  // Adjust based on your store
} catch (e) {
  console.error('Task creation failed:', e);
}
```

## START WITH PHASE 1: DISABLE SYNC
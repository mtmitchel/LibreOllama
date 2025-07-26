# CRITICAL COMPLETE SYSTEM FAILURE - NOTHING WORKS

## CURRENT STATE: TOTAL FAILURE
1. **Add task button** - DOES NOT WORK
2. **Delete via context menu** - DOES NOT WORK  
3. **Labels** - DO NOT SHOW UP
4. **Priority** - DOES NOT SHOW UP
5. **Due dates** - DO NOT SHOW UP

## COMPLETE DIAGNOSTIC REQUIREMENTS

### 1. TRACE EVERY SINGLE COMPONENT

**TasksAsanaClean.tsx**
- What stores is it using?
- What types are the tasks? (KanbanTask vs GoogleTask)
- How are IDs structured? (Kanban IDs vs Google IDs)
- What's the data flow from button click to task creation?
- Why is the modal not opening?
- Console errors when clicking buttons?

**Stores Analysis**
```
googleTasksStore.ts - Main Google Tasks store
useGoogleTasksStoreV2.ts - Version 2 (WHICH ONE IS USED?)
taskMetadataStore.ts - Metadata storage
useTaskMetadataStore.ts - Hook version (WHICH ONE IS USED?)
useKanbanStore.ts - Kanban specific (IS THIS THE ACTUAL SOURCE?)
```

**Service Analysis**
```
kanbanGoogleTasksSync.ts - WHEN DOES THIS RUN?
- Does it run on every render?
- Does it overwrite all data?
- Does it map IDs correctly?
- Does it preserve metadata?
```

### 2. ID MISMATCH INVESTIGATION

**CRITICAL QUESTIONS:**
1. What format are Kanban task IDs? (e.g., "task-123456789")
2. What format are Google task IDs? (e.g., "MTU3NzQ2MTc4OTQyMDI4OTk2MTk6MDow")
3. Where is metadata stored? By which ID?
4. When DraggableTaskCard renders, what ID does it have?
5. When saving metadata, what ID is used?

**CHECK IN CONSOLE:**
```javascript
// Get all task IDs from different sources
const kanbanTasks = useKanbanStore.getState().columns.flatMap(c => c.tasks);
console.log('Kanban Tasks:', kanbanTasks.map(t => ({ 
  id: t.id, 
  googleId: t.metadata?.googleTaskId,
  title: t.title 
})));

const metadataKeys = Object.keys(useTaskMetadataStore.getState().metadata);
console.log('Metadata Store Keys:', metadataKeys);

const googleTasks = Object.values(useGoogleTasksStore.getState().tasks).flat();
console.log('Google Tasks:', googleTasks.map(t => ({ id: t.id, title: t.title })));
```

### 3. BUTTON CLICK FLOW ANALYSIS

**Add Task Button Flow:**
1. Button clicked → openCreateTaskModal(columnId)
2. Sets showTaskModal = true
3. Sets editingTaskData = {...}
4. Modal should render if showTaskModal && editingTaskData
5. WHERE DOES IT BREAK?

**Delete Task Flow:**
1. Context menu → Delete clicked
2. handleDeleteTask(task.id, columnId)
3. deleteTask function called (FROM WHICH STORE?)
4. API call to Google Tasks?
5. Store update?
6. WHERE DOES IT BREAK?

### 4. STORE CONFUSION ANALYSIS

**WHICH STORE IS THE SOURCE OF TRUTH?**
- useKanbanStore? (columns with tasks)
- useGoogleTasksStore? (tasks by list ID)
- useGoogleTasksStoreV2? (newer version?)

**HOW DO THEY INTERACT?**
- Does sync service copy between them?
- Do they reference each other?
- Are they fighting each other?

### 5. METADATA DISPLAY FAILURE

**TRACE THE COMPLETE PATH:**
1. User adds label in TaskDetailPanel
2. setTaskMetadata called with what ID?
3. Stored in localStorage under what key?
4. DraggableTaskCard renders
5. Fetches metadata with what ID?
6. Gets undefined/null/empty?
7. WHERE IS THE MISMATCH?

### 6. SYNC SERVICE DESTRUCTION

**IS THE SYNC SERVICE DESTROYING EVERYTHING?**
```typescript
// Check in kanbanGoogleTasksSync.ts:
// Line 46: kanbanStore.clearAllData(); // IS THIS WIPING EVERYTHING?
// When does setupColumnMappings() run?
// When does syncAll() run?
// Does it preserve metadata when syncing?
```

### 7. REACT QUERY VS DIRECT STORE CALLS

**MIXED PATTERNS:**
- Some code uses React Query hooks (useCreateTask, useUpdateTask)
- Some code uses store methods directly (createTask, updateTask)
- ARE THEY FIGHTING?
- Which one actually works?

### 8. TYPE SYSTEM CHAOS

**KanbanTask Interface:**
```typescript
{
  id: string;
  title: string;
  metadata?: {
    labels: string[];
    priority: string;
    googleTaskId?: string;
  }
}
```

**GoogleTask Interface:**
```typescript
{
  id: string;
  title: string;
  // NO METADATA FIELD
}
```

**HOW DO THEY MAP?**

### 9. COMPONENT PROP DRILLING

**AsanaTaskModal:**
- Receives what props?
- task prop is KanbanTask or GoogleTask?
- onSubmit expects what format?
- Creates task in which store?

**DraggableTaskCard:**
- Receives task as what type?
- Has access to what IDs?
- Renders from what data source?

### 10. CONSOLE ERROR INVESTIGATION

**CHECK FOR:**
- Network errors (401, 403, 500)
- JavaScript errors in console
- React errors (hooks, rendering)
- Store hydration errors
- Missing required props
- Undefined property access

## COMPLETE DEBUGGING CHECKLIST

### STEP 1: IDENTIFY ACTIVE STORES
```javascript
console.log('=== ACTIVE STORES ===');
console.log('Kanban Store exists?', typeof useKanbanStore !== 'undefined');
console.log('Google Tasks Store exists?', typeof useGoogleTasksStore !== 'undefined');
console.log('Metadata Store exists?', typeof useTaskMetadataStore !== 'undefined');
```

### STEP 2: TRACE BUTTON CLICKS
1. Add onClick handler to Add Task button with console.log
2. Check if handler fires
3. Check if modal state updates
4. Check if modal component renders

### STEP 3: VERIFY API CONNECTIVITY
```javascript
// Try creating a task directly
const store = useGoogleTasksStore.getState();
const account = store.getCurrentAccount();
console.log('Current Account:', account);
console.log('Is Authenticated:', store.isAuthenticated);
```

### STEP 4: CHECK SYNC TIMING
- When does sync run?
- Add console.log to sync methods
- Does it run after task creation?
- Does it overwrite metadata?

### STEP 5: VERIFY METADATA PERSISTENCE
```javascript
// Create test metadata
useTaskMetadataStore.getState().setTaskMetadata('TEST_ID', {
  labels: ['TEST_LABEL'],
  priority: 'high'
});

// Check if it persists
console.log('Test metadata:', useTaskMetadataStore.getState().getTaskMetadata('TEST_ID'));
console.log('LocalStorage:', localStorage.getItem('task-metadata-store'));
```

## ROOT CAUSE POSSIBILITIES

1. **WRONG STORE**: UI reading from one store while data in another
2. **ID MISMATCH**: Metadata keyed by wrong ID type
3. **SYNC OVERWRITE**: Sync service destroying all data
4. **AUTH FAILURE**: Not actually authenticated to Google
5. **MODAL STATE**: React state not updating properly
6. **TYPE CONFUSION**: Mixing KanbanTask and GoogleTask types
7. **IMPORT ERRORS**: Wrong store versions imported
8. **RACE CONDITIONS**: Data loaded after render
9. **MISSING DEPS**: Required packages not installed/configured
10. **API LIMITS**: Google Tasks API rejecting requests

## EMERGENCY FIXES TO TRY

1. **DISABLE SYNC**: Comment out all sync calls
2. **USE ONE STORE**: Pick ONE store and use it everywhere
3. **HARDCODE IDS**: Use same ID format everywhere
4. **REMOVE METADATA**: Get basic CRUD working first
5. **CHECK AUTH**: Verify Google account connected
6. **CLEAR STORAGE**: Wipe localStorage and restart
7. **USE MOCK DATA**: Bypass Google Tasks entirely
8. **REVERT CHANGES**: Go back to last working version

## REQUIRED INFORMATION

1. Browser console errors (FULL TEXT)
2. Network tab failures
3. React DevTools component tree
4. All localStorage keys and values
5. Which files were recently changed
6. Last known working state
7. Exact click sequence that fails
8. Any error modals or notifications

## THIS IS A COMPLETE SYSTEM FAILURE REQUIRING SYSTEMATIC DEBUGGING FROM GROUND UP
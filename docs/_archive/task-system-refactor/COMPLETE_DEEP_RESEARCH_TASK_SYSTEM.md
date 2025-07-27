# COMPLETE DEEP RESEARCH PROMPT: TASK SYSTEM METADATA NOT DISPLAYING

## CRITICAL ISSUE
Task cards in LibreOllama are NOT displaying labels, priority, or dates despite multiple attempted fixes. Need exhaustive investigation of entire task system architecture.

## PROJECT CONTEXT
- **Framework**: Tauri + React 19 + TypeScript + Vite
- **Main Tasks Page**: `src/app/pages/TasksAsanaClean.tsx`
- **Drag & Drop**: @dnd-kit/core
- **State Management**: Zustand with persist middleware
- **Data Fetching**: React Query (@tanstack/react-query)
- **Google Tasks API**: @maxim_mazurok/gapi.client.tasks-v1

## COMPLETE FILE INVENTORY

### ACTIVE COMPONENTS
```
src/app/pages/TasksAsanaClean.tsx - Main tasks page implementation
src/components/tasks/TaskDetailPanel.tsx - Modal for editing tasks
src/components/tasks/QuickAddTask.tsx - Quick task creation
```

### STORES (MULTIPLE VERSIONS - CONFUSION)
```
src/stores/googleTasksStore.ts - Main Google Tasks store
src/stores/useGoogleTasksStoreV2.ts - Version 2 of store?
src/stores/taskMetadataStore.ts - Metadata store (labels, priority)
src/stores/useTaskMetadataStore.ts - Hook version of metadata store?
src/stores/useKanbanStore.ts - Kanban-specific store
```

### HOOKS
```
src/hooks/useGoogleTasks.ts - React Query hooks
src/hooks/useGoogleTasksIntegration.ts
src/hooks/useGoogleTasksQueries.ts
src/hooks/useAllTasks.ts
```

### SERVICES
```
src/services/kanbanGoogleTasksSync.ts - Syncs between stores
src/services/google/googleTasksService.ts - API wrapper
src/api/googleTasksApi.ts - Direct API calls
```

### TYPES
```
src/types/google.ts - GoogleTask, GoogleTaskList types
KanbanTask interface (in useKanbanStore.ts)
TaskMetadata interface (in taskMetadataStore.ts)
tasks_v1.Schema$Task (from @maxim_mazurok/gapi.client.tasks-v1)
```

## INVESTIGATION AREAS

### 1. TYPE SYSTEM CONFLICTS
```
INVESTIGATE:
- GoogleTask vs KanbanTask vs tasks_v1.Schema$Task
- Where is metadata stored? On task object or separate?
- Type mismatches between stores
- Interface definitions across files
```

### 2. STORE ARCHITECTURE CONFUSION
```
INVESTIGATE:
- Why are there multiple versions of stores?
- Which store is actually being used?
- Are stores properly persisting to localStorage?
- Cross-store references and dependencies
- Store hydration order on app startup
```

### 3. DATA FLOW TRACING
```
TRACE COMPLETE FLOW:
1. User creates task in UI
2. Task saved to Google Tasks API
3. Task ID returned from API
4. Metadata saved to store (which one?)
5. Sync service runs (what does it do?)
6. UI component renders (which data source?)
7. WHERE DOES IT BREAK?
```

### 4. SYNC SERVICE BEHAVIOR
```
INVESTIGATE kanbanGoogleTasksSync.ts:
- Does it overwrite data?
- Does it merge metadata?
- When does it run?
- What triggers sync?
- Does it clear stores?
```

### 5. COMPONENT RENDERING
```
INVESTIGATE DraggableTaskCard in TasksAsanaClean.tsx:
- What props does it receive?
- Is it getting KanbanTask or GoogleTask?
- How does it fetch metadata?
- Does it re-render on store updates?
- Console log all data at render
```

### 6. PERSISTENCE LAYER
```
CHECK:
- localStorage keys and values
- Zustand persist middleware config
- Store names in localStorage
- Data format in localStorage
- Cross-tab synchronization
```

### 7. REACT QUERY INTEGRATION
```
INVESTIGATE:
- Query keys structure
- Mutation onSuccess handlers
- Cache invalidation
- Optimistic updates
- Data transformation
```

### 8. METADATA STORE OPERATIONS
```
TRACE:
- How is metadata saved?
- Key format for task IDs
- Store subscription in components
- getTaskMetadata implementation
- setTaskMetadata calls
```

## SPECIFIC CODE PATHS TO EXAMINE

### Path 1: Task Creation
```
QuickAddTask → createTask mutation → Google API → onSuccess → metadata save?
```

### Path 2: Task Update
```
TaskDetailPanel → updateTask → Google API → metadata store update → UI refresh?
```

### Path 3: Sync Flow
```
Google Tasks fetch → kanbanGoogleTasksSync → useKanbanStore → TasksAsanaClean render
```

### Path 4: Metadata Display
```
DraggableTaskCard → useTaskMetadataStore → getTaskMetadata → render labels/priority
```

## CONSOLE DEBUGGING COMMANDS

```javascript
// Check all stores
console.log('Kanban Store:', useKanbanStore.getState());
console.log('Google Tasks Store:', useGoogleTasksStore.getState());
console.log('Metadata Store:', useTaskMetadataStore.getState());

// Check localStorage
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('Metadata localStorage:', localStorage.getItem('task-metadata-store'));
console.log('Google Tasks localStorage:', localStorage.getItem('google-tasks-storage'));
console.log('Kanban localStorage:', localStorage.getItem('kanban-store'));

// Check specific task
const taskId = 'TASK_ID_HERE';
console.log('Task in Kanban:', useKanbanStore.getState().columns.flatMap(c => c.tasks).find(t => t.id === taskId));
console.log('Task metadata:', useTaskMetadataStore.getState().getTaskMetadata(taskId));
```

## POTENTIAL ROOT CAUSES

1. **MULTIPLE STORES CONFLICT**: Different parts of app using different stores
2. **TYPE MISMATCH**: KanbanTask expects embedded metadata, but it's stored separately
3. **SYNC OVERWRITE**: kanbanGoogleTasksSync creates new tasks without metadata
4. **WRONG STORE VERSION**: Using V1 vs V2 of stores
5. **PERSISTENCE FAILURE**: Metadata not actually saving to localStorage
6. **HYDRATION RACE**: Stores not loaded when components render
7. **ID FORMAT MISMATCH**: Google Task IDs vs internal IDs
8. **MISSING RE-RENDER**: Components not subscribing to store changes
9. **DATA TRANSFORMATION**: Metadata lost during type conversions
10. **IMPORT CONFUSION**: Wrong store imported in components

## CRITICAL QUESTIONS

1. Which store is TasksAsanaClean actually using for tasks?
2. Are we using taskMetadataStore or embedding metadata in tasks?
3. What format are task IDs? Do they match between stores?
4. When does kanbanGoogleTasksSync run? On every render?
5. Is metadata being saved at all? Check localStorage.
6. Are there TWO metadata systems competing?
7. Why are there V1 and V2 stores?
8. Is the sync service the source of truth?
9. Are React Query mutations updating the right store?
10. Is DraggableTaskCard looking in the right place for metadata?

## VERIFICATION STEPS

1. **Create New Task**
   - Add title "Test Task 123"
   - Save task
   - Note the task ID
   - Check all stores for this task

2. **Add Metadata**
   - Open task details
   - Add label "Important"
   - Set priority "High"
   - Save
   - Check metadata store

3. **Verify Persistence**
   - Refresh page
   - Check if metadata still exists
   - Check if card shows metadata

4. **Trace Sync**
   - Watch Network tab
   - See when Google Tasks API called
   - Check what happens to stores after

## DEPENDENCY VERSIONS
```json
"@tanstack/react-query": "^5.83.0"
"@maxim_mazurok/gapi.client.tasks-v1": "^0.0.20250720"
"zustand": "^5.0.2"
"immer": "^10.1.1"
"persist-and-sync": "^1.2.3"
"@dnd-kit/core": "^6.3.1"
```

## FILES TO INSPECT IN DETAIL

1. `src/stores/useKanbanStore.ts` - Check KanbanTask interface
2. `src/services/kanbanGoogleTasksSync.ts` - Full sync logic
3. `src/app/pages/TasksAsanaClean.tsx` - Lines 1600-1800 (DraggableTaskCard)
4. `src/stores/taskMetadataStore.ts` - Full implementation
5. `src/hooks/useGoogleTasks.ts` - Mutation handlers
6. `src/types/google.ts` - Type definitions

## BROWSER DEVTOOLS INVESTIGATION

1. **Application Tab**
   - Check all localStorage keys
   - Inspect stored JSON structure
   - Look for data corruption

2. **Network Tab**
   - Monitor Google Tasks API calls
   - Check request/response payloads
   - Look for missing fields

3. **Console**
   - Add breakpoints in store setters
   - Log every state change
   - Trace component renders

4. **React DevTools**
   - Check component props
   - Inspect hooks state
   - Monitor re-renders

## COMPLETE THIS INVESTIGATION SYSTEMATICALLY
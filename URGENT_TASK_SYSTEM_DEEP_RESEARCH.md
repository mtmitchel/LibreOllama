# CRITICAL: COMPLETE TASK SYSTEM DEEP RESEARCH - CARDS NOT SHOWING METADATA

## URGENT ISSUE: Task cards are NOT displaying labels, priority, or dates despite all fixes

## COMPLETE SYSTEM INVENTORY

### 1. ALL TASK-RELATED FILES IN PROJECT
```
ACTIVE:
- src/app/pages/TasksAsanaClean.tsx (MAIN IMPLEMENTATION)
- src/components/tasks/TaskDetailPanel.tsx
- src/components/tasks/QuickAddTask.tsx

ARCHIVED:
- src/archived/pages/Tasks.tsx
- src/archived/pages/TasksIntegrated.tsx
- src/archived/pages/TasksV2.tsx
- src/archived/pages/TasksV2Simple.tsx
- src/archived/components/tasks/SimpleKanbanBoard.tsx
- src/archived/components/tasks/KanbanBoard.tsx
- src/archived/components/tasks/AsanaKanbanBoard.tsx
- src/archived/components/tasks/AsanaTaskModal.tsx
- src/archived/components/tasks/DraggableTaskCard.tsx
- src/archived/components/tasks/DroppableColumn.tsx
```

### 2. ALL STORES
```
GOOGLE TASKS STORES:
- src/stores/googleTasksStore.ts (MAIN - uses Zustand with persist)
- src/stores/useGoogleTasksStoreV2.ts (NEWER VERSION?)
- src/stores/useKanbanStore.ts (KANBAN-SPECIFIC)

METADATA STORES:
- src/stores/taskMetadataStore.ts (MAIN - Record<string, TaskMetadata>)
- src/stores/useTaskMetadataStore.ts (HOOK VERSION?)

SETTINGS/AUTH:
- src/stores/settingsStore.ts
```

### 3. ALL HOOKS
```
- src/hooks/useGoogleTasks.ts (React Query hooks)
- src/hooks/useGoogleTasksIntegration.ts
- src/hooks/useGoogleTasksQueries.ts
- src/hooks/useAllTasks.ts
```

### 4. API LAYERS
```
- src/api/googleTasksApi.ts
- src/services/google/googleTasksService.ts
- src/services/kanbanGoogleTasksSync.ts
```

### 5. TYPES
```
- src/types/google.ts
- @maxim_mazurok/gapi.client.tasks-v1 (tasks_v1.Schema$Task)
```

## CRITICAL INVESTIGATION AREAS

### 1. METADATA STORE INVESTIGATION
```
CHECK:
- Is taskMetadataStore.ts persisting to localStorage?
- Is the store hydrating on app load?
- Are task IDs matching between Google Tasks and metadata store?
- Is the metadata being saved when tasks are created/updated?
- Check localStorage in DevTools: what keys exist?
- Is persist middleware working?
```

### 2. COMPONENT RENDERING INVESTIGATION
```
CHECK TasksAsanaClean.tsx DraggableTaskCard:
- Is useTaskMetadataStore hook returning data?
- Console.log the metadata object - is it undefined/null/empty?
- Is the component re-rendering when metadata updates?
- Are we looking for the right task ID format?
```

### 3. DATA FLOW INVESTIGATION
```
TRACE THE FLOW:
1. Task created in Google Tasks -> returns task with ID
2. Metadata should be saved to taskMetadataStore with that ID
3. DraggableTaskCard should fetch metadata using that ID
4. WHERE IS IT BREAKING?
```

### 4. SYNC SERVICE INVESTIGATION
```
CHECK kanbanGoogleTasksSync.ts:
- Is it syncing metadata?
- Is it clearing metadata on sync?
- Is it using the correct store?
```

### 5. REACT QUERY INVESTIGATION
```
CHECK useGoogleTasks.ts:
- Are mutations updating metadata store?
- Is onSuccess being called?
- Are we invalidating the right queries?
```

## SPECIFIC CHECKS TO RUN

### 1. CONSOLE LOGGING
Add to DraggableTaskCard in TasksAsanaClean.tsx:
```tsx
console.log('Task ID:', task.id);
console.log('Full task object:', task);
console.log('Metadata from store:', metadata);
console.log('All metadata in store:', useTaskMetadataStore.getState().metadata);
```

### 2. LOCALSTORAGE CHECK
```javascript
// Run in browser console:
console.log('All localStorage keys:', Object.keys(localStorage));
console.log('Task metadata:', localStorage.getItem('task-metadata-store'));
console.log('Google tasks:', localStorage.getItem('google-tasks-storage'));
```

### 3. STORE STATE CHECK
```javascript
// Run in browser console:
console.log('Task Metadata Store State:', useTaskMetadataStore.getState());
console.log('Google Tasks Store State:', useGoogleTasksStore.getState());
```

### 4. COMPONENT PROPS CHECK
Is DraggableTaskCard receiving the right task object structure?
- Does it have an 'id' field?
- Is the ID a string?
- Does it match what's in the metadata store?

## DEPENDENCIES TO VERIFY

### NPM PACKAGES
```json
"@tanstack/react-query": "^5.83.0",
"@maxim_mazurok/gapi.client.tasks-v1": "^0.0.20250720",
"zustand": "^5.0.2",
"persist-and-sync": "^1.2.3",
"@dnd-kit/core": "^6.3.1",
"@dnd-kit/sortable": "^10.0.0",
"immer": "^10.1.1"
```

### VERIFY IMPORTS
- Is TasksAsanaClean importing from the RIGHT stores?
- Are we using taskMetadataStore or useTaskMetadataStore?
- Is the import path correct?

## POTENTIAL ROOT CAUSES

1. **STORE NOT PERSISTING**: Metadata is being lost on refresh
2. **ID MISMATCH**: Google Task IDs don't match metadata store keys
3. **WRONG STORE**: Using wrong version of store (V2 vs regular)
4. **SYNC CLEARING DATA**: kanbanGoogleTasksSync might be wiping metadata
5. **COMPONENT NOT REACTIVE**: DraggableTaskCard not re-rendering on store updates
6. **RACE CONDITION**: Metadata loaded after component renders
7. **TYPE MISMATCH**: Task object structure doesn't match expected type

## IMMEDIATE ACTIONS NEEDED

1. **ADD CONSOLE LOGS EVERYWHERE**:
   - When metadata is saved
   - When metadata is retrieved
   - Task IDs at every step
   - Store state changes

2. **CHECK BROWSER DEVTOOLS**:
   - Network tab: Are API calls succeeding?
   - Application tab: What's in localStorage?
   - Console: Any errors?

3. **VERIFY DATA FLOW**:
   - Create a new task
   - Add labels/priority via TaskDetailPanel
   - Check if metadata saves
   - Check if card shows metadata

4. **CHECK HYDRATION**:
   - Refresh the page
   - Is metadata still there?
   - Is store hydrating?

## CRITICAL QUESTIONS

1. When you edit a task in TaskDetailPanel and add labels/priority, does it save?
2. If you refresh the page, is the metadata still in localStorage?
3. Are task IDs consistent between Google Tasks and our metadata?
4. Is the DraggableTaskCard component even trying to fetch metadata?
5. Is there a useKanbanStore that's overriding our data?

## FIX VERIFICATION STEPS

1. Open browser DevTools
2. Go to Application -> Local Storage
3. Look for 'task-metadata-store' key
4. Create a task and add metadata
5. Check if metadata appears in localStorage
6. Check if card shows metadata
7. Refresh page
8. Check if metadata persists

INVESTIGATE EVERY SINGLE ONE OF THESE POINTS. THE ISSUE IS SOMEWHERE IN THIS CHAIN.
# Task Metadata Persistence Investigation

## The Problem
Task metadata (priority, labels) and due dates are not persisting after page refresh, despite being saved correctly in the backend.

## The Architecture (Two Store System)
1. **GoogleTasksStore** - Fetches and stores tasks from Google Tasks API + SQLite metadata
2. **KanbanStore** - UI state for the kanban board
3. **KanbanGoogleTasksSync** - Syncs between the two stores

## The Critical Discovery
**The UI renders from KanbanStore, NOT GoogleTasksStore!**

## The Complete Task Lifecycle

### 1. Task Creation
```
User creates task → GoogleTasksStore.createTask() → Backend API
  → Google Tasks API (standard fields)
  → SQLite (metadata: priority, labels)
  → Returns merged task
  → Creates in KanbanStore
```

### 2. Page Refresh Flow
```
1. fetchTaskLists() → Gets task lists from Google
2. setupColumnMappings() → Maps Google lists to Kanban columns
3. syncAllTasks() → Fetches all tasks into GoogleTasksStore
4. kanbanGoogleSync.syncAll() → Syncs GoogleTasksStore → KanbanStore
5. UI renders from KanbanStore
```

## Where Metadata Gets Lost

### Backend ✅
- Correctly saves metadata to SQLite
- Correctly loads and merges metadata when fetching tasks
- Returns tasks with metadata attached

### GoogleTasksStore ✅
- Receives tasks with metadata from backend
- Stores them in state.tasks[taskListId]

### KanbanGoogleTasksSync ❓
- Reads from GoogleTasksStore.tasks
- Should preserve metadata when syncing to KanbanStore
- The googleToKanbanTask() function was fixed to preserve metadata

### KanbanStore ❌
- This is what the UI actually renders
- Tasks here might not have metadata

## The Root Cause
The sync process between GoogleTasksStore and KanbanStore is where metadata is potentially lost. Even though we fixed googleToKanbanTask() to preserve metadata, the sync might not be running correctly or at the right time.

## Added Logging
1. GoogleTasksStore now logs when it receives tasks with metadata
2. KanbanGoogleTasksSync now logs what it's syncing
3. This will help identify exactly where metadata is lost

## Next Steps
1. Run the app and check console logs
2. Verify metadata is present in GoogleTasksStore
3. Verify sync is preserving metadata to KanbanStore
4. Check if UI is correctly displaying from KanbanStore
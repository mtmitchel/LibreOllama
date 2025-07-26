# Complete Task System Architecture Deep Dive - Everything You Need to Know

## The Core Problem
Tasks with metadata (priority, labels, due dates) are not persisting after page refresh. The backend SQLite database IS correctly saving and loading the metadata, but it's not making it to the UI. Additionally, after recent changes, NO tasks are showing up at all.

## System Architecture Overview

### Dual-Store Architecture
The application uses TWO separate Zustand stores:

1. **GoogleTasksStore** (`src/stores/googleTasksStore.ts`)
   - Fetches tasks from the backend (Google Tasks API + SQLite metadata)
   - Stores tasks indexed by taskListId: `tasks: Record<string, GoogleTask[]>`
   - Does NOT persist to localStorage (this is correct)
   - Handles all Google Tasks API operations

2. **KanbanStore** (`src/stores/useKanbanStore.ts`)
   - THIS IS WHAT THE UI RENDERS FROM
   - Stores tasks in a column-based structure
   - Each column has an array of tasks
   - Does NOT persist to localStorage (this is correct)

3. **KanbanGoogleTasksSync** (`src/services/kanbanGoogleTasksSync.ts`)
   - Syncs data between GoogleTasksStore and KanbanStore
   - Maps Google Task Lists to Kanban columns
   - THIS IS WHERE THE PROBLEM LIKELY IS

## The Complete Data Flow

### 1. Task Creation Flow
```
User creates task in UI
→ TasksAsanaClean.tsx calls createGoogleTask()
→ GoogleTasksStore.createTask() 
→ Calls backend via Tauri invoke('create_task')
→ Backend creates in Google Tasks API
→ Backend saves metadata to SQLite
→ Returns merged task with metadata
→ Creates task in KanbanStore with metadata
```

### 2. Page Refresh Flow (WHERE IT BREAKS)
```
Page loads
→ TasksAsanaClean.tsx useEffect runs
→ fetchTaskLists() - Gets Google Task Lists
→ setupColumnMappings() - Maps lists to Kanban columns
  → MAY CLEAR ALL DATA HERE (BUG #1)
→ syncAllTasks() - Fetches all tasks into GoogleTasksStore
  → Backend correctly loads and merges metadata
  → GoogleTasksStore receives tasks WITH metadata
→ kanbanGoogleSync.syncAll() - Syncs to KanbanStore
  → THIS IS WHERE METADATA GETS LOST OR TASKS DISAPPEAR
→ UI renders from KanbanStore (no metadata/no tasks)
```

## Critical Code Components

### 1. Backend Task API (`src-tauri/src/commands/tasks/api.rs`)

#### Create Task
```rust
#[tauri::command]
pub async fn create_task(
    account_id: String,
    task_list_id: String,
    task_data: TaskCreateData,
    // ... states
) -> Result<GoogleTask, String> {
    // 1. Creates task in Google Tasks API
    // 2. Saves metadata to SQLite:
    conn.execute(
        "INSERT INTO task_metadata (google_task_id, google_list_id, priority, labels)
         VALUES (?1, ?2, ?3, ?4)",
        (&task_id, &task_list_id, &metadata.priority, &labels_json)
    )?;
    // 3. Returns task WITH metadata attached
}
```

#### Get Tasks (Fetch)
```rust
#[tauri::command]
pub async fn get_tasks(
    account_id: String,
    task_list_id: String,
    // ... params
) -> Result<TasksResponse, String> {
    // 1. Fetches tasks from Google Tasks API
    // 2. Loads metadata from SQLite:
    let mut stmt = conn.prepare(
        "SELECT google_task_id, priority, labels 
         FROM task_metadata 
         WHERE google_list_id = ?"
    )?;
    // 3. Merges metadata into each task
    // 4. Returns tasks WITH metadata
    println!("📋 [TASKS-API] Total tasks with metadata: {}", tasks_with_metadata);
}
```

#### Update Task
```rust
#[tauri::command]
pub async fn update_task(
    // ... params
) -> Result<GoogleTask, String> {
    // Updates Google Task
    // IF metadata provided: Updates SQLite
    // IF NO metadata: Logs warning "⚠️ [TASKS-API] No metadata provided"
    // THIS IS A PROBLEM - sync updates without metadata wipe it out
}
```

### 2. GoogleTasksStore (`src/stores/googleTasksStore.ts`)

```typescript
interface GoogleTasksState {
  taskLists: GoogleTaskList[];
  tasks: Record<string, GoogleTask[]>; // taskListId -> tasks[]
  isAuthenticated: boolean;
  // ... other state
}

// Key methods:
createTask: async (taskListId: string, taskData: TaskCreateData) => {
  // Calls backend create_task
  // Returns created task but DOES NOT update local state
  // Expects caller to refetch
},

fetchTasks: async (taskListId: string) => {
  // Calls backend get_tasks
  // Logs: "[GOOGLE-TASKS-STORE] Tasks with metadata: X"
  // Updates state.tasks[taskListId] with fetched tasks
},

updateTask: async (taskListId: string, taskId: string, updates) => {
  // NOW INCLUDES metadata in update (after fix):
  metadata: updates.metadata ? {
    priority: updates.metadata.priority,
    labels: updates.metadata.labels
  } : undefined
}
```

### 3. KanbanStore (`src/stores/useKanbanStore.ts`)

```typescript
interface KanbanTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  position: string;
  updated: string;
  metadata?: TaskMetadata; // THIS IS WHAT WE NEED TO PRESERVE
}

interface KanbanColumn {
  id: string;
  title: string;
  tasks: KanbanTask[];
}

// Key methods:
createTask: async (columnId, data) => {
  // Creates task with provided metadata
  // Generates unique ID
  // Adds to column's task array
},

updateTask: async (columnId, taskId, updates) => {
  // Updates task INCLUDING metadata
  // Sets updated timestamp
},

clearAllData() {
  // DANGER: Wipes all columns and tasks
  // Called by setupColumnMappings() sometimes
}
```

### 4. KanbanGoogleTasksSync (`src/services/kanbanGoogleTasksSync.ts`)

THIS IS THE MOST CRITICAL FILE - WHERE SYNC HAPPENS:

```typescript
class KanbanGoogleTasksSync {
  private syncMappings: SyncMapping[] = [];
  private isSyncing = false;

  setupColumnMappings() {
    // Maps Google Task Lists to Kanban columns
    // PROBLEM: May call clearAllData() at wrong time
    if (kanbanStore.columns.length === 0 || 
        kanbanStore.columns.some(col => !googleStore.taskLists.find(tl => tl.id === col.id))) {
      kanbanStore.clearAllData(); // THIS MIGHT WIPE TASKS
    }
  }

  private googleToKanbanTask(googleTask: GoogleTask) {
    // Converts Google task to Kanban format
    // NOW PRESERVES METADATA (after fix)
    return {
      title: googleTask.title,
      notes: googleTask.notes,
      due: googleTask.due,
      metadata: googleTask.metadata ? {
        priority: googleTask.metadata.priority,
        labels: googleTask.metadata.labels,
        // ... other metadata
      } : { /* default metadata */ }
    };
  }

  private async syncColumn(mapping: SyncMapping) {
    // For each Google task:
    
    // 1. Check if task exists in Kanban (by googleTaskId)
    const existingKanbanTask = column.tasks.find(
      t => t.metadata?.googleTaskId === googleTask.id
    );

    if (!existingKanbanTask) {
      // 2. Create new Kanban task with metadata
      await kanbanStore.createTask(column.id, {
        // ... task data
        metadata: {
          labels: googleTask.metadata?.labels || [],
          priority: googleTask.metadata?.priority || 'normal',
          googleTaskId: googleTask.id,
        }
      });
    } else {
      // 3. Update existing task
      // PROBLEM: Used to check timestamps, now always updates
      await kanbanStore.updateTask(column.id, existingKanbanTask.id, {
        ...this.googleToKanbanTask(googleTask),
        metadata: updatedMetadata
      });
    }

    // 4. Remove tasks not in Google
    // PROBLEM: This might be too aggressive
    const tasksToRemove = column.tasks.filter(t => 
      t.metadata?.googleTaskId && 
      !googleTaskIds.has(t.metadata.googleTaskId)
    );
  }
}
```

### 5. UI Component (`src/app/pages/TasksAsanaClean.tsx`)

```typescript
// Initial sync on load:
useEffect(() => {
  if (isAuthenticated && isHydrated) {
    const performInitialSync = async () => {
      // 1. Fetch task lists
      await fetchTaskLists();
      
      // 2. Setup column mappings (MIGHT CLEAR DATA)
      await kanbanGoogleSync.setupColumnMappings();
      
      // 3. Fetch all tasks from backend
      await syncAllTasks();
      
      // 4. Sync to Kanban store
      await kanbanGoogleSync.syncAll();
    };
    performInitialSync();
  }
}, [isAuthenticated, isHydrated]);

// Renders AsanaKanbanBoard with columns from KanbanStore
```

### 6. Task Card UI (`src/components/tasks/DraggableTaskCard.tsx`)

```typescript
// This component CORRECTLY renders metadata when it exists:
{task.metadata?.labels?.map((label) => (
  <span className="px-2.5 py-1 rounded-lg">
    {label.charAt(0).toUpperCase() + label.slice(1).toLowerCase()}
  </span>
))}

{task.metadata?.priority && task.metadata.priority !== 'normal' && (
  <span className="px-3 py-1 rounded-lg">
    {priority + ' priority'}
  </span>
)}
```

## Recent Changes That Broke Everything

1. **Removed timestamp check in sync**: Now ALWAYS updates Kanban tasks from Google
2. **Modified syncedTaskIds logic**: Was preventing tasks from being processed
3. **Added aggressive logging**: To trace where data is lost

## The Current Problems

### Problem 1: No Tasks Showing
- Sync process might be clearing all data
- Tasks might be getting filtered out
- syncedTaskIds logic might be broken

### Problem 2: Metadata Not Persisting (Original Issue)
- Backend saves/loads correctly ✅
- GoogleTasksStore receives metadata ✅
- KanbanStore loses metadata ❌
- Sync process doesn't preserve metadata correctly

## What Happens in the Logs

### Success Pattern:
```
[TASKS-API] Creating task with metadata
[TASKS-API] Saving metadata: priority=high, labels=["work"]
[GOOGLE-TASKS-STORE] Tasks with metadata: 1
[SYNC] Google tasks with metadata: 1
[SYNC] Creating/Updating Kanban task with metadata
[TASK-CARD] Rendering task with metadata
```

### Current Failure Pattern:
```
[SYNC] CLEARING ALL DATA!
[SYNC] Tasks to remove: X
[SYNC] Skipping already synced task
[TASK-CARD] Rendering task - metadata: undefined
```

## Key Debugging Points

1. **Check if clearAllData() is being called** at the wrong time
2. **Check if tasks are being removed** by the sync logic
3. **Check if metadata is being passed** through the sync
4. **Check the order of operations** - are we syncing before data is loaded?
5. **Check if column IDs match** between Google and Kanban

## Potential Fixes to Try

1. **Remove or fix the clearAllData() logic** in setupColumnMappings
2. **Ensure metadata is always preserved** during sync updates
3. **Fix the task removal logic** to not be overly aggressive
4. **Add defensive checks** before removing tasks
5. **Ensure proper order** of operations during initial load

## Testing Process

1. Clear localStorage: `localStorage.clear()`
2. Refresh page
3. Check console for sync logs
4. Create a task with metadata
5. Refresh page again
6. Check if tasks appear and have metadata

The core issue is in the sync process - either it's clearing data when it shouldn't, or it's not properly syncing tasks from GoogleTasksStore to KanbanStore.
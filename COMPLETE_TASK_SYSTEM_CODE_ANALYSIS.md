# COMPLETE TASK SYSTEM CODE ANALYSIS WITH FLOW

## 1. DATA FLOW: FROM GOOGLE TASK TO UI

### STEP 1: Task Creation/Update in Google Tasks
```typescript
// src/stores/googleTasksStore.ts:217
updateTask: async (taskListId: string, taskId: string, updates: Partial<GoogleTask>) => {
  const account = get().getCurrentAccount();
  if (!account) return;

  try {
    logger.debug(`[GOOGLE-TASKS] Updating task ${taskId} in list ${taskListId}`);
    const response = await googleTasksService.updateTask(account, taskListId, taskId, {
      title: updates.title,
      notes: updates.notes,
      status: updates.status,
      due: updates.due,
    });

    if (response.success && response.data) {
      set((state) => {
        const tasks = state.tasks[taskListId] || [];
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
          state.tasks[taskListId][index] = response.data!;
        }
      });
    }
  }
}
```
**PROBLEM**: This ONLY updates the Google Task, NOT the metadata!

### STEP 2: Metadata Storage (SEPARATE STORE)
```typescript
// src/stores/taskMetadataStore.ts:42
setTaskMetadata: (taskId: string, updates: Partial<TaskMetadata>) => {
  set(state => {
    const existing = state.metadata[taskId];
    
    const updatedMetadata: TaskMetadata = {
      taskId,
      labels: updates.labels || existing?.labels || [],
      priority: updates.priority || existing?.priority || 'normal',
      subtasks: updates.subtasks || existing?.subtasks || [],
      recurring: updates.recurring || existing?.recurring || {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: ''
      },
      lastUpdated: Date.now()
    };
    
    return { 
      metadata: {
        ...state.metadata,
        [taskId]: updatedMetadata
      }
    };
  });
},
```

### STEP 3: TaskDetailPanel Saves BOTH
```typescript
// src/components/tasks/TaskDetailPanel.tsx:52
const handleSave = async () => {
  try {
    console.log('Saving task with date:', dueDate);
    // This updates Google Task
    await updateTask(taskListId, task.id!, {
      title,
      notes,
      due: dueDate ? new Date(dueDate + 'T00:00:00Z').toISOString() : undefined,
    });
    onClose();
  } catch (error) {
    console.error('Failed to save task:', error);
  }
};

// Lines 78-84: Label saving
const handleAddLabel = () => {
  if (newLabel.trim()) {
    console.log('Adding label:', newLabel.trim(), 'to task:', task.id);
    setTaskMetadata(task.id!, {
      ...metadata,
      labels: [...metadata.labels, newLabel.trim()]
    });
    setNewLabel('');
  }
};

// Lines 173-177: Priority saving
onValueChange={(value) => {
  setTaskMetadata(task.id!, {
    ...metadata,
    priority: value as 'low' | 'normal' | 'high' | 'urgent'
  });
}}
```

### STEP 4: DraggableTaskCard SHOULD Display Metadata
```typescript
// src/app/pages/TasksAsanaClean.tsx:1629
// Get metadata from store
const metadata = useTaskMetadataStore(state => state.getTaskMetadata(task.id)) || {
  labels: [],
  priority: 'normal' as const,
  subtasks: []
};

// Lines 1687-1700: Priority display
{metadata.priority && metadata.priority !== 'normal' && (
  <div className="mb-3">
    <span 
      className="px-3 py-1 rounded-lg inline-block"
      style={{ 
        ...asanaTypography.label,
        backgroundColor: priorityConfig[metadata.priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
        color: priorityConfig[metadata.priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
      }}
    >
      {priorityConfig[metadata.priority as keyof typeof priorityConfig]?.label || metadata.priority} Priority
    </span>
  </div>
)}

// Lines 1752-1769: Labels display
{metadata.labels && metadata.labels.length > 0 && (
  <div className="flex flex-wrap gap-2 mb-3">
    {metadata.labels.map((label: string) => (
      <span
        key={label}
        className="px-2.5 py-1 rounded-lg"
        style={{ 
          ...asanaTypography.label,
          backgroundColor: '#EDF1F5',
          color: '#796EFF'
        }}
      >
        {label}
      </span>
    ))}
  </div>
)}
```

## 2. THE BROKEN CHAIN - WHERE IT'S FAILING

### ISSUE 1: KanbanTask Type Mismatch
```typescript
// src/stores/useKanbanStore.ts
export interface KanbanTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  position: string;
  updated: string;
  metadata?: {
    labels: string[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    subtasks: Subtask[];
  };
}
```
**PROBLEM**: KanbanTask expects metadata ON the task object, but we store it SEPARATELY!

### ISSUE 2: Task Type Confusion
```typescript
// TasksAsanaClean uses KanbanTask type which has metadata property
// But Google Tasks (tasks_v1.Schema$Task) doesn't have metadata
// So there's a TYPE MISMATCH!
```

### ISSUE 3: Store Persistence Check
```typescript
// src/stores/taskMetadataStore.ts:121
{
  name: 'task-metadata-store',
  // Now using default storage since we have plain objects
}
```
**CHECK**: Is this actually persisting? The comment says "default storage" but no storage implementation!

## 3. THE REAL PROBLEM - KANBAN SYNC SERVICE

```typescript
// src/services/kanbanGoogleTasksSync.ts
// THIS SERVICE IS LIKELY OVERWRITING OUR DATA!

class KanbanGoogleTasksSync {
  async syncTasksToKanban(listId: string, googleTasks: GoogleTask[]) {
    const kanbanTasks = googleTasks.map(task => ({
      id: task.id,
      title: task.title || '',
      notes: task.notes || '',
      due: task.due,
      status: task.status as 'needsAction' | 'completed',
      position: task.position || '',
      updated: task.updated || new Date().toISOString(),
      // METADATA IS NOT BEING MAPPED HERE!
    }));
    
    // This OVERWRITES the column with tasks that have NO metadata
    useKanbanStore.getState().setColumn(listId, {
      id: listId,
      title: taskList?.title || 'Tasks',
      tasks: kanbanTasks
    });
  }
}
```

## 4. THE FIX NEEDED

### Option 1: Fix the Sync Service
```typescript
// In kanbanGoogleTasksSync.ts, merge metadata when syncing:
async syncTasksToKanban(listId: string, googleTasks: GoogleTask[]) {
  const metadataStore = useTaskMetadataStore.getState();
  
  const kanbanTasks = googleTasks.map(task => {
    const metadata = metadataStore.getTaskMetadata(task.id) || {
      labels: [],
      priority: 'normal',
      subtasks: []
    };
    
    return {
      id: task.id,
      title: task.title || '',
      notes: task.notes || '',
      due: task.due,
      status: task.status as 'needsAction' | 'completed',
      position: task.position || '',
      updated: task.updated || new Date().toISOString(),
      metadata // ADD THIS!
    };
  });
}
```

### Option 2: Fix DraggableTaskCard to Use Correct Type
```typescript
// The task being passed is KanbanTask, not GoogleTask
// So it should already have metadata property!
const DraggableTaskCard: React.FC<DraggableTaskCardProps> = ({ task, ... }) => {
  // Don't fetch from store, use task.metadata directly!
  const metadata = task.metadata || {
    labels: [],
    priority: 'normal',
    subtasks: []
  };
}
```

## 5. DEBUGGING STEPS

### Add These Console Logs:
```typescript
// In DraggableTaskCard:
console.log('=== TASK CARD DEBUG ===');
console.log('Task ID:', task.id);
console.log('Task object:', task);
console.log('Has metadata property?', 'metadata' in task);
console.log('Task.metadata:', task.metadata);
console.log('Metadata from store:', useTaskMetadataStore.getState().getTaskMetadata(task.id));
console.log('All store metadata:', useTaskMetadataStore.getState().metadata);
```

### Check in Browser Console:
```javascript
// See what's in the stores:
useKanbanStore.getState().columns
useTaskMetadataStore.getState().metadata
localStorage.getItem('task-metadata-store')
```

## 6. THE SMOKING GUN

The issue is that `TasksAsanaClean` is using `useKanbanStore` which has its own task format (KanbanTask with embedded metadata), but the sync service isn't copying metadata from `taskMetadataStore` when it syncs from Google Tasks!

**FLOW BREAKDOWN**:
1. ✅ User adds labels/priority -> Saved to taskMetadataStore
2. ✅ Metadata persists in localStorage
3. ❌ kanbanGoogleTasksSync runs and creates KanbanTask WITHOUT metadata
4. ❌ DraggableTaskCard tries to use task.metadata (which is undefined)
5. ❌ Falls back to fetching from store but the component doesn't re-render

**THE FIX**: Update kanbanGoogleTasksSync to merge metadata when creating KanbanTasks!
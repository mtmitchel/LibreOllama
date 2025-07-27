# METADATA FIX - THE REAL ISSUE

## The Problem
GoogleTask has metadata: `{ priority?: string, labels?: string[] }`
KanbanTask expects metadata with MORE fields including `googleTaskId`

## Quick Test
Run this in console:

```javascript
// Check what's in GoogleTasksStore
const googleStore = useGoogleTasksStore.getState();
const firstList = Object.keys(googleStore.tasks)[0];
const tasksWithMetadata = googleStore.tasks[firstList]?.filter(t => t.metadata) || [];
console.log('Google tasks with metadata:', tasksWithMetadata);

// Check what's in KanbanStore  
const kanbanStore = useKanbanStore.getState();
const kanbanTasksWithMetadata = kanbanStore.columns.flatMap(col => col.tasks.filter(t => t.metadata));
console.log('Kanban tasks with metadata:', kanbanTasksWithMetadata);

// Compare metadata structure
if (tasksWithMetadata.length > 0 && kanbanTasksWithMetadata.length > 0) {
  console.log('Google metadata:', tasksWithMetadata[0].metadata);
  console.log('Kanban metadata:', kanbanTasksWithMetadata[0].metadata);
}
```

## The Fix
The sync is working but the metadata structure is different between stores.
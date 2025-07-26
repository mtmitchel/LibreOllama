# Debug Console Commands

Run these commands in the browser console to debug the task system:

## 1. Check Authentication
```javascript
// Check if authenticated
const googleStore = useGoogleTasksStore.getState();
console.log('Is authenticated:', googleStore.isAuthenticated);
console.log('Current account:', googleStore.getCurrentAccount());
```

## 2. Check Task Lists
```javascript
// Check task lists
const googleStore = useGoogleTasksStore.getState();
console.log('Task lists:', googleStore.taskLists);
```

## 3. Manually Fetch Task Lists
```javascript
// Fetch task lists
const googleStore = useGoogleTasksStore.getState();
await googleStore.fetchTaskLists();
console.log('After fetch, task lists:', googleStore.taskLists);
```

## 4. Check Tasks
```javascript
// Check tasks
const googleStore = useGoogleTasksStore.getState();
console.log('Tasks by list:', googleStore.tasks);

// Count tasks
Object.entries(googleStore.tasks).forEach(([listId, tasks]) => {
  console.log(`List ${listId}: ${tasks.length} tasks`);
});
```

## 5. Manually Sync All Tasks
```javascript
// Sync all tasks
const googleStore = useGoogleTasksStore.getState();
await googleStore.syncAllTasks();
console.log('After sync, tasks:', googleStore.tasks);
```

## 6. Check Kanban Store
```javascript
// Check Kanban columns
const kanbanStore = useKanbanStore.getState();
console.log('Kanban columns:', kanbanStore.columns);

// Count tasks in Kanban
kanbanStore.columns.forEach(col => {
  console.log(`Column ${col.title}: ${col.tasks.length} tasks`);
});
```

## 7. Manually Run Full Sync
```javascript
// Run full sync process
const googleStore = useGoogleTasksStore.getState();
const kanbanSync = window.kanbanGoogleSync || await import('./src/services/kanbanGoogleTasksSync').then(m => m.kanbanGoogleSync);

// Step 1: Fetch lists
await googleStore.fetchTaskLists();
console.log('Lists:', googleStore.taskLists);

// Step 2: Fetch all tasks
await googleStore.syncAllTasks();
console.log('Tasks:', googleStore.tasks);

// Step 3: Setup columns
await kanbanSync.setupColumnMappings(false);

// Step 4: Sync to Kanban
await kanbanSync.syncAll();

// Check result
debugTaskState();
```

## 8. Check for Errors
```javascript
// Check for errors in stores
const googleStore = useGoogleTasksStore.getState();
const kanbanStore = useKanbanStore.getState();

console.log('Google Store error:', googleStore.error);
console.log('Kanban Store error:', kanbanStore.error);
```

## 9. Create Test Task
```javascript
// Create a test task
const googleStore = useGoogleTasksStore.getState();
const taskLists = googleStore.taskLists;

if (taskLists.length > 0) {
  const firstList = taskLists[0];
  const newTask = await googleStore.createTask(firstList.id, {
    title: 'Debug Test Task',
    notes: 'Created via console',
    priority: 'high',
    labels: ['test', 'debug']
  });
  console.log('Created task:', newTask);
  
  // Refresh to see it
  await googleStore.fetchTasks(firstList.id);
}
```

## 10. Full Debug State
```javascript
// Run the debug helper
debugTaskState();
```
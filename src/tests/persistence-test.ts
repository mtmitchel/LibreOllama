import { useUnifiedTaskStore } from '../stores/unifiedTaskStore';

export async function testPersistence() {
  console.log('=== Testing Task Persistence ===');
  
  // Get current state
  const store = useUnifiedTaskStore.getState();
  const tasks = store.tasks;
  
  console.log('Current tasks:', Object.keys(tasks).length);
  
  // Log all tasks with their priority
  const priorityStats = { low: 0, normal: 0, high: 0, urgent: 0 };
  Object.values(tasks).forEach(task => {
    priorityStats[task.priority]++;
    if (task.priority !== 'normal') {
      console.log('Task with priority:', {
        id: task.id,
        title: task.title,
        priority: task.priority,
        googleTaskId: task.googleTaskId
      });
    }
  });
  
  console.log('Priority distribution:', priorityStats);
  
  // Check localStorage
  const storedData = localStorage.getItem('unified-task-store');
  if (storedData) {
    const parsed = JSON.parse(storedData);
    console.log('LocalStorage data:', {
      tasksCount: Object.keys(parsed.state?.tasks || {}).length,
      columnsCount: parsed.state?.columns?.length || 0
    });
    
    // Check tasks with priority in localStorage
    const storedTasks = parsed.state?.tasks || {};
    const storedPriorityStats = { low: 0, normal: 0, high: 0, urgent: 0 };
    Object.values(storedTasks).forEach((task: any) => {
      if (task.priority) {
        storedPriorityStats[task.priority]++;
      }
    });
    console.log('Priority distribution in localStorage:', storedPriorityStats);
  } else {
    console.log('No data in localStorage');
  }
  
  console.log('=== End Test ===');
}

export async function testCreateTaskWithPriority() {
  console.log('=== Testing Create Task with Priority ===');
  
  const store = useUnifiedTaskStore.getState();
  const columns = store.columns;
  
  if (columns.length === 0) {
    console.error('No columns available');
    return;
  }
  
  const firstColumn = columns[0];
  const testTaskId = await store.createTask({
    title: 'Test Task with High Priority',
    priority: 'high',
    labels: ['test-label'],
    columnId: firstColumn.id
  });
  
  console.log('Created task ID:', testTaskId);
  
  // Check the created task
  const createdTask = store.tasks[testTaskId];
  console.log('Created task:', {
    id: createdTask.id,
    title: createdTask.title,
    priority: createdTask.priority,
    labels: createdTask.labels,
    googleTaskId: createdTask.googleTaskId
  });
  
  console.log('=== End Test ===');
}

// Export for use in console
(window as any).testPersistence = testPersistence;
(window as any).testCreateTaskWithPriority = testCreateTaskWithPriority;
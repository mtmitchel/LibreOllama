// Test script to create a completed task
window.testCreateCompletedTask = async () => {
  const store = window.useUnifiedTaskStore.getState();
  
  // Get the first column
  const firstColumn = store.columns[0];
  if (!firstColumn) {
    console.error('No columns available');
    return;
  }
  
  console.log('Creating completed task in column:', firstColumn.title);
  
  try {
    // Create a task
    const taskId = await store.createTask({
      title: 'Test Completed Task - ' + new Date().toLocaleTimeString(),
      notes: 'This is a test task that will be marked as completed',
      columnId: firstColumn.id,
      priority: 'normal',
      labels: ['test']
    });
    
    console.log('Created task with ID:', taskId);
    
    // Wait a bit for the task to be created
    setTimeout(async () => {
      // Mark it as completed
      await store.updateTask(taskId, { status: 'completed' });
      console.log('Marked task as completed');
      
      // Check the state
      const newState = store.getState();
      const completedCount = Object.values(newState.tasks).filter(t => t.status === 'completed').length;
      console.log('Total completed tasks:', completedCount);
      console.log('Current showCompleted:', newState.showCompleted);
      
      // Force a re-render by toggling showCompleted twice
      store.setShowCompleted(!newState.showCompleted);
      setTimeout(() => {
        store.setShowCompleted(newState.showCompleted);
      }, 100);
    }, 1000);
  } catch (error) {
    console.error('Failed to create test task:', error);
  }
};

// Also add a function to mark an existing task as completed
window.testMarkFirstTaskCompleted = async () => {
  const store = window.useUnifiedTaskStore.getState();
  const tasks = Object.values(store.tasks);
  const firstIncompleteTask = tasks.find(t => t.status !== 'completed');
  
  if (!firstIncompleteTask) {
    console.error('No incomplete tasks found');
    return;
  }
  
  console.log('Marking task as completed:', firstIncompleteTask.title);
  
  try {
    await store.updateTask(firstIncompleteTask.id, { status: 'completed' });
    console.log('Task marked as completed');
    
    // Check the state
    const newState = store.getState();
    const completedCount = Object.values(newState.tasks).filter(t => t.status === 'completed').length;
    console.log('Total completed tasks:', completedCount);
    console.log('Current showCompleted:', newState.showCompleted);
  } catch (error) {
    console.error('Failed to mark task as completed:', error);
  }
};

// Expose to window
window.testCreateCompletedTask = testCreateCompletedTask;
window.testMarkFirstTaskCompleted = testMarkFirstTaskCompleted;
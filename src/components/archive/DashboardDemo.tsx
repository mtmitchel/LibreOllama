import { DashboardScreen } from './screens/DashboardScreen';
import type { TaskItem, ChatSession, Item } from '../lib/types';

// Sample data for demonstration
const sampleTasks: TaskItem[] = [
  {
    id: '1',
    title: 'Complete UI migration documentation',
    status: 'todo',
    priority: 'high',
    dueDate: new Date().toISOString(),
    estimatedMinutes: 120,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Review chat interface components',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    estimatedMinutes: 60,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: '3',
    title: 'Test new button variants',
    status: 'done',
    priority: 'low',
    dueDate: new Date(Date.now() - 86400000).toISOString(), // Yesterday
    estimatedMinutes: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleNotes: Item[] = [
  {
    id: '1',
    name: 'Migration Notes',
    content: 'Key points about the UI migration process...',
    type: 'note',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const sampleChats: ChatSession[] = [
  {
    id: '1',
    title: 'Design System Discussion',
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    pinned: false
  }
];

export interface DashboardDemoProps {
  onNavigateToWorkflow?: (workflow: string) => void;
  className?: string;
}

export function DashboardDemo({ 
  onNavigateToWorkflow,
  className 
}: DashboardDemoProps) {
  const handleTaskCreate = (task: Partial<TaskItem>) => {
    console.log('Creating task:', task);
    // In a real implementation, this would integrate with the task management system
  };

  const handleTaskUpdate = (taskId: string, updates: Partial<TaskItem>) => {
    console.log('Updating task:', taskId, updates);
    // In a real implementation, this would update the task in the system
  };

  const handleNavigateToWorkflow = (workflow: string) => {
    console.log('Navigating to workflow:', workflow);
    onNavigateToWorkflow?.(workflow);
  };

  return (
    <DashboardScreen
      notes={sampleNotes}
      tasks={sampleTasks}
      chats={sampleChats}
      onTaskCreate={handleTaskCreate}
      onTaskUpdate={handleTaskUpdate}
      onNavigateToWorkflow={handleNavigateToWorkflow}
      className={className}
    />
  );
}
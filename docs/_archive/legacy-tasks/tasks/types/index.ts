import { GoogleTask, HierarchicalTask, EnhancedGoogleTask } from '../../../types/google';

export interface DragState {
  activeTask: HierarchicalTask | null;
  sourceListId: string | null;
}

export interface TaskContextMenu {
  isOpen: boolean;
  taskId: string | null;
  taskListId: string | null;
  x: number;
  y: number;
}

export interface SortableTaskItemProps {
  task: GoogleTask;
  listId: string;
  onTaskClick: (task: GoogleTask, listId: string) => void;
  onToggleCompletion: (taskListId: string, taskId: string, currentStatus: 'needsAction' | 'completed') => void;
  onDeleteTask: (e: React.MouseEvent, taskListId: string, taskId: string) => void;
  isDragStarted: boolean;
  onRetrySync?: (taskId: string) => void;
}

export interface DroppableColumnProps {
  children: React.ReactNode;
  id: string;
  className?: string;
}

export interface TaskModalState {
  type: 'edit' | 'archive' | 'delete' | 'create' | null;
  columnId: string | null;
  columnTitle: string | null;
  isOpen: boolean;
  task?: EnhancedGoogleTask | null;
}

export interface TaskFormData {
  title: string;
  notes: string;
  due: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  parent?: string;
  position?: string;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate: string;
  };
  labels?: string[];
  subtasks?: Array<{
    id: string;
    title: string;
    completed: boolean;
    due: string;
  }>;
}

export interface StatusBadge {
  text: string;
  color: string;
  textColor: string;
}

// Re-export from Google types
export type { GoogleTask, GoogleTaskList, HierarchicalTask, TaskCreateData, EnhancedGoogleTask } from '../../../types/google'; 
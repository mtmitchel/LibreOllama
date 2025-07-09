import type { GoogleTask, StatusBadge } from '../types';
import { useTaskMetadataStore } from '../../../stores/taskMetadataStore';

export const isTaskOverdue = (task: GoogleTask): boolean => {
  if (!task.due) return false;
  const dueDate = new Date(task.due);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today && task.status === 'needsAction';
};

export const formatDueDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
};

export const getStatusBadge = (task: GoogleTask): StatusBadge | null => {
  const isCompleted = task.status === 'completed';
  const isOverdue = isTaskOverdue(task) && !isCompleted;
  const isDueToday = task.due && new Date(task.due).toDateString() === new Date().toDateString();
  
  if (isCompleted) return { text: 'Complete', color: 'bg-green-100 text-green-800', textColor: '#155724' };
  if (isOverdue) return { text: 'Overdue', color: 'bg-red-100 text-red-800', textColor: '#721c24' };
  if (isDueToday) return { text: 'Due today', color: 'bg-orange-100 text-orange-800', textColor: '#9c4221' };
  return null;
};

export const parseEnhancedTaskData = (notes: string) => {
  const libreOllamaPattern = /\[LibreOllama:(.+?)\]$/;
  const match = notes.match(libreOllamaPattern);
  if (match) {
    try {
      return JSON.parse(match[1]);
    } catch (e) {
      return {};
    }
  }
  return {};
};

export const cleanTaskNotes = (notes: string): string => {
  return notes ? notes.replace(/\[LibreOllama:(.+?)\]$/, '').trim() : '';
};

export const encodeEnhancedTaskData = (data: any): string => {
  return `[LibreOllama:${JSON.stringify(data)}]`;
};

export const getSubtaskData = (task: GoogleTask) => {
  const subtaskCount = (task as any).children?.length || 0;
  const completedSubtasks = (task as any).children?.filter((child: any) => child.status === 'completed').length || 0;
  const hasSubtasks = subtaskCount > 0;
  
  return { subtaskCount, completedSubtasks, hasSubtasks };
};

// Enhanced task data helpers using metadata store
export const getTaskMetadata = (taskId: string) => {
  const metadataStore = useTaskMetadataStore.getState();
  return metadataStore.getTaskMetadata(taskId);
};

export const setTaskMetadata = (taskId: string, metadata: any) => {
  const metadataStore = useTaskMetadataStore.getState();
  metadataStore.setTaskMetadata(taskId, metadata);
};

export const syncTaskMetadata = (task: GoogleTask) => {
  const metadataStore = useTaskMetadataStore.getState();
  
  // Import existing metadata from notes field if present
  if (task.notes) {
    metadataStore.importFromNotesField(task.id, task.notes);
  }
  
  return metadataStore.getTaskMetadata(task.id);
};

export const prepareTaskForAPI = (taskId: string, taskData: any) => {
  const metadataStore = useTaskMetadataStore.getState();
  const metadata = metadataStore.getTaskMetadata(taskId);
  
  if (metadata) {
    // Export metadata to notes field for API compatibility
    const metadataString = metadataStore.exportToNotesField(taskId);
    const cleanNotes = taskData.notes ? cleanTaskNotes(taskData.notes) : '';
    
    return {
      ...taskData,
      notes: cleanNotes + (metadataString ? ` ${metadataString}` : '')
    };
  }
  
  return taskData;
}; 

// Throttle function for performance optimization
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func.apply(null, args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      timeoutId = setTimeout(() => {
        func.apply(null, args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}

// Debounce function for performance optimization
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
}

// Optimized drag state manager
export class DragStateManager {
  private static instance: DragStateManager;
  private dragStartTime: number = 0;
  private isDragging: boolean = false;
  
  static getInstance(): DragStateManager {
    if (!DragStateManager.instance) {
      DragStateManager.instance = new DragStateManager();
    }
    return DragStateManager.instance;
  }
  
  startDrag(): void {
    this.isDragging = true;
    this.dragStartTime = performance.now();
  }
  
  endDrag(): number {
    this.isDragging = false;
    return performance.now() - this.dragStartTime;
  }
  
  isDragActive(): boolean {
    return this.isDragging;
  }
} 
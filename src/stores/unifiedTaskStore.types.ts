export type TaskSyncState =
  | 'synced'          // In sync with Google
  | 'pending_create'  // Created locally, waiting for Google ID
  | 'pending_update'  // Updated locally, waiting to sync
  | 'pending_delete'  // Deleted locally, waiting to sync
  | 'error';          // Sync failed

export interface UnifiedTask {
  // Stable Local ID - NEVER changes
  readonly id: string; // e.g., `local-task-${uuid}`
  
  // Google Task Fields
  googleTaskId?: string;
  googleTaskListId?: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  updated: string; // ISO timestamp
  position: string;
  parent?: string; // For subtasks
  
  // Custom Metadata (not in Google)
  labels: Array<{
    name: string;
    color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray';
  }>;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  recurring?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval?: number; // e.g., every 2 weeks
    endDate?: string; // ISO date string
  };
  
  // UI & Sync State
  columnId: string;
  syncState: TaskSyncState;
  lastSyncError?: string;
  lastLocalUpdate?: string; // Track local changes separately
  
  // Optimistic updates tracking
  optimisticDelete?: boolean;
  previousState?: Partial<UnifiedTask>; // For rollback on error
  
  // Sync tracking
  lastSyncTime?: string; // When the task was last synced with Google
}

export interface TaskColumn {
  id: string;
  title: string;
  googleTaskListId?: string;
  taskIds: string[]; // Array of task IDs in order
}

export interface UnifiedTaskState {
  // All tasks indexed by stable local ID
  tasks: Record<string, UnifiedTask>;
  
  // Columns with task ordering
  columns: TaskColumn[];
  
  // Sync metadata
  lastSyncTime?: string;
  isSyncing: boolean;
  syncErrors: Record<string, string>; // taskId -> error message
}

// Helper type for task creation
export interface CreateTaskInput {
  title: string;
  columnId: string;
  labels?: Array<{
    name: string;
    color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray';
  }>;
  priority?: UnifiedTask['priority'];
  notes?: string;
  due?: string;
  googleTaskListId?: string;
}

// Helper type for updates
export type UpdateTaskInput = Partial<Omit<UnifiedTask, 'id' | 'syncState'>>;
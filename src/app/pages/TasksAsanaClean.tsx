import React, { useEffect, useState, useRef, useCallback, useMemo, memo } from 'react';
import { KanbanBoard } from '../../components/kanban';
import { TaskListView } from '../../components/kanban/TaskListView';
import { useHeader } from '../contexts/HeaderContext';
import { Button } from '../../components/ui';
import './styles/TasksAsanaClean.css';
import { 
  LayoutGrid, List, RefreshCw, Plus, Search, X, ArrowUpDown, ChevronDown, 
  GripVertical, Calendar, Type, MoreHorizontal, CheckCircle2, MessageSquare, Circle,
  Edit, Edit2, Trash2, Copy, Tag, Clock, Flag, RotateCcw
} from 'lucide-react';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { realtimeSync } from '../../services/realtimeSync';
import { googleTasksService } from '../../services/google/googleTasksService';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  closestCorners,
  useDraggable,
  useDroppable,
} from "@dnd-kit/core";
import { restrictToWindowEdges } from "@dnd-kit/modifiers";

type ViewMode = 'kanban' | 'list';


// Asana-style typography
const asanaTypography = {
  fontFamily: "var(--font-sans)",
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    color: '#151B26'
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.4,
    color: '#151B26'
  },
  h3: {
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.5,
    color: '#151B26'
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0',
    color: '#6B6F76'
  },
  small: {
    fontSize: '12px',
    fontWeight: 400,
    lineHeight: 1.5,
    letterSpacing: '0',
    color: '#9CA6AF'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    color: '#6B6F76'
  }
};

// Asana-style pastel colors
const priorityConfig = {
  urgent: {
    bgColor: '#FFE5E5',
    textColor: '#D32F2F',
    label: 'Urgent'
  },
  high: { 
    bgColor: '#FFEEF0',
    textColor: '#E85D75',
    label: 'High'
  },
  medium: { 
    bgColor: '#FFF6E6',
    textColor: '#E68900',
    label: 'Medium'
  },
  low: { 
    bgColor: '#E8F5F3',
    textColor: '#14A085',
    label: 'Low'
  }
};

// Subtask interface
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

// Asana Task Modal Component
interface AsanaTaskModalProps {
  isOpen: boolean;
  task: UnifiedTask | null;
  columnId: string;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (data: Partial<UnifiedTask>, metadata: { labels: string[], priority: string }) => void;
  onDelete?: () => void;
}

const AsanaTaskModal: React.FC<AsanaTaskModalProps> = ({
  isOpen,
  task,
  columnId,
  mode,
  onClose,
  onSubmit,
  onDelete
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    labels: [] as string[],
    subtasks: [] as Subtask[],
  });

  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
        priority: task.priority || 'normal',
        labels: task.labels || [],
        subtasks: task.attachments?.filter(a => a.type === 'subtask') || [],
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        due: '',
        priority: 'normal',
        labels: [],
        subtasks: [],
      });
    }
  }, [task, isOpen]);

  const addLabel = () => {
    if (newLabel.trim() && !formData.labels.includes(newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, newLabel.trim()]
      }));
      setNewLabel('');
    }
  };

  const removeLabel = (labelToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(label => label !== labelToRemove)
    }));
  };

  const addSubtask = () => {
    if (newSubtask.trim()) {
      setFormData(prev => ({
        ...prev,
        subtasks: [...prev.subtasks, {
          id: `subtask-${Date.now()}`,
          title: newSubtask.trim(),
          completed: false,
        }]
      }));
      setNewSubtask('');
    }
  };

  const toggleSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.map(st => 
        st.id === subtaskId ? { ...st, completed: !st.completed } : st
      )
    }));
  };

  const removeSubtask = (subtaskId: string) => {
    setFormData(prev => ({
      ...prev,
      subtasks: prev.subtasks.filter(st => st.id !== subtaskId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert date picker value to proper ISO string  
    const formattedDue = formData.due 
      ? new Date(formData.due + 'T00:00:00').toISOString()
      : undefined;
      
    const taskData: Partial<UnifiedTask> = {
      ...task,
      title: formData.title,
      notes: formData.notes,
      due: formattedDue,
    };

    const metadata = {
      priority: formData.priority,
      labels: formData.labels,
      subtasks: formData.subtasks,
    };

    onSubmit(taskData, metadata);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white rounded-2xl shadow-2xl">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-5">
            <div className="flex items-center justify-between">
              <h2 style={asanaTypography.h1}>
                {mode === 'create' ? 'Create Task' : 'Edit Task'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            {/* Title */}
            <div>
              <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                Title
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="task-modal-input"
                style={asanaTypography.body}
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Notes */}
            <div>
              <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="task-modal-textarea"
                style={asanaTypography.body}
                placeholder="Add a description..."
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-5">
              {/* Due Date */}
              <div>
                <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.due}
                  onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                  className="task-modal-input"
                  style={asanaTypography.body}
                />
              </div>

              {/* Priority */}
              <div>
                <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent' }))}
                  className="task-modal-select"
                  style={asanaTypography.body}
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Labels */}
            <div>
              <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                Labels
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    className="task-modal-input flex-1"
                    style={asanaTypography.body}
                    placeholder="Add a label..."
                  />
                  <button
                    type="button"
                    onClick={addLabel}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: '#E8F5F3',
                      color: '#14A085'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D0EDE9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8F5F3';
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {formData.labels.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {formData.labels.map(label => (
                      <span
                        key={label}
                        className="px-3 py-1.5 rounded-lg inline-flex items-center gap-2 transition-all"
                        style={{ 
                          ...asanaTypography.small,
                          backgroundColor: '#EDF1F5',
                          color: '#796EFF'
                        }}
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label style={{ ...asanaTypography.label, display: 'block', marginBottom: '6px' }}>
                Subtasks
              </label>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    className="flex-1 px-4 py-2 rounded-xl border transition-all"
                    style={{ 
                      ...asanaTypography.body,
                      backgroundColor: '#F6F7F8',
                      borderColor: 'transparent',
                      outline: 'none'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#D1D5DB';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = '#F6F7F8';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                    placeholder="Add a subtask..."
                  />
                  <button
                    type="button"
                    onClick={addSubtask}
                    className="px-4 py-2 rounded-xl transition-colors"
                    style={{ 
                      backgroundColor: '#E8F5F3',
                      color: '#14A085'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#D0EDE9';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8F5F3';
                    }}
                  >
                    <Plus size={18} />
                  </button>
                </div>
                {formData.subtasks.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {formData.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-3 p-3 rounded-xl transition-all"
                        style={{ backgroundColor: '#F9FAFB' }}
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className="flex-shrink-0"
                        >
                          {subtask.completed ? (
                            <CheckCircle2 size={20} style={{ color: '#14A085' }} />
                          ) : (
                            <Circle size={20} style={{ color: '#DDD' }} />
                          )}
                        </button>
                        <span 
                          className="flex-1"
                          style={{ 
                            ...asanaTypography.body,
                            textDecoration: subtask.completed ? 'line-through' : 'none',
                            color: subtask.completed ? '#9CA3AF' : '#151B26'
                          }}
                        >
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                        >
                          <X size={16} style={{ color: '#9CA3AF' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6" style={{ borderTop: '1px solid #E8E8E9' }}>
            <div>
              {mode === 'edit' && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                  style={{ 
                    color: '#D32F2F'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#FFE5E5';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                >
                  <Trash2 size={16} />
                  Delete
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl transition-colors"
                style={{ 
                  ...asanaTypography.body,
                  backgroundColor: '#F6F7F8',
                  color: '#6B6F76',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#E8E9EA';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#F6F7F8';
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl transition-all"
                style={{ 
                  ...asanaTypography.body,
                  backgroundColor: '#796EFF',
                  color: '#FFFFFF',
                  fontWeight: 500
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#6B5FE6';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#796EFF';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {mode === 'create' ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function TasksAsanaClean() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [viewMode, setViewMode] = useState<ViewMode>('kanban');
  const [isSyncing, setIsSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewListDialog, setShowNewListDialog] = useState(false);
  const [newListTitle, setNewListTitle] = useState('');
  const [isCreatingList, setIsCreatingList] = useState(false);
  const [showDeleteListDialog, setShowDeleteListDialog] = useState(false);
  const [listToDelete, setListToDelete] = useState<{ id: string; title: string } | null>(null);
  const [selectedListId, setSelectedListId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'created' | 'due' | 'title'>('created');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [activeTask, setActiveTask] = useState<UnifiedTask | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: UnifiedTask; columnId: string } | null>(null);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTaskData, setEditingTaskData] = useState<UnifiedTask | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<'create' | 'edit'>('create');
  
  // Google auth state from settings
  const activeAccount = useActiveGoogleAccount();
  const isAuthenticated = !!activeAccount;
  const isHydrated = true; // Unified store is always hydrated
  
  // Google Tasks API operations
  const fetchTaskLists = async () => {
    if (!activeAccount) return [];
    const response = await googleTasksService.getTaskLists(activeAccount as any);
    return response.success ? response.data || [] : [];
  };
  
  const syncAllTasks = async () => {
    await realtimeSync.syncNow();
  };
  
  const createTaskList = async (title: string) => {
    if (!activeAccount) throw new Error('No active account');
    const response = await googleTasksService.createTaskList(activeAccount as any, title);
    if (!response.success) throw new Error(response.error?.message || 'Failed to create task list');
    return response.data;
  };
  
  const updateTaskList = async (listId: string, title: string) => {
    if (!activeAccount) throw new Error('No active account');
    const response = await googleTasksService.updateTaskList(activeAccount as any, listId, title);
    if (!response.success) throw new Error(response.error?.message || 'Failed to update task list');
    return response.data;
  };
  
  const deleteTaskList = async (listId: string) => {
    if (!activeAccount) throw new Error('No active account');
    const response = await googleTasksService.deleteTaskList(activeAccount as any, listId);
    if (!response.success) throw new Error(response.error?.message || 'Failed to delete task list');
    return response.data;
  };
  
  // Get data from unified store
  const {
    columns,
    getTasksByColumn,
    createTask: createUnifiedTask,
    updateTask: updateUnifiedTask,
    deleteTask: deleteUnifiedTask,
    moveTask: moveUnifiedTask,
  } = useUnifiedTaskStore();
  
  // Transform columns to old format for compatibility
  const kanbanColumns = useMemo(() => {
    console.log('[TasksAsanaClean] Building kanban columns:', {
      columnsCount: columns.length,
      columns: columns.map(c => ({ 
        id: c.id, 
        title: c.title, 
        googleTaskListId: c.googleTaskListId,
        taskIdsCount: c.taskIds?.length || 0 
      }))
    });
    
    const result = columns.map(column => {
      const tasks = getTasksByColumn(column.id);
      console.log(`[TasksAsanaClean] Column "${column.title}" (ID: ${column.id}, googleTaskListId: ${column.googleTaskListId}) has ${tasks.length} tasks`, {
        columnId: column.id,
        googleTaskListId: column.googleTaskListId,
        taskIds: column.taskIds,
        tasksReturned: tasks.map(t => ({ id: t.id, title: t.title, googleTaskId: t.googleTaskId }))
      });
      return {
        id: column.id,
        title: column.title,
        tasks,
        isLoading: false,
        error: undefined,
      };
    });
    
    return result;
  }, [columns, getTasksByColumn]);
  
  // Configure drag sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  // Handle drag start
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const taskId = active.id as string;

      for (const column of columns) {
        const task = column.tasks.find((t) => t.id === taskId);
        if (task) {
          setActiveTask(task);
          setActiveColumn(column.id);
          break;
        }
      }
    },
    [columns]
  );

  // Handle drag end
  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event;

      setActiveTask(null);
      setActiveColumn(null);

      if (!over || !activeColumn) return;

      const taskId = active.id as string;
      const overId = over.id as string;

      let targetColumnId: string;

      if (overId.startsWith("column-")) {
        targetColumnId = overId.replace("column-", "");
      } else {
        const targetColumn = kanbanColumns.find((col) =>
          col.tasks.some((task) => task.id === overId)
        );
        if (!targetColumn) return;
        targetColumnId = targetColumn.id;
      }

      if (activeColumn !== targetColumnId) {
        try {
          await moveUnifiedTask(taskId, targetColumnId);
        } catch (error) {
          console.error('Failed to move task:', error);
        }
      }
    },
    [activeColumn, columns, moveUnifiedTask]
  );

  // Handle drag cancel
  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
    setActiveColumn(null);
  }, []);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false);
      }
      if (contextMenu && !(event.target as Element).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    
    if (showSortMenu || contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showSortMenu, contextMenu]);

  // Clear header on mount
  useEffect(() => {
    clearHeaderProps();
    
    // Initialize sync service
    realtimeSync.initialize().catch(console.error);
    
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Auto-sync when account changes
  useEffect(() => {
    if (activeAccount) {
      // Trigger initial sync to load all task data
      handleSync();
    }
  }, [activeAccount]);
  
  // Debug: Log current state and provide diagnostic info
  useEffect(() => {
    const state = useUnifiedTaskStore.getState();
    const diagnostics = {
      activeAccount: activeAccount?.email,
      isAuthenticated,
      columnsCount: columns.length,
      columns: columns.map(c => ({
        id: c.id,
        title: c.title,
        googleTaskListId: c.googleTaskListId,
        taskIds: c.taskIds?.length || 0,
        taskIdsArray: c.taskIds?.slice(0, 3) || [] // Show first 3 task IDs
      })),
      totalTasksInStore: Object.keys(state.tasks).length,
      tasksPerColumn: columns.map(c => ({
        columnId: c.id,
        taskCount: getTasksByColumn(c.id).length
      })),
      sampleTasks: Object.values(state.tasks).slice(0, 3).map(t => ({
        id: t.id,
        title: t.title,
        columnId: t.columnId,
        googleTaskId: t.googleTaskId,
        googleTaskListId: t.googleTaskListId
      }))
    };
    
    console.log('[TasksAsanaClean] Diagnostic info:', diagnostics);
    
    // If we have tasks in store but not showing, log warning
    if (Object.keys(state.tasks).length > 0 && columns.every(c => getTasksByColumn(c.id).length === 0)) {
      console.error('[TasksAsanaClean] CRITICAL: Tasks exist in store but not showing in any column!');
      
      // Additional debugging for the critical issue
      console.error('[TasksAsanaClean] DEBUGGING CRITICAL ISSUE:');
      console.error('- Total tasks in store:', Object.keys(state.tasks).length);
      console.error('- Columns:', state.columns.map(c => ({
        id: c.id,
        title: c.title,
        googleTaskListId: c.googleTaskListId,
        taskIdsCount: c.taskIds.length
      })));
      console.error('- Sample tasks:', Object.values(state.tasks).slice(0, 5).map(t => ({
        id: t.id,
        title: t.title,
        columnId: t.columnId,
        googleTaskListId: t.googleTaskListId
      })));
      
      // Check if tasks have columnId that doesn't match any column
      const tasksWithInvalidColumnId = Object.values(state.tasks).filter(t => 
        !state.columns.find(c => c.id === t.columnId)
      );
      if (tasksWithInvalidColumnId.length > 0) {
        console.error('- Tasks with invalid columnId:', tasksWithInvalidColumnId.slice(0, 3));
      }
    }
  }, [activeAccount, isAuthenticated, columns, getTasksByColumn]);

  // Setup Google Tasks sync is now handled by realtimeSync service

  // Persist view mode
  useEffect(() => {
    const savedViewMode = localStorage.getItem('tasks-view-mode') as ViewMode;
    if (savedViewMode && (savedViewMode === 'kanban' || savedViewMode === 'list')) {
      setViewMode(savedViewMode);
    }
  }, []);

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    localStorage.setItem('tasks-view-mode', mode);
  };

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      console.log('=== MANUAL SYNC STARTING ===');
      await realtimeSync.syncNow();
      console.log('=== MANUAL SYNC COMPLETE ===');
      
      // Log post-sync state
      const state = useUnifiedTaskStore.getState();
      console.log('[TasksAsanaClean] Post-sync state:', {
        totalTasks: Object.keys(state.tasks).length,
        columns: state.columns.map(c => ({
          id: c.id,
          title: c.title,
          googleTaskListId: c.googleTaskListId,
          taskCount: c.taskIds.length,
          taskIds: c.taskIds,
          actualTasks: state.getTasksByColumn(c.id).map(t => ({
            id: t.id,
            title: t.title,
            syncState: t.syncState,
            googleTaskId: t.googleTaskId
          }))
        })),
        allTasks: Object.values(state.tasks).map(t => ({
          id: t.id,
          title: t.title,
          columnId: t.columnId,
          syncState: t.syncState,
          googleTaskId: t.googleTaskId
        }))
      });
    } catch (error) {
      console.error('Sync failed:', error);
      alert('Failed to sync tasks. Please check your Google account permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleResetColumns = async () => {
    if (!confirm('This will clear all existing columns and recreate them from Google Task lists. Continue?')) {
      return;
    }
    
    setIsSyncing(true);
    try {
      console.log('=== RESETTING COLUMNS ===');
      
      // Clear all existing columns
      const state = useUnifiedTaskStore.getState();
      state.columns.forEach(column => {
        state.deleteColumn(column.id);
      });
      
      // Trigger a fresh sync
      await realtimeSync.syncNow();
      console.log('=== COLUMN RESET COMPLETE ===');
    } catch (error) {
      console.error('Column reset failed:', error);
      alert('Failed to reset columns. Please try again.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTestSync = async () => {
    setIsSyncing(true);
    try {
      console.log('=== TEST SYNC STARTING ===');
      
      // Create a test task
      const testTaskId = createUnifiedTask({
        columnId: columns[0]?.id || '',
        title: `Test Task ${Date.now()}`,
        notes: 'This is a test task to verify sync',
        labels: ['test'],
        priority: 'high',
      });
      
      console.log('Created test task:', testTaskId);
      
      // Immediately check the task's sync state
      const state = useUnifiedTaskStore.getState();
      const testTask = state.tasks[testTaskId];
      console.log('Test task immediately after creation:', {
        id: testTask?.id,
        title: testTask?.title,
        syncState: testTask?.syncState,
        columnId: testTask?.columnId,
        googleTaskListId: testTask?.googleTaskListId
      });
      
      // Check if there are any pending tasks
      const pendingTasks = state.getPendingTasks();
      console.log('Pending tasks after creation:', pendingTasks.length);
      console.log('Pending tasks details:', pendingTasks.map(t => ({
        id: t.id,
        title: t.title,
        syncState: t.syncState
      })));
      
      // Wait a moment for the subscription to trigger
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Manually trigger sync
      await realtimeSync.syncNow();
      
      console.log('=== TEST SYNC COMPLETE ===');
      
      // Check if task was synced
      const finalState = useUnifiedTaskStore.getState();
      const finalTestTask = finalState.tasks[testTaskId];
      console.log('Test task after sync:', {
        id: finalTestTask?.id,
        title: finalTestTask?.title,
        syncState: finalTestTask?.syncState,
        googleTaskId: finalTestTask?.googleTaskId
      });
      
    } catch (error) {
      console.error('Test sync failed:', error);
      alert('Test sync failed. Check console for details.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleCreateList = async () => {
    if (!newListTitle.trim()) return;
    
    setIsCreatingList(true);
    try {
      await createTaskList(newListTitle.trim());
      setNewListTitle("");
      setShowNewListDialog(false);
      
      // Sync with unified store
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Failed to create task list:', error);
      alert('Failed to create task list. Please try again.');
    } finally {
      setIsCreatingList(false);
    }
  };

  const handleRenameList = async (listId: string, newTitle: string) => {
    try {
      await updateTaskList(listId, newTitle);
      await realtimeSync.syncNow();
    } catch (error) {
      console.error('Failed to rename task list:', error);
    }
  };

  const handleDeleteList = async () => {
    if (listToDelete) {
      try {
        await deleteTaskList(listToDelete.id);
        await realtimeSync.syncNow();
        setShowDeleteListDialog(false);
        setListToDelete(null);
      } catch (error) {
        console.error('Failed to delete task list:', error);
      }
    }
  };

  const openDeleteListDialog = (listId: string, listTitle: string) => {
    setListToDelete({ id: listId, title: listTitle });
    setShowDeleteListDialog(true);
  };

  const openCreateTaskModal = (columnId: string) => {
    
    const newTaskData = {
      id: `temp-${Date.now()}`,
      title: '',
      notes: '',
      due: '',
      status: 'needsAction' as const,
      position: '',
      updated: new Date().toISOString(),
      metadata: {
        labels: [],
        priority: 'normal' as const,
        subtasks: []
      }
    };
    
    console.log('Setting task data:', newTaskData);
    setEditingTaskData(newTaskData);
    setTaskModalMode('create');
    setActiveColumn(columnId);
    setShowTaskModal(true);
    console.log('Modal should be visible now');
  };

  const openEditTaskModal = (task: UnifiedTask, columnId: string) => {
    setEditingTaskData(task);
    setTaskModalMode('edit');
    setActiveColumn(columnId);
    setShowTaskModal(true);
  };

  return (
    <div className="flex h-full flex-col" style={{ backgroundColor: '#FAFBFC' }}>
      {/* Header Controls */}
      <div className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
        <div className="flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              if (!isAuthenticated) {
                alert('Please connect your Google account in Settings to create task lists.');
                return;
              }
              setShowNewListDialog(true);
            }}
            className="flex items-center gap-2 px-4 py-2"
            disabled={!isAuthenticated}
          >
            <Plus size={16} />
            New List
          </Button>
          
          {isSyncing && (
            <div className="flex items-center gap-2 rounded-full bg-accent-soft px-3 py-1.5 text-sm text-muted">
              <RefreshCw size={14} className="animate-spin" />
              <span>Syncing tasks...</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Search Bar */}
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
            <input
              type="search"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-md outline-none transition-all"
              style={{ 
                fontSize: '14px',
                backgroundColor: '#F6F7F8',
                border: '1px solid transparent',
                width: '240px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#D1D5DB';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 size-6 -translate-y-1/2"
                onClick={() => setSearchQuery('')}
              >
                <X size={12} />
              </Button>
            )}
          </div>
          
          {/* List View Controls */}
          {viewMode === 'list' && (
            <>
              <span className="rounded-full bg-card px-3 py-1.5 text-sm font-medium text-secondary">
                {columns.flatMap(c => c.tasks).filter(task => 
                  selectedListId === 'all' || columns.find(c => c.id === selectedListId)?.tasks.includes(task)
                ).length} tasks
              </span>
              
              <div className="relative">
                <select
                  value={selectedListId}
                  onChange={(e) => setSelectedListId(e.target.value)}
                  className="border-border-default focus:ring-primary/20 h-8 cursor-pointer appearance-none rounded-lg border bg-card pl-3 pr-8 text-sm text-primary transition-colors focus:border-primary focus:outline-none focus:ring-2"
                >
                  <option value="all">All lists</option>
                  {columns.map(column => (
                    <option key={column.id} value={column.id}>{column.title}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-secondary" />
              </div>
              
              <div className="relative" ref={sortMenuRef}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex h-8 items-center gap-2 px-3 hover:bg-tertiary"
                  onClick={() => setShowSortMenu(!showSortMenu)}
                >
                  <ArrowUpDown size={14} />
                  <span className="text-sm">Sort</span>
                </Button>
                
                {showSortMenu && (
                  <div className="border-border-default absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border bg-card shadow-lg">
                    <button
                      onClick={() => {
                        setSortBy('created');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm first:rounded-t-lg hover:bg-tertiary ${
                        sortBy === 'created' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <GripVertical size={14} className="mr-2" />
                      Date created
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('due');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm hover:bg-tertiary ${
                        sortBy === 'due' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <Calendar size={14} className="mr-2" />
                      Due date
                    </button>
                    <button
                      onClick={() => {
                        setSortBy('title');
                        setShowSortMenu(false);
                      }}
                      className={`flex w-full items-center px-3 py-2 text-sm last:rounded-b-lg hover:bg-tertiary ${
                        sortBy === 'title' ? 'bg-accent-soft' : ''
                      }`}
                    >
                      <Type size={14} className="mr-2" />
                      Title
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2"
          >
            <RefreshCw size={16} className={isSyncing ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleResetColumns}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2"
            title="Reset columns and sync from Google"
          >
            <RotateCcw size={16} />
            <span className="hidden sm:inline">Reset</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleTestSync}
            disabled={isSyncing}
            className="flex items-center gap-2 px-3 py-2"
            title="Create a test task to verify sync"
          >
            <Plus size={16} />
            <span className="hidden sm:inline">Test Sync</span>
          </Button>
          
          <div className="flex items-center gap-1 rounded-lg bg-tertiary p-1">
            <Button
              variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('kanban')}
              className="flex items-center gap-2 px-3 py-2"
            >
              <LayoutGrid size={16} />
              <span className="hidden sm:inline">Kanban</span>
            </Button>
            <Button
              variant={viewMode === 'list' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => handleViewModeChange('list')}
              className="flex items-center gap-2 px-3 py-2"
            >
              <List size={16} />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
        </div>
      </div>

      {/* View Content */}
      <div className="flex-1 overflow-hidden">
        {viewMode === 'kanban' ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
            modifiers={[restrictToWindowEdges]}
          >
            <AsanaKanbanBoard 
              searchQuery={searchQuery}
              onDeleteList={openDeleteListDialog}
              onRenameList={handleRenameList}
              activeTask={activeTask}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              openEditTaskModal={openEditTaskModal}
              openCreateTaskModal={openCreateTaskModal}
            />
            <DragOverlay>
              {activeTask && (
                <div
                  className="p-5 bg-white cursor-move opacity-90"
                  style={{ 
                    borderRadius: '18px',
                    boxShadow: '0 8px 32px rgba(50, 50, 93, 0.25)',
                    border: 'none',
                    width: '320px'
                  }}
                >
                  <h4 style={asanaTypography.h3}>{activeTask.title}</h4>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        ) : (
          <TaskListView 
            className="h-full" 
            searchQuery={searchQuery}
            showHeader={false}
            selectedListId={selectedListId}
            sortBy={sortBy}
            onEditTask={(task, columnId) => openEditTaskModal(task, columnId)}
          />
        )}
      </div>

      {/* Sync Status */}
      {isAuthenticated && (
        <div className="px-6 pb-2 text-center text-xs text-gray-500">
          Connected to Google Tasks • Auto-sync enabled
        </div>
      )}

      {/* New List Dialog */}
      {showNewListDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border-default w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary">Create New Task List</h3>
              <p className="mb-4 text-sm text-muted">Give your task list a descriptive name to help organize your work.</p>
              
              <div className="space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-medium text-secondary">
                    List name
                  </label>
                  <input
                    type="text"
                    value={newListTitle}
                    onChange={(e) => setNewListTitle(e.target.value)}
                    placeholder="e.g., Personal Tasks, Work Projects, Shopping..."
                    className="border-border-default focus:ring-primary/20 w-full rounded-lg border px-4 py-3 transition-colors focus:border-primary focus:outline-none focus:ring-2"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreateList();
                      } else if (e.key === 'Escape') {
                        setShowNewListDialog(false);
                        setNewListTitle("");
                      }
                    }}
                  />
                </div>
                
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setShowNewListDialog(false);
                      setNewListTitle("");
                    }}
                    className="px-4 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleCreateList}
                    disabled={!newListTitle.trim() || isCreatingList}
                    className="px-4 py-2"
                  >
                    {isCreatingList ? (
                      <>
                        <RefreshCw size={14} className="mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create List'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete List Dialog */}
      {showDeleteListDialog && listToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="border-border-default w-full max-w-md rounded-xl border bg-card shadow-2xl">
            <div className="p-6">
              <h3 className="mb-2 text-lg font-semibold text-primary">Delete Task List</h3>
              <p className="mb-4 text-sm text-muted">
                Are you sure you want to delete "{listToDelete.title}"? This action cannot be undone and all tasks in this list will be permanently removed.
              </p>
              
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowDeleteListDialog(false);
                    setListToDelete(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleDeleteList}
                >
                  Delete List
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Task Modal */}
      {/* console.log('=== MODAL RENDER CHECK ===', {
        showTaskModal,
        editingTaskData,
        shouldRender: showTaskModal && editingTaskData
      })} */}
      {showTaskModal && editingTaskData && (
        <AsanaTaskModal
          isOpen={showTaskModal}
          task={editingTaskData}
          columnId={activeColumn!}
          mode={taskModalMode}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTaskData(null);
          }}
          onSubmit={async (taskData, metadata) => {
            try {
              if (taskModalMode === 'create' && activeColumn) {
                // Create task with unified store
                const taskId = createUnifiedTask({
                  columnId: activeColumn,
                  title: taskData.title || 'New Task',
                  notes: taskData.notes || '',
                  due: taskData.due,
                  labels: metadata.labels || [],
                  priority: metadata.priority || 'normal',
                });
              } else if (taskModalMode === 'edit' && activeColumn && taskData.id) {
                // Update task with unified store
                updateUnifiedTask(taskData.id, {
                  title: taskData.title,
                  notes: taskData.notes || '',
                  due: taskData.due,
                  status: taskData.status || 'needsAction',
                  labels: metadata.labels || [],
                  priority: metadata.priority || 'normal',
                });
              }
              setShowTaskModal(false);
              setEditingTaskData(null);
            } catch (error) {
              console.error('Failed to save task:', error);
            }
          }}
          onDelete={async () => {
            if (editingTaskData && activeColumn) {
              deleteUnifiedTask(editingTaskData.id);
              setShowTaskModal(false);
              setEditingTaskData(null);
            }
          }}
        />
      )}
    </div>
  );
}

// Asana-style Kanban Board Component
interface AsanaKanbanBoardProps {
  searchQuery?: string;
  onDeleteList?: (listId: string, listTitle: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  activeTask: UnifiedTask | null;
  contextMenu: { x: number; y: number; task: UnifiedTask; columnId: string } | null;
  setContextMenu: (menu: { x: number; y: number; task: UnifiedTask; columnId: string } | null) => void;
  openEditTaskModal?: (task: UnifiedTask, columnId: string) => void;
  openCreateTaskModal?: (columnId: string) => void;
}

const AsanaKanbanBoard: React.FC<AsanaKanbanBoardProps> = ({ 
  searchQuery,
  onDeleteList,
  onRenameList,
  activeTask,
  contextMenu,
  setContextMenu,
  openEditTaskModal,
  openCreateTaskModal
}) => {
  const { columns, getTasksByColumn, updateTask: updateUnifiedTask, deleteTask: deleteUnifiedTask } = useUnifiedTaskStore();
  const activeAccount = useActiveGoogleAccount();
  const isAuthenticated = !!activeAccount;
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  
  // Transform columns to old format
  const kanbanColumns = useMemo(() => {
    return columns.map(column => ({
      id: column.id,
      title: column.title,
      tasks: getTasksByColumn(column.id),
      isLoading: false,
      error: undefined,
    }));
  }, [columns, getTasksByColumn]);
  
  const columnColors = ['#E362F8', '#F8DF72', '#7DA7F9', '#4ECBC4', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A'];
  
  const dynamicColumns = useMemo(() => 
    kanbanColumns.map((column, index) => ({
      ...column,
      color: columnColors[index % columnColors.length]
    })), [kanbanColumns]);

  const handleDeleteTask = async (taskId: string, columnId: string) => {
    try {
      // Delete using unified store
      deleteUnifiedTask(taskId);
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };

  const handleUpdatePriority = async (task: UnifiedTask, columnId: string, priority: 'low' | 'normal' | 'high' | 'urgent') => {
    try {
      // Update priority using unified store
      updateUnifiedTask(task.id, { priority });
      setContextMenu(null);
    } catch (error) {
      console.error('Failed to update priority:', error);
    }
  };

  return (
    <>
      <div className="flex-1 overflow-x-auto h-full">
        <div className="flex gap-5 px-8 py-6 h-full" style={{ minWidth: 'fit-content' }}>
          {dynamicColumns.map((column) => (
            <DroppableColumn
              key={column.id}
              column={column}
              searchQuery={searchQuery}
              onDeleteList={onDeleteList}
              onRenameList={onRenameList}
              activeTask={activeTask}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onEditTask={openEditTaskModal}
              onCreateTask={openCreateTaskModal}
            />
          ))}
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="context-menu fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-2"
          style={{
            left: contextMenu.x,
            top: contextMenu.y,
            minWidth: '180px'
          }}
        >
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              openEditTaskModal(contextMenu.task, contextMenu.columnId);
              setContextMenu(null);
            }}
          >
            <Edit size={14} />
            Edit Task
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Priority</div>
          {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
            <button
              key={priority}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => handleUpdatePriority(contextMenu.task, contextMenu.columnId, priority)}
            >
              <Flag size={14} style={{ color: priorityConfig[priority]?.textColor || '#6B6F76' }} />
              {priorityConfig[priority]?.label || priority}
              {contextMenu.task.priority === priority && ' ✓'}
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              const newStatus = contextMenu.task.status === 'completed' ? 'needsAction' : 'completed';
              updateUnifiedTask(contextMenu.task.id, { status: newStatus });
              setContextMenu(null);
            }}
          >
            {contextMenu.task.status === 'completed' ? (
              <>
                <Circle size={14} />
                Mark as Incomplete
              </>
            ) : (
              <>
                <CheckCircle2 size={14} />
                Mark as Complete
              </>
            )}
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              // Copy task
              const { createTask, columns } = useUnifiedTaskStore.getState();
              const column = columns.find(c => c.id === contextMenu.columnId);
              createTask({
                columnId: contextMenu.columnId,
                title: `${contextMenu.task.title} (copy)`,
                notes: contextMenu.task.notes,
                due: contextMenu.task.due,
                labels: contextMenu.task.labels,
                priority: contextMenu.task.priority,
                googleTaskListId: column?.googleTaskListId
              });
              setContextMenu(null);
            }}
          >
            <Copy size={14} />
            Duplicate Task
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={() => handleDeleteTask(contextMenu.task.id, contextMenu.columnId)}
          >
            <Trash2 size={14} />
            Delete Task
          </button>
        </div>
      )}
    </>
  );
};

// Droppable Column Component
interface DroppableColumnProps {
  column: any;
  searchQuery?: string;
  onDeleteList?: (listId: string, listTitle: string) => void;
  onRenameList?: (listId: string, newTitle: string) => void;
  activeTask: UnifiedTask | null;
  contextMenu: any;
  setContextMenu: any;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onEditTask?: (task: UnifiedTask, columnId: string) => void;
  onCreateTask?: (columnId: string) => void;
}

const DroppableColumn = memo<DroppableColumnProps>(({
  column,
  searchQuery,
  onDeleteList,
  onRenameList,
  activeTask,
  contextMenu,
  setContextMenu,
  editingTask,
  setEditingTask,
  editingTitle,
  setEditingTitle,
  onEditTask,
  onCreateTask
}) => {
  const { setNodeRef } = useDroppable({
    id: `column-${column.id}`,
  });
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [editingColumnTitle, setEditingColumnTitle] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState(column.title);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    };
    
    if (showColumnMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showColumnMenu]);

  const { updateTask: updateUnifiedTask } = useUnifiedTaskStore();

  const handleSaveEdit = async (task: UnifiedTask) => {
    if (editingTitle.trim() && editingTitle !== task.title) {
      try {
        updateUnifiedTask(task.id, {
          title: editingTitle.trim()
        });
      } catch (error) {
        console.error('Failed to update task:', error);
      }
    }
    setEditingTask(null);
    setEditingTitle('');
  };

  return (
    <div 
      ref={setNodeRef}
      className="w-80 flex flex-col group h-full"
      style={{ minWidth: '350px', maxHeight: 'calc(100vh - 200px)' }}
    >
      {/* Column Header */}
      <div className="mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 flex-1">
            {editingColumnTitle ? (
              <input
                type="text"
                value={newColumnTitle}
                onChange={(e) => setNewColumnTitle(e.target.value)}
                onBlur={() => {
                  if (newColumnTitle.trim() && newColumnTitle !== column.title) {
                    onRenameList?.(column.id, newColumnTitle);
                  }
                  setEditingColumnTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newColumnTitle.trim() && newColumnTitle !== column.title) {
                      onRenameList?.(column.id, newColumnTitle);
                    }
                    setEditingColumnTitle(false);
                  } else if (e.key === 'Escape') {
                    setNewColumnTitle(column.title);
                    setEditingColumnTitle(false);
                  }
                }}
                className="px-2 py-1 border border-gray-300 rounded flex-1"
                style={asanaTypography.h2}
                autoFocus
              />
            ) : (
              <>
                <h2 style={asanaTypography.h2}>{column.title}</h2>
                <span 
                  style={{ 
                    ...asanaTypography.small,
                    color: '#6B6F76',
                    fontWeight: 400
                  }}
                >
                  {column.tasks.length}
                </span>
              </>
            )}
          </div>
          <div className="relative" ref={columnMenuRef}>
            <button 
              className="p-1 rounded hover:bg-gray-100 transition-colors opacity-0 group-hover:opacity-100"
              style={{ color: '#6B6F76' }}
              onClick={() => setShowColumnMenu(!showColumnMenu)}
            >
              <MoreHorizontal size={16} />
            </button>
            
            {showColumnMenu && (
              <div 
                className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
                style={{ minWidth: '150px' }}
              >
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
                  onClick={() => {
                    setEditingColumnTitle(true);
                    setShowColumnMenu(false);
                  }}
                >
                  <Edit2 size={14} />
                  Rename List
                </button>
                <button
                  className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
                  onClick={() => {
                    onDeleteList?.(column.id, column.title);
                    setShowColumnMenu(false);
                  }}
                >
                  <Trash2 size={14} />
                  Delete List
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden pb-4">
        {column.tasks
          .filter((task: UnifiedTask) => !searchQuery || 
            task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            task.labels?.some(label => label.toLowerCase().includes(searchQuery.toLowerCase()))
          )
          .map((task: UnifiedTask) => (
            <DraggableTaskCard
              key={task.id}
              task={task}
              columnId={column.id}
              isActive={activeTask?.id === task.id}
              contextMenu={contextMenu}
              setContextMenu={setContextMenu}
              editingTask={editingTask}
              setEditingTask={setEditingTask}
              editingTitle={editingTitle}
              setEditingTitle={setEditingTitle}
              onSaveEdit={handleSaveEdit}
              onEditTask={onEditTask}
            />
          ))}

        {/* Add card button */}
        <button
          className="w-full p-3 rounded-xl transition-all flex items-center justify-center gap-2"
          style={{ 
            backgroundColor: 'transparent',
            border: '2px dashed #DDD',
            fontSize: '14px',
            color: '#6B6F76',
            fontWeight: 500
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F6F7F8';
            e.currentTarget.style.borderColor = '#C7CBCF';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.borderColor = '#DDD';
          }}
          onClick={() => {
            if (onCreateTask) {
              onCreateTask(column.id);
            } else {
              console.error('onCreateTask prop is not defined!');
            }
          }}
        >
          <Plus size={16} />
          Add task
        </button>
      </div>
    </div>
  );
});

// Draggable Task Card Component
interface DraggableTaskCardProps {
  task: UnifiedTask;
  columnId: string;
  isActive: boolean;
  contextMenu: any;
  setContextMenu: any;
  editingTask: string | null;
  setEditingTask: (id: string | null) => void;
  editingTitle: string;
  setEditingTitle: (title: string) => void;
  onSaveEdit: (task: UnifiedTask) => void;
  onEditTask?: (task: UnifiedTask, columnId: string) => void;
}

const DraggableTaskCard = memo<DraggableTaskCardProps>(({
  task,
  columnId,
  isActive,
  contextMenu,
  setContextMenu,
  editingTask,
  setEditingTask,
  editingTitle,
  setEditingTitle,
  onSaveEdit,
  onEditTask
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: task.id,
  });
  
  // Metadata is now part of the task object in unified store
  const metadata = {
    labels: task.labels || [],
    priority: task.priority || 'normal' as const,
    subtasks: task.attachments || [] // Using attachments field for subtasks
  };

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
  } : undefined;

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      task,
      columnId
    });
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onContextMenu={handleContextMenu}
      onClick={(e) => {
        // Only open edit modal if not dragging and not clicking on input or button elements
        const target = e.target as HTMLElement;
        const isInteractive = target.tagName === 'INPUT' || target.tagName === 'BUTTON' || target.closest('button');
        if (!isDragging && onEditTask && !isInteractive) {
          onEditTask(task, columnId);
        }
      }}
      className={`p-5 bg-white cursor-pointer transition-all ${
        isDragging ? 'opacity-50' : ''
      }`}
      style={{ 
        borderRadius: '18px',
        boxShadow: isDragging ? '0 8px 32px rgba(50, 50, 93, 0.25)' : '0 2px 8px rgba(50, 50, 93, 0.08)',
        border: 'none',
        transition: 'box-shadow 0.18s, transform 0.12s',
        ...(style || {})
      }}
      onMouseEnter={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 6px 24px rgba(50, 50, 93, 0.13)';
          e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)';
        }
      }}
      onMouseLeave={(e) => {
        if (!isDragging) {
          e.currentTarget.style.boxShadow = '0 2px 8px rgba(50, 50, 93, 0.08)';
          e.currentTarget.style.transform = 'translateY(0) scale(1)';
        }
      }}
    >
      {/* Priority indicator */}
      {task.priority && task.priority !== 'normal' && (
        <div className="mb-3">
          <span 
            className="px-3 py-1 rounded-lg inline-block"
            style={{ 
              ...asanaTypography.label,
              backgroundColor: priorityConfig[task.priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
              color: priorityConfig[task.priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
            }}
          >
            {priorityConfig[task.priority as keyof typeof priorityConfig]?.label || task.priority} Priority
          </span>
        </div>
      )}
      
      {/* Syncing indicator for temporary tasks */}
      {!task.googleTaskId && task.id.startsWith('temp-') && (
        <div className="flex items-center gap-1 mb-2">
          <RefreshCw size={12} className="animate-spin" style={{ color: '#9CA6AF' }} />
          <span style={{ ...asanaTypography.small, color: '#9CA6AF' }}>Syncing...</span>
        </div>
      )}
      
      {/* Title */}
      {editingTask === task.id ? (
        <input
          type="text"
          value={editingTitle}
          onChange={(e) => setEditingTitle(e.target.value)}
          onBlur={() => onSaveEdit(task)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onSaveEdit(task);
            } else if (e.key === 'Escape') {
              setEditingTask(null);
              setEditingTitle('');
            }
          }}
          className="w-full px-2 py-1 border border-gray-300 rounded"
          style={asanaTypography.h3}
          autoFocus
        />
      ) : (
        <h4 
          style={{ 
            ...asanaTypography.h3, 
            marginBottom: '8px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
          onDoubleClick={() => {
            setEditingTask(task.id);
            setEditingTitle(task.title);
          }}
        >
          {task.title}
        </h4>
      )}
      
      {/* Description/Notes */}
      {task.notes && (
        <p 
          style={{ 
            ...asanaTypography.body,
            marginBottom: '12px',
            wordBreak: 'break-word',
            overflowWrap: 'break-word'
          }}
        >
          {task.notes}
        </p>
      )}

      {/* Labels */}
      {task.labels && task.labels.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-3">
          {task.labels.map((label: string) => (
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

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3" 
           style={{ borderTop: '1px solid #F1F2F3' }}>
        <div className="flex items-center gap-3">
          {/* Due date */}
          {task.due && (
            <div className="flex items-center gap-1.5">
              <Calendar size={14} style={{ color: '#9CA6AF' }} />
              <span style={asanaTypography.small}>
                {new Date(task.due).toLocaleDateString('en-US', { 
                  month: 'short', 
                  day: 'numeric',
                  year: new Date(task.due).getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
                })}
              </span>
            </div>
          )}

          {/* Subtasks */}
          {task.attachments && task.attachments.length > 0 && (
            <div className="flex items-center gap-1">
              <CheckCircle2 size={14} style={{ color: '#14A085' }} />
              <span style={asanaTypography.small}>
                {task.attachments.filter((st: any) => st.type === 'completed').length}/{task.attachments.length}
              </span>
            </div>
          )}
        </div>

        {/* Status icon */}
        {task.status === 'completed' ? (
          <CheckCircle2 size={16} style={{ color: '#14A085' }} />
        ) : (
          <Circle size={16} style={{ color: '#DDD' }} />
        )}
      </div>
    </div>
  );
});
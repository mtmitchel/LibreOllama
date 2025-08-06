import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { useFilteredTasks } from '../../hooks/useFilteredTasks';
import { parseGoogleTaskDate, formatTaskDate } from '../../utils/dateUtils';

type KanbanTask = UnifiedTask;
import { TaskSidebar } from './TaskSidebar';
import { InlineTaskCreator } from './InlineTaskCreator';
import { Card, Button, Input, ContextMenu } from '../ui';
import { Plus, Search, Filter, Calendar, CheckSquare, Tag, MoreHorizontal, RotateCcw, ArrowUpDown, GripVertical, Type, ChevronDown, Edit3, Copy, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface TaskListViewProps {
  className?: string;
  searchQuery?: string;
  showHeader?: boolean;
  selectedListId?: string;
  sortBy?: 'created' | 'due' | 'title';
  selectedLabels?: string[];
  onEditTask?: (task: KanbanTask, columnId: string) => void;
}

export const TaskListView: React.FC<TaskListViewProps> = ({ 
  className = '', 
  searchQuery: parentSearchQuery = '',
  showHeader = true,
  selectedListId: parentSelectedListId,
  sortBy: parentSortBy,
  selectedLabels = [],
  onEditTask
}) => {
  const {
    columns,
    updateTask,
    deleteTask,
    createTask,
  } = useUnifiedTaskStore();
  
  const [selectedTask, setSelectedTask] = useState<KanbanTask | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [localSearchQuery, setLocalSearchQuery] = useState('');
  const searchQuery = parentSearchQuery || localSearchQuery;
  const [localSelectedListId, setLocalSelectedListId] = useState<string>('all');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [localSortBy, setLocalSortBy] = useState<'created' | 'due' | 'title'>('created');
  const sortMenuRef = useRef<HTMLDivElement>(null);
  const [expandedSections, setExpandedSections] = useState<Set<string>>(() => new Set(columns.map(c => c.id)));
  const [showInlineCreator, setShowInlineCreator] = useState<Record<string, boolean>>({});
  
  // Use parent props if provided, otherwise use local state
  const selectedListId = parentSelectedListId ?? localSelectedListId;
  const sortBy = parentSortBy ?? localSortBy;

  // Get all tasks using memoized hook
  const allTasks = useFilteredTasks(selectedListId);
  
  const toggleComplete = async (columnId: string, taskId: string, completed: boolean) => {
    // Get the full task to include all fields in update - prevent clearing other fields
    const task = allTasks.find(t => t.id === taskId);
    if (task) {
      const updates: any = {
        title: task.title,
        status: completed ? 'completed' : 'needsAction'
      };
      // Only include fields that have values - don't send empty/null values
      if (task.notes) updates.notes = task.notes;
      if (task.due) updates.due = task.due;
      if (task.priority && task.priority !== 'none') updates.priority = task.priority;
      if (task.labels && task.labels.length > 0) updates.labels = task.labels;
      if (task.timeBlock) updates.timeBlock = task.timeBlock;
      
      await updateTask(taskId, updates);
      // Trigger sync to ensure completion status appears in Google immediately
      const { realtimeSync } = await import('../../services/realtimeSync');
      realtimeSync.requestSync(500);
    }
  };

  // Filter and sort tasks
  const filteredTasks = allTasks
    .filter(task => {
      // Search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesTitle = task.title.toLowerCase().includes(query);
        const matchesNotes = task.notes?.toLowerCase().includes(query);
        const matchesTags = task.labels?.some(label => {
          const labelName = typeof label === 'string' ? label : label.name;
          return labelName.toLowerCase().includes(query);
        });
        if (!matchesTitle && !matchesNotes && !matchesTags) return false;
      }

      // Label filter
      if (selectedLabels.length > 0) {
        if (!task.labels || task.labels.length === 0) return false;
        const taskLabelNames = task.labels.map(label => 
          typeof label === 'string' ? label : label.name
        );
        if (!selectedLabels.some(selectedLabel => taskLabelNames.includes(selectedLabel))) {
          return false;
        }
      }

      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title);
        case 'due':
          if (!a.due && !b.due) return 0;
          if (!a.due) return 1;
          if (!b.due) return -1;
          return parseGoogleTaskDate(a.due).getTime() - parseGoogleTaskDate(b.due).getTime();
        case 'created':
        default:
          return new Date(b.updated).getTime() - new Date(a.updated).getTime();
      }
    });

  // Handle task click
  const handleTaskClick = useCallback((task: KanbanTask & { columnId: string }) => {
    if (onEditTask) {
      onEditTask(task, task.columnId);
    } else {
      setSelectedTask(task);
      setSelectedColumnId(task.columnId);
      setIsEditModalOpen(true);
    }
  }, [onEditTask]);

  // Handle task completion toggle
  const handleToggleComplete = useCallback(async (task: KanbanTask & { columnId: string }) => {
    try {
      await toggleComplete(task.columnId, task.id, task.status !== 'completed');
    } catch (error) {
      // Failed to toggle task completion
    }
  }, [toggleComplete]);

  // Handle task update
  const handleUpdateTask = useCallback(async (updates: {
    title: string;
    notes?: string;
    due?: string;
    priority?: 'high' | 'medium' | 'low' | 'none';
    labels?: string[];
    recurring?: {
      enabled: boolean;
      frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
      interval?: number;
      endDate?: string;
    };
  }) => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await updateTask(selectedTask.id, {
        ...updates,
        // Transform string labels to label objects
        labels: updates.labels?.map(label => ({
          name: label,
          color: 'gray' as const
        })),
        recurring: updates.recurring
      });
      setIsEditModalOpen(false);
      
      // Trigger sync to ensure changes appear in Google immediately
      const { realtimeSync } = await import('../../services/realtimeSync');
      realtimeSync.requestSync(500);
    } catch (error) {
      // Failed to update task
      throw error;
    }
  }, [updateTask, selectedTask, selectedColumnId]);

  // Handle task deletion
  const handleDeleteTask = useCallback(async () => {
    if (!selectedTask || !selectedColumnId) return;

    try {
      await deleteTask(selectedTask.id);
      setIsEditModalOpen(false);
      
      // Trigger sync to ensure deletion appears in Google immediately
      const { realtimeSync } = await import('../../services/realtimeSync');
      realtimeSync.requestSync(500);
    } catch (error) {
      // Failed to delete task
    }
  }, [deleteTask, selectedTask, selectedColumnId]);

  // Handle create task
  const handleCreateTask = useCallback(async (title: string) => {
    try {
      // Use the selected column or fall back to first column
      const targetColumn = columns.find(c => c.id === selectedColumnId) || columns[0];
      if (targetColumn) {
        await createTask({
          title: title,
          columnId: targetColumn.id,
          googleTaskListId: targetColumn.googleTaskListId,
          labels: [],
          priority: 'none'
        });
        setIsCreateModalOpen(false);
        
        // Trigger sync to ensure new task appears in Google immediately
        const { realtimeSync } = await import('../../services/realtimeSync');
        realtimeSync.requestSync(500);
      }
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  }, [createTask, columns, selectedColumnId]);

  // Group tasks by column/list
  const tasksByColumn = React.useMemo(() => {
    const grouped: Record<string, typeof filteredTasks> = {};
    
    columns.forEach(column => {
      grouped[column.id] = filteredTasks.filter(task => task.columnId === column.id);
    });
    
    return grouped;
  }, [filteredTasks, columns]);

  return (
    <>
      <div className={`flex h-full flex-col ${className}`} style={{ backgroundColor: '#FFFFFF' }}>
        {/* Column Headers */}
        <div className="border-b sticky top-0 bg-white" style={{ borderColor: '#E8E8E9' }}>
          <div className="flex items-center text-xs font-medium" style={{ padding: '8px 24px', color: '#6B6F76' }}>
            <div style={{ flex: '1', minWidth: '240px', paddingRight: '8px' }}>Task name</div>
            <div style={{ width: '100px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px' }}>Due date</div>
            <div style={{ width: '100px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px' }}>Priority</div>
            <div style={{ width: '150px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px' }}>Labels</div>
          </div>
        </div>

        {/* Task List */}
        <div className="flex-1 overflow-y-auto">
          {filteredTasks.length === 0 ? (
            <div className="p-12 text-center" style={{ marginTop: '2rem' }}>
              <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full" style={{ backgroundColor: '#F6F7F8' }}>
                <CheckSquare size={24} style={{ color: '#6B6F76' }} />
              </div>
              <h3 className="mb-2 text-lg font-medium" style={{ color: '#151B26' }}>
                {searchQuery || selectedListId !== 'all' ? 'No tasks found' : 'No tasks yet'}
              </h3>
              <p className="mb-4 text-sm" style={{ color: '#6B6F76' }}>
                {searchQuery || selectedListId !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Create your first task to get started'
                }
              </p>
              {!searchQuery && selectedListId === 'all' && (
                <Button variant="primary" onClick={() => setIsCreateModalOpen(true)}>
                  Create task
                </Button>
              )}
            </div>
          ) : (
            <div>
              {/* Render sections by column */}
              {columns.map(column => {
                const columnTasks = tasksByColumn[column.id] || [];
                if (selectedListId !== 'all' && selectedListId !== column.id) return null;
                
                return (
                  <div key={column.id} className="mb-4">
                    {/* Section Header */}
                    <div 
                      className="flex items-center px-6 py-2 cursor-pointer hover:bg-gray-50"
                      onClick={() => {
                        const newExpanded = new Set(expandedSections);
                        if (newExpanded.has(column.id)) {
                          newExpanded.delete(column.id);
                        } else {
                          newExpanded.add(column.id);
                        }
                        setExpandedSections(newExpanded);
                      }}
                    >
                      <ChevronDown 
                        size={16} 
                        className={`mr-2 transition-transform ${expandedSections.has(column.id) ? '' : '-rotate-90'}`} 
                        style={{ color: '#6B6F76' }} 
                      />
                      <span className="font-medium text-sm" style={{ color: '#151B26' }}>
                        {column.title}
                      </span>
                      <span className="ml-2 text-xs" style={{ color: '#6B6F76' }}>
                        {columnTasks.length}
                      </span>
                    </div>
                    
                    {/* Tasks in this section */}
                    {expandedSections.has(column.id) && columnTasks.map((task) => {
                      const isCompleted = task.status === 'completed';
                      const isOverdue = task.due && parseGoogleTaskDate(task.due) < new Date() && !isCompleted;
                      const completedSubtasks = 0;
                      const totalSubtasks = 0;

                      const contextMenuItems = [
                        {
                          label: isCompleted ? 'Mark incomplete' : 'Mark complete',
                          icon: <CheckSquare size={14} />,
                          onClick: () => handleToggleComplete(task)
                        },
                        { separator: true },
                        {
                          label: 'Edit',
                          icon: <Edit3 size={14} />,
                          onClick: () => handleTaskClick(task)
                        },
                        {
                          label: 'Duplicate',
                          icon: <Copy size={14} />,
                          onClick: async () => {
                            await createTask({
                              title: `${task.title} (copy)`,
                              notes: task.notes,
                              due: task.due,
                              columnId: task.columnId,
                              googleTaskListId: column.googleTaskListId,
                              labels: task.labels,
                              priority: task.priority
                            });
                          }
                        },
                        { separator: true },
                        {
                          label: 'Delete',
                          icon: <Trash2 size={14} />,
                          destructive: true,
                          onClick: async () => {
                            await deleteTask(task.id);
                          }
                        }
                      ];

                      return (
                        <ContextMenu key={task.id} items={contextMenuItems}>
                          <div
                            className={`group flex items-center cursor-pointer transition-all duration-200 hover:bg-gray-50 ${
                              isCompleted ? 'opacity-60' : ''
                            }`}
                            style={{ 
                              padding: '8px 24px',
                              borderBottom: '1px solid #F6F7F8',
                              minHeight: '44px'
                            }}
                            onClick={() => handleTaskClick(task)}
                          >
                          {/* Task name column with checkbox - indented */}
                          <div style={{ flex: '1', minWidth: '240px', paddingRight: '8px', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px' }}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleComplete(task);
                              }}
                              className="flex-shrink-0 flex items-center justify-center"
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '50%',
                                border: isCompleted ? '1.5px solid #796EFF' : '1.5px solid #D1D5DB',
                                backgroundColor: isCompleted ? '#796EFF' : 'transparent',
                                transition: 'all 0.2s ease'
                              }}
                              onMouseEnter={(e) => {
                                if (!isCompleted) {
                                  e.currentTarget.style.borderColor = '#796EFF';
                                }
                              }}
                              onMouseLeave={(e) => {
                                if (!isCompleted) {
                                  e.currentTarget.style.borderColor = '#D1D5DB';
                                }
                              }}
                            >
                              <svg 
                                width="10" 
                                height="10" 
                                viewBox="0 0 16 16" 
                                fill="none"
                                style={{ 
                                  opacity: isCompleted ? 1 : 0.3,
                                  transition: 'opacity 0.2s ease'
                                }}
                              >
                                <path 
                                  d="M13.5 4.5L6 12L2.5 8.5" 
                                  stroke={isCompleted ? "white" : "#9CA3AF"} 
                                  strokeWidth="2" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                            <div style={{ flex: '1' }}>
                              <h3 className={`text-sm leading-tight ${
                                isCompleted ? 'line-through' : ''
                              }`} style={{ 
                                color: isCompleted ? '#9CA3AF' : '#151B26',
                                fontWeight: 400
                              }}>
                                {task.title}
                              </h3>
                              {task.notes && (
                                <p className="mt-0.5 line-clamp-1 text-xs" style={{ color: '#9CA3AF' }}>
                                  {task.notes}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Due date column */}
                          <div style={{ width: '100px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {task.due && (
                              <div className="flex items-center gap-1" style={{
                                color: isOverdue ? '#DC2626' : '#6B6F76',
                                fontSize: '12px'
                              }}>
                                <span>{formatTaskDate(parseGoogleTaskDate(task.due))}</span>
                              </div>
                            )}
                          </div>

                          {/* Priority column */}
                          <div style={{ width: '100px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {task.priority && task.priority !== 'none' && (
                              <span style={{
                                fontSize: '11px',
                                fontWeight: 500,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                backgroundColor: task.priority === 'high' ? 'var(--red-50)' : task.priority === 'medium' ? 'var(--amber-50)' : '#e0f2fe',
                                color: task.priority === 'high' ? 'var(--red-600)' : task.priority === 'medium' ? 'var(--amber-600)' : '#0369a1'
                              }}>
                                {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                              </span>
                            )}
                          </div>

                          {/* Labels column */}
                          <div style={{ width: '150px', paddingRight: '8px', borderLeft: '1px solid #D1D5DB', paddingLeft: '8px', minHeight: '28px', display: 'flex', alignItems: 'center' }}>
                            {task.labels && task.labels.length > 0 && (
                              <div className="flex items-center gap-1 flex-wrap">
                                {task.labels.slice(0, 2).map((label, index) => {
                                  const labelName = typeof label === 'string' ? label : label.name;
                                  const labelColor = typeof label === 'string' ? 
                                    (() => {
                                      const colors = ['red', 'blue', 'green', 'purple', 'orange', 'pink', 'teal', 'yellow', 'cyan', 'gray'];
                                      let hash = 0;
                                      for (let i = 0; i < labelName.length; i++) {
                                        hash = ((hash << 5) - hash) + labelName.charCodeAt(i);
                                        hash = hash & hash;
                                      }
                                      const colorIndex = Math.abs(hash) % colors.length;
                                      return colors[colorIndex];
                                    })() : 
                                    label.color;
                                  
                                  const colorClass = `label-${labelColor}`;
                                  
                                  return (
                                    <span
                                      key={index}
                                      className={`label ${colorClass}`}
                                      style={{ fontSize: '11px', padding: '2px 6px' }}
                                    >
                                      {labelName}
                                    </span>
                                  );
                                })}
                                {task.labels.length > 2 && (
                                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                                    +{task.labels.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>

                          </div>
                        </ContextMenu>
                      );
                    })}
                    
                    {/* Add task row - only show when expanded */}
                    {expandedSections.has(column.id) && (
                      <>
                        {showInlineCreator[column.id] ? (
                          <div className="flex" style={{ padding: '8px 24px', position: 'relative', zIndex: 100 }}>
                            <div style={{ flex: '1', minWidth: '240px', paddingLeft: '24px', paddingRight: '8px', position: 'relative' }}>
                              <InlineTaskCreator
                                columnId={column.id}
                                onSubmit={async (data) => {
                                  console.log('Creating task with data:', data);
                                  await createTask({
                                    title: data.title,
                                    notes: data.notes,
                                    due: data.due,
                                    columnId: column.id,
                                    googleTaskListId: column.googleTaskListId,
                                    labels: data.labels || [],
                                    priority: data.priority || 'none'
                                  });
                                  setShowInlineCreator(prev => ({ ...prev, [column.id]: false }));
                                  // Trigger sync
                                  const { realtimeSync } = await import('../../services/realtimeSync');
                                  realtimeSync.requestSync(500);
                                }}
                                onCancel={() => {
                                  setShowInlineCreator(prev => ({ ...prev, [column.id]: false }));
                                }}
                              />
                            </div>
                            {/* Empty columns to maintain layout */}
                            <div style={{ width: '100px', borderLeft: '1px solid #D1D5DB', minHeight: '28px', paddingLeft: '8px' }}></div>
                            <div style={{ width: '100px', borderLeft: '1px solid #D1D5DB', minHeight: '28px', paddingLeft: '8px' }}></div>
                            <div style={{ width: '150px', borderLeft: '1px solid #D1D5DB', minHeight: '28px', paddingLeft: '8px' }}></div>
                          </div>
                        ) : (
                          <div
                            className="flex items-center cursor-pointer hover:bg-gray-50 group"
                            style={{ padding: '8px 24px', minHeight: '36px' }}
                            onClick={() => {
                              setShowInlineCreator(prev => ({ ...prev, [column.id]: true }));
                            }}
                          >
                            <div style={{ flex: '1', minWidth: '240px', display: 'flex', alignItems: 'center', gap: '12px', paddingLeft: '24px' }}>
                              <Plus size={14} className="opacity-0 group-hover:opacity-100 flex-shrink-0" style={{ color: '#6B6F76', width: '16px', height: '16px' }} />
                              <span className="text-sm opacity-0 group-hover:opacity-100" style={{ color: '#6B6F76' }}>
                                Add task...
                              </span>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                );
              })}
              
              {/* Add section button */}
              <div 
                className="flex items-center px-6 py-3 cursor-pointer hover:bg-gray-50 group border-t"
                style={{ borderColor: '#E8E8E9' }}
                onClick={() => {
                  // TODO: Implement add section/list functionality
                  alert('Add section functionality needs to be implemented');
                }}
              >
                <Plus size={16} className="mr-2" style={{ color: '#6B6F76' }} />
                <span className="text-sm font-medium" style={{ color: '#6B6F76' }}>
                  Add section
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Task Sidebar */}
      <TaskSidebar
        isOpen={isEditModalOpen}
        task={isEditModalOpen ? selectedTask : null}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedTask(null);
        }}
        onSubmit={handleUpdateTask}
        onDelete={handleDeleteTask}
      />

    </>
  );
};
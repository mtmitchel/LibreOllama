import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, ArrowUpDown, CheckCircle2, Circle, MoreHorizontal, Eye, EyeOff } from 'lucide-react';
import { InlineTaskCreator } from '../../../../components/kanban/InlineTaskCreator';
import { UnifiedTask } from '../../../../stores/unifiedTaskStore.types';
import type { TaskColumn } from '../../../../stores/unifiedTaskStore.types';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';

interface CalendarTaskSidebarProps {
  taskLists: TaskColumn[];
  googleTasks: Record<string, UnifiedTask>;
  selectedTaskListId: string;
  showInlineCreator: boolean;
  onTaskListChange: (listId: string) => void;
  onTaskClick: (task: UnifiedTask) => void;
  onTaskComplete: (listId: string, taskId: string, completed: boolean) => Promise<void>;
  onTaskCreate: (listId: string, data: any) => Promise<void>;
  onShowInlineCreator: (show: boolean) => void;
  onContextMenu: (e: React.MouseEvent, task: UnifiedTask) => void;
}

export const CalendarTaskSidebar: React.FC<CalendarTaskSidebarProps> = ({
  taskLists,
  googleTasks,
  selectedTaskListId,
  showInlineCreator,
  onTaskListChange,
  onTaskClick,
  onTaskComplete,
  onTaskCreate,
  onShowInlineCreator,
  onContextMenu,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [sortBy, setSortBy] = useState<'title' | 'due' | 'priority' | 'created'>('title');
  const [menuDropdownOpen, setMenuDropdownOpen] = useState(false);
  const sortDropdownRef = useRef<HTMLDivElement>(null);
  const menuDropdownRef = useRef<HTMLDivElement>(null);
  
  const { showCompleted, setShowCompleted } = useUnifiedTaskStore();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sortDropdownRef.current && !sortDropdownRef.current.contains(event.target as Node)) {
        setSortDropdownOpen(false);
      }
      if (menuDropdownRef.current && !menuDropdownRef.current.contains(event.target as Node)) {
        setMenuDropdownOpen(false);
      }
    };

    if (sortDropdownOpen || menuDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [sortDropdownOpen, menuDropdownOpen]);

  const selectedList = taskLists.find(l => l.id === selectedTaskListId);
  const allTasks = Object.values(googleTasks).filter(task => 
    showCompleted ? true : task.status !== 'completed'
  );
  const filteredTasks = selectedTaskListId === 'all' 
    ? allTasks 
    : allTasks.filter(task => task.columnId === selectedTaskListId);

  // Sort tasks based on sortBy
  const displayTasks = [...filteredTasks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title);
      case 'due':
        if (!a.due && !b.due) return 0;
        if (!a.due) return 1;
        if (!b.due) return -1;
        return new Date(a.due).getTime() - new Date(b.due).getTime();
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, normal: 2, low: 3 };
        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 2;
        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 2;
        return aPriority - bPriority;
      case 'created':
        return new Date(b.updated || 0).getTime() - new Date(a.updated || 0).getTime();
      default:
        return 0;
    }
  });

  const handleAddTask = () => {
    onShowInlineCreator(true);
  };

  const renderTaskCard = (task: UnifiedTask) => {
    const isCompleted = task.status === 'completed';
    const priorityConfig: Record<string, { bgColor: string; borderColor: string; textColor: string; label: string }> = {
      urgent: { bgColor: '#FFEBEE', borderColor: '#FFCDD2', textColor: '#D32F2F', label: 'Urgent' },
      high: { bgColor: '#FFF3E0', borderColor: '#FFE0B2', textColor: '#F57C00', label: 'High' },
      medium: { bgColor: '#E8F5E9', borderColor: '#C8E6C9', textColor: '#388E3C', label: 'Medium' },
      low: { bgColor: '#E3F2FD', borderColor: '#BBDEFB', textColor: '#1976D2', label: 'Low' },
    };

    const priority = task.priority || 'medium';

    return (
      <div 
        className="draggable-task p-3 transition-all cursor-pointer"
        onClick={() => onTaskClick(task)}
        onContextMenu={(e) => onContextMenu(e, task)}
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E8E8E9',
          borderRadius: '8px',
          marginBottom: '6px',
          boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
          opacity: isCompleted ? 0.6 : 1,
        }}
      >
        <div className="flex items-start gap-2">
          <button
            onClick={async () => {
              await onTaskComplete(task.columnId, task.id, !isCompleted);
            }}
            className="flex-shrink-0 mt-0.5"
          >
            {isCompleted ? (
              <CheckCircle2 size={18} style={{ color: '#14A085' }} />
            ) : (
              <Circle size={18} style={{ color: '#DDD' }} />
            )}
          </button>
          
          <div className="flex-1 min-w-0">
            <div 
              className={`text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}
              style={{ 
                wordBreak: 'break-word',
                fontSize: '14px',
                lineHeight: '20px',
                color: isCompleted ? '#9CA6AF' : '#1E1E1F',
              }}
            >
              {task.title}
            </div>
            
            {task.notes && !isCompleted && (
              <div 
                className="text-xs mt-1"
                style={{ 
                  color: '#6B6F76',
                  lineHeight: '16px',
                }}
              >
                {task.notes}
              </div>
            )}
            
            <div className="flex items-center gap-2 mt-2">
              {task.due && (
                <span 
                  className="text-xs px-2 py-1 rounded-full"
                  style={{ 
                    backgroundColor: '#F3F4F6',
                    color: '#6B6F76',
                    fontSize: '12px',
                  }}
                >
                  {new Date(task.due).toLocaleDateString()}
                </span>
              )}
              
              {priority !== 'medium' && (
                <span 
                  className="text-xs px-2 py-1 rounded-full font-medium"
                  style={{ 
                    backgroundColor: priorityConfig[priority]?.bgColor || '#F3F4F6',
                    color: priorityConfig[priority]?.textColor || '#6B6F76',
                    border: `1px solid ${priorityConfig[priority]?.borderColor || '#E5E7EB'}`,
                    fontSize: '11px',
                  }}
                >
                  {priorityConfig[priority]?.label || priority}
                </span>
              )}
            </div>
          </div>
          
          <button 
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded"
            onClick={(e) => {
              e.stopPropagation();
              onContextMenu(e, task);
            }}
          >
            <MoreHorizontal size={16} style={{ color: '#6B6F76' }} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="border-primary flex h-full w-80 shrink-0 flex-col overflow-hidden rounded-xl border bg-card shadow-sm calendar-task-sidebar">
      <div style={{ 
        padding: '24px', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ 
          flex: '1',
          overflowY: 'auto', 
          overflowX: 'hidden',
          paddingRight: '8px',
          marginRight: '-8px'
        }}>
          {/* Custom header with dropdown */}
          <div style={{ width: '100%' }}>
            <div className="flex items-center justify-between" style={{ marginBottom: '12px' }}>
              <div className="flex items-center gap-2" style={{ alignItems: 'center' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#1E1E1F', margin: 0, lineHeight: '24px' }}>Tasks</h3>
                <span style={{ 
                  fontSize: '14px', 
                  fontWeight: 500, 
                  color: '#6B6F76',
                  backgroundColor: '#F3F4F6',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  lineHeight: '20px',
                  display: 'inline-flex',
                  alignItems: 'center'
                }}>
                  {displayTasks.length}
                </span>
              </div>
              
              <div className="flex items-center gap-1">
                {/* Sort button */}
                <div className="relative" ref={sortDropdownRef}>
                  <button
                    className="flex items-center justify-center"
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '6px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#F3F4F6';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                    onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                    title="Sort"
                  >
                    <ArrowUpDown size={14} style={{ color: '#6B6F76' }} />
                  </button>
                
                {sortDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[120px]">
                    {[
                      { key: 'title', label: 'Title' },
                      { key: 'due', label: 'Due Date' },
                      { key: 'priority', label: 'Priority' },
                      { key: 'created', label: 'Created' }
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortBy(key as typeof sortBy);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                          sortBy === key ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Three-dot menu */}
              <div className="relative" ref={menuDropdownRef}>
                <button
                  className="flex items-center justify-center"
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    border: 'none',
                    backgroundColor: 'transparent',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#F3F4F6';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }}
                  onClick={() => setMenuDropdownOpen(!menuDropdownOpen)}
                  title="More options"
                >
                  <MoreHorizontal size={14} style={{ color: '#6B6F76' }} />
                </button>
                
                {menuDropdownOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50 min-w-[160px]">
                    <button
                      onClick={() => {
                        setShowCompleted(!showCompleted);
                        setMenuDropdownOpen(false);
                      }}
                      className="w-full px-3 py-2 text-left text-sm hover:bg-gray-50 text-gray-700 flex items-center gap-2"
                    >
                      {showCompleted ? <EyeOff size={14} /> : <Eye size={14} />}
                      <span>{showCompleted ? 'Hide completed' : 'Show completed'}</span>
                    </button>
                  </div>
                )}
              </div>
              </div>
            </div>

            {/* Task list dropdown */}
            {taskLists.length > 0 && (
              <div className="relative" style={{ marginBottom: '16px' }}>
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 text-left rounded-lg transition-colors"
                  style={{
                    backgroundColor: '#F8F9FA',
                    border: '1px solid #E8E8E9',
                    fontSize: '14px',
                    color: '#1E1E1F',
                  }}
                >
                  <span>{selectedList ? selectedList.title : 'All Tasks'}</span>
                  <ChevronDown 
                    size={16} 
                    style={{ 
                      color: '#6B6F76',
                      transform: dropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s'
                    }} 
                  />
                </button>
                
                {dropdownOpen && (
                  <div 
                    className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
                    style={{ maxHeight: '300px', overflowY: 'auto' }}
                  >
                    <button
                      onClick={() => {
                        onTaskListChange('all');
                        setDropdownOpen(false);
                      }}
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                        selectedTaskListId === 'all' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                      }`}
                    >
                      All Tasks ({allTasks.length})
                    </button>
                    {taskLists.map(list => {
                      const listTasks = allTasks.filter(task => task.columnId === list.id);
                      return (
                        <button
                          key={list.id}
                          onClick={() => {
                            onTaskListChange(list.id);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 ${
                            selectedTaskListId === list.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                          }`}
                        >
                          {list.title} ({listTasks.length})
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Add task button */}
            <button
              onClick={handleAddTask}
              className="w-full mb-3 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                border: '1px dashed #2563EB',
                backgroundColor: 'transparent',
              }}
              disabled={taskLists.length === 0 || (selectedTaskListId === 'all' && taskLists.length <= 1)}
              title={taskLists.length === 0 ? 'No task lists available. Please sync from Tasks page first.' : 
                     (selectedTaskListId === 'all' && taskLists.length <= 1) ? 'Please select a specific task list to add tasks.' : ''}
            >
              + Add task
            </button>

            {/* Inline task creator */}
            {showInlineCreator && (
              <div style={{ marginBottom: '12px' }}>
                <InlineTaskCreator
                  columnId={selectedTaskListId === 'all' ? taskLists[0]?.id || '' : selectedTaskListId}
                  onSubmit={async (data) => {
                    try {
                      console.log('Task creation debug:', {
                        selectedTaskListId,
                        taskLists: taskLists.map(t => ({ id: t.id, title: t.title, googleTaskListId: t.googleTaskListId })),
                        firstTaskListId: taskLists[0]?.id,
                        data
                      });
                      
                      const listId = selectedTaskListId === 'all' ? taskLists[0]?.id : selectedTaskListId;
                      if (!listId || listId === 'all') {
                        throw new Error('Please select a specific task list to add tasks');
                      }
                      
                      await onTaskCreate(listId, data);
                      onShowInlineCreator(false);
                    } catch (error) {
                      console.error('Failed to create task:', error);
                      // The error will be displayed by the InlineTaskCreator component
                      throw error;
                    }
                  }}
                  onCancel={() => onShowInlineCreator(false)}
                />
              </div>
            )}

            {/* Task list */}
            {taskLists.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-gray-500 text-sm mb-2">No task lists available</div>
                <div className="text-gray-400 text-xs">
                  Initialize sync from Tasks page first
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {displayTasks.map(task => renderTaskCard(task))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
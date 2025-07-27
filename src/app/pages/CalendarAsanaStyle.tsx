import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import { 
  EventContentArg, 
  DateSelectArg, 
  EventClickArg, 
  EventDropArg,
  EventApi
} from '@fullcalendar/core';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, RefreshCw, Search, ListChecks, CheckCircle, ChevronDown, Edit2, Copy, Trash2, CheckSquare, Circle, CheckCircle2, Flag } from 'lucide-react';

import { Button, Card, Text, Heading, Input } from '../../components/ui';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { useHeader } from '../contexts/HeaderContext';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable, DropArg } from '@fullcalendar/interaction';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { devLog } from '../../utils/devLog';
import type { GoogleTask } from '../../types/google';
import './styles/calendar.css';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Subtask interface
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

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

// Asana-style Task Modal Component
interface AsanaTaskModalProps {
  isOpen: boolean;
  task?: GoogleTask | null;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    notes?: string; 
    due?: string; 
    metadata?: {
      priority: 'low' | 'normal' | 'high' | 'urgent';
      labels: string[];
      subtasks: Subtask[];
    }
  }) => void;
  onDelete?: () => void;
}

const AsanaTaskModal: React.FC<AsanaTaskModalProps> = ({ 
  isOpen, 
  task, 
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
        title: task.title,
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
        priority: 'normal', // Google Tasks don't have priority, default to normal
        labels: [],
        subtasks: [],
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
      
    onSubmit({
      title: formData.title,
      notes: formData.notes,
      due: formattedDue,  // Use formatted date
      metadata: {
        priority: formData.priority,
        labels: formData.labels,
        subtasks: formData.subtasks,
      },
    });
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
                {task ? 'Edit Task' : 'Create Task'}
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
                className="w-full px-4 py-3 rounded-xl border transition-all"
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
                className="w-full px-4 py-3 rounded-xl border transition-all resize-none"
                style={{ 
                  ...asanaTypography.body,
                  backgroundColor: '#F6F7F8',
                  borderColor: 'transparent',
                  outline: 'none',
                  minHeight: '100px'
                }}
                onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#D1D5DB';
                }}
                onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = '#F6F7F8';
                  e.currentTarget.style.borderColor = 'transparent';
                }}
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
                  className="w-full px-4 py-3 rounded-xl border transition-all"
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
                  className="w-full px-4 py-3 rounded-xl border transition-all cursor-pointer"
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
              {task && onDelete && (
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
                {task ? 'Save Changes' : 'Create Task'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// Clean event rendering function with Asana style
function renderEventContent(eventInfo: EventContentArg) {
  const { event, timeText, view } = eventInfo;
  const isTask = event.extendedProps.type === 'task';
  const isCompleted = isTask && event.extendedProps.taskData?.status === 'completed';
  const isTimeGridView = view.type === 'timeGridWeek' || view.type === 'timeGridDay';
  const calendarName = event.extendedProps.calendarName;

  // For time grid views
  if (isTimeGridView) {
    return (
      <div className="fc-event-main" style={{ overflow: 'hidden', maxWidth: '100%', padding: '4px 8px' }}>
        {timeText && (
          <div className="fc-event-time" style={{ ...asanaTypography.small, color: '#ffffff', marginBottom: '2px' }}>
            {timeText}
          </div>
        )}
        <div className="fc-event-title" style={{ 
          ...asanaTypography.body,
          color: '#ffffff', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          fontWeight: 500
        }}>
          {event.title}
          {calendarName && calendarName !== 'primary' && (
            <span style={{ ...asanaTypography.small, opacity: 0.8, marginLeft: '4px' }}>
              ({calendarName})
            </span>
          )}
        </div>
      </div>
    );
  }

  // Month view with Asana style
  const indicator = isTask ? (
    isCompleted ? (
      <CheckCircle2 size={14} style={{ color: '#14A085', marginRight: '6px', flexShrink: 0 }} />
    ) : (
      <Circle size={14} style={{ color: '#DDD', marginRight: '6px', flexShrink: 0 }} />
    )
  ) : (
    <div 
      className="size-2 shrink-0 rounded-full" 
      style={{ 
        marginRight: '6px', 
        backgroundColor: '#796EFF' 
      }} 
    />
  );

  return (
    <div className="fc-event-main-frame" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      overflow: 'hidden', 
      maxWidth: '100%',
      padding: '2px 8px'
    }}>
      {indicator}
      <div className="fc-event-title-container" style={{ 
        flex: '1 1 auto', 
        minWidth: '0', 
        overflow: 'hidden' 
      }}>
        <div className="fc-event-title" style={{ 
          ...asanaTypography.small,
          color: isTask ? '#151B26' : '#ffffff',
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          textDecoration: isCompleted ? 'line-through' : 'none',
          fontWeight: 500
        }}>
          {event.title}
          {calendarName && calendarName !== 'primary' && (
            <span style={{ fontSize: '10px', opacity: 0.7, marginLeft: '4px' }}>
              ({calendarName})
            </span>
          )}
        </div>
      </div>
      {timeText && (
        <div className="fc-event-time" style={{ 
          ...asanaTypography.small,
          color: isTask ? '#6B6F76' : '#ffffff',
          marginLeft: '4px',
          flexShrink: 0
        }}>
          {timeText}
        </div>
      )}
    </div>
  );
}

// Task Item Component with Asana styling
const AsanaTaskItem: React.FC<{
  task: GoogleTask;
  onToggle: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSchedule: () => void;
  onContextMenu: (e: React.MouseEvent, task: GoogleTask) => void;
}> = ({ task, onToggle, onEdit, onDuplicate, onDelete, onSchedule, onContextMenu }) => {
  const { getTaskByGoogleId, tasks } = useUnifiedTaskStore();
  const unifiedTask = getTaskByGoogleId(task.id) || tasks[task.id];
  const priority = unifiedTask?.priority || 'normal';
  
  return (
    <div 
      className="draggable-task p-4 rounded-xl bg-white transition-all cursor-pointer"
      style={{ 
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(50, 50, 93, 0.05)',
        border: '1px solid #E8E8E9',
        marginBottom: '8px'
      }}
      data-task={JSON.stringify(task)}
      onClick={(e) => {
        // Open edit modal on click (unless clicking on checkbox or button)
        const target = e.target as HTMLElement;
        if (!target.closest('button') && !target.closest('input')) {
          onEdit();
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, task);
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(50, 50, 93, 0.1)';
        e.currentTarget.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = '0 1px 3px rgba(50, 50, 93, 0.05)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <div className="flex items-start gap-3">
        <button
          onClick={onToggle}
          className="flex-shrink-0 mt-0.5"
        >
          {task.status === 'completed' ? (
            <CheckCircle2 size={18} style={{ color: '#14A085' }} />
          ) : (
            <Circle size={18} style={{ color: '#DDD' }} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <h4 
            style={{ 
              ...asanaTypography.body,
              fontWeight: 500,
              textDecoration: task.status === 'completed' ? 'line-through' : 'none',
              color: task.status === 'completed' ? '#9CA3AF' : '#151B26'
            }}
          >
            {task.title}
          </h4>
          
          {task.notes && (
            <p style={{ ...asanaTypography.small, marginTop: '4px' }}>
              {task.notes}
            </p>
          )}
          
          <div className="flex items-center gap-2 mt-2">
            {task.due && (
              <div className="flex items-center gap-1.5">
                <CalendarIcon size={12} style={{ color: '#9CA6AF' }} />
                <span style={asanaTypography.small}>
                  {new Date(task.due).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>
            )}
            
            {priority !== 'normal' && (
              <div 
                className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                style={{ 
                  backgroundColor: priorityConfig[priority as keyof typeof priorityConfig]?.bgColor || '#F3F4F6',
                  color: priorityConfig[priority as keyof typeof priorityConfig]?.textColor || '#6B6F76'
                }}
              >
                <Flag size={10} />
                <span style={{ fontSize: '11px', fontWeight: 500 }}>
                  {priorityConfig[priority as keyof typeof priorityConfig]?.label || priority}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default function CalendarAsanaStyle() {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const calendarRef = useRef<FullCalendar>(null);
  const taskPanelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CalendarView>('dayGridMonth');
  const [showTaskPanel, setShowTaskPanel] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<DateSelectArg | null>(null);
  const [selectedTaskForScheduling, setSelectedTaskForScheduling] = useState<GoogleTask | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTasksInCalendar, setShowTasksInCalendar] = useState(true);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventApi | null>(null);
  const [currentViewTitle, setCurrentViewTitle] = useState<string>('Calendar');
  const [editingTask, setEditingTask] = useState<GoogleTask | null>(null);
  const [showDeleteTaskDialog, setShowDeleteTaskDialog] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState<GoogleTask | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; task: GoogleTask; listId: string } | null>(null);

  // Get data from unified task store
  const unifiedStore = useUnifiedTaskStore();
  const taskLists = unifiedStore.columns;
  const allTasks = Object.values(unifiedStore.tasks);
  const isTasksLoading = unifiedStore.isSyncing;
  const tasksError = null; // Unified store doesn't expose error state directly
  
  // Create adapter functions for compatibility
  const fetchTaskLists = useCallback(async () => {
    // Columns are already loaded in unified store
    return unifiedStore.columns;
  }, [unifiedStore.columns]);
  
  const createGoogleTask = useCallback(async (listId: string, task: Partial<GoogleTask>) => {
    return unifiedStore.createTask({
      title: task.title || 'New Task',
      notes: task.notes || '',
      columnId: listId,
      due: task.due,
      metadata: {
        priority: 'normal' as const,
        labels: [],
        subtasks: [],
      }
    });
  }, [unifiedStore]);
  
  const updateGoogleTask = useCallback(async (taskId: string, updates: Partial<GoogleTask>) => {
    const task = allTasks.find(t => t.googleTaskId === taskId || t.id === taskId);
    if (task) {
      return unifiedStore.updateTask(task.id, {
        title: updates.title,
        notes: updates.notes,
        due: updates.due,
        status: updates.status,
      });
    }
  }, [unifiedStore, allTasks]);
  
  const deleteGoogleTask = useCallback(async (taskId: string, listId: string) => {
    const task = allTasks.find(t => t.googleTaskId === taskId || t.id === taskId);
    if (task) {
      return unifiedStore.deleteTask(task.id);
    }
  }, [unifiedStore, allTasks]);
  
  const toggleTaskComplete = useCallback(async (taskId: string) => {
    const task = allTasks.find(t => t.googleTaskId === taskId || t.id === taskId);
    if (task) {
      const newStatus = task.status === 'completed' ? 'needsAction' : 'completed';
      return unifiedStore.updateTask(task.id, { status: newStatus });
    }
  }, [unifiedStore, allTasks]);
  
  const authenticateTasks = useCallback(async (account: any) => {
    // Authentication is handled at app level now
    return Promise.resolve();
  }, []);
  
  const isTasksAuthenticated = true; // Authentication is handled at app level
  const isTasksHydrated = unifiedStore.columns.length > 0; // Consider hydrated if we have columns
  
  const syncAllTasks = useCallback(async () => {
    // Sync is automatic in unified store
    return Promise.resolve();
  }, []);
  
  // Transform unified tasks to google tasks format for calendar
  const googleTasks = useMemo(() => {
    const tasksByList: Record<string, GoogleTask[]> = {};
    const taskIdOccurrences = new Map<string, number>();
    
    // Remove verbose logging
    
    taskLists.forEach(list => {
      tasksByList[list.id] = allTasks
        .filter(task => task.columnId === list.id)
        .map((task) => {
          // Use the original task ID without modification to ensure consistency
          const taskId = task.googleTaskId || task.id;
          
          // Track how many times we see each task ID
          const count = (taskIdOccurrences.get(taskId) || 0) + 1;
          taskIdOccurrences.set(taskId, count);
          // Track duplicates silently
          
          return {
            id: taskId,
            title: task.title,
            notes: task.notes || '',
            status: task.status || 'needsAction',
            due: task.due,
            completed: task.completedAt,
            updated: task.updatedAt,
            position: task.position.toString(),
            selfLink: '',
            etag: '',
          } as GoogleTask;
        });
    });
    
    // Log duplicate task IDs
    const duplicates = Array.from(taskIdOccurrences.entries())
      .filter(([id, count]) => count > 1)
      .map(([id, count]) => ({ id, count }));
    
    // Only warn about duplicates if there are many
    if (duplicates.length > 10) {
      console.warn(`[CalendarAsanaStyle] Found ${duplicates.length} duplicate task IDs`);
    }
    
    return tasksByList;
  }, [taskLists, allTasks]);

  const { 
    events: calendarEvents, 
    fetchEvents: fetchCalendarEvents,
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    isAuthenticated: isCalendarAuthenticated,
  } = useGoogleCalendarStore();

  const activeAccount = useActiveGoogleAccount();

  // Similar useEffects and handlers from original Calendar component...
  // (I'll include the key ones for brevity)

  useEffect(() => {
    if (activeAccount && !isTasksAuthenticated && isTasksHydrated) {
      authenticateTasks(activeAccount as any);
    }
  }, [activeAccount, isTasksAuthenticated, isTasksHydrated, authenticateTasks]);

  useEffect(() => {
    clearHeaderProps();
    return () => clearHeaderProps();
  }, [clearHeaderProps]);

  // Close context menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contextMenu && !(event.target as Element).closest('.context-menu')) {
        setContextMenu(null);
      }
    };
    
    if (contextMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [contextMenu]);

  const goToToday = () => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.today();
      updateViewTitle(calendarApi);
    }
  };

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      if (direction === 'prev') {
        calendarApi.prev();
      } else {
        calendarApi.next();
      }
      updateViewTitle(calendarApi);
    }
  };

  const changeView = (newView: CalendarView) => {
    setView(newView);
    const calendarApi = calendarRef.current?.getApi();
    if (calendarApi) {
      calendarApi.changeView(newView);
      updateViewTitle(calendarApi);
    }
  };

  const updateViewTitle = (calendarApi: any) => {
    setCurrentViewTitle(calendarApi.view.title);
  };

  // Create combined events from calendar events and tasks with deduplication
  const fullCalendarEvents = useMemo(() => {
    const events: any[] = [];
    const eventTitlesAndDates = new Set<string>();
    const usedEventIds = new Set<string>(); // Track all event IDs to ensure uniqueness
    const seenTaskIds = new Set<string>();
    const addedTaskKeys = new Set<string>(); // Track tasks by content, not just ID

    // Add calendar events first
    calendarEvents.forEach(event => {
      // Normalize date to YYYY-MM-DD format for consistent comparison
      const eventDate = event.start?.dateTime || event.start?.date;
      let normalizedDate = '';
      try {
        normalizedDate = eventDate ? new Date(eventDate).toISOString().split('T')[0] : '';
      } catch (e) {
        // Silently handle date parsing errors
        normalizedDate = eventDate ? String(eventDate).split('T')[0] || '' : '';
      }
      const eventKey = `${(event.summary || 'untitled').toLowerCase()}_${normalizedDate}`;
      eventTitlesAndDates.add(eventKey);
      
      // Track calendar event IDs
      usedEventIds.add(event.id);
      
      events.push({
        id: event.id,
        title: event.summary || 'Untitled Event',
        start: event.start?.dateTime || event.start?.date,
        end: event.end?.dateTime || event.end?.date,
        allDay: !event.start?.dateTime,
        backgroundColor: '#796EFF',
        borderColor: '#796EFF',
        extendedProps: {
          type: 'calendar',
          eventData: event,
          description: event.description,
          location: event.location,
          calendarName: event.organizer?.displayName || 'primary',
        },
      });
    });
    
    // Add tasks if enabled, but skip if a calendar event with same title and date exists
    if (showTasksInCalendar) {
      
      Object.entries(googleTasks).forEach(([listId, tasks]) => {
        tasks.forEach(task => {
          if (task.due) {
            // Normalize task date to YYYY-MM-DD format for consistent comparison
            let normalizedTaskDate = '';
            try {
              normalizedTaskDate = new Date(task.due).toISOString().split('T')[0];
            } catch (e) {
              // Silently handle date parsing errors
              normalizedTaskDate = String(task.due).split('T')[0] || '';
            }
            const taskKey = `${(task.title || 'untitled').toLowerCase()}_${normalizedTaskDate}`;
            
            // Create a unique key combining task ID and list ID to handle duplicates across lists
            const uniqueTaskKey = `${task.id}_${listId}`;
            
            // Remove verbose logging to reduce console spam
            
            // Skip this task if:
            // 1. A calendar event with the same title and date already exists
            // 2. We've already added a task with the same content (title + date)
            // 3. We've already processed this specific task+list combination
            if (!eventTitlesAndDates.has(taskKey) && !addedTaskKeys.has(taskKey) && !seenTaskIds.has(uniqueTaskKey)) {
              seenTaskIds.add(uniqueTaskKey);
              addedTaskKeys.add(taskKey); // Prevent duplicate tasks with same title/date
              
              // Remove verbose logging to reduce console spam
              
              // Generate a unique event ID and ensure it's not already used
              let eventId = `task-${task.id}-${listId}`;
              let counter = 0;
              while (usedEventIds.has(eventId)) {
                counter++;
                eventId = `task-${task.id}-${listId}-${counter}`;
              }
              usedEventIds.add(eventId);
              
              events.push({
                id: eventId,
                title: task.title,
                start: task.due,
                allDay: true,
                backgroundColor: task.status === 'completed' ? '#E8F5F3' : '#FFF6E6',
                borderColor: task.status === 'completed' ? '#14A085' : '#E68900',
                extendedProps: {
                  type: 'task',
                  taskData: task,
                  listId: listId,
                },
              });
            }
          }
        });
      });
    }
    
    // Check for any duplicate IDs in the final events array
    const finalEventIds = new Set<string>();
    const duplicateIds = [];
    events.forEach(event => {
      if (finalEventIds.has(event.id)) {
        duplicateIds.push(event.id);
      }
      finalEventIds.add(event.id);
    });
    
    if (duplicateIds.length > 0) {
      console.error('[Calendar] CRITICAL: Duplicate event IDs found:', duplicateIds);
    }
    
    // Only log summary if tasks are shown to reduce console spam
    if (showTasksInCalendar && seenTaskIds.size > 0) {
      console.log('[Calendar] Event generation complete:', {
        totalEvents: events.length,
        calendarEvents: calendarEvents.length,
        tasksProcessed: seenTaskIds.size,
        uniqueEventIds: usedEventIds.size
      });
    }

    return events;
  }, [calendarEvents, googleTasks, showTasksInCalendar]);

  // Filter events by search query
  const filteredCalendarEvents = useMemo(() => {
    if (!searchQuery) return fullCalendarEvents;
    
    const query = searchQuery.toLowerCase();
    return fullCalendarEvents.filter(event => 
      event.title.toLowerCase().includes(query) ||
      ((event.extendedProps as any).description && ((event.extendedProps as any).description as string).toLowerCase().includes(query)) ||
      ((event.extendedProps as any).location && ((event.extendedProps as any).location as string).toLowerCase().includes(query))
    );
  }, [fullCalendarEvents, searchQuery]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    setError(null);
    try {
      await Promise.all([
        fetchCalendarEvents(),
        fetchTaskLists(),
        syncAllTasks()
      ]);
    } catch (err) {
      console.error('Failed to refresh calendar data:', err);
      setError('Failed to refresh calendar data. Please try again.');
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchCalendarEvents, fetchTaskLists, syncAllTasks]);

  if (!activeAccount || (!isCalendarAuthenticated && !isTasksAuthenticated)) {
    return (
      <div className="flex h-full items-center justify-center" style={{ backgroundColor: '#FAFBFC' }}>
        <div className="text-center">
          <h2 style={asanaTypography.h1}>No Google Account Connected</h2>
          <p style={{ ...asanaTypography.body, marginTop: '8px', marginBottom: '24px' }}>
            Please connect a Google account in Settings to view your calendar and tasks.
          </p>
          <button
            onClick={() => navigate('/settings')}
            className="px-6 py-3 rounded-xl transition-all"
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
            Go to Settings
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex h-full" style={{ backgroundColor: '#FAFBFC' }}>
        {/* Main Calendar Area */}
        <div className="flex h-full min-w-0 flex-1 flex-col">
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-4" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
              {/* Left side - Navigation and Title */}
              <div className="flex items-center gap-4">
                <button 
                  onClick={goToToday}
                  className="px-4 py-2 rounded-xl transition-colors"
                  style={{ 
                    ...asanaTypography.body,
                    backgroundColor: '#F6F7F8',
                    color: '#151B26',
                    fontWeight: 500
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#E8E9EA';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#F6F7F8';
                  }}
                >
                  Today
                </button>
                
                <div className="flex items-center">
                  <button 
                    onClick={() => navigateCalendar('prev')}
                    className="p-2 rounded-l-xl transition-colors"
                    style={{ 
                      backgroundColor: '#F6F7F8',
                      borderRight: '1px solid #E8E8E9'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8E9EA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F6F7F8';
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <button 
                    onClick={() => navigateCalendar('next')}
                    className="p-2 rounded-r-xl transition-colors"
                    style={{ 
                      backgroundColor: '#F6F7F8'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#E8E9EA';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#F6F7F8';
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
                
                <h1 style={asanaTypography.h1}>
                  {currentViewTitle}
                </h1>
              </div>

              {/* Center - Search */}
              <div className="relative max-w-md flex-1 mx-6">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#9CA3AF' }} />
                <input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 rounded-xl outline-none transition-all w-full"
                  style={{ 
                    ...asanaTypography.body,
                    backgroundColor: '#F6F7F8',
                    border: '1px solid transparent'
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
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Right side - View toggles and actions */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 p-1 rounded-xl" style={{ backgroundColor: '#F6F7F8' }}>
                  <button
                    onClick={() => changeView('dayGridMonth')}
                    className="px-3 py-1.5 rounded-lg transition-colors"
                    style={{ 
                      ...asanaTypography.small,
                      backgroundColor: view === 'dayGridMonth' ? '#FFFFFF' : 'transparent',
                      color: view === 'dayGridMonth' ? '#151B26' : '#6B6F76',
                      fontWeight: 500,
                      boxShadow: view === 'dayGridMonth' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Month
                  </button>
                  <button
                    onClick={() => changeView('timeGridWeek')}
                    className="px-3 py-1.5 rounded-lg transition-colors"
                    style={{ 
                      ...asanaTypography.small,
                      backgroundColor: view === 'timeGridWeek' ? '#FFFFFF' : 'transparent',
                      color: view === 'timeGridWeek' ? '#151B26' : '#6B6F76',
                      fontWeight: 500,
                      boxShadow: view === 'timeGridWeek' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Week
                  </button>
                  <button
                    onClick={() => changeView('timeGridDay')}
                    className="px-3 py-1.5 rounded-lg transition-colors"
                    style={{ 
                      ...asanaTypography.small,
                      backgroundColor: view === 'timeGridDay' ? '#FFFFFF' : 'transparent',
                      color: view === 'timeGridDay' ? '#151B26' : '#6B6F76',
                      fontWeight: 500,
                      boxShadow: view === 'timeGridDay' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                    }}
                  >
                    Day
                  </button>
                </div>
                
                <button
                  onClick={() => setShowTasksInCalendar(!showTasksInCalendar)}
                  className="p-2 rounded-xl transition-colors"
                  style={{ 
                    backgroundColor: showTasksInCalendar ? '#E8F5F3' : '#F6F7F8',
                    color: showTasksInCalendar ? '#14A085' : '#6B6F76'
                  }}
                  title={showTasksInCalendar ? 'Hide tasks' : 'Show tasks'}
                >
                  <ListChecks size={18} />
                </button>
                
                <button 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="p-2 rounded-xl transition-colors"
                  style={{ 
                    backgroundColor: '#F6F7F8',
                    color: '#6B6F76'
                  }}
                  title="Refresh"
                >
                  <RefreshCw size={18} className={isRefreshing ? 'animate-spin' : ''} />
                </button>
                
                <div className="w-px h-6" style={{ backgroundColor: '#E8E8E9' }} />
                
                <button 
                  onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                  className="px-4 py-2 rounded-xl transition-all flex items-center gap-2"
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
                  <Plus size={16} />
                  New event
                </button>
              </div>
            </div>

            {/* Calendar Container */}
            <div className="flex-1 p-6 overflow-hidden">
              <div className="h-full bg-white rounded-xl" style={{ border: '1px solid #E8E8E9' }}>
                <div className="calendar-wrapper h-full p-4">
                  <FullCalendar
                    ref={calendarRef}
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView={view}
                    headerToolbar={false}
                    events={filteredCalendarEvents}
                    eventContent={renderEventContent}
                    editable={true}
                    selectable={true}
                    selectMirror={true}
                    dayMaxEvents={3}
                    weekends={true}
                    nowIndicator={true}
                    height="100%"
                    eventClassNames="asana-calendar-event"
                    dayCellClassNames="asana-calendar-day"
                    viewClassNames="asana-calendar-view"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Sidebar */}
        {showTaskPanel && (
          <div className="w-80 border-l bg-white flex flex-col h-full" style={{ borderColor: '#E8E8E9' }}>
            <div className="p-6 pb-4">
              <h2 style={asanaTypography.h2}>Tasks</h2>
              
              {/* List Filter */}
              <div className="mt-4">
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl cursor-pointer"
                  style={{ 
                    ...asanaTypography.body,
                    backgroundColor: '#F6F7F8',
                    border: '1px solid transparent',
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
                >
                  <option value="all">All lists</option>
                  {taskLists.map(list => (
                    <option key={list.id} value={list.id}>{list.title}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Tasks List */}
            <div ref={taskPanelRef} className="flex-1 overflow-y-auto px-6 pb-6" style={{ maxHeight: 'calc(100% - 120px)' }}>
              {Object.entries(googleTasks).map(([listId, tasks]) => {
                if (selectedColumnId !== 'all' && selectedColumnId !== listId) return null;
                
                const incompleteTasks = tasks.filter(t => t.status !== 'completed');
                const completedTasks = tasks.filter(t => t.status === 'completed');
                
                return (
                  <div key={listId} className="mb-6">
                    {incompleteTasks.map(task => (
                      <AsanaTaskItem
                        key={task.id}
                        task={task}
                        onToggle={() => toggleTaskComplete(listId, task.id)}
                        onEdit={() => {
                          setEditingTask(task);
                          setShowTaskModal(true);
                        }}
                        onDuplicate={() => {
                          createGoogleTask(listId, {
                            title: `${task.title} (Copy)`,
                            notes: task.notes,
                            due: task.due,
                          });
                        }}
                        onDelete={() => {
                          setTaskToDelete(task);
                          setShowDeleteTaskDialog(true);
                        }}
                        onSchedule={() => {
                          setSelectedTaskForScheduling(task);
                          setSelectedScheduleDate(new Date());
                          setShowScheduleModal(true);
                        }}
                        onContextMenu={(e, task) => {
                          setContextMenu({
                            x: e.clientX,
                            y: e.clientY,
                            task,
                            listId
                          });
                        }}
                      />
                    ))}
                    
                    {completedTasks.length > 0 && (
                      <details className="mt-4">
                        <summary style={{ ...asanaTypography.small, cursor: 'pointer', marginBottom: '8px' }}>
                          Completed ({completedTasks.length})
                        </summary>
                        {completedTasks.map(task => (
                          <AsanaTaskItem
                            key={task.id}
                            task={task}
                            onToggle={() => toggleTaskComplete(listId, task.id)}
                            onEdit={() => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }}
                            onDuplicate={() => {
                              createGoogleTask(listId, {
                                title: `${task.title} (Copy)`,
                                notes: task.notes,
                                due: task.due,
                              });
                            }}
                            onDelete={() => {
                              setTaskToDelete(task);
                              setShowDeleteTaskDialog(true);
                            }}
                            onSchedule={() => {
                              setSelectedTaskForScheduling(task);
                              setSelectedScheduleDate(new Date());
                              setShowScheduleModal(true);
                            }}
                            onContextMenu={(e, task) => {
                              setContextMenu({
                                x: e.clientX,
                                y: e.clientY,
                                task,
                                listId
                              });
                            }}
                          />
                        ))}
                      </details>
                    )}
                  </div>
                );
              })}
              
              {/* Add Task Button */}
              <button
                onClick={() => {
                  setEditingTask(null);
                  setShowTaskModal(true);
                }}
                className="w-full p-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
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
              >
                <Plus size={16} />
                Add task
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <AsanaTaskModal
          isOpen={showTaskModal}
          task={editingTask}
          onClose={() => {
            setShowTaskModal(false);
            setEditingTask(null);
          }}
          onSubmit={async (data) => {
            try {
              const listId = selectedColumnId === 'all' ? taskLists[0]?.id : selectedColumnId;
              if (!listId) return;
              
              if (editingTask) {
                await updateGoogleTask(listId, editingTask.id, data);
              } else {
                await createGoogleTask(listId, data);
              }
              
              setShowTaskModal(false);
              setEditingTask(null);
            } catch (error) {
              console.error('Failed to save task:', error);
              setError('Failed to save task. Please try again.');
            }
          }}
          onDelete={editingTask ? () => {
            setTaskToDelete(editingTask);
            setShowDeleteTaskDialog(true);
            setShowTaskModal(false);
            setEditingTask(null);
          } : undefined}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteTaskDialog && taskToDelete && (
        <ConfirmDialog
          isOpen={showDeleteTaskDialog}
          title="Delete task?"
          message={`Are you sure you want to delete "${taskToDelete.title}"? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={async () => {
            try {
              const taskListId = Object.keys(googleTasks).find(listId => 
                googleTasks[listId].some(t => t.id === taskToDelete.id)
              );
              
              if (taskListId) {
                await deleteGoogleTask(taskListId, taskToDelete.id);
              }
              
              setShowDeleteTaskDialog(false);
              setTaskToDelete(null);
            } catch (error) {
              console.error('Error deleting task:', error);
              setError('Failed to delete task. Please try again.');
            }
          }}
          onCancel={() => {
            setShowDeleteTaskDialog(false);
            setTaskToDelete(null);
          }}
        />
      )}

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
              setEditingTask(contextMenu.task);
              setShowTaskModal(true);
              setContextMenu(null);
            }}
          >
            <Edit2 size={14} />
            Edit Task
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              setSelectedTaskForScheduling(contextMenu.task);
              setSelectedScheduleDate(new Date());
              setShowScheduleModal(true);
              setContextMenu(null);
            }}
          >
            <CalendarIcon size={14} />
            Schedule
          </button>
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
            onClick={() => {
              createGoogleTask(contextMenu.listId, {
                title: `${contextMenu.task.title} (Copy)`,
                notes: contextMenu.task.notes,
                due: contextMenu.task.due,
              });
              setContextMenu(null);
            }}
          >
            <Copy size={14} />
            Duplicate
          </button>
          
          <div className="border-t border-gray-100 my-1" />
          
          <div className="px-4 py-1 text-xs text-gray-500 font-medium">Priority</div>
          {(['urgent', 'high', 'medium', 'low'] as const).map(priority => (
            <button
              key={priority}
              className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
              onClick={() => {
                // Update task priority in unified store
                const { updateTask, getTaskByGoogleId } = useUnifiedTaskStore.getState();
                const unifiedTask = getTaskByGoogleId(contextMenu.task.id);
                if (unifiedTask) {
                  updateTask(unifiedTask.id, { priority });
                }
                setContextMenu(null);
              }}
            >
              <Flag size={14} style={{ color: priorityConfig[priority]?.textColor || '#6B6F76' }} />
              {priorityConfig[priority]?.label || priority}
            </button>
          ))}
          
          <div className="border-t border-gray-100 my-1" />
          
          <button
            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2 text-red-600"
            onClick={() => {
              setTaskToDelete(contextMenu.task);
              setShowDeleteTaskDialog(true);
              setContextMenu(null);
            }}
          >
            <Trash2 size={14} />
            Delete Task
          </button>
        </div>
      )}

      {/* Add custom styles for calendar */}
      <style>{`
        .asana-calendar-view {
          font-family: var(--font-sans) !important;
        }
        
        .asana-calendar-day {
          border-color: #E8E8E9 !important;
          background-color: #FFFFFF;
        }
        
        .asana-calendar-day.fc-day-today {
          background-color: #F9FAFB !important;
        }
        
        .fc-day-number {
          color: #151B26;
          font-weight: 500;
          font-size: 13px;
        }
        
        .fc-col-header-cell {
          background-color: #F9FAFB;
          border-color: #E8E8E9 !important;
          font-weight: 600;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: #6B6F76;
          padding: 12px 0;
        }
        
        .asana-calendar-event {
          border-radius: 8px !important;
          border: none !important;
          font-size: 13px;
          margin: 2px;
          padding: 0;
          overflow: hidden;
        }
        
        .fc-event-main {
          padding: 4px 8px;
        }
        
        .fc-daygrid-day-events {
          margin-top: 4px;
        }
        
        .fc-daygrid-more-link {
          color: #796EFF !important;
          font-weight: 500;
          font-size: 12px;
        }
        
        .fc-timegrid-slot {
          height: 60px;
          border-color: #E8E8E9 !important;
        }
        
        .fc-timegrid-slot-label {
          color: #9CA6AF;
          font-size: 12px;
          font-weight: 400;
        }
        
        .fc-scrollgrid {
          border-color: #E8E8E9 !important;
        }
        
        .fc-theme-standard td,
        .fc-theme-standard th {
          border-color: #E8E8E9 !important;
        }
      `}</style>
    </>
  );
}
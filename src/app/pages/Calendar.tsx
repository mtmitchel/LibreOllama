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
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, X, RefreshCw, Search, ListChecks, CheckCircle, ChevronDown, Edit2, Copy, Trash2, CheckSquare } from 'lucide-react';

import { Button, Card, Text, Heading, Input } from '../../components/ui';
import { ContextMenu } from '../../components/ui/ContextMenu';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { useHeader } from '../contexts/HeaderContext';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable, DropArg } from '@fullcalendar/interaction';
import { useActiveGoogleAccount } from '../../stores/settingsStore';
import { devLog } from '../../utils/devLog';
import './calendar.css';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
  due?: string;
}

interface Recurring {
  enabled: boolean;
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  endDate?: string;
}

interface GoogleTask {
  id: string;
  title: string;
  notes?: string;
  due?: string;
  status: 'needsAction' | 'completed';
  [key: string]: unknown; // Allow other properties
}

// Google Calendar authentication now handled centrally in Settings

// Simple Task Modal Component for Google Tasks
const SimpleTaskModal = ({ isOpen, task, onClose, onSubmit, onDelete }: {
  isOpen: boolean;
  task?: GoogleTask | null;
  onClose: () => void;
  onSubmit: (data: { title: string; notes?: string; due?: string; metadata?: {
    priority: 'low' | 'normal' | 'high' | 'urgent';
    labels: string[];
    subtasks: Subtask[];
    recurring?: Recurring;
  } }) => void;
  onDelete?: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    labels: [] as string[],
    subtasks: [] as Subtask[],
    recurringEnabled: false,
    recurringFrequency: 'daily' as 'daily' | 'weekly' | 'monthly' | 'yearly',
    recurringInterval: 1,
    recurringEndDate: '',
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
        recurringEnabled: false,
        recurringFrequency: 'daily',
        recurringInterval: 1,
        recurringEndDate: '',
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        due: '',
        priority: 'normal',
        labels: [],
        subtasks: [],
        recurringEnabled: false,
        recurringFrequency: 'daily',
        recurringInterval: 1,
        recurringEndDate: '',
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
    onSubmit({
      title: formData.title,
      notes: formData.notes,
      due: formData.due ? formData.due : undefined,
      metadata: {
        priority: formData.priority,
        labels: formData.labels,
        subtasks: formData.subtasks,
        recurring: formData.recurringEnabled ? {
          enabled: true,
          frequency: formData.recurringFrequency,
          interval: formData.recurringInterval,
          endDate: formData.recurringEndDate ? formData.recurringEndDate : undefined,
        } : undefined,
      },
    });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto">
        <Card className="w-full !bg-bg-primary" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            <Heading level={2} className="text-lg font-semibold">
              {task ? 'Edit task' : 'Create task'}
            </Heading>
            
            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Title</Text>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                placeholder="Task title..."
                required
              />
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Notes</Text>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                placeholder="Task description..."
                rows={3}
              />
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Due date</Text>
              <input
                type="date"
                value={formData.due}
                onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
              />
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Priority</Text>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent' }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Labels Section */}
            <div>
              <Text as="label" size="sm" weight="medium" className="mb-2 block">Labels</Text>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 flex-1 rounded-md border p-2 text-sm focus:border-accent-primary focus:ring-2"
                    placeholder="Add a label..."
                  />
                  <Button type="button" onClick={addLabel} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {formData.labels.map(label => (
                      <span
                        key={label}
                        className="text-text-secondary inline-flex items-center gap-1 rounded bg-tertiary px-2 py-1 text-xs"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="ml-1 hover:text-error"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks Section */}
            <div>
              <Text as="label" size="sm" weight="medium" className="mb-2 block">Subtasks</Text>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 flex-1 rounded-md border p-2 text-sm focus:border-accent-primary focus:ring-2"
                    placeholder="Add a subtask..."
                  />
                  <Button type="button" onClick={addSubtask} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.subtasks.length > 0 && (
                  <div className="max-h-32 space-y-2 overflow-y-auto">
                    {formData.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="border-border-primary flex items-center gap-2 rounded border bg-card p-2"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`flex size-4 items-center justify-center rounded border-2 ${
                            subtask.completed 
                              ? 'border-success bg-success text-white' 
                              : 'border-border-primary hover:border-success'
                          }`}
                        >
                          {subtask.completed && '✓'}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="hover:text-error-hover p-1 text-error"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Section */}
            <div>
              <Text as="label" size="sm" weight="medium" className="mb-2 block">Recurring</Text>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={formData.recurringEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringEnabled: e.target.checked }))}
                    className="border-border-primary focus:ring-accent-primary/20 size-4 rounded border focus:border-accent-primary focus:ring-2"
                  />
                  <label htmlFor="recurring-enabled" className="text-sm text-text-primary">
                    Make this task recurring
                  </label>
                </div>
                
                {formData.recurringEnabled && (
                  <div className="border-border-muted space-y-3 border-l-2 pl-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Text as="label" size="xs" weight="medium" variant="muted" className="mb-1 block">Frequency</Text>
                        <select
                          value={formData.recurringFrequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringFrequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly' }))}
                          className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 text-sm focus:border-accent-primary focus:ring-2"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <Text as="label" size="xs" weight="medium" variant="muted" className="mb-1 block">Interval</Text>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.recurringInterval}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringInterval: parseInt(e.target.value) || 1 }))}
                          className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 text-sm focus:border-accent-primary focus:ring-2"
                        />
                      </div>
                    </div>
                    <div>
                      <Text as="label" size="xs" weight="medium" variant="muted" className="mb-1 block">End date (optional)</Text>
                      <input
                        type="date"
                        value={formData.recurringEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                        className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 text-sm focus:border-accent-primary focus:ring-2"
                      />
                    </div>
                    <Text size="xs" className="text-info">
                      Repeats every {formData.recurringInterval} {formData.recurringFrequency.replace('ly', '')}
                      {formData.recurringInterval > 1 ? 's' : ''}
                      {formData.recurringEndDate && ` until ${new Date(formData.recurringEndDate + 'T00:00:00').toLocaleDateString()}`}
                    </Text>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="border-border-primary flex items-center justify-between border-t p-6">
            <div>
              {task && onDelete && (
                <Button type="button" variant="outline" onClick={onDelete} className="border-error text-error">
                  Delete
                </Button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                {task ? 'Update' : 'Create'}
              </Button>
            </div>
          </div>
        </form>
        </Card>
      </div>
    </div>
  );
};

// Schedule Task Modal Component for Google Tasks
const ScheduleTaskModal = ({ 
  isOpen, 
  task, 
  selectedDate, 
  onClose, 
  onSchedule 
}: {
  isOpen: boolean;
  task: GoogleTask | null;
  selectedDate: Date | null;
  onClose: () => void;
  onSchedule: (data: { 
    title: string; 
    startTime: string; 
    endTime: string; 
    description?: string; 
    location?: string 
  }) => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    startTime: '09:00',
    endTime: '10:00',
    description: '',
    location: '',
  });

  useEffect(() => {
    if (task && selectedDate) {
      setFormData({
        title: task.title,
        startTime: '09:00',
        endTime: '10:00',
        description: task.notes || '',
        location: '',
      });
    }
  }, [task, selectedDate, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSchedule(formData);
    onClose();
  };

  if (!isOpen || !task || !selectedDate) return null;

  return (
    <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <Card className="w-full max-w-md !bg-bg-primary" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 p-6">
            <div className="flex items-center justify-between">
              <Heading level={2} className="text-lg font-semibold">Schedule task</Heading>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
            
                          <div className="rounded-lg bg-card p-3">
              <Text size="sm" variant="muted">
                Scheduling for: <strong>{selectedDate.toLocaleDateString()}</strong>
              </Text>
              <Text size="sm" weight="medium" className="text-text-primary mt-1">{task.title}</Text>
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Event title</Text>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                placeholder="Event title..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Text as="label" size="sm" weight="medium" className="mb-1 block">Start time</Text>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                  required
                />
              </div>
              <div>
                <Text as="label" size="sm" weight="medium" className="mb-1 block">End time</Text>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                  required
                />
              </div>
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Description</Text>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                placeholder="Event description..."
                rows={3}
              />
            </div>

            <div>
              <Text as="label" size="sm" weight="medium" className="mb-1 block">Location</Text>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2"
                placeholder="Event location..."
              />
            </div>
          </div>

          <div className="border-border-primary flex items-center justify-end gap-2 border-t p-6">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

// Clean event rendering function using only design system elements
function renderEventContent(eventInfo: EventContentArg) {
  const { event, timeText, view } = eventInfo;
  const isTask = event.extendedProps.type === 'task';
  const isCompleted = isTask && event.extendedProps.taskData?.status === 'completed';
  const isTimeGridView = view.type === 'timeGridWeek' || view.type === 'timeGridDay';

  // For time grid views, use a more detailed layout
  if (isTimeGridView) {
    return (
      <div className="fc-event-main" style={{ overflow: 'hidden', maxWidth: '100%' }}>
        {timeText && (
          <div className="fc-event-time" style={{ color: '#ffffff', fontSize: '11px', fontWeight: '500' }}>
            {timeText}
          </div>
        )}
        <div className="fc-event-title" style={{ 
          color: '#ffffff', 
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          fontWeight: '500'
        }}>
          {event.title}
        </div>
      </div>
    );
  }

  // Month view with strict overflow control
  const indicator = isTask ? (
    <div 
      className="size-2 shrink-0 rounded-sm" 
      style={{ 
        marginRight: '4px', 
        backgroundColor: isCompleted ? 'var(--status-success)' : 'var(--status-warning)' 
      }} 
    />
  ) : (
    <div 
      className="size-2 shrink-0 rounded-full" 
      style={{ 
        marginRight: '4px', 
        backgroundColor: 'var(--accent-primary)' 
      }} 
    />
  );

  return (
    <div className="fc-event-main-frame" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      overflow: 'hidden', 
      maxWidth: '100%' 
    }}>
      {indicator}
      <div className="fc-event-title-container" style={{ 
        flex: '1 1 auto', 
        minWidth: '0', 
        overflow: 'hidden' 
      }}>
        <div className="fc-event-title" style={{ 
          color: isTask ? '#18181b' : '#ffffff', // Dark text for tasks, white for events
          overflow: 'hidden', 
          textOverflow: 'ellipsis', 
          whiteSpace: 'nowrap',
          textDecoration: isCompleted ? 'line-through' : 'none',
          fontWeight: '500'
        }}>
          {event.title}
        </div>
      </div>
      {timeText && (
        <div className="fc-event-time" style={{ 
          color: isTask ? '#18181b' : '#ffffff', // Dark text for tasks, white for events
          fontSize: '11px',
          marginLeft: '4px',
          flexShrink: 0,
          fontWeight: '500'
        }}>
          {timeText}
        </div>
      )}
    </div>
  );
}

export default function Calendar() {
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
  const [compactMode, setCompactMode] = useState(false);
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

  const {
    taskLists,
    tasks: googleTasks,
    isLoading: isTasksLoading,
    error: tasksError,
    fetchTaskLists,
    createTask: createGoogleTask,
    updateTask: updateGoogleTask,
    deleteTask: deleteGoogleTask,
    toggleTaskComplete,
    authenticate: authenticateTasks,
    isAuthenticated: isTasksAuthenticated,
    isHydrated: isTasksHydrated,
    syncAllTasks,
  } = useGoogleTasksStore();

  const { 
    events: calendarEvents, 
    fetchEvents: fetchCalendarEvents,
    createEvent: createCalendarEvent,
    updateEvent: updateCalendarEvent,
    deleteEvent: deleteCalendarEvent,
    isAuthenticated: isCalendarAuthenticated,
  } = useGoogleCalendarStore();

  const activeAccount = useActiveGoogleAccount();

  useEffect(() => {
    if (activeAccount && !isTasksAuthenticated && isTasksHydrated) {
      authenticateTasks(activeAccount as any);
    }
  }, [activeAccount, isTasksAuthenticated, isTasksHydrated, authenticateTasks]);

  useEffect(() => {
    if (isTasksAuthenticated && taskLists.length === 0) {
      fetchTaskLists().catch((err) => {
        console.error('Failed to fetch task lists:', err);
        setError('Failed to load task lists. Please refresh the page.');
      });
    }
  }, [isTasksAuthenticated, taskLists.length, fetchTaskLists]);
  
  useEffect(() => {
    if (taskPanelRef.current) {
      new Draggable(taskPanelRef.current, {
        itemSelector: '.draggable-task',
        eventData: function(eventEl) {
          const taskJson = eventEl.getAttribute('data-task');
          if (taskJson) {
              const task: GoogleTask = JSON.parse(taskJson);
              return {
                  title: task.title,
                  duration: '01:00',
                  extendedProps: {
                      taskId: task.id,
                      taskData: task,
                      type: 'task'
                  }
              };
          }
          return {};
        }
      });
    }
  }, []);



  useEffect(() => {
    if (activeAccount) {
      setError(null);
      fetchCalendarEvents().catch((err) => {
        console.error('Failed to fetch calendar events:', err);
        setError('Failed to load calendar events. Please try again.');
      });
    }
  }, [activeAccount, fetchCalendarEvents]);

  // Get filtered tasks based on selected task list
  const getFilteredTasks = () => {
    const tasks = selectedColumnId === 'all'
      ? Object.values(googleTasks).flat()
      : googleTasks[selectedColumnId] || [];
    
    // Deduplicate tasks by ID to prevent key errors
    const uniqueTasks = Array.from(new Map(tasks.map(task => [task.id, task])).values());
    return uniqueTasks;
  };

  const filteredTasks = getFilteredTasks();

  const fullCalendarEvents = useMemo(() => {
    // Convert Google Calendar events to FullCalendar format
    const calendarEventsFormatted = (calendarEvents || []).map(event => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      allDay: !event.start.dateTime,
      extendedProps: {
        description: event.description,
        location: event.location,
        status: event.status,
        type: 'event',
      }
    }));
  
    // Convert tasks with due dates to calendar events
    const taskEventsFormatted = showTasksInCalendar ? 
      filteredTasks
        .filter(task => task.due) // Show all tasks with due dates
        .map(task => ({
          id: `task-${task.id}`,
          title: task.title,
          start: task.due!.split('T')[0],
          allDay: true,
          classNames: [
            'fc-event-task',
            task.status === 'completed' ? 'fc-event-task-completed' : ''
          ],
          extendedProps: {
            type: 'task',
            taskId: task.id,
            taskData: task,
          }
        })) : [];

    return [...calendarEventsFormatted, ...taskEventsFormatted];
  }, [calendarEvents, showTasksInCalendar, filteredTasks]);


  const goToToday = () => calendarRef.current?.getApi().today();

  const navigateCalendar = (direction: 'prev' | 'next') => {
    const api = calendarRef.current?.getApi();
    if (direction === 'prev') api?.prev();
    else api?.next();
  };

  const changeView = (newView: CalendarView) => {
    setView(newView);
    calendarRef.current?.getApi().changeView(newView);
  };

  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDateInfo(selectInfo);
    setEditingEvent(null);
    const startTime = selectInfo.start.toISOString().slice(11, 16);
    const endTime = selectInfo.end.toISOString().slice(11, 16);
    setEventForm({ title: '', description: '', location: '', startTime, endTime });
    setShowEventModal(true);
  };

  const handleTaskDrop = async (info: DropArg) => {
    if (info.draggedEl.getAttribute('data-task')) {
      const task: GoogleTask = JSON.parse(info.draggedEl.getAttribute('data-task') || '{}');
      
      // Find which task list this task belongs to
      const taskListId = Object.keys(googleTasks).find(listId => 
        googleTasks[listId].some(t => t.id === task.id)
      );
      
      if (taskListId) {
        try {
          // Update the task with the new due date
          const updatedTask = {
            ...task,
            due: info.date.toISOString()
          };
          
          await updateGoogleTask(taskListId, task.id, updatedTask);
          
          // The calendar will automatically refresh since we're watching the googleTasks state
        } catch (err) {
          console.error('Failed to update task due date:', err);
          setError('Failed to update task. Please try again.');
        }
      }
    }
  };

  const handleScheduleTask = async (scheduleData: {
    title: string;
    startTime: string;
    endTime: string;
    description?: string;
    location?: string;
  }) => {
    if (!selectedTaskForScheduling || !selectedScheduleDate) return;

    try {
      const startDateTime = new Date(selectedScheduleDate);
      const [startHours, startMinutes] = scheduleData.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(selectedScheduleDate);
      const [endHours, endMinutes] = scheduleData.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const eventData = {
        summary: scheduleData.title,
        description: scheduleData.description || `Scheduled from task: ${selectedTaskForScheduling.title}`,
        location: scheduleData.location,
        start: { dateTime: startDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: endDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };

      await createCalendarEvent(eventData);
      
      if (confirm('Mark the original task as completed?')) {
        // Find which task list this task belongs to
        const taskListId = Object.keys(googleTasks).find(listId => 
          googleTasks[listId].some(t => t.id === selectedTaskForScheduling.id)
        );
        if (taskListId) {
          await toggleTaskComplete(taskListId, selectedTaskForScheduling.id, true);
        }
      }
      
      setShowScheduleModal(false);
      setSelectedTaskForScheduling(null);
      setSelectedScheduleDate(null);
      
    } catch (err) {
      console.error('Failed to schedule task:', err);
      setError('Failed to schedule task. Please try again.');
    }
  };

  const handleEventFormSubmit = async () => {
    if (!eventForm.title.trim()) return;

    setIsCreatingEvent(true);
    setError(null);

    try {
      const startDateTime = new Date(selectedDateInfo!.start);
      const [startHours, startMinutes] = eventForm.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(selectedDateInfo!.end);
      const [endHours, endMinutes] = eventForm.endTime.split(':');
      endDateTime.setHours(parseInt(endHours), parseInt(endMinutes));

      const eventData = {
        summary: eventForm.title,
        description: eventForm.description,
        location: eventForm.location,
        start: { dateTime: startDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: endDateTime.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      
      if (editingEvent) {
          await updateCalendarEvent(editingEvent.id!, eventData);
      } else {
          await createCalendarEvent(eventData);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error('Failed to save event:', err);
      setError('Failed to save event. Please try again.');
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleEventDelete = async () => {
      if (!editingEvent || !window.confirm('Are you sure you want to delete this event?')) return;
      try {
          await deleteCalendarEvent(editingEvent.id!);
          handleCloseModal();
      } catch (err) {
          console.error('Failed to delete event:', err);
          setError('Failed to delete event. Please try again.');
      }
  }

  const handleCloseModal = () => {
    setShowEventModal(false);
    setEditingEvent(null);
    setSelectedDateInfo(null);
    calendarRef.current?.getApi().unselect();
  };

  const handleEventClick = (clickInfo: EventClickArg) => {
    const { event } = clickInfo;
    
    // Handle task events differently
    if (event.extendedProps.type === 'task') {
      const taskData = event.extendedProps.taskData as GoogleTask;
      setSelectedTaskForScheduling(taskData);
      setSelectedScheduleDate(new Date(event.start!));
      setShowScheduleModal(true);
      return;
    }
    
    // Handle regular events
    setEditingEvent(event);
    const startTime = new Date(event.start!).toISOString().slice(11, 16);
    const endTime = event.end ? new Date(event.end!).toISOString().slice(11, 16) : startTime;
    setEventForm({
      title: event.title || '',
      description: event.extendedProps.description || '',
      location: event.extendedProps.location || '',
      startTime,
      endTime,
    });
    setShowEventModal(true);
  };

  const handleEventDrop = async (dropInfo: EventDropArg) => {
    const { event } = dropInfo;
    try {
      const eventData = {
        summary: event.title,
        description: event.extendedProps.description,
        location: event.extendedProps.location,
        start: { dateTime: event.start!.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: event.end!.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await updateCalendarEvent(event.id!, eventData);
    } catch (err) {
      console.error('Failed to update event position:', err);
      setError('Failed to update event. Please try again.');
      dropInfo.revert();
    }
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskModalSubmit = async (data: { title: string; notes?: string; due?: string; metadata?: any }) => {
    try {
      if (editingTask) {
        // Find which task list this task belongs to
        const taskListId = Object.keys(googleTasks).find(listId => 
          googleTasks[listId].some(t => t.id === editingTask.id)
        );
        
        if (taskListId) {
          await updateGoogleTask(taskListId, editingTask.id, {
            ...editingTask,
            title: data.title,
            notes: data.notes,
            due: data.due,
          });
        }
      } else {
        const targetTaskListId = selectedColumnId === 'all' ? taskLists[0]?.id : selectedColumnId;
        
        if (!targetTaskListId) {
          devLog.debug('No task list available for creating task');
          return;
        }

        await createGoogleTask(targetTaskListId, {
          title: data.title,
          notes: data.notes,
          due: data.due,
        });
      }
      setShowTaskModal(false);
      setEditingTask(null);
    } catch (error) {
      devLog.error('Error creating/updating task:', error);
    }
  };

  // Handle task deletion
  const handleDeleteTask = async () => {
    if (!taskToDelete) return;
    
    try {
      // Find which task list this task belongs to
      const taskListId = Object.keys(googleTasks).find(listId => 
        googleTasks[listId].some(t => t.id === taskToDelete.id)
      );
      
      if (taskListId) {
        await deleteGoogleTask(taskListId, taskToDelete.id);
      }
      
      setShowDeleteTaskDialog(false);
      setTaskToDelete(null);
    } catch (error) {
      devLog.error('Error deleting task:', error);
      setError('Failed to delete task. Please try again.');
    }
  };

  // Handle task duplicate
  const handleDuplicateTask = async (task: GoogleTask) => {
    try {
      const taskListId = Object.keys(googleTasks).find(listId => 
        googleTasks[listId].some(t => t.id === task.id)
      );
      
      if (taskListId) {
        await createGoogleTask(taskListId, {
          title: `${task.title} (Copy)`,
          notes: task.notes,
          due: task.due,
        });
      }
    } catch (error) {
      devLog.error('Error duplicating task:', error);
      setError('Failed to duplicate task. Please try again.');
    }
  };

  // Handle refresh
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

  useEffect(() => {
    const headerProps = { title: "Calendar" };
    setHeaderProps(headerProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  if (!activeAccount || (!isCalendarAuthenticated && !isTasksAuthenticated)) {
    return (
              <div className="flex h-full items-center justify-center bg-content">
        <div className="text-center">
          <Heading level={2} className="mb-2 text-lg font-semibold">
            No Google Account Connected
          </Heading>
          <Text className="mb-4" variant="secondary">
            Please connect a Google account in Settings to view your calendar and tasks.
          </Text>
          <Button variant="primary" onClick={() => navigate('/settings')}>
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Google Calendar authentication now handled centrally in Settings */}
      
      <div className="flex h-full gap-6 bg-primary p-6">
        {/* Main Calendar Area */}
        <div className="border-border-primary flex h-full min-w-0 flex-1 flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-6 p-6 h-full">
            {/* Consolidated Header */}
            <div className="bg-bg-tertiary border-border-primary flex items-center gap-4 rounded-lg border p-3">
              {/* Left side - Navigation and Title */}
              <div className="flex items-center gap-3">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={goToToday}
                  className="font-medium"
                >
                  Today
                </Button>
                <div className="bg-bg-card border-border-primary flex items-center rounded-md border">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigateCalendar('prev')}
                    className="border-border-primary size-8 rounded-r-none border-r"
                  >
                    <ChevronLeft size={16} />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => navigateCalendar('next')}
                    className="size-8 rounded-l-none"
                  >
                    <ChevronRight size={16} />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Text weight="semibold" className="text-text-primary">
                    {currentViewTitle}
                  </Text>
                  {isRefreshing && (
                    <div className="size-4 animate-spin rounded-full border-2 border-accent-primary border-t-transparent" />
                  )}
                </div>
              </div>

              {/* Center - Search */}
              <div className="relative flex-1 max-w-md">
                <Search size={14} className="text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-bg-card border-border-secondary text-text-primary h-8 w-full rounded-md border pl-9 pr-3 text-sm transition-colors focus:border-accent-primary focus:outline-none focus:ring-1 focus:ring-accent-primary"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-1 top-1/2 size-6 -translate-y-1/2 text-text-muted hover:text-text-primary"
                  >
                    <X size={12} />
                  </Button>
                )}
              </div>

              {/* Right side - View toggles and actions */}
              <div className="flex items-center gap-2">
                <div className="border-border-primary flex items-center gap-0.5 rounded-md border bg-card p-0.5">
                  <Button
                    variant={view === 'dayGridMonth' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('dayGridMonth')}
                    className="h-7 rounded px-3 text-xs font-medium"
                  >
                    Month
                  </Button>
                  <Button
                    variant={view === 'timeGridWeek' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('timeGridWeek')}
                    className="h-7 rounded px-3 text-xs font-medium"
                  >
                    Week
                  </Button>
                  <Button
                    variant={view === 'timeGridDay' ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => changeView('timeGridDay')}
                    className="h-7 rounded px-3 text-xs font-medium"
                  >
                    Day
                  </Button>
                </div>
                
                <Button
                  variant={showTasksInCalendar ? 'secondary' : 'ghost'}
                  size="icon"
                  onClick={() => setShowTasksInCalendar(!showTasksInCalendar)}
                  className="size-8"
                  title={showTasksInCalendar ? 'Hide tasks' : 'Show tasks'}
                >
                  <ListChecks size={16} />
                </Button>
                
                <Button 
                  variant="ghost"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="size-8"
                  title="Refresh"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                </Button>
                
                <div className="bg-border-default mx-1 h-6 w-px" />
                
                <Button 
                  variant="primary" 
                  size="sm"
                  onClick={() => { setEditingEvent(null); setShowEventModal(true); }}
                  className="font-medium shadow-sm"
                >
                  <Plus size={14} className="mr-1.5" />
                  New event
                </Button>
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="border-error-border bg-error-ghost">
                <div className="flex items-center gap-3 p-4">
                  <div className="shrink-0 text-error">
                    <svg className="size-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="flex-1">
                    <Text size="sm" weight="semibold" className="text-error">
                      {error}
                    </Text>
                  </div>
                </div>
              </Card>
            )}

            {/* Calendar */}
            <div 
              className={`calendar-wrapper relative flex-1 overflow-hidden ${compactMode ? 'calendar-compact' : ''}`}
              style={{ minHeight: 0 }}
            >
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                headerToolbar={false}
                height="100%"
                slotMinTime="06:00:00"
                slotMaxTime="24:00:00"
                allDaySlot={true}
                scrollTime="08:00:00"
                slotDuration="00:30:00"
                snapDuration="00:15:00"
                nowIndicator={true}
                eventTextColor="#ffffff"
                businessHours={{
                  daysOfWeek: [1, 2, 3, 4, 5], // Monday - Friday
                  startTime: '09:00',
                  endTime: '17:00',
                }}
                slotLabelFormat={{
                  hour: 'numeric',
                  minute: '2-digit',
                  omitZeroMinute: false,
                  meridiem: 'short'
                }}
                dayHeaderFormat={{
                  weekday: 'short'
                }}
                dayCellContent={(arg) => {
                  const date = arg.date;
                  const dayNum = date.getDate();
                  const isFirstOfMonth = dayNum === 1;
                  
                  if (isFirstOfMonth) {
                    const monthName = date.toLocaleDateString('en-US', { month: 'short' });
                    return `${monthName} ${dayNum}`;
                  }
                  
                  return dayNum.toString();
                }}
                events={fullCalendarEvents}
                eventContent={renderEventContent}
                eventDidMount={(info) => {
                  // Direct DOM manipulation with CSS injection - research-based solution
                                      const titleElement = info.el.querySelector('.fc-event-title') as HTMLElement;
                                      const timeElement = info.el.querySelector('.fc-event-time') as HTMLElement;
                  
                  // Inject CSS directly into the element to override FullCalendar
                  const style = document.createElement('style');
                  style.textContent = `
                    .fc-event-title { 
                      color: #ffffff !important; 
                      font-weight: 600 !important; 
                      text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
                      overflow: hidden !important;
                      text-overflow: ellipsis !important;
                      white-space: nowrap !important;
                    }
                    .fc-event-time { 
                      color: #ffffff !important; 
                      font-weight: 600 !important; 
                      text-shadow: 0 1px 2px rgba(0,0,0,0.5) !important;
                    }
                    .fc-event-task .fc-event-title { 
                      color: #000000 !important; 
                      text-shadow: none !important;
                    }
                    .fc-event-task .fc-event-time { 
                      color: #000000 !important; 
                      text-shadow: none !important;
                    }
                  `;
                  document.head.appendChild(style);
                  
                  // Direct style application with maximum specificity
                  if (titleElement) {
                    titleElement.style.setProperty('color', '#ffffff', 'important');
                    titleElement.style.setProperty('font-weight', '600', 'important');
                    titleElement.style.setProperty('text-shadow', '0 1px 2px rgba(0,0,0,0.5)', 'important');
                    titleElement.style.setProperty('overflow', 'hidden', 'important');
                    titleElement.style.setProperty('text-overflow', 'ellipsis', 'important');
                    titleElement.style.setProperty('white-space', 'nowrap', 'important');
                  }
                  
                  if (timeElement) {
                    timeElement.style.setProperty('color', '#ffffff', 'important');
                    timeElement.style.setProperty('font-weight', '600', 'important');
                    timeElement.style.setProperty('text-shadow', '0 1px 2px rgba(0,0,0,0.5)', 'important');
                  }
                  
                  // Task-specific overrides
                  const isTask = info.event.extendedProps.type === 'task';
                  if (isTask) {
                    const isCompleted = info.event.extendedProps.taskData?.status === 'completed';
                    
                    if (titleElement) {
                      titleElement.style.setProperty('color', '#000000', 'important');
                      titleElement.style.setProperty('text-shadow', 'none', 'important');
                      if (isCompleted) {
                        titleElement.style.setProperty('text-decoration', 'line-through', 'important');
                      }
                    }
                    
                    if (timeElement) {
                      timeElement.style.setProperty('color', '#000000', 'important');
                      timeElement.style.setProperty('text-shadow', 'none', 'important');
                    }
                    
                    // High contrast task backgrounds
                    info.el.style.setProperty('background-color', isCompleted ? '#dcfce7' : '#fef3c7', 'important');
                    info.el.style.setProperty('border-left', `3px solid ${isCompleted ? '#10b981' : '#f59e0b'}`, 'important');
                  }
                  
                  // Container overflow control
                  info.el.style.setProperty('overflow', 'hidden', 'important');
                  info.el.style.setProperty('max-width', '100%', 'important');
                  
                  // Tooltip for truncated text
                  if ((info as any).isMore) {
                    info.el.title = `${(info as any).num} more events`;
                  } else if (info.el.scrollWidth > info.el.clientWidth) {
                    info.el.title = info.event.title;
                  }
                }}
                selectable={true}
                editable={true}
                droppable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                drop={handleTaskDrop}
                datesSet={(dateInfo) => {
                  setCurrentViewTitle(dateInfo.view.title);
                }}
                dayMaxEvents={compactMode ? 3 : 5}
                dayMaxEventRows={compactMode ? 3 : 4}
                moreLinkClick="popover"
                eventMaxStack={3}
                eventClassNames={(eventInfo) => {
                  const classes = ['fc-event-design-system'];
                  if (eventInfo.event.extendedProps.type === 'task') {
                    classes.push(eventInfo.event.extendedProps.taskData?.status === 'completed' 
                      ? 'fc-event-task-completed' 
                      : 'fc-event-task'
                    );
                  }
                  return classes;
                }}
                                 {...({ noEventsContent:
                  <div className="px-4 py-12 text-center">
                    <div className="bg-bg-tertiary mx-auto mb-4 flex size-16 items-center justify-center rounded-full">
                      <CalendarIcon size={32} className="text-text-muted" />
                    </div>
                    <Text weight="medium" className="text-text-primary mb-2">
                      {view === 'dayGridMonth' ? 'No events this month' : 
                       view === 'timeGridWeek' ? 'No events this week' : 
                       'No events today'}
                    </Text>
                    <Text variant="muted" size="sm" className="mb-4">
                      Click on any date to create an event, or drag tasks from the sidebar to schedule them
                    </Text>
                    <div className="text-text-muted flex items-center justify-center gap-6">
                      <div className="flex items-center gap-2">
                        <Plus size={16} className="text-accent-primary" />
                        <Text size="xs">Click to add</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <ListChecks size={16} className="text-warning" />
                        <Text size="xs">Drag tasks</Text>
                      </div>
                    </div>
                                     </div>
                 } as any)}
              />
              
              {/* Empty State Overlay for Week/Day Views */}
              {(view === 'timeGridWeek' || view === 'timeGridDay') && filteredCalendarEvents.length === 0 && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  <div className="bg-bg-card border-border-primary rounded-lg border p-8 text-center shadow-sm">
                    <div className="text-text-muted mb-4">
                      <svg className="mx-auto mb-4 size-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <Text weight="medium" className="text-text-primary mb-2">
                      {view === 'timeGridWeek' ? 'No events this week' : 'No events today'}
                    </Text>
                    <Text variant="muted" size="sm" className="mb-4">
                      Click on a time slot to create an event
                    </Text>
                    <div className="text-text-muted flex items-center justify-center gap-4">
                      <div className="flex items-center gap-2">
                        <div className="size-3 rounded bg-accent-primary"></div>
                        <Text size="xs">Drag tasks here</Text>
                      </div>
                      <div className="flex items-center gap-2">
                        <Plus size={12} />
                        <Text size="xs">Click to add</Text>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Task Side Panel */}
        {showTaskPanel && (
          <div className="w-80 shrink-0">
            <div className="border-border-primary flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm">
              {/* Tasks Header */}
              <div className="border-border-primary flex items-center justify-between border-b p-4">
                <div className="flex items-center gap-2">
                  <ListChecks size={18} className="text-accent-primary" />
                  <Heading level={3} className="text-md text-text-primary font-semibold">
                    Tasks
                  </Heading>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  onClick={() => setShowTaskPanel(false)}
                  className="size-8"
                >
                  <X size={16} />
                </Button>
              </div>
              
              {/* Task List Selector and New Task Button */}
              <div className="border-border-primary bg-bg-secondary/30 space-y-3 border-b p-4">
                <div className="relative">
                  <select
                    value={selectedColumnId}
                    onChange={(e) => setSelectedColumnId(e.target.value)}
                    className="border-border-primary bg-bg-card text-text-primary focus:ring-accent-primary/20 w-full appearance-none rounded-lg border p-3 pr-10 font-medium transition-colors focus:border-accent-primary focus:ring-2"
                  >
                    <option value="all">All Tasks</option>
                    {taskLists.map(taskList => (
                      <option key={taskList.id} value={taskList.id}>{taskList.title}</option>
                    ))}
                  </select>
                  <ChevronDown size={16} className="text-text-muted pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" />
                </div>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={handleCreateTask}
                  className="w-full font-medium shadow-sm"
                >
                  <Plus size={16} className="mr-2" />
                  New task
                </Button>
              </div>
              
              {/* Task List */}
              <div ref={taskPanelRef} className="flex-1 space-y-2 overflow-y-auto p-4">
              {isTasksLoading ? (
                <div className="py-8 text-center">
                  <div className="mx-auto mb-2 size-6 animate-spin rounded-full border-2 border-accent-primary border-t-transparent"></div>
                  <Text size="sm" variant="muted">Loading tasks...</Text>
                </div>
              ) : tasksError ? (
                <div className="py-8 text-center">
                  <Text size="sm" className="text-status-error">Failed to load tasks</Text>
                  <Text size="xs" variant="muted" className="mt-1">{tasksError}</Text>
                </div>
              ) : (
                <>
                  {filteredTasks.map(task => {
                    const isOverdue = task.due && new Date(task.due) < new Date() && task.status !== 'completed';
                    const taskListId = Object.keys(googleTasks).find(listId => 
                      googleTasks[listId].some(t => t.id === task.id)
                    );
                    
                    return (
                      <ContextMenu
                        key={task.id}
                        items={[
                          {
                            label: 'Edit task',
                            icon: <Edit2 size={14} />,
                            onClick: () => {
                              setEditingTask(task);
                              setShowTaskModal(true);
                            }
                          },
                          {
                            label: task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete',
                            icon: <CheckCircle size={14} />,
                            onClick: async () => {
                              if (taskListId) {
                                await toggleTaskComplete(taskListId, task.id, task.status !== 'completed');
                              }
                            }
                          },
                          {
                            separator: true
                          },
                          {
                            label: 'Duplicate task',
                            icon: <Copy size={14} />,
                            onClick: () => handleDuplicateTask(task)
                          },
                          {
                            separator: true
                          },
                          {
                            label: 'Delete task',
                            icon: <Trash2 size={14} />,
                            onClick: () => {
                              setTaskToDelete(task);
                              setShowDeleteTaskDialog(true);
                            },
                            destructive: true
                          }
                        ]}
                      >
                        <Card 
                          className={`draggable-task bg-bg-card border-border-primary group cursor-grab rounded-lg border p-3 transition-all duration-200 hover:-translate-y-0.5 hover:border-accent-primary hover:shadow-md${
                            isOverdue ? 'border-l-status-error border-l-4' : 'border-l-4 border-l-transparent'
                          } ${task.status === 'completed' ? 'opacity-60' : ''}`}
                          data-task={JSON.stringify(task)}
                          onClick={(e) => {
                            // Don't open edit modal if clicking on checkbox
                            if ((e.target as HTMLElement).closest('button[data-checkbox]')) {
                              return;
                            }
                            setEditingTask(task);
                            setShowTaskModal(true);
                          }}
                        >
                          <div className="flex gap-3">
                            {/* Completion Checkbox */}
                            <button
                              data-checkbox
                              onClick={async (e) => {
                                e.stopPropagation();
                                if (taskListId) {
                                  await toggleTaskComplete(taskListId, task.id, task.status !== 'completed');
                                }
                              }}
                              className={`
                                flex-shrink-0 mt-0.5 w-4 h-4 rounded border-2 flex items-center justify-center
                                transition-colors duration-200
                                ${task.status === 'completed' 
                                  ? 'bg-success border-success text-white' 
                                  : 'border-border-default hover:border-success'
                                }
                              `}
                              title={task.status === 'completed' ? 'Mark as incomplete' : 'Mark as complete'}
                            >
                              {task.status === 'completed' && <CheckSquare size={12} />}
                            </button>
                            
                            {/* Task Content */}
                            <div className="flex-1">
                              <Text size="sm" weight="medium" className={`text-text-primary ${task.status === 'completed' ? 'line-through' : ''}`}>
                                {task.title}
                              </Text>
                              {task.due && (
                                  <Text size="xs" className={`mt-1 ${
                                    isOverdue ? 'text-status-error' : 'text-text-muted'
                                  }`}>
                                    Due: {new Date(task.due).toLocaleDateString()}
                                  </Text>
                                )}
                            </div>
                          </div>
                        </Card>
                      </ContextMenu>
                    );
                  })}
                  {filteredTasks.length === 0 && (
                    <div className="px-4 py-8 text-center">
                      <div className="bg-bg-tertiary mx-auto mb-3 flex size-12 items-center justify-center rounded-full">
                        <ListChecks size={24} className="text-text-muted" />
                      </div>
                      <Text size="sm" weight="medium" className="text-text-primary">No tasks found</Text>
                      <Text size="xs" variant="muted" className="mt-1">
                        {selectedColumnId === 'all' ? 'Create a task to get started.' : `No tasks in this list.`}
                      </Text>
                    </div>
                  )}
                </>
              )}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {!showTaskPanel && (
        <Button 
          className="fixed bottom-6 right-6 z-40"
          onClick={() => setShowTaskPanel(true)}
        >
          <ListChecks className="mr-2" /> Show tasks
        </Button>
      )}

      {/* Event Creation/Editing Modal */}
      {showEventModal && (
        <div className="bg-bg-overlay fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <Card className="w-full max-w-lg !bg-bg-primary" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <div className="space-y-4 p-6">
              <div className="flex items-center justify-between">
                <Heading level={2} className="text-lg font-semibold">{editingEvent ? 'Edit event' : 'Create event'}</Heading>
                <Button variant="ghost" size="icon" onClick={handleCloseModal}><X size={18} /></Button>
              </div>
              
              <div>
                <Text as="label" size="sm" weight="medium" className="text-text-secondary mb-1.5 block">Title</Text>
                <input type="text" value={eventForm.title} onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))} className="border-border-primary bg-bg-tertiary text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2" placeholder="Event title..." />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Text as="label" size="sm" weight="medium" className="text-text-secondary mb-1.5 block">Start</Text>
                  <input type="time" value={eventForm.startTime} onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))} className="border-border-primary bg-bg-tertiary text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2" />
                </div>
                <div>
                  <Text as="label" size="sm" weight="medium" className="text-text-secondary mb-1.5 block">End</Text>
                  <input type="time" value={eventForm.endTime} onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))} className="border-border-primary bg-bg-tertiary text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2" />
                </div>
              </div>

              <div>
                <Text as="label" size="sm" weight="medium" className="text-text-secondary mb-1.5 block">Description</Text>
                <textarea value={eventForm.description} onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))} className="border-border-primary bg-bg-tertiary text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2" placeholder="Event description..." rows={4} />
              </div>

              <div>
                <Text as="label" size="sm" weight="medium" className="text-text-secondary mb-1.5 block">Location</Text>
                <input type="text" value={eventForm.location} onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))} className="border-border-primary bg-bg-tertiary text-text-primary focus:ring-accent-primary/20 w-full rounded-md border p-2 focus:border-accent-primary focus:ring-2" placeholder="Event location..." />
              </div>
            </div>

            <div className="border-border-primary flex items-center justify-between gap-2 rounded-b-lg border-t bg-content p-4">
              <div>
                {editingEvent && (
                    <Button variant="destructive" onClick={handleEventDelete}>Delete event</Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="primary" onClick={handleEventFormSubmit} disabled={isCreatingEvent}>
                  {isCreatingEvent ? 'Saving...' : (editingEvent ? 'Update event' : 'Create event')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ScheduleTaskModal
        isOpen={showScheduleModal}
        task={selectedTaskForScheduling}
        selectedDate={selectedScheduleDate}
        onClose={() => {
          setShowScheduleModal(false);
          setSelectedTaskForScheduling(null);
          setSelectedScheduleDate(null);
        }}
        onSchedule={handleScheduleTask}
      />

      <SimpleTaskModal
        isOpen={showTaskModal}
        task={editingTask}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSubmit={handleTaskModalSubmit}
      />

      <ConfirmDialog
        isOpen={showDeleteTaskDialog}
        onClose={() => {
          setShowDeleteTaskDialog(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleDeleteTask}
        title="Delete task"
        message={`Are you sure you want to delete "${taskToDelete?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
      />
    </>
  );
};
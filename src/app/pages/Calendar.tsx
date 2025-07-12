import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ListChecks, Plus, X, Calendar as CalendarIcon, Clock, MapPin, FileText, Flag, Hash, Repeat, List as ListIcon, CheckCircle, CircleDashed, ChevronDown, RefreshCw, Search } from 'lucide-react';
import { Card, Button, Tag, Input } from '../../components/ui';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin, { Draggable } from '@fullcalendar/interaction';
import { useHeader } from '../contexts/HeaderContext';
import { useKanbanStore, KanbanTask, TaskMetadata } from '../../stores/useKanbanStore';
import { useGoogleCalendarStore } from '../../stores/googleCalendarStore';
import { useGoogleTasksStore } from '../../stores/googleTasksStore';
import { GoogleCalendarEvent, GoogleTask, GoogleTaskList } from '../../types/google';
import { useActiveGoogleAccount } from '../../stores/settingsStore';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

// Google Calendar authentication now handled centrally in Settings

// Simple Task Modal Component for Google Tasks
const SimpleTaskModal = ({ isOpen, task, onClose, onSubmit, onDelete }: {
  isOpen: boolean;
  task?: GoogleTask | null;
  onClose: () => void;
  onSubmit: (data: { title: string; notes?: string; due?: string; metadata?: TaskMetadata }) => void;
  onDelete?: () => void;
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
    priority: 'normal' as TaskMetadata['priority'],
    labels: [] as string[],
    subtasks: [] as Array<{ id: string; title: string; completed: boolean; due?: string }>,
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <Card className="w-full">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <h2 className="text-lg font-semibold text-primary">
              {task ? 'Edit Task' : 'Create Task'}
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-primary mb-1">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Task title..."
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Notes</label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Task description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Due Date</label>
              <input
                type="date"
                value={formData.due}
                onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Priority</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as TaskMetadata['priority'] }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
              >
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>

            {/* Labels Section */}
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Labels</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addLabel())}
                    className="flex-1 p-2 border border-border-default rounded-md bg-card text-primary text-sm"
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
                        className="inline-flex items-center gap-1 px-2 py-1 bg-secondary-ghost text-secondary rounded text-xs"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => removeLabel(label)}
                          className="hover:text-error ml-1"
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
              <label className="block text-sm font-medium text-primary mb-2">Subtasks</label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newSubtask}
                    onChange={(e) => setNewSubtask(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSubtask())}
                    className="flex-1 p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                    placeholder="Add a subtask..."
                  />
                  <Button type="button" onClick={addSubtask} variant="outline" size="sm">
                    <Plus size={16} />
                  </Button>
                </div>
                {formData.subtasks.length > 0 && (
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {formData.subtasks.map(subtask => (
                      <div
                        key={subtask.id}
                        className="flex items-center gap-2 p-2 border border-border-default rounded bg-secondary-ghost"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSubtask(subtask.id)}
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                            subtask.completed 
                              ? 'bg-success border-success text-success-ghost' 
                              : 'border-border-default hover:border-success'
                          }`}
                        >
                          {subtask.completed && '✓'}
                        </button>
                        <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted' : 'text-primary'}`}>
                          {subtask.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSubtask(subtask.id)}
                          className="text-error hover:text-error-hover p-1"
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
              <label className="block text-sm font-medium text-primary mb-2">Recurring</label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={formData.recurringEnabled}
                    onChange={(e) => setFormData(prev => ({ ...prev, recurringEnabled: e.target.checked }))}
                    className="w-4 h-4 border border-border-default rounded"
                  />
                  <label htmlFor="recurring-enabled" className="text-sm text-primary">
                    Make this task recurring
                  </label>
                </div>
                
                {formData.recurringEnabled && (
                  <div className="pl-6 space-y-3 border-l-2 border-secondary-ghost">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Frequency</label>
                        <select
                          value={formData.recurringFrequency}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringFrequency: e.target.value as any }))}
                          className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted mb-1">Interval</label>
                        <input
                          type="number"
                          min="1"
                          max="365"
                          value={formData.recurringInterval}
                          onChange={(e) => setFormData(prev => ({ ...prev, recurringInterval: parseInt(e.target.value) || 1 }))}
                          className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted mb-1">End Date (Optional)</label>
                      <input
                        type="date"
                        value={formData.recurringEndDate}
                        onChange={(e) => setFormData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                        className="w-full p-2 border border-border-default rounded-md bg-card text-primary text-sm"
                      />
                    </div>
                    <p className="text-xs text-info">
                      Repeats every {formData.recurringInterval} {formData.recurringFrequency.replace('ly', '')}
                      {formData.recurringInterval > 1 ? 's' : ''}
                      {formData.recurringEndDate && ` until ${new Date(formData.recurringEndDate + 'T00:00:00').toLocaleDateString()}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-6 border-t border-border-default">
            <div>
              {task && onDelete && (
                <Button type="button" variant="outline" onClick={onDelete} className="text-error border-error">
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-primary">Schedule Task</h2>
              <Button type="button" variant="ghost" size="sm" onClick={onClose}>
                <X size={16} />
              </Button>
            </div>
            
            <div className="p-3 bg-secondary-ghost rounded-lg">
              <p className="text-sm text-muted">
                Scheduling for: <strong>{selectedDate.toLocaleDateString()}</strong>
              </p>
              <p className="text-sm font-medium text-primary mt-1">{task.title}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Event Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event title..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Start Time</label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-primary mb-1">End Time</label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event description..."
                rows={3}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-1">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="w-full p-2 border border-border-default rounded-md bg-card text-primary"
                placeholder="Event location..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 p-6 border-t border-border-default">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary">
              Schedule Event
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

const Calendar: React.FC = () => {
  const navigate = useNavigate();
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const calendarRef = useRef<FullCalendar>(null);
  const taskPanelRef = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<CalendarView>('dayGridMonth');
  const [showTaskPanel, setShowTaskPanel] = useState(true);
  const [showEventModal, setShowEventModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDateInfo, setSelectedDateInfo] = useState<any>(null);
  const [selectedTaskForScheduling, setSelectedTaskForScheduling] = useState<GoogleTask | null>(null);
  const [selectedScheduleDate, setSelectedScheduleDate] = useState<Date | null>(null);
  const [selectedColumnId, setSelectedColumnId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    location: '',
    startTime: '',
    endTime: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState<any>(null);

  const {
    taskLists,
    tasks: googleTasks,
    isLoading: isTasksLoading,
    error: tasksError,
    fetchTaskLists,
    fetchTasks,
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
      authenticateTasks(activeAccount);
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
              const task = JSON.parse(taskJson);
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
  }, [taskPanelRef.current]);



  useEffect(() => {
    if (activeAccount) {
      setError(null);
      fetchCalendarEvents().catch((err) => {
        console.error('Failed to fetch calendar events:', err);
        setError('Failed to load calendar events. Please try again.');
      });
    }
  }, [activeAccount, fetchCalendarEvents]);

  const fullCalendarEvents = (calendarEvents || []).map(event => ({
    id: event.id,
    title: event.summary,
    start: event.start.dateTime || event.start.date,
    end: event.end.dateTime || event.end.date,
    allDay: !event.start.dateTime,
    extendedProps: {
      description: event.description,
      location: event.location,
      status: event.status,
    }
  }));

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

  const handleDateSelect = (selectInfo: any) => {
    setSelectedDateInfo(selectInfo);
    setEditingEvent(null);
    const startTime = selectInfo.start.toISOString().slice(11, 16);
    const endTime = selectInfo.end.toISOString().slice(11, 16);
    setEventForm({ title: '', description: '', location: '', startTime, endTime });
    setShowEventModal(true);
  };

  const handleTaskDrop = (info: any) => {
    if (info.draggedEl.getAttribute('data-task')) {
      const task = JSON.parse(info.draggedEl.getAttribute('data-task') || '{}');
      setSelectedTaskForScheduling(task);
      setSelectedScheduleDate(info.date);
      setShowScheduleModal(true);
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
      const startDateTime = new Date(selectedDateInfo.start);
      const [startHours, startMinutes] = eventForm.startTime.split(':');
      startDateTime.setHours(parseInt(startHours), parseInt(startMinutes));

      const endDateTime = new Date(selectedDateInfo.end);
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
          await updateCalendarEvent(editingEvent.id, eventData);
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
          await deleteCalendarEvent(editingEvent.id);
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

  const handleEventClick = (clickInfo: any) => {
    const { event } = clickInfo;
    setEditingEvent(event);
    const startTime = new Date(event.start).toISOString().slice(11, 16);
    const endTime = event.end ? new Date(event.end).toISOString().slice(11, 16) : startTime;
    setEventForm({
      title: event.title || '',
      description: event.extendedProps.description || '',
      location: event.extendedProps.location || '',
      startTime,
      endTime,
    });
    setShowEventModal(true);
  };

  const handleEventDrop = async (dropInfo: any) => {
    const { event } = dropInfo;
    try {
      const eventData = {
        summary: event.title,
        description: event.extendedProps.description,
        location: event.extendedProps.location,
        start: { dateTime: event.start.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
        end: { dateTime: event.end.toISOString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone },
      };
      await updateCalendarEvent(event.id, eventData);
    } catch (err) {
      console.error('Failed to update event position:', err);
      setError('Failed to update event. Please try again.');
      dropInfo.revert();
    }
  };

  const handleCreateTask = () => {
    setShowTaskModal(true);
  };

  const handleTaskModalSubmit = async (data: { title: string; notes?: string; due?: string; metadata?: TaskMetadata }) => {
    try {
      const targetTaskListId = selectedColumnId === 'all' ? taskLists[0]?.id : selectedColumnId;
      if (targetTaskListId) {
        await createGoogleTask(targetTaskListId, {
          title: data.title,
          notes: data.notes,
          due: data.due,
        });
        setShowTaskModal(false);
      } else {
        setError('No task list available. Please ensure you have Google Tasks set up.');
      }
    } catch (err) {
      console.error('Failed to create task:', err);
      setError('Failed to create task. Please try again.');
    }
  };

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
      (event.extendedProps.description && event.extendedProps.description.toLowerCase().includes(query)) ||
      (event.extendedProps.location && event.extendedProps.location.toLowerCase().includes(query))
    );
  }, [fullCalendarEvents, searchQuery]);

  useEffect(() => {
    const headerProps = { title: "Calendar" };
    setHeaderProps(headerProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  if (!activeAccount || (!isCalendarAuthenticated && !isTasksAuthenticated)) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h2 className="text-lg font-semibold text-primary mb-2">No Google Account Connected</h2>
          <p className="text-muted mb-4">Please connect a Google account in Settings to view your calendar and tasks.</p>
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
      
      <div className="flex h-full bg-[var(--bg-primary)] p-6 lg:p-8 gap-6 lg:gap-8">
        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col bg-[var(--bg-tertiary)] rounded-[var(--radius-lg)]">
          <div className="flex-1 flex flex-col gap-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={goToToday}>Today</Button>
                <div className="flex items-center">
                  <Button variant="ghost" size="sm" onClick={() => navigateCalendar('prev')}><ChevronLeft size={20} /></Button>
                  <Button variant="ghost" size="sm" onClick={() => navigateCalendar('next')}><ChevronRight size={20} /></Button>
                </div>
                <h2 className="text-xl font-semibold text-primary ml-2">
                  {calendarRef.current?.getApi().getCurrentData().viewTitle || 'Calendar'}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-[var(--bg-secondary)] rounded-[var(--radius-md)] p-1">
                    <Button
                        variant={view === 'dayGridMonth' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => changeView('dayGridMonth')}
                    >
                        Month
                    </Button>
                    <Button
                        variant={view === 'timeGridWeek' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => changeView('timeGridWeek')}
                    >
                        Week
                    </Button>
                    <Button
                        variant={view === 'timeGridDay' ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() => changeView('timeGridDay')}
                    >
                        Day
                    </Button>
                </div>
                <Button 
                  variant="outline" 
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  {isRefreshing ? 'Refreshing...' : 'Refresh'}
                </Button>
                <Button variant="primary" onClick={() => { setEditingEvent(null); setShowEventModal(true); }}>
                  <Plus size={16} className="mr-2" />
                  New Event
                </Button>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted" />
                <input
                  type="text"
                  placeholder="Search events..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-border-default rounded-md bg-card text-primary placeholder-muted"
                />
              </div>
            </div>

            {/* Error Display */}
            {error && (
              <Card className="border-error bg-error-ghost">
                <div className="flex items-center gap-3 p-4">
                  <div className="flex-shrink-0 text-error">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-error">{error}</p>
                  </div>
                </div>
              </Card>
            )}

            {/* Calendar */}
            <div className="flex-1 -m-6 mt-0">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView={view}
                headerToolbar={false}
                height="100%"
                events={filteredCalendarEvents}
                selectable={true}
                editable={true}
                droppable={true}
                select={handleDateSelect}
                eventClick={handleEventClick}
                eventDrop={handleEventDrop}
                drop={handleTaskDrop}
                dayMaxEvents={true}
              />
            </div>
          </div>
        </div>

        {/* Task Side Panel */}
        <div className={`transition-all duration-300 ${showTaskPanel ? 'w-80' : 'w-0'} overflow-hidden`}>
          <Card className="h-full flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-border-default">
              <h3 className="text-md font-semibold text-primary">Tasks</h3>
              <Button variant="ghost" size="sm" onClick={() => setShowTaskPanel(false)}><X size={16} /></Button>
            </div>
            
            {/* Task List Selector and New Task Button */}
            <div className="p-4 border-b border-border-default space-y-3">
              <div className="relative">
                <select
                  value={selectedColumnId}
                  onChange={(e) => setSelectedColumnId(e.target.value)}
                  className="w-full p-2 border border-border-default rounded-md bg-card text-primary appearance-none pr-8"
                >
                  <option value="all">All Tasks</option>
                  {taskLists.map(taskList => (
                    <option key={taskList.id} value={taskList.id}>{taskList.title}</option>
                  ))}
                </select>
                <ChevronDown size={16} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted pointer-events-none" />
              </div>
              <Button 
                variant="primary" 
                size="sm" 
                onClick={handleCreateTask}
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                New Task
              </Button>
            </div>
            
            <div ref={taskPanelRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {isTasksLoading ? (
                <div className="text-center text-muted py-8">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                  <p className="text-sm">Loading tasks...</p>
                </div>
              ) : tasksError ? (
                <div className="text-center text-error py-8">
                  <p className="text-sm">Failed to load tasks</p>
                  <p className="text-xs mt-1">{tasksError}</p>
                </div>
              ) : (
                <>
                  {filteredTasks.map(task => (
                    <Card 
                        key={task.id} 
                        className="p-3 cursor-grab draggable-task"
                        data-task={JSON.stringify(task)}
                    >
                      <p className="text-sm font-medium text-primary">{task.title}</p>
                      {task.due && <p className="text-xs text-muted">Due: {new Date(task.due).toLocaleDateString()}</p>}
                      {task.status === 'completed' && <p className="text-xs text-success">✓ Completed</p>}
                    </Card>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center text-muted py-8">
                      <p className="text-sm">No tasks found</p>
                      <p className="text-xs mt-1">
                        {selectedColumnId === 'all' ? 'Create a task to get started' : `No tasks in ${taskLists.find(list => list.id === selectedColumnId)?.title}`}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          </Card>
        </div>
      </div>
      
      {!showTaskPanel && (
        <Button 
          className="fixed bottom-6 right-6 z-40"
          onClick={() => setShowTaskPanel(true)}
        >
          <ListChecks className="mr-2" /> Show Tasks
        </Button>
      )}

      {/* Event Creation/Editing Modal */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">{editingEvent ? 'Edit Event' : 'Create Event'}</h2>
                <Button variant="ghost" size="sm" onClick={handleCloseModal}><X size={16} /></Button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-primary mb-1">Title</label>
                <input type="text" value={eventForm.title} onChange={(e) => setEventForm(prev => ({ ...prev, title: e.target.value }))} className="w-full p-2 border border-border-default rounded-md bg-card text-primary" placeholder="Event title..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">Start</label>
                  <input type="time" value={eventForm.startTime} onChange={(e) => setEventForm(prev => ({ ...prev, startTime: e.target.value }))} className="w-full p-2 border border-border-default rounded-md bg-card text-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-primary mb-1">End</label>
                  <input type="time" value={eventForm.endTime} onChange={(e) => setEventForm(prev => ({ ...prev, endTime: e.target.value }))} className="w-full p-2 border border-border-default rounded-md bg-card text-primary" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Description</label>
                <textarea value={eventForm.description} onChange={(e) => setEventForm(prev => ({ ...prev, description: e.target.value }))} className="w-full p-2 border border-border-default rounded-md bg-card text-primary" placeholder="Event description..." rows={3} />
              </div>

              <div>
                <label className="block text-sm font-medium text-primary mb-1">Location</label>
                <input type="text" value={eventForm.location} onChange={(e) => setEventForm(prev => ({ ...prev, location: e.target.value }))} className="w-full p-2 border border-border-default rounded-md bg-card text-primary" placeholder="Event location..." />
              </div>
            </div>

            <div className="flex items-center justify-between gap-2 p-6 border-t border-border-default">
              <div>
                {editingEvent && (
                    <Button variant="danger" onClick={handleEventDelete}>Delete</Button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={handleCloseModal}>Cancel</Button>
                <Button variant="primary" onClick={handleEventFormSubmit} disabled={isCreatingEvent}>
                  {isCreatingEvent ? 'Saving...' : (editingEvent ? 'Update Event' : 'Create Event')}
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
        onClose={() => setShowTaskModal(false)}
        onSubmit={handleTaskModalSubmit}
      />
    </>
  );
};

export default Calendar;
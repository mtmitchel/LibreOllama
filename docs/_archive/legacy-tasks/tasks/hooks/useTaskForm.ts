import { useState, useCallback } from 'react';
import type { TaskFormData, TaskModalState, EnhancedGoogleTask } from '../types';

export function useTaskForm() {
  const [modalState, setModalState] = useState<TaskModalState>({
    type: null,
    columnId: null,
    columnTitle: null,
    isOpen: false,
    task: null,
  });

  const [taskForm, setTaskForm] = useState<TaskFormData>({
    title: '',
    notes: '',
    due: '',
    priority: 'normal',
    recurring: {
      enabled: false,
      frequency: 'weekly',
      interval: 1,
      endDate: '',
    },
    labels: [],
    subtasks: [],
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const openCreateModal = useCallback((columnId: string, columnTitle: string) => {
    setModalState({
      type: 'create',
      columnId,
      columnTitle,
      isOpen: true,
      task: null,
    });
    
    // Reset form
    setTaskForm({
      title: '',
      notes: '',
      due: '',
      priority: 'normal',
      recurring: {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: '',
      },
      labels: [],
      subtasks: [],
    });
    setFormErrors({});
  }, []);

  const openEditModal = useCallback((task: EnhancedGoogleTask, listId: string) => {
    setModalState({
      type: 'edit',
      columnId: listId,
      columnTitle: null,
      isOpen: true,
      task: task,
    });

    // Populate form with task data (enhanced data is already extracted by store)
    setTaskForm({
      title: task.title,
      notes: task.notes || '', // Notes are already cleaned by store
      due: task.due ? new Date(task.due).toISOString().split('T')[0] : '',
      priority: task.priority || 'normal',
      recurring: task.recurring || {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: '',
      },
      labels: [...(task.labels || [])], // Create a new array to avoid reference issues
      subtasks: [...(task.subtasks || [])], // Create a new array to avoid reference issues
    });
    setFormErrors({});
  }, []);

  const closeModal = useCallback(() => {
    setModalState({
      type: null,
      columnId: null,
      columnTitle: null,
      isOpen: false,
      task: null,
    });
    
    // Reset form state completely to prevent data leaking between tasks
    setTaskForm({
      title: '',
      notes: '',
      due: '',
      priority: 'normal',
      recurring: {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: '',
      },
      labels: [],
      subtasks: [],
    });
    setFormErrors({});
  }, []);

  const updateTaskForm = useCallback((updates: Partial<TaskFormData>) => {
    setTaskForm(prev => ({ ...prev, ...updates }));
    
    // Clear relevant errors when fields are updated
    if (updates.title !== undefined && formErrors.title) {
      setFormErrors(prev => ({ ...prev, title: '' }));
    }
  }, [formErrors]);

  const addLabel = useCallback((label: string) => {
    if (label.trim() && !taskForm.labels?.includes(label.trim())) {
      setTaskForm(prev => ({
        ...prev,
        labels: [...(prev.labels || []), label.trim()]
      }));
    }
  }, [taskForm.labels]);

  const removeLabel = useCallback((labelToRemove: string) => {
    setTaskForm(prev => ({
      ...prev,
      labels: (prev.labels || []).filter(label => label !== labelToRemove)
    }));
  }, []);

  const addSubtask = useCallback((title: string) => {
    if (title.trim()) {
      const newSubtask = {
        id: Date.now().toString(),
        title: title.trim(),
        completed: false,
        due: '',
      };
      setTaskForm(prev => ({
        ...prev,
        subtasks: [...(prev.subtasks || []), newSubtask]
      }));
    }
  }, []);

  const updateSubtask = useCallback((subtaskId: string, updates: Partial<{ id: string; title: string; completed: boolean; due: string; }>) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).map(subtask =>
        subtask.id === subtaskId ? { ...subtask, ...updates } : subtask
      )
    }));
  }, []);

  const removeSubtask = useCallback((subtaskId: string) => {
    setTaskForm(prev => ({
      ...prev,
      subtasks: (prev.subtasks || []).filter(subtask => subtask.id !== subtaskId)
    }));
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!taskForm.title.trim()) {
      errors.title = 'Task title is required';
    }

    if (taskForm.due) {
      const dueDate = new Date(taskForm.due);
      if (isNaN(dueDate.getTime())) {
        errors.due = 'Invalid due date';
      }
    }

    if (taskForm.recurring?.enabled) {
      if (!taskForm.recurring.frequency) {
        errors.recurringFrequency = 'Recurring frequency is required';
      }
      if (taskForm.recurring.interval < 1) {
        errors.recurringInterval = 'Interval must be at least 1';
      }
      if (taskForm.recurring.endDate) {
        const endDate = new Date(taskForm.recurring.endDate);
        if (isNaN(endDate.getTime())) {
          errors.recurringEndDate = 'Invalid end date';
        } else if (taskForm.due && endDate <= new Date(taskForm.due)) {
          errors.recurringEndDate = 'End date must be after due date';
        }
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [taskForm]);

  const resetForm = useCallback(() => {
    setTaskForm({
      title: '',
      notes: '',
      due: '',
      priority: 'normal',
      recurring: {
        enabled: false,
        frequency: 'weekly',
        interval: 1,
        endDate: '',
      },
      labels: [],
      subtasks: [],
    });
    setFormErrors({});
  }, []);

  return {
    // State
    modalState,
    taskForm,
    formErrors,

    // Actions
    openCreateModal,
    openEditModal,
    closeModal,
    updateTaskForm,
    addLabel,
    removeLabel,
    addSubtask,
    updateSubtask,
    removeSubtask,
    validateForm,
    resetForm,
  };
} 
import React, { useState, useCallback, useEffect } from 'react';
import type { UnifiedTask } from '../../stores/unifiedTaskStore.types';
import { Button, Input } from '../ui';
import { X, Calendar, Tag, AlertCircle, Trash2, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

type KanbanTask = UnifiedTask;

interface TaskSidebarProps {
  isOpen: boolean;
  task: KanbanTask | null;
  onClose: () => void;
  onSubmit: (data: { 
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
  }) => Promise<void>;
  onDelete: () => Promise<void>;
}

export const TaskSidebar: React.FC<TaskSidebarProps> = ({
  isOpen,
  task,
  onClose,
  onSubmit,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
  });
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | 'none'>('none');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recurring, setRecurring] = useState<{
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
    interval: number;
    endDate?: string;
  }>({
    enabled: false,
    frequency: 'weekly',
    interval: 1
  });

  // Initialize form data when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
      });
      setPriority(task.priority || 'none');
      setLabels(task.labels || []);
      setRecurring(task.recurring || {
        enabled: false,
        frequency: 'weekly',
        interval: 1
      });
      setError(null);
    }
  }, [task]);

  // Handle form submission
  const handleSubmit = useCallback(async () => {
    if (!formData.title.trim()) {
      setError('Task title is required');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await onSubmit({
        title: formData.title.trim(),
        notes: formData.notes.trim() || undefined,
        due: formData.due || undefined,
        priority: priority !== 'none' ? priority : undefined,
        labels: labels.length > 0 ? labels : undefined,
        recurring: recurring.enabled ? recurring : undefined,
      });
    } catch (error) {
      setError('Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, priority, labels, recurring, onSubmit]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null);
    }, [error]);

  // Handle delete
  const handleDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setError('Failed to delete task. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  }, [onDelete, onClose]);

  // Handle label addition
  const handleAddLabel = useCallback(() => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels(prev => [...prev, newLabel.trim()]);
      setNewLabel('');
    }
  }, [newLabel, labels]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/20 transition-all duration-300 ${
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        aria-hidden={!isOpen}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        className={`fixed right-0 top-0 z-50 h-full w-[560px] bg-white border-l border-neutral-200 transition-all duration-300 ${
          isOpen ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
        }`}
        role="dialog"
        aria-modal="true"
        aria-label="Task details"
      >
        {task && (
          <div className="flex h-full flex-col">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b border-neutral-200 px-6 py-4">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    const isCompleted = task?.status === 'completed';
                    handleSubmit().then(() => {
                      if (task) {
                        onSubmit({ ...formData, status: isCompleted ? 'needsAction' : 'completed' });
                      }
                    });
                  }}
                  className="text-sm text-neutral-600 hover:text-neutral-800"
                >
                  {task?.status === 'completed' ? 'Mark incomplete' : 'Mark complete'}
                </button>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="ml-auto rounded p-1 hover:bg-neutral-100"
                  aria-label="Close sidebar"
                >
                  <X size={18} className="text-neutral-600" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Error Message */}
                {error && (
                  <div className="flex items-center gap-2 rounded-md bg-red-50 p-3 text-red-600">
                    <AlertCircle size={16} className="shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                {/* Task Title */}
                <div>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={handleInputChange('title')}
                    onBlur={handleSubmit}
                    className="w-full border-0 p-0 text-[18px] leading-[28px] font-semibold text-neutral-900 placeholder-neutral-400 focus:outline-none mt-2"
                    placeholder="Task title"
                    aria-label="Task title"
                    disabled={isSubmitting}
                  />
                </div>

                {/* Field Group */}
                <div className="mt-6 space-y-0">
                  {/* Field Grid */}
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-center py-2.5 border-b border-neutral-100">
                    <label className="text-[12px] text-neutral-500">Due date</label>
                    <input
                      type="date"
                      value={formData.due}
                      onChange={handleInputChange('due')}
                      onBlur={handleSubmit}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                      aria-label="Due date"
                    />
                  </div>

                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-center py-2.5 border-b border-neutral-100">
                    <label className="text-[12px] text-neutral-500">Priority</label>
                    <select
                      value={priority}
                      onChange={async (e) => {
                        const newPriority = e.target.value as 'high' | 'medium' | 'low' | 'none';
                        setPriority(newPriority);
                        setIsSubmitting(true);
                        try {
                          await onSubmit({
                            title: formData.title.trim(),
                            priority: newPriority !== 'none' ? newPriority : undefined,
                          });
                        } catch (error) {
                          setError('Failed to update priority');
                        } finally {
                          setIsSubmitting(false);
                        }
                      }}
                      disabled={isSubmitting}
                      className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 focus:border-blue-500 focus:outline-none"
                      aria-label="Task priority"
                    >
                      <option value="none">None</option>
                      <option value="high">High</option>
                      <option value="medium">Medium</option>
                      <option value="low">Low</option>
                    </select>
                  </div>

                  {/* Labels */}
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start py-2.5 border-b border-neutral-100">
                    <label className="text-[12px] text-neutral-500 pt-1">Labels</label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newLabel}
                          onChange={(e) => setNewLabel(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddLabel();
                            }
                          }}
                          placeholder="Add a label..."
                          aria-label="Add a new label"
                          disabled={isSubmitting}
                          className="flex-1 rounded-lg border border-neutral-200 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
                        />
                        <button
                          onClick={handleAddLabel}
                          disabled={!newLabel.trim() || isSubmitting}
                          className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                        >
                          Add
                        </button>
                      </div>
                      {labels.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {labels.map((label, index) => (
                            <span
                              key={index}
                              className="h-[22px] px-2.5 rounded-full bg-neutral-50 border border-neutral-200 text-[12px] inline-flex items-center gap-1"
                            >
                              {label}
                              <button
                                type="button"
                                onClick={() => {
                                  setLabels(prev => prev.filter(l => l !== label));
                                  handleSubmit();
                                }}
                                disabled={isSubmitting}
                                className="hover:text-blue-900"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recurring */}
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start py-2.5 border-b border-neutral-100">
                    <label className="text-[12px] text-neutral-500 pt-1">Recurring</label>
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          setRecurring(prev => ({ ...prev, enabled: !prev.enabled }));
                          handleSubmit();
                        }}
                        className={`flex w-full items-center justify-between rounded-lg border px-3 py-1.5 text-sm transition-colors ${
                          recurring.enabled
                            ? 'border-blue-200 bg-blue-50 text-blue-700'
                            : 'border-neutral-200 text-neutral-700 hover:bg-neutral-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <RotateCcw size={16} />
                          {recurring.enabled ? 'Repeating task' : 'Set to repeat'}
                        </span>
                        {recurring.enabled && (
                          <span className="text-xs capitalize">{recurring.frequency}</span>
                        )}
                      </button>
                      {recurring.enabled && (
                        <select
                          value={recurring.frequency}
                          onChange={(e) => {
                            setRecurring(prev => ({ ...prev, frequency: e.target.value as any }));
                            handleSubmit();
                          }}
                          className="w-full rounded-lg border border-neutral-200 px-3 py-1.5 text-sm"
                        >
                          <option value="daily">Daily</option>
                          <option value="weekly">Weekly</option>
                          <option value="monthly">Monthly</option>
                          <option value="yearly">Yearly</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start py-2.5 border-b border-neutral-100">
                    <label className="text-[12px] text-neutral-500 pt-1">Description</label>
                    <textarea
                      value={formData.notes}
                      onChange={handleInputChange('notes')}
                      onBlur={handleSubmit}
                      placeholder="Add a description..."
                      aria-label="Task description"
                      disabled={isSubmitting}
                      rows={4}
                      className="w-full resize-none rounded-lg border border-neutral-200 px-3 py-2 text-sm placeholder-neutral-400 focus:border-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Subtasks */}
                  <div className="grid grid-cols-[120px_1fr] gap-x-4 items-start py-2.5">
                    <label className="text-[12px] text-neutral-500 pt-1">Subtasks</label>
                    <button className="w-full rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-neutral-500 hover:border-neutral-400 hover:bg-neutral-50" aria-label="Add subtask">
                      + Add subtask
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 p-6">
              <button
                onClick={handleDelete}
                disabled={isDeleting || isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
              >
                <Trash2 size={16} />
                <span>{isDeleting ? 'Deleting...' : 'Delete task'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
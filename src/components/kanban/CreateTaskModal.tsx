import React, { useState, useCallback } from 'react';
import { Card, Button, Input } from '../ui';
import { X, Calendar, Tag, AlertCircle, Plus, CheckSquare, RotateCcw, Trash2 } from 'lucide-react';

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    notes?: string; 
    due?: string;
    metadata?: import('../../stores/useKanbanStore').TaskMetadata;
  }) => Promise<void>;
  columnTitle: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  columnTitle,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
  });
  const [metadata, setMetadata] = useState<import('../../stores/useKanbanStore').TaskMetadata>({
    labels: [],
    priority: 'normal' as const,
    subtasks: [],
    recurring: {
      enabled: false,
      frequency: 'weekly' as const,
      interval: 1,
    },
  });
  const [newLabel, setNewLabel] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens/closes
  React.useEffect(() => {
    if (isOpen) {
      setFormData({ title: '', notes: '', due: '' });
      setMetadata({
        labels: [],
        priority: 'normal' as const,
        subtasks: [],
        recurring: {
          enabled: false,
          frequency: 'weekly' as const,
          interval: 1,
        },
      });
      setNewLabel('');
      setError(null);
    }
  }, [isOpen]);

  // Handle form submission
  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
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
        metadata: metadata,
      });
      // Modal will be closed by parent component
    } catch (error) {
      // Failed to create task
      setError('Failed to create task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, metadata, onSubmit]);

  // Handle input changes
  const handleInputChange = useCallback((field: keyof typeof formData) => 
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormData(prev => ({ ...prev, [field]: e.target.value }));
      if (error) setError(null); // Clear error when user starts typing
    }, [error]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border-default">
            <div>
              <h2 className="text-lg font-semibold text-primary">Create Task</h2>
              <p className="text-sm text-muted">Add a new task to {columnTitle}</p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSubmitting}
              className="h-8 w-8 p-0"
            >
              <X size={16} />
            </Button>
          </div>

          {/* Form Content */}
          <div className="p-6 space-y-4">
            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-error-soft border border-error rounded-md">
                <AlertCircle size={16} className="text-error flex-shrink-0" />
                <p className="text-sm text-error">{error}</p>
              </div>
            )}

            {/* Task Title */}
            <div>
              <label htmlFor="task-title" className="block text-sm font-medium text-primary mb-1">
                Title *
              </label>
              <Input
                id="task-title"
                type="text"
                value={formData.title}
                onChange={handleInputChange('title')}
                placeholder="Enter task title..."
                disabled={isSubmitting}
                className="w-full"
                autoFocus
              />
            </div>

            {/* Task Notes */}
            <div>
              <label htmlFor="task-notes" className="block text-sm font-medium text-primary mb-1">
                Description
              </label>
              <textarea
                id="task-notes"
                value={formData.notes}
                onChange={handleInputChange('notes')}
                placeholder="Add task description..."
                disabled={isSubmitting}
                rows={3}
                className="w-full px-3 py-2 border border-border-default rounded-md bg-card text-primary placeholder-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            </div>

            {/* Due Date and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="task-due" className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                  <Calendar size={14} />
                  Due date
                </label>
                <Input
                  id="task-due"
                  type="date"
                  value={formData.due}
                  onChange={handleInputChange('due')}
                  disabled={isSubmitting}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="task-priority" className="block text-sm font-medium text-primary mb-1">
                  Priority
                </label>
                <select
                  id="task-priority"
                  value={metadata.priority}
                  onChange={(e) => setMetadata(prev => ({ 
                    ...prev, 
                    priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent'
                  }))}
                  disabled={isSubmitting}
                  className="w-full px-3 py-2 border border-border-default rounded-md bg-card text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                <Tag size={14} />
                Tags
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="Add a tag..."
                    disabled={isSubmitting}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newLabel.trim() && !metadata.labels.includes(newLabel.trim())) {
                          setMetadata(prev => ({
                            ...prev,
                            labels: [...prev.labels, newLabel.trim()]
                          }));
                          setNewLabel('');
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newLabel.trim() && !metadata.labels.includes(newLabel.trim())) {
                        setMetadata(prev => ({
                          ...prev,
                          labels: [...prev.labels, newLabel.trim()]
                        }));
                        setNewLabel('');
                      }
                    }}
                    disabled={!newLabel.trim() || isSubmitting}
                    className="px-3"
                  >
                    Add
                  </Button>
                </div>
                {metadata.labels.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {metadata.labels.map((label, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-accent-soft text-accent-primary rounded-full text-sm"
                      >
                        {label}
                        <button
                          type="button"
                          onClick={() => setMetadata(prev => ({
                            ...prev,
                            labels: prev.labels.filter(l => l !== label)
                          }))}
                          disabled={isSubmitting}
                          className="hover:text-error"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Subtasks */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                <CheckSquare size={14} />
                Subtasks
              </label>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="Add a subtask..."
                    disabled={isSubmitting}
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        const title = input.value.trim();
                        if (title) {
                          setMetadata(prev => ({
                            ...prev,
                            subtasks: [...prev.subtasks, {
                              id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                              title,
                              completed: false,
                            }]
                          }));
                          input.value = '';
                        }
                      }
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      const input = (e.target as HTMLElement).parentElement?.querySelector('input') as HTMLInputElement;
                      const title = input?.value.trim();
                      if (title) {
                        setMetadata(prev => ({
                          ...prev,
                          subtasks: [...prev.subtasks, {
                            id: `subtask-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                            title,
                            completed: false,
                          }]
                        }));
                        input.value = '';
                      }
                    }}
                    disabled={isSubmitting}
                    className="px-3"
                  >
                    <Plus size={14} />
                  </Button>
                </div>
                {metadata.subtasks.length > 0 && (
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {metadata.subtasks.map((subtask, index) => (
                      <div key={subtask.id} className="flex items-center gap-2 p-2 bg-tertiary rounded-md">
                        <input
                          type="checkbox"
                          checked={subtask.completed}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            subtasks: prev.subtasks.map(st => 
                              st.id === subtask.id ? { ...st, completed: e.target.checked } : st
                            )
                          }))}
                          disabled={isSubmitting}
                          className="rounded"
                        />
                        <span className={`flex-1 text-sm ${subtask.completed ? 'line-through text-muted' : 'text-primary'}`}>
                          {subtask.title}
                        </span>
                        <input
                          type="date"
                          value={subtask.due || ''}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            subtasks: prev.subtasks.map(st => 
                              st.id === subtask.id ? { ...st, due: e.target.value || undefined } : st
                            )
                          }))}
                          disabled={isSubmitting}
                          className="text-xs px-2 py-1 border border-border-default rounded bg-card"
                          title="Due date"
                        />
                        <button
                          type="button"
                          onClick={() => setMetadata(prev => ({
                            ...prev,
                            subtasks: prev.subtasks.filter(st => st.id !== subtask.id)
                          }))}
                          disabled={isSubmitting}
                          className="text-muted hover:text-error p-1"
                          title="Remove subtask"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Recurring Due Dates */}
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-primary mb-1">
                <RotateCcw size={14} />
                Recurring
              </label>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="recurring-enabled"
                    checked={metadata.recurring?.enabled || false}
                    onChange={(e) => setMetadata(prev => ({
                      ...prev,
                      recurring: {
                        enabled: e.target.checked,
                        frequency: prev.recurring?.frequency || 'weekly',
                        interval: prev.recurring?.interval || 1,
                        endDate: prev.recurring?.endDate,
                      }
                    }))}
                    disabled={isSubmitting}
                    className="rounded"
                  />
                  <label htmlFor="recurring-enabled" className="text-sm text-primary">
                    Make this task recurring
                  </label>
                </div>
                
                {metadata.recurring?.enabled && (
                  <div className="grid grid-cols-2 gap-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-primary mb-1">
                        Repeat every
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="1"
                          value={metadata.recurring.interval}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            recurring: {
                              ...prev.recurring!,
                              interval: Math.max(1, parseInt(e.target.value) || 1)
                            }
                          }))}
                          disabled={isSubmitting}
                          className="w-16 text-sm"
                        />
                        <select
                          value={metadata.recurring.frequency}
                          onChange={(e) => setMetadata(prev => ({
                            ...prev,
                            recurring: {
                              ...prev.recurring!,
                              frequency: e.target.value as 'daily' | 'weekly' | 'monthly' | 'yearly'
                            }
                          }))}
                          disabled={isSubmitting}
                          className="flex-1 px-2 py-1 text-sm border border-border-default rounded-md bg-card text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                        >
                          <option value="daily">Day(s)</option>
                          <option value="weekly">Week(s)</option>
                          <option value="monthly">Month(s)</option>
                          <option value="yearly">Year(s)</option>
                        </select>
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-medium text-primary mb-1">
                        End date (optional)
                      </label>
                      <Input
                        type="date"
                        value={metadata.recurring.endDate || ''}
                        onChange={(e) => setMetadata(prev => ({
                          ...prev,
                          recurring: {
                            ...prev.recurring!,
                            endDate: e.target.value || undefined
                          }
                        }))}
                        disabled={isSubmitting}
                        className="w-full text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border-default">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !formData.title.trim()}
              className="min-w-20"
            >
              {isSubmitting ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Creating...
                </div>
              ) : (
                'Create Task'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
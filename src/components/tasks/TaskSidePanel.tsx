import React, { useEffect, useState, useRef } from 'react';
import { X, Calendar, Flag, Tag, CheckSquare, Trash2, Plus } from 'lucide-react';
import type { UnifiedTask, UpdateTaskInput } from '../../stores/unifiedTaskStore.types';
import { Button } from '../ui';
import { format } from 'date-fns';
import { LabelColorPicker } from './LabelColorPicker';

interface TaskSidePanelProps {
  task: UnifiedTask | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: UpdateTaskInput) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
}

export const TaskSidePanel: React.FC<TaskSidePanelProps> = ({
  task,
  isOpen,
  onClose,
  onUpdate,
  onDelete,
}) => {
  const [formData, setFormData] = useState({
    title: '',
    notes: '',
    due: '',
    priority: 'none' as 'high' | 'medium' | 'low' | 'none',
    labels: [] as Array<{ name: string; color: 'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray' }>,
  });
  const [newLabel, setNewLabel] = useState('');
  const [newLabelColor, setNewLabelColor] = useState<'red' | 'blue' | 'green' | 'purple' | 'orange' | 'pink' | 'teal' | 'yellow' | 'cyan' | 'gray'>('blue');
  const [isDeleting, setIsDeleting] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title || '',
        notes: task.notes || '',
        due: task.due || '',
        priority: task.priority || 'low',
        labels: task.labels || [],
      });
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && titleInputRef.current) {
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!task) return;
    
    // CRITICAL: Send COMPLETE task object to prevent Google Tasks API from clearing fields
    // The API interprets missing fields as a request to clear them
    const completeUpdate: any = {
      // Always include ALL fields from the current task state
      title: formData.title.trim(),
      notes: formData.notes.trim(),
      priority: formData.priority,
      labels: formData.labels,
      // Include all task fields that might not be in the form
      status: task.status || 'needsAction',
      columnId: task.columnId,
      googleTaskListId: task.googleTaskListId,
      position: task.position,
      recurring: task.recurring,
      timeBlock: task.timeBlock,
      // Handle due date - use form value if set, otherwise preserve existing
      due: formData.due || task.due || undefined,
    };

    // If due_date_only is present in task, include it
    if (formData.due) {
      completeUpdate.due_date_only = formData.due.split('T')[0];
    } else if (task.due_date_only) {
      completeUpdate.due_date_only = task.due_date_only;
    }
    
    console.log('🔵 TaskSidePanel update - Sending COMPLETE task object:', {
      taskId: task.id,
      completeUpdate,
      originalTask: task
    });
    
    await onUpdate(task.id, completeUpdate);
  };

  const handleDelete = async () => {
    if (!task) return;
    setIsDeleting(true);
    await onDelete(task.id);
    onClose();
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !formData.labels.find(l => l.name === newLabel.trim())) {
      setFormData(prev => ({
        ...prev,
        labels: [...prev.labels, { name: newLabel.trim(), color: newLabelColor }]
      }));
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelName: string) => {
    setFormData(prev => ({
      ...prev,
      labels: prev.labels.filter(l => l.name !== labelName)
    }));
  };

  const priorityOptions = [
    { 
      value: 'high', 
      label: 'High',
      style: {
        backgroundColor: 'var(--red-50)',
        color: 'var(--red-600)',
        borderColor: 'var(--red-50)'
      }
    },
    { 
      value: 'medium', 
      label: 'Medium',
      style: {
        backgroundColor: 'var(--amber-50)',
        color: 'var(--amber-600)',
        borderColor: 'var(--amber-50)'
      }
    },
    { 
      value: 'low', 
      label: 'Low',
      style: {
        backgroundColor: '#e0f2fe',
        color: '#0369a1',
        borderColor: '#e0f2fe'
      }
    },
    { 
      value: 'none', 
      label: 'None',
      style: {
        backgroundColor: 'var(--bg-secondary)',
        color: 'var(--text-secondary)',
        borderColor: 'var(--bg-secondary)'
      }
    },
  ];

  if (!task) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/20 transition-opacity z-40 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Side Panel */}
      <div
        className={`fixed transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
        style={{ 
          width: '480px',
          top: '96px', // Pixel-perfect alignment with column headers
          right: '32px', // More padding from edge
          bottom: '32px',
          zIndex: 50,
        }}
      >
        <div className="h-full bg-white rounded-xl border border-gray-200 shadow-lg overflow-hidden flex flex-col">
          {/* Header - with reduced height to align content */}
          <div className="flex items-center justify-between px-6 py-2 border-b border-gray-200" style={{ minHeight: '48px' }}>
            <h2 className="text-base font-semibold text-gray-900">Task details</h2>
            <Button
              type="button"
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              aria-label="Close panel"
            >
              <X size={20} color="#6B6F76" strokeWidth={2} />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden">
            {/* Title Section */}
            <div className="px-6 pt-2 pb-4">
              <input
                ref={titleInputRef}
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                onBlur={handleSubmit}
                className="w-full text-2xl font-normal border-0 focus:outline-none px-0 py-0"
                placeholder="Write a task name"
              />
            </div>

            {/* Due Date Section */}
            <div className="px-6 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Calendar size={16} />
                Due date
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={formData.due ? formData.due.split('T')[0] : ''}
                  onChange={(e) => {
                    const newDue = e.target.value ? `${e.target.value}T00:00:00.000Z` : '';
                    setFormData(prev => ({ ...prev, due: newDue }));
                  }}
                  onBlur={handleSubmit}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none"
                />
                {formData.due && (
                  <div className="mt-2 text-sm text-gray-600">
                    {format(new Date(formData.due.split('T')[0] + 'T12:00:00'), 'MMM d, yyyy')}
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Priority Section */}
            <div className="px-6 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Flag size={16} />
                Priority
              </label>
              <div className="flex gap-2">
                {priorityOptions.map((option) => (
                  <Button
                    key={option.value}
                    type="button"
                    onClick={async () => {
                      // Only update if priority actually changed
                      if (formData.priority !== option.value) {
                        setFormData(prev => ({ ...prev, priority: option.value as any }));
                        
                        // Send ONLY priority update to avoid timezone shifts
                        console.log('🔵 Priority-only update:', {
                          taskId: task?.id,
                          oldPriority: formData.priority,
                          newPriority: option.value
                        });
                        
                        if (task) {
                          // Include ALL current form data to prevent clearing other fields
                          const updates: any = {
                            title: formData.title.trim() || task.title,
                            priority: option.value !== 'none' ? option.value as any : undefined,
                          };
                          // Only include notes if they have a value
                          if (formData.notes.trim() || task.notes) {
                            updates.notes = formData.notes.trim() || task.notes;
                          }
                          // Only include due date if it has a non-empty value
                          // Check for non-empty string to avoid sending empty string which clears the date
                          const dueToUse = formData.due && formData.due.trim() ? formData.due : task.due;
                          if (dueToUse && dueToUse.trim()) {
                            updates.due = dueToUse;
                          }
                          // Only include labels if there are any
                          if (formData.labels.length > 0 || (task.labels && task.labels.length > 0)) {
                            updates.labels = formData.labels.length > 0 ? formData.labels : task.labels;
                          }
                          await onUpdate(task.id, updates);
                        }
                      }
                    }}
                    className="px-4 py-2 rounded-lg text-sm font-medium transition-all border-2"
                    style={
                      formData.priority === option.value
                        ? { ...option.style, boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)' }
                        : {
                            backgroundColor: '#F9FAFB',
                            color: '#6B7280',
                            borderColor: '#E5E7EB'
                          }
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Labels Section */}
            <div className="px-6 py-4">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Tag size={16} />
                Labels
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.labels.map((label) => (
                  <span
                    key={label.name}
                    className={`label label-${label.color} inline-flex items-center gap-1`}
                    style={{ paddingRight: '4px' }}
                  >
                    {label.name}
                    <Button
                      type="button"
                      onClick={() => handleRemoveLabel(label.name)}
                      variant="ghost"
                      size="icon"
                      className="h-4 w-4 p-0 hover:opacity-70"
                      style={{ marginLeft: '4px', marginRight: '-2px' }}
                    >
                      <X size={12} />
                    </Button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
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
                  placeholder="Add a label"
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
                <LabelColorPicker
                  selectedColor={newLabelColor}
                  onColorSelect={(color: string) => setNewLabelColor(color as any)}
                  compact={true}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddLabel}
                  className="px-2"
                >
                  <Plus size={16} />
                </Button>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-100" />

            {/* Notes Section */}
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                onBlur={handleSubmit}
                rows={4}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none resize-none"
                placeholder="Add notes..."
              />
            </div>

          </div>

          {/* Footer */}
          <div className="border-t px-6 py-4">
            <div className="flex justify-between">
              <Button
                variant="ghost"
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 size={16} className="mr-2" />
                Delete Task
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  handleSubmit();
                  onClose();
                }}
              >
                Done
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
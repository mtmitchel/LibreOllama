import React, { useState, useEffect } from 'react';
import { X, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { GoogleTask } from '../../../../types/google';
import { asanaTypography } from '../config';

// Subtask interface
interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

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

export const AsanaTaskModal: React.FC<AsanaTaskModalProps> = ({ 
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
        priority: 'normal',
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
    
    const formattedDue = formData.due 
      ? `${formData.due}T00:00:00.000Z`
      : undefined;
      
    onSubmit({
      title: formData.title,
      notes: formData.notes,
      due: formattedDue,
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
    <div className="cal-modal-overlay">
      <div className="cal-modal" style={{ maxHeight: '90vh', overflow: 'auto' }}>
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
                className="cal-input w-full"
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
                className="cal-input w-full resize-none"
                style={{ minHeight: '100px' }}
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
                  className="cal-input w-full"
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
                  className="cal-input w-full cursor-pointer"
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
                    className="cal-input flex-1"
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
                    className="cal-input flex-1"
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
import React, { useEffect, useState } from 'react';
import { X, Plus, CheckCircle2, Circle, Trash2 } from 'lucide-react';
import { KanbanTask } from '../../stores/useKanbanStore';
import { asanaTypography } from '../../constants/asanaDesignSystem';

interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

interface AsanaTaskModalProps {
  isOpen: boolean;
  task: KanbanTask | null;
  columnId: string;
  mode: 'create' | 'edit';
  onClose: () => void;
  onSubmit: (data: Partial<KanbanTask>) => void;
  onDelete?: () => void;
}

export const AsanaTaskModal: React.FC<AsanaTaskModalProps> = ({
  isOpen,
  task,
  columnId,
  mode,
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
        title: task.title || '',
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
        priority: task.metadata?.priority || 'normal',
        labels: task.metadata?.labels || [],
        subtasks: task.metadata?.subtasks || [],
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
    onSubmit({
      ...task,
      title: formData.title,
      notes: formData.notes,
      due: formData.due ? formData.due : undefined,
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
                {mode === 'create' ? 'Create Task' : 'Edit Task'}
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
              {mode === 'edit' && onDelete && (
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
                {mode === 'create' ? 'Create Task' : 'Save Changes'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
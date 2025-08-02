import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Hash, Clock } from 'lucide-react';
import { GoogleTask } from '../../../../types/google';
import { format } from 'date-fns';

interface CompactTaskEditModalProps {
  isOpen: boolean;
  task?: GoogleTask | null;
  onClose: () => void;
  onSubmit: (data: { 
    title: string; 
    notes?: string; 
    due?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
    timeBlock?: {
      startTime: string;
      endTime: string;
    };
  }) => void;
  onDelete?: () => void;
}

export const CompactTaskEditModal: React.FC<CompactTaskEditModalProps> = ({ 
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
    startTime: '',
    endTime: '',
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    // Reset delete confirmation when modal opens/closes
    setShowDeleteConfirm(false);
    setIsDeleting(false);
    
    if (task) {
      let startTime = '';
      let endTime = '';
      
      if (task.timeBlock) {
        const start = new Date(task.timeBlock.startTime);
        const end = new Date(task.timeBlock.endTime);
        startTime = format(start, 'HH:mm');
        endTime = format(end, 'HH:mm');
      }
      
      setFormData({
        title: task.title,
        notes: task.notes || '',
        due: task.due ? task.due.split('T')[0] : '',
        priority: task.priority || 'normal',
        startTime,
        endTime,
      });
    } else {
      setFormData({
        title: '',
        notes: '',
        due: '',
        priority: 'normal',
        startTime: '',
        endTime: '',
      });
    }
  }, [task, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const formattedDue = formData.due 
      ? `${formData.due}T00:00:00.000Z`
      : undefined;
    
    let timeBlock;
    if (formData.startTime && formData.endTime && formData.due) {
      const baseDate = new Date(formData.due);
      const [startHour, startMin] = formData.startTime.split(':').map(Number);
      const [endHour, endMin] = formData.endTime.split(':').map(Number);
      
      const startTime = new Date(baseDate);
      startTime.setHours(startHour, startMin, 0, 0);
      
      const endTime = new Date(baseDate);
      endTime.setHours(endHour, endMin, 0, 0);
      
      timeBlock = {
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      };
    }
      
    onSubmit({
      title: formData.title,
      notes: formData.notes,
      due: formattedDue,
      priority: formData.priority,
      timeBlock,
    });
    onClose();
  };

  if (!isOpen) return null;

  const priorityColors = {
    low: 'bg-gray-100 text-gray-600',
    normal: 'bg-blue-100 text-blue-600',
    high: 'bg-orange-100 text-orange-600',
    urgent: 'bg-red-100 text-red-600'
  };

  return (
    <div 
      className={`fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9999] transition-opacity duration-200 ${isDeleting ? 'opacity-50' : 'opacity-100'}`}
      onClick={onClose}
    >
      <div 
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all duration-200 ${isDeleting ? 'scale-95 opacity-50' : 'scale-100 opacity-100'}`}
        onClick={(e) => e.stopPropagation()}
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-100">
            <h2 className="text-lg font-semibold text-gray-900">
              Edit Task
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X size={18} className="text-gray-500" />
            </button>
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-4">
            {/* Title */}
            <div>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 text-base font-medium text-gray-900 bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors"
                placeholder="Task title..."
                required
                autoFocus
              />
            </div>

            {/* Notes */}
            <div>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                className="w-full px-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors resize-none"
                placeholder="Add notes..."
                rows={2}
              />
            </div>

            {/* Quick Options */}
            <div className="flex gap-3">
              {/* Due Date */}
              <div className="flex-1">
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="date"
                    value={formData.due}
                    onChange={(e) => setFormData(prev => ({ ...prev, due: e.target.value }))}
                    className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors"
                  />
                </div>
              </div>

              {/* Priority */}
              <div className="relative">
                <Flag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData(prev => ({ ...prev, priority: e.target.value as 'low' | 'normal' | 'high' | 'urgent' }))}
                  className="pl-9 pr-8 py-2 text-sm bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors appearance-none cursor-pointer"
                >
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            {/* Time block inputs - only show if date is selected */}
            {formData.due && (
              <div className="flex gap-3">
                <div className="flex-1">
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors"
                      placeholder="Start"
                    />
                  </div>
                </div>
                <div className="flex items-center text-gray-400">–</div>
                <div className="flex-1">
                  <div className="relative">
                    <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                      className="w-full pl-9 pr-3 py-2 text-sm text-gray-700 bg-gray-50 rounded-lg border border-transparent focus:border-purple-300 focus:bg-white focus:outline-none transition-colors"
                      placeholder="End"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Current values display */}
            {(formData.due || formData.priority !== 'normal' || (formData.startTime && formData.endTime)) && (
              <div className="flex flex-wrap gap-2">
                {formData.due && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-600 rounded-md text-xs">
                    <Calendar size={12} />
                    {format(new Date(formData.due), 'MMM d, yyyy')}
                  </span>
                )}
                {formData.startTime && formData.endTime && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 rounded-md text-xs">
                    <Clock size={12} />
                    {formData.startTime} - {formData.endTime}
                  </span>
                )}
                {formData.priority !== 'normal' && (
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs ${priorityColors[formData.priority]}`}>
                    <Flag size={12} />
                    {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-4 border-t border-gray-100">
            {onDelete ? (
              showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Delete task?</span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDeleting(true);
                      // Call onDelete immediately which should close the modal
                      onDelete();
                    }}
                    disabled={isDeleting}
                    className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDeleting ? 'Deleting...' : 'Yes'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    disabled={isDeleting}
                    className="text-sm text-gray-600 hover:text-gray-700 hover:bg-gray-100 px-3 py-1.5 rounded-lg transition-colors"
                  >
                    No
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="text-sm text-red-600 hover:text-red-700 hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Delete
                </button>
              )
            ) : (
              <div />
            )}
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
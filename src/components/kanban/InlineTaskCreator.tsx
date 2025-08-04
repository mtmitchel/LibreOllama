import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, Flag } from 'lucide-react';
import '../../styles/asana-design-system.css';

interface InlineTaskCreatorProps {
  columnId: string;
  onSubmit: (data: { 
    title: string; 
    notes?: string; 
    due?: string;
    priority?: 'high' | 'medium' | 'low' | 'none';
    labels?: string[];
  }) => Promise<void>;
  onCancel: () => void;
}

export const InlineTaskCreator: React.FC<InlineTaskCreatorProps> = ({
  columnId,
  onSubmit,
  onCancel,
}) => {
  const [title, setTitle] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [dueDate, setDueDate] = useState<string>('');
  const [priority, setPriority] = useState<'high' | 'medium' | 'low' | 'none'>('none');
  const [error, setError] = useState<string | null>(null);
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dateButtonRef = useRef<HTMLButtonElement>(null);
  const priorityButtonRef = useRef<HTMLButtonElement>(null);

  // Focus title input when component mounts
  useEffect(() => {
    titleInputRef.current?.focus();
  }, []);

  // Handle clicks outside to cancel
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        if (!title.trim() && !isExpanded) {
          onCancel();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [title, isExpanded, onCancel]);

  // Close popups when clicking outside
  useEffect(() => {
    const handleClickOutsidePopups = (event: MouseEvent) => {
      if (showDatePicker && dateButtonRef.current && !dateButtonRef.current.contains(event.target as Node)) {
        const datePickerElement = document.querySelector('.inline-date-picker');
        if (datePickerElement && !datePickerElement.contains(event.target as Node)) {
          setShowDatePicker(false);
        }
      }
      if (showPriorityMenu && priorityButtonRef.current && !priorityButtonRef.current.contains(event.target as Node)) {
        const priorityMenuElement = document.querySelector('.inline-priority-menu');
        if (priorityMenuElement && !priorityMenuElement.contains(event.target as Node)) {
          setShowPriorityMenu(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutsidePopups);
    return () => document.removeEventListener('mousedown', handleClickOutsidePopups);
  }, [showDatePicker, showPriorityMenu]);

  const handleSubmit = useCallback(async () => {
    console.log('handleSubmit called', { title: title.trim(), isSubmitting });
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    try {
      console.log('Calling onSubmit with:', { 
        title: title.trim(),
        due: dueDate || undefined,
        priority: priority || 'none',
      });
      await onSubmit({ 
        title: title.trim(),
        due: dueDate || undefined,
        priority: priority || 'none',
      });
      setTitle('');
      setDueDate('');
      setPriority('none');
      setIsExpanded(false);
      setShowDatePicker(false);
      setShowPriorityMenu(false);
    } catch (error) {
      console.error('Failed to create task:', error);
      // Extract error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to create task';
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, dueDate, priority, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      setTitle('');
      onCancel();
    }
  }, [handleSubmit, onCancel]);

  return (
    <div 
      ref={containerRef}
      className="asana-card inline-task-creator"
      style={{ 
        marginBottom: '6px', 
        position: 'relative', 
        zIndex: (showDatePicker || showPriorityMenu) ? 9997 : 10 
      }}
    >
      <div className="flex items-center gap-2">
        {/* Checkbox placeholder */}
        <div className="asana-checkbox" style={{ width: '18px', height: '18px' }} />
        
        {/* Title input */}
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsExpanded(true)}
          placeholder="Write a task name"
          aria-label="Task name"
          className="flex-1 border-0 p-0 outline-none bg-transparent"
          style={{ 
            fontSize: 'var(--asana-font-size-base)',
            color: 'var(--asana-text-primary)',
            lineHeight: 'var(--asana-line-height-tight)'
          }}
          disabled={isSubmitting}
        />
      </div>
      
      {/* Expanded controls */}
      {isExpanded && (
        <div className="mt-2 pl-6">
          {error && (
            <div className="mb-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                className={`h-7 px-3 rounded-md text-[12px] font-medium transition-all
                  ${title.trim() && !isSubmitting
                    ? 'bg-blue-500 text-white hover:bg-blue-600'
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                aria-label="Create task"
              >
                {isSubmitting ? 'Creating...' : 'Add task'}
              </button>
              
              <button
                type="button"
                onClick={onCancel}
                className="h-7 px-3 rounded-md text-[12px] text-gray-600 hover:bg-gray-100 transition-colors"
                disabled={isSubmitting}
                aria-label="Cancel"
              >
                Cancel
              </button>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="relative" style={{ zIndex: showDatePicker ? 9998 : 'auto' }}>
                <button
                  ref={dateButtonRef}
                  type="button"
                  className={`p-1 transition-colors ${dueDate ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                  aria-label="Set due date"
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowPriorityMenu(false);
                  }}
                >
                  <Calendar size={16} />
                </button>
                
                {showDatePicker && (
                  <div className="inline-date-picker absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 p-3" style={{ minWidth: '200px', zIndex: 9999 }}>
                    <div className="text-xs font-medium text-gray-600 mb-2">Due Date</div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-between mt-2">
                      <button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setShowDatePicker(false);
                        }}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        Clear
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        className="text-xs text-blue-500 hover:text-blue-600"
                      >
                        Done
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" style={{ zIndex: showPriorityMenu ? 9998 : 'auto' }}>
                <button
                  ref={priorityButtonRef}
                  type="button"
                  className={`p-1 transition-colors ${
                    priority === 'high' 
                      ? 'text-red-500' 
                      : priority === 'medium' 
                        ? 'text-orange-500' 
                        : priority === 'low'
                          ? 'text-sky-600'
                          : 'text-gray-400 hover:text-gray-600'
                  }`}
                  aria-label="Set priority"
                  onClick={() => {
                    setShowPriorityMenu(!showPriorityMenu);
                    setShowDatePicker(false);
                  }}
                >
                  <Flag size={16} />
                </button>
                
                {showPriorityMenu && (
                  <div className="inline-priority-menu absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1" style={{ minWidth: '140px', zIndex: 9999 }}>
                    {[
                      { value: 'high', label: 'High', color: 'text-red-500' },
                      { value: 'medium', label: 'Medium', color: 'text-orange-500' },
                      { value: 'low', label: 'Low', color: 'text-sky-600' }
                    ].map(option => (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setPriority(option.value as typeof priority);
                          setShowPriorityMenu(false);
                        }}
                        className={`w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 flex items-center gap-2 ${
                          priority === option.value ? 'bg-gray-50' : ''
                        }`}
                      >
                        <Flag size={14} className={option.color} />
                        <span className={option.color}>{option.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          setPriority('none');
                          setShowPriorityMenu(false);
                        }}
                        className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 text-gray-600 flex items-center gap-2"
                      >
                        <span className="w-[14px]"></span>
                        <span>None</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
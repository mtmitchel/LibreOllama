import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, Flag } from 'lucide-react';
import { Button } from '../ui/design-system/Button';
import '../../styles/asana-core.css';

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
        zIndex: (showDatePicker || showPriorityMenu) ? 10000 : 100 
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
            <div className="mb-2 text-[11px] text-red-600 bg-red-50 px-2 py-1 rounded">
              {error}
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleSubmit}
                disabled={!title.trim() || isSubmitting}
                variant="primary"
                size="sm"
                className="h-7 text-[12px]"
                aria-label="Create task"
              >
                {isSubmitting ? 'Creating...' : 'Add task'}
              </Button>
              
              <Button
                type="button"
                onClick={onCancel}
                variant="ghost"
                size="sm"
                className="h-7 text-[12px]"
                disabled={isSubmitting}
                aria-label="Cancel"
              >
                Cancel
              </Button>
            </div>
            
            <div className="flex items-center gap-1">
              <div className="relative" style={{ zIndex: showDatePicker ? 10001 : 'auto' }}>
                <Button
                  ref={dateButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`p-1 ${dueDate ? 'text-accent-primary' : 'text-secondary'}`}
                  aria-label="Set due date"
                  onClick={() => {
                    setShowDatePicker(!showDatePicker);
                    setShowPriorityMenu(false);
                  }}
                >
                  <Calendar size={16} />
                </Button>
                
                {showDatePicker && (
                  <div className="inline-date-picker absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 p-3" style={{ minWidth: '200px', zIndex: 10002 }}>
                    <div className="text-[11px] font-medium text-gray-600 mb-2">Due Date</div>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full px-2 py-1 asana-text-sm border border-gray-200 rounded-md focus:outline-none focus:border-blue-500"
                    />
                    <div className="flex justify-between mt-2">
                      <Button
                        type="button"
                        onClick={() => {
                          setDueDate('');
                          setShowDatePicker(false);
                        }}
                        variant="ghost"
                        size="sm"
                        className="text-[11px]"
                      >
                        Clear
                      </Button>
                      <Button
                        type="button"
                        onClick={() => setShowDatePicker(false)}
                        variant="primary"
                        size="sm"
                        className="text-[11px]"
                      >
                        Done
                      </Button>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="relative" style={{ zIndex: showPriorityMenu ? 10001 : 'auto' }}>
                <Button
                  ref={priorityButtonRef}
                  type="button"
                  variant="ghost"
                  size="icon"
                  className={`p-1 ${
                    priority === 'high' 
                      ? 'text-error' 
                      : priority === 'medium' 
                        ? 'text-warning' 
                        : priority === 'low'
                          ? 'text-info'
                          : 'text-secondary'
                  }`}
                  aria-label="Set priority"
                  onClick={() => {
                    setShowPriorityMenu(!showPriorityMenu);
                    setShowDatePicker(false);
                  }}
                >
                  <Flag size={16} />
                </Button>
                
                {showPriorityMenu && (
                  <div className="inline-priority-menu absolute right-0 top-8 bg-white rounded-lg shadow-lg border border-gray-200 py-1" style={{ minWidth: '140px', zIndex: 10002 }}>
                    {[
                      { value: 'high', label: 'High', color: 'text-red-500' },
                      { value: 'medium', label: 'Medium', color: 'text-orange-500' },
                      { value: 'low', label: 'Low', color: 'text-sky-600' }
                    ].map(option => (
                      <Button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setPriority(option.value as typeof priority);
                          setShowPriorityMenu(false);
                        }}
                        variant="ghost"
                        className={`w-full justify-start asana-text-sm ${
                          priority === option.value ? 'bg-tertiary' : ''
                        }`}
                      >
                        <Flag size={14} className={option.color} />
                        <span className={option.color}>{option.label}</span>
                      </Button>
                    ))}
                    <div className="border-t border-gray-200 mt-1 pt-1">
                      <Button
                        type="button"
                        onClick={() => {
                          setPriority('none');
                          setShowPriorityMenu(false);
                        }}
                        variant="ghost"
                        className="w-full justify-start asana-text-sm"
                      >
                        <span className="w-[14px]"></span>
                        <span>None</span>
                      </Button>
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
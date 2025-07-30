import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, Flag } from 'lucide-react';
import '../../styles/asana-design-system.css';

interface InlineTaskCreatorProps {
  columnId: string;
  onSubmit: (data: { 
    title: string; 
    notes?: string; 
    due?: string;
    priority?: 'low' | 'normal' | 'high' | 'urgent';
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
  
  const titleInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const handleSubmit = useCallback(async () => {
    if (!title.trim() || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit({ 
        title: title.trim(),
      });
      setTitle('');
      setIsExpanded(false);
    } catch (error) {
      console.error('Failed to create task:', error);
    } finally {
      setIsSubmitting(false);
    }
  }, [title, isSubmitting, onSubmit]);

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
      style={{ marginBottom: '6px' }}
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
        <div className="mt-2 flex items-center justify-between pl-6">
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
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Set due date"
            >
              <Calendar size={16} />
            </button>
            <button
              type="button"
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Set priority"
            >
              <Flag size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Calendar, Flag, Tag, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

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
  const [due, setDue] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [labels, setLabels] = useState<string[]>([]);
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
        due: due || undefined,
        priority: priority !== 'normal' ? priority : undefined,
        labels: labels.length > 0 ? labels : undefined,
      });
      // Keep composer open and clear input (Asana behavior)
      setTitle('');
      setDue('');
      setPriority('normal');
      setLabels([]);
      titleInputRef.current?.focus();
    } catch (error) {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  }, [title, due, priority, labels, isSubmitting, onSubmit]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape' && !title.trim()) {
      onCancel();
    }
  }, [handleSubmit, onCancel, title]);

  return (
    <div 
      ref={containerRef}
      className="rounded-[10px] border border-neutral-200 bg-white p-2.5 inline-task-creator"
    >
      <div className="">
        
        <div className="">
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
            className="w-full border-0 p-0 text-[14px] leading-[20px] text-neutral-900 placeholder-neutral-500 outline-none"
            disabled={isSubmitting}
          />
          
          {/* Expanded controls */}
          {isExpanded && (
            <div className="mt-2 flex items-center gap-2 flex-wrap">
              {/* Due date */}
              <button
                type="button"
                onClick={() => {
                  // In a real implementation, this would open a date picker
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  setDue(tomorrow.toISOString().split('T')[0]);
                }}
                className={`h-7 px-2.5 rounded-full border text-[12px] transition-colors flex items-center gap-1 ${
                  due 
                    ? 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100' 
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
                aria-label="Set due date"
              >
                <Calendar size={11} />
                {due ? format(new Date(due), 'MMM d') : 'Due date'}
              </button>
              
              {/* Priority pill */}
              <button
                type="button"
                className={`h-7 px-2.5 rounded-full border text-[12px] transition-colors flex items-center gap-1 ${
                  priority !== 'normal'
                    ? 'border-orange-200 bg-orange-50 text-orange-700 hover:bg-orange-100'
                    : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                }`}
              >
                <Flag size={11} />
                {priority === 'normal' ? 'Priority' : priority.charAt(0).toUpperCase() + priority.slice(1)}
              </button>
              
              {/* Labels pill */}
              <button
                type="button"
                className="h-7 px-2.5 rounded-full border border-neutral-200 text-[12px] text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-1"
              >
                <Tag size={11} />
                <span>Labels</span>
              </button>
              
              {/* Recurring pill */}
              <button
                type="button"
                className="h-7 px-2.5 rounded-full border border-neutral-200 text-[12px] text-neutral-600 hover:bg-neutral-50 transition-colors flex items-center gap-1"
              >
                <RotateCcw size={11} />
                <span>Recurring</span>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Action buttons - hidden for cleaner look */}
    </div>
  );
};
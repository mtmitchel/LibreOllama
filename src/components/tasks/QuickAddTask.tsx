import React, { useState, useRef, useEffect } from 'react';
import { Plus, Calendar, Flag, Tag } from 'lucide-react';
import { Button } from '../ui';
import { Input } from '../ui';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { useCreateTask } from '../../hooks/useGoogleTasks';
import { useUpdateTaskMetadata } from '../../hooks/useGoogleTasks';
import type { TaskMetadata } from '../../stores/useTaskMetadataStore';

interface QuickAddTaskProps {
  taskListId: string;
  allLabels: string[];
}

export const QuickAddTask: React.FC<QuickAddTaskProps> = ({
  taskListId,
  allLabels,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<TaskMetadata['priority']>('normal');
  const [labels, setLabels] = useState<string[]>([]);
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  const createTask = useCreateTask();
  const { setMetadata } = useUpdateTaskMetadata();
  const inputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) return;
    
    const result = await createTask.mutateAsync({
      tasklistId: taskListId,
      task: {
        title: title.trim(),
        due: dueDate ? new Date(dueDate).toISOString() : undefined,
        status: 'needsAction',
      },
    });
    
    // Set metadata if any
    if (result.task.id && (labels.length > 0 || priority !== 'normal')) {
      setMetadata(result.task.id, {
        labels,
        priority,
      });
    }
    
    // Reset form
    setTitle('');
    setDueDate('');
    setPriority('normal');
    setLabels([]);
    setShowAdvanced(false);
    setIsOpen(false);
  };
  
  const handleAddLabel = (label: string) => {
    if (label && !labels.includes(label)) {
      setLabels([...labels, label]);
    }
  };
  
  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter(l => l !== label));
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button className="w-full justify-start" variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="start">
        <form onSubmit={handleSubmit} className="p-4 space-y-3">
          <Input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Task title"
            className="font-medium"
          />
          
          {!showAdvanced && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(true)}
              className="text-xs"
            >
              Add details...
            </Button>
          )}
          
          {showAdvanced && (
            <>
              {/* Due Date */}
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-gray-500" />
                <Input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1"
                />
              </div>
              
              {/* Priority */}
              <div className="flex items-center gap-2">
                <Flag className="h-4 w-4 text-gray-500" />
                <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {/* Labels */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Tag className="h-4 w-4 text-gray-500" />
                  <Input
                    placeholder="Add labels"
                    list="quick-add-labels"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const input = e.target as HTMLInputElement;
                        handleAddLabel(input.value);
                        input.value = '';
                      }
                    }}
                  />
                  <datalist id="quick-add-labels">
                    {allLabels.map((label) => (
                      <option key={label} value={label} />
                    ))}
                  </datalist>
                </div>
                {labels.length > 0 && (
                  <div className="flex flex-wrap gap-1 pl-6">
                    {labels.map((label) => (
                      <Badge
                        key={label}
                        variant="secondary"
                        className="text-xs cursor-pointer"
                        onClick={() => handleRemoveLabel(label)}
                      >
                        {label} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm">
              Add Task
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
import React, { useState, useEffect } from 'react';
import { X, Calendar, Flag, Tag, CheckSquare, Plus, Trash2 } from 'lucide-react';
import { Button } from '../ui';
import { Input } from '../ui';
import { Textarea } from '../ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Badge } from '../ui/badge';
import type { tasks_v1 } from '../../api/googleTasksApi';
import { useUnifiedTaskStore } from '../../stores/unifiedTaskStore';
import { cn } from '../../lib/utils';

interface TaskDetailPanelProps {
  task: tasks_v1.Schema$Task;
  taskListId: string;
  isOpen: boolean;
  onClose: () => void;
  allLabels: string[];
}

export const TaskDetailPanel: React.FC<TaskDetailPanelProps> = ({
  task,
  taskListId,
  isOpen,
  onClose,
  allLabels,
}) => {
  const { updateTask, deleteTask, tasks, getTaskByGoogleId } = useUnifiedTaskStore();
  
  // Get the unified task - try by Google ID first, then local ID
  const unifiedTask = getTaskByGoogleId(task.id!) || tasks[task.id!];
  const taskId = unifiedTask?.id || task.id!;
  
  const metadata = {
    labels: unifiedTask?.labels || [],
    priority: unifiedTask?.priority || 'normal' as const,
    subtasks: unifiedTask?.attachments?.filter(a => a.type === 'subtask').map(a => ({
      id: a.name,
      title: a.name,
      completed: a.url === 'completed',
      due: ''
    })) || []
  };
  
  const [title, setTitle] = useState(task.title || '');
  const [notes, setNotes] = useState(task.notes || '');
  const [dueDate, setDueDate] = useState(task.due ? task.due.split('T')[0] : '');
  const [newLabel, setNewLabel] = useState('');
  const [newSubtask, setNewSubtask] = useState('');
  
  useEffect(() => {
    setTitle(task.title || '');
    setNotes(task.notes || '');
    setDueDate(task.due ? task.due.split('T')[0] : '');
  }, [task]);
  
  const handleSave = async () => {
    try {
      console.log('Saving task with date:', dueDate);
      updateTask(taskId, {
        title,
        notes,
        due: dueDate ? new Date(dueDate + 'T00:00:00Z').toISOString() : undefined,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save task:', error);
    }
  };
  
  const handleDelete = async () => {
    try {
      deleteTask(taskId);
      onClose();
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  };
  
  const handleAddLabel = () => {
    if (newLabel.trim()) {
      console.log('Adding label:', newLabel.trim(), 'to task:', taskId);
      updateTask(taskId, {
        labels: [...metadata.labels, { name: newLabel.trim(), color: 'gray' as const }]
      });
      setNewLabel('');
    }
  };
  
  const handleAddSubtask = () => {
    if (newSubtask.trim()) {
      const currentAttachments = unifiedTask?.attachments || [];
      updateTask(taskId, {
        attachments: [...currentAttachments, {
          name: newSubtask.trim(),
          url: 'pending',
          type: 'subtask'
        }]
      });
      setNewSubtask('');
    }
  };
  
  const handleToggleComplete = async () => {
    try {
      updateTask(taskId, {
        status: task.status === 'completed' ? 'needsAction' : 'completed'
      });
    } catch (error) {
      console.error('Failed to toggle task:', error);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Task details</span>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Title and Status */}
          <div className="space-y-2">
            <div className="flex items-start gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleToggleComplete}
                className={cn(
                  "mt-1",
                  task.status === 'completed' && "text-green-600"
                )}
              >
                <CheckSquare className="h-5 w-5" />
              </Button>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                className="text-lg font-medium"
                placeholder="Task title"
              />
            </div>
          </div>
          
          {/* Due Date */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Calendar className="h-4 w-4" />
              Due date
            </label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              onBlur={handleSave}
            />
          </div>
          
          {/* Priority */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <Flag className="h-4 w-4" />
              Priority
            </label>
            <Select
              value={metadata.priority}
              onValueChange={(value) => {
                updateTask(taskId, {
                  priority: (value === 'normal' ? 'none' : value === 'urgent' ? 'high' : value) as 'high' | 'medium' | 'low' | 'none'
                });
              }}
            >
              <SelectTrigger>
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
            <label className="flex items-center gap-2 text-sm font-medium">
              <Tag className="h-4 w-4" />
              Labels
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {metadata.labels.map((label, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="cursor-pointer"
                  onClick={() => {
                    updateTask(taskId, {
                      labels: metadata.labels.filter(l => l !== label)
                    });
                  }}
                >
                  {typeof label === 'string' ? label : label.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddLabel()}
                placeholder="Add a label"
                list="existing-labels"
              />
              <datalist id="existing-labels">
                {allLabels.map((label) => (
                  <option key={label} value={label} />
                ))}
              </datalist>
              <Button onClick={handleAddLabel} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={handleSave}
              rows={4}
              placeholder="Add notes..."
            />
          </div>
          
          {/* Subtasks */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium">
              <CheckSquare className="h-4 w-4" />
              Subtasks
            </label>
            <div className="space-y-2">
              {metadata.subtasks?.map((subtask) => (
                <div key={subtask.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={(e) => {
                      const attachments = unifiedTask?.attachments || [];
                      updateTask(taskId, {
                        attachments: attachments.map(a => 
                          a.type === 'subtask' && a.name === subtask.title
                            ? { ...a, url: e.target.checked ? 'completed' : 'pending' }
                            : a
                        )
                      });
                    }}
                    className="rounded"
                  />
                  <span className={cn(
                    "flex-1",
                    subtask.completed && "line-through text-gray-500"
                  )}>
                    {subtask.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const attachments = unifiedTask?.attachments || [];
                      updateTask(taskId, {
                        attachments: attachments.filter(a => 
                          !(a.type === 'subtask' && a.name === subtask.title)
                        )
                      });
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newSubtask}
                onChange={(e) => setNewSubtask(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
                placeholder="Add a subtask"
              />
              <Button onClick={handleAddSubtask} size="sm">
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="destructive"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete task
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
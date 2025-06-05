import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult, DroppableProvided, DroppableStateSnapshot, DraggableProvided, DraggableStateSnapshot } from '@hello-pangea/dnd';
import { Plus, Filter, Zap, Clock, Moon, ChevronDown, ChevronRight, MoreHorizontal, Timer, Target, Brain, Calendar, ExternalLink, User, List, Kanban } from 'lucide-react';
import { useDraggable, useDragState } from '../../hooks/use-drag-drop';
import { DragDataFactory } from '../../lib/drag-drop-system';
import { useAutoSaveBatch } from '../../hooks/use-auto-save';
import { SaveStatusBadge } from '../ui/save-status-indicator';
import EnhancedContentStrategy from '../../lib/content-strategy-enhanced';

// V2 Components
import { Button } from '../ui/button-v2';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card-v2';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input-v2';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { UniversalContextMenu } from '../ui/universal-context-menu';

import type { TaskItem, TaskStatus, TaskPriority, KanbanColumn, EnergyLevel } from '../../lib/types';
import { designSystemFlags } from '../../lib/design-tokens';

// ADHD-optimized task lenses
export type TaskLens = 'all' | 'now' | 'energy' | 'quick-wins' | 'focus-session';

interface TaskLensConfig {
  id: TaskLens;
  name: string;
  description: string;
  icon: React.ReactNode;
  filter: (task: TaskItem, userEnergyLevel?: EnergyLevel) => boolean;
}

interface KanbanBoardProps {
  className?: string;
  focusMode?: boolean;
  enableAutoSave?: boolean;
  onTasksChange?: (tasks: TaskItem[]) => void;
}

// V2 Priority indicators with color-coded dots
const PRIORITY_INDICATORS = {
  high: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-950/20',
    border: 'border-red-200 dark:border-red-800',
    text: 'text-red-700 dark:text-red-300'
  },
  medium: {
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/20',
    border: 'border-yellow-200 dark:border-yellow-800',
    text: 'text-yellow-700 dark:text-yellow-300'
  },
  low: {
    dot: 'bg-green-500',
    bg: 'bg-green-50 dark:bg-green-950/20',
    border: 'border-green-200 dark:border-green-800',
    text: 'text-green-700 dark:text-green-300'
  }
};

// V2 Energy level indicators
const ENERGY_INDICATORS = {
  high: {
    icon: <Zap className="h-3 w-3 text-yellow-500" />,
    color: 'text-yellow-500'
  },
  medium: {
    icon: <Clock className="h-3 w-3 text-blue-500" />,
    color: 'text-blue-500'
  },
  low: {
    icon: <Moon className="h-3 w-3 text-purple-500" />,
    color: 'text-purple-500'
  }
};

export function KanbanBoard({
  className = '',
  focusMode = false,
  enableAutoSave = true,
  onTasksChange
}: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [columns, setColumns] = useState<KanbanColumn[]>([
    { id: 'todo', title: 'To Do', tasks: [] },
    { id: 'inprogress', title: 'In Progress', tasks: [] },
    { id: 'done', title: 'Done', tasks: [] }
  ]);
  const [activeLens, setActiveLens] = useState<TaskLens>('all');
  const [userEnergyLevel, setUserEnergyLevel] = useState<EnergyLevel>('medium');
  const [collapsedColumns, setCollapsedColumns] = useState<Set<string>>(new Set());
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [newTaskColumn, setNewTaskColumn] = useState<TaskStatus>('todo');
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');

  // Auto-save batch for task operations
  const taskAutoSave = useAutoSaveBatch<TaskItem>(
    'task',
    async (taskUpdates) => {
      // Simulate saving tasks to backend
      if (onTasksChange) {
        const updatedTasks = [...tasks];
        taskUpdates.forEach(({ id, data }) => {
          const index = updatedTasks.findIndex(t => t.id === id);
          if (index >= 0) {
            updatedTasks[index] = data;
          } else {
            updatedTasks.push(data);
          }
        });
        onTasksChange(updatedTasks);
      }
      return true;
    },
    {
      debounceMs: 300,
      maxBatchSize: 5,
      onSaveSuccess: (items) => {
        console.log(`Auto-saved ${items.length} tasks`);
      },
      onSaveError: (error, items) => {
        console.error('Failed to auto-save tasks:', error, items.length);
      }
    }
  );

  // Task lenses configuration
  const taskLenses: TaskLensConfig[] = [
    {
      id: 'all',
      name: 'All Tasks',
      description: 'Show all tasks',
      icon: <Target className="h-4 w-4" />,
      filter: () => true
    },
    {
      id: 'now',
      name: 'Now',
      description: 'Overdue and high-priority tasks',
      icon: <Zap className="h-4 w-4 text-red-500" />,
      filter: (task) => task.isOverdue || task.priority === 'high'
    },
    {
      id: 'energy',
      name: "Today's Energy",
      description: 'Tasks matching your current energy level',
      icon: ENERGY_INDICATORS.medium.icon,
      filter: (task, energyLevel) => task.energyLevel === energyLevel
    },
    {
      id: 'quick-wins',
      name: 'Quick Wins',
      description: 'Tasks under 15 minutes',
      icon: <Timer className="h-4 w-4 text-green-500" />,
      filter: (task) => (task.estimatedMinutes || 0) <= 15
    },
    {
      id: 'focus-session',
      name: 'Focus Session',
      description: 'Tasks suitable for deep work',
      icon: <Brain className="h-4 w-4 text-purple-500" />,
      filter: (task) => (task.estimatedMinutes || 0) >= 25 && task.priority !== 'low'
    }
  ];

  // Initialize with sample data
  useEffect(() => {
    const sampleTasks: TaskItem[] = [
      {
        id: '1',
        title: 'Review project proposal',
        description: 'Go through the Q1 project proposal and provide feedback',
        status: 'todo',
        priority: 'high',
        energyLevel: 'high',
        estimatedMinutes: 45,
        isOverdue: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['work', 'review'],
        contextTags: ['focus-required']
      },
      {
        id: '2',
        title: 'Update documentation',
        description: 'Fix typos in the API documentation',
        status: 'todo',
        priority: 'medium',
        energyLevel: 'low',
        estimatedMinutes: 10,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['docs'],
        contextTags: ['quick-task']
      },
      {
        id: '3',
        title: 'Implement new feature',
        description: 'Add the new dashboard widget functionality',
        status: 'inprogress',
        priority: 'high',
        energyLevel: 'high',
        estimatedMinutes: 120,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['development', 'feature'],
        contextTags: ['deep-work']
      },
      {
        id: '4',
        title: 'Design system updates',
        description: 'Update components to match new design tokens',
        status: 'inprogress',
        priority: 'medium',
        energyLevel: 'medium',
        estimatedMinutes: 90,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['design', 'ui'],
        contextTags: ['creative-work']
      },
      {
        id: '5',
        title: 'Code review',
        description: 'Review pull requests from team members',
        status: 'done',
        priority: 'low',
        energyLevel: 'medium',
        estimatedMinutes: 30,
        isOverdue: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        tags: ['review', 'team'],
        contextTags: ['collaboration']
      }
    ];
    
    setTasks(sampleTasks);
    updateColumns(sampleTasks);
  }, []);

  const updateColumns = useCallback((taskList: TaskItem[]) => {
    const filteredTasks = taskList.filter(task => {
      const lens = taskLenses.find(l => l.id === activeLens);
      return lens ? lens.filter(task, userEnergyLevel) : true;
    });

    setColumns([
      { id: 'todo', title: 'To Do', tasks: filteredTasks.filter(t => t.status === 'todo') },
      { id: 'inprogress', title: 'In Progress', tasks: filteredTasks.filter(t => t.status === 'inprogress') },
      { id: 'done', title: 'Done', tasks: filteredTasks.filter(t => t.status === 'done') }
    ]);
  }, [activeLens, userEnergyLevel, taskLenses]);

  useEffect(() => {
    updateColumns(tasks);
  }, [tasks, updateColumns]);

  const handleDragEnd = (result: DropResult) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const newStatus = destination.droppableId as TaskStatus;
    
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task => {
        if (task.id === draggableId) {
          const updatedTask = { ...task, status: newStatus, updatedAt: new Date().toISOString() };
          
          // Trigger auto-save for the updated task
          if (enableAutoSave) {
            taskAutoSave.addToBatch(task.id, updatedTask);
          }
          
          return updatedTask;
        }
        return task;
      });
      
      return updatedTasks;
    });
  };

  const toggleColumnCollapse = (columnId: string) => {
    setCollapsedColumns(prev => {
      const newSet = new Set(prev);
      if (newSet.has(columnId)) {
        newSet.delete(columnId);
      } else {
        newSet.add(columnId);
      }
      return newSet;
    });
  };

  const createTask = async (taskData: Partial<TaskItem>) => {
    const newTask: TaskItem = {
      id: `task-${Date.now()}`,
      title: taskData.title || 'New Task',
      description: taskData.description || '',
      status: newTaskColumn,
      priority: taskData.priority || 'medium',
      energyLevel: taskData.energyLevel || 'medium',
      estimatedMinutes: taskData.estimatedMinutes || 30,
      isOverdue: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: taskData.tags || [],
      contextTags: taskData.contextTags || []
    };

    setTasks(prev => [...prev, newTask]);
    setIsCreatingTask(false);
    
    // Trigger auto-save for the new task
    if (enableAutoSave) {
      taskAutoSave.addToBatch(newTask.id, newTask);
    }
  };

  const generateSubtasks = async (taskId: string) => {
    setLoading(true);
    try {
      // Simulate AI-powered task decomposition
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const mockSubtasks: TaskItem[] = [
        {
          id: `${taskId}-sub-1`,
          title: `Research for: ${task.title}`,
          description: 'Gather necessary information and resources',
          status: 'todo',
          priority: 'medium',
          energyLevel: 'medium',
          estimatedMinutes: 15,
          isOverdue: false,
          parentId: taskId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [...(task.tags || []), 'subtask'],
          contextTags: ['research']
        },
        {
          id: `${taskId}-sub-2`,
          title: `Execute: ${task.title}`,
          description: 'Complete the main work',
          status: 'todo',
          priority: task.priority,
          energyLevel: task.energyLevel,
          estimatedMinutes: Math.max((task.estimatedMinutes || 30) - 15, 10),
          isOverdue: false,
          parentId: taskId,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [...(task.tags || []), 'subtask'],
          contextTags: ['execution']
        }
      ];

      const newTasks = [...tasks, ...mockSubtasks];
      setTasks(newTasks);
      
      // Trigger auto-save for the new subtasks
      if (enableAutoSave) {
        mockSubtasks.forEach(subtask => {
          taskAutoSave.addToBatch(subtask.id, subtask);
        });
      }
    } catch (error) {
      console.error('Error generating subtasks:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle contextual actions from text selection
  const handleContextualAction = async (actionId: string, context: any) => {
    switch (actionId) {
      case 'convert-to-task':
        // Create task from selected text
        const newTask: TaskItem = {
          id: `task-${Date.now()}`,
          title: context.selectedText.slice(0, 100) + (context.selectedText.length > 100 ? '...' : ''),
          description: context.selectedText,
          status: 'todo',
          priority: 'medium',
          energyLevel: 'medium',
          estimatedMinutes: 30,
          isOverdue: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['from-selection'],
          contextTags: ['quick-add']
        };
        setTasks(prev => [...prev, newTask]);
        
        // Trigger auto-save for the new task
        if (enableAutoSave) {
          taskAutoSave.addToBatch(newTask.id, newTask);
        }
        break;
      case 'send-to-chat':
        // Navigate to chat with selected text
        console.log('Sending to chat:', context.selectedText);
        break;
      case 'expand-with-ai':
        // Use AI to expand task details
        console.log('Expanding with AI:', context.selectedText);
        break;
      default:
        console.log('Unhandled action:', actionId);
    }
  };

  // Generate assignee initials from task title (mock implementation)
  const getAssigneeInitials = (task: TaskItem): string => {
    // Mock assignee based on task type
    const assignees = ['JD', 'AS', 'MK', 'RB', 'LT'];
    const index = task.title.length % assignees.length;
    return assignees[index];
  };

  // V2 Enhanced Task Card Component
  const TaskCard = ({ task, index }: { task: TaskItem; index: number }) => {
    const priorityConfig = task.priority ? PRIORITY_INDICATORS[task.priority] : null;
    const energyConfig = task.energyLevel ? ENERGY_INDICATORS[task.energyLevel] : null;
    const assigneeInitials = getAssigneeInitials(task);

    // External drag-and-drop for cross-module operations
    const { ref: externalDragRef, isDragging: isExternalDragging } = useDraggable(
      () => DragDataFactory.fromTask(task, 'kanban-board'),
      {
        feedback: { opacity: 0.7, cursor: 'grabbing' },
        onDragStart: () => console.log('External drag started for task:', task.title),
        onDragEnd: (success) => console.log('External drag ended:', success)
      }
    );

    return (
      <Draggable draggableId={task.id} index={index}>
        {(provided: DraggableProvided, snapshot: DraggableStateSnapshot) => (
          <Card
            ref={(el) => {
              provided.innerRef(el);
              if (el) (externalDragRef as any).current = el;
            }}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            variant="interactive"
            useV2={designSystemFlags.useV2Components}
            className={`mb-3 cursor-move transition-all group relative overflow-hidden ${
              snapshot.isDragging ? 'shadow-xl rotate-1 scale-105 z-50' : 'hover:shadow-md hover:-translate-y-0.5'
            } ${isExternalDragging ? 'opacity-70' : ''} ${
              task.isOverdue ? 'border-red-500/50 bg-red-950/10' : ''
            }`}
          >
            <CardContent className="p-4">
              {/* Header with title and actions */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm leading-tight text-white mb-2 line-clamp-2">
                    {task.title}
                  </h4>
                  
                  {/* Priority and metadata row */}
                  <div className="flex items-center gap-2 mb-2">
                    {/* Priority dot */}
                    {priorityConfig && (
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${priorityConfig.dot}`} />
                        <span className="text-xs text-slate-400 capitalize">{task.priority}</span>
                      </div>
                    )}
                    
                    {/* Energy level */}
                    {energyConfig && (
                      <div className="flex items-center gap-1">
                        {energyConfig.icon}
                      </div>
                    )}
                    
                    {/* Estimated time */}
                    {task.estimatedMinutes && (
                      <div className="flex items-center gap-1 text-slate-400">
                        <Timer className="h-3 w-3" />
                        <span className="text-xs">{task.estimatedMinutes}m</span>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Assignee avatar */}
                <div className="flex items-center gap-2 ml-2">
                  <div className="w-6 h-6 rounded-full bg-accent-primary flex items-center justify-center">
                    <span className="text-xs font-medium text-white">{assigneeInitials}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity text-slate-400 hover:text-white"
                      >
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-bg-secondary border-bg-tertiary">
                      <DropdownMenuItem onClick={() => generateSubtasks(task.id)} className="text-white hover:bg-bg-tertiary">
                        <Brain className="h-4 w-4 mr-2" />
                        Generate Subtasks
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-bg-tertiary">
                        <Calendar className="h-4 w-4 mr-2" />
                        Schedule Task
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-white hover:bg-bg-tertiary">Edit Task</DropdownMenuItem>
                      <DropdownMenuItem className="text-red-400 hover:bg-bg-tertiary">Delete Task</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
              
              {/* Description */}
              {task.description && (
                <p className="text-xs text-slate-300 mb-3 line-clamp-2 leading-relaxed">
                  {task.description}
                </p>
              )}

              {/* Due date */}
              {task.dueDate && (
                <div className="flex items-center gap-1 text-xs text-slate-400 mb-2">
                  <Calendar className="h-3 w-3" />
                  <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Tags */}
              {task.tags && task.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-2">
                  {task.tags.slice(0, 2).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-slate-300 border-bg-quaternary">
                      {tag}
                    </Badge>
                  ))}
                  {task.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-bg-tertiary text-slate-300 border-bg-quaternary">
                      +{task.tags.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              {/* Subtask progress */}
              {tasks.filter(t => t.parentId === task.id).length > 0 && (
                <div className="mt-2 pt-2 border-t border-bg-tertiary">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Subtasks</span>
                    <span className="font-medium text-white">
                      {tasks.filter(t => t.parentId === task.id && t.status === 'done').length}/
                      {tasks.filter(t => t.parentId === task.id).length}
                    </span>
                  </div>
                  <div className="w-full bg-bg-tertiary rounded-full h-1.5 mt-1">
                    <div
                      className="bg-accent-primary h-1.5 rounded-full transition-all duration-300"
                      style={{
                        width: `${(tasks.filter(t => t.parentId === task.id && t.status === 'done').length /
                                Math.max(tasks.filter(t => t.parentId === task.id).length, 1)) * 100}%`
                      }}
                    />
                  </div>
                </div>
              )}

              {/* Overdue indicator */}
              {task.isOverdue && (
                <div className="absolute top-2 left-2">
                  <Badge variant="destructive" className="text-xs bg-red-500 text-white">
                    Overdue
                  </Badge>
                </div>
              )}
              
              {/* External drag indicator */}
              {isExternalDragging && (
                <div className="absolute top-2 right-2 opacity-75">
                  <ExternalLink className="h-3 w-3 text-accent-primary" />
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </Draggable>
    );
  };

  const CreateTaskDialog = () => (
    <Dialog open={isCreatingTask} onOpenChange={setIsCreatingTask}>
      <DialogContent className="bg-bg-secondary border-bg-tertiary">
        <DialogHeader>
          <DialogTitle className="text-white">Create New Task</DialogTitle>
        </DialogHeader>
        <TaskForm onSubmit={createTask} onCancel={() => setIsCreatingTask(false)} />
      </DialogContent>
    </Dialog>
  );

  const TaskForm = ({ onSubmit, onCancel }: { onSubmit: (data: Partial<TaskItem>) => void; onCancel: () => void }) => {
    const [formData, setFormData] = useState<Partial<TaskItem>>({
      title: '',
      description: '',
      priority: 'medium',
      energyLevel: 'medium',
      estimatedMinutes: 30
    });

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSubmit(formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder={EnhancedContentStrategy.getPlaceholderText('task-title')}
          value={formData.title || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
          required
          useV2={true}
          className="bg-bg-tertiary border-bg-quaternary text-white"
        />
        <Textarea
          placeholder={EnhancedContentStrategy.getPlaceholderText('task-description')}
          value={formData.description || ''}
          onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
          className="bg-bg-tertiary border-bg-quaternary text-white"
        />
        <div className="grid grid-cols-3 gap-3">
          <Select value={formData.priority} onValueChange={(value: TaskPriority) => setFormData(prev => ({ ...prev, priority: value }))}>
            <SelectTrigger className="bg-bg-tertiary border-bg-quaternary text-white">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-bg-tertiary">
              <SelectItem value="low" className="text-white hover:bg-bg-tertiary">Low</SelectItem>
              <SelectItem value="medium" className="text-white hover:bg-bg-tertiary">Medium</SelectItem>
              <SelectItem value="high" className="text-white hover:bg-bg-tertiary">High</SelectItem>
            </SelectContent>
          </Select>
          <Select value={formData.energyLevel} onValueChange={(value: EnergyLevel) => setFormData(prev => ({ ...prev, energyLevel: value }))}>
            <SelectTrigger className="bg-bg-tertiary border-bg-quaternary text-white">
              <SelectValue placeholder="Energy" />
            </SelectTrigger>
            <SelectContent className="bg-bg-secondary border-bg-tertiary">
              <SelectItem value="low" className="text-white hover:bg-bg-tertiary">Low Energy</SelectItem>
              <SelectItem value="medium" className="text-white hover:bg-bg-tertiary">Medium Energy</SelectItem>
              <SelectItem value="high" className="text-white hover:bg-bg-tertiary">High Energy</SelectItem>
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Minutes"
            value={formData.estimatedMinutes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, estimatedMinutes: parseInt(e.target.value) || 30 }))}
            useV2={true}
            className="bg-bg-tertiary border-bg-quaternary text-white"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="tertiary" onClick={onCancel} useV2={true}>
            {EnhancedContentStrategy.getEnhancedButtonText('cancel-action')}
          </Button>
          <Button variant="primary" type="submit" useV2={true}>
            {EnhancedContentStrategy.getEnhancedButtonText('create-task')}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <UniversalContextMenu
      contentType="task"
      contentId="kanban-board"
      onAction={handleContextualAction}
      className={`h-full flex flex-col ${className}`}
    >
      {/* V2 Enhanced Header */}
      {!focusMode && (
        <div className="p-6 border-b border-bg-tertiary bg-bg-primary">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-white">Tasks</h1>
              {enableAutoSave && (
                <SaveStatusBadge
                  status={{
                    status: taskAutoSave.isSaving ? 'saving' :
                            taskAutoSave.hasError ? 'error' : 'saved',
                    lastSaved: new Date(),
                    lastAttempted: new Date(),
                    retryCount: 0,
                    isOnline: true,
                    error: taskAutoSave.lastError || undefined
                  }}
                  onRetry={taskAutoSave.flushBatch}
                />
              )}
            </div>
            
            <div className="flex items-center gap-3">
              {/* View Toggle */}
              <div className="flex items-center bg-bg-secondary rounded-lg p-1">
                <Button
                  variant={viewMode === 'kanban' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('kanban')}
                  useV2={true}
                  className="h-8 px-3"
                >
                  <Kanban className="h-4 w-4 mr-1" />
                  Kanban
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  useV2={true}
                  className="h-8 px-3"
                >
                  <List className="h-4 w-4 mr-1" />
                  List
                </Button>
              </div>

              {/* Energy Level Selector */}
              <Select value={userEnergyLevel} onValueChange={(value: EnergyLevel) => setUserEnergyLevel(value)}>
                <SelectTrigger className="w-40 bg-bg-secondary border-bg-tertiary text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-bg-secondary border-bg-tertiary">
                  <SelectItem value="high" className="text-white hover:bg-bg-tertiary">High Energy</SelectItem>
                  <SelectItem value="medium" className="text-white hover:bg-bg-tertiary">Medium Energy</SelectItem>
                  <SelectItem value="low" className="text-white hover:bg-bg-tertiary">Low Energy</SelectItem>
                </SelectContent>
              </Select>

              {/* New Task Button */}
              <Button
                variant="primary"
                onClick={() => setIsCreatingTask(true)}
                useV2={true}
                className="bg-accent-primary hover:bg-accent-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Task
              </Button>
            </div>
          </div>

          {/* Task Lenses */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {taskLenses.map(lens => (
              <Button
                key={lens.id}
                variant={activeLens === lens.id ? 'primary' : 'tertiary'}
                size="sm"
                onClick={() => setActiveLens(lens.id)}
                useV2={true}
                className="flex items-center gap-2 whitespace-nowrap"
              >
                {lens.icon}
                {lens.name}
              </Button>
            ))}
          </div>
          
          {activeLens !== 'all' && (
            <p className="text-sm text-slate-400 mt-2">
              {taskLenses.find(l => l.id === activeLens)?.description}
            </p>
          )}
        </div>
      )}

      {/* V2 Enhanced Kanban Board */}
      <div className="flex-1 overflow-hidden">
        <DragDropContext onDragEnd={handleDragEnd}>
          <div className="h-full flex gap-6 p-6 overflow-x-auto">
            {columns.map(column => (
              <div key={column.id} className="flex-shrink-0 w-80">
                <Card
                  variant="default"
                  useV2={designSystemFlags.useV2Components}
                  className="h-full flex flex-col bg-bg-secondary border-bg-tertiary"
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-medium flex items-center gap-3 text-white">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleColumnCollapse(column.id)}
                          className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                        >
                          {collapsedColumns.has(column.id) ?
                            <ChevronRight className="h-4 w-4" /> :
                            <ChevronDown className="h-4 w-4" />
                          }
                        </Button>
                        {column.title}
                        <Badge
                          variant="secondary"
                          className="text-xs bg-bg-tertiary text-slate-300 border-bg-quaternary"
                        >
                          {column.tasks.length}
                        </Badge>
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setNewTaskColumn(column.id);
                          setIsCreatingTask(true);
                        }}
                        className="h-8 w-8 p-0 text-slate-400 hover:text-white hover:bg-bg-tertiary"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  
                  {!collapsedColumns.has(column.id) && (
                    <CardContent className="flex-1 pt-0 pb-4">
                      <Droppable droppableId={column.id}>
                        {(provided: DroppableProvided, snapshot: DroppableStateSnapshot) => (
                          <ScrollArea
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`h-full pr-2 ${
                              snapshot.isDraggingOver ? 'bg-bg-tertiary/50 rounded-lg' : ''
                            }`}
                          >
                            <div className="space-y-3 min-h-[200px]">
                              {column.tasks.map((task, index) => (
                                <TaskCard key={task.id} task={task} index={index} />
                              ))}
                              {provided.placeholder}
                              
                              {/* Add Task Button at bottom of column */}
                              {column.tasks.length === 0 && (
                                <div className="flex items-center justify-center h-32 border-2 border-dashed border-bg-quaternary rounded-lg">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setNewTaskColumn(column.id);
                                      setIsCreatingTask(true);
                                    }}
                                    className="text-slate-400 hover:text-white"
                                  >
                                    <Plus className="h-4 w-4 mr-2" />
                                    Add task
                                  </Button>
                                </div>
                              )}
                            </div>
                          </ScrollArea>
                        )}
                      </Droppable>
                    </CardContent>
                  )}
                </Card>
              </div>
            ))}
          </div>
        </DragDropContext>
      </div>

      <CreateTaskDialog />
    </UniversalContextMenu>
  );
}
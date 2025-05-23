
"use client";

import React, { useState } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PlusCircle, GripVertical, PanelLeftClose, Edit2, Trash2, X } from 'lucide-react'; // Added X
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { mockTaskListSources } from '@/lib/mock-data'; 
import type { CalendarTask } from '@/lib/types';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';


export default function CalendarTasksPanel() {
  const { 
    tasksForScheduling, 
    setTasksForScheduling, 
    isRightPanelOpen, 
    setIsRightPanelOpen 
  } = useCalendar();

  const [selectedTaskListSource, setSelectedTaskListSource] = useState<string>(mockTaskListSources[0]?.id || 'all');
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

  const displayTasks = tasksForScheduling.filter(task => 
    selectedTaskListSource === 'all' || task.sourceListId === selectedTaskListSource
  );

  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, task: CalendarTask) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("taskTitle", task.title);
    e.dataTransfer.setData("taskDuration", task.duration.toString());
    e.dataTransfer.setData("taskType", "calendarTask"); 
    setDraggingTaskId(task.id);
  };

  const handleTaskDragEnd = () => {
    setDraggingTaskId(null);
  };

  const toggleTaskCompletion = (taskId: string) => {
    setTasksForScheduling(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, isCompleted: !task.isCompleted } : task
      )
    );
  };

  const handleAddTask = () => alert("Add new task (not implemented)");


  return (
    <aside className={cn(
        "bg-card border-l flex-col gap-0 hidden lg:flex sticky top-0 h-screen overflow-y-auto transition-all duration-300 ease-in-out", 
        isRightPanelOpen ? "w-80 opacity-100" : "w-0 opacity-0",
        "lg:relative" 
    )}>
      <div className={cn("h-full flex flex-col", !isRightPanelOpen && "hidden")}>
        <CardHeader className="flex-row items-center justify-between p-3 border-b h-16 flex-shrink-0">
          <Select value={selectedTaskListSource} onValueChange={setSelectedTaskListSource}>
            <SelectTrigger className="h-8 text-sm flex-1 min-w-0 mr-2">
              <SelectValue placeholder="Select task list" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-sm">All lists</SelectItem>
              {mockTaskListSources.map(source => (
                <SelectItem key={source.id} value={source.id} className="text-sm">{source.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setIsRightPanelOpen(false)}>
            <X size={20} /> {/* Changed to X for consistency */}
          </Button>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="p-3 space-y-2">
            <Button variant="outline" size="sm" className="w-full mb-2" onClick={handleAddTask}>
              <PlusCircle size={16} className="mr-2"/> Add a task
            </Button>
            {displayTasks.map(task => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task)}
                onDragEnd={handleTaskDragEnd}
                className={cn(
                  "p-2.5 bg-card border rounded-md shadow-sm cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow text-sm",
                  task.id === draggingTaskId && "opacity-60 ring-2 ring-primary"
                )}
              >
                <div className="flex items-start gap-2">
                  <Checkbox 
                      id={`task-${task.id}`} 
                      checked={task.isCompleted} 
                      onCheckedChange={() => toggleTaskCompletion(task.id)}
                      className="mt-1 shrink-0"
                  />
                  <div className="flex-1 min-w-0"> {/* Ensure text truncates */}
                      <Label htmlFor={`task-${task.id}`} className={`cursor-pointer ${task.isCompleted ? 'line-through text-muted-foreground' : ''} block truncate`}>{task.title}</Label>
                      {task.dueDate && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                              {format(new Date(task.dueDate), 'MMM d')}
                              {task.isCompleted ? null : `, ${format(new Date(task.dueDate), 'HH:mm')}`}
                          </p>
                      )}
                      {task.description && <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.description}</p>}
                  </div>
                </div>
              </div>
            ))}
            {displayTasks.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-4">No tasks in selected list.</p>
            )}
          </CardContent>
        </ScrollArea>
      </div>
    </aside>
  );
}

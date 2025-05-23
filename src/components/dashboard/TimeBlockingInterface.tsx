
"use client";

import { Calendar, CheckSquare } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

// Mock Task Type
interface Task {
  id: string;
  title: string;
  duration: number; // minutes
}

// Mock Calendar Event Type
interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
}

export default function TimeBlockingInterface() {
  const [tasks, setTasks] = useState<Task[]>([
    { id: "task-1", title: "Plan weekly sprint", duration: 60 },
    { id: "task-2", title: "Code review session", duration: 90 },
    { id: "task-3", title: "Client follow-up calls", duration: 45 },
  ]);
  
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [currentDate, setCurrentDate] = useState<Date | undefined>(new Date()); // For DayPicker

  // Effect to avoid hydration errors with new Date()
  useEffect(() => {
    setCurrentDate(new Date());
  }, []);


  const handleTaskDragStart = (e: React.DragEvent<HTMLDivElement>, task: Task) => {
    e.dataTransfer.setData("taskId", task.id);
    e.dataTransfer.setData("taskDuration", task.duration.toString());
  };

  const handleDropOnCalendar = (e: React.DragEvent<HTMLDivElement>, day: string, timeSlot: string) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("taskId");
    const taskDuration = parseInt(e.dataTransfer.getData("taskDuration"), 10);
    const draggedTask = tasks.find(t => t.id === taskId);

    if (draggedTask) {
      // This is a simplified representation. A real implementation would calculate actual start/end times.
      const newEvent: CalendarEvent = {
        id: `event-${Date.now()}`,
        title: draggedTask.title,
        start: new Date(), // Placeholder
        end: new Date(new Date().getTime() + taskDuration * 60000), // Placeholder
      };
      setCalendarEvents(prev => [...prev, newEvent]);
      // Optionally remove task from list or mark as scheduled
      // setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const allowDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  return (
    <Card className="col-span-1 md:col-span-2 lg:col-span-3">
      <CardHeader>
        <CardTitle>Time blocking</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Tasks List */}
        <div className="md:col-span-1 p-4 border rounded-lg bg-muted/30">
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <CheckSquare className="h-5 w-5" /> Tasks
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {tasks.map((task) => (
              <div
                key={task.id}
                draggable
                onDragStart={(e) => handleTaskDragStart(e, task)}
                className="p-3 bg-card border rounded-md shadow-sm cursor-grab active:cursor-grabbing"
              >
                <p className="font-medium">{task.title}</p>
                <p className="text-xs text-muted-foreground">{task.duration} min</p>
              </div>
            ))}
            {tasks.length === 0 && <p className="text-sm text-muted-foreground">No tasks to schedule.</p>}
          </div>
        </div>

        {/* Calendar View (Simplified) */}
        <div 
          className="md:col-span-2 p-4 border rounded-lg bg-muted/30"
          onDragOver={allowDrop}
          onDrop={(e) => handleDropOnCalendar(e, "today", "morning")} // Simplified drop target
        >
          <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <Calendar className="h-5 w-5" /> Calendar (drag tasks here)
          </h3>
          <div className="bg-card p-4 rounded-md min-h-[200px] shadow-inner">
            <p className="text-center text-muted-foreground text-sm mb-2">Simplified calendar view</p>
            {/* A real calendar would have time slots etc. */}
            <div className="border-dashed border-2 border-border p-4 rounded-md text-center text-muted-foreground">
              Drop tasks here to schedule
            </div>
            <div className="mt-4 space-y-2">
              {calendarEvents.map(event => (
                <div key={event.id} className="p-2 bg-primary/10 text-primary-foreground rounded-md">
                  <p className="text-sm font-semibold text-primary">{event.title}</p>
                  <p className="text-xs text-primary/80">
                    {/* Display simplified time */}
                  </p>
                </div>
              ))}
            </div>
          </div>
          {/* Example buttons for Day/Week/Month view selection */}
          <div className="mt-4 flex gap-2">
            <Button variant="outline" size="sm">Day</Button>
            <Button variant="outline" size="sm">Week</Button>
            <Button variant="outline" size="sm">Month</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

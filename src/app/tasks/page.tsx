
"use client";

import { useState, useEffect } from 'react';
import TasksKanbanView from "@/components/tasks/TasksKanbanView";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { ListChecks, X } from "lucide-react";

const TASKS_HEADER_DISMISSED_KEY = 'tasksHeaderDismissed_v1';

export default function TasksPage() {
  const [isHeaderCardVisible, setIsHeaderCardVisible] = useState(true);

  useEffect(() => {
    const dismissed = localStorage.getItem(TASKS_HEADER_DISMISSED_KEY);
    if (dismissed === 'true') {
      setIsHeaderCardVisible(false);
    }
  }, []);

  const handleDismissHeaderCard = () => {
    setIsHeaderCardVisible(false);
    localStorage.setItem(TASKS_HEADER_DISMISSED_KEY, 'true');
  };

  return (
    <div className="flex flex-col gap-6 h-full">
       {isHeaderCardVisible && (
        <Card>
          <CardHeader className="flex-row items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="h-6 w-6 text-primary" />
                Google tasks - Kanban board
              </CardTitle>
              <CardDescription>
                Manage your tasks using a Kanban board. Drag and drop tasks between columns.
                (Note: actual Google tasks integration is not implemented in this prototype.)
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={handleDismissHeaderCard} className="h-8 w-8" aria-label="Dismiss header card">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
        </Card>
       )}
      <TasksKanbanView />
    </div>
  );
}

    
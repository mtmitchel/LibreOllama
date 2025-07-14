import React, { useState, useEffect } from 'react';
import {
  TodaysFocusWidget,
  ProjectProgressWidget,
  AgentStatusWidget,
  QuickActionsWidget,
  UpcomingEventsWidget,
  PendingTasksWidget
} from "../../features/dashboard/components";
import { WidgetErrorBoundary } from "../../features/dashboard/components/WidgetErrorBoundary";
import { WidgetSkeleton } from "../../features/dashboard/components/WidgetSkeleton";
import { LoadingState, FlexibleGrid } from "../../components/ui";
import {
  migrationSprintTasks,
  todaysFocusItems,
  agentStatusItems
} from "../../core/lib/mockData";

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate 1 second loading time

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="size-full bg-primary p-6">
        <LoadingState 
          size="lg" 
          text="Loading your dashboard..." 
          className="mb-8" 
        />
        <FlexibleGrid 
          minItemWidth={350} 
          gap={6} 
          className="w-full gap-6"
        >
          <WidgetSkeleton rows={3} />
          <WidgetSkeleton rows={2} />
          <WidgetSkeleton rows={2} />
          <WidgetSkeleton rows={1} />
          <WidgetSkeleton rows={3} />
          <WidgetSkeleton rows={3} />
        </FlexibleGrid>
      </div>
    );
  }

  return (
          <div className="size-full bg-primary p-6">
      <FlexibleGrid 
        minItemWidth={350} 
        className="w-full gap-6"
      >
        <WidgetErrorBoundary widgetName="Project progress">
          <ProjectProgressWidget 
            title="UI migration sprint"
            percentage={67}
            tasks={migrationSprintTasks}
          />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Today's focus">
          <TodaysFocusWidget 
            items={todaysFocusItems}
            onToggle={(item) => {
              // Implement toggle logic
              console.log('Toggle item:', item);
            }}
            onAddTask={(item) => {
              // Implement add task logic
              console.log('Add task:', item);
            }}
          />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Agent status">
          <AgentStatusWidget 
            agents={agentStatusItems}
          />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Quick actions">
          <QuickActionsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Upcoming events">
          <UpcomingEventsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Pending tasks">
          <PendingTasksWidget />
        </WidgetErrorBoundary>
      </FlexibleGrid>
    </div>
  );
}

export default Dashboard;

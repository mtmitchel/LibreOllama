import { useEffect, useCallback, useState } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
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
import { LoadingState, Heading, Text, FlexibleGrid } from "../../components/ui";
import {
  migrationSprintTasks,
  todaysFocusItems,
  agentStatusItems
} from "../../core/lib/mockData";

export function Dashboard() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [isLoading, setIsLoading] = useState(true);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate 1 second loading time

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHeaderProps({
      title: "Good morning, Alex"
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps]);

  if (isLoading) {
    return (
      <div className="w-full h-full p-6 lg:p-8">
        <LoadingState 
          size="lg" 
          text="Loading your dashboard..." 
          className="mb-8" 
        />
        <FlexibleGrid minItemWidth={350} gap={6} className="w-full">
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
    <div className="w-full h-full p-6 lg:p-8">
      <FlexibleGrid minItemWidth={350} gap={6} className="w-full">
        <WidgetErrorBoundary widgetName="Project Progress">
          <ProjectProgressWidget 
            title="UI migration sprint"
            percentage={67}
            tasks={migrationSprintTasks}
          />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Today's Focus">
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
        
        <WidgetErrorBoundary widgetName="Agent Status">
          <AgentStatusWidget 
            agents={agentStatusItems}
          />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Quick Actions">
          <QuickActionsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Upcoming Events">
          <UpcomingEventsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary widgetName="Pending Tasks">
          <PendingTasksWidget />
        </WidgetErrorBoundary>
      </FlexibleGrid>
    </div>
  );
}

export default Dashboard;

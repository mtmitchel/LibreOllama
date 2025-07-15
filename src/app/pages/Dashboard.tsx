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

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Simulate initial loading (minimal since widgets handle their own data loading)
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 500); // Reduced loading time since widgets load their own data

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
        gap={6} 
        className="w-full gap-6"
      >
        <WidgetErrorBoundary fallback="Failed to load today's focus">
          <TodaysFocusWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary fallback="Failed to load project progress">
          <ProjectProgressWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary fallback="Failed to load agent status">
          <AgentStatusWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary fallback="Failed to load quick actions">
          <QuickActionsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary fallback="Failed to load upcoming events">
          <UpcomingEventsWidget />
        </WidgetErrorBoundary>
        
        <WidgetErrorBoundary fallback="Failed to load pending tasks">
          <PendingTasksWidget />
        </WidgetErrorBoundary>
      </FlexibleGrid>
    </div>
  );
}

export default Dashboard;

import { useEffect, useCallback, useState } from 'react';
import { useHeader } from '../contexts/HeaderContext';
import { PlusCircle, MoreHorizontal } from 'lucide-react';
import {
  ProjectProgressWidget,
  TodaysFocusWidget,
  AgentStatusWidget,
  QuickActionsWidget
} from '../components/dashboard';
import { WidgetErrorBoundary } from '../components/dashboard/WidgetErrorBoundary';
import { WidgetSkeleton } from '../components/dashboard/WidgetSkeleton';
import {
  migrationSprintTasks,
  todaysFocusItems,
  agentStatusItems
} from '../lib/mockData';

export function Dashboard() {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [isLoading, setIsLoading] = useState(true);

  const handleAddWidget = useCallback(() => {
    console.log('Add widget');
  }, []);

  // Simulate loading data
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000); // Simulate 1 second loading time

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    setHeaderProps({
      title: "Good morning, Alex",
      primaryAction: {
        label: 'Add widget',
        onClick: handleAddWidget,
        icon: <PlusCircle size={16} />
      },
      secondaryActions: [
        {
          label: 'More options',
          onClick: () => console.log('More options'),
          icon: <MoreHorizontal size={16} />,
          variant: 'ghost' as const
        }
      ]
    });
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, handleAddWidget]);

  if (isLoading) {
    return (
      <div className="w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          <WidgetSkeleton rows={3} />
          <WidgetSkeleton rows={2} />
          <WidgetSkeleton rows={2} />
          <WidgetSkeleton className="lg:col-span-2 xl:col-span-1" rows={1} />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 md:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
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
      </div>
    </div>
  );
}

export default Dashboard;

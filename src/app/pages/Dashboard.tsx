import React, { useState, useEffect } from 'react';
import {
  FocusEventsWidget,
  ProjectProgressWidget,
  AgentStatusWidget,
  QuickActionsWidget,
  MailWidget,
  RecentActivityWidget,
  PendingTasksWidget
} from "../../features/dashboard/components";
import { WidgetErrorBoundary } from "../../features/dashboard/components/WidgetErrorBoundary";
import { WidgetSkeleton } from "../../features/dashboard/components/WidgetSkeleton";
import { LoadingState, FloatingActionButton } from "../../components/ui";
import { Settings2 } from 'lucide-react';
import './dashboard.css';
import Masonry from 'react-masonry-css';

// Widget configuration
interface WidgetConfig {
  id: string;
  component: React.ComponentType;
  order?: number;
}

export function Dashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Widget configuration - arranged for optimal visual flow
  const widgets: WidgetConfig[] = [
    { id: 'quick-actions', component: QuickActionsWidget },
    { id: 'focus-events', component: FocusEventsWidget },
    { id: 'mail', component: MailWidget },
    { id: 'recent-activity', component: RecentActivityWidget },
    { id: 'projects', component: ProjectProgressWidget },
    { id: 'pending-tasks', component: PendingTasksWidget },
    { id: 'available-agents', component: AgentStatusWidget }
  ];

  // Responsive column breakpoints
  const breakpointColumns = {
    default: 4,
    1600: 4,
    1200: 3,
    900: 2,
    600: 1
  };

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="dashboard-container bg-primary">
        <LoadingState 
          size="lg" 
          text="Loading your dashboard..." 
          className="mb-8" 
        />
      </div>
    );
  }

  return (
    <>
      <div className="dashboard-container bg-primary">
        <Masonry
          breakpointCols={breakpointColumns}
          className="dashboard-masonry"
          columnClassName="dashboard-masonry-column"
        >
          {widgets.map((widget) => {
            const WidgetComponent = widget.component;
            return (
              <div key={widget.id} className="dashboard-widget-wrapper">
                <WidgetErrorBoundary fallback={`Failed to load ${widget.id}`}>
                  <WidgetComponent />
                </WidgetErrorBoundary>
              </div>
            );
          })}
        </Masonry>
      </div>
      
      {/* Floating Action Button for Dashboard Customization */}
      <FloatingActionButton
        icon={Settings2}
        label="Customize"
        onClick={() => console.log('Open dashboard customization')}
        position="bottom-right"
      />
    </>
  );
}

export default Dashboard;

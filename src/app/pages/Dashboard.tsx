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
import { Settings2 } from 'lucide-react';
import '../../styles/asana-core.css';
import './styles/dashboard-asana-v3.css';

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

  // Grid columns configuration
  const columns = 3; // Standard 3-column layout

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <div className="asana-app-layout">
        <div className="asana-content-card">
          <div className="asana-loading">
            <div className="asana-spinner" />
            <span className="asana-loading-text">Loading your dashboard...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="asana-app-layout">
      <div className="asana-content">
        <div className="asana-content-card">
          <div className="asana-content-body">
            <div className="asana-grid asana-grid-3">
              {widgets.map((widget) => {
                const WidgetComponent = widget.component;
                return (
                  <div key={widget.id}>
                    <WidgetErrorBoundary fallback={`Failed to load ${widget.id}`}>
                      <WidgetComponent />
                    </WidgetErrorBoundary>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

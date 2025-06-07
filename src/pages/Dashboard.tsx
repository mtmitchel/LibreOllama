import React from 'react';
import { Button } from '../components/ui';
import { PageLayout } from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';
import {
  MessageSquare,
  FileText,
  FolderPlus,
  LayoutTemplate,
  MoreHorizontal,
  Settings2,
  GripVertical,
  PlusCircle,
  CheckCircle2, // Added for completed status
  Circle // Added for pending status (or CircleDot / CircleHelp for outline)
} from 'lucide-react';

export function Dashboard() {
  const handleAddWidget = () => {
    // TODO: Implement add widget functionality
    console.log('Add widget');
  };

  const headerProps = {
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
        variant: 'ghost' as const
      }
    ]
  };

  return (
    <PageLayout headerProps={headerProps}>
      <p className="text-text-secondary -mt-4 mb-6">
        Here's what's happening today.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* UI Migration Sprint Widget */}
        <Card>
          <div className="widget-drag-handle">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="project-progress">
            <div className="progress-header">
              <h3 className="progress-title">UI migration sprint</h3>
              <span className="progress-percentage">67% complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill w-[67%]"></div>
            </div>
            <div className="milestone-list">
              <div className="milestone">
                {/* <div className="milestone-status completed"></div> */}
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div className="milestone-content">
                  <div className="milestone-title">Component library setup</div>
                </div>
                <div className="milestone-date">Dec 18</div>
              </div>
              <div className="milestone">
                {/* <div className="milestone-status completed"></div> */}
                <CheckCircle2 className="w-4 h-4 text-success" />
                <div className="milestone-content">
                  <div className="milestone-title">Dashboard redesign</div>
                </div>
                <div className="milestone-date">Dec 20</div>
              </div>
              <div className="milestone">
                {/* <div className="milestone-status pending"></div> */}
                <Circle className="w-4 h-4 text-text-muted stroke-2" />
                {/* Using Circle with increased strokeWidth for better visual weight */}
                <div className="milestone-content">
                  <div className="milestone-title">Chat interface migration</div>
                </div>
                <div className="milestone-date">Dec 25</div>
              </div>
            </div>
          </div>
        </Card>

        {/* Today's Focus Widget */}
        <Card>
          <div className="widget-drag-handle">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Today's focus</h3>
            <div className="widget-actions">
              <button className="widget-action">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="event-list">
            <div className="event-item">
              <div className="event-time">
                <div className="event-time-hour">9:00</div>
                <div className="event-time-period">AM</div>
              </div>
              <div className="event-details">
                <div className="event-title">Design review</div>
                <div className="event-meta">
                  <span className="flex items-center">
                    <div className="event-indicator bg-accent-primary"></div>
                    UI migration team
                  </span>
                </div>
              </div>
            </div>
            <div className="event-item">
              <div className="event-time">
                <div className="event-time-hour">2:30</div>
                <div className="event-time-period">PM</div>
              </div>
              <div className="event-details">
                <div className="event-title">Code review session</div>
                <div className="event-meta">
                  <span className="flex items-center">
                    <div className="event-indicator bg-success"></div>
                    Development team
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Agent Status Widget */}
        <Card>
          <div className="widget-drag-handle">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Agent status</h3>
            <div className="widget-actions">
              <button className="widget-action">
                <Settings2 className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="ai-agent-list">
            <div className="ai-agent-item">
              <div className="ai-agent-status online"></div>
              <div className="ai-agent-info">
                <div className="ai-agent-name">General assistant</div>
                <div className="ai-agent-model">Llama 3.1 70B</div>
              </div>
              <div className="ai-agent-usage">Active</div>
            </div>
            <div className="ai-agent-item">
              <div className="ai-agent-status offline"></div>
              <div className="ai-agent-info">
                <div className="ai-agent-name">Research helper</div>
                <div className="ai-agent-model">Mixtral 8x7B</div>
              </div>
              <div className="ai-agent-usage">Offline</div>
            </div>
          </div>
        </Card>

        {/* Quick Actions Widget */}
        <Card>
          <div className="widget-drag-handle">
            <GripVertical className="w-4 h-4" />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Quick actions</h3>
          </div>
          <div className="quick-actions-grid">
            <div className="quick-actions-primary">
              <button className="btn btn-primary">
                <MessageSquare className="w-4 h-4 mr-2" />
                Start chat
              </button>
            </div>
            <div className="quick-actions-secondary">
              <button className="btn btn-secondary">
                <FileText className="w-4 h-4 mr-2" />
                New note
              </button>
              <button className="btn btn-secondary">
                <FolderPlus className="w-4 h-4 mr-2" />
                Create project
              </button>
              <button className="btn btn-secondary">
                <LayoutTemplate className="w-4 h-4 mr-2" />
                Open canvas
              </button>
            </div>
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

export default Dashboard;

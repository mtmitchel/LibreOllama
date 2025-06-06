import React from 'react';
import { Button } from '../components/ui';
import { 
  MessageSquare, 
  FileText, 
  FolderPlus, 
  LayoutTemplate,
  MoreHorizontal,
  Settings2,
  GripVertical,
  PlusCircle
} from 'lucide-react';

export function Dashboard() {
  return (
    <div>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">Good morning, Alex</h1>
          <p className="dashboard-subtitle">Here's what's happening today.</p>
        </div>
        <div className="dashboard-controls">
          <button className="btn btn-secondary">
            <PlusCircle style={{ width: '16px', height: '16px' }} />
            Add widget
          </button>
          <button className="btn btn-ghost">
            <MoreHorizontal style={{ width: '16px', height: '16px' }} />
          </button>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* UI Migration Sprint Widget */}
        <div className="widget">
          <div className="widget-drag-handle">
            <GripVertical style={{ width: '16px', height: '16px' }} />
          </div>
          <div className="project-progress">
            <div className="progress-header">
              <h3 className="progress-title">UI migration sprint</h3>
              <span className="progress-percentage">67% complete</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: '67%' }}></div>
            </div>
            <div className="milestone-list">
              <div className="milestone">
                <div className="milestone-status completed"></div>
                <div className="milestone-content">
                  <div className="milestone-title">Component library setup</div>
                </div>
                <div className="milestone-date">Dec 18</div>
              </div>
              <div className="milestone">
                <div className="milestone-status completed"></div>
                <div className="milestone-content">
                  <div className="milestone-title">Dashboard redesign</div>
                </div>
                <div className="milestone-date">Dec 20</div>
              </div>
              <div className="milestone">
                <div className="milestone-status pending"></div>
                <div className="milestone-content">
                  <div className="milestone-title">Chat interface migration</div>
                </div>
                <div className="milestone-date">Dec 25</div>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Focus Widget */}
        <div className="widget">
          <div className="widget-drag-handle">
            <GripVertical style={{ width: '16px', height: '16px' }} />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Today's focus</h3>
            <div className="widget-actions">
              <button className="widget-action">
                <MoreHorizontal style={{ width: '16px', height: '16px' }} />
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
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="event-indicator" style={{ background: 'var(--accent-primary)' }}></div>
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
                  <span style={{ display: 'flex', alignItems: 'center' }}>
                    <div className="event-indicator" style={{ background: 'var(--success)' }}></div>
                    Development team
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Agent Status Widget */}
        <div className="widget">
          <div className="widget-drag-handle">
            <GripVertical style={{ width: '16px', height: '16px' }} />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Agent status</h3>
            <div className="widget-actions">
              <button className="widget-action">
                <Settings2 style={{ width: '16px', height: '16px' }} />
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
        </div>

        {/* Quick Actions Widget */}
        <div className="widget">
          <div className="widget-drag-handle">
            <GripVertical style={{ width: '16px', height: '16px' }} />
          </div>
          <div className="widget-header">
            <h3 className="widget-title">Quick actions</h3>
          </div>
          <div className="quick-actions-grid">
            <button className="btn btn-primary">
              <MessageSquare style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Start chat
            </button>
            <button className="btn btn-secondary">
              <FileText style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              New note
            </button>
            <button className="btn btn-secondary">
              <FolderPlus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Create project
            </button>
            <button className="btn btn-secondary">
              <LayoutTemplate style={{ width: '16px', height: '16px', marginRight: '8px' }} />
              Open canvas
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;

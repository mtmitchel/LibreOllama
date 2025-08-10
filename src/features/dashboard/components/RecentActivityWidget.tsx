import React from 'react';
import { Activity, FileText, MessageSquare, CheckCircle, GitBranch, Upload } from 'lucide-react';
import { WidgetHeader } from '../../../components/ui/design-system';
import { Button } from '../../../components/ui/design-system/Button';

interface ActivityItem {
  id: string;
  type: 'document' | 'chat' | 'task' | 'code' | 'file';
  action: string;
  target: string;
  timestamp: string;
  user?: string;
}

export function RecentActivityWidget() {
  // Mock data - replace with actual data from your store/API
  const activities: ActivityItem[] = [
    {
      id: '1',
      type: 'document',
      action: 'Updated',
      target: 'Project Roadmap',
      timestamp: '2 hours ago',
      user: 'You'
    },
    {
      id: '2',
      type: 'task',
      action: 'Completed',
      target: 'Review API documentation',
      timestamp: '4 hours ago',
      user: 'You'
    },
    {
      id: '3',
      type: 'chat',
      action: 'Started new session',
      target: 'AI Code Review Assistant',
      timestamp: '6 hours ago',
      user: 'You'
    },
    {
      id: '4',
      type: 'code',
      action: 'Pushed changes to',
      target: 'feat/dashboard-update',
      timestamp: 'Yesterday',
      user: 'You'
    },
    {
      id: '5',
      type: 'file',
      action: 'Uploaded',
      target: 'design-mockups.zip',
      timestamp: 'Yesterday',
      user: 'You'
    }
  ];

  const getActivityIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'document':
        return <FileText size={16} className="text-blue-500" />;
      case 'chat':
        return <MessageSquare size={16} className="text-purple-500" />;
      case 'task':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'code':
        return <GitBranch size={16} className="text-orange-500" />;
      case 'file':
        return <Upload size={16} className="text-indigo-500" />;
      default:
        return <Activity size={16} className="text-secondary" />;
    }
  };

  const getActivityColor = (type: ActivityItem['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-500/10';
      case 'chat':
        return 'bg-purple-500/10';
      case 'task':
        return 'bg-green-500/10';
      case 'code':
        return 'bg-orange-500/10';
      case 'file':
        return 'bg-indigo-500/10';
      default:
        return 'bg-gray-500/10';
    }
  };

  return (
    <div className="asana-card asana-card-padded">
      <WidgetHeader
        title={(
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-indigo-500/10">
              <Activity size={20} className="text-indigo-500" />
            </div>
            <span>Recent activity</span>
          </div>
        )}
        actions={(
          <Button variant="ghost" size="sm" className="text-[11px]">View all activity</Button>
        )}
      />

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="py-8 text-center text-secondary">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="hover:bg-tertiary/50 flex items-start gap-2 rounded-lg p-2 transition-colors"
              >
                <div className={`size-6 rounded-md ${getActivityColor(activity.type)} flex shrink-0 items-center justify-center`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="asana-text-sm">
                    <span className="font-medium text-primary">{activity.user || 'System'}</span>
                    <span className="text-secondary"> {activity.action} </span>
                    <span className="font-medium text-primary">{activity.target}</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-secondary">{activity.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* no footer link; action moved to header */}
    </div>
  );
}
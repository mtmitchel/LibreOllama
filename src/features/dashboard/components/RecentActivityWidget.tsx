import React from 'react';
import { Activity, FileText, MessageSquare, CheckCircle, GitBranch, Upload } from 'lucide-react';

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
    <div className="bg-card rounded-xl border border-border-default p-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center">
          <Activity size={20} className="text-indigo-500" />
        </div>
        <h3 className="text-lg font-semibold">Recent activity</h3>
      </div>

      {/* Activity List */}
      <div className="flex-1 overflow-y-auto">
        <div className="space-y-2">
          {activities.length === 0 ? (
            <p className="text-secondary text-center py-8">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-2 p-2 rounded-lg hover:bg-tertiary/50 transition-colors"
              >
                <div className={`w-6 h-6 rounded-md ${getActivityColor(activity.type)} flex items-center justify-center flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium text-primary">{activity.user || 'System'}</span>
                    <span className="text-secondary"> {activity.action} </span>
                    <span className="font-medium text-primary">{activity.target}</span>
                  </p>
                  <p className="text-xs text-secondary mt-0.5">{activity.timestamp}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* View All Link */}
      <div className="mt-3 pt-2 border-t border-border-default">
        <button className="text-xs text-primary hover:text-primary-hover transition-colors">
          View all activity →
        </button>
      </div>
    </div>
  );
}
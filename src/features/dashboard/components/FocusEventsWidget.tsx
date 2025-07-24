import React, { useState } from 'react';
import { Clock, Calendar, Target, CheckCircle } from 'lucide-react';
import { Button } from '../../../components/ui';

interface FocusItem {
  id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in-progress' | 'completed';
}

interface EventItem {
  id: string;
  title: string;
  time: string;
  location?: string;
  type: 'meeting' | 'task' | 'reminder';
}

export function FocusEventsWidget() {
  const [activeView, setActiveView] = useState<'focus' | 'events'>('focus');

  // Mock data - replace with actual data from your store/API
  const focusItems: FocusItem[] = [
    {
      id: '1',
      title: 'Complete LibreOllama UI Enhancement',
      description: 'Design system and component updates',
      priority: 'high',
      status: 'in-progress'
    },
    {
      id: '2',
      title: 'Review API Documentation',
      description: 'Update integration guidelines',
      priority: 'medium',
      status: 'pending'
    }
  ];

  const eventItems: EventItem[] = [
    {
      id: '1',
      title: 'Team Standup',
      time: '9:00 AM',
      type: 'meeting'
    },
    {
      id: '2',
      title: 'Code Review',
      time: '2:30 PM',
      type: 'meeting'
    },
    {
      id: '3',
      title: 'Project Demo',
      time: '4:00 PM',
      location: 'Conference Room A',
      type: 'meeting'
    }
  ];

  const getPriorityColor = (priority: FocusItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-secondary';
    }
  };

  const getStatusBadge = (status: FocusItem['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={16} className="text-green-500" />;
      case 'in-progress':
        return <div className="size-2 animate-pulse rounded-full bg-blue-500" />;
      default:
        return <div className="size-2 rounded-full bg-gray-400" />;
    }
  };

  const getEventTypeIcon = (type: EventItem['type']) => {
    switch (type) {
      case 'meeting':
        return <Calendar size={14} className="text-primary" />;
      case 'task':
        return <Target size={14} className="text-primary" />;
      default:
        return <Clock size={14} className="text-primary" />;
    }
  };

  return (
    <div className="border-border-default flex h-full flex-col rounded-xl border bg-card p-4">
      {/* Header with Toggle */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
            {activeView === 'focus' ? (
              <Target size={20} className="text-blue-500" />
            ) : (
              <Calendar size={20} className="text-blue-500" />
            )}
          </div>
          <h3 className="text-lg font-semibold">
            {activeView === 'focus' ? "Today's focus" : 'Upcoming events'}
          </h3>
        </div>
        
        {/* Toggle Buttons */}
        <div className="flex gap-1 rounded-lg bg-tertiary p-1">
          <Button
            variant={activeView === 'focus' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('focus')}
            className="px-3 py-1 text-xs"
          >
            Focus
          </Button>
          <Button
            variant={activeView === 'events' ? 'primary' : 'ghost'}
            size="sm"
            onClick={() => setActiveView('events')}
            className="px-3 py-1 text-xs"
          >
            Events
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeView === 'focus' ? (
          <div className="space-y-3">
            {focusItems.length === 0 ? (
              <p className="py-8 text-center text-secondary">No focus items for today</p>
            ) : (
              focusItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-tertiary/50 cursor-pointer rounded-lg p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-1">{getStatusBadge(item.status)}</div>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h4 className="font-medium text-primary">{item.title}</h4>
                        <span className={`text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {item.priority.toUpperCase()}
                        </span>
                      </div>
                      {item.description && (
                        <p className="mt-1 text-sm text-secondary">{item.description}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-2">
            {eventItems.length === 0 ? (
              <p className="py-8 text-center text-secondary">No upcoming events</p>
            ) : (
              eventItems.map((event) => (
                <div
                  key={event.id}
                  className="bg-tertiary/50 cursor-pointer rounded-lg p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">{getEventTypeIcon(event.type)}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-primary">{event.title}</h4>
                        <span className="text-xs text-secondary">{event.time}</span>
                      </div>
                      {event.location && (
                        <p className="mt-1 text-xs text-secondary">{event.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
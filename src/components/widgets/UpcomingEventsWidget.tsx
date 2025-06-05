import React from 'react';
import { Calendar, Clock, MapPin, Users, Video, ArrowRight } from 'lucide-react';
import { WidgetWrapper } from '../ui/widget-wrapper';
import { Badge } from '../ui/badge';
import { TimeStatusIndicator } from '../ui/status-indicator';
import { designTokens } from '../../lib/design-tokens';
import type { Event } from '../screens/DashboardScreen';

export interface UpcomingEventsWidgetProps {
  events: Event[];
  onNavigate?: (workflow: string) => void;
}

export function UpcomingEventsWidget({
  events,
  onNavigate
}: UpcomingEventsWidgetProps) {
  const handleMoreOptions = () => {
    console.log('Events options clicked');
  };

  const handleWidgetClick = () => {
    onNavigate?.('calendar');
  };

  const getTimeUntilEvent = (timeString: string) => {
    // Simple time parsing - in a real app, you'd want proper date handling
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    
    // Parse time string (e.g., "9:00 AM", "2:00 PM")
    const [time, period] = timeString.split(' ');
    const [hours, minutes] = time.split(':').map(Number);
    let eventHour = hours;
    
    if (period === 'PM' && hours !== 12) eventHour += 12;
    if (period === 'AM' && hours === 12) eventHour = 0;
    
    const eventMinutes = eventHour * 60 + minutes;
    const currentMinutes = currentHour * 60 + currentMinute;
    const diffMinutes = eventMinutes - currentMinutes;
    
    if (diffMinutes < 0) return null; // Past event
    if (diffMinutes < 60) return `${diffMinutes}m`;
    if (diffMinutes < 120) return `${Math.floor(diffMinutes / 60)}h ${diffMinutes % 60}m`;
    return `${Math.floor(diffMinutes / 60)}h`;
  };

  const getEventTypeIcon = (title: string) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('meeting') || lowerTitle.includes('standup')) return Users;
    if (lowerTitle.includes('call') || lowerTitle.includes('video')) return Video;
    if (lowerTitle.includes('review')) return Calendar;
    return Clock;
  };

  const getEventUrgency = (timeString: string) => {
    const timeUntil = getTimeUntilEvent(timeString);
    if (!timeUntil) return 'past';
    
    const minutes = parseInt(timeUntil);
    if (timeUntil.includes('m') && minutes <= 15) return 'urgent';
    if (timeUntil.includes('h') && timeUntil.includes('m')) {
      const hours = parseInt(timeUntil);
      if (hours === 1) return 'soon';
    }
    return 'normal';
  };

  return (
    <WidgetWrapper
      title="Upcoming Events"
      moreOptions
      onMoreOptions={handleMoreOptions}
      onClick={handleWidgetClick}
    >
      <div className="space-y-4">
        {events.length > 0 ? (
          events.slice(0, 4).map(event => {
            const timeUntil = getTimeUntilEvent(event.time);
            const urgency = getEventUrgency(event.time);
            const EventIcon = event.icon || getEventTypeIcon(event.title);

            return (
              <div
                key={event.id}
                className="group flex items-center gap-4 p-4 rounded-lg hover:bg-slate-700/50 transition-all duration-200 border border-slate-700/50 hover:border-slate-600/50"
              >
                {/* V2 Enhanced color indicator with pulse for urgent events */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-3 h-3 rounded-full ${
                      urgency === 'urgent' ? 'animate-pulse' : ''
                    }`}
                    style={{ backgroundColor: event.color || '#3B82F6' }}
                  />
                  {urgency === 'urgent' && (
                    <div
                      className="absolute inset-0 w-3 h-3 rounded-full animate-ping opacity-75"
                      style={{ backgroundColor: event.color || '#3B82F6' }}
                    />
                  )}
                </div>
                
                {/* V2 Event details */}
                <div className="flex-1 min-w-0 space-y-2">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white truncate">
                      {event.title}
                    </p>
                    <EventIcon className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  
                  <div className="flex items-center gap-2 flex-wrap">
                    <TimeStatusIndicator
                      status={urgency === 'urgent' ? 'urgent' : urgency === 'soon' ? 'soon' : 'today'}
                      label={event.time}
                      size="sm"
                    />
                    
                    {timeUntil && (
                      <Badge
                        variant="outline"
                        className={`text-xs border-slate-600 text-slate-300 ${
                          urgency === 'urgent'
                            ? 'border-red-500/30 text-red-300 bg-red-500/10'
                            : ''
                        }`}
                      >
                        in {timeUntil}
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* V2 Action indicator */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="h-4 w-4 text-slate-400" />
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Calendar className="h-8 w-8 text-blue-400" />
            </div>
            <p className="text-sm font-medium text-white mb-2">
              No events scheduled
            </p>
            <p className="text-xs text-slate-400">
              Your schedule is clear for today
            </p>
          </div>
        )}
        
        {events.length > 4 && (
          <div className="pt-4 border-t border-slate-700/50">
            <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 transition-colors cursor-pointer border border-slate-700/50">
              <Calendar className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300 font-medium">
                +{events.length - 4} more events today
              </span>
            </div>
          </div>
        )}
      </div>
    </WidgetWrapper>
  );
}
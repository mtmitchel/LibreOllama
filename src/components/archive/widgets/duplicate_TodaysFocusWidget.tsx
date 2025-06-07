import React from 'react';
import { MoreHorizontal, GripVertical } from 'lucide-react';

interface FocusEvent {
  id: string;
  time: string;
  period: string;
  title: string;
  team: string;
  indicatorColor: string;
}

interface TodaysFocusWidgetProps {
  events: FocusEvent[];
}

export function TodaysFocusWidget({ events }: TodaysFocusWidgetProps) {
  return (
    <div className="widget">
      <div className="widget-drag-handle">
        <GripVertical />
      </div>
      
      <div className="widget-header">
        <h3 className="widget-title">Today's focus</h3>
        <div className="widget-action">
          <MoreHorizontal />
        </div>
      </div>

      <div className="event-list">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <div className="event-time">
              <div className="event-time-hour">{event.time}</div>
              <div className="event-time-period">{event.period}</div>
            </div>
            <div className="event-details">
              <div className="event-title">{event.title}</div>
              <div className="event-meta">
                <div 
                  className="event-indicator" 
                  style={{ backgroundColor: event.indicatorColor }}
                ></div>
                {event.team}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

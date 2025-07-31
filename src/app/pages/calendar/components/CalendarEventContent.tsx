import React from 'react';
import { EventContentArg } from '@fullcalendar/core';
import { Clock, MapPin, Users, BarChart } from 'lucide-react';
import { CalendarEvent } from '../types';
import { UnifiedTask } from '../../../../stores/unifiedTaskStore.types';
import { useUnifiedTaskStore } from '../../../../stores/unifiedTaskStore';

export const CalendarEventContent: React.FC<{ arg: EventContentArg }> = ({ arg }) => {
  const { event } = arg;
  const eventData = event.extendedProps as CalendarEvent;
  const isTask = eventData.type === 'task';
  const isTimeGridView = arg.view.type.includes('timeGrid');

  // Get task data for priority if it's a task
  const unifiedTask = isTask && eventData.taskData 
    ? eventData.taskData
    : null;
  const priority = unifiedTask?.priority || 'normal';

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return '#EF4444';
      case 'high': return '#F97316';
      case 'low': return '#3B82F6';
      default: return '#6B7280';
    }
  };

  // For time grid views
  if (isTimeGridView) {
    return (
      <div className="fc-event-main cal-event" style={{ overflow: 'hidden', maxWidth: '100%', padding: '4px 8px' }}>
        {arg.timeText && (
          <div className="fc-event-time" style={{ fontSize: '11px', opacity: 0.8, marginBottom: '2px' }}>
            {arg.timeText}
          </div>
        )}
        <div className="fc-event-title-container">
          <div 
            className="fc-event-title fc-sticky" 
            style={{ 
              fontWeight: 500,
              fontSize: '13px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}
          >
            {event.title}
          </div>
        </div>
        {eventData.location && (
          <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={10} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {eventData.location}
            </span>
          </div>
        )}
      </div>
    );
  }

  const timeText = arg.event.allDay 
    ? null 
    : arg.event.start?.toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit', 
        hour12: true 
      });

  return (
    <div className="fc-event-main-frame cal-event" style={{ 
      display: 'flex', 
      alignItems: 'center', 
      gap: '8px', 
      padding: '4px 8px',
      overflow: 'hidden',
      width: '100%'
    }}>
      {isTask && (
        <div style={{ 
          width: '3px', 
          height: '100%', 
          backgroundColor: getPriorityColor(priority),
          position: 'absolute',
          left: 0,
          top: 0,
          borderRadius: '2px 0 0 2px'
        }} />
      )}
      
      {timeText && (
        <div style={{ 
          fontSize: '11px', 
          opacity: 0.7, 
          whiteSpace: 'nowrap',
          flexShrink: 0
        }}>
          {timeText}
        </div>
      )}
      
      <div style={{ 
        fontWeight: 500, 
        fontSize: '13px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1
      }}>
        {event.title}
      </div>
      
      {eventData.attendees && eventData.attendees.length > 0 && (
        <Users size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
      )}
      
      {eventData.conferenceLink && (
        <BarChart size={14} style={{ opacity: 0.6, flexShrink: 0 }} />
      )}
    </div>
  );
};
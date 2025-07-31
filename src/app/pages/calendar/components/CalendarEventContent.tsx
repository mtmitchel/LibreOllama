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
  const isDayGridView = arg.view.type.includes('dayGrid');
  
  

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
      <div className="fc-event-main cal-event" style={{ 
        overflow: 'hidden', 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px'
      }}>
        <div className="fc-event-title-container" style={{ flex: 1, minHeight: 0 }}>
          <div 
            className="fc-event-title fc-sticky" 
            style={{ 
              fontWeight: 500,
              fontSize: '13px',
              color: '#222',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: '1.4'
            }}
          >
            {event.title}
          </div>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap' }}>
          {arg.timeText && (
            <span className="fc-event-time" style={{ 
              fontSize: '11px', 
              color: '#999',
              fontWeight: 400
            }}>
              {arg.timeText}
            </span>
          )}
          
          {isTask && priority !== 'normal' && (
            <span style={{
              fontSize: '10px',
              padding: '1px 4px',
              borderRadius: '3px',
              fontWeight: 500,
              backgroundColor: priority === 'urgent' ? 'rgba(239, 68, 68, 0.1)' :
                              priority === 'high' ? 'rgba(245, 158, 11, 0.1)' :
                              priority === 'low' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
              color: priority === 'urgent' ? '#dc2626' :
                     priority === 'high' ? '#f59e0b' :
                     priority === 'low' ? '#10b981' : '#666'
            }}>
              {priority === 'urgent' ? 'Urgent' : priority === 'high' ? 'High' : 'Low'}
            </span>
          )}
        </div>
        
        {eventData.location && (
          <div style={{ 
            fontSize: '11px', 
            color: '#999', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '2px' 
          }}>
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
      gap: '4px',
      overflow: 'hidden',
      width: '100%',
      height: '100%'
    }}>
      <div style={{ 
        fontWeight: 500, 
        fontSize: '13px',
        color: '#222',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        flex: 1,
        lineHeight: '1.4'
      }}>
        {event.title}
      </div>
      
      {isTask && priority !== 'normal' && (
        <span style={{
          fontSize: '11px',
          padding: '1px 5px',
          borderRadius: '3px',
          flexShrink: 0,
          fontWeight: 500,
          backgroundColor: priority === 'urgent' ? 'rgba(239, 68, 68, 0.1)' :
                          priority === 'high' ? 'rgba(245, 158, 11, 0.1)' :
                          priority === 'low' ? 'rgba(34, 197, 94, 0.1)' : 'transparent',
          color: priority === 'urgent' ? '#dc2626' :
                 priority === 'high' ? '#f59e0b' :
                 priority === 'low' ? '#10b981' : '#666',
          whiteSpace: 'nowrap'
        }}>
          {priority === 'urgent' ? 'Urgent' : priority === 'high' ? 'High' : 'Low'}
        </span>
      )}
      
      {eventData.attendees && eventData.attendees.length > 0 && (
        <Users size={11} style={{ color: '#999', flexShrink: 0 }} />
      )}
      
      {eventData.conferenceLink && (
        <BarChart size={11} style={{ color: '#999', flexShrink: 0 }} />
      )}
    </div>
  );
};
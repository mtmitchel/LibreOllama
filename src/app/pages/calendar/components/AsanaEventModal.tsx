import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Link, FileText, Trash2, Repeat } from 'lucide-react';
import { AsanaEventModalProps } from '../types/calendar';

// Asana-style typography
const asanaTypography = {
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    color: 'var(--asana-text-primary)'
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.4,
    color: 'var(--asana-text-primary)'
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0',
    color: 'var(--asana-text-secondary)'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: 'var(--asana-text-secondary)'
  }
};

export const AsanaEventModal: React.FC<AsanaEventModalProps> = ({ 
  isOpen, 
  onClose,
  event,
  onSave,
  onDelete,
  calendars
}) => {
  const [title, setTitle] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCalendar, setSelectedCalendar] = useState('primary');
  const [allDay, setAllDay] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurrenceRule, setRecurrenceRule] = useState('none');

  useEffect(() => {
    if (event) {
      setTitle(event.summary || '');
      setLocation(event.location || '');
      setDescription(event.description || '');
      setSelectedCalendar(event.calendarId || 'primary');
      
      // Handle both Google Calendar format and our custom format
      let start: Date;
      let end: Date;
      
      if (event.start instanceof Date) {
        start = event.start;
        end = event.end instanceof Date ? event.end : new Date();
      } else if (event.start?.dateTime || event.start?.date) {
        start = new Date(event.start.dateTime || event.start.date || '');
        end = event.end ? new Date(event.end.dateTime || event.end.date || '') : new Date();
      } else {
        start = new Date();
        end = new Date();
      }
      
      setAllDay(!!event.start?.date);
      setStartDate(start.toISOString().split('T')[0]);
      setStartTime(start.toTimeString().slice(0, 5));
      setEndDate(end.toISOString().split('T')[0]);
      setEndTime(end.toTimeString().slice(0, 5));
    } else {
      // Reset form for new event
      setTitle('');
      setLocation('');
      setDescription('');
      setAllDay(false);
      setRecurring(false);
      setRecurrenceRule('none');
      
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime(now.toTimeString().slice(0, 5));
      setEndDate(now.toISOString().split('T')[0]);
      setEndTime(later.toTimeString().slice(0, 5));
    }
  }, [event]);

  // Set default calendar to mtmitchel@gmail.com when calendars are available
  useEffect(() => {
    if (calendars && calendars.length > 0 && !event) {
      const defaultCalendar = calendars.find((cal: any) => cal.id.includes('mtmitchel@gmail.com')) || calendars[0];
      setSelectedCalendar(defaultCalendar.id);
    }
  }, [calendars, event]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Please enter a title for the event');
      return;
    }

    // Create event data in the format expected by the Rust backend (GoogleCalendarEvent)
    const eventData: any = {
      id: event?.id || '', // Rust backend requires this field even if empty
      summary: title,
    };
    // The Rust backend will clear the empty id before sending to Google

    // Only add fields if they have values (avoid sending null to Google API)
    if (description?.trim()) {
      eventData.description = description;
    }
    if (location?.trim()) {
      eventData.location = location;
    }

    // Add recurrence rule if recurring is enabled
    if (recurring && recurrenceRule !== 'none') {
      const recurrenceRules = {
        daily: 'FREQ=DAILY',
        weekdays: 'FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR',
        weekly: 'FREQ=WEEKLY',
        biweekly: 'FREQ=WEEKLY;INTERVAL=2',
        monthly: 'FREQ=MONTHLY',
        yearly: 'FREQ=YEARLY',
        custom: 'FREQ=WEEKLY' // Default for custom, could be enhanced later
      };
      eventData.recurrence = [recurrenceRules[recurrenceRule as keyof typeof recurrenceRules]];
    }

    // Set start and end in the format expected by GoogleCalendarEvent
    if (allDay) {
      // For all-day events, end date should be the next day (Google Calendar API requirement)
      const endDateForAllDay = startDate === endDate ? 
        new Date(new Date(endDate).getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0] : 
        endDate;
      
      eventData.start = { 
        date: startDate
      };
      eventData.end = { 
        date: endDateForAllDay
      };
    } else {
      // For timed events, use the local timezone format that Google expects
      const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      
      eventData.start = { 
        dateTime: `${startDate}T${startTime}:00`,
        timeZone: timezone
      };
      eventData.end = { 
        dateTime: `${endDate}T${endTime}:00`,
        timeZone: timezone
      };
    }

    // Add calendarId for the frontend to use (will be removed before sending to backend)
    eventData.calendarId = selectedCalendar;
    
    // Debug: Log the event data being sent
    console.log('🔍 Event data being sent to backend:', JSON.stringify(eventData, null, 2));
    
    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4" style={{ borderBottom: '1px solid var(--asana-border-default)' }}>
          <h2 style={asanaTypography.h1}>
            {event ? 'Edit event' : 'New event'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full px-3 py-2 rounded-lg border transition-all text-base font-medium"
           style={{ 
            backgroundColor: 'var(--asana-bg-input)',
            borderColor: 'transparent',
                outline: 'none',
                fontSize: '18px',
            fontWeight: 500,
            color: 'var(--asana-text-primary)'
              }}
              onFocus={(e) => {
             e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
             e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
             e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              autoFocus
            />
          </div>

          {/* Calendar Selection */}
          <div>
            <label style={{ ...asanaTypography.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Calendar size={14} />
              Calendar
            </label>
            <select 
              value={selectedCalendar} 
              onChange={(e) => setSelectedCalendar(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border transition-all cursor-pointer"
               style={{ 
                ...asanaTypography.body,
                backgroundColor: 'var(--asana-bg-input)',
                borderColor: 'transparent',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              {calendars && [...calendars]
                .sort((a, b) => {
                  // mtmitchel@gmail.com first, then others
                  if (a.id.includes('mtmitchel@gmail.com')) return -1;
                  if (b.id.includes('mtmitchel@gmail.com')) return 1;
                  return a.summary?.localeCompare(b.summary || '') || 0;
                })
                .map(cal => (
                  <option key={cal.id} value={cal.id}>{cal.summary}</option>
                ))}
            </select>
          </div>

          {/* Date & Time */}
          <div>
            <label style={{ ...asanaTypography.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Clock size={14} />
              Date and time
            </label>
            
            {/* All Day Checkbox */}
            <div className="mb-4">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="w-4 h-4 rounded border-2 border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span style={asanaTypography.body}>All day</span>
              </label>
            </div>

            {/* Date/Time Inputs */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border transition-all"
                   style={{ 
                    ...asanaTypography.body,
                    backgroundColor: 'var(--asana-bg-input)',
                    borderColor: 'transparent',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                />
                {!allDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="px-4 py-3 rounded-xl border transition-all"
                    style={{ 
                      ...asanaTypography.body,
                      backgroundColor: '#F6F7F8',
                      borderColor: 'transparent',
                      outline: 'none',
                      width: '140px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = '#FFFFFF';
                      e.currentTarget.style.borderColor = '#796EFF';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = '#F6F7F8';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                )}
              </div>
              
              <div className="flex items-center">
                 <span style={{ ...asanaTypography.body, color: 'var(--asana-text-tertiary)', minWidth: '30px' }}>to</span>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border transition-all"
                   style={{ 
                    ...asanaTypography.body,
                    backgroundColor: 'var(--asana-bg-input)',
                    borderColor: 'transparent',
                    outline: 'none'
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                    e.currentTarget.style.borderColor = 'transparent';
                  }}
                />
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="px-4 py-3 rounded-xl border transition-all"
                     style={{ 
                      ...asanaTypography.body,
                      backgroundColor: 'var(--asana-bg-input)',
                      borderColor: 'transparent',
                      outline: 'none',
                      width: '140px'
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                      e.currentTarget.style.borderColor = 'var(--accent-primary)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                      e.currentTarget.style.borderColor = 'transparent';
                    }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* Recurring */}
          <div>
            <label style={{ ...asanaTypography.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Repeat size={14} />
              Repeat
            </label>
            
            <select 
              value={recurrenceRule} 
              onChange={(e) => {
                setRecurrenceRule(e.target.value);
                setRecurring(e.target.value !== 'none');
              }}
              className="w-full px-3 py-2 rounded-lg border transition-all cursor-pointer"
                   style={{ 
                    ...asanaTypography.body,
                    backgroundColor: 'var(--asana-bg-input)',
                    borderColor: 'transparent',
                outline: 'none'
              }}
              onFocus={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                    e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              <option value="none">Does not repeat</option>
              <option value="daily">Daily</option>
              <option value="weekdays">Every weekday (Monday to Friday)</option>
              <option value="weekly">Weekly</option>
              <option value="biweekly">Every 2 weeks</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="custom">Custom...</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label style={{ ...asanaTypography.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <MapPin size={14} />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="w-full px-4 py-3 rounded-xl border transition-all"
                 style={{ 
                  ...asanaTypography.body,
                  backgroundColor: 'var(--asana-bg-input)',
                  borderColor: 'transparent',
                outline: 'none'
              }}
              onFocus={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
                  e.currentTarget.style.borderColor = 'var(--accent-primary)';
              }}
              onBlur={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ ...asanaTypography.label, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <FileText size={14} />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              className="w-full px-4 py-3 rounded-xl border transition-all resize-none"
              style={{ 
                ...asanaTypography.body,
                backgroundColor: '#F6F7F8',
                borderColor: 'transparent',
                outline: 'none',
                minHeight: '100px'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#796EFF';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
                e.currentTarget.style.borderColor = 'transparent';
              }}
              rows={3}
            />
          </div>
        </div>

        {/* Footer */}
          <div className="flex items-center justify-between p-6" style={{ borderTop: '1px solid var(--asana-border-default)' }}>
          <div>
            {event && onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                style={{ color: 'var(--status-error)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--error-ghost)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl transition-colors"
              style={{ 
                ...asanaTypography.body,
                backgroundColor: 'var(--asana-bg-input)',
                color: 'var(--asana-text-secondary)',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--state-hover)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl transition-all"
              style={{ 
                ...asanaTypography.body,
                backgroundColor: 'var(--accent-primary)',
                color: '#FFFFFF',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-secondary)';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--accent-primary)';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              {event ? 'Save changes' : 'Create event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
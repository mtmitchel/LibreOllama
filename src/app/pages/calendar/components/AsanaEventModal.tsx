import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Link, FileText, Trash2 } from 'lucide-react';
import { AsanaEventModalProps } from '../types';

// Asana-style typography
const asanaTypography = {
  h1: {
    fontSize: '24px',
    fontWeight: 600,
    letterSpacing: '-0.01em',
    lineHeight: 1.3,
    color: '#151B26'
  },
  h2: {
    fontSize: '16px',
    fontWeight: 600,
    letterSpacing: '0',
    lineHeight: 1.4,
    color: '#151B26'
  },
  body: {
    fontSize: '14px',
    fontWeight: 400,
    lineHeight: 1.6,
    letterSpacing: '0',
    color: '#6B6F76'
  },
  label: {
    fontSize: '11px',
    fontWeight: 600,
    letterSpacing: '0.08em',
    color: '#6B6F76'
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
        start = new Date(event.start.dateTime || event.start.date);
        end = event.end ? new Date(event.end.dateTime || event.end.date) : new Date();
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
      const now = new Date();
      const later = new Date(now.getTime() + 60 * 60 * 1000);
      setStartDate(now.toISOString().split('T')[0]);
      setStartTime(now.toTimeString().slice(0, 5));
      setEndDate(now.toISOString().split('T')[0]);
      setEndTime(later.toTimeString().slice(0, 5));
    }
  }, [event]);

  const handleSubmit = () => {
    if (!title.trim()) {
      alert('Please enter a title for the event');
      return;
    }

    const eventData: any = {
      title: title,  // Add title field
      summary: title,
      location,
      description,
      calendarId: selectedCalendar,
    };

    if (event?.id) {
      eventData.id = event.id;
    }

    if (allDay) {
      eventData.start = { date: startDate };
      // IMPORTANT: Do NOT add a day here - the backend expects the actual end date
      // The transformation happens in useCalendarOperations for FullCalendar display
      eventData.end = { date: endDate };
    } else {
      eventData.start = { dateTime: `${startDate}T${startTime}:00` };
      eventData.end = { dateTime: `${endDate}T${endTime}:00` };
    }

    console.log('📅 [AsanaEventModal] Submitting event:', eventData);
    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.25)' }}>
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto bg-white rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6" style={{ borderBottom: '1px solid #E8E8E9' }}>
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
        <div className="p-6 space-y-5">
          {/* Title */}
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="w-full px-4 py-3 rounded-xl border transition-all text-lg font-medium"
              style={{ 
                backgroundColor: '#F6F7F8',
                borderColor: 'transparent',
                outline: 'none',
                fontSize: '18px',
                fontWeight: 500,
                color: '#151B26'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#796EFF';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
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
                backgroundColor: '#F6F7F8',
                borderColor: 'transparent',
                outline: 'none'
              }}
              onFocus={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#796EFF';
              }}
              onBlur={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
                e.currentTarget.style.borderColor = 'transparent';
              }}
            >
              {calendars.map(cal => (
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
                    backgroundColor: '#F6F7F8',
                    borderColor: 'transparent',
                    outline: 'none'
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
                <span style={{ ...asanaTypography.body, color: '#9CA6AF', minWidth: '30px' }}>to</span>
              </div>
              
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-xl border transition-all"
                  style={{ 
                    ...asanaTypography.body,
                    backgroundColor: '#F6F7F8',
                    borderColor: 'transparent',
                    outline: 'none'
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
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
            </div>
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
                backgroundColor: '#F6F7F8',
                borderColor: 'transparent',
                outline: 'none'
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
        <div className="flex items-center justify-between p-6" style={{ borderTop: '1px solid #E8E8E9' }}>
          <div>
            {event && onDelete && (
              <button
                onClick={() => onDelete(event.id)}
                className="px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
                style={{ 
                  color: '#D32F2F'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#FFE5E5';
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
                backgroundColor: '#F6F7F8',
                color: '#6B6F76',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#E8E9EA';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F6F7F8';
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-5 py-2.5 rounded-xl transition-all"
              style={{ 
                ...asanaTypography.body,
                backgroundColor: '#796EFF',
                color: '#FFFFFF',
                fontWeight: 500
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#6B5FE6';
                e.currentTarget.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#796EFF';
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
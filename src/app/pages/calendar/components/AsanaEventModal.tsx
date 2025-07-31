import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, Link, FileText, Trash2 } from 'lucide-react';
import { AsanaEventModalProps } from '../types';

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
      
      const start = event.start ? new Date(event.start.dateTime || event.start.date) : new Date();
      const end = event.end ? new Date(event.end.dateTime || event.end.date) : new Date();
      
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
    const eventData: any = {
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
      eventData.end = { date: endDate };
    } else {
      eventData.start = { dateTime: `${startDate}T${startTime}:00` };
      eventData.end = { dateTime: `${endDate}T${endTime}:00` };
    }

    onSave(eventData);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="cal-modal-overlay">
      <div className="cal-modal" style={{ maxHeight: '90vh', overflow: 'auto' }}>
        <div className="cal-modal-header">
          <h2 className="cal-modal-title">{event ? 'Edit Event' : 'New Event'}</h2>
          <button onClick={onClose} className="cal-modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="cal-modal-content">
          <div className="cal-form-group">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Add title"
              className="cal-input cal-input-title"
              autoFocus
            />
          </div>

          <div className="cal-form-group">
            <label className="cal-label">
              <Calendar size={16} />
              Calendar
            </label>
            <select 
              value={selectedCalendar} 
              onChange={(e) => setSelectedCalendar(e.target.value)}
              className="cal-select"
            >
              {calendars.map(cal => (
                <option key={cal.id} value={cal.id}>{cal.summary}</option>
              ))}
            </select>
          </div>

          <div className="cal-form-group">
            <label className="cal-label">
              <Clock size={16} />
              Date & Time
            </label>
            <div className="cal-checkbox-group">
              <label className="cal-checkbox-label">
                <input
                  type="checkbox"
                  checked={allDay}
                  onChange={(e) => setAllDay(e.target.checked)}
                  className="cal-checkbox"
                />
                All day
              </label>
            </div>
            <div className="cal-date-time-group">
              <div className="cal-date-time-row">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="cal-input"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="cal-input"
                  />
                )}
              </div>
              <span className="cal-date-separator">to</span>
              <div className="cal-date-time-row">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="cal-input"
                />
                {!allDay && (
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="cal-input"
                  />
                )}
              </div>
            </div>
          </div>

          <div className="cal-form-group">
            <label className="cal-label">
              <MapPin size={16} />
              Location
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Add location"
              className="cal-input"
            />
          </div>

          <div className="cal-form-group">
            <label className="cal-label">
              <FileText size={16} />
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add description"
              className="cal-textarea"
              rows={3}
            />
          </div>
        </div>

        <div className="cal-modal-footer">
          <div className="cal-modal-actions-left">
            {event && onDelete && (
              <button onClick={() => onDelete(event.id)} className="cal-button cal-button-danger">
                <Trash2 size={16} />
                Delete
              </button>
            )}
          </div>
          <div className="cal-modal-actions">
            <button onClick={onClose} className="cal-button cal-button-secondary">
              Cancel
            </button>
            <button onClick={handleSubmit} className="cal-button cal-button-primary">
              {event ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
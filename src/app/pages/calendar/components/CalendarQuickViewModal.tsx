import React from 'react';
import { X, Calendar, Clock, MapPin, Edit2, Trash2, CheckCircle2, Circle, Check } from 'lucide-react';
import { format } from 'date-fns';
import { CalendarEvent } from '../types/calendar';

interface CalendarQuickViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  position?: { x: number; y: number };
  // For single event/task view
  event?: CalendarEvent | null;
  onEdit?: (event: CalendarEvent) => void;
  onDelete?: (eventId: string) => void;
  onToggleComplete?: (event: CalendarEvent) => void;
  // For "more" items view
  events?: CalendarEvent[];
  date?: Date;
  onEventClick?: (event: CalendarEvent) => void;
}

export const CalendarQuickViewModal: React.FC<CalendarQuickViewModalProps> = ({
  isOpen,
  onClose,
  position,
  event,
  events,
  date,
  onEdit,
  onDelete,
  onToggleComplete,
  onEventClick
}) => {
  if (!isOpen) return null;

  const isTask = (e: CalendarEvent) => e.type === 'task' || e.extendedProps?.type === 'task';
  const isCompleted = (e: CalendarEvent) => e.isCompleted || e.extendedProps?.isCompleted;

  // Calculate modal position to keep it within viewport
  const calculatePosition = () => {
    if (!position) return {};
    
    const modalWidth = 300;
    const modalHeight = 250;
    const padding = 20;
    
    let left = position.x;
    let top = position.y;
    
    // Adjust if modal would go off right edge
    if (left + modalWidth > window.innerWidth - padding) {
      left = window.innerWidth - modalWidth - padding;
    }
    
    // Adjust if modal would go off bottom
    if (top + modalHeight > window.innerHeight - padding) {
      top = position.y - modalHeight - 10;
    }
    
    return {
      position: 'fixed' as const,
      left: `${left}px`,
      top: `${top}px`,
      zIndex: 9999
    };
  };

  const formatEventTime = (e: CalendarEvent) => {
    if (e.allDay) return 'All day';
    
    const start = e.start instanceof Date ? e.start : new Date(e.start);
    const end = e.end instanceof Date ? e.end : new Date(e.end);
    
    return `${format(start, 'h:mm a')} - ${format(end, 'h:mm a')}`;
  };

  const getCalendarName = (e: CalendarEvent) => {
    return e.extendedProps?.calendarName || e.calendarId || 'Calendar';
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-50" 
        onClick={onClose}
      />
      
      {/* Modal */}
      <div 
        className="bg-white rounded-lg shadow-xl border border-gray-200 w-[300px] max-h-[400px] overflow-hidden relative"
        style={calculatePosition()}
      >
        {/* Single Event/Task View */}
        {event && !events && (
          <div className="p-4">
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-start gap-2 flex-1">
                {isTask(event) && (
                  <button
                    onClick={() => onToggleComplete?.(event)}
                    className="mt-1 flex-shrink-0"
                  >
                    <div className={`w-[18px] h-[18px] rounded-full border-2 ${isCompleted(event) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'} flex items-center justify-center`}>
                      <Check size={12} className={isCompleted(event) ? "text-white" : "text-gray-400"} />
                    </div>
                  </button>
                )}
                <h3 className={`font-semibold text-gray-900 ${isCompleted(event) ? 'line-through text-gray-500' : ''}`}>
                  {event.title}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Event Details */}
            <div className="space-y-2 text-sm">
              {/* Date & Time */}
              <div className="flex items-center gap-2 text-gray-600">
                <Clock size={14} />
                <span>{formatEventTime(event)}</span>
              </div>

              {/* Calendar */}
              {!isTask(event) && (
                <div className="flex items-center gap-2 text-gray-600">
                  <Calendar size={14} />
                  <span>{getCalendarName(event)}</span>
                </div>
              )}

              {/* Location */}
              {event.location && (
                <div className="flex items-center gap-2 text-gray-600">
                  <MapPin size={14} />
                  <span>{event.location}</span>
                </div>
              )}

              {/* Description */}
              {event.extendedProps?.description && (
                <div className="mt-3 text-gray-600">
                  <p className="line-clamp-3">{event.extendedProps.description}</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100">
              <button
                onClick={() => onEdit?.(event)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
              >
                <Edit2 size={14} />
                Edit
              </button>
              {onDelete && (
                <button
                  onClick={() => onDelete(event.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              )}
            </div>
          </div>
        )}

        {/* Multiple Events View (for "more" items) */}
        {events && events.length > 0 && (
          <div className="p-3">
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 p-1"
            >
              <X size={16} />
            </button>

            {/* Events List */}
            <div className="space-y-3 max-h-[350px] overflow-y-auto">
              {/* Separate events and tasks */}
              {(() => {
                const eventItems = events.filter(e => !isTask(e));
                const taskItems = events.filter(e => isTask(e));
                
                return (
                  <>
                    {/* Events Section */}
                    {eventItems.length > 0 && (
                      <div>
                        <h4 className="text-xs font-medium text-gray-500 mb-1.5">Events</h4>
                        <div className="space-y-1">
                          {eventItems.map((e) => (
                            <div
                              key={e.id}
                              className="p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => onEventClick?.(e)}
                            >
                              <div className="flex items-start gap-2">
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-gray-900 truncate">
                                    {e.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {formatEventTime(e)} • {getCalendarName(e)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Tasks Section */}
                    {taskItems.length > 0 && (
                      <div className={eventItems.length > 0 ? "mt-3" : ""}>
                        <h4 className="text-xs font-medium text-gray-500 mb-1.5">Tasks</h4>
                        <div className="space-y-1">
                          {taskItems.map((e) => (
                            <div
                              key={e.id}
                              className="p-2 rounded-md hover:bg-gray-50 cursor-pointer transition-colors"
                              onClick={() => onEventClick?.(e)}
                            >
                              <div className="flex items-start gap-2">
                                <button
                                  onClick={(ev) => {
                                    ev.stopPropagation();
                                    onComplete?.(e);
                                  }}
                                  className="mt-0.5 flex-shrink-0"
                                >
                                  <div className={`w-4 h-4 rounded-full border-2 ${isCompleted(e) ? 'bg-green-600 border-green-600' : 'bg-white border-gray-400'} flex items-center justify-center`}>
                                    <Check size={10} className={isCompleted(e) ? "text-white" : "text-gray-400"} />
                                  </div>
                                </button>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-sm font-medium text-gray-900 truncate ${isCompleted(e) ? 'line-through text-gray-500' : ''}`}>
                                    {e.title}
                                  </p>
                                  <p className="text-xs text-gray-500 mt-0.5">
                                    {formatEventTime(e)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
          </div>
        )}
      </div>
    </>
  );
};
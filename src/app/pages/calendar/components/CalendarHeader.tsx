import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, ListChecks, Calendar } from 'lucide-react';
import { AsanaDatePicker } from './AsanaDatePicker';
import { AsanaViewControls } from './AsanaViewControls';
import { AsanaSearchBar } from './AsanaSearchBar';

interface CalendarHeaderProps {
  currentDate: Date;
  currentViewTitle: string;
  view: string;
  showTasksSidebar: boolean;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: string) => void;
  onToggleTasksSidebar: () => void;
  onNewEvent: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  currentViewTitle,
  view,
  showTasksSidebar,
  onNavigate,
  onDateSelect,
  onViewChange,
  onToggleTasksSidebar,
  onNewEvent,
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
        setShowDatePicker(false);
      }
    };

    if (showDatePicker) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showDatePicker]);

  return (
    <div className="flex items-center px-6 py-3" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E8E8E9' }}>
      {/* Left side - Today, Navigation and Title */}
      <div className="flex items-center gap-4" style={{ flex: '1 1 0' }}>
        <button
          className="px-4 py-1.5 text-sm font-medium rounded-md transition-colors"
          style={{
            backgroundColor: '#796EFF',
            color: 'white',
          }}
          onClick={() => onNavigate('today')}
        >
          Today
        </button>
        
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => onNavigate('prev')}
            aria-label="Previous"
          >
            <ChevronLeft size={18} style={{ color: '#6B6F76' }} />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => onNavigate('next')}
            aria-label="Next"
          >
            <ChevronRight size={18} style={{ color: '#6B6F76' }} />
          </button>
        </div>
        
        <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1E1E1F' }}>
          {currentViewTitle}
        </h2>
      </div>
      
      {/* Center - Search */}
      <div className="flex items-center justify-center" style={{ flex: '1 1 0' }}>
        <AsanaSearchBar 
          placeholder="Search calendar..." 
          value=""
          onChange={() => {}}
        />
      </div>
      
      {/* Right side - View Controls and New Event */}
      <div className="flex items-center gap-4 justify-end" style={{ flex: '1 1 0' }}>
        <div className="relative" ref={datePickerRef}>
          <button
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Go to date"
          >
            <Calendar size={18} style={{ color: '#6B6F76' }} />
          </button>
          
          {showDatePicker && (
            <AsanaDatePicker 
              value={currentDate.toISOString().split('T')[0]} 
              onChange={(dateStr) => {
                onDateSelect(new Date(dateStr));
                setShowDatePicker(false);
              }}
              onClose={() => setShowDatePicker(false)}
            />
          )}
        </div>
        
        <AsanaViewControls 
          view={view} 
          onViewChange={onViewChange} 
        />
        
        <button
          className={`p-2 rounded-md transition-colors ${
            showTasksSidebar 
              ? 'bg-blue-50 text-blue-600' 
              : 'hover:bg-gray-100 text-gray-600'
          }`}
          onClick={onToggleTasksSidebar}
          title={showTasksSidebar ? "Hide tasks" : "Show tasks"}
        >
          <ListChecks size={18} />
        </button>
        
        <button
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-colors"
          style={{
            backgroundColor: '#796EFF',
          }}
          onClick={onNewEvent}
        >
          <Plus size={18} />
          New event
        </button>
      </div>
    </div>
  );
};
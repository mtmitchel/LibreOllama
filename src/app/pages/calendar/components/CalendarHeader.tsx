import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Plus, ListChecks, Calendar, Search, X } from 'lucide-react';
import { AsanaDatePicker } from './AsanaDatePicker';
import { AsanaViewControls } from './AsanaViewControls';
import { Button } from '../../../../components/ui';

interface CalendarHeaderProps {
  currentDate: Date;
  currentViewTitle: string;
  view: string;
  showTasksSidebar: boolean;
  searchQuery?: string;
  onNavigate: (direction: 'prev' | 'next' | 'today') => void;
  onDateSelect: (date: Date) => void;
  onViewChange: (view: string) => void;
  onToggleTasksSidebar: () => void;
  onNewEvent: () => void;
  onSearchChange?: (query: string) => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  currentViewTitle,
  view,
  showTasksSidebar,
  searchQuery = '',
  onNavigate,
  onDateSelect,
  onViewChange,
  onToggleTasksSidebar,
  onNewEvent,
  onSearchChange,
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
    <div className="flex items-center px-6 py-3" style={{ backgroundColor: 'var(--asana-bg-primary)', borderBottom: '1px solid var(--asana-border-default)' }}>
      {/* Left side - Today, Navigation and Title */}
      <div className="flex items-center gap-4" style={{ flex: '1 1 0' }}>
        <Button
          variant="primary"
          size="sm"
          onClick={() => onNavigate('today')}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500
          }}
        >
          Today
        </Button>
        
        <div className="flex items-center gap-1">
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => onNavigate('prev')}
            aria-label="Previous"
          >
            <ChevronLeft size={18} style={{ color: 'var(--asana-text-secondary)' }} />
          </button>
          <button
            className="p-1 rounded hover:bg-gray-100 transition-colors"
            onClick={() => onNavigate('next')}
            aria-label="Next"
          >
            <ChevronRight size={18} style={{ color: 'var(--asana-text-secondary)' }} />
          </button>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 500, color: 'var(--asana-text-primary)', margin: 0 }}>
            {currentViewTitle}
          </h2>
          
          {/* Timezone label for day/week views */}
          {(view === 'timeGridWeek' || view === 'timeGridDay') && (
            <span style={{ fontSize: '11px', color: 'var(--asana-text-secondary)', marginTop: '2px', fontWeight: 400 }}>
              {Intl.DateTimeFormat().resolvedOptions().timeZone}
            </span>
          )}
        </div>
      </div>
      
      {/* Center - Search */}
      <div className="relative max-w-md flex-1 mx-6">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--asana-text-placeholder)' }} />
        <input
          type="search"
          placeholder="Search events"
          value={searchQuery}
          onChange={(e) => onSearchChange?.(e.target.value)}
          className="pl-10 pr-4 py-2 rounded-xl outline-none transition-all w-full"
          style={{ fontSize: '14px', backgroundColor: 'var(--asana-bg-input)', border: '1px solid transparent' }}
          onFocus={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--asana-bg-primary)';
            e.currentTarget.style.borderColor = 'var(--asana-border-hover)';
          }}
          onBlur={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--asana-bg-input)';
            e.currentTarget.style.borderColor = 'transparent';
          }}
        />
        {searchQuery && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-200 transition-colors"
            onClick={() => onSearchChange?.('')}
          >
            <X size={14} />
          </button>
        )}
      </div>
      
      {/* Right side - View Controls and New Event */}
      <div className="flex items-center gap-4 justify-end" style={{ flex: '1 1 0' }}>
        <div className="relative" ref={datePickerRef}>
          <button
            className="p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setShowDatePicker(!showDatePicker)}
            title="Go to date"
          >
            <Calendar size={18} style={{ color: 'var(--asana-text-secondary)' }} />
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
        
        <Button 
          variant="primary" 
          size="sm"
          onClick={onNewEvent}
          style={{
            backgroundColor: 'var(--accent-primary)',
            color: '#FFFFFF',
            padding: '8px 16px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <Plus size={16} />
          New event
        </Button>
      </div>
    </div>
  );
};
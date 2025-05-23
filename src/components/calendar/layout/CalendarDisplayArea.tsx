
"use client";

import React from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import MonthView from '@/components/calendar/views/MonthView';
import WeekView from '@/components/calendar/views/WeekView';
import DayView from '@/components/calendar/views/DayView';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function CalendarDisplayArea() {
  const { currentViewMode } = useCalendar();

  const renderView = () => {
    switch (currentViewMode) {
      case 'day':
        return <DayView />;
      case 'week':
        return <WeekView />;
      case 'month':
      default:
        return <MonthView />;
    }
  };

  return (
    <ScrollArea className="flex-1 bg-background"> 
      {/* The ScrollArea wraps the view. Individual views (Day/Week) might need internal scrolling too. */}
      <div className="h-full w-full"> {/* Ensure content tries to take full height and width */}
        {renderView()}
      </div>
    </ScrollArea>
  );
}


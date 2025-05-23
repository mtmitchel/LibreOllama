
"use client";

import React, { useMemo } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Search, HelpCircle, Settings, CalendarDays, GripHorizontal, PanelLeft, PanelRight } from 'lucide-react';
import type { CalendarViewMode } from '@/lib/types';
import { format, startOfWeek, endOfWeek } from 'date-fns'; // Ensure all used date-fns are imported

interface CalendarPageHeaderProps {
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  isLeftPanelOpen: boolean;
  isRightPanelOpen: boolean;
}

export default function CalendarPageHeader({ 
  toggleLeftPanel, 
  toggleRightPanel,
  isLeftPanelOpen,
  isRightPanelOpen
}: CalendarPageHeaderProps) {
  const { 
    currentDate, 
    currentViewMode, 
    setCurrentViewMode,
    goToPreviousPeriod,
    goToNextPeriod,
    goToToday,
  } = useCalendar();

  const formattedDate = useMemo(() => {
    // Ensure weekStartsOn: 1 (Monday) if that's the desired behavior, or adapt as needed.
    // The default for date-fns startOfWeek/endOfWeek might vary based on locale if not specified.
    const weekOptions = { weekStartsOn: 1 as const }; // Explicitly set week start day

    switch (currentViewMode) {
      case 'day':
        return format(currentDate, 'MMMM d, yyyy');
      case 'week':
        const start = format(startOfWeek(currentDate, weekOptions), 'MMM d');
        const end = format(endOfWeek(currentDate, weekOptions), 'MMM d, yyyy');
        return `${start} - ${end}`;
      case 'month':
      default:
        return format(currentDate, 'MMMM yyyy');
    }
  }, [currentDate, currentViewMode]);


  return (
    <header className="flex items-center justify-between p-2 border-b h-16 flex-shrink-0 bg-card">
      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="ghost" size="icon" onClick={toggleLeftPanel} className="lg:hidden" aria-label={isLeftPanelOpen ? "Collapse left panel" : "Expand left panel"}>
          <PanelLeft className="h-5 w-5" />
        </Button>
        <CalendarDays className="h-7 w-7 md:h-8 md:w-8 text-primary" />
        <span className="text-lg md:text-xl font-medium hidden sm:inline">Calendar</span>
      </div>

      <div className="flex items-center gap-1 md:gap-2">
        <Button variant="outline" size="sm" onClick={goToToday}>Today</Button>
        <Button variant="ghost" size="icon" onClick={goToPreviousPeriod}><ChevronLeft className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" onClick={goToNextPeriod}><ChevronRight className="h-5 w-5" /></Button>
        <span className="text-base md:text-lg font-medium w-36 sm:w-48 text-center truncate">{formattedDate}</span>
      </div>

      <div className="flex items-center gap-0.5 md:gap-1">
        <Button variant="ghost" size="icon" aria-label="Search" disabled><Search className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label="Help" disabled><HelpCircle className="h-5 w-5" /></Button>
        <Button variant="ghost" size="icon" aria-label="Settings" disabled><Settings className="h-5 w-5" /></Button>
        
        <Select 
            value={currentViewMode} 
            onValueChange={(value) => setCurrentViewMode(value as CalendarViewMode)}
        >
          <SelectTrigger className="w-[90px] md:w-[120px] h-9 text-sm">
            <SelectValue placeholder="Select view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="day">Day</SelectItem>
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
          </SelectContent>
        </Select>
        <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleRightPanel} // Use the passed toggle function
            aria-label={isRightPanelOpen ? "Hide tasks panel" : "Show tasks panel"}
            className="lg:hidden" // This button is for mobile to toggle the right panel
        >
            <PanelRight className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
}

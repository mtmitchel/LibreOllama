
"use client";
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar as ShadCalendar } from '@/components/ui/calendar'; // Mini calendar
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, ChevronDown, ChevronUp, Users, X } from 'lucide-react'; // Added X for close
import { useCalendar } from '@/contexts/CalendarContext';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'; 
import { cn } from '@/lib/utils';

export default function CalendarLeftSidebar() {
  const { 
    currentDate, 
    setCurrentDate, 
    availableCalendars, 
    toggleCalendarVisibility,
    isLeftPanelOpen,  // Get state from context
    setIsLeftPanelOpen, // Get setter from context
    setIsEventModalOpen,
    setEditingEvent,
    setSelectedDateForNewEvent
  } = useCalendar();
  
  const [myCalendarsOpen, setMyCalendarsOpen] = useState(true);
  const [otherCalendarsOpen, setOtherCalendarsOpen] = useState(true);

  const primaryCalendars = availableCalendars.filter(c => c.type === 'primary' || c.type === 'tasks');
  const secondaryCalendars = availableCalendars.filter(c => c.type === 'secondary' && c.id !== 'tasks_cal');

  const handleCreateEvent = () => {
    setEditingEvent(null); // Clear any existing event
    setSelectedDateForNewEvent(currentDate); // Pre-fill with current date
    setIsEventModalOpen(true);
  };

  return (
    <aside className={cn(
      "border-r flex-shrink-0 flex flex-col bg-card transition-all duration-300 ease-in-out",
      isLeftPanelOpen ? "w-64 opacity-100" : "w-0 opacity-0"
    )}>
      <div className={cn("p-3 space-y-4 h-full flex flex-col", !isLeftPanelOpen && "hidden")}>
        <div className="flex justify-between items-center">
            <Popover>
                <PopoverTrigger asChild>
                <Button className="w-auto shadow-md flex-grow mr-2" size="lg" onClick={handleCreateEvent}>
                    <Plus className="mr-2 h-5 w-5" /> Create
                </Button>
                </PopoverTrigger>
                {/* Removed PopoverContent for "Create" as it's simpler now */}
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => setIsLeftPanelOpen(false)} className="lg:hidden">
                <X className="h-5 w-5" />
            </Button>
        </div>

        <div className="rounded-md border">
          <ShadCalendar
            mode="single"
            selected={currentDate}
            onSelect={(date) => date && setCurrentDate(date)}
            className="p-0"
            month={currentDate} 
            onMonthChange={setCurrentDate} 
          />
        </div>
        
        <ScrollArea className="flex-1 -mx-3">
          <div className="px-3 space-y-3">
            <div>
              <Button variant="ghost" onClick={() => setMyCalendarsOpen(!myCalendarsOpen)} className="w-full justify-between px-1 h-auto py-1 text-sm font-medium">
                My calendars
                {myCalendarsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {myCalendarsOpen && (
                <div className="pl-2 mt-1 space-y-1.5">
                  {primaryCalendars.map(cal => (
                    <div key={cal.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cal-${cal.id}`} 
                        checked={cal.isSelected} 
                        onCheckedChange={() => toggleCalendarVisibility(cal.id)}
                        style={{borderColor: cal.color, backgroundColor: cal.isSelected ? cal.color : 'transparent'}}
                        className="border-2 h-4 w-4 rounded-sm shrink-0"
                      />
                      <Label htmlFor={`cal-${cal.id}`} className="text-xs font-normal cursor-pointer truncate" style={{ color: cal.isSelected ? cal.color : 'hsl(var(--foreground))' }}>{cal.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Button variant="ghost" onClick={() => setOtherCalendarsOpen(!otherCalendarsOpen)} className="w-full justify-between px-1 h-auto py-1 text-sm font-medium">
                Other calendars
                {otherCalendarsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {otherCalendarsOpen && (
                <div className="pl-2 mt-1 space-y-1.5">
                  {secondaryCalendars.map(cal => (
                    <div key={cal.id} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`cal-${cal.id}`} 
                        checked={cal.isSelected} 
                        onCheckedChange={() => toggleCalendarVisibility(cal.id)}
                        style={{borderColor: cal.color, backgroundColor: cal.isSelected ? cal.color : 'transparent'}}
                         className="border-2 h-4 w-4 rounded-sm shrink-0"
                      />
                      <Label htmlFor={`cal-${cal.id}`} className="text-xs font-normal cursor-pointer truncate" style={{ color: cal.isSelected ? cal.color : 'hsl(var(--foreground))' }}>{cal.name}</Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}

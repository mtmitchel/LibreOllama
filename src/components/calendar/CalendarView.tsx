
"use client";

import React from 'react';
import { useCalendar } from '@/contexts/CalendarContext';
import CalendarPageHeader from '@/components/calendar/layout/CalendarPageHeader';
import CalendarLeftSidebar from '@/components/calendar/layout/CalendarLeftSidebar';
import CalendarDisplayArea from '@/components/calendar/layout/CalendarDisplayArea';
import CalendarTasksPanel from '@/components/calendar/layout/CalendarTasksPanel';
import { PanelRight, PanelLeft } from 'lucide-react'; // Added PanelLeft
import { Button } from '@/components/ui/button';

export default function CalendarView() {
  const { 
    isRightPanelOpen, 
    setIsRightPanelOpen,
    isLeftPanelOpen, // Added from context
    setIsLeftPanelOpen // Added from context
  } = useCalendar();

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden">
      {/* Pass panel toggle functions to header */}
      <CalendarPageHeader 
        toggleLeftPanel={() => setIsLeftPanelOpen(prev => !prev)}
        toggleRightPanel={() => setIsRightPanelOpen(prev => !prev)}
        isLeftPanelOpen={isLeftPanelOpen}
        isRightPanelOpen={isRightPanelOpen}
      />
      <div className="flex flex-1 overflow-hidden">
        <CalendarLeftSidebar />
        <main className="flex-1 flex flex-col overflow-hidden"> {/* Removed p-0 */}
          <CalendarDisplayArea />
        </main>
        
        {/* Mobile-only toggle for right panel - This button might need adjustment if right panel is always fixed/absolute on mobile */}
        {!isRightPanelOpen && !isLeftPanelOpen && ( // Show only if both panels are closed or adjust logic
            <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setIsRightPanelOpen(true)} 
                className="fixed top-20 right-4 z-20 bg-card shadow-md hover:bg-accent lg:hidden" 
                aria-label="Open tasks panel"
            >
                <PanelRight />
            </Button>
        )}
        <CalendarTasksPanel />
      </div>
    </div>
  );
}

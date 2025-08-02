import React, { useState, useCallback } from 'react';
import { CalendarEvent } from '../../types/calendar';

interface ResizableEventProps {
  event: CalendarEvent;
  children: React.ReactNode;
  onResize?: (eventId: string, newStart: Date, newEnd: Date) => Promise<void>;
  style?: React.CSSProperties;
  onClick?: (e: React.MouseEvent) => void;
}

export const ResizableEvent: React.FC<ResizableEventProps> = ({
  event,
  children,
  onResize,
  style,
  onClick
}) => {
  const [isResizing, setIsResizing] = useState<'top' | 'bottom' | null>(null);
  const [dragStart, setDragStart] = useState<{ y: number; startTime: Date; endTime: Date } | null>(null);
  const [hasResized, setHasResized] = useState(false);

  const handleMouseDown = useCallback((e: React.MouseEvent, edge: 'top' | 'bottom') => {
    if (!onResize) return;
    
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(edge);
    setDragStart({
      y: e.clientY,
      startTime: new Date(event.start),
      endTime: new Date(event.end)
    });
  }, [event, onResize]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing || !dragStart || !onResize) return;

    const deltaY = e.clientY - dragStart.y;
    // Check if user has moved the mouse enough to consider it a resize
    if (Math.abs(deltaY) > 5) {
      setHasResized(true);
    }

    // Assuming 60px per hour (adjust based on your calendar's hour height)
    const hourHeight = 60;
    const deltaMinutes = Math.round((deltaY / hourHeight) * 60);

    let newStart = new Date(dragStart.startTime);
    let newEnd = new Date(dragStart.endTime);

    if (isResizing === 'top') {
      // Resizing from top - change start time
      newStart = new Date(newStart.getTime() + deltaMinutes * 60 * 1000);
      // Ensure minimum duration of 15 minutes
      if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
        newStart = new Date(newEnd.getTime() - 15 * 60 * 1000);
      }
    } else {
      // Resizing from bottom - change end time
      newEnd = new Date(newEnd.getTime() + deltaMinutes * 60 * 1000);
      // Ensure minimum duration of 15 minutes
      if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
        newEnd = new Date(newStart.getTime() + 15 * 60 * 1000);
      }
    }
  }, [isResizing, dragStart, onResize]);

  const handleMouseUp = useCallback(async (e: MouseEvent) => {
    if (!isResizing || !dragStart || !onResize) return;

    const deltaY = e.clientY - dragStart.y;
    const hourHeight = 60;
    const deltaMinutes = Math.round((deltaY / hourHeight) * 60);

    let newStart = new Date(dragStart.startTime);
    let newEnd = new Date(dragStart.endTime);

    if (isResizing === 'top') {
      newStart = new Date(newStart.getTime() + deltaMinutes * 60 * 1000);
      if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
        newStart = new Date(newEnd.getTime() - 15 * 60 * 1000);
      }
    } else {
      newEnd = new Date(newEnd.getTime() + deltaMinutes * 60 * 1000);
      if (newEnd.getTime() - newStart.getTime() < 15 * 60 * 1000) {
        newEnd = new Date(newStart.getTime() + 15 * 60 * 1000);
      }
    }

    try {
      await onResize(event.id, newStart, newEnd);
    } catch (error) {
      console.error('Failed to resize event:', error);
    }

    setIsResizing(null);
    setDragStart(null);
    
    // Reset hasResized after a short delay to prevent click event
    setTimeout(() => {
      setHasResized(false);
    }, 100);
  }, [isResizing, dragStart, event, onResize]);

  // Attach global mouse event listeners when resizing
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    // Don't trigger click if we just finished resizing
    if (hasResized) {
      e.stopPropagation();
      e.preventDefault();
      return;
    }
    onClick?.(e);
  }, [hasResized, onClick]);

  return (
    <div 
      style={style} 
      onClick={handleClick}
      className="relative"
    >
      {/* Top resize handle */}
      {onResize && (
        <div
          className="absolute top-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-400 hover:opacity-50 transition-opacity z-10"
          onMouseDown={(e) => handleMouseDown(e, 'top')}
        />
      )}
      
      {/* Event content */}
      <div className="h-full">
        {children}
      </div>
      
      {/* Bottom resize handle */}
      {onResize && (
        <div
          className="absolute bottom-0 left-0 right-0 h-1 cursor-ns-resize hover:bg-blue-400 hover:opacity-50 transition-opacity z-10"
          onMouseDown={(e) => handleMouseDown(e, 'bottom')}
        />
      )}
    </div>
  );
};
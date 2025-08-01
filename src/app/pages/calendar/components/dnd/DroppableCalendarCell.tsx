import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableCalendarCellProps {
  date: Date;
  time?: Date;
  children: React.ReactNode;
  className?: string;
}

export const DroppableCalendarCell: React.FC<DroppableCalendarCellProps> = ({ 
  date, 
  time, 
  children, 
  className = '' 
}) => {
  const { isOver, setNodeRef } = useDroppable({
    id: `cell-${date.toISOString()}-${time?.toISOString() || 'allday'}`,
    data: {
      date,
      time,
      allDay: !time
    }
  });
  
  return (
    <div 
      ref={setNodeRef} 
      className={`
        ${className}
        ${isOver ? 'bg-blue-100 ring-2 ring-blue-400' : ''}
        transition-all duration-150
      `}
    >
      {children}
    </div>
  );
};
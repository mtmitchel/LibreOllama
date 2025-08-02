import React from 'react';
import { useDroppable } from '@dnd-kit/core';

interface DroppableCalendarCellProps {
  date: Date;
  time?: Date;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  onDrop?: (event: any, date: Date) => void; // Not used directly by dnd-kit
  style?: React.CSSProperties;
}

export const DroppableCalendarCell: React.FC<DroppableCalendarCellProps> = ({ 
  date, 
  time, 
  children, 
  className = '',
  onClick,
  style
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
      onClick={onClick}
      style={style}
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
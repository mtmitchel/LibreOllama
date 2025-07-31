import React from 'react';

type CalendarView = 'dayGridMonth' | 'timeGridWeek' | 'timeGridDay' | 'listWeek';

interface AsanaViewControlsProps {
  view: string;
  onViewChange: (view: string) => void;
}

export const AsanaViewControls: React.FC<AsanaViewControlsProps> = ({ 
  view: currentView, 
  onViewChange
}) => {
  const viewOptions = [
    { value: 'dayGridMonth', label: 'Month' },
    { value: 'timeGridWeek', label: 'Week' },
    { value: 'timeGridDay', label: 'Day' },
  ] as const;

  return (
    <div className="cal-asana-view-controls">
      {viewOptions.map(option => (
        <button
          key={option.value}
          className={`cal-asana-view-btn ${currentView === option.value ? 'active' : ''}`}
          onClick={() => onViewChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
};
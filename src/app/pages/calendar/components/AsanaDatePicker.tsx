import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface AsanaDatePickerProps {
  value: string;
  onChange: (date: string) => void;
  onClose?: () => void;
}

export const AsanaDatePicker: React.FC<AsanaDatePickerProps> = ({ 
  value, 
  onChange, 
  onClose 
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const selectedDate = value ? new Date(value + 'T00:00') : null;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];
  
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    // Add previous month's trailing days
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const day = new Date(year, month, -i);
      days.push({ date: day, isCurrentMonth: false });
    }
    // Add current month's days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({ date: new Date(year, month, i), isCurrentMonth: true });
    }
    // Add next month's leading days to fill the grid
    const remainingDays = 42 - days.length; // 6 weeks * 7 days
    for (let i = 1; i <= remainingDays; i++) {
      days.push({ date: new Date(year, month + 1, i), isCurrentMonth: false });
    }
    
    return days;
  };
  
  const handleDateClick = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    onChange(dateStr);
    onClose?.();
  };
  
  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };
  
  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };
  
  return (
    <div className="absolute z-50 mt-2 right-0 bg-white rounded-lg shadow-lg border border-gray-200 p-4" style={{ minWidth: '300px' }}>
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronLeft size={20} />
        </button>
        <h3 className="text-base font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          className="p-1 hover:bg-gray-100 rounded"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
          <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {getDaysInMonth(currentMonth).map((day, index) => (
          <button
            key={index}
            onClick={() => handleDateClick(day.date)}
            className={`
              p-2 text-sm rounded-lg transition-colors
              ${!day.isCurrentMonth ? 'text-gray-400' : 'text-gray-700'}
              ${isToday(day.date) ? 'font-semibold' : ''}
              ${isSelected(day.date) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'}
            `}
            disabled={!day.isCurrentMonth}
          >
            {day.date.getDate()}
          </button>
        ))}
      </div>
      
      <div className="mt-4 pt-2 border-t flex items-center justify-between">
        <button
          onClick={() => {
            const today = new Date().toISOString().split('T')[0];
            onChange(today);
            onClose?.();
          }}
          className="text-sm text-blue-600 hover:text-blue-700"
        >
          Today
        </button>
        <button
          onClick={() => {
            onChange('');
            onClose?.();
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
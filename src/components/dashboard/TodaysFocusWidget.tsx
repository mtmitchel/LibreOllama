import React from 'react';
import { Card } from '../ui';
import { DropdownMenu, DropdownMenuItem, DropdownMenuSeparator } from '../ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';
import { FocusItem } from '../../lib/mockData';

interface TodaysFocusWidgetProps {
  items: FocusItem[];
}

export const TodaysFocusWidget: React.FC<TodaysFocusWidgetProps> = ({ items }) => {
  const handleAddEvent = () => {
    console.log('Add new event');
  };

  const handleViewCalendar = () => {
    console.log('View full calendar');
  };

  const handleEditSchedule = () => {
    console.log('Edit schedule');
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-text-primary">Today's focus</h3>        <DropdownMenu
          trigger={
            <div className="flex items-center justify-center w-8 h-8 text-text-secondary hover:text-text-primary hover:bg-bg-secondary rounded-md transition-colors cursor-pointer">
              <MoreHorizontal className="w-4 h-4" />
            </div>
          }
        >
          <DropdownMenuItem onClick={handleAddEvent}>
            Add new event
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleViewCalendar}>
            View full calendar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleEditSchedule}>
            Edit schedule
          </DropdownMenuItem>
        </DropdownMenu>
      </div>
      <ul className="space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-start gap-3">
            <div className="flex flex-col items-center text-center min-w-[50px] pt-0.5">
              <div className="text-sm font-semibold text-text-primary">{item.time.split(' ')[0]}</div>
              <div className="text-xs text-text-secondary font-medium">{item.time.split(' ')[1]}</div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-text-primary mb-1">{item.title}</div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 ${item.color} rounded-full flex-shrink-0`}></div>
                <span className="text-xs text-text-secondary">{item.team}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

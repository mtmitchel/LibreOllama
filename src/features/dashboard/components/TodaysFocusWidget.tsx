import React from 'react';
import { Card, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';
import { FocusItem } from '../../../core/lib/mockData';

interface TodaysFocusWidgetProps {
  items: FocusItem[];
  onToggle: (item: FocusItem) => void;
  onAddTask: (item: FocusItem) => void;
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
    <Card>
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Today&apos;s focus</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onClick={handleAddEvent}>Add Event</DropdownMenu.Item>
            <DropdownMenu.Item onClick={handleViewCalendar}>View Calendar</DropdownMenu.Item>
            <DropdownMenu.Item onClick={handleEditSchedule}>Edit Schedule</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={item.isCompleted}
                onChange={() => {}}
                className="size-4 text-primary"
              />
              <div>
                <Text size="sm" weight="medium">{item.title}</Text>
                <div className="flex items-center gap-2 mt-1">
                  <Text size="sm" weight="semibold" variant="body">{item.time.split(' ')[0]}</Text>
                  <Text size="xs" variant="secondary" weight="medium">{item.time.split(' ')[1]}</Text>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-secondary hover:text-primary">
                <MoreHorizontal className="size-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

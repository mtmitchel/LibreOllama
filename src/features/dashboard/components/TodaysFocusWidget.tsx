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

export const TodaysFocusWidget: React.FC<TodaysFocusWidgetProps> = ({ items, onToggle, onAddTask }) => {
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
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
        <Heading level={3}>Today's focus</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={handleAddEvent}>
              Add new event
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleViewCalendar}>
              View full calendar
            </DropdownMenu.Item>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={handleEditSchedule}>
              Edit schedule
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
        {items.map((item) => (
          <li key={item.id} className="flex items-start" style={{ gap: 'var(--space-3)' }}>
            <div className="flex flex-col items-center text-center" style={{ 
              minWidth: '50px', 
              paddingTop: 'var(--space-1)' 
            }}>
              <Text size="sm" weight="semibold" variant="body">{item.time.split(' ')[0]}</Text>
              <Text size="xs" variant="secondary" weight="medium">{item.time.split(' ')[1]}</Text>
            </div>
            <div className="flex-1 min-w-0">
              <Text size="sm" weight="medium" variant="body" style={{ marginBottom: 'var(--space-1)' }}>{item.title}</Text>
              <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
                <div className={`${item.color} rounded-full flex-shrink-0`} style={{ 
                  width: 'var(--space-2)', 
                  height: 'var(--space-2)' 
                }}></div>
                <Text size="xs" variant="secondary">{item.team}</Text>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </Card>
  );
};

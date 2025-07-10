import React, { useMemo } from 'react';
import { Card, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { useGoogleCalendarStore } from '../../../stores/googleCalendarStore';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

export const UpcomingEventsWidget: React.FC = () => {
  const { events } = useGoogleCalendarStore();

  // Memoize the upcoming events calculation to prevent re-render loops
  const upcomingEvents = useMemo(() => {
    if (!events || !Array.isArray(events)) {
      return [];
    }

    try {
      const now = new Date();
      const nextWeek = addDays(now, 7);
      
      return events
        .filter(event => {
          try {
            const eventDate = new Date(event.start?.dateTime || event.start?.date || '');
            return eventDate >= now && eventDate <= nextWeek;
          } catch {
            return false;
          }
        })
        .sort((a, b) => {
          try {
            const dateA = new Date(a.start?.dateTime || a.start?.date || '').getTime();
            const dateB = new Date(b.start?.dateTime || b.start?.date || '').getTime();
            return dateA - dateB;
          } catch {
            return 0;
          }
        })
        .slice(0, 5);
    } catch (error) {
      console.error('Error processing calendar events:', error);
      return [];
    }
  }, [events]);

  const formatEventDate = (event: any) => {
    try {
      const dateStr = event.start?.dateTime || event.start?.date || '';
      const date = new Date(dateStr);
      if (isToday(date)) return 'Today';
      if (isTomorrow(date)) return 'Tomorrow';
      return format(date, 'EEE, MMM d');
    } catch {
      return 'Unknown date';
    }
  };

  const formatEventTime = (event: any) => {
    try {
      const dateStr = event.start?.dateTime || event.start?.date || '';
      const date = new Date(dateStr);
      return format(date, 'h:mm a');
    } catch {
      return 'Unknown time';
    }
  };

  const handleAddEvent = () => {
    // Navigate to calendar page
    window.location.href = '/calendar';
  };

  const handleViewCalendar = () => {
    window.location.href = '/calendar';
  };

  return (
    <Card>
      <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-4)' }}>
        <Heading level={3}>Upcoming events</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={handleAddEvent}>
              <Calendar className="w-4 h-4 mr-2" />
              Add new event
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleViewCalendar}>
              View full calendar
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      
      {upcomingEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="w-8 h-8 mx-auto mb-3 text-[var(--text-tertiary)]" />
          <Text variant="secondary" size="sm">No upcoming events</Text>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleAddEvent}
            className="mt-2"
          >
            Add your first event
          </Button>
        </div>
      ) : (
        <ul style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
          {upcomingEvents.map((event) => (
            <li key={event.id} className="flex items-start" style={{ gap: 'var(--space-3)' }}>
              <div className="flex flex-col items-center text-center" style={{ 
                minWidth: '60px', 
                paddingTop: 'var(--space-1)' 
              }}>
                <Text size="xs" variant="secondary" weight="medium">
                  {formatEventDate(event)}
                </Text>
                <div className="flex items-center mt-1" style={{ gap: 'var(--space-1)' }}>
                  <Clock className="w-3 h-3 text-[var(--text-tertiary)]" />
                  <Text size="xs" variant="secondary">
                    {formatEventTime(event)}
                  </Text>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <Text size="sm" weight="medium" variant="body" style={{ marginBottom: 'var(--space-1)' }}>
                  {event.summary || 'Untitled Event'}
                </Text>
                {event.description && (
                  <Text size="xs" variant="secondary" className="line-clamp-1">
                    {event.description}
                  </Text>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}; 
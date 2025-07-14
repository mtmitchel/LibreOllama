import React, { useMemo } from 'react';
import { Card, Heading, Text, Button, EmptyState } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { useGoogleCalendarStore } from '../../../stores/googleCalendarStore';
import { format, isToday, isTomorrow, addDays } from 'date-fns';

interface CalendarEvent {
  id: string;
  summary: string;
  start: {
    dateTime?: string;
    date?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
  };
  location?: string;
  attendees?: Array<{ email: string }>;
}

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

  const formatEventDate = (event: CalendarEvent) => {
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

  const formatEventTime = (event: CalendarEvent) => {
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
      <div className="mb-4 flex items-center justify-between">
        <Heading level={3}>Upcoming events</Heading>
        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
              <MoreHorizontal className="size-4" />
            </Button>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item onSelect={handleAddEvent}>
              <Calendar className="mr-2 size-4" />
              Add new event
            </DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleViewCalendar}>
              View full calendar
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      
      {upcomingEvents.length === 0 ? (
        <EmptyState
          title="No upcoming events"
          message="You don't have any events scheduled for the coming days."
          icon="📅"
          action={{
            label: "Add your first event",
            onClick: handleAddEvent
          }}
          size="sm"
        />
      ) : (
        <ul className="flex flex-col gap-3">
          {upcomingEvents.map((event) => (
            <li key={event.id} className="flex items-start gap-3">
              <div className="flex min-w-[60px] flex-col items-center pt-1 text-center">
                <Text size="xs" variant="secondary" weight="medium">
                  {formatEventDate(event)}
                </Text>
                <div className="mt-1 flex items-center gap-1">
                  <Clock className="size-3 text-tertiary" />
                  <Text size="xs" variant="secondary">
                    {formatEventTime(event)}
                  </Text>
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <Text size="sm" weight="medium" variant="body" className="mb-1">
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
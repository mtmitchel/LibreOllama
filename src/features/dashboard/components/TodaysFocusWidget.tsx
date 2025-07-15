import React, { useEffect, useMemo } from 'react';
import { Card, Heading, Text, Button } from '../../../components/ui';
import { DropdownMenu } from '../../../components/ui/DropdownMenu';
import { MoreHorizontal, Calendar, Clock } from 'lucide-react';
import { useGoogleCalendarStore } from '../../../stores/googleCalendarStore';

export const TodaysFocusWidget: React.FC = () => {
  const { 
    events, 
    fetchEvents, 
    isLoading, 
    error 
  } = useGoogleCalendarStore();

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Filter events for today
  const todayEvents = useMemo(() => {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);

    return events
      .filter(event => {
        const dateValue = event.start.dateTime || event.start.date;
        if (!dateValue) return false;
        const eventDate = new Date(dateValue);
        return eventDate >= todayStart && eventDate < todayEnd;
      })
      .sort((a, b) => {
        const aDateValue = a.start.dateTime || a.start.date;
        const bDateValue = b.start.dateTime || b.start.date;
        if (!aDateValue || !bDateValue) return 0;
        const aTime = new Date(aDateValue).getTime();
        const bTime = new Date(bDateValue).getTime();
        return aTime - bTime;
      })
      .slice(0, 3); // Show max 3 events
  }, [events]);

  const formatEventTime = (event: any) => {
    if (event.start.dateTime) {
      return new Date(event.start.dateTime).toLocaleTimeString('en-US', { 
        hour: 'numeric', 
        minute: '2-digit',
        hour12: true 
      });
    }
    return 'All day';
  };

  const handleAddEvent = () => {
    console.log('Add new event');
  };

  const handleViewCalendar = () => {
    console.log('View full calendar');
  };

  const handleEditSchedule = () => {
    console.log('Edit schedule');
  };

  if (isLoading && events.length === 0) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-secondary rounded w-32"></div>
            <div className="h-6 w-6 bg-secondary rounded"></div>
          </div>
          <div className="space-y-3">
            <div className="h-16 bg-secondary rounded-lg"></div>
            <div className="h-16 bg-secondary rounded-lg"></div>
            <div className="h-16 bg-secondary rounded-lg"></div>
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
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
              <DropdownMenu.Item onSelect={handleAddEvent}>Add Event</DropdownMenu.Item>
              <DropdownMenu.Item onSelect={handleViewCalendar}>View Calendar</DropdownMenu.Item>
              <DropdownMenu.Item onSelect={handleEditSchedule}>Edit Schedule</DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu>
        </div>
        <div className="text-center py-4">
          <Text variant="secondary" size="sm">{error}</Text>
        </div>
      </Card>
    );
  }

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
            <DropdownMenu.Item onSelect={handleAddEvent}>Add Event</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleViewCalendar}>View Calendar</DropdownMenu.Item>
            <DropdownMenu.Item onSelect={handleEditSchedule}>Edit Schedule</DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>
      
      {todayEvents.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="mx-auto mb-3 h-8 w-8 text-secondary" />
          <Text variant="secondary" size="sm">No events scheduled for today</Text>
          <Text variant="tertiary" size="xs" className="mt-1">Your calendar is clear - time to focus!</Text>
        </div>
      ) : (
        <div className="space-y-3">
          {todayEvents.map((event) => (
            <div key={event.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-accent-soft">
                  <Clock className="w-4 h-4 text-accent-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <Text variant="body" size="sm" weight="medium" className="truncate">
                    {event.summary || 'Untitled Event'}
                  </Text>
                  <Text variant="secondary" size="xs" className="truncate">
                    {formatEventTime(event)}
                    {event.location && ` • ${event.location}`}
                  </Text>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {events.length > todayEvents.length && (
        <div className="mt-4 pt-3 border-t border-border">
          <Button variant="ghost" size="sm" className="w-full text-secondary">
            View all events ({events.length})
          </Button>
        </div>
      )}
    </Card>
  );
};

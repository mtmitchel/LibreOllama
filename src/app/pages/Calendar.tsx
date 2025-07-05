import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, Plus } from 'lucide-react';
import { Card, Button, Tag } from '../../components/ui';
import { Calendar as BigCalendar, momentLocalizer } from 'react-big-calendar';
import moment from 'moment';
import { PageLayout } from '../../components/layout/PageLayout';
import { useHeader } from '../contexts/HeaderContext';
import 'react-big-calendar/lib/css/react-big-calendar.css';

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: 'event' | 'meeting' | 'task';
  time?: string;
}

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  project?: string;
  estimated?: string;
}

type CalendarView = 'month' | 'week' | 'day';

const Calendar: React.FC = () => {
  const { setHeaderProps, clearHeaderProps } = useHeader();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<CalendarView>('month');
  const [showTaskPanel, setShowTaskPanel] = useState(true);
  const [events] = useState<CalendarEvent[]>([
    {
      id: '1',
      title: 'Team Sync',
      date: new Date(2024, 11, 1), // December 1, 2024
      type: 'event'
    },
    {
      id: '2',
      title: 'Project Review',
      date: new Date(2024, 11, 3),
      type: 'meeting'
    },
    {
      id: '3',
      title: 'Prep for Demo',
      date: new Date(2024, 11, 3),
      type: 'task'
    }
  ]);
  
  const [tasks] = useState<Task[]>([
    {
      id: '1',
      title: 'Finalize Q3 report',
      priority: 'high',
      project: 'Project Alpha'
    },
    {
      id: '2',
      title: 'Client demo prep',
      priority: 'high',
      project: 'Sales'
    },
    {
      id: '3',
      title: 'Update documentation',
      priority: 'medium',
      project: 'LibreOllama Docs'
    }
  ]);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getPriorityColor = (priority: string): 'error' | 'warning' | 'success' => {
    if (priority === 'high') return 'error';
    if (priority === 'medium') return 'warning';
    return 'success';
  };

  const formatPriority = (priority: string): string => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    const days = [];
    
    // Previous month's days
    const prevMonth = new Date(year, month - 1, 0);
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      });
    }
    
    // Current month's days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      });
    }
    
    // Next month's days
    const remainingDays = 42 - days.length; // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => 
      event.date.toDateString() === date.toDateString()
    );
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const days = getDaysInMonth(currentDate);

  const handleNewEvent = useCallback(() => {
    // TODO: Implement new event creation
    console.log('Create new event');
  }, []);

  const headerProps = useMemo(() => ({
    title: "Calendar",
    primaryAction: {
      label: 'New event',
      onClick: handleNewEvent,
      icon: <Plus size={16} />,
      variant: 'primary' as const
    },
    viewSwitcher: (
      <div 
        className="flex items-center"
        style={{ gap: 'var(--space-1)' }}
      >
        <Button 
          variant={view === 'month' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('month')}
          className="focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
        >
          Month
        </Button>
        <Button 
          variant={view === 'week' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('week')}
          className="focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
        >
          Week
        </Button>
        <Button 
          variant={view === 'day' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('day')}
          className="focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2"
        >
          Day
        </Button>
      </div>
    )
  }), [view, handleNewEvent]);

  useEffect(() => {
    setHeaderProps(headerProps);
    return () => clearHeaderProps();
  }, [setHeaderProps, clearHeaderProps, headerProps]);

  return (
    <PageLayout headerProps={headerProps}>
      {/* Design system aligned layout */}
      <div className="flex flex-1 gap-6 p-4 md:p-6"> 
        <div className="flex-1 flex flex-col gap-6">
          {/* Calendar Navigation */}
          <Card> 
            <div className="flex items-center gap-4"> 
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigateMonth('prev')}
                className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Previous month"
              >
                <ChevronLeft size={20} />
              </Button>
              <h2 className="text-lg font-semibold text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => navigateMonth('next')}
                className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                aria-label="Next month"
              >
                <ChevronRight size={20} />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={goToToday} 
                className="ml-auto focus:ring-2 focus:ring-primary focus:ring-offset-2"
              >
                Today
              </Button>
            </div>
          </Card>

          {/* Calendar Grid */}
          <Card className="flex-1"> 
            <div className="grid grid-cols-7 gap-px border-l border-t border-border-default bg-border-default">
              {dayNames.map(day => (
                <div key={day} className="text-center p-2 text-xs font-medium text-muted bg-surface border-r border-b border-border-default">
                  {day}
                </div>
              ))}
              {days.map((dayObj, index) => (
                <div 
                  key={index} 
                  className={`relative cursor-pointer transition-all duration-200 hover:scale-102 p-2 h-32 border-r border-b border-border-default
                    ${!dayObj.isCurrentMonth ? 'bg-bg-secondary' : isToday(dayObj.date) ? 'bg-accent-ghost' : 'bg-surface'}
                    ${isToday(dayObj.date) ? 'border-2 border-accent-primary' : ''}
                  `}
                >
                  <span 
                    className={`text-sm ${isToday(dayObj.date) ? 'font-bold text-accent-primary' : dayObj.isCurrentMonth ? 'text-primary' : 'text-muted'}`}
                  >
                    {dayObj.date.getDate()}
                  </span>
                  <div className="overflow-y-auto mt-1 flex flex-col gap-1 max-h-20">
                    {getEventsForDate(dayObj.date).map(event => (
                      <div 
                        key={event.id} 
                        className={`rounded-sm transition-all duration-200 hover:scale-105 p-1 text-xs
                          ${event.type === 'event' ? 'bg-accent-ghost text-accent-primary' : 
                            event.type === 'meeting' ? 'bg-bg-tertiary text-primary border border-border-default' : 
                            'bg-success/10 text-success'
                          }`}
                      >
                        {event.title}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Task Panel */}
        {showTaskPanel && (
          <div className="w-80 flex-shrink-0">
            <Card className="h-full flex flex-col"> 
              <div className="flex items-center justify-between p-4 border-b border-border-default">
                <h3 className="text-base font-semibold text-primary">
                  Tasks
                </h3>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" className="focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Plus size={16} className="mr-2" /> Add Task
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setShowTaskPanel(false)}
                    className="focus:ring-2 focus:ring-primary focus:ring-offset-2"
                    aria-label="Close tasks panel"
                  >
                    <ListChecks size={18} />
                  </Button>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {tasks.map(task => (
                  <Card 
                    key={task.id} 
                    className="transition-all duration-200 hover:shadow-md hover:scale-102 p-3 bg-bg-secondary"
                  >
                    <h4 className="text-sm font-medium text-primary mb-1">
                      {task.title}
                    </h4>
                    <div className="flex items-center justify-between text-xs text-muted">
                      <Tag variant="solid" color={getPriorityColor(task.priority)} size="xs">
                        {formatPriority(task.priority)}
                      </Tag>
                      {task.project && (
                        <span className="text-secondary">
                          {task.project}
                        </span>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </div>
        )}

        {/* Task Panel Toggle Button */}
        {!showTaskPanel && (
          <div className="fixed z-50 bottom-6 right-6">
            <Button 
              variant="primary" 
              size="icon" 
              className="rounded-full shadow-lg focus:ring-2 focus:ring-primary focus:ring-offset-2 w-12 h-12"
              onClick={() => setShowTaskPanel(true)}
              aria-label="Show tasks"
            >
              <ListChecks size={22} />
            </Button>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default Calendar;
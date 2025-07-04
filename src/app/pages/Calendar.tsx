import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ListChecks, Plus } from 'lucide-react';
import { Card, Button } from '../../components/ui';
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

  const handleNewEvent = () => {
    // TODO: Implement new event creation
    console.log('Create new event');
  };

  const headerProps = {
    title: "Calendar",
    primaryAction: {
      label: 'New event',
      onClick: handleNewEvent,
      icon: <Plus size={16} />,
      variant: 'primary' // Added variant for consistency
    },
    viewSwitcher: (
      <div className="flex items-center gap-1"> {/* Added items-center for vertical alignment */}
        {/* Using Button component for consistency */}
        <Button 
          variant={view === 'month' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('month')}
        >
          Month
        </Button>
        <Button 
          variant={view === 'week' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('week')}
        >
          Week
        </Button>
        <Button 
          variant={view === 'day' ? 'primary' : 'ghost'} 
          size="sm" 
          onClick={() => setView('day')}
        >
          Day
        </Button>
      </div>
    )
  };

  return (
    <PageLayout headerProps={headerProps}>
      {/* Standardized gap and padding for consistency */}
      <div className="flex flex-1 gap-6 p-4 md:p-6"> {/* Moved padding here */}
        <div className="flex-1 flex flex-col gap-6"> {/* Added flex-col and gap for consistent spacing */}
          {/* Calendar Navigation */}
          <Card> {/* Using Card from ui/index.tsx, default padding will apply */}
            <div className="flex items-center justify-between gap-4"> {/* Adjusted for better spacing and alignment */}
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('prev')}>
                <ChevronLeft size={20} />
              </Button>
              <h2 className="text-lg font-semibold text-text-primary">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => navigateMonth('next')}>
                <ChevronRight size={20} />
              </Button>
              <Button variant="secondary" size="sm" onClick={goToToday} className="ml-auto"> {/* Adjusted button style */}
                Today
              </Button>
            </div>
          </Card>

          {/* Calendar Grid */}
          <Card className="flex-1"> {/* Using Card and ensuring it fills available space */}
            <div className="grid grid-cols-7 gap-px border-l border-t border-border-subtle bg-border-subtle">
              {dayNames.map(day => (
                <div key={day} className="py-2 text-center text-xs font-medium text-text-secondary bg-bg-surface border-r border-b border-border-subtle">
                  {day}
                </div>
              ))}
              {days.map((dayObj, index) => (
                <div 
                  key={index} 
                  className={`p-2 h-32 relative bg-bg-surface border-r border-b border-border-subtle 
                    ${!dayObj.isCurrentMonth ? 'bg-bg-muted text-text-disabled' : 'hover:bg-bg-hover'}
                    ${isToday(dayObj.date) ? 'bg-accent-soft ring-1 ring-accent-primary' : ''}
                  `}
                >
                  <span className={`text-sm ${isToday(dayObj.date) ? 'font-bold text-accent-primary' : dayObj.isCurrentMonth ? 'text-text-primary' : 'text-text-disabled'}`}>
                    {dayObj.date.getDate()}
                  </span>
                  <div className="mt-1 space-y-1 overflow-y-auto max-h-20">
                    {getEventsForDate(dayObj.date).map(event => (
                      <div 
                        key={event.id} 
                        className={`px-1.5 py-0.5 text-[11px] rounded 
                          ${event.type === 'event' ? 'bg-accent-soft text-primary' : 
                            event.type === 'meeting' ? 'bg-bg-tertiary text-text-primary border border-border-default' :
                            'bg-accent-soft text-success'}`}
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
            <Card className="h-full flex flex-col"> {/* Using Card and ensuring it fills height */}
              <div className="flex items-center justify-between p-4 border-b border-border-subtle">
                <h3 className="text-base font-semibold text-text-primary">Tasks</h3>
                <Button variant="ghost" size="icon" onClick={() => setShowTaskPanel(false)}>
                  <ListChecks size={18} /> {/* Placeholder, consider a close icon */}
                </Button>
              </div>
              <div className="flex-1 p-4 space-y-3 overflow-y-auto">
                {tasks.map(task => (
                  <Card key={task.id} className="p-3 bg-bg-subtle"> {/* Nested Card with specific padding */}
                    <h4 className="text-sm font-medium text-text-primary mb-1">{task.title}</h4>
                    <div className="flex items-center justify-between text-xs text-text-secondary">
                      <span className={`px-1.5 py-0.5 rounded-full text-white text-[10px]
                        ${task.priority === 'high' ? 'bg-error' : task.priority === 'medium' ? 'bg-warning' : 'bg-success'}`}
                      >
                        {task.priority}
                      </span>
                      {task.project && <span>{task.project}</span>}
                    </div>
                  </Card>
                ))}
              </div>
              <div className="p-4 border-t border-border-subtle">
                <Button variant="primary" className="w-full"> {/* Consistent primary button */}
                  <Plus size={16} className="mr-1.5" /> Add new task
                </Button>
              </div>
            </Card>
          </div>
        )}

        {/* Task Panel Toggle Button - consider moving or integrating better */}
        {!showTaskPanel && (
          <div className="fixed bottom-6 right-6 z-50">
            <Button 
              variant="primary" 
              size="icon" 
              className="rounded-full shadow-lg w-12 h-12" // Custom sizing for FAB
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
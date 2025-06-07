import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, ListChecks, Clock, User, Tag } from 'lucide-react';
import { PageLayout } from '../components/ui/PageLayout';
import { Card } from '../components/ui/Card';

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
      icon: <Plus size={16} />
    },
    viewSwitcher: (
      <div className="flex gap-1">
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'month' 
              ? 'bg-blue-600 text-white' 
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setView('month')}
        >
          Month
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'week' 
              ? 'bg-blue-600 text-white' 
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setView('week')}
        >
          Week
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            view === 'day' 
              ? 'bg-blue-600 text-white' 
              : 'bg-transparent text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}
          onClick={() => setView('day')}
        >
          Day
        </button>
      </div>
    )
  };

  return (
    <PageLayout headerProps={headerProps}>
      <div className="flex flex-1 gap-6">
        <div className="flex-1">
          {/* Calendar Navigation */}
          <Card className="mb-6">
            <div className="flex items-center justify-center gap-4 p-4 px-6">
              <button
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => navigateMonth('prev')}
                title="Previous month"
              >
                <ChevronLeft size={16} />
              </button>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white min-w-[200px] text-center">
                {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h2>
              <button
                className="flex items-center justify-center w-8 h-8 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md transition-colors"
                onClick={() => navigateMonth('next')}
                title="Next month"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors ml-4"
                onClick={goToToday}
              >
                Today
              </button>
            </div>
          </Card>
        
        <Card className="overflow-hidden">
          {view === 'month' && (
            <div className="grid grid-cols-7">
              {dayNames.map(day => (
                <div key={day} className="p-3 text-center text-xs font-semibold text-gray-600 dark:text-gray-400 border-r border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 last:border-r-0">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                return (
                  <div 
                    key={index} 
                    className={`
                      relative p-2 h-32 border-r border-b border-gray-200 dark:border-gray-700 last:border-r-0
                      ${!day.isCurrentMonth 
                        ? 'bg-gray-50 dark:bg-gray-900 opacity-50' 
                        : 'bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                      ${isToday(day.date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                      transition-colors cursor-pointer
                    `}
                  >
                    <span className={`text-sm font-medium ${
                      isToday(day.date) 
                        ? 'text-blue-600 dark:text-blue-400 font-bold' 
                        : day.isCurrentMonth 
                          ? 'text-gray-900 dark:text-white' 
                          : 'text-gray-400 dark:text-gray-600'
                    }`}>
                      {day.date.getDate()}
                    </span>
                    <div className="mt-1 space-y-1">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          className={`text-xs px-2 py-1 rounded-md truncate font-medium ${
                            event.type === 'event' 
                              ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                            event.type === 'meeting' 
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                              'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300'
                          }`}
                          title={event.title}
                        >
                          {event.title}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {view === 'week' && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <CalendarDays size={48} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Week view coming soon
                </p>
              </div>
            </div>
          )}
          
          {view === 'day' && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <CalendarDays size={48} className="text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Day view coming soon
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
      
      {showTaskPanel && (
        <Card as="aside" className="w-80">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Tasks to schedule</h3>
            <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-md font-medium">
              {tasks.length} to schedule
            </span>
          </div>
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">High Priority</h4>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.priority === 'high')
                  .map(task => (
                    <div key={task.id} className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-md font-medium">
                          {task.priority}
                        </span>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{task.project}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">This Week</h4>
              <div className="space-y-3">
                {tasks
                  .filter(task => task.priority !== 'high')
                  .map(task => (
                    <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg">
                      <div className="font-medium text-gray-900 dark:text-white text-sm">{task.title}</div>
                      <div className="mt-2">
                        <span className="text-xs text-gray-600 dark:text-gray-400">{task.project}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </Card>
      )}
      
        {/* Task Panel Toggle Button */}
        <button
          className="fixed bottom-6 right-6 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center justify-center z-10"
          title="Toggle Task Panel"
          onClick={() => setShowTaskPanel(!showTaskPanel)}
        >
          <ListChecks size={20} />
        </button>
      </div>
    </PageLayout>
  );
};

export default Calendar;
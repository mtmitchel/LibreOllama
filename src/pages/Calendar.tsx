import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarPlus,
  ListChecks,
  CalendarDays,
  Plus
} from 'lucide-react';
import { UnifiedHeader } from '../components/ui';

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

  return (
    <div className="content-area">
      {/* Unified Header */}
      <UnifiedHeader
        title="Calendar"
        primaryAction={{
          label: 'New event',
          onClick: handleNewEvent,
          icon: <Plus size={16} />
        }}
        viewSwitcher={
          <div className="calendar-views">
            <button
                          className={`btn ${view === 'month' ? 'btn-primary' : 'btn-ghost'} calendar-view-btn`}
                          onClick={() => setView('month')}
            >
              Month
            </button>
            <button
                          className={`btn ${view === 'week' ? 'btn-primary' : 'btn-ghost'} calendar-view-btn`}
                          onClick={() => setView('week')}
            >
              Week
            </button>
            <button
                          className={`btn ${view === 'day' ? 'btn-primary' : 'btn-ghost'} calendar-view-btn`}
                          onClick={() => setView('day')}
            >
              Day
            </button>
          </div>
        }
      />

      <div className="calendar-layout">
        <div className="calendar-main">
          {/* Calendar Navigation - moved below header */}
          <div className="calendar-nav" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 'var(--space-4)',
            padding: 'var(--space-4) var(--space-5)',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'var(--bg-surface)'
          }}>
            <button
              className="calendar-nav-btn"
              onClick={() => navigateMonth('prev')}
              title="Previous month"
            >
              <ChevronLeft size={16} />
            </button>
            <h2 className="calendar-title" style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'var(--text-primary)',
              margin: '0',
              minWidth: '200px',
              textAlign: 'center'
            }}>
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              className="calendar-nav-btn"
              onClick={() => navigateMonth('next')}
              title="Next month"
            >
              <ChevronRight size={16} />
            </button>
            <button
              className="btn btn-secondary calendar-today-btn"
              onClick={goToToday}
            >
              Today
            </button>
          </div>
        
        <div className="calendar-grid-wrapper">
          {view === 'month' && (
            <div className="calendar-grid">
              {dayNames.map(day => (
                <div key={day} className="calendar-header-cell">
                  {day}
                </div>
              ))}
              {days.map((day, index) => {
                const dayEvents = getEventsForDate(day.date);
                return (
                  <div 
                    key={index} 
                    className={`calendar-day ${
                      !day.isCurrentMonth ? 'other-month' : ''
                    } ${isToday(day.date) ? 'today' : ''}`}
                  >
                    <span className="calendar-day-number">
                      {day.date.getDate()}
                    </span>
                    <div className="calendar-events">
                      {dayEvents.map(event => (
                        <div 
                          key={event.id} 
                          className={`calendar-event ${event.type}`}
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
            <div className="week-view">
              <div className="week-placeholder">
                <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>
                  Week view coming soon
                </p>
              </div>
            </div>
          )}
          
          {view === 'day' && (
            <div className="day-view">
              <div className="day-placeholder">
                <CalendarDays size={48} style={{ color: 'var(--text-muted)' }} />
                <p style={{ color: 'var(--text-secondary)', marginTop: 'var(--space-4)' }}>
                  Day view coming soon
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {showTaskPanel && (
        <aside className="time-blocking-panel">
<div className="task-panel-header task-schedule-panel-header">
                <h3>Tasks to schedule</h3>
                <span className="count">{tasks.length} to schedule</span>
              </div>
          <div className="time-blocking-content">
            <div className="task-section">
              <div className="task-section-title">High Priority</div>
              {tasks
                .filter(task => task.priority === 'high')
                .map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
<span className={`task-priority ${task.priority}`}>{task.priority}</span>
                      {task.project}
                    </div>
                  </div>
                ))
              }
            </div>
            
            <div className="task-section">
              <div className="task-section-title">This Week</div>
              {tasks
                .filter(task => task.priority !== 'high')
                .map(task => (
                  <div key={task.id} className="task-item">
                    <div className="task-title">{task.title}</div>
                    <div className="task-meta">
                      {task.project}
                    </div>
                  </div>
                ))
              }
            </div>
          </div>
        </aside>
      )}
      
        {/* Task Panel Toggle Button */}
        <button
          className="btn btn-ghost btn-sm"
          title="Toggle Task Panel"
          onClick={() => setShowTaskPanel(!showTaskPanel)}
        >
          <ListChecks size={20} />
        </button>
      </div>
    </div>
  );
};

export default Calendar;
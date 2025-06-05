import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Activity,
  Target,
  BarChart3,
  Calendar,
  CheckSquare,
  MessageSquare,
  FileText,
  Settings,
  RefreshCw,
  ChevronRight,
  Star,
  Zap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { ScrollArea } from './ui/scroll-area';
import { TodaysFocusDashboard } from './dashboard/TodaysFocusDashboard';
import { ActivityAggregationHub } from './dashboard/ActivityAggregationHub';
import { ProductivityDashboard } from './analytics/ProductivityDashboard';
import { CalendarIntegrationHub } from './calendar/CalendarIntegrationHub';
import { useFocusMode } from '../hooks/use-focus-mode';
import { useCalendar } from '../hooks/use-calendar';
import type { TaskItem, ChatSession, Item } from '../lib/types';

interface MainDashboardViewProps {
  // Data sources
  notes?: Item[];
  tasks?: TaskItem[];
  chats?: ChatSession[];
  // Callbacks
  onTaskCreate?: (task: Partial<TaskItem>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
  onNavigateToWorkflow?: (workflow: string) => void;
  className?: string;
}

interface QuickStat {
  id: string;
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  change?: number;
  changeType?: 'up' | 'down' | 'stable';
}

export function MainDashboardView({
  notes = [],
  tasks = [],
  chats = [],
  onTaskCreate,
  onTaskUpdate,
  onNavigateToWorkflow,
  className = ''
}: MainDashboardViewProps) {
  const [activeTab, setActiveTab] = useState('focus');
  const [lastRefresh, setLastRefresh] = useState(new Date());
  
  const { focusMode, toggleFocusMode } = useFocusMode();
  const { events } = useCalendar({});

  // Calculate quick stats
  const quickStats: QuickStat[] = [
    {
      id: 'tasks-today',
      label: 'Tasks Today',
      value: tasks.filter(task => {
        const today = new Date().toDateString();
        return task.dueDate && new Date(task.dueDate).toDateString() === today;
      }).length,
      icon: CheckSquare,
      color: 'text-green-600 bg-green-100',
      change: 2,
      changeType: 'up'
    },
    {
      id: 'focus-sessions',
      label: 'Focus Sessions',
      value: focusMode.pomodoro.sessionCount,
      icon: Target,
      color: 'text-blue-600 bg-blue-100',
      change: 1,
      changeType: 'up'
    },
    {
      id: 'notes-created',
      label: 'Notes This Week',
      value: notes.filter(note => {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return new Date(note.createdAt) >= weekAgo;
      }).length,
      icon: FileText,
      color: 'text-purple-600 bg-purple-100',
      change: 0,
      changeType: 'stable'
    },
    {
      id: 'ai-interactions',
      label: 'AI Conversations',
      value: chats.filter(chat => {
        const today = new Date().toDateString();
        return new Date(chat.updatedAt).toDateString() === today;
      }).length,
      icon: MessageSquare,
      color: 'text-orange-600 bg-orange-100',
      change: 3,
      changeType: 'up'
    }
  ];

  // Calculate pending tasks
  const pendingTasks = tasks.filter(task => task.status !== 'done').length;
  const overdueTasks = tasks.filter(task => 
    task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    task.status !== 'done'
  ).length;

  // Quick actions based on current state
  const getQuickActions = () => {
    const actions = [
      {
        id: 'start-focus',
        label: 'Start Focus Session',
        description: 'Begin a Pomodoro focus session',
        icon: Target,
        color: 'bg-blue-600 hover:bg-blue-700 text-white',
        action: () => toggleFocusMode(),
        priority: 'high'
      },
      {
        id: 'quick-task',
        label: 'Add Quick Task',
        description: 'Create a new task',
        icon: CheckSquare,
        color: 'bg-green-600 hover:bg-green-700 text-white',
        action: () => onTaskCreate?.({ title: '', estimatedMinutes: 15 }),
        priority: 'medium'
      },
      {
        id: 'new-note',
        label: 'Create Note',
        description: 'Start a new note or document',
        icon: FileText,
        color: 'bg-purple-600 hover:bg-purple-700 text-white',
        action: () => onNavigateToWorkflow?.('notes'),
        priority: 'medium'
      },
      {
        id: 'ai-chat',
        label: 'Ask AI',
        description: 'Start a conversation with AI',
        icon: MessageSquare,
        color: 'bg-orange-600 hover:bg-orange-700 text-white',
        action: () => onNavigateToWorkflow?.('chat'),
        priority: 'medium'
      }
    ];

    // Add priority actions based on state
    if (overdueTasks > 0) {
      actions.unshift({
        id: 'review-overdue',
        label: `Review ${overdueTasks} Overdue Task${overdueTasks > 1 ? 's' : ''}`,
        description: 'Address overdue items',
        icon: CheckSquare,
        color: 'bg-red-600 hover:bg-red-700 text-white',
        action: () => onNavigateToWorkflow?.('tasks'),
        priority: 'high'
      });
    }

    return actions;
  };

  const quickActions = getQuickActions();

  const handleRefresh = () => {
    setLastRefresh(new Date());
    // Trigger any refresh logic here
  };

  const handleStartFocusSession = () => {
    if (!focusMode.isActive) {
      toggleFocusMode();
    }
  };

  const getChangeIcon = (changeType?: string) => {
    switch (changeType) {
      case 'up': return <ChevronRight className="h-3 w-3 text-green-500 rotate-90" />;
      case 'down': return <ChevronRight className="h-3 w-3 text-red-500 -rotate-90" />;
      case 'stable': return <div className="h-3 w-3 rounded-full bg-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className={`h-full overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <LayoutDashboard className="h-8 w-8 text-blue-600" />
              Your Workspace
            </h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening today.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            <Button 
              onClick={handleStartFocusSession}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={focusMode.isActive}
            >
              <Target className="h-4 w-4 mr-2" />
              {focusMode.isActive ? 'Focus Active' : 'Start Focus'}
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          {quickStats.map((stat) => (
            <Card key={stat.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-lg ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-gray-600 flex items-center gap-1">
                      {stat.label}
                      {stat.change !== undefined && (
                        <>
                          {getChangeIcon(stat.changeType)}
                          <span className={`text-xs ${
                            stat.changeType === 'up' ? 'text-green-600' : 
                            stat.changeType === 'down' ? 'text-red-600' : 'text-gray-500'
                          }`}>
                            {stat.change > 0 ? `+${stat.change}` : stat.change}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        {quickActions.length > 0 && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex flex-wrap gap-2">
              {quickActions.slice(0, 4).map((action) => (
                <Button
                  key={action.id}
                  onClick={action.action}
                  className={`${action.color} flex items-center gap-2`}
                  size="sm"
                >
                  <action.icon className="h-4 w-4" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Alerts */}
        {(overdueTasks > 0 || pendingTasks > 10) && (
          <div className="mt-4 space-y-2">
            {overdueTasks > 0 && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <CheckSquare className="h-4 w-4 text-red-500" />
                <span className="text-sm text-red-700">
                  You have {overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''} that need attention
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto text-red-700 border-red-300"
                  onClick={() => onNavigateToWorkflow?.('tasks')}
                >
                  Review
                </Button>
              </div>
            )}
            
            {pendingTasks > 10 && (
              <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <Star className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-yellow-700">
                  You have {pendingTasks} pending tasks. Consider organizing them into projects.
                </span>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-auto text-yellow-700 border-yellow-300"
                  onClick={() => onNavigateToWorkflow?.('tasks')}
                >
                  Organize
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Content Tabs */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="focus" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Today's Focus
            </TabsTrigger>
            <TabsTrigger value="activity" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Hub
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
          </TabsList>

          {/* Today's Focus Dashboard */}
          <TabsContent value="focus" className="flex-1 overflow-hidden">
            <TodaysFocusDashboard
              tasks={tasks}
              onTaskCreate={onTaskCreate}
              onTaskUpdate={onTaskUpdate}
              onStartFocusSession={handleStartFocusSession}
            />
          </TabsContent>

          {/* Activity Aggregation Hub */}
          <TabsContent value="activity" className="flex-1 overflow-hidden">
            <ActivityAggregationHub
              notes={notes}
              tasks={tasks}
              chats={chats}
            />
          </TabsContent>

          {/* Analytics Dashboard */}
          <TabsContent value="analytics" className="flex-1 overflow-hidden">
            <ProductivityDashboard />
          </TabsContent>

          {/* Calendar Integration */}
          <TabsContent value="calendar" className="flex-1 overflow-hidden">
            <CalendarIntegrationHub
              tasks={tasks}
              onTaskScheduled={(taskId, startTime) => {
                console.log('Task scheduled:', taskId, startTime);
                // Handle task scheduling
              }}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Footer with last updated info */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Last updated: {lastRefresh.toLocaleTimeString()}</span>
          <div className="flex items-center gap-4">
            <span>{notes.length} notes</span>
            <span>{tasks.length} tasks</span>
            <span>{chats.length} conversations</span>
            <span>{events.length} calendar events</span>
          </div>
        </div>
      </div>
    </div>
  );
}
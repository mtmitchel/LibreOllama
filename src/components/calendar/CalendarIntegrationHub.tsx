import React, { useState, useEffect, useCallback } from 'react';
import { 
  Calendar, 
  BarChart3, 
  Brain, 
  Settings, 
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Zap,
  Target,
  PlayCircle,
  Grid3X3
} from 'lucide-react';
import { EnhancedCalendar } from './EnhancedCalendar';
import { GanttView } from './GanttView';
import { FreeTimeFinder } from './FreeTimeFinder';
import { useCalendar } from '../../hooks/use-calendar';
import { useGoogleIntegration } from '../../hooks/use-google-integration';
import { useFocusMode } from '../../hooks/use-focus-mode';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { PomodoroTimer } from '../focus/PomodoroTimer';
import type { TaskItem, CalendarViewMode } from '../../lib/types';

interface CalendarIntegrationHubProps {
  className?: string;
  defaultView?: CalendarViewMode;
  tasks?: TaskItem[];
  onTaskScheduled?: (taskId: string, startTime: Date) => void;
}

type ViewMode = 'calendar' | 'gantt' | 'ai-scheduler';

export function CalendarIntegrationHub({
  className = '',
  defaultView = 'week',
  tasks = [],
  onTaskScheduled
}: CalendarIntegrationHubProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [integrationSettings, setIntegrationSettings] = useState({
    googleCalendarSync: true,
    focusModeIntegration: true,
    aiScheduling: true,
    overdueTasks: true
  });

  const { 
    events, 
    isLoading: calendarLoading, 
    error: calendarError,
    config: calendarConfig
  } = useCalendar({
    includeGoogleCalendar: integrationSettings.googleCalendarSync,
    energyOptimization: integrationSettings.aiScheduling
  });

  const { 
    authState,
    integrationStatus,
    isLoading: googleLoading,
    authenticate,
    signOut,
    refreshStatus
  } = useGoogleIntegration();

  const { focusMode, toggleFocusMode } = useFocusMode();

  // Handle task scheduling from AI suggestions
  const handleTaskScheduled = useCallback((taskId: string, startTime: Date) => {
    onTaskScheduled?.(taskId, startTime);
    
    // Show success notification
    console.log(`Task ${taskId} scheduled for ${startTime.toLocaleString()}`);
  }, [onTaskScheduled]);

  // Get integration status
  const getIntegrationStatus = () => {
    if (googleLoading) return { status: 'loading', message: 'Checking connections...' };
    
    const connectedServices = [];
    if (authState.isAuthenticated) connectedServices.push('Google Calendar');
    if (integrationSettings.focusModeIntegration) connectedServices.push('Focus Mode');
    if (integrationSettings.aiScheduling) connectedServices.push('AI Scheduling');
    
    if (connectedServices.length === 0) {
      return { status: 'disconnected', message: 'No integrations active' };
    }
    
    return { 
      status: 'connected', 
      message: `Connected: ${connectedServices.join(', ')}` 
    };
  };

  const integrationStatus_display = getIntegrationStatus();

  // Get unscheduled tasks count
  const unscheduledTasks = tasks.filter(task => 
    task.status !== 'done' && !task.dueDate
  );

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header with Integration Status */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-blue-600" />
            <h1 className="text-xl font-semibold">Calendar Integration Hub</h1>
          </div>
          
          {/* Integration Status */}
          <Badge 
            variant={integrationStatus_display.status === 'connected' ? 'default' : 'secondary'}
            className="flex items-center gap-1"
          >
            {integrationStatus_display.status === 'loading' ? (
              <RefreshCw className="h-3 w-3 animate-spin" />
            ) : integrationStatus_display.status === 'connected' ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <AlertCircle className="h-3 w-3" />
            )}
            {integrationStatus_display.message}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Focus Mode Integration */}
          {integrationSettings.focusModeIntegration && focusMode.options.pomodoroTimer && (
            <PomodoroTimer />
          )}
          
          {/* Quick Actions */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setViewMode(viewMode === 'ai-scheduler' ? 'calendar' : 'ai-scheduler')}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            AI Scheduler
            {unscheduledTasks.length > 0 && (
              <Badge variant="destructive" className="text-xs">
                {unscheduledTasks.length}
              </Badge>
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={toggleFocusMode}
            className={`flex items-center gap-2 ${focusMode.isActive ? 'bg-blue-100 text-blue-700' : ''}`}
          >
            <Target className="h-4 w-4" />
            Focus Mode
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as ViewMode)} className="h-full flex flex-col">
          <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
            <TabsTrigger value="calendar" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Calendar View
            </TabsTrigger>
            <TabsTrigger value="gantt" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Project Timeline
            </TabsTrigger>
            <TabsTrigger value="ai-scheduler" className="flex items-center gap-2">
              <Brain className="h-4 w-4" />
              AI Scheduler
              {unscheduledTasks.length > 0 && (
                <Badge variant="destructive" className="text-xs ml-1">
                  {unscheduledTasks.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Calendar View */}
          <TabsContent value="calendar" className="flex-1 m-0">
            <EnhancedCalendar
              defaultView={defaultView}
              showFocusIntegration={integrationSettings.focusModeIntegration}
              enableDragDrop={true}
              showOverdueTasks={integrationSettings.overdueTasks}
              className="h-full"
            />
          </TabsContent>

          {/* Gantt Project Timeline View */}
          <TabsContent value="gantt" className="flex-1 m-0">
            <GanttView
              tasks={tasks}
              events={events}
              className="h-full"
              onTaskClick={(task) => console.log('Gantt task clicked:', task)}
              onTaskUpdate={(taskId, updates) => console.log('Task update:', taskId, updates)}
            />
          </TabsContent>

          {/* AI Scheduler View */}
          <TabsContent value="ai-scheduler" className="flex-1 m-0 p-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
              {/* AI Free Time Finder */}
              <div className="lg:col-span-2">
                <FreeTimeFinder
                  tasks={unscheduledTasks}
                  onScheduleTask={handleTaskScheduled}
                  className="h-full"
                />
              </div>

              {/* Quick Stats and Settings */}
              <div className="space-y-4">
                {/* Quick Stats */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Schedule Overview</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Today's Events</span>
                      <Badge variant="outline">{events.length}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Unscheduled Tasks</span>
                      <Badge variant={unscheduledTasks.length > 0 ? 'destructive' : 'secondary'}>
                        {unscheduledTasks.length}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Focus Sessions</span>
                      <Badge variant="outline">{focusMode.pomodoro.sessionCount}</Badge>
                    </div>
                    {integrationSettings.aiScheduling && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">AI Confidence</span>
                        <Badge variant="outline" className="text-green-600">High</Badge>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Integration Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Integration Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <label className="text-sm">Google Calendar Sync</label>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={integrationSettings.googleCalendarSync}
                          onCheckedChange={(checked) =>
                            setIntegrationSettings(prev => ({ ...prev, googleCalendarSync: checked }))
                          }
                        />
                        {authState.isAuthenticated ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={authenticate}
                            disabled={googleLoading}
                          >
                            Connect
                          </Button>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                      <label className="text-sm">Focus Mode Integration</label>
                      <Switch
                        checked={integrationSettings.focusModeIntegration}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, focusModeIntegration: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm">AI Scheduling</label>
                      <Switch
                        checked={integrationSettings.aiScheduling}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, aiScheduling: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <label className="text-sm">Show Overdue Tasks</label>
                      <Switch
                        checked={integrationSettings.overdueTasks}
                        onCheckedChange={(checked) =>
                          setIntegrationSettings(prev => ({ ...prev, overdueTasks: checked }))
                        }
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Quick Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setViewMode('calendar')}
                    >
                      <Calendar className="h-4 w-4 mr-2" />
                      View Today's Calendar
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full justify-start"
                      onClick={() => setViewMode('gantt')}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Project Timeline
                    </Button>

                    {integrationSettings.focusModeIntegration && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full justify-start"
                        onClick={toggleFocusMode}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Start Focus Session
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Loading and Error States */}
      {(calendarLoading || googleLoading) && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5 animate-spin" />
            <span>Loading calendar data...</span>
          </div>
        </div>
      )}

      {calendarError && (
        <div className="absolute bottom-4 right-4 z-50">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <span className="text-sm">{calendarError}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
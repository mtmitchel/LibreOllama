import React, { useState, useEffect, useMemo } from 'react';
import {
  Calendar,
  Clock,
  Target,
  Zap,
  Coffee,
  Moon,
  Sun,
  CheckCircle,
  Circle,
  AlertCircle,
  TrendingUp,
  Brain,
  Plus,
  Star,
  Timer,
  BarChart3,
  Award,
  RefreshCw,
  Focus,
  PlayCircle,
  Edit3,
  Lightbulb
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Textarea } from '../ui/textarea';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { useFocusMode } from '../../hooks/use-focus-mode';
import { useCalendar } from '../../hooks/use-calendar';
import { contextEngine } from '../../lib/context-engine';
import type { 
  TaskItem, 
  EnergyLevel, 
  ProductivityMetric, 
  ExtendedCalendarDisplayEvent,
  ProductivityInsight 
} from '../../lib/types';

interface TodaysFocusDashboardProps {
  tasks?: TaskItem[];
  onTaskCreate?: (task: Partial<TaskItem>) => void;
  onTaskUpdate?: (taskId: string, updates: Partial<TaskItem>) => void;
  onStartFocusSession?: () => void;
  className?: string;
}

interface DailyIntention {
  id: string;
  text: string;
  createdAt: string;
  isCompleted: boolean;
}

interface EnergyAssessment {
  level: EnergyLevel;
  timestamp: string;
  note?: string;
}

// Mock data for productivity insights
const PRODUCTIVITY_TIPS = [
  "🎯 Break large tasks into 15-minute chunks for better focus",
  "⚡ Your peak energy hours are 9-11 AM - schedule important work then",
  "🧠 Take a 5-minute break every 25 minutes to maintain focus",
  "🌱 Start with quick wins to build momentum for the day",
  "🎨 Use the Pomodoro technique for sustained concentration",
  "💡 Review completed tasks at day's end to celebrate progress"
];

const MOCK_RECENT_ACTIVITY = [
  { id: '1', type: 'note', title: 'Meeting Notes - Project Kickoff', timestamp: '2 hours ago', action: 'created' },
  { id: '2', type: 'task', title: 'Review design mockups', timestamp: '3 hours ago', action: 'completed' },
  { id: '3', type: 'chat', title: 'AI Discussion about workflow optimization', timestamp: '4 hours ago', action: 'created' },
  { id: '4', type: 'calendar', title: 'Team Standup scheduled', timestamp: '5 hours ago', action: 'scheduled' }
];

export function TodaysFocusDashboard({
  tasks = [],
  onTaskCreate,
  onTaskUpdate,
  onStartFocusSession,
  className = ''
}: TodaysFocusDashboardProps) {
  const [dailyIntention, setDailyIntention] = useState<DailyIntention | null>(null);
  const [intentionInput, setIntentionInput] = useState('');
  const [isEditingIntention, setIsEditingIntention] = useState(false);
  const [energyAssessment, setEnergyAssessment] = useState<EnergyAssessment | null>(null);
  const [currentTip, setCurrentTip] = useState(0);

  const { focusMode, toggleFocusMode, formatTime } = useFocusMode();
  const { events } = useCalendar({});

  // Rotate productivity tips every 2 minutes (reduced frequency) and pause when not visible
  useEffect(() => {
    const startTipRotation = () => {
      return setInterval(() => {
        if (!document.hidden) {
          setCurrentTip((prev) => (prev + 1) % PRODUCTIVITY_TIPS.length);
        }
      }, 120000); // 2 minutes instead of 30 seconds
    };

    let interval = startTipRotation();

    const handleVisibilityChange = () => {
      if (document.hidden) {
        clearInterval(interval);
      } else {
        interval = startTipRotation();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Load daily intention from localStorage
  useEffect(() => {
    const today = new Date().toDateString();
    const savedIntention = localStorage.getItem(`daily-intention-${today}`);
    if (savedIntention) {
      setDailyIntention(JSON.parse(savedIntention));
    }
  }, []);

  // Load today's energy assessment
  useEffect(() => {
    const today = new Date().toDateString();
    const savedEnergy = localStorage.getItem(`energy-assessment-${today}`);
    if (savedEnergy) {
      setEnergyAssessment(JSON.parse(savedEnergy));
    }
  }, []);

  // Calculate today's stats
  const todaysStats = useMemo(() => {
    const today = new Date().toDateString();
    const todaysTasks = tasks.filter(task => 
      new Date(task.createdAt).toDateString() === today ||
      (task.dueDate && new Date(task.dueDate).toDateString() === today)
    );
    
    const completedTasks = todaysTasks.filter(task => task.status === 'done');
    const overdueTasks = tasks.filter(task => 
      task.dueDate && 
      new Date(task.dueDate) < new Date() && 
      task.status !== 'done'
    );
    
    const todaysEvents = events.filter(event => 
      new Date(event.start).toDateString() === today
    );

    const quickWins = tasks.filter(task => 
      task.estimatedMinutes && 
      task.estimatedMinutes <= 15 && 
      task.status !== 'done'
    );

    return {
      totalTasks: todaysTasks.length,
      completedTasks: completedTasks.length,
      overdueTasks: overdueTasks.length,
      todaysEvents: todaysEvents.length,
      quickWins: quickWins.length,
      focusStreak: focusMode.pomodoro.sessionCount,
      completionRate: todaysTasks.length > 0 ? Math.round((completedTasks.length / todaysTasks.length) * 100) : 0
    };
  }, [tasks, events, focusMode.pomodoro.sessionCount]);

  const handleSaveIntention = () => {
    if (!intentionInput.trim()) return;
    
    const intention: DailyIntention = {
      id: `intention-${Date.now()}`,
      text: intentionInput.trim(),
      createdAt: new Date().toISOString(),
      isCompleted: false
    };
    
    const today = new Date().toDateString();
    localStorage.setItem(`daily-intention-${today}`, JSON.stringify(intention));
    setDailyIntention(intention);
    setIntentionInput('');
    setIsEditingIntention(false);
  };

  const handleEnergyAssessment = (level: EnergyLevel) => {
    const assessment: EnergyAssessment = {
      level,
      timestamp: new Date().toISOString()
    };
    
    const today = new Date().toDateString();
    localStorage.setItem(`energy-assessment-${today}`, JSON.stringify(assessment));
    setEnergyAssessment(assessment);
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    switch (level) {
      case 'high': return <Zap className="h-4 w-4 text-green-500" />;
      case 'medium': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Moon className="h-4 w-4 text-blue-500" />;
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <div className={`h-full overflow-hidden ${className}`}>
      <ScrollArea className="h-full">
        <div className="p-6 space-y-6">
          {/* Header with Greeting */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold text-gray-900">
              {getGreeting()}! 👋
            </h1>
            <p className="text-gray-600">Let's make today productive and focused</p>
          </div>

          {/* Daily Intention Section */}
          <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-blue-600" />
                Today's Intention
              </CardTitle>
            </CardHeader>
            <CardContent>
              {dailyIntention && !isEditingIntention ? (
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <p className="text-gray-900 flex-1">{dailyIntention.text}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setIntentionInput(dailyIntention.text);
                        setIsEditingIntention(true);
                      }}
                    >
                      <Edit3 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant={dailyIntention.isCompleted ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        const updated = { ...dailyIntention, isCompleted: !dailyIntention.isCompleted };
                        const today = new Date().toDateString();
                        localStorage.setItem(`daily-intention-${today}`, JSON.stringify(updated));
                        setDailyIntention(updated);
                      }}
                      className="flex items-center gap-2"
                    >
                      {dailyIntention.isCompleted ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                      {dailyIntention.isCompleted ? 'Completed' : 'Mark Complete'}
                    </Button>
                    {dailyIntention.isCompleted && (
                      <span className="text-sm text-green-600 font-medium">🎉 Well done!</span>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <Textarea
                    placeholder="What would you like to focus on today? Set your daily intention..."
                    value={intentionInput}
                    onChange={(e) => setIntentionInput(e.target.value)}
                    className="border-blue-200 focus:border-blue-400"
                    rows={3}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={handleSaveIntention}
                      disabled={!intentionInput.trim()}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Save Intention
                    </Button>
                    {isEditingIntention && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          setIsEditingIntention(false);
                          setIntentionInput('');
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Energy Level Assessment */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-purple-600" />
                Energy Check-in
              </CardTitle>
            </CardHeader>
            <CardContent>
              {energyAssessment ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {getEnergyIcon(energyAssessment.level)}
                    <span className="capitalize font-medium">{energyAssessment.level} Energy</span>
                    <span className="text-sm text-gray-500">
                      (assessed {new Date(energyAssessment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEnergyAssessment(null)}
                  >
                    Update
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-gray-600">How's your energy level right now?</p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => handleEnergyAssessment('high')}
                      className="flex items-center gap-2 hover:bg-green-50 hover:border-green-300"
                    >
                      <Zap className="h-4 w-4 text-green-500" />
                      High
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEnergyAssessment('medium')}
                      className="flex items-center gap-2 hover:bg-yellow-50 hover:border-yellow-300"
                    >
                      <Sun className="h-4 w-4 text-yellow-500" />
                      Medium
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleEnergyAssessment('low')}
                      className="flex items-center gap-2 hover:bg-blue-50 hover:border-blue-300"
                    >
                      <Moon className="h-4 w-4 text-blue-500" />
                      Low
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Today's Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todaysStats.completedTasks}</div>
                    <div className="text-sm text-gray-600">Tasks Done</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Calendar className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todaysStats.todaysEvents}</div>
                    <div className="text-sm text-gray-600">Events</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Timer className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todaysStats.focusStreak}</div>
                    <div className="text-sm text-gray-600">Focus Sessions</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-orange-100 rounded-lg">
                    <Star className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{todaysStats.quickWins}</div>
                    <div className="text-sm text-gray-600">Quick Wins</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Daily Progress
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Task Completion</span>
                  <span>{todaysStats.completionRate}%</span>
                </div>
                <Progress value={todaysStats.completionRate} className="h-2" />
              </div>
              
              {todaysStats.overdueTasks > 0 && (
                <div className="flex items-center gap-2 p-3 bg-red-50 rounded-lg border border-red-200">
                  <AlertCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-700">
                    {todaysStats.overdueTasks} overdue task{todaysStats.overdueTasks > 1 ? 's' : ''} need{todaysStats.overdueTasks === 1 ? 's' : ''} attention
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Focus className="h-5 w-5 text-green-600" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button
                  onClick={onStartFocusSession}
                  className="flex items-center gap-2 h-12 justify-start bg-green-600 hover:bg-green-700"
                >
                  <PlayCircle className="h-5 w-5" />
                  Start Focus Session
                </Button>
                
                <Button
                  variant="outline"
                  onClick={() => onTaskCreate?.({ title: '', estimatedMinutes: 15 })}
                  className="flex items-center gap-2 h-12 justify-start"
                >
                  <Plus className="h-5 w-5" />
                  Add Quick Task
                </Button>
                
                <Button
                  variant="outline"
                  onClick={toggleFocusMode}
                  className="flex items-center gap-2 h-12 justify-start"
                >
                  <Target className="h-5 w-5" />
                  Toggle Focus Mode
                </Button>
                
                <Button
                  variant="outline"
                  className="flex items-center gap-2 h-12 justify-start"
                >
                  <BarChart3 className="h-5 w-5" />
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Quick Wins Available */}
          {todaysStats.quickWins > 0 && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-800">
                  <Star className="h-5 w-5" />
                  Quick Wins Available ({todaysStats.quickWins})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-green-700 mb-3">
                  You have {todaysStats.quickWins} task{todaysStats.quickWins > 1 ? 's' : ''} that can be completed in 15 minutes or less. Perfect for building momentum!
                </p>
                <Button size="sm" className="bg-green-600 hover:bg-green-700">
                  Show Quick Tasks
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Productivity Tip */}
          <Card className="border-purple-200 bg-purple-50">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                  <Lightbulb className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-purple-900 mb-1">Productivity Tip</h4>
                  <p className="text-sm text-purple-700">{PRODUCTIVITY_TIPS[currentTip]}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5 text-gray-600" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-gray-500">{activity.action} • {activity.timestamp}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Focus Session Status */}
          {focusMode.pomodoro.isActive && (
            <Card className="border-blue-200 bg-blue-50">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Timer className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-blue-900">Focus Session Active</h4>
                      <p className="text-sm text-blue-700">
                        {formatTime(focusMode.pomodoro.timeRemaining)} remaining
                      </p>
                    </div>
                  </div>
                  <Badge variant="default" className="bg-blue-600">
                    {focusMode.pomodoro.currentSession === 'focus' ? 'Focus' : 'Break'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
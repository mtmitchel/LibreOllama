import React, { useState, useMemo, useEffect } from 'react';
import {
  Activity,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Calendar,
  CheckCircle,
  MessageSquare,
  FileText,
  Zap,
  Award,
  AlertCircle,
  Star,
  RefreshCw,
  Filter,
  ChevronRight,
  BarChart3,
  Lightbulb,
  Timer
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { contextEngine, type ContentItem } from '../../lib/context-engine';
import { useFocusMode } from '../../hooks/use-focus-mode';
import { useCalendar } from '../../hooks/use-calendar';
import type { 
  TaskItem, 
  ChatSession, 
  Item, 
  ProductivityMetric,
  ProductivityInsight,
  EnergyLevel 
} from '../../lib/types';

interface ActivityAggregationHubProps {
  notes?: Item[];
  tasks?: TaskItem[];
  chats?: ChatSession[];
  className?: string;
}

interface ActivityItem {
  id: string;
  type: 'note' | 'task' | 'chat' | 'calendar' | 'focus';
  title: string;
  description: string;
  timestamp: string;
  status?: 'completed' | 'in-progress' | 'pending';
  priority?: 'high' | 'medium' | 'low';
  tags: string[];
  relatedItems?: string[];
}

interface WeeklyProgress {
  tasksCompleted: number;
  notesCreated: number;
  focusHours: number;
  chatInteractions: number;
  weeklyGoal: number;
  streakDays: number;
}

interface ProductivityPattern {
  id: string;
  title: string;
  description: string;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
}

const MOCK_PATTERNS: ProductivityPattern[] = [
  {
    id: '1',
    title: 'Morning Peak Performance',
    description: 'You complete 40% more tasks between 9-11 AM',
    confidence: 0.92,
    trend: 'up',
    impact: 'high',
    actionable: true
  },
  {
    id: '2',
    title: 'Friday Focus Drop',
    description: 'Focus sessions are 25% shorter on Fridays',
    confidence: 0.78,
    trend: 'down',
    impact: 'medium',
    actionable: true
  },
  {
    id: '3',
    title: 'Note-to-Task Conversion',
    description: 'Meeting notes lead to actionable tasks 65% of the time',
    confidence: 0.85,
    trend: 'stable',
    impact: 'medium',
    actionable: true
  }
];

const AI_INSIGHTS = [
  "💡 Consider time-blocking your calendar to protect focus time",
  "🎯 Break down large projects into smaller, manageable tasks",
  "⚡ Your energy peaks at 10 AM - schedule important work then",
  "🔄 Review and organize notes weekly to maintain clarity",
  "🏆 Celebrate small wins to maintain motivation",
  "🧠 Use the 2-minute rule for quick tasks to reduce overwhelm"
];

export function ActivityAggregationHub({
  notes = [],
  tasks = [],
  chats = [],
  className = ''
}: ActivityAggregationHubProps) {
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');
  const [currentInsight, setCurrentInsight] = useState(0);
  
  const { focusMode } = useFocusMode();
  const { events } = useCalendar({});

  // Rotate AI insights every 45 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentInsight((prev) => (prev + 1) % AI_INSIGHTS.length);
    }, 45000);
    return () => clearInterval(interval);
  }, []);

  // Aggregate all activities
  const activities = useMemo(() => {
    const activityList: ActivityItem[] = [];
    const now = new Date();
    
    // Filter by timeframe
    const getTimeframeCutoff = () => {
      const cutoff = new Date();
      switch (timeframe) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(cutoff.getDate() - 7);
          break;
        case 'month':
          cutoff.setDate(cutoff.getDate() - 30);
          break;
      }
      return cutoff;
    };
    
    const cutoff = getTimeframeCutoff();

    // Add recent notes
    notes
      .filter(note => new Date(note.updatedAt) >= cutoff)
      .forEach(note => {
        activityList.push({
          id: note.id,
          type: 'note',
          title: note.name,
          description: note.content?.slice(0, 100) + (note.content && note.content.length > 100 ? '...' : '') || 'No content',
          timestamp: note.updatedAt,
          tags: note.tags || [],
          relatedItems: []
        });
      });

    // Add recent tasks
    tasks
      .filter(task => new Date(task.updatedAt) >= cutoff)
      .forEach(task => {
        activityList.push({
          id: task.id,
          type: 'task',
          title: task.title,
          description: task.description || 'No description',
          timestamp: task.updatedAt,
          status: task.status === 'done' ? 'completed' : task.status === 'inprogress' ? 'in-progress' : 'pending',
          priority: task.priority,
          tags: task.tags || [],
          relatedItems: []
        });
      });

    // Add recent chats
    chats
      .filter(chat => new Date(chat.updatedAt) >= cutoff)
      .forEach(chat => {
        activityList.push({
          id: chat.id,
          type: 'chat',
          title: chat.title,
          description: `${chat.messages.length} messages`,
          timestamp: chat.updatedAt,
          tags: chat.tags || [],
          relatedItems: []
        });
      });

    // Add calendar events
    events
      .filter(event => new Date(event.start) >= cutoff)
      .forEach(event => {
        activityList.push({
          id: event.id,
          type: 'calendar',
          title: event.title,
          description: event.description || 'Calendar event',
          timestamp: event.start.toISOString(),
          tags: event.tags || [],
          relatedItems: []
        });
      });

    // Sort by timestamp (most recent first)
    return activityList.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [notes, tasks, chats, events, timeframe]);

  // Calculate weekly progress
  const weeklyProgress = useMemo((): WeeklyProgress => {
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const recentTasks = tasks.filter(task => new Date(task.updatedAt) >= oneWeekAgo);
    const completedTasks = recentTasks.filter(task => task.status === 'done').length;
    const recentNotes = notes.filter(note => new Date(note.updatedAt) >= oneWeekAgo).length;
    const recentChats = chats.filter(chat => new Date(chat.updatedAt) >= oneWeekAgo).length;

    return {
      tasksCompleted: completedTasks,
      notesCreated: recentNotes,
      focusHours: Math.floor(focusMode.pomodoro.sessionCount * 0.5), // Approximate
      chatInteractions: recentChats,
      weeklyGoal: 25, // Mock goal
      streakDays: 5 // Mock streak
    };
  }, [tasks, notes, chats, focusMode.pomodoro.sessionCount]);

  // Group activities by type for better visualization
  const activityGroups = useMemo(() => {
    const groups = activities.reduce((acc, activity) => {
      if (!acc[activity.type]) acc[activity.type] = [];
      acc[activity.type].push(activity);
      return acc;
    }, {} as Record<string, ActivityItem[]>);

    return groups;
  }, [activities]);

  // Calculate quick wins
  const quickWins = useMemo(() => {
    return tasks.filter(task => 
      task.estimatedMinutes && 
      task.estimatedMinutes <= 15 && 
      task.status !== 'done'
    ).slice(0, 5);
  }, [tasks]);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'note': return <FileText className="h-4 w-4" />;
      case 'task': return <CheckCircle className="h-4 w-4" />;
      case 'chat': return <MessageSquare className="h-4 w-4" />;
      case 'calendar': return <Calendar className="h-4 w-4" />;
      case 'focus': return <Target className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'note': return 'text-blue-600 bg-blue-100';
      case 'task': return 'text-green-600 bg-green-100';
      case 'chat': return 'text-purple-600 bg-purple-100';
      case 'calendar': return 'text-orange-600 bg-orange-100';
      case 'focus': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-100';
      case 'in-progress': return 'text-blue-600 bg-blue-100';
      case 'pending': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-3 w-3 text-green-500" />;
      case 'down': return <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />;
      case 'stable': return <div className="h-3 w-3 rounded-full bg-gray-400" />;
      default: return null;
    }
  };

  return (
    <div className={`h-full overflow-hidden ${className}`}>
      <div className="p-6 border-b">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Activity className="h-6 w-6 text-blue-600" />
              Activity Hub
            </h1>
            <p className="text-muted-foreground">Your productivity insights and activity aggregation</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={timeframe} onValueChange={(value) => setTimeframe(value as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="activity">Activity Timeline</TabsTrigger>
            <TabsTrigger value="patterns">AI Insights</TabsTrigger>
            <TabsTrigger value="quick-wins">Quick Wins</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                {/* Weekly Progress Summary */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Weekly Progress
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{weeklyProgress.tasksCompleted}</div>
                        <div className="text-sm text-gray-600">Tasks Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{weeklyProgress.notesCreated}</div>
                        <div className="text-sm text-gray-600">Notes Created</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{weeklyProgress.focusHours}h</div>
                        <div className="text-sm text-gray-600">Focus Time</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{weeklyProgress.streakDays}</div>
                        <div className="text-sm text-gray-600">Day Streak</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Weekly Goal Progress</span>
                        <span>{Math.round((weeklyProgress.tasksCompleted / weeklyProgress.weeklyGoal) * 100)}%</span>
                      </div>
                      <Progress value={(weeklyProgress.tasksCompleted / weeklyProgress.weeklyGoal) * 100} />
                    </div>
                  </CardContent>
                </Card>

                {/* AI-Powered Insight */}
                <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-purple-100 rounded-lg flex-shrink-0">
                        <Brain className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-purple-900 mb-1">AI Insight</h4>
                        <p className="text-sm text-purple-700">{AI_INSIGHTS[currentInsight]}</p>
                      </div>
                      <div className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded">
                        AI
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Activity Type Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Activity Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(activityGroups).map(([type, items]) => (
                        <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${getActivityColor(type)}`}>
                              {getActivityIcon(type)}
                            </div>
                            <div>
                              <div className="font-medium capitalize">{type}s</div>
                              <div className="text-sm text-gray-600">{items.length} items</div>
                            </div>
                          </div>
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Recent Achievements */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-yellow-600" />
                      Recent Achievements
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                        <Award className="h-5 w-5 text-green-600" />
                        <div>
                          <div className="font-medium">Focus Master</div>
                          <div className="text-sm text-gray-600">Completed 5 focus sessions this week</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <Star className="h-5 w-5 text-blue-600" />
                        <div>
                          <div className="font-medium">Note Taker</div>
                          <div className="text-sm text-gray-600">Created {weeklyProgress.notesCreated} notes this week</div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="activity" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-4">
                {activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No recent activity</h3>
                    <p className="text-sm text-gray-500">Start creating notes, tasks, or chats to see activity here</p>
                  </div>
                ) : (
                  activities.map((activity) => (
                    <Card key={activity.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                            {getActivityIcon(activity.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-medium text-gray-900 truncate">{activity.title}</h3>
                              <Badge variant="outline" className="text-xs capitalize">
                                {activity.type}
                              </Badge>
                              {activity.status && (
                                <Badge className={`text-xs ${getStatusColor(activity.status)}`}>
                                  {activity.status}
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-600 mb-2">{activity.description}</p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              <span>{new Date(activity.timestamp).toLocaleString()}</span>
                              {activity.tags.length > 0 && (
                                <span>#{activity.tags.slice(0, 2).join(' #')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="patterns" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                {MOCK_PATTERNS.map((pattern) => (
                  <Card key={pattern.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium">{pattern.title}</h3>
                          {getTrendIcon(pattern.trend)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={pattern.impact === 'high' ? 'default' : 'secondary'}>
                            {pattern.impact} impact
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round(pattern.confidence * 100)}% confident
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-3">{pattern.description}</p>
                      
                      {pattern.actionable && (
                        <Button variant="outline" size="sm">
                          Take Action
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="quick-wins" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-4">
                {quickWins.length === 0 ? (
                  <div className="text-center py-8">
                    <Timer className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No quick wins available</h3>
                    <p className="text-sm text-gray-500">Add tasks with estimated time ≤ 15 minutes</p>
                  </div>
                ) : (
                  <>
                    <div className="text-center mb-6">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        🚀 {quickWins.length} Quick Win{quickWins.length !== 1 ? 's' : ''} Available
                      </h3>
                      <p className="text-sm text-gray-600">
                        Perfect for building momentum and getting things done!
                      </p>
                    </div>
                    
                    {quickWins.map((task) => (
                      <Card key={task.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h3 className="font-medium text-gray-900 mb-1">{task.title}</h3>
                              <p className="text-sm text-gray-600 mb-2">{task.description}</p>
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="text-xs">
                                  ⏱️ {task.estimatedMinutes} min
                                </Badge>
                                {task.priority && (
                                  <Badge variant={task.priority === 'high' ? 'destructive' : 'secondary'} className="text-xs">
                                    {task.priority} priority
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Button size="sm">
                              Start Now
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
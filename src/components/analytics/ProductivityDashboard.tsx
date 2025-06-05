import { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  Brain,
  Zap,
  Activity,
  Award,
  AlertCircle,
  Moon,
  Sun,
  Download,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { ScrollArea } from '../ui/scroll-area';
import { ProductivityMetric, ProductivityInsight, EnergyLevel, AnalyticsTimeframe } from '@/lib/types';

interface ProductivityDashboardProps {
  metrics?: ProductivityMetric[];
  insights?: ProductivityInsight[];
  timeframe?: AnalyticsTimeframe;
  onTimeframeChange?: (timeframe: AnalyticsTimeframe) => void;
  className?: string;
}

interface DashboardStats {
  totalFocusTime: number;
  averageFocusSession: number;
  tasksCompleted: number;
  productivityScore: number;
  streakDays: number;
  peakHours: string[];
  energyDistribution: Record<EnergyLevel, number>;
  weeklyTrend: number;
}

// Mock data for demonstration
const MOCK_METRICS: ProductivityMetric[] = [
  {
    id: 'metric-1',
    userId: 'user-1',
    date: '2024-01-22',
    metrics: {
      focusSessionCount: 6,
      focusSessionDuration: 180,
      tasksCompleted: 8,
      notesCreated: 3,
      chatInteractions: 12,
      energyLevels: [
        { timestamp: '2024-01-22T09:00:00Z', level: 'high', context: 'morning routine' },
        { timestamp: '2024-01-22T13:00:00Z', level: 'medium', context: 'post-lunch' },
        { timestamp: '2024-01-22T17:00:00Z', level: 'low', context: 'end of day' }
      ],
      distractionCount: 4,
      flowStateMinutes: 120
    },
    insights: {
      peakProductivityHours: ['09:00-11:00', '14:00-16:00'],
      mostProductiveTaskTypes: ['coding', 'writing'],
      energyPatterns: 'High energy in mornings, declining after lunch',
      recommendations: [
        'Schedule complex tasks in the morning',
        'Take breaks every 90 minutes',
        'Consider afternoon energy boost activities'
      ]
    }
  },
  {
    id: 'metric-2',
    userId: 'user-1',
    date: '2024-01-21',
    metrics: {
      focusSessionCount: 4,
      focusSessionDuration: 150,
      tasksCompleted: 6,
      notesCreated: 2,
      chatInteractions: 8,
      energyLevels: [
        { timestamp: '2024-01-21T09:00:00Z', level: 'medium', context: 'slow start' },
        { timestamp: '2024-01-21T13:00:00Z', level: 'high', context: 'post-coffee' },
        { timestamp: '2024-01-21T17:00:00Z', level: 'medium', context: 'steady finish' }
      ],
      distractionCount: 6,
      flowStateMinutes: 90
    }
  }
];

const MOCK_INSIGHTS: ProductivityInsight[] = [
  {
    id: 'insight-1',
    type: 'pattern',
    title: 'Morning Productivity Peak',
    description: 'You consistently perform best between 9-11 AM with 85% higher task completion rates.',
    data: { timeRange: '09:00-11:00', improvement: 85 },
    confidence: 0.92,
    actionable: true,
    actions: [
      { label: 'Schedule important tasks in morning', action: 'schedule-morning' },
      { label: 'Block calendar for deep work', action: 'block-calendar' }
    ],
    createdAt: '2024-01-22T10:00:00Z'
  },
  {
    id: 'insight-2',
    type: 'recommendation',
    title: 'Break Optimization',
    description: 'Taking 15-minute breaks every 90 minutes could increase your focus time by 23%.',
    data: { currentBreakInterval: 120, recommendedInterval: 90, expectedImprovement: 23 },
    confidence: 0.78,
    actionable: true,
    actions: [
      { label: 'Set break reminders', action: 'set-reminders' },
      { label: 'Try Pomodoro technique', action: 'enable-pomodoro' }
    ],
    createdAt: '2024-01-21T15:30:00Z'
  },
  {
    id: 'insight-3',
    type: 'achievement',
    title: 'Focus Streak Achievement',
    description: 'Congratulations! You\'ve maintained consistent focus sessions for 7 days straight.',
    data: { streakDays: 7, previousBest: 5 },
    confidence: 1.0,
    actionable: false,
    createdAt: '2024-01-22T18:00:00Z'
  },
  {
    id: 'insight-4',
    type: 'warning',
    title: 'Energy Dip Pattern',
    description: 'Your energy consistently drops after lunch. Consider adjusting your schedule.',
    data: { timeRange: '13:00-15:00', energyDrop: 40 },
    confidence: 0.85,
    actionable: true,
    actions: [
      { label: 'Schedule lighter tasks post-lunch', action: 'adjust-schedule' },
      { label: 'Try a short walk after eating', action: 'add-walk-reminder' }
    ],
    createdAt: '2024-01-20T16:00:00Z'
  }
];

export function ProductivityDashboard({
  metrics = MOCK_METRICS,
  insights = MOCK_INSIGHTS,
  timeframe = { start: '2024-01-15', end: '2024-01-22', granularity: 'day' },
  onTimeframeChange,
  className = ''
}: ProductivityDashboardProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('week');
  // Note: selectedMetric will be used for future metric filtering functionality
  // const [selectedMetric, setSelectedMetric] = useState('productivity');

  // Calculate dashboard statistics
  const stats: DashboardStats = useMemo(() => {
    const totalFocusTime = metrics.reduce((sum, m) => sum + m.metrics.focusSessionDuration, 0);
    const totalSessions = metrics.reduce((sum, m) => sum + m.metrics.focusSessionCount, 0);
    const totalTasks = metrics.reduce((sum, m) => sum + m.metrics.tasksCompleted, 0);
    const totalFlowTime = metrics.reduce((sum, m) => sum + m.metrics.flowStateMinutes, 0);

    // Energy distribution
    const energyDistribution: Record<EnergyLevel, number> = { high: 0, medium: 0, low: 0 };
    metrics.forEach(m => {
      m.metrics.energyLevels.forEach(e => {
        energyDistribution[e.level]++;
      });
    });

    // Peak hours analysis
    const hourCounts: Record<string, number> = {};
    metrics.forEach(m => {
      if (m.insights?.peakProductivityHours) {
        m.insights.peakProductivityHours.forEach(hour => {
          hourCounts[hour] = (hourCounts[hour] || 0) + 1;
        });
      }
    });
    const peakHours = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 2)
      .map(([hour]) => hour);

    // Productivity score (0-100)
    const focusEfficiency = totalSessions > 0 ? (totalFlowTime / totalFocusTime) * 100 : 0;
    const taskEfficiency = totalFocusTime > 0 ? (totalTasks / (totalFocusTime / 60)) * 10 : 0;
    const productivityScore = Math.min(100, (focusEfficiency + taskEfficiency) / 2);

    return {
      totalFocusTime,
      averageFocusSession: totalSessions > 0 ? totalFocusTime / totalSessions : 0,
      tasksCompleted: totalTasks,
      productivityScore: Math.round(productivityScore),
      streakDays: 7, // Mock streak
      peakHours,
      energyDistribution,
      weeklyTrend: 12 // Mock trend percentage
    };
  }, [metrics]);

  // Group insights by type
  const groupedInsights = useMemo(() => {
    return insights.reduce((acc, insight) => {
      if (!acc[insight.type]) acc[insight.type] = [];
      acc[insight.type].push(insight);
      return acc;
    }, {} as Record<string, ProductivityInsight[]>);
  }, [insights]);

  const getInsightIcon = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'pattern': return <TrendingUp className="h-4 w-4" />;
      case 'recommendation': return <Brain className="h-4 w-4" />;
      case 'achievement': return <Award className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getInsightColor = (type: ProductivityInsight['type']) => {
    switch (type) {
      case 'pattern': return 'text-blue-600 bg-blue-100';
      case 'recommendation': return 'text-purple-600 bg-purple-100';
      case 'achievement': return 'text-green-600 bg-green-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getEnergyIcon = (level: EnergyLevel) => {
    switch (level) {
      case 'high': return <Zap className="h-4 w-4 text-green-500" />;
      case 'medium': return <Sun className="h-4 w-4 text-yellow-500" />;
      case 'low': return <Moon className="h-4 w-4 text-blue-500" />;
    }
  };

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="h-6 w-6 text-blue-600" />
              Productivity Dashboard
            </h1>
            <p className="text-muted-foreground">Track your focus, energy, and productivity patterns</p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedTimeframe} onValueChange={setSelectedTimeframe}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="quarter">This Quarter</SelectItem>
              </SelectContent>
            </Select>
            
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <Tabs defaultValue="overview" className="h-full flex flex-col">
          <TabsList className="mx-6 mt-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="focus">Focus Analysis</TabsTrigger>
            <TabsTrigger value="energy">Energy Patterns</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{Math.round(stats.totalFocusTime / 60)}h</div>
                          <div className="text-sm text-muted-foreground">Total Focus Time</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                          <Target className="h-5 w-5 text-green-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.tasksCompleted}</div>
                          <div className="text-sm text-muted-foreground">Tasks Completed</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-purple-100 rounded-lg">
                          <Brain className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.productivityScore}</div>
                          <div className="text-sm text-muted-foreground">Productivity Score</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 rounded-lg">
                          <Award className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <div className="text-2xl font-bold">{stats.streakDays}</div>
                          <div className="text-sm text-muted-foreground">Day Streak</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Progress Indicators */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Weekly Progress
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Focus Time Goal</span>
                          <span>{Math.round(stats.totalFocusTime / 60)}/40h</span>
                        </div>
                        <Progress value={(stats.totalFocusTime / 60 / 40) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Tasks Goal</span>
                          <span>{stats.tasksCompleted}/50</span>
                        </div>
                        <Progress value={(stats.tasksCompleted / 50) * 100} />
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Productivity Score</span>
                          <span>{stats.productivityScore}/100</span>
                        </div>
                        <Progress value={stats.productivityScore} />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Energy Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {Object.entries(stats.energyDistribution).map(([level, count]) => (
                          <div key={level} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {getEnergyIcon(level as EnergyLevel)}
                              <span className="capitalize">{level} Energy</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full" 
                                  style={{ 
                                    width: `${(count / Object.values(stats.energyDistribution).reduce((a, b) => a + b, 0)) * 100}%` 
                                  }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground">{count}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Peak Hours */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      Peak Productivity Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {stats.peakHours.map(hour => (
                        <Badge key={hour} variant="secondary" className="text-sm">
                          {hour}
                        </Badge>
                      ))}
                      {stats.peakHours.length === 0 && (
                        <span className="text-muted-foreground">No peak hours identified yet</span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="focus" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Focus Session Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">
                          {Math.round(stats.averageFocusSession)}
                        </div>
                        <div className="text-sm text-muted-foreground">Avg Session (min)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">
                          {metrics.reduce((sum, m) => sum + m.metrics.focusSessionCount, 0)}
                        </div>
                        <div className="text-sm text-muted-foreground">Total Sessions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-3xl font-bold text-purple-600">
                          {Math.round((metrics.reduce((sum, m) => sum + m.metrics.flowStateMinutes, 0) / stats.totalFocusTime) * 100)}%
                        </div>
                        <div className="text-sm text-muted-foreground">Flow State</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Daily Focus Breakdown</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {metrics.map(metric => (
                        <div key={metric.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div>
                            <div className="font-medium">{new Date(metric.date).toLocaleDateString()}</div>
                            <div className="text-sm text-muted-foreground">
                              {metric.metrics.focusSessionCount} sessions
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">{Math.round(metric.metrics.focusSessionDuration / 60)}h</div>
                            <div className="text-sm text-muted-foreground">
                              {metric.metrics.tasksCompleted} tasks
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="energy" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Energy Pattern Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics.map(metric => (
                        <div key={metric.id} className="space-y-2">
                          <div className="font-medium">{new Date(metric.date).toLocaleDateString()}</div>
                          <div className="flex gap-2">
                            {metric.metrics.energyLevels.map((energy, index) => (
                              <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                                {getEnergyIcon(energy.level)}
                                <span className="text-sm">
                                  {new Date(energy.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {energy.context}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="insights" className="flex-1 overflow-hidden">
            <ScrollArea className="h-full px-6">
              <div className="py-4 space-y-6">
                {Object.entries(groupedInsights).map(([type, typeInsights]) => (
                  <Card key={type}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 capitalize">
                        {getInsightIcon(type as ProductivityInsight['type'])}
                        {type}s
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {typeInsights.map(insight => (
                          <div key={insight.id} className="p-4 border rounded-lg">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <div className={`p-1 rounded ${getInsightColor(insight.type)}`}>
                                    {getInsightIcon(insight.type)}
                                  </div>
                                  <h4 className="font-medium">{insight.title}</h4>
                                  <Badge variant="outline" className="text-xs">
                                    {Math.round(insight.confidence * 100)}% confidence
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground mb-3">
                                  {insight.description}
                                </p>
                                {insight.actionable && insight.actions && (
                                  <div className="flex flex-wrap gap-2">
                                    {insight.actions.map((action, index) => (
                                      <Button key={index} variant="outline" size="sm">
                                        {action.label}
                                      </Button>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
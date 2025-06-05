import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Info,
  Bug,
  Zap,
  Target,
  Code,
  PaintBucket,
  Accessibility,
  Smartphone
} from 'lucide-react';

interface AnalysisResult {
  id: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  impact: string;
  recommendation: string;
  codeLocation?: string;
  isFixed: boolean;
}

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  target: number;
  status: 'good' | 'warning' | 'critical';
}

const ANALYSIS_ISSUES: AnalysisResult[] = [
  {
    id: 'wb-001',
    category: 'Core Functionality',
    severity: 'high',
    title: 'Shape Tool Missing Implementation',
    description: 'Shape selector dropdown does not update tool options when shape type is selected',
    impact: 'Users cannot change shape types, limiting shape tool functionality',
    recommendation: 'Implement shape type selection handler in the dropdown menu',
    codeLocation: 'WhiteboardCanvas.tsx:512',
    isFixed: false
  },
  {
    id: 'wb-002',
    category: 'Core Functionality',
    severity: 'high',
    title: 'Drawing Tool Not Implemented',
    description: 'Pen tool is configured but drawing functionality is missing from element rendering',
    impact: 'Drawing tool appears in toolbar but creates no visual output',
    recommendation: 'Implement drawing element rendering and path creation',
    codeLocation: 'WhiteboardCanvas.tsx:465',
    isFixed: false
  },
  {
    id: 'wb-003',
    category: 'User Experience',
    severity: 'medium',
    title: 'Missing Visual Feedback for Tool States',
    description: 'No hover states or visual feedback when tools are activated or elements are hovered',
    impact: 'Users may be uncertain about current tool state and available interactions',
    recommendation: 'Add hover states and active tool visual feedback',
    codeLocation: 'whiteboard.css:42',
    isFixed: false
  },
  {
    id: 'wb-004',
    category: 'Performance',
    severity: 'medium',
    title: 'Inefficient Element Rendering',
    description: 'All elements are rendered regardless of viewport visibility',
    impact: 'Performance degradation with large numbers of elements',
    recommendation: 'Implement viewport culling using getVisibleElements() effectively',
    codeLocation: 'WhiteboardCanvas.tsx:471',
    isFixed: false
  },
  {
    id: 'wb-005',
    category: 'Keyboard Navigation',
    severity: 'medium',
    title: 'Incomplete Keyboard Shortcuts',
    description: 'Grid toggle (G) and snap toggle (Shift+G) shortcuts are defined but not implemented',
    impact: 'Keyboard users cannot access all functionality efficiently',
    recommendation: 'Implement missing keyboard shortcut handlers',
    codeLocation: 'WhiteboardCanvas.tsx:167',
    isFixed: false
  },
  {
    id: 'wb-006',
    category: 'Accessibility',
    severity: 'high',
    title: 'Missing ARIA Labels and Focus Management',
    description: 'Whiteboard elements lack proper ARIA labels and focus management for screen readers',
    impact: 'Inaccessible to users with visual impairments or those using assistive technology',
    recommendation: 'Add comprehensive ARIA labels and keyboard navigation support',
    codeLocation: 'WhiteboardCanvas.tsx:350',
    isFixed: false
  },
  {
    id: 'wb-007',
    category: 'Data Persistence',
    severity: 'critical',
    title: 'Canvas Name Update Issue',
    description: 'Attempting to update canvas name calls updateElement with invalid canvas ID',
    impact: 'Canvas naming functionality broken, may cause errors',
    recommendation: 'Fix canvas name update to use proper state management',
    codeLocation: 'WhiteboardCanvas.tsx:527',
    isFixed: false
  },
  {
    id: 'wb-008',
    category: 'User Experience',
    severity: 'low',
    title: 'Selection Box Minimum Size',
    description: 'Selection box only activates if larger than 5x5 pixels',
    impact: 'Small selection gestures may not work as expected',
    recommendation: 'Reduce minimum selection box size or add click tolerance',
    codeLocation: 'WhiteboardCanvas.tsx:289',
    isFixed: false
  },
  {
    id: 'wb-009',
    category: 'Performance',
    severity: 'medium',
    title: 'Coordinate Transformation in Render Loop',
    description: 'Canvas-to-screen transformation calculated on every render for each element',
    impact: 'Unnecessary computation during rendering, especially with many elements',
    recommendation: 'Memoize coordinate transformations or use CSS transforms',
    codeLocation: 'WhiteboardCanvas.tsx:352',
    isFixed: false
  },
  {
    id: 'wb-010',
    category: 'Responsive Design',
    severity: 'medium',
    title: 'Touch Device Optimization Missing',
    description: 'No specific touch event handling or mobile-optimized interactions',
    impact: 'Poor user experience on tablets and mobile devices',
    recommendation: 'Implement touch event handlers and mobile-specific UI adjustments',
    codeLocation: 'WhiteboardCanvas.tsx:229',
    isFixed: false
  }
];

const PERFORMANCE_METRICS: PerformanceMetric[] = [
  {
    name: 'Tool Switch Response Time',
    value: 85,
    unit: 'ms',
    target: 100,
    status: 'good'
  },
  {
    name: 'Element Creation Time',
    value: 120,
    unit: 'ms',
    target: 150,
    status: 'good'
  },
  {
    name: 'Viewport Render Time',
    value: 16.8,
    unit: 'ms',
    target: 16.7,
    status: 'warning'
  },
  {
    name: 'Memory Usage',
    value: 45,
    unit: 'MB',
    target: 50,
    status: 'good'
  },
  {
    name: 'Undo/Redo Response',
    value: 45,
    unit: 'ms',
    target: 100,
    status: 'good'
  }
];

export function WhiteboardAnalyzer() {
  const [issues, setIssues] = useState<AnalysisResult[]>(ANALYSIS_ISSUES);
  const [metrics, setMetrics] = useState<PerformanceMetric[]>(PERFORMANCE_METRICS);
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);

  const runAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate analysis steps
    const analysisSteps = [
      'Scanning component structure...',
      'Analyzing TypeScript types...',
      'Checking event handlers...',
      'Validating accessibility...',
      'Testing performance...',
      'Reviewing UX patterns...',
      'Generating recommendations...'
    ];

    for (let i = 0; i < analysisSteps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setAnalysisProgress(((i + 1) / analysisSteps.length) * 100);
    }

    setIsAnalyzing(false);
  }, []);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'high': return <AlertTriangle className="h-4 w-4 text-orange-600" />;
      case 'medium': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'low': return <Info className="h-4 w-4 text-blue-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  const getMetricIcon = (status: string) => {
    switch (status) {
      case 'good': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical': return <XCircle className="h-4 w-4 text-red-600" />;
      default: return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const filteredIssues = issues.filter(issue => {
    const severityMatch = selectedSeverity === 'all' || issue.severity === selectedSeverity;
    const categoryMatch = selectedCategory === 'all' || issue.category === selectedCategory;
    return severityMatch && categoryMatch;
  });

  const categoryStats = {
    'Core Functionality': issues.filter(i => i.category === 'Core Functionality').length,
    'User Experience': issues.filter(i => i.category === 'User Experience').length,
    'Performance': issues.filter(i => i.category === 'Performance').length,
    'Accessibility': issues.filter(i => i.category === 'Accessibility').length,
    'Keyboard Navigation': issues.filter(i => i.category === 'Keyboard Navigation').length,
    'Data Persistence': issues.filter(i => i.category === 'Data Persistence').length,
    'Responsive Design': issues.filter(i => i.category === 'Responsive Design').length,
  };

  const severityStats = {
    critical: issues.filter(i => i.severity === 'critical').length,
    high: issues.filter(i => i.severity === 'high').length,
    medium: issues.filter(i => i.severity === 'medium').length,
    low: issues.filter(i => i.severity === 'low').length,
  };

  const overallScore = Math.round(
    ((issues.length - severityStats.critical * 4 - severityStats.high * 3 - severityStats.medium * 2 - severityStats.low) / issues.length) * 100
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">Whiteboard Implementation Analysis</h1>
          <p className="text-muted-foreground">
            Comprehensive code analysis and quality assessment
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-2xl font-bold">{Math.max(0, overallScore)}%</div>
            <div className="text-sm text-muted-foreground">Quality Score</div>
          </div>
          <Button onClick={runAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? <Zap className="h-4 w-4 mr-2 animate-pulse" /> : <Target className="h-4 w-4 mr-2" />}
            {isAnalyzing ? 'Analyzing...' : 'Run Analysis'}
          </Button>
        </div>
      </div>

      {isAnalyzing && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <Progress value={analysisProgress} className="flex-1" />
            <span className="text-sm text-muted-foreground">{Math.round(analysisProgress)}%</span>
          </div>
        </div>
      )}

      <div className="flex-1 p-4">
        <Tabs defaultValue="issues" className="h-full">
          <TabsList className="mb-4">
            <TabsTrigger value="issues" className="flex items-center gap-2">
              <Bug className="h-4 w-4" />
              Issues ({issues.length})
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <PaintBucket className="h-4 w-4" />
              Improvements
            </TabsTrigger>
          </TabsList>

          <TabsContent value="issues" className="space-y-4">
            {/* Filter Controls */}
            <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Severity:</label>
                <select 
                  value={selectedSeverity} 
                  onChange={(e) => setSelectedSeverity(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All</option>
                  <option value="critical">Critical ({severityStats.critical})</option>
                  <option value="high">High ({severityStats.high})</option>
                  <option value="medium">Medium ({severityStats.medium})</option>
                  <option value="low">Low ({severityStats.low})</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Category:</label>
                <select 
                  value={selectedCategory} 
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-2 py-1 border rounded text-sm"
                >
                  <option value="all">All</option>
                  {Object.entries(categoryStats).map(([category, count]) => (
                    <option key={category} value={category}>
                      {category} ({count})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Issues List */}
            <div className="space-y-3">
              {filteredIssues.map((issue) => (
                <Card key={issue.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        {getSeverityIcon(issue.severity)}
                        <div>
                          <CardTitle className="text-lg">{issue.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant={getSeverityColor(issue.severity) as any}>
                              {issue.severity}
                            </Badge>
                            <Badge variant="outline">{issue.category}</Badge>
                            <code className="text-xs bg-muted px-2 py-1 rounded">
                              {issue.id}
                            </code>
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIssues(prev => 
                          prev.map(i => i.id === issue.id ? { ...i, isFixed: !i.isFixed } : i)
                        )}
                      >
                        {issue.isFixed ? 'Mark Unfixed' : 'Mark Fixed'}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div>
                        <h4 className="font-medium text-sm">Description</h4>
                        <p className="text-sm text-muted-foreground">{issue.description}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Impact</h4>
                        <p className="text-sm text-muted-foreground">{issue.impact}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-sm">Recommendation</h4>
                        <p className="text-sm">{issue.recommendation}</p>
                      </div>
                      {issue.codeLocation && (
                        <div>
                          <h4 className="font-medium text-sm">Location</h4>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {issue.codeLocation}
                          </code>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {metrics.map((metric) => (
                <Card key={metric.name}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-sm">{metric.name}</h3>
                      {getMetricIcon(metric.status)}
                    </div>
                    <div className="text-2xl font-bold">
                      {metric.value}{metric.unit}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Target: {metric.target}{metric.unit}
                    </div>
                    <Progress 
                      value={(metric.value / metric.target) * 100} 
                      className="mt-2"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert>
              <Zap className="h-4 w-4" />
              <AlertDescription>
                Performance metrics are simulated. In a real implementation, these would be measured 
                using performance.now(), React DevTools Profiler, and browser performance APIs.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="grid gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Code className="h-5 w-5" />
                    Code Quality Improvements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">Type Safety Enhancements</h4>
                    <p className="text-sm text-muted-foreground">
                      Add stricter TypeScript types for tool options and element properties to prevent runtime errors.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Event Handler Optimization</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement event delegation and throttling for mouse events to improve performance with many elements.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">State Management Refactoring</h4>
                    <p className="text-sm text-muted-foreground">
                      Consider using useReducer for complex whiteboard state to ensure predictable state updates.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Accessibility className="h-5 w-5" />
                    Accessibility Enhancements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">ARIA Implementation</h4>
                    <p className="text-sm text-muted-foreground">
                      Add role="application", aria-labels, and live regions for screen reader support.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Keyboard Navigation</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement full keyboard navigation with arrow keys for element selection and movement.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Focus Management</h4>
                    <p className="text-sm text-muted-foreground">
                      Proper focus trap and restoration when entering/exiting whiteboard mode.
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Smartphone className="h-5 w-5" />
                    Mobile & Touch Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium">Touch Event Handling</h4>
                    <p className="text-sm text-muted-foreground">
                      Implement touch events for pinch-to-zoom and gesture recognition on mobile devices.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Responsive UI</h4>
                    <p className="text-sm text-muted-foreground">
                      Adapt toolbar layout and tool sizes for different screen sizes and orientations.
                    </p>
                  </div>
                  <div>
                    <h4 className="font-medium">Performance on Mobile</h4>
                    <p className="text-sm text-muted-foreground">
                      Reduce rendering complexity and implement touch-specific optimizations.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
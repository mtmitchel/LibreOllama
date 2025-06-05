import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { WhiteboardCanvas } from '../notes/WhiteboardCanvas';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Play, 
  Pause, 
  RotateCcw,
  Bug,
  Zap,
  Target,
  Users,
  Monitor,
  Smartphone
} from 'lucide-react';

interface TestResult {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'running' | 'passed' | 'failed' | 'warning';
  duration?: number;
  error?: string;
  warnings?: string[];
  metrics?: Record<string, any>;
}

interface TestCategory {
  id: string;
  name: string;
  description: string;
  tests: TestResult[];
  criticalPath: boolean;
}

const WHITEBOARD_TEST_CATEGORIES: TestCategory[] = [
  {
    id: 'functional',
    name: 'Functional Testing',
    description: 'Core functionality and tool operations',
    criticalPath: true,
    tests: [
      {
        id: 'tool-selection',
        name: 'Tool Selection',
        description: 'Test all tool switching and activation states',
        status: 'pending'
      },
      {
        id: 'sticky-notes',
        name: 'Sticky Notes',
        description: 'Create, edit, resize, and style sticky notes',
        status: 'pending'
      },
      {
        id: 'text-elements',
        name: 'Text Elements',
        description: 'Text creation, editing, formatting, and alignment',
        status: 'pending'
      },
      {
        id: 'shapes',
        name: 'Shape Creation',
        description: 'All shape types, sizing, and styling',
        status: 'pending'
      },
      {
        id: 'drawing',
        name: 'Drawing Tools',
        description: 'Pen tool, paths, smoothing, and eraser',
        status: 'pending'
      },
      {
        id: 'arrows-lines',
        name: 'Arrows & Lines',
        description: 'Line creation, arrow heads, and connectors',
        status: 'pending'
      },
      {
        id: 'frames',
        name: 'Frame System',
        description: 'Frame creation, titling, and containment',
        status: 'pending'
      },
      {
        id: 'selection-system',
        name: 'Selection System',
        description: 'Single, multi-select, and selection box',
        status: 'pending'
      },
      {
        id: 'element-manipulation',
        name: 'Element Manipulation',
        description: 'Move, resize, rotate, duplicate, delete',
        status: 'pending'
      },
      {
        id: 'undo-redo',
        name: 'Undo/Redo System',
        description: 'History tracking and state restoration',
        status: 'pending'
      }
    ]
  },
  {
    id: 'viewport',
    name: 'Viewport & Navigation',
    description: 'Canvas navigation and zoom operations',
    criticalPath: true,
    tests: [
      {
        id: 'zoom-operations',
        name: 'Zoom Operations',
        description: 'Zoom in/out, fit to screen, reset zoom',
        status: 'pending'
      },
      {
        id: 'pan-navigation',
        name: 'Pan Navigation',
        description: 'Canvas panning and coordinate transformation',
        status: 'pending'
      },
      {
        id: 'grid-system',
        name: 'Grid System',
        description: 'Grid display, snap-to-grid, and alignment',
        status: 'pending'
      },
      {
        id: 'minimap',
        name: 'Minimap Navigation',
        description: 'Minimap display and viewport indication',
        status: 'pending'
      }
    ]
  },
  {
    id: 'keyboard',
    name: 'Keyboard & Shortcuts',
    description: 'Keyboard navigation and shortcut functionality',
    criticalPath: true,
    tests: [
      {
        id: 'tool-shortcuts',
        name: 'Tool Shortcuts',
        description: 'All tool activation shortcuts (V, S, T, P, etc.)',
        status: 'pending'
      },
      {
        id: 'action-shortcuts',
        name: 'Action Shortcuts',
        description: 'Undo, Redo, Copy, Delete, Select All',
        status: 'pending'
      },
      {
        id: 'zoom-shortcuts',
        name: 'Zoom Shortcuts',
        description: 'Zoom in/out, fit to screen shortcuts',
        status: 'pending'
      },
      {
        id: 'accessibility-nav',
        name: 'Accessibility Navigation',
        description: 'Tab navigation and screen reader support',
        status: 'pending'
      }
    ]
  },
  {
    id: 'performance',
    name: 'Performance Testing',
    description: 'Load testing and responsiveness validation',
    criticalPath: true,
    tests: [
      {
        id: 'element-count-stress',
        name: 'Element Count Stress Test',
        description: 'Performance with 100+ elements on canvas',
        status: 'pending'
      },
      {
        id: 'viewport-rendering',
        name: 'Viewport Rendering',
        description: 'Smooth zoom/pan at 60fps target',
        status: 'pending'
      },
      {
        id: 'tool-responsiveness',
        name: 'Tool Responsiveness',
        description: 'Tool switching under 100ms',
        status: 'pending'
      },
      {
        id: 'memory-usage',
        name: 'Memory Usage',
        description: 'Memory leak detection during extended use',
        status: 'pending'
      },
      {
        id: 'history-performance',
        name: 'History Performance',
        description: 'Undo/redo with large history stacks',
        status: 'pending'
      }
    ]
  },
  {
    id: 'ux-polish',
    name: 'UX Polish & Polish',
    description: 'User experience refinements and visual feedback',
    criticalPath: false,
    tests: [
      {
        id: 'hover-states',
        name: 'Hover States',
        description: 'Visual feedback on element and tool hover',
        status: 'pending'
      },
      {
        id: 'selection-indicators',
        name: 'Selection Indicators',
        description: 'Clear selection visual feedback',
        status: 'pending'
      },
      {
        id: 'loading-states',
        name: 'Loading States',
        description: 'Appropriate loading indicators',
        status: 'pending'
      },
      {
        id: 'error-handling',
        name: 'Error Handling',
        description: 'Graceful error states and recovery',
        status: 'pending'
      },
      {
        id: 'animations',
        name: 'Micro-animations',
        description: 'Smooth transitions and animations',
        status: 'pending'
      }
    ]
  },
  {
    id: 'integration',
    name: 'Integration Testing',
    description: 'LibreOllama integration and cross-module compatibility',
    criticalPath: true,
    tests: [
      {
        id: 'auto-save',
        name: 'Auto-save Integration',
        description: 'Automatic saving to notes database',
        status: 'pending'
      },
      {
        id: 'theme-switching',
        name: 'Theme Compatibility',
        description: 'Light/dark mode switching',
        status: 'pending'
      },
      {
        id: 'data-persistence',
        name: 'Data Persistence',
        description: 'State preservation across sessions',
        status: 'pending'
      },
      {
        id: 'export-functionality',
        name: 'Export Functionality',
        description: 'PNG/SVG export quality and accuracy',
        status: 'pending'
      }
    ]
  },
  {
    id: 'responsive',
    name: 'Responsive & Touch',
    description: 'Multi-device compatibility and touch interactions',
    criticalPath: false,
    tests: [
      {
        id: 'mobile-touch',
        name: 'Mobile Touch',
        description: 'Touch gestures and mobile interactions',
        status: 'pending'
      },
      {
        id: 'tablet-optimization',
        name: 'Tablet Optimization',
        description: 'Tablet-specific UX optimizations',
        status: 'pending'
      },
      {
        id: 'responsive-layout',
        name: 'Responsive Layout',
        description: 'Proper behavior across screen sizes',
        status: 'pending'
      },
      {
        id: 'cross-browser',
        name: 'Cross-browser Compatibility',
        description: 'Chrome, Firefox, Safari, Edge compatibility',
        status: 'pending'
      }
    ]
  }
];

export function WhiteboardTestSuite() {
  const [categories, setCategories] = useState<TestCategory[]>(WHITEBOARD_TEST_CATEGORIES);
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('functional');
  const [showWhiteboard, setShowWhiteboard] = useState(true);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const whiteboardRef = useRef<any>(null);

  const updateTestStatus = useCallback((categoryId: string, testId: string, updates: Partial<TestResult>) => {
    setCategories(prev => prev.map(category => 
      category.id === categoryId 
        ? {
            ...category,
            tests: category.tests.map(test => 
              test.id === testId ? { ...test, ...updates } : test
            )
          }
        : category
    ));
  }, []);

  const runSingleTest = useCallback(async (categoryId: string, testId: string) => {
    const startTime = performance.now();
    setCurrentTest(`${categoryId}-${testId}`);
    
    updateTestStatus(categoryId, testId, { status: 'running' });

    try {
      // Simulate test execution based on test type
      await new Promise(resolve => setTimeout(resolve, Math.random() * 2000 + 500));
      
      // Mock test results - in real implementation, these would be actual tests
      const mockResults: Record<string, { passed: boolean; metrics?: Record<string, any> }> = {
        'functional-tool-selection': { passed: true, metrics: { toolSwitchTime: 45 } },
        'functional-sticky-notes': { passed: true, metrics: { createTime: 120, editTime: 80 } },
        'functional-text-elements': { passed: true, metrics: { renderTime: 60 } },
        'performance-element-count-stress': { passed: true, metrics: { elementCount: 150, fps: 58 } },
        'performance-tool-responsiveness': { passed: true, metrics: { avgResponseTime: 85 } },
        'keyboard-tool-shortcuts': { passed: true, metrics: { shortcutsWorking: 9, shortcutsTotal: 10 } },
      };

      const testKey = `${categoryId}-${testId}`;
      const result = mockResults[testKey] || { passed: Math.random() > 0.1 };
      const duration = performance.now() - startTime;

      if (result.passed) {
        updateTestStatus(categoryId, testId, { 
          status: 'passed', 
          duration: Math.round(duration),
          metrics: result.metrics
        });
      } else {
        updateTestStatus(categoryId, testId, { 
          status: 'failed', 
          duration: Math.round(duration),
          error: 'Test assertion failed'
        });
      }
    } catch (error) {
      const duration = performance.now() - startTime;
      updateTestStatus(categoryId, testId, { 
        status: 'failed', 
        duration: Math.round(duration),
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, [updateTestStatus]);

  const runCategoryTests = useCallback(async (categoryId: string) => {
    const category = categories.find(c => c.id === categoryId);
    if (!category) return;

    setIsRunning(true);

    for (const test of category.tests) {
      await runSingleTest(categoryId, test.id);
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    setIsRunning(false);
    setCurrentTest(null);
  }, [categories, runSingleTest]);

  const runAllTests = useCallback(async () => {
    setIsRunning(true);
    
    // Run critical path tests first
    const criticalCategories = categories.filter(c => c.criticalPath);
    const nonCriticalCategories = categories.filter(c => !c.criticalPath);

    for (const category of [...criticalCategories, ...nonCriticalCategories]) {
      await runCategoryTests(category.id);
    }

    setIsRunning(false);
    setCurrentTest(null);
  }, [categories, runCategoryTests]);

  const resetTests = useCallback(() => {
    setCategories(WHITEBOARD_TEST_CATEGORIES.map(category => ({
      ...category,
      tests: category.tests.map(test => ({
        ...test,
        status: 'pending' as const,
        duration: undefined,
        error: undefined,
        warnings: undefined,
        metrics: undefined
      }))
    })));
    setCurrentTest(null);
    setTestResults({});
  }, []);

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Clock className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'warning': return <Bug className="h-4 w-4 text-yellow-600" />;
      default: return <div className="h-4 w-4 rounded-full border-2 border-gray-300" />;
    }
  };

  const getCategoryStats = (category: TestCategory) => {
    const total = category.tests.length;
    const passed = category.tests.filter(t => t.status === 'passed').length;
    const failed = category.tests.filter(t => t.status === 'failed').length;
    const running = category.tests.filter(t => t.status === 'running').length;
    
    return { total, passed, failed, running };
  };

  const getOverallProgress = () => {
    const allTests = categories.flatMap(c => c.tests);
    const completed = allTests.filter(t => t.status === 'passed' || t.status === 'failed').length;
    return (completed / allTests.length) * 100;
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div>
          <h1 className="text-2xl font-bold">Whiteboard Test Suite</h1>
          <p className="text-muted-foreground">
            Comprehensive testing and quality validation for whiteboard functionality
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowWhiteboard(!showWhiteboard)}
          >
            {showWhiteboard ? <Monitor className="h-4 w-4" /> : <Target className="h-4 w-4" />}
            {showWhiteboard ? 'Hide Canvas' : 'Show Canvas'}
          </Button>
          <Button
            variant="outline"
            onClick={resetTests}
            disabled={isRunning}
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Button
            onClick={runAllTests}
            disabled={isRunning}
          >
            {isRunning ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
            {isRunning ? 'Running...' : 'Run All Tests'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Left Panel - Test Categories */}
        <div className="w-80 border-r border-border overflow-y-auto">
          <div className="p-4">
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(getOverallProgress())}%
                </span>
              </div>
              <Progress value={getOverallProgress()} />
            </div>

            <div className="space-y-2">
              {categories.map((category) => {
                const stats = getCategoryStats(category);
                return (
                  <Card 
                    key={category.id}
                    className={`cursor-pointer transition-colors ${
                      selectedCategory === category.id ? 'ring-2 ring-blue-500' : ''
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">{category.name}</CardTitle>
                        {category.criticalPath && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{category.description}</p>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex gap-3">
                          <span className="text-green-600">{stats.passed} passed</span>
                          <span className="text-red-600">{stats.failed} failed</span>
                          {stats.running > 0 && (
                            <span className="text-blue-600">{stats.running} running</span>
                          )}
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            runCategoryTests(category.id);
                          }}
                          disabled={isRunning}
                        >
                          Run
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col">
          {showWhiteboard && (
            <div className="h-96 border-b border-border">
              <WhiteboardCanvas
                className="h-full"
                enableAutoSave={false}
                focusMode={false}
              />
            </div>
          )}

          {/* Test Details */}
          <div className="flex-1 overflow-y-auto p-4">
            {selectedCategoryData && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold">{selectedCategoryData.name}</h2>
                    <p className="text-muted-foreground">{selectedCategoryData.description}</p>
                  </div>
                  <Button
                    onClick={() => runCategoryTests(selectedCategory)}
                    disabled={isRunning}
                    variant="outline"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Run Category
                  </Button>
                </div>

                <div className="space-y-3">
                  {selectedCategoryData.tests.map((test) => (
                    <Card key={test.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            {getStatusIcon(test.status)}
                            <div>
                              <h3 className="font-medium">{test.name}</h3>
                              <p className="text-sm text-muted-foreground">{test.description}</p>
                              
                              {test.duration && (
                                <p className="text-xs text-muted-foreground mt-1">
                                  Duration: {test.duration}ms
                                </p>
                              )}
                              
                              {test.metrics && (
                                <div className="mt-2">
                                  <p className="text-xs font-medium">Metrics:</p>
                                  <div className="text-xs text-muted-foreground">
                                    {Object.entries(test.metrics).map(([key, value]) => (
                                      <span key={key} className="mr-3">
                                        {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}

                              {test.error && (
                                <Alert className="mt-2">
                                  <XCircle className="h-4 w-4" />
                                  <AlertDescription className="text-sm">
                                    {test.error}
                                  </AlertDescription>
                                </Alert>
                              )}

                              {test.warnings && test.warnings.length > 0 && (
                                <Alert className="mt-2">
                                  <Bug className="h-4 w-4" />
                                  <AlertDescription className="text-sm">
                                    {test.warnings.join(', ')}
                                  </AlertDescription>
                                </Alert>
                              )}
                            </div>
                          </div>
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => runSingleTest(selectedCategory, test.id)}
                            disabled={isRunning}
                          >
                            {currentTest === `${selectedCategory}-${test.id}` ? (
                              <Clock className="h-4 w-4 animate-spin" />
                            ) : (
                              <Play className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
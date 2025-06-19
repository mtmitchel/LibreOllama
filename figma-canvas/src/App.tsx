import React, { useEffect, useState, useCallback } from 'react';
import { TooltipProvider } from './components/ui/tooltip';
import { CanvasStage } from './components/Canvas/CanvasStage';
import { MainToolbar } from './components/Toolbars/MainToolbar';
import { FloatingToolbar } from './components/Toolbars/FloatingToolbar';
import { PropertyPanel } from './components/Toolbars/PropertyPanel';
import { useCanvasStore } from './store/canvasStore';
import { useToolStore } from './store/toolStore';
import { useHistoryStore } from './store/historyStore';
import { useCanvasInteraction } from './hooks/useCanvasInteraction';
import { useHistory } from './hooks/useHistory';
import { defaultStorageManager } from './utils/storage';
import { performanceMonitor, frameRateMonitor } from './utils/performance';
import { cn } from './lib/utils';
import './App.css';

const App: React.FC = () => {
  const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [isLoading, setIsLoading] = useState(true);
  const [showPropertyPanel, setShowPropertyPanel] = useState(true);
  const [showPerformanceStats, setShowPerformanceStats] = useState(false);

  // Store hooks
  const { 
    selectedIds, 
    viewport, 
    settings,
    addElement
    // loadCanvas  // TODO: Fix this export issue 
  } = useCanvasStore();
  
  const { 
    textEditingState, 
    tableEditingState 
  } = useToolStore();
  
  const { saveCurrentState } = useHistory();

  // Canvas interaction
  const canvasInteraction = useCanvasInteraction();

  // Handle window resize
  const handleResize = useCallback(() => {
    setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
  }, []);

  // Initialize application
  useEffect(() => {
    const init = async () => {
      try {
        // Initialize storage
        await defaultStorageManager.init();
        
        // Load default canvas or create new one
        const canvases = await defaultStorageManager.listCanvases();
        if (canvases.length > 0) {
          const lastCanvas = canvases.sort((a, b) => b.modifiedAt - a.modifiedAt)[0];
          // const canvasData = await defaultStorageManager.loadCanvas(lastCanvas.id);
          // if (canvasData) {
          //   // Load canvas data into store
          //   Object.values(canvasData.elements).forEach(element => {
          //     addElement(element);
          //   });
          // }
        } else {
          // Create initial welcome elements
          createWelcomeElements();
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize app:', error);
        setIsLoading(false);
      }
    };

    init();
  }, [addElement]);

  // Set up event listeners
  useEffect(() => {
    window.addEventListener('resize', handleResize);
    
    // Prevent browser shortcuts that conflict with canvas shortcuts
    const preventDefaults = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's': // Save
          case 'o': // Open
          case 'n': // New
            e.preventDefault();
            break;
        }
      }
    };
    
    document.addEventListener('keydown', preventDefaults);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('keydown', preventDefaults);
    };
  }, [handleResize]);

  // Auto-save functionality
  useEffect(() => {
    const autoSave = async () => {
      try {
        saveCurrentState('Auto-save');
        // In a real implementation, also save to storage
      } catch (error) {
        console.error('Auto-save failed:', error);
      }
    };

    const interval = setInterval(autoSave, 30000); // Auto-save every 30 seconds
    return () => clearInterval(interval);
  }, [saveCurrentState]);

  // Performance monitoring
  useEffect(() => {
    const updatePerformance = () => {
      frameRateMonitor.update();
      performanceMonitor.measure('app-render', () => {
        // Measure render performance
      });
    };

    const interval = setInterval(updatePerformance, 1000);
    return () => clearInterval(interval);
  }, []);

  // Create welcome elements for new canvas
  const createWelcomeElements = useCallback(() => {
    const welcomeTitle = {
      id: crypto.randomUUID(),
      type: 'TEXT' as any,
      x: canvasSize.width / 2 - 200,
      y: canvasSize.height / 2 - 100,
      width: 400,
      height: 60,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 1,
      style: {},
      data: {
        content: [{ type: 'paragraph', children: [{ text: 'Welcome to FigJam Canvas' }] }],
        fontSize: 32,
        fontFamily: 'Inter',
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#1a1a1a'
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    const welcomeSubtitle = {
      id: crypto.randomUUID(),
      type: 'TEXT' as any,
      x: canvasSize.width / 2 - 250,
      y: canvasSize.height / 2 - 20,
      width: 500,
      height: 30,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 2,
      style: {},
      data: {
        content: [{ type: 'paragraph', children: [{ text: 'Start creating by selecting a tool from the toolbar' }] }],
        fontSize: 16,
        fontFamily: 'Inter',
        textAlign: 'center',
        color: '#666666'
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    const welcomeShape = {
      id: crypto.randomUUID(),
      type: 'RECTANGLE' as any,
      x: canvasSize.width / 2 - 100,
      y: canvasSize.height / 2 + 50,
      width: 200,
      height: 100,
      rotation: 0,
      opacity: 1,
      visible: true,
      locked: false,
      zIndex: 0,
      style: {
        fill: '#f0f9ff',
        stroke: '#0ea5e9',
        strokeWidth: 2,
        borderRadius: 8
      },
      data: {
        shapeType: 'rectangle' as const
      },
      createdAt: Date.now(),
      modifiedAt: Date.now()
    };

    addElement(welcomeTitle);
    addElement(welcomeSubtitle);
    addElement(welcomeShape);
  }, [canvasSize, addElement]);

  // Keyboard shortcuts handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault();
          // Save canvas
          saveCurrentState('Manual save');
          break;
        case 'p':
          e.preventDefault();
          // Toggle property panel
          setShowPropertyPanel(prev => !prev);
          break;
        case '`':
          e.preventDefault();
          // Toggle performance stats
          setShowPerformanceStats(prev => !prev);
          break;
      }
    }
  }, [saveCurrentState]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-lg font-medium text-gray-700">Loading Canvas...</div>
          <div className="text-sm text-gray-500 mt-1">Initializing workspace</div>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="h-screen w-screen overflow-hidden bg-gray-50 flex">
        {/* Main Toolbar */}
        <div className="fixed top-4 left-4 z-50">
          <MainToolbar 
            position="left" 
            orientation="vertical"
            size="md"
          />
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          <CanvasStage
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0"
          />
          
          {/* Floating Text Toolbar */}
          {textEditingState.isEditing && textEditingState.toolbarVisible && textEditingState.toolbarPosition && (
            <FloatingToolbar
              position={textEditingState.toolbarPosition}
              elementId={textEditingState.elementId!}
              elementType="text"
              visible={true}
              onClose={() => {
                // Close text editing
              }}
            />
          )}
          
          {/* Floating Table Toolbar */}
          {tableEditingState.isEditing && (
            <FloatingToolbar
              position={{ x: canvasSize.width / 2, y: 100 }}
              elementId={tableEditingState.elementId!}
              elementType="table"
              visible={true}
              onClose={() => {
                // Close table editing
              }}
            />
          )}
        </div>

        {/* Property Panel */}
        {showPropertyPanel && (
          <div className="w-80 bg-white border-l border-gray-200 shadow-lg">
            <PropertyPanel />
          </div>
        )}

        {/* Status Bar */}
        <div className="fixed bottom-4 left-4 z-40 bg-white rounded-lg shadow-lg px-3 py-2 text-xs text-gray-600 space-x-4 flex items-center">
          <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
          <span>Elements: {Object.keys(useCanvasStore.getState().elements).length}</span>
          {selectedIds.length > 0 && (
            <span>Selected: {selectedIds.length}</span>
          )}
          <span>Grid: {settings.snapToGrid ? 'On' : 'Off'}</span>
        </div>

        {/* Performance Stats */}
        {showPerformanceStats && (
          <PerformanceStats />
        )}

        {/* Viewport Controls */}
        <div className="fixed bottom-4 right-4 z-40 bg-white rounded-lg shadow-lg p-2 space-y-1">
          <button 
            className="block w-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => useCanvasStore.getState().zoomToFit()}
          >
            Zoom to Fit
          </button>
          <button 
            className="block w-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => useCanvasStore.getState().zoomToSelection()}
            disabled={selectedIds.length === 0}
          >
            Zoom to Selection
          </button>
          <button 
            className="block w-full px-3 py-1 text-xs text-gray-700 hover:bg-gray-100 rounded"
            onClick={() => useCanvasStore.getState().setViewport({ zoom: 1 })}
          >
            100%
          </button>
        </div>
      </div>
    </TooltipProvider>
  );
};

// Performance statistics component
const PerformanceStats: React.FC = () => {
  const [stats, setStats] = useState<any>({});

  useEffect(() => {
    const updateStats = () => {
      const fps = frameRateMonitor.getAverageFPS();
      const performanceStats = performanceMonitor.getAllStats();
      const memoryInfo = (performance as any).memory;
      
      setStats({
        fps: Math.round(fps),
        minFps: Math.round(frameRateMonitor.getMinFPS()),
        maxFps: Math.round(frameRateMonitor.getMaxFPS()),
        performance: performanceStats,
        memory: memoryInfo ? {
          used: Math.round(memoryInfo.usedJSHeapSize / 1024 / 1024),
          total: Math.round(memoryInfo.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(memoryInfo.jsHeapSizeLimit / 1024 / 1024)
        } : null
      });
    };

    const interval = setInterval(updateStats, 1000);
    updateStats();
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 bg-black bg-opacity-80 text-white rounded-lg p-4 text-xs font-mono space-y-2 max-w-xs">
      <div className="font-bold text-sm">Performance Stats</div>
      
      <div>
        <div>FPS: {stats.fps} (min: {stats.minFps}, max: {stats.maxFps})</div>
        <div className={cn(
          "text-xs",
          stats.fps >= 55 ? "text-green-400" : 
          stats.fps >= 30 ? "text-yellow-400" : "text-red-400"
        )}>
          {stats.fps >= 55 ? "Excellent" : 
           stats.fps >= 30 ? "Good" : "Poor"}
        </div>
      </div>
      
      {stats.memory && (
        <div>
          <div>Memory: {stats.memory.used}MB / {stats.memory.total}MB</div>
          <div className="text-xs text-gray-400">
            Limit: {stats.memory.limit}MB
          </div>
        </div>
      )}
      
      {stats.performance?.length > 0 && (
        <div>
          <div className="font-semibold">Timings:</div>
          {stats.performance.slice(0, 3).map((stat: any) => (
            <div key={stat.name} className="text-xs">
              {stat.name}: {stat.avg.toFixed(2)}ms
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-400 pt-1 border-t border-gray-600">
        Press Ctrl+` to toggle
      </div>
    </div>
  );
};

export default App;

# Canvas Performance Integration Guide

This guide shows you how to integrate the new performance utilities into your existing canvas system.

## Quick Start

### 1. Replace Your Current Canvas Events Hook

Instead of using the original `useCanvasEvents`, use the enhanced version:

```typescript
// In your Canvas.tsx component
import { useEnhancedCanvasEvents } from '@/hooks/canvas/useEnhancedCanvasEvents';
import { PerformanceStats } from '@/components/canvas/PerformanceStats';

const Canvas = () => {
  const {
    handleElementMouseDown,
    handleCanvasMouseDown,
    handleDeleteButtonClick,
    renderMarquee,
    performanceStats
  } = useEnhancedCanvasEvents({
    canvasContainerRef,
    textAreaRef,
    generateId
  });

  return (
    <div ref={canvasContainerRef} className="canvas-container">
      {/* Your existing canvas content */}
      
      {/* Add marquee selection overlay */}
      {renderMarquee()}
      
      {/* Add performance monitoring (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <PerformanceStats show={true} position="top-right" />
      )}
    </div>
  );
};
```

### 2. Migrate to Enhanced Store (Optional)

For maximum performance benefits, consider migrating to the enhanced store:

```typescript
// Replace useCanvasStore with useEnhancedCanvasStore
import { useEnhancedCanvasStore } from '@/stores/enhancedCanvasStore';

const MyComponent = () => {
  // All existing selectors work the same
  const elements = useEnhancedCanvasStore(state => state.elements);
  const selectedIds = useEnhancedCanvasStore(state => state.selectedElementIds);
  
  // New performance features
  const layers = useEnhancedCanvasStore(state => state.layers);
  const performanceMode = useEnhancedCanvasStore(state => state.performanceMode);
  
  // Enhanced batch operations
  const updateMultiple = useEnhancedCanvasStore(state => state.updateMultipleElements);
  const deleteMultiple = useEnhancedCanvasStore(state => state.deleteMultipleElements);
};
```

## Feature-by-Feature Integration

### Marquee Selection

Add drag-to-select functionality:

```typescript
import { useMarqueeSelection } from '@/lib/canvas-selection';

const MyCanvas = () => {
  const elements = useCanvasStore(state => state.elements);
  const selectMultiple = useCanvasStore(state => state.selectMultipleElements);
  
  const { renderMarquee, startMarqueeSelection, updateMarqueeSelection, endMarqueeSelection } = 
    useMarqueeSelection(elements, selectMultiple);

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (e.shiftKey && activeTool === 'select') {
      const worldPos = getCanvasCoordinates(e.clientX, e.clientY);
      startMarqueeSelection(worldPos);
    }
  };

  return (
    <div onMouseDown={handleCanvasMouseDown}>
      {/* Canvas content */}
      {renderMarquee()}
    </div>
  );
};
```

### Object Pooling for Graphics

Optimize graphics object creation:

```typescript
import { graphicsPool } from '@/lib/canvas-performance';

const SelectionRect = ({ bounds }: { bounds: Bounds }) => {
  const graphics = useRef<Graphics | null>(null);

  useEffect(() => {
    // Get from pool instead of creating new
    graphics.current = graphicsPool.get();
    
    return () => {
      // Return to pool instead of destroying
      if (graphics.current) {
        graphicsPool.release(graphics.current);
      }
    };
  }, []);

  // Use the pooled graphics object...
};
```

### Coordinate System Utilities

Replace manual coordinate calculations:

```typescript
import { useCoordinateSystem } from '@/lib/canvas-coordinates';

const MyComponent = () => {
  const zoom = useCanvasStore(state => state.zoom);
  const pan = useCanvasStore(state => state.pan);
  
  const { getCoordinateSystem } = useCoordinateSystem(zoom, pan, containerRef);

  const handleMouseEvent = (e: MouseEvent) => {
    const coords = getCoordinateSystem();
    if (coords) {
      const worldPos = coords.screenToWorld({ x: e.clientX, y: e.clientY });
      const isVisible = coords.isVisible(elementBounds);
      // Use worldPos...
    }
  };
};
```

### Batch Updates for Performance

Optimize multiple element updates:

```typescript
import { BatchManager } from '@/lib/canvas-performance';

const MyComponent = () => {
  const batchManager = useMemo(() => new BatchManager(
    (updates) => updateMultipleElements(updates),
    (deletes) => deleteMultipleElements(deletes)
  ), [updateMultipleElements, deleteMultipleElements]);

  const handleDragMove = (elements: CanvasElement[], dx: number, dy: number) => {
    // Instead of updating each element individually
    elements.forEach(element => {
      batchManager.scheduleUpdate(element.id, {
        x: element.x + dx,
        y: element.y + dy
      });
    });
    // Updates will be batched and applied in next frame
  };
};
```

### Layer Management

Add layer support to your canvas:

```typescript
import { createLayerManager } from '@/lib/canvas-layers';

const CanvasWithLayers = () => {
  const [layers, setLayers] = useState<Layer[]>([]);
  
  const layerManager = useMemo(() => 
    createLayerManager([], setLayers), []
  );

  const handleCreateLayer = () => {
    layerManager.createLayer('New Layer');
  };

  const handleMoveToLayer = (elementId: string, layerId: string) => {
    layerManager.moveElementToLayer(elementId, layerId);
  };

  return (
    <div className="canvas-with-layers">
      <LayerPanel 
        layers={layers}
        onCreateLayer={handleCreateLayer}
        onMoveElement={handleMoveToLayer}
        // ... other props
      />
      <div className="canvas-area">
        {/* Canvas content */}
      </div>
    </div>
  );
};
```

## Performance Optimization Recommendations

### 1. Enable Performance Mode for Large Canvases

```typescript
const Canvas = () => {
  const elementCount = Object.keys(elements).length;
  const setPerformanceMode = useEnhancedCanvasStore(state => state.setPerformanceMode);

  useEffect(() => {
    if (elementCount > 1000) {
      setPerformanceMode('performance');
    } else if (elementCount > 100) {
      setPerformanceMode('normal');
    } else {
      setPerformanceMode('quality');
    }
  }, [elementCount, setPerformanceMode]);
};
```

### 2. Implement Viewport Culling

```typescript
const Canvas = () => {
  const setViewportBounds = useEnhancedCanvasStore(state => state.setViewportBounds);
  const updateCulledElements = useEnhancedCanvasStore(state => state.updateCulledElements);

  useEffect(() => {
    const updateViewport = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setViewportBounds({
          x: -pan.x / zoom,
          y: -pan.y / zoom,
          width: rect.width / zoom,
          height: rect.height / zoom
        });

        // Cull elements outside viewport
        const culled = Object.keys(elements).filter(id => {
          const element = elements[id];
          return !isElementInViewport(element, viewportBounds);
        });
        updateCulledElements(culled);
      }
    };

    updateViewport();
  }, [zoom, pan, elements]);
};
```

### 3. Optimize Element Rendering

```typescript
import { optimizeDisplayObject } from '@/lib/canvas-performance';

const CanvasElement = ({ element, isInteractive }: { element: CanvasElement, isInteractive: boolean }) => {
  const elementRef = useRef<DisplayObject>(null);

  useEffect(() => {
    if (elementRef.current) {
      optimizeDisplayObject(elementRef.current, isInteractive);
    }
  }, [isInteractive]);

  // Render element...
};
```

## Migration Path

### Phase 1: Add Performance Monitoring
1. Add `<PerformanceStats />` to your canvas
2. Monitor current performance baseline
3. Identify bottlenecks

### Phase 2: Implement Coordinate System
1. Replace manual coordinate calculations with `useCoordinateSystem`
2. Standardize all coordinate transformations
3. Test with different zoom/pan levels

### Phase 3: Add Marquee Selection
1. Integrate `useMarqueeSelection` hook
2. Update selection UI to show marquee
3. Test multi-element selection workflows

### Phase 4: Optimize Batch Operations
1. Replace individual updates with batch operations
2. Enable batching in store settings
3. Monitor performance improvements

### Phase 5: Add Layer Management (Optional)
1. Integrate layer system for complex canvases
2. Update UI to show layer controls
3. Migrate existing elements to default layer

## Best Practices

### 1. Use Performance Mode Appropriately
- **Quality**: < 100 elements, prioritize visual quality
- **Normal**: 100-1000 elements, balanced performance
- **Performance**: > 1000 elements, prioritize speed

### 2. Batch Updates During Interactions
```typescript
// Good: Batch updates during drag
const handleDrag = (elements: CanvasElement[], delta: Point) => {
  const updates = elements.reduce((acc, element) => {
    acc[element.id] = { x: element.x + delta.x, y: element.y + delta.y };
    return acc;
  }, {} as Record<string, Partial<CanvasElement>>);
  
  updateMultipleElements(updates);
};

// Avoid: Individual updates
elements.forEach(element => {
  updateElement(element.id, { x: element.x + delta.x, y: element.y + delta.y });
});
```

### 3. Implement Proper Cleanup
```typescript
useEffect(() => {
  const batchManager = new BatchManager(/* ... */);
  const memoryManager = new MemoryManager();
  
  return () => {
    batchManager.flush();
    memoryManager.destroy();
  };
}, []);
```

### 4. Monitor Performance in Development
```typescript
const Canvas = () => {
  const isDev = process.env.NODE_ENV === 'development';
  
  return (
    <div>
      {/* Canvas content */}
      {isDev && <PerformanceStats show={true} />}
    </div>
  );
};
```

This integration approach allows you to adopt the performance improvements incrementally while maintaining compatibility with your existing code.

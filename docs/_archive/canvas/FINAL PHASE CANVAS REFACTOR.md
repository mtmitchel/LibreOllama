# Complete Canvas Implementation Guide for AI Coding Agent

This comprehensive guide provides detailed instructions to finalize the React Konva canvas feature implementation, enabling sections, tables, connectors, image uploads, pen tools, and all other drawing elements.

## Current Architecture Assessment

The codebase demonstrates a sophisticated canvas architecture built around React Konva with centralized event handling through `CanvasEventHandler`. The implementation follows a unified store pattern using Zustand and includes comprehensive tool-specific handlers for all major canvas operations. However, several critical dependencies and utility functions require completion to achieve full functionality.

## Phase 1: Complete Missing Utility Functions

### Task 1.1: Implement findNearestSnapPoint Function

**Location**: `src/features/canvas/utils/connectorUtils.ts`

```typescript
export function findNearestSnapPoint(
  pointer: { x: number; y: number },
  elements: Map,
  snapRadius: number = 20
): {
  x: number;
  y: number;
  elementId: ElementId | SectionId;
  attachmentPoint: 'top' | 'bottom' | 'left' | 'right' | 'center';
} | null {
  let nearestPoint: any = null;
  let minDistance = snapRadius;

  for (const [elementId, element] of elements) {
    if (element.type === 'connector') continue; // Skip connectors

    const snapPoints = getElementSnapPoints(element);
    
    for (const snapPoint of snapPoints) {
      const distance = Math.sqrt(
        Math.pow(pointer.x - snapPoint.x, 2) + 
        Math.pow(pointer.y - snapPoint.y, 2)
      );

      if (distance  {
  const points = [];
  
  switch (element.type) {
    case 'rectangle':
    case 'image':
    case 'text':
    case 'sticky-note':
    case 'table':
      const width = element.width || 100;
      const height = element.height || 100;
      points.push(
        { x: element.x + width / 2, y: element.y, attachmentPoint: 'top' as const },
        { x: element.x + width / 2, y: element.y + height, attachmentPoint: 'bottom' as const },
        { x: element.x, y: element.y + height / 2, attachmentPoint: 'left' as const },
        { x: element.x + width, y: element.y + height / 2, attachmentPoint: 'right' as const },
        { x: element.x + width / 2, y: element.y + height / 2, attachmentPoint: 'center' as const }
      );
      break;
    
    case 'circle':
      const radius = element.radius || 50;
      points.push(
        { x: element.x, y: element.y - radius, attachmentPoint: 'top' as const },
        { x: element.x, y: element.y + radius, attachmentPoint: 'bottom' as const },
        { x: element.x - radius, y: element.y, attachmentPoint: 'left' as const },
        { x: element.x + radius, y: element.y, attachmentPoint: 'right' as const },
        { x: element.x, y: element.y, attachmentPoint: 'center' as const }
      );
      break;
  }

  return points;
}
```

### Task 1.2: Implement captureElementsAfterSectionCreation Function

**Location**: `src/stores/unifiedCanvasStore.ts` (add to store actions)

```typescript
captureElementsAfterSectionCreation: (sectionId: SectionId) => {
  const state = get();
  const section = state.sections.get(sectionId);
  if (!section) return;

  const elementsToCapture: ElementId[] = [];

  // Find elements whose center points are within the section bounds
  for (const [elementId, element] of state.elements) {
    if (element.sectionId) continue; // Skip already grouped elements

    const elementCenter = getElementCenter(element);
    
    if (
      elementCenter.x >= section.x &&
      elementCenter.x = section.y &&
      elementCenter.y  {
    const element = state.elements.get(elementId);
    if (element) {
      // Convert to section-relative coordinates
      const relativeX = element.x - section.x;
      const relativeY = element.y - section.y;
      
      set(state => ({
        elements: new Map(state.elements.set(elementId, {
          ...element,
          x: relativeX,
          y: relativeY,
          sectionId: sectionId,
          updatedAt: Date.now()
        }))
      }));
    }
  });

  console.log(`Captured ${elementsToCapture.length} elements in section ${sectionId}`);
}

function getElementCenter(element: CanvasElement): { x: number; y: number } {
  switch (element.type) {
    case 'circle':
      return { x: element.x, y: element.y };
    case 'rectangle':
    case 'image':
    case 'text':
    case 'sticky-note':
    case 'table':
      const width = element.width || 100;
      const height = element.height || 100;
      return { x: element.x + width / 2, y: element.y + height / 2 };
    default:
      return { x: element.x, y: element.y };
  }
}
```

### Task 1.3: Implement deleteSelectedElements Function

**Location**: `src/stores/unifiedCanvasStore.ts` (add to store actions)

```typescript
deleteSelectedElements: () => {
  const state = get();
  const elementsToDelete = Array.from(state.selectedElementIds);
  
  if (elementsToDelete.length === 0) return;

  // Remove elements from the map
  elementsToDelete.forEach(elementId => {
    state.elements.delete(elementId);
  });

  // Clear selection
  set(state => ({
    elements: new Map(state.elements),
    selectedElementIds: new Set(),
    lastSelectedElementId: null
  }));

  // Add to history
  state.addToHistory(`Delete ${elementsToDelete.length} element(s)`);
  
  console.log(`Deleted ${elementsToDelete.length} elements`);
}
```

## Phase 2: Complete Store Integration

### Task 2.1: Enhance Drawing State Management

**Location**: `src/stores/unifiedCanvasStore.ts`

```typescript
// Add to the store state interface
interface DrawingState {
  isDrawing: boolean;
  currentTool: string;
  currentPath: number[];
  previewElement: any | null;
}

// Add drawing state to store
drawingState: {
  isDrawing: false,
  currentTool: 'select',
  currentPath: [],
  previewElement: null
} as DrawingState,

// Enhanced drawing methods
startDrawing: (tool: string, startPoint: [number, number]) => {
  set(state => ({
    drawingState: {
      ...state.drawingState,
      isDrawing: true,
      currentTool: tool,
      currentPath: startPoint,
      previewElement: null
    }
  }));
},

updateDrawing: (point: [number, number]) => {
  set(state => ({
    drawingState: {
      ...state.drawingState,
      currentPath: [...state.drawingState.currentPath, ...point]
    }
  }));
},

finishDrawing: () => {
  const state = get();
  const { drawingState } = state;
  
  if (!drawingState.isDrawing || drawingState.currentPath.length  i % 2 === 0)),
        y: Math.min(...drawingState.currentPath.filter((_, i) => i % 2 === 1)),
        points: drawingState.currentPath,
        stroke: '#000000',
        strokeWidth: 2,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      state.addElement(penElement);
      break;

    case 'section':
      // Create section from path bounds
      const pathX = drawingState.currentPath.filter((_, i) => i % 2 === 0);
      const pathY = drawingState.currentPath.filter((_, i) => i % 2 === 1);
      const minX = Math.min(...pathX);
      const maxX = Math.max(...pathX);
      const minY = Math.min(...pathY);
      const maxY = Math.max(...pathY);
      
      if (maxX - minX > 10 && maxY - minY > 10) {
        const sectionId = state.createSection(minX, minY, maxX - minX, maxY - minY);
        state.captureElementsAfterSectionCreation(sectionId);
      }
      break;
  }

  // Reset drawing state
  set(state => ({
    drawingState: {
      isDrawing: false,
      currentTool: 'select',
      currentPath: [],
      previewElement: null
    },
    selectedTool: 'select'
  }));
},

cancelDrawing: () => {
  set(state => ({
    drawingState: {
      isDrawing: false,
      currentTool: 'select',
      currentPath: [],
      previewElement: null
    }
  }));
}
```

### Task 2.2: Complete Element Management Methods

**Location**: `src/stores/unifiedCanvasStore.ts`

```typescript
// Enhanced element management
updateElement: (elementId: ElementId, updates: Partial) => {
  set(state => {
    const element = state.elements.get(elementId);
    if (!element) return state;

    const updatedElement = { ...element, ...updates, updatedAt: Date.now() };
    return {
      elements: new Map(state.elements.set(elementId, updatedElement))
    };
  });
},

duplicateElements: (elementIds: ElementId[]) => {
  const state = get();
  const newElements: CanvasElement[] = [];
  
  elementIds.forEach(elementId => {
    const element = state.elements.get(elementId);
    if (element) {
      const duplicatedElement = {
        ...element,
        id: generateElementId(),
        x: element.x + 20, // Offset duplicates
        y: element.y + 20,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      newElements.push(duplicatedElement);
    }
  });

  // Add all duplicated elements
  newElements.forEach(element => state.addElement(element));
  
  // Select the new elements
  state.clearSelection();
  newElements.forEach(element => state.selectElement(element.id));
},

groupElements: (elementIds: ElementId[], groupName?: string) => {
  // Implementation for grouping elements
  const groupId = generateElementId();
  const groupElement: GroupElement = {
    id: groupId,
    type: 'group',
    x: 0, // Will be calculated
    y: 0,
    width: 0,
    height: 0,
    elementIds: elementIds,
    name: groupName || 'Group',
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  // Calculate group bounds
  const bounds = calculateGroupBounds(elementIds, get().elements);
  groupElement.x = bounds.x;
  groupElement.y = bounds.y;
  groupElement.width = bounds.width;
  groupElement.height = bounds.height;

  get().addElement(groupElement);
  return groupId;
}
```

## Phase 3: Component Integration and Event Handler Fixes

### Task 3.1: Update CanvasEventHandler Integration

**Location**: `src/features/canvas/components/CanvasEventHandler.tsx`

Update the stubbed functions to use the completed store methods:

```typescript
// Replace stubbed functions with actual implementations
const captureElementsAfterSectionCreation = useUnifiedCanvasStore(
  (state) => state.captureElementsAfterSectionCreation
);

const deleteSelectedElements = useUnifiedCanvasStore(
  (state) => state.deleteSelectedElements
);

// Add drawing state selectors
const isDrawingSection = useUnifiedCanvasStore(
  (state) => state.drawingState.isDrawing && state.drawingState.currentTool === 'section'
);

const currentPath = useUnifiedCanvasStore(
  (state) => state.drawingState.currentPath
);

// Calculate preview section from current path
const previewSection = React.useMemo(() => {
  if (!isDrawingSection || currentPath.length  i % 2 === 0);
  const pathY = currentPath.filter((_, i) => i % 2 === 1);
  const minX = Math.min(...pathX);
  const maxX = Math.max(...pathX);
  const minY = Math.min(...pathY);
  const maxY = Math.max(...pathY);
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  };
}, [isDrawingSection, currentPath]);
```

### Task 3.2: Complete Layer Rendering Integration

**Location**: `src/features/canvas/layers/UILayer.tsx`

```typescript
import React from 'react';
import { Layer, Rect, Line } from 'react-konva';
import { useUnifiedCanvasStore } from '../../../stores';

export const UILayer: React.FC = () => {
  const drawingState = useUnifiedCanvasStore(state => state.drawingState);
  const zoom = useUnifiedCanvasStore(state => state.viewport.scale);

  return (
    
      {/* Render section preview */}
      {drawingState.isDrawing && drawingState.currentTool === 'section' && drawingState.currentPath.length >= 4 && (
         i % 2 === 0))}
          y={Math.min(...drawingState.currentPath.filter((_, i) => i % 2 === 1))}
          width={Math.max(...drawingState.currentPath.filter((_, i) => i % 2 === 0)) - Math.min(...drawingState.currentPath.filter((_, i) => i % 2 === 0))}
          height={Math.max(...drawingState.currentPath.filter((_, i) => i % 2 === 1)) - Math.min(...drawingState.currentPath.filter((_, i) => i % 2 === 1))}
          stroke="#6366F1"
          strokeWidth={2 / zoom}
          fill="rgba(99, 102, 241, 0.1)"
          dash={[5 / zoom, 5 / zoom]}
        />
      )}

      {/* Render pen preview */}
      {drawingState.isDrawing && (drawingState.currentTool === 'pen' || drawingState.currentTool === 'pencil') && drawingState.currentPath.length >= 4 && (
        
      )}
    
  );
};
```

## Phase 4: Toolbar Integration

### Task 4.1: Create Toolbar Component

**Location**: `src/features/canvas/components/CanvasToolbar.tsx`

```typescript
import React from 'react';
import { useUnifiedCanvasStore } from '../../../stores';
import { 
  MousePointer, 
  Type, 
  Square, 
  Circle, 
  Triangle, 
  Star,
  Pen,
  ArrowRight,
  Image,
  Table,
  StickyNote,
  Move,
  Box
} from 'lucide-react';

interface ToolButtonProps {
  tool: string;
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const ToolButton: React.FC = ({ tool, icon, label, isActive, onClick }) => (
  
    {icon}
  
);

export const CanvasToolbar: React.FC = () => {
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const setSelectedTool = useUnifiedCanvasStore(state => state.setSelectedTool);

  const tools = [
    { id: 'select', icon: , label: 'Select' },
    { id: 'pan', icon: , label: 'Pan' },
    { id: 'text', icon: , label: 'Text' },
    { id: 'rectangle', icon: , label: 'Rectangle' },
    { id: 'circle', icon: , label: 'Circle' },
    { id: 'triangle', icon: , label: 'Triangle' },
    { id: 'star', icon: , label: 'Star' },
    { id: 'pen', icon: , label: 'Pen' },
    { id: 'connector-arrow', icon: , label: 'Arrow Connector' },
    { id: 'image', icon: , label: 'Image' },
    { id: 'table', icon: , label: 'Table' },
    { id: 'sticky-note', icon: , label: 'Sticky Note' },
    { id: 'section', icon: , label: 'Section' },
  ];

  return (
    
      {tools.map(tool => (
         setSelectedTool(tool.id)}
        />
      ))}
    
  );
};
```

### Task 4.2: Integrate Toolbar with Main Canvas

**Location**: `src/features/canvas/components/KonvaApp.tsx`

```typescript
import React from 'react';
import { CanvasToolbar } from './CanvasToolbar';
import { CanvasContainer } from './CanvasContainer';

export const KonvaApp: React.FC = () => {
  return (
    
      
      
        
      
    
  );
};
```

## Phase 5: Performance Optimizations

### Task 5.1: Implement Performance Utilities

**Location**: `src/features/canvas/utils/performance/`

Create the referenced performance monitoring utilities:

```typescript
// CanvasPerformanceProfiler.ts
export class CanvasPerformanceProfiler {
  static profileSync(
    operationName: string,
    operation: () => T,
    metadata?: Record
  ): T {
    const startTime = performance.now();
    const result = operation();
    const endTime = performance.now();
    
    console.log(`Performance [${operationName}]:`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      metadata
    });
    
    return result;
  }

  static async profileAsync(
    operationName: string,
    operation: () => Promise,
    metadata?: Record
  ): Promise {
    const startTime = performance.now();
    const result = await operation();
    const endTime = performance.now();
    
    console.log(`Performance [${operationName}]:`, {
      duration: `${(endTime - startTime).toFixed(2)}ms`,
      metadata
    });
    
    return result;
  }
}

// MemoryLeakDetector.ts
export class MemoryLeakDetector {
  private static trackedResources: Map = new Map();

  static trackEventListener(element: string, eventType: string, handler: string): string {
    const id = `${element}_${eventType}_${Date.now()}`;
    this.trackedResources.set(id, { element, eventType, handler, type: 'eventListener' });
    return id;
  }

  static untrackResource(id: string): void {
    this.trackedResources.delete(id);
  }

  static getTrackedResourceCount(): number {
    return this.trackedResources.size;
  }

  static logMemoryStatus(): void {
    console.log('Memory Status:', {
      trackedResources: this.trackedResources.size,
      resources: Array.from(this.trackedResources.entries())
    });
  }
}

export const useMemoryLeakDetector = (componentName: string) => {
  return {
    trackMount: () => console.log(`${componentName} mounted`),
    trackUnmount: () => console.log(`${componentName} unmounted`)
  };
};
```

## Phase 6: Testing and Validation

### Task 6.1: Create Integration Tests

**Location**: `src/features/canvas/__tests__/integration.test.tsx`

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { KonvaApp } from '../components/KonvaApp';

describe('Canvas Integration Tests', () => {
  test('should create section when section tool is selected and user draws', async () => {
    render();
    
    // Select section tool
    const sectionTool = screen.getByTitle('Section');
    fireEvent.click(sectionTool);
    
    // Simulate drawing on canvas
    const canvas = screen.getByRole('application'); // Konva Stage
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 200, clientY: 200 });
    fireEvent.mouseUp(canvas, { clientX: 200, clientY: 200 });
    
    // Verify section was created
    // Add appropriate assertions based on your store state
  });

  test('should create table when table tool is selected and user draws', async () => {
    render();
    
    const tableTool = screen.getByTitle('Table');
    fireEvent.click(tableTool);
    
    const canvas = screen.getByRole('application');
    fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
    fireEvent.mouseMove(canvas, { clientX: 300, clientY: 200 });
    fireEvent.mouseUp(canvas, { clientX: 300, clientY: 200 });
    
    // Verify table was created
  });

  test('should upload and create image when image tool is selected', async () => {
    render();
    
    const imageTool = screen.getByTitle('Image');
    fireEvent.click(imageTool);
    
    const canvas = screen.getByRole('application');
    fireEvent.click(canvas, { clientX: 150, clientY: 150 });
    
    // Verify file input was created and triggered
  });
});
```

## Phase 7: Final Integration Steps

### Task 7.1: Update Main Canvas Container

Ensure `CanvasContainer` properly integrates all the completed functionality:

```typescript
// Update CanvasContainer.tsx to remove local state and use store completely
const CanvasContainer: React.FC = ({
  width,
  height,
  onElementSelect,
  onStartTextEdit,
  className = ''
}) => {
  const stageRef = useRef(null);
  
  // Use store state instead of local state
  const selectedTool = useUnifiedCanvasStore(state => state.selectedTool);
  const drawingState = useUnifiedCanvasStore(state => state.drawingState);
  
  // Remove all local useState calls - use store instead
  
  return (
    
      
        
          
        
      
    
  );
};
```

### Task 7.2: Verify All Features Work

After implementing all the above tasks, verify that:

1. **Section Tool**: Draws sections that capture existing elements
2. **Table Tool**: Creates tables with proper row/column structure
3. **Connector Tool**: Creates connectors that snap to elements
4. **Image Tool**: Opens file dialog and creates image elements
5. **Pen Tool**: Creates smooth drawing paths
6. **All Shape Tools**: Create shapes with proper styling
7. **Selection**: Works correctly with all element types
8. **Keyboard Shortcuts**: Delete, Escape work as expected

## Phase 8: Error Handling and Fallbacks

### Task 8.1: Implement Comprehensive Error Boundaries

Ensure all components have proper error handling and fallback mechanisms as shown in the existing `CanvasEventHandler` error handling patterns.

## Success Criteria

Upon completion of all tasks:

- All toolbar tools function correctly
- Drawing tools create appropriate elements
- Elements can be selected, moved, and deleted
- Connectors snap to elements properly
- Sections automatically capture contained elements
- Images can be uploaded and displayed
- Performance monitoring works in development
- No console errors during normal operation
- Memory leaks are properly tracked and prevented

This guide provides the complete roadmap to finalize the canvas implementation. Execute each phase sequentially, testing thoroughly at each step to ensure stability and functionality.

[1] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/attachments/21494092/e3dbe3be-2012-430c-93ca-53247744a067/paste.txt
[2] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_a74a9d3b-c4b3-4d67-aafb-5cfca9b3abdf/17121f3a-d28c-4087-8b04-7d33bc2924b2/The-Ultimate-Guide-to-Creating-a-FigJam-Style-Canvas-Using-Konva-React-for-Tauri-Applications.txt
[3] https://ppl-ai-file-upload.s3.amazonaws.com/web/direct-files/collection_a74a9d3b-c4b3-4d67-aafb-5cfca9b3abdf/2d2627f3-ad48-4059-81a4-a6c57d2cdb51/Creating-a-FigJam-Style-Canvas-Using-Konva-React-for-Tauri-Applications-Checklist-for-Developers.txt
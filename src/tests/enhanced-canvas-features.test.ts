/**
 * Enhanced Canvas Feature Tests
 * Building on successful integration tests to expand coverage
 */

import { vi } from 'vitest';

describe('Enhanced Canvas Feature Tests', () => {
  describe('🎨 Advanced Drawing Features', () => {
    test('Multi-tool drawing workflow', () => {
      const drawingState = {
        currentTool: 'select',
        tools: ['select', 'rectangle', 'circle', 'line', 'text', 'pen'],
        toolSettings: {
          stroke: '#000000',
          fill: '#ffffff',
          strokeWidth: 2,
          fontSize: 16,
        },
      };

      const elementsStore = {
        elements: new Map(),
        addElement: vi.fn(),
      };

      // Test each drawing tool
      drawingState.tools.forEach(tool => {
        drawingState.currentTool = tool;
        
        let mockElement;
        switch (tool) {
          case 'rectangle':
            mockElement = {
              id: `${tool}-${Date.now()}`,
              type: 'rectangle',
              x: 100, y: 100, width: 150, height: 100,
              stroke: drawingState.toolSettings.stroke,
              fill: drawingState.toolSettings.fill,
              strokeWidth: drawingState.toolSettings.strokeWidth,
            };
            break;
          case 'circle':
            mockElement = {
              id: `${tool}-${Date.now()}`,
              type: 'circle',
              x: 200, y: 200, radius: 75,
              stroke: drawingState.toolSettings.stroke,
              fill: drawingState.toolSettings.fill,
              strokeWidth: drawingState.toolSettings.strokeWidth,
            };
            break;
          case 'line':
            mockElement = {
              id: `${tool}-${Date.now()}`,
              type: 'line',
              points: [0, 0, 100, 100],
              stroke: drawingState.toolSettings.stroke,
              strokeWidth: drawingState.toolSettings.strokeWidth,
            };
            break;
          case 'text':
            mockElement = {
              id: `${tool}-${Date.now()}`,
              type: 'text',
              x: 300, y: 300,
              content: 'Sample Text',
              fontSize: drawingState.toolSettings.fontSize,
              fill: drawingState.toolSettings.stroke,
            };
            break;
        }

        if (mockElement) {
          elementsStore.elements.set(mockElement.id, mockElement);
        }
      });

      // Verify elements were created with correct tool settings
      const rectangleElement = Array.from(elementsStore.elements.values())
        .find((el: any) => el.type === 'rectangle');
      expect(rectangleElement?.strokeWidth).toBe(2);
      expect(rectangleElement?.stroke).toBe('#000000');

      const textElement = Array.from(elementsStore.elements.values())
        .find((el: any) => el.type === 'text');
      expect(textElement?.fontSize).toBe(16);
      expect(textElement?.content).toBe('Sample Text');
    });

    test('Path drawing and optimization', () => {
      const pathDrawingState = {
        isDrawing: false,
        currentPath: [] as { x: number, y: number }[],
        paths: [] as any[],
      };

      // Simulate drawing a path
      pathDrawingState.isDrawing = true;
      
      // Add points to path (simulating mouse movement)
      const pathPoints = [
        { x: 100, y: 100 },
        { x: 105, y: 102 },
        { x: 110, y: 105 },
        { x: 115, y: 108 },
        { x: 125, y: 115 },
        { x: 140, y: 125 },
        { x: 160, y: 140 },
        { x: 180, y: 155 },
        { x: 200, y: 170 },
      ];

      pathPoints.forEach(point => {
        pathDrawingState.currentPath.push(point);
      });

      // Finish drawing
      pathDrawingState.isDrawing = false;
      
      // Optimize path (remove redundant points)
      const optimizePath = (points: { x: number, y: number }[]) => {
        if (points.length <= 2) return points;
        
        const optimized = [points[0]]; // Always keep first point
        
        for (let i = 1; i < points.length - 1; i++) {
          const prev = points[i - 1];
          const curr = points[i];
          const next = points[i + 1];
          
          // Simple optimization: skip points that are too close
          const distance = Math.sqrt(
            Math.pow(curr.x - prev.x, 2) + Math.pow(curr.y - prev.y, 2)
          );
          
          if (distance > 5) { // Keep points that are at least 5 pixels apart
            optimized.push(curr);
          }
        }
        
        optimized.push(points[points.length - 1]); // Always keep last point
        return optimized;
      };

      const optimizedPath = optimizePath(pathDrawingState.currentPath);
      
      // Create path element
      const pathElement = {
        id: `path-${Date.now()}`,
        type: 'path',
        points: optimizedPath,
        stroke: '#000000',
        strokeWidth: 3,
        fill: 'none',
      };

      pathDrawingState.paths.push(pathElement);      // Verify path optimization
      expect(pathDrawingState.currentPath.length).toBe(9);
      expect(optimizedPath.length).toBeLessThanOrEqual(9); // Should be optimized or same
      expect(optimizedPath.length).toBeGreaterThan(2); // But not too aggressive
      expect(pathElement.points).toEqual(optimizedPath);
    });
  });

  describe('🔧 Advanced Transformation Features', () => {
    test('Group operations workflow', () => {
      const elementsStore = {
        elements: new Map(),
        groups: new Map(),
        addElement: vi.fn(),
        createGroup: vi.fn(),
        updateGroup: vi.fn(),
      };

      const selectionStore = {
        selectedElementIds: new Set(),
        selectedGroupIds: new Set(),
        selectMultiple: vi.fn(),
      };

      // Create elements for grouping
      const elements = [
        { id: 'rect-1', type: 'rectangle', x: 100, y: 100, width: 50, height: 50 },
        { id: 'rect-2', type: 'rectangle', x: 160, y: 100, width: 50, height: 50 },
        { id: 'circle-1', type: 'circle', x: 130, y: 160, radius: 25 },
      ];

      elements.forEach(el => {
        elementsStore.elements.set(el.id, el);
        selectionStore.selectedElementIds.add(el.id);
      });

      // Create group from selected elements
      const groupId = 'group-1';
      const group = {
        id: groupId,
        type: 'group',
        elementIds: Array.from(selectionStore.selectedElementIds),
        x: 100, // Group bounds
        y: 100,
        width: 110,
        height: 85,
        rotation: 0,
      };

      elementsStore.groups.set(groupId, group);

      // Transform group (move)
      const transformedGroup = {
        ...group,
        x: 200,
        y: 150,
      };

      elementsStore.groups.set(groupId, transformedGroup);

      // Transform group (scale)
      const scaledGroup = {
        ...transformedGroup,
        width: transformedGroup.width * 1.5,
        height: transformedGroup.height * 1.5,
      };

      elementsStore.groups.set(groupId, scaledGroup);

      // Verify group operations
      expect(elementsStore.groups.has(groupId)).toBe(true);
      expect(group.elementIds.length).toBe(3);
      expect(scaledGroup.width).toBe(165); // 110 * 1.5
      expect(scaledGroup.height).toBe(127.5); // 85 * 1.5
      expect(scaledGroup.x).toBe(200);
      expect(scaledGroup.y).toBe(150);
    });

    test('Multi-element alignment operations', () => {
      const elementsStore = {
        elements: new Map(),
        updateElement: vi.fn(),
      };

      // Create elements at different positions
      const elements = [
        { id: 'rect-1', type: 'rectangle', x: 100, y: 120, width: 50, height: 30 },
        { id: 'rect-2', type: 'rectangle', x: 200, y: 80, width: 60, height: 40 },
        { id: 'rect-3', type: 'rectangle', x: 150, y: 160, width: 40, height: 35 },
      ];

      elements.forEach(el => {
        elementsStore.elements.set(el.id, el);
      });

      // Alignment operations
      const alignmentOps = {
        alignLeft: (elements: any[]) => {
          const leftmostX = Math.min(...elements.map(el => el.x));
          return elements.map(el => ({ ...el, x: leftmostX }));
        },
        alignTop: (elements: any[]) => {
          const topmostY = Math.min(...elements.map(el => el.y));
          return elements.map(el => ({ ...el, y: topmostY }));
        },
        alignCenter: (elements: any[]) => {
          const bounds = {
            left: Math.min(...elements.map(el => el.x)),
            right: Math.max(...elements.map(el => el.x + el.width)),
            top: Math.min(...elements.map(el => el.y)),
            bottom: Math.max(...elements.map(el => el.y + el.height)),
          };
          const centerX = (bounds.left + bounds.right) / 2;
          return elements.map(el => ({ ...el, x: centerX - el.width / 2 }));
        },
        distributeHorizontally: (elements: any[]) => {
          const sorted = [...elements].sort((a, b) => a.x - b.x);
          const totalWidth = sorted[sorted.length - 1].x + sorted[sorted.length - 1].width - sorted[0].x;
          const spacing = totalWidth / (sorted.length - 1);
          
          return sorted.map((el, i) => ({
            ...el,
            x: sorted[0].x + i * spacing,
          }));
        },
      };

      // Test left alignment
      const leftAligned = alignmentOps.alignLeft(elements);
      expect(leftAligned.every(el => el.x === 100)).toBe(true);

      // Test top alignment
      const topAligned = alignmentOps.alignTop(elements);
      expect(topAligned.every(el => el.y === 80)).toBe(true);

      // Test center alignment
      const centerAligned = alignmentOps.alignCenter(elements);
      const centerX = centerAligned[0].x + centerAligned[0].width / 2;
      expect(centerAligned.every(el => 
        Math.abs((el.x + el.width / 2) - centerX) < 0.01
      )).toBe(true);      // Test horizontal distribution
      const distributed = alignmentOps.distributeHorizontally(elements);
      expect(distributed.length).toBe(3);
      expect(distributed[0].x).toBe(100); // First element unchanged
      expect(distributed[2].x).toBeGreaterThanOrEqual(200); // Last element in correct position
    });
  });

  describe('📱 Responsive and Adaptive Features', () => {
    test('Canvas viewport adaptation', () => {
      const viewportStore = {
        viewportSize: { width: 1920, height: 1080 },
        zoom: 1,
        pan: { x: 0, y: 0 },
        devicePixelRatio: 1,
        setViewportSize: vi.fn(),
        adaptToDevice: vi.fn(),
      };

      const adaptViewport = (newSize: { width: number, height: number }) => {
        const oldSize = viewportStore.viewportSize;
        
        // Maintain center point when resizing
        const centerX = viewportStore.pan.x + oldSize.width / 2;
        const centerY = viewportStore.pan.y + oldSize.height / 2;
        
        // Update viewport
        viewportStore.viewportSize = newSize;
        viewportStore.pan = {
          x: centerX - newSize.width / 2,
          y: centerY - newSize.height / 2,
        };
        
        // Adjust zoom if needed (for mobile)
        if (newSize.width < 768) {
          viewportStore.zoom = Math.min(viewportStore.zoom, 0.8);
        }
      };

      // Test desktop to mobile adaptation
      adaptViewport({ width: 375, height: 667 }); // iPhone size
      
      expect(viewportStore.viewportSize.width).toBe(375);
      expect(viewportStore.zoom).toBe(0.8); // Should be reduced for mobile
      
      // Test back to desktop
      adaptViewport({ width: 1920, height: 1080 });
      
      expect(viewportStore.viewportSize.width).toBe(1920);
      // Zoom should remain at 0.8 (don't auto-increase)
    });

    test('Element scaling for different screen densities', () => {
      const elementsStore = {
        elements: new Map(),
        scalingFactor: 1,
        updateScaling: vi.fn(),
      };

      const scaleForDevice = (devicePixelRatio: number) => {
        elementsStore.scalingFactor = devicePixelRatio;
        
        // Update all elements for new scaling
        for (const [id, element] of elementsStore.elements) {
          const scaledElement = {
            ...element,
            strokeWidth: (element as any).strokeWidth * devicePixelRatio,
            fontSize: (element as any).fontSize ? (element as any).fontSize * devicePixelRatio : undefined,
          };
          elementsStore.elements.set(id, scaledElement);
        }
      };

      // Add test elements
      const elements = [
        { id: 'rect-1', type: 'rectangle', strokeWidth: 2, x: 100, y: 100 },
        { id: 'text-1', type: 'text', fontSize: 16, x: 200, y: 200 },
      ];

      elements.forEach(el => {
        elementsStore.elements.set(el.id, el);
      });

      // Test high-DPI scaling
      scaleForDevice(2); // Retina display
      
      const scaledRect = elementsStore.elements.get('rect-1') as any;
      const scaledText = elementsStore.elements.get('text-1') as any;
      
      expect(scaledRect.strokeWidth).toBe(4); // 2 * 2
      expect(scaledText.fontSize).toBe(32); // 16 * 2
      expect(elementsStore.scalingFactor).toBe(2);
    });
  });

  describe('🔍 Search and Filter Features', () => {
    test('Element search and filtering', () => {
      const elementsStore = {
        elements: new Map(),
        searchResults: new Set(),
        filters: {
          type: null as string | null,
          color: null as string | null,
          size: null as string | null,
        },
      };

      // Add test elements
      const elements = [
        { id: 'rect-1', type: 'rectangle', fill: '#ff0000', width: 100, height: 50, content: 'Red Rectangle' },
        { id: 'rect-2', type: 'rectangle', fill: '#00ff00', width: 200, height: 100, content: 'Green Rectangle' },
        { id: 'circle-1', type: 'circle', fill: '#0000ff', radius: 30, content: 'Blue Circle' },
        { id: 'text-1', type: 'text', fill: '#000000', fontSize: 16, content: 'Sample Text' },
        { id: 'text-2', type: 'text', fill: '#ff0000', fontSize: 24, content: 'Red Text' },
      ];

      elements.forEach(el => {
        elementsStore.elements.set(el.id, el);
      });

      // Search functions
      const searchByText = (query: string) => {
        elementsStore.searchResults.clear();
        for (const [id, element] of elementsStore.elements) {
          if ((element as any).content?.toLowerCase().includes(query.toLowerCase())) {
            elementsStore.searchResults.add(id);
          }
        }
      };

      const filterByType = (type: string) => {
        elementsStore.filters.type = type;
        elementsStore.searchResults.clear();
        for (const [id, element] of elementsStore.elements) {
          if ((element as any).type === type) {
            elementsStore.searchResults.add(id);
          }
        }
      };

      const filterByColor = (color: string) => {
        elementsStore.filters.color = color;
        elementsStore.searchResults.clear();
        for (const [id, element] of elementsStore.elements) {
          if ((element as any).fill === color) {
            elementsStore.searchResults.add(id);
          }
        }
      };

      // Test text search
      searchByText('red');
      expect(elementsStore.searchResults.size).toBe(2); // 'Red Rectangle' and 'Red Text'
      expect(elementsStore.searchResults.has('rect-1')).toBe(true);
      expect(elementsStore.searchResults.has('text-2')).toBe(true);

      // Test type filter
      filterByType('rectangle');
      expect(elementsStore.searchResults.size).toBe(2);
      expect(elementsStore.searchResults.has('rect-1')).toBe(true);
      expect(elementsStore.searchResults.has('rect-2')).toBe(true);

      // Test color filter
      filterByColor('#ff0000');
      expect(elementsStore.searchResults.size).toBe(2); // Red rectangle and red text
      expect(elementsStore.searchResults.has('rect-1')).toBe(true);
      expect(elementsStore.searchResults.has('text-2')).toBe(true);
    });

    test('Advanced filtering with multiple criteria', () => {
      const elementsStore = {
        elements: new Map(),
        filteredResults: new Set(),
      };

      // Add test elements with more properties
      const elements = [
        { id: 'small-red-rect', type: 'rectangle', fill: '#ff0000', width: 50, height: 30, layer: 'background' },
        { id: 'large-red-rect', type: 'rectangle', fill: '#ff0000', width: 200, height: 150, layer: 'foreground' },
        { id: 'small-blue-circle', type: 'circle', fill: '#0000ff', radius: 25, layer: 'background' },
        { id: 'large-blue-circle', type: 'circle', fill: '#0000ff', radius: 75, layer: 'foreground' },
        { id: 'green-text', type: 'text', fill: '#00ff00', fontSize: 16, layer: 'text' },
      ];

      elements.forEach(el => {
        elementsStore.elements.set(el.id, el);
      });

      // Multi-criteria filter
      const filterByCriteria = (criteria: {
        type?: string,
        color?: string,
        size?: 'small' | 'large',
        layer?: string,
      }) => {
        elementsStore.filteredResults.clear();
        
        for (const [id, element] of elementsStore.elements) {
          const el = element as any;
          let matches = true;
          
          if (criteria.type && el.type !== criteria.type) matches = false;
          if (criteria.color && el.fill !== criteria.color) matches = false;
          if (criteria.layer && el.layer !== criteria.layer) matches = false;
          
          if (criteria.size) {
            const isLarge = (el.width > 100) || (el.height > 100) || (el.radius > 50) || (el.fontSize > 20);
            if (criteria.size === 'large' && !isLarge) matches = false;
            if (criteria.size === 'small' && isLarge) matches = false;
          }
          
          if (matches) {
            elementsStore.filteredResults.add(id);
          }
        }
      };

      // Test: Find large red elements
      filterByCriteria({ color: '#ff0000', size: 'large' });
      expect(elementsStore.filteredResults.size).toBe(1);
      expect(elementsStore.filteredResults.has('large-red-rect')).toBe(true);

      // Test: Find all background layer elements
      filterByCriteria({ layer: 'background' });
      expect(elementsStore.filteredResults.size).toBe(2);
      expect(elementsStore.filteredResults.has('small-red-rect')).toBe(true);
      expect(elementsStore.filteredResults.has('small-blue-circle')).toBe(true);

      // Test: Find small blue elements in background
      filterByCriteria({ color: '#0000ff', size: 'small', layer: 'background' });
      expect(elementsStore.filteredResults.size).toBe(1);
      expect(elementsStore.filteredResults.has('small-blue-circle')).toBe(true);
    });
  });
});

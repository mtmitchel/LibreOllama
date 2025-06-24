import { vi } from 'vitest'
import React from 'react'

// Mock the canvas module completely
vi.mock('canvas', () => ({
    createCanvas: vi.fn(() => ({
      getContext: vi.fn(() => ({
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: {
          width: 800,
          height: 600,
          toDataURL: vi.fn(() => 'data:image/png;base64,'),
          toBuffer: vi.fn(() => Buffer.alloc(0))
        }
      })),
      width: 800,
      height: 600,
      toDataURL: vi.fn(() => 'data:image/png;base64,'),
      toBuffer: vi.fn(() => Buffer.alloc(0))
    })),
    Canvas: vi.fn(),
    CanvasRenderingContext2D: vi.fn(),
    Image: vi.fn(() => ({
      onload: null,
      onerror: null,
      src: '',
      width: 0,
      height: 0
    })),
    ImageData: vi.fn(),
    loadImage: vi.fn(() => Promise.resolve({
      width: 100,
      height: 100,
      src: 'mock-image'
    })),
    registerFont: vi.fn(),
    deregisterAllFonts: vi.fn(),
    parseFont: vi.fn(() => ({})),
    default: {
      createCanvas: vi.fn(() => ({
        getContext: vi.fn(() => ({})),
        width: 800,
        height: 600
      }))
    }
  }))
  // Mock canvas native bindings
  vi.mock('canvas/lib/bindings', () => ({}))
  vi.mock('canvas/lib-extra', () => ({}))
  vi.mock('canvas/build/Release/canvas.node', () => ({}))

  // Mock Konva and react-konva
  vi.mock('konva', () => ({
    default: {
      Stage: vi.fn(),
      Layer: vi.fn(),
      Group: vi.fn(), 
      Rect: vi.fn(),
      Circle: vi.fn(),
      Text: vi.fn(),
      Image: vi.fn(),
      Line: vi.fn(),
      Arrow: vi.fn(),
      Transformer: vi.fn(),
    },
    Stage: vi.fn(),
    Layer: vi.fn(),
    Group: vi.fn(),
    Rect: vi.fn(),
    Circle: vi.fn(),
    Text: vi.fn(),
    Image: vi.fn(),
    Line: vi.fn(),
    Arrow: vi.fn(),
    Transformer: vi.fn(),
  }))

  vi.mock('react-konva', () => {
    const MockComponent = (name) => ({ children, ...props }) => {
      // Create a test-friendly name, e.g., 'konva-stage'
      const testId = `konva-${name.toLowerCase()}`;
      return React.createElement('div', { 
        'data-testid': testId, 
        ...props 
      }, children);
    };

    return {
      Stage: MockComponent('Stage'),
      Layer: MockComponent('Layer'), 
      Group: MockComponent('Group'),
      Rect: MockComponent('Rect'),
      Circle: MockComponent('Circle'),
      Text: MockComponent('Text'),
      Image: MockComponent('Image'),
      Line: MockComponent('Line'),
      Arrow: MockComponent('Arrow'),
      Transformer: MockComponent('Transformer'),
      Html: MockComponent('Html'),
    };
  })
  
  // Mock feature flags hook
  vi.mock('@/features/canvas/hooks/useFeatureFlags', () => {
    const mockFlags = {
      'grouped-section-rendering': false,
      'centralized-transformer': false,
      'shape-connector-grouping': false,
      'unified-text-overlays': false,
    };
    
    return {
      useFeatureFlag: vi.fn().mockReturnValue(false),
      useFeatureFlags: vi.fn().mockReturnValue(mockFlags),
      __esModule: true,
    };
  });

  // Mock all layer components
  vi.mock('@/features/canvas/layers/BackgroundLayer', () => ({
    BackgroundLayer: () => React.createElement('div', { 'data-testid': 'background-layer' }, 'Background Layer')
  }));

  vi.mock('@/features/canvas/layers/MainLayer', () => ({
    MainLayer: () => React.createElement('div', { 'data-testid': 'main-layer' }, 'Main Layer')
  }));

  vi.mock('@/features/canvas/layers/ConnectorLayer', () => ({
    ConnectorLayer: () => React.createElement('div', { 'data-testid': 'connector-layer' }, 'Connector Layer')
  }));

  vi.mock('@/features/canvas/layers/UILayer', () => ({
    UILayer: () => React.createElement('div', { 'data-testid': 'ui-layer' }, 'UI Layer')
  }));

  vi.mock('@/features/canvas/components/GroupedSectionRenderer', () => ({
    GroupedSectionRenderer: () => React.createElement('div', { 'data-testid': 'grouped-section-renderer' }, 'Grouped Section Renderer')
  }));

  vi.mock('@/features/canvas/components/TransformerManager', () => ({
    TransformerManager: () => React.createElement('div', { 'data-testid': 'transformer-manager' }, 'Transformer Manager')
  }));
  vi.mock('@/features/canvas/components/drawing/DrawingContainment', () => ({
    DrawingContainment: () => React.createElement('div', { 'data-testid': 'drawing-containment' }, 'Drawing Containment')
  }));

// Set up canvas mock for JSDOM
Object.defineProperty(window, 'HTMLCanvasElement', {
  value: class HTMLCanvasElement {
    getContext() {
      return {
        clearRect: vi.fn(),
        fillRect: vi.fn(),
        strokeRect: vi.fn(),
        fillText: vi.fn(),
        strokeText: vi.fn(),
        measureText: vi.fn(() => ({ width: 0 })),
        save: vi.fn(),
        restore: vi.fn(),
        translate: vi.fn(),
        rotate: vi.fn(),
        scale: vi.fn(),
        transform: vi.fn(),
        setTransform: vi.fn(),
        resetTransform: vi.fn(),
        createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
        createPattern: vi.fn(),
        putImageData: vi.fn(),
        getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
        drawImage: vi.fn(),
        beginPath: vi.fn(),
        closePath: vi.fn(),
        moveTo: vi.fn(),
        lineTo: vi.fn(),
        bezierCurveTo: vi.fn(),
        quadraticCurveTo: vi.fn(),
        arc: vi.fn(),
        arcTo: vi.fn(),
        ellipse: vi.fn(),
        rect: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
        clip: vi.fn(),
        isPointInPath: vi.fn(() => false),
        isPointInStroke: vi.fn(() => false),
        canvas: {
          width: 800,
          height: 600,
          toDataURL: vi.fn(() => 'data:image/png;base64,')
        }
      }
    }
    
    toDataURL() {
      return 'data:image/png;base64,'
    }
    
    width = 800
    height = 600
  }
})

console.log('✅ Hoisted canvas mocks loaded')

import { vi } from 'vitest'
import React from 'react'

// Prevent conflicting canvas context mock errors
// by disabling vitest-canvas-mock when we have our own mocks
if (typeof global !== 'undefined') {
  (global as any).DISABLE_VITEST_CANVAS_MOCK = true;
}

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
  vi.mock('canvas/build/Release/canvas.node', () => ({}))  // Mock Konva and react-konva
  vi.mock('konva', () => ({
    default: {
      Stage: vi.fn().mockImplementation(() => ({
        on: vi.fn(),
        off: vi.fn(),
        fire: vi.fn(),
        destroy: vi.fn(),
        getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
        scale: vi.fn(() => ({ x: 1, y: 1 })),
        scaleX: vi.fn(() => 1),
        scaleY: vi.fn(() => 1),
        position: vi.fn(() => ({ x: 0, y: 0 })),
        x: vi.fn(() => 0),
        y: vi.fn(() => 0),
        width: vi.fn(() => 800),
        height: vi.fn(() => 600),
        container: vi.fn(() => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) })),
        content: vi.fn(() => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) })),
        getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
        batchDraw: vi.fn(),
        draw: vi.fn(),
        add: vi.fn(),
        removeChildren: vi.fn(),
        children: [],
        findOne: vi.fn(),
        find: vi.fn(() => []),
        _descendants: []
      })),
      Layer: vi.fn(),
      Group: vi.fn().mockImplementation(() => ({
        add: vi.fn(),
        destroy: vi.fn(),
        getChildren: vi.fn(() => []),
        findOne: vi.fn(),
        find: vi.fn(() => []),
        on: vi.fn(),
        off: vi.fn(),
        x: vi.fn(() => 0),
        y: vi.fn(() => 0),
        setX: vi.fn(),
        setY: vi.fn(),
        position: vi.fn(() => ({ x: 0, y: 0 })),
        setPosition: vi.fn(),
        draggable: vi.fn(() => false),
        setDraggable: vi.fn(),
        width: vi.fn(() => 100),
        height: vi.fn(() => 100),
        getLayer: vi.fn(() => ({ batchDraw: vi.fn(), draw: vi.fn() })),
        getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
      })),
      Rect: vi.fn(),
      Circle: vi.fn(),
      Text: vi.fn().mockImplementation(() => ({
        destroy: vi.fn(),
        on: vi.fn(),
        off: vi.fn(),
        text: vi.fn(() => ''),
        setText: vi.fn(),
        fontSize: vi.fn(() => 12),
        setFontSize: vi.fn(),
        fill: vi.fn(() => '#000000'),
        setFill: vi.fn(),
        position: vi.fn(() => ({ x: 0, y: 0 })),
        setPosition: vi.fn(),
        width: vi.fn(() => 100),
        height: vi.fn(() => 20),
        // Text measurement methods needed by textEditingUtils.tsx
        getTextWidth: vi.fn(() => 100),
        getTextHeight: vi.fn(() => 20),
        measureSize: vi.fn(() => ({ width: 100, height: 20 })),
        textWidth: vi.fn(() => 100),
        textHeight: vi.fn(() => 20),
        getLayer: vi.fn(() => null),
        remove: vi.fn(),
        x: vi.fn(() => 0),
        y: vi.fn(() => 0),
        setX: vi.fn(),
        setY: vi.fn(),
      })),
      Image: vi.fn(),
      Line: vi.fn(),
      Arrow: vi.fn(),
      Transformer: vi.fn(),
    },
    Stage: vi.fn().mockImplementation(() => ({
      on: vi.fn(),
      off: vi.fn(),
      fire: vi.fn(),
      destroy: vi.fn(),
      getPointerPosition: vi.fn(() => ({ x: 0, y: 0 })),
      scale: vi.fn(() => ({ x: 1, y: 1 })),
      scaleX: vi.fn(() => 1),
      scaleY: vi.fn(() => 1),
      position: vi.fn(() => ({ x: 0, y: 0 })),
      x: vi.fn(() => 0),
      y: vi.fn(() => 0),
      width: vi.fn(() => 800),
      height: vi.fn(() => 600),
      container: vi.fn(() => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) })),
      content: vi.fn(() => ({ getBoundingClientRect: () => ({ left: 0, top: 0, width: 800, height: 600 }) })),
      getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 800, height: 600 })),
      batchDraw: vi.fn(),
      draw: vi.fn(),
      add: vi.fn(),
      removeChildren: vi.fn(),
      children: [],
      findOne: vi.fn(),
      find: vi.fn(() => []),
      _descendants: []
    })),
    Layer: vi.fn(),
    Group: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      destroy: vi.fn(),
      getChildren: vi.fn(() => []),
      findOne: vi.fn(),
      find: vi.fn(() => []),
      on: vi.fn(),
      off: vi.fn(),
      x: vi.fn(() => 0),
      y: vi.fn(() => 0),
      setX: vi.fn(),
      setY: vi.fn(),
      position: vi.fn(() => ({ x: 0, y: 0 })),
      setPosition: vi.fn(),
      draggable: vi.fn(() => false),
      setDraggable: vi.fn(),
      width: vi.fn(() => 100),
      height: vi.fn(() => 100),
      getLayer: vi.fn(() => ({ batchDraw: vi.fn(), draw: vi.fn() })),
      getClientRect: vi.fn(() => ({ x: 0, y: 0, width: 100, height: 100 })),
    })),
    Rect: vi.fn(),
    Circle: vi.fn(),
    Text: vi.fn().mockImplementation(() => ({
      destroy: vi.fn(),
      on: vi.fn(),
      off: vi.fn(),
      text: vi.fn(() => ''),
      setText: vi.fn(),
      fontSize: vi.fn(() => 12),
      setFontSize: vi.fn(),
      fill: vi.fn(() => '#000000'),
      setFill: vi.fn(),
      position: vi.fn(() => ({ x: 0, y: 0 })),
      setPosition: vi.fn(),
      width: vi.fn(() => 100),
      height: vi.fn(() => 20),
      // Text measurement methods needed by textEditingUtils.tsx
      getTextWidth: vi.fn(() => 100),
      getTextHeight: vi.fn(() => 20),
      measureSize: vi.fn(() => ({ width: 100, height: 20 })),
      textWidth: vi.fn(() => 100),
      textHeight: vi.fn(() => 20),
      getLayer: vi.fn(() => null),
      remove: vi.fn(),
      x: vi.fn(() => 0),
      y: vi.fn(() => 0),
      setX: vi.fn(),
      setY: vi.fn(),
    })),
    Image: vi.fn(),
    Line: vi.fn(),
    Arrow: vi.fn(),
    Transformer: vi.fn(),
  }))

  vi.mock('react-konva', () => {
    // A more sophisticated mock that renders a real canvas for the Stage
    const MockComponent = (name: string) => {
      return React.forwardRef(({ children, ...props }: any, ref: any) => {
        const testId = `konva-${name.toLowerCase()}`;
        
        // The Stage is special, it's the root and needs a canvas.
        if (name === 'Stage') {
          return React.createElement('canvas', {
            'data-testid': testId,
            ref,
            ...props,
          }, children);
        }

        // Other components can be simple divs.
        return React.createElement('div', {
          'data-testid': testId,
          ref,
          ...props,
        }, children);
      });
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
      Star: MockComponent('Star'),
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
  }));  vi.mock('@/features/canvas/components/drawing/DrawingContainment', () => ({
    DrawingContainment: () => React.createElement('div', { 'data-testid': 'drawing-containment' }, 'Drawing Containment')
  }));

// Set up canvas mock for JSDOM - but only if not already defined
if (!global.HTMLCanvasElement && !window.HTMLCanvasElement) {
  Object.defineProperty(window, 'HTMLCanvasElement', {
    value: class HTMLCanvasElement {
      width = 800
      height = 600
      style = {}
      
      constructor() {
        this.addEventListener = vi.fn()
        this.removeEventListener = vi.fn()
        this.dispatchEvent = vi.fn()
      }
      
      getContext(type: string) {
        if (type === '2d') {
          const canvas = this;
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
            createImageData: vi.fn(() => ({ data: new Uint8ClampedArray(4), width: 1, height: 1 })),
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
            getLineDash: vi.fn(() => []),
            setLineDash: vi.fn(),
            canvas: canvas,
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            fillStyle: '#000000',
            strokeStyle: '#000000',
            lineWidth: 1,
            lineCap: 'butt',
            lineJoin: 'miter',
            miterLimit: 10,
            lineDashOffset: 0,
            shadowOffsetX: 0,
            shadowOffsetY: 0,
            shadowBlur: 0,
            shadowColor: 'rgba(0, 0, 0, 0)',
            font: '10px sans-serif',
            textAlign: 'start',
            textBaseline: 'alphabetic'
          }
        }
        if (type === 'webgl' || type === 'webgl2') {
          const canvas = this;
          return {
            getExtension: vi.fn().mockReturnValue({}),
            createShader: vi.fn(),
            shaderSource: vi.fn(),
            compileShader: vi.fn(),
            createProgram: vi.fn(),
            attachShader: vi.fn(),
            linkProgram: vi.fn(),
            useProgram: vi.fn(),
            createBuffer: vi.fn(),
            bindBuffer: vi.fn(),
            bufferData: vi.fn(),
            enableVertexAttribArray: vi.fn(),
            vertexAttribPointer: vi.fn(),
            drawArrays: vi.fn(),
            drawElements: vi.fn(),
            viewport: vi.fn(),
            clear: vi.fn(),
            clearColor: vi.fn(),
            enable: vi.fn(),
            disable: vi.fn(),
            blendFunc: vi.fn(),
            getParameter: vi.fn().mockReturnValue('WebGL 1.0'),
            canvas: canvas,
            COLOR_BUFFER_BIT: 0x00004000,
            DEPTH_BUFFER_BIT: 0x00000100,
            BLEND: 0x0BE2,
            SRC_ALPHA: 0x0302,
            ONE_MINUS_SRC_ALPHA: 0x0303
          }
        }
        return null;
      }
      
      toDataURL() {
        return 'data:image/png;base64,mock'
      }
      
      toBlob(callback: (blob: Blob) => void) {
        callback(new Blob())
      }
      
      getBoundingClientRect() {
        return {
          left: 0,
          top: 0,
          right: this.width,
          bottom: this.height,
          width: this.width,
          height: this.height,
          x: 0,
          y: 0
        }
      }
      
      addEventListener = vi.fn()
      removeEventListener = vi.fn()
      dispatchEvent = vi.fn()
    }
  })
}

// Ensure CanvasRenderingContext2D exists (conditionally)
if (!global.CanvasRenderingContext2D && !window.CanvasRenderingContext2D) {
  Object.defineProperty(window, 'CanvasRenderingContext2D', {
    value: class CanvasRenderingContext2D {},
    configurable: true
  })
}

// Ensure WebGLRenderingContext exists (conditionally)
if (!global.WebGLRenderingContext && !window.WebGLRenderingContext) {
  Object.defineProperty(window, 'WebGLRenderingContext', {
    value: class WebGLRenderingContext {},
    configurable: true
  })
}

console.log('✅ Hoisted canvas mocks loaded')

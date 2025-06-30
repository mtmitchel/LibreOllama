import React, { forwardRef, ReactNode } from 'react';
import { vi } from 'vitest';

/**
 * Complete React-Konva Mock
 * 
 * This mock replaces all React-Konva components with DOM equivalents,
 * completely bypassing the canvas dependency chain.
 */

interface StageProps {
  children?: ReactNode;
  width?: number;
  height?: number;
  [key: string]: any;
}

interface LayerProps {
  children?: ReactNode;
  [key: string]: any;
}

interface ShapeProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  radius?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  text?: string;
  fontSize?: number;
  points?: number[];
  children?: ReactNode;
  id?: string;
  opacity?: number;
  closed?: boolean;
  [key: string]: any;
}

// Helper function to filter out Konva-specific props that shouldn't be passed to DOM
const filterDOMProps = (props: Record<string, any>) => {
  const {
    // Konva-specific props to exclude
    cornerRadius,
    perfectDrawEnabled,
    shadowForStrokeEnabled,
    shadowColor,
    shadowBlur,
    shadowOpacity,
    shadowOffset,
    shadowOffsetX,
    shadowOffsetY,
    listening,
    visible,
    draggable,
    rotation,
    scaleX,
    scaleY,
    offsetX,
    offsetY,
    opacity,
    globalCompositeOperation,
    filters,
    cache,
    clearBeforeDraw,
    hitStrokeWidth,
    transformsEnabled,
    verticalAlign,
    onTap,
    onDblClick,
    onDblTap,
    isSelected,
    closed,
    points,
    // Filter out other Konva props
    ...domProps
  } = props;
  
  return domProps;
};

// Stage component mock - ENHANCED with complete Konva API
export const Stage = forwardRef<HTMLCanvasElement, StageProps>(({ children, width = 800, height = 600, ...props }, ref) => {
  const domProps = filterDOMProps(props);
  const containerRef = React.useRef<HTMLDivElement>(null);
  
  // Create a comprehensive mock stage object
  const mockStage = React.useMemo(() => ({
    width: vi.fn(() => width),
    height: vi.fn(() => height),
    findOne: vi.fn((selector: string) => {
      if (!containerRef.current) return null;
      
      // Handle ID selectors (e.g., "#element-123")
      if (selector.startsWith('#')) {
        const id = selector.substring(1);
        const element = containerRef.current.querySelector(`[id="${id}"]`);
        if (element) {
          // Return a mock Konva node
          return {
            id: () => id,
            x: () => 0,
            y: () => 0,
            width: () => 100,
            height: () => 100,
            getClientRect: () => ({ x: 0, y: 0, width: 100, height: 100 }),
            visible: () => true,
            listening: () => true,
          };
        }
      }
      return null;
    }),
    getPointerPosition: vi.fn(() => ({ x: 100, y: 100 })),
    container: vi.fn(() => containerRef.current),
    getContainer: vi.fn(() => containerRef.current),
    x: vi.fn(() => props.x || 0),
    y: vi.fn(() => props.y || 0),
    scaleX: vi.fn(() => 1),
    scaleY: vi.fn(() => 1),
    rotation: vi.fn(() => 0),
    getAbsoluteTransform: vi.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
    getTransform: vi.fn(() => ({ m: [1, 0, 0, 1, 0, 0] })),
    batchDraw: vi.fn(),
    draw: vi.fn(),
    toDataURL: vi.fn(() => 'data:image/png;base64,mock'),
    listening: vi.fn(() => true),
    visible: vi.fn(() => true),
  }), [width, height, props.x, props.y]);

  // Assign the mock stage to the ref
  React.useImperativeHandle(ref, () => mockStage as any, [mockStage]);

  // Enhanced event handling - add getStage method to event targets
  const createEnhancedEvent = React.useCallback((e: React.MouseEvent, additionalProps: any = {}) => {
    return {
      ...e,
      target: {
        ...e.target,
        getStage: () => mockStage,
        getPointerPosition: () => ({ x: 100, y: 100 }),
        ...additionalProps,
      },
      currentTarget: {
        ...e.currentTarget,
        getStage: () => mockStage,
        getPointerPosition: () => ({ x: 100, y: 100 }),
      },
    };
  }, [mockStage]);

  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseDown) {
      const enhancedEvent = createEnhancedEvent(e);
      props.onMouseDown(enhancedEvent as any);
    }
  }, [props.onMouseDown, createEnhancedEvent]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (props.onClick) {
      const enhancedEvent = createEnhancedEvent(e);
      props.onClick(enhancedEvent as any);
    }
  }, [props.onClick, createEnhancedEvent]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseMove) {
      const enhancedEvent = createEnhancedEvent(e);
      props.onMouseMove(enhancedEvent as any);
    }
  }, [props.onMouseMove, createEnhancedEvent]);

  const handleMouseUp = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseUp) {
      const enhancedEvent = createEnhancedEvent(e);
      props.onMouseUp(enhancedEvent as any);
    }
  }, [props.onMouseUp, createEnhancedEvent]);

  return (
    <div 
      ref={containerRef}
      className="konvajs-content" // Add the expected Konva CSS class
      role="presentation" // Add the expected ARIA role
      style={{ position: 'relative', width, height }}
      data-testid="konva-stage-wrapper"
    >
      <canvas 
        data-testid="konva-stage"
        width={width}
        height={height}
        style={{ position: 'absolute', top: 0, left: 0 }}
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        {...domProps}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
        {children}
      </div>
    </div>
  );
});

// Layer component mock - IMPROVED
export const Layer = ({ children, ...props }: LayerProps) => {
  const domProps = filterDOMProps(props);
  
  // Enhanced event handling for Layer interactions
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseDown) {
      const enhancedEvent = {
        ...e,
        target: {
          ...e.target,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
          getPointerPosition: () => ({ x: 100, y: 100 }),
        },
        currentTarget: {
          ...e.currentTarget,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
        },
      };
      props.onMouseDown(enhancedEvent as any);
    }
  }, [props.onMouseDown]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (props.onClick) {
      const enhancedEvent = {
        ...e,
        target: {
          ...e.target,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
          getPointerPosition: () => ({ x: 100, y: 100 }),
        },
        currentTarget: {
          ...e.currentTarget,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
        },
      };
      props.onClick(enhancedEvent as any);
    }
  }, [props.onClick]);

  const handleMouseMove = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseMove) {
      const enhancedEvent = {
        ...e,
        target: {
          ...e.target,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
          getPointerPosition: () => ({ x: 100, y: 100 }),
        },
        currentTarget: {
          ...e.currentTarget,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
        },
      };
      props.onMouseMove(enhancedEvent as any);
    }
  }, [props.onMouseMove]);

  return (
    <div 
      data-testid="konva-layer" // Always provide the testid
      style={{ position: 'absolute', top: 0, left: 0 }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      {...domProps}
    >
      {children}
    </div>
  );
};

// Shape component mocks
export const Rect = ({ x, y, width, height, fill, stroke, strokeWidth, cornerRadius, id, ...props }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  return <div data-testid="konva-rect" id={id} style={{ position: 'absolute', left: x, top: y, width, height, backgroundColor: fill, border: `${strokeWidth || 1}px solid ${stroke || 'black'}`, borderRadius: cornerRadius }} {...domProps} />;
};

export const Circle = ({ x, y, radius, fill, stroke, strokeWidth, id, ...props }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  return <div data-testid="konva-circle" id={id} style={{ position: 'absolute', left: (x || 0) - (radius || 0), top: (y || 0) - (radius || 0), width: (radius || 0) * 2, height: (radius || 0) * 2, backgroundColor: fill, border: `${strokeWidth || 1}px solid ${stroke || 'black'}`, borderRadius: '50%' }} {...domProps} />;
};

export const Text = ({ x, y, text, fontSize, fill, fontFamily, fontStyle, textAlign, ...props }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  return <div data-testid="konva-text" style={{ position: 'absolute', left: x, top: y, fontSize, color: fill, fontFamily, fontStyle, textAlign }} {...domProps}>{text}</div>;
};

export const Line = ({ points, stroke, strokeWidth, fill, closed, id, opacity }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  // This is a simplified mock; for real tests, you might need SVG
  return <div data-testid="konva-line" id={id} style={{ position: 'absolute', borderTop: `${strokeWidth || 1}px solid ${stroke || 'black'}`, width: '100px', top: '50%', left: '0', opacity }} {...domProps} />;
};

export const Star = ({ numPoints, innerRadius, outerRadius, fill, stroke, strokeWidth, id, opacity }: ShapeProps & { numPoints?: number; innerRadius?: number; outerRadius?: number }) => {
  const domProps = filterDOMProps(props);
  return <div data-testid="konva-star" id={id} style={{ position: 'absolute', color: fill, opacity }} {...domProps}>STAR</div>;
};

export const Group = ({ children, x, y, id, ...props }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  // IMPROVED: Always provide a consistent data-testid, prioritizing explicit testid
  const testId = props['data-testid'] || (id ? `element-${id}` : "konva-group");
  
  // Enhanced event handling for Group interactions
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (props.onMouseDown) {
      const enhancedEvent = {
        ...e,
        target: {
          ...e.target,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
        },
      };
      props.onMouseDown(enhancedEvent as any);
    }
  }, [props.onMouseDown]);

  const handleClick = React.useCallback((e: React.MouseEvent) => {
    if (props.onClick) {
      const enhancedEvent = {
        ...e,
        target: {
          ...e.target,
          getStage: () => ({
            getPointerPosition: () => ({ x: 100, y: 100 }),
            width: () => 800,
            height: () => 600,
            findOne: () => null,
          }),
          getParent: () => null,
        },
      };
      props.onClick(enhancedEvent as any);
    }
  }, [props.onClick]);
  
  return (
    <div
      data-testid={testId}
      style={{
        position: 'absolute',
        left: x || 0,
        top: y || 0,
      }}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      {...domProps}
    >
      {children}
    </div>
  );
};

// Additional shape mocks
export const Path = (props: ShapeProps) => {
  return <div data-testid="konva-path">PATH</div>;
};

export const Image = ({ width, height, ...props }: ShapeProps) => {
  const domProps = filterDOMProps(props);
  return (
    <div 
      data-testid="konva-image" 
      style={{ width, height }}
      {...domProps} 
    />
  );
};

export const Transformer = forwardRef<any, ShapeProps>(({ children, ...props }, ref) => {
  const domProps = filterDOMProps(props);
  
  // Create a comprehensive mock transformer with all necessary methods
  const mockTransformer = {
    nodes: vi.fn((nodes?: any[]) => {
      if (nodes !== undefined) {
        // Setter - store the nodes
        mockTransformer._nodes = nodes;
        return mockTransformer;
      }
      // Getter - return stored nodes
      return mockTransformer._nodes || [];
    }),
    _nodes: [] as any[], // Fix TypeScript typing
    getNodes: vi.fn(() => mockTransformer._nodes || []),
    visible: vi.fn((isVisible?: boolean) => {
      if (isVisible !== undefined) {
        mockTransformer._visible = isVisible;
        return mockTransformer;
      }
      return mockTransformer._visible !== false;
    }),
    _visible: true,
    getLayer: vi.fn(() => ({
      batchDraw: vi.fn(),
    })),
    attachTo: vi.fn(),
    detach: vi.fn(),
    show: vi.fn(),
    hide: vi.fn(),
    moveToTop: vi.fn(),
    destroy: vi.fn(),
    x: vi.fn(() => 0),
    y: vi.fn(() => 0),
    rotation: vi.fn(() => 0),
    scaleX: vi.fn(() => 1),
    scaleY: vi.fn(() => 1),
    id: vi.fn(() => 'mock-transformer'),
  };
  
  // Properly assign the mock to the ref
  React.useImperativeHandle(ref, () => mockTransformer, []);
  
  return (
    <div 
      data-testid="konva-transformer" 
      {...domProps}
    >
      {children}
    </div>
  );
});

// Utility functions
export const useStrictMode = () => true;

// Export default object
export default {
  Stage,
  Layer,
  Rect,
  Circle,
  Text,
  Line,
  Star,
  Group,
  Path,
  Image,
  Transformer,
  useStrictMode,
};

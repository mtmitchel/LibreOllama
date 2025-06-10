/**
 * Fabric.js Element Creation Utilities
 * Replaces PIXI.js-specific element creation with Fabric.js-compatible functions
 */

import { FabricCanvasElement } from '../stores/fabricCanvasStoreFixed';

export interface CreateElementOptions {
  type: FabricCanvasElement['type'] | 'star' | 'hexagon' | 'arrow';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: 'small' | 'medium' | 'large';
  textAlignment?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  strokeColor?: string;
  strokeWidth?: number;
  radius?: number;
  points?: { x: number; y: number }[];
  isLocked?: boolean;
}

/**
 * Creates a new Fabric.js-compatible canvas element with proper default values
 * This replaces the PIXI.js-specific createElementDirectly function
 */
export function createFabricElement(
  options: CreateElementOptions,
  generateId: () => string,
  centerPosition?: { x: number; y: number }
): FabricCanvasElement {
  const {
    type,
    content,
    color,
    backgroundColor,
    fontSize = 'medium',
    textAlignment = 'left',
    isBold = false,
    isItalic = false,
    strokeColor,
    strokeWidth = 2,
    radius,
    points,
    isLocked = false,
    ...otherProps
  } = options;

  // Calculate default dimensions based on element type
  const getDefaultDimensions = (elementType: string) => {
    switch (elementType) {
      case 'text':
        return { width: 120, height: 30 };
      case 'sticky-note':
        return { width: 150, height: 100 };
      case 'rectangle':
        return { width: 120, height: 80 };
      case 'square':
        return { width: 80, height: 80 };
      case 'circle':
        return { width: 80, height: 80 };
      case 'triangle':
        return { width: 80, height: 80 };
      case 'star':
        return { width: 80, height: 80 };
      case 'hexagon':
        return { width: 80, height: 80 };
      case 'arrow':
        return { width: 100, height: 40 };
      case 'line':
        return { width: 100, height: 2 };
      case 'image':
        return { width: 200, height: 150 };
      default:
        return { width: 100, height: 60 };
    }
  };

  const defaultDimensions = getDefaultDimensions(type);
  const elementWidth = options.width ?? defaultDimensions.width;
  const elementHeight = options.height ?? defaultDimensions.height;

  // Calculate position (centered if centerPosition provided, otherwise use explicit x/y)
  const elementX = centerPosition 
    ? centerPosition.x - elementWidth / 2
    : (options.x ?? 100);
  const elementY = centerPosition 
    ? centerPosition.y - elementHeight / 2
    : (options.y ?? 100);

  // Get default colors based on element type
  const getDefaultColors = (elementType: string) => {
    switch (elementType) {
      case 'text':
        return { 
          color: '#000000', 
          backgroundColor: 'transparent' 
        };
      case 'sticky-note':
        return { 
          color: '#000000', 
          backgroundColor: '#FFFFE0' 
        };
      case 'rectangle':
      case 'square':
        return { 
          color: '#4F46E5', 
          backgroundColor: '#4F46E5',
          strokeColor: '#312E81',
          strokeWidth: 2
        };
      case 'circle':
        return { 
          color: '#10B981', 
          backgroundColor: '#10B981',
          strokeColor: '#047857',
          strokeWidth: 2
        };
      case 'triangle':
        return { 
          color: '#F59E0B', 
          backgroundColor: '#F59E0B',
          strokeColor: '#92400E',
          strokeWidth: 2
        };
      case 'line':
      case 'drawing':
        return { 
          color: '#EF4444', 
          strokeColor: '#EF4444',
          strokeWidth: 2
        };
      default:
        return { 
          color: '#6B7280', 
          backgroundColor: '#6B7280',
          strokeColor: '#374151',
          strokeWidth: 2
        };
    }
  };

  const defaultColors = getDefaultColors(type);

  // Build the element object
  const element: FabricCanvasElement = {
    id: generateId(),
    type,
    x: elementX,
    y: elementY,
    width: elementWidth,
    height: elementHeight,
    isLocked,
    
    // Apply colors with fallbacks
    color: color || defaultColors.color,
    backgroundColor: backgroundColor || defaultColors.backgroundColor,
    strokeColor: strokeColor || defaultColors.strokeColor,
    strokeWidth: strokeWidth || defaultColors.strokeWidth,
    
    // Type-specific properties
    ...(type === 'text' || type === 'sticky-note' ? {
      content: content || (type === 'sticky-note' ? 'Note' : 'Text'),
      fontSize,
      textAlignment,
      isBold,
      isItalic,
    } : {}),
    
    ...(type === 'circle' ? {
      radius: radius || elementWidth / 2,
    } : {}),
    
    ...(type === 'line' || type === 'drawing' ? {
      points: points || [
        { x: elementX, y: elementY },
        { x: elementX + elementWidth, y: elementY + elementHeight }
      ],
    } : {}),
    
    // Include any additional properties
    ...otherProps,
  };

  return element;
}

/**
 * Fabric.js-compatible element creation hook
 * This replaces the PIXI.js-specific element creation logic
 */
export function useFabricElementCreation(
  fabricCanvasStore: any,
  generateId: () => string,
  canvasContainerRef: React.RefObject<HTMLDivElement | null>
) {
  const createElementDirectly = (options: CreateElementOptions) => {
    if (!canvasContainerRef.current) {
      console.warn('Canvas container not available for element creation');
      return;
    }

    const { 
      elements: currentElements, 
      addElement, 
      addToHistory, 
      setSelectedElementIds, 
      setIsEditingText,
      fabricCanvas
    } = fabricCanvasStore.getState();

    // Get the center position of the visible canvas area
    const rect = canvasContainerRef.current.getBoundingClientRect();
    const centerPosition = {
      x: rect.width / 2,
      y: rect.height / 2
    };

    // If we have a Fabric.js canvas, adjust for viewport
    if (fabricCanvas) {
      const zoom = fabricCanvas.getZoom();
      const vpt = fabricCanvas.viewportTransform;
      
      // Convert screen center to canvas coordinates
      centerPosition.x = (centerPosition.x - vpt[4]) / zoom;
      centerPosition.y = (centerPosition.y - vpt[5]) / zoom;
    }

    // Create the new element
    const newElement = createFabricElement(options, generateId, centerPosition);

    // Validate the element
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Fabric Canvas: Failed to create valid element:', newElement);
      return;
    }

    console.log(`Fabric Canvas: Creating new ${newElement.type} element:`, newElement);

    // Add to store (this will automatically create the Fabric.js object)
    addElement(newElement);
    
    // Update history and selection
    addToHistory({ ...currentElements, [newElement.id]: newElement });
    setSelectedElementIds([newElement.id]);

    // Auto-start text editing for text elements
    if (newElement.type === 'text' || newElement.type === 'sticky-note') {
      // For Fabric.js, we can enter edit mode directly on the IText object
      setTimeout(() => {
        const fabricObject = fabricCanvasStore.getState().getFabricObjectById(newElement.id);
        if (fabricObject && fabricObject.type === 'i-text') {
          fabricObject.enterEditing();
          setIsEditingText(newElement.id);
        }
      }, 100); // Small delay to ensure object is rendered
    }

    return newElement;
  };

  return { createElementDirectly };
}

/**
 * Default element configurations for different types
 */
export const DEFAULT_ELEMENT_CONFIGS: Record<string, Partial<CreateElementOptions>> = {
  text: {
    type: 'text',
    content: 'Text',
    fontSize: 'medium',
    color: '#000000',
    backgroundColor: 'transparent',
  },
  'sticky-note': {
    type: 'sticky-note',
    content: 'Note',
    fontSize: 'medium',
    color: '#000000',
    backgroundColor: '#FFFFE0',
  },
  rectangle: {
    type: 'rectangle',
    color: '#4F46E5',
    backgroundColor: '#4F46E5',
    strokeColor: '#312E81',
    strokeWidth: 2,
  },
  square: {
    type: 'square',
    width: 80,
    height: 80,
    color: '#4F46E5',
    backgroundColor: '#4F46E5',
    strokeColor: '#312E81',
    strokeWidth: 2,
  },
  circle: {
    type: 'circle',
    radius: 40,
    color: '#10B981',
    backgroundColor: '#10B981',
    strokeColor: '#047857',
    strokeWidth: 2,
  },
  triangle: {
    type: 'triangle',
    color: '#F59E0B',
    backgroundColor: '#F59E0B',
    strokeColor: '#92400E',
    strokeWidth: 2,
  },
  star: {
    type: 'star' as any,
    color: '#FFD700',
    backgroundColor: '#FFD700',
    strokeColor: '#FFA500',
    strokeWidth: 2,
  },
  hexagon: {
    type: 'hexagon' as any,
    color: '#8B4513',
    backgroundColor: '#8B4513',
    strokeColor: '#654321',
    strokeWidth: 2,
  },
  arrow: {
    type: 'arrow' as any,
    color: '#FF6347',
    backgroundColor: '#FF6347',
    strokeColor: '#CD5C5C',
    strokeWidth: 2,
  },
  line: {
    type: 'line',
    color: '#EF4444',
    strokeColor: '#EF4444',
    strokeWidth: 2,
  },
  drawing: {
    type: 'drawing',
    color: '#EF4444',
    strokeColor: '#EF4444',
    strokeWidth: 2,
  },
};

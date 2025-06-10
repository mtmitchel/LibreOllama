/**
 * Fabric.js Element Creation Utilities
 * Replaces PIXI.js-specific element creation with Fabric.js-compatible functions
 */

import { FabricCanvasElement } from '../stores/fabricCanvasStore';
// import { getDefaultElementColors } from './theme-utils'; // REPLACED with getHighContrastElementColors

// Returns static, high-contrast colors for elements to ensure visibility on a white canvas.
const getHighContrastElementColors = (elementType: string) => {
  const defaults = {
    color: '#FF0000', // Change to RED for debugging visibility
    strokeColor: '#FF0000', // Change to RED
    strokeWidth: 3, // Increase stroke width
  };

  switch (elementType) {
    case 'sticky-note':
      return { ...defaults, backgroundColor: '#FFFF00' }; // Bright yellow
    case 'text':
      return { ...defaults, backgroundColor: 'transparent' };
    default:
      return { ...defaults, backgroundColor: '#00FF00' }; // Bright green
   }
 };

export interface CreateElementOptions {
  id?: string; // Added to allow passing an ID
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
  console.log(`[createFabricElement] Calculating X: centerPosition.x=${centerPosition?.x}, elementWidth=${elementWidth}, options.x=${options?.x}`);
  const elementX = centerPosition 
    ? centerPosition.x - elementWidth / 2
    : (options.x ?? 100);
  console.log(`[createFabricElement] Calculating Y: centerPosition.y=${centerPosition?.y}, elementHeight=${elementHeight}, options.y=${options?.y}`);
  const elementY = centerPosition 
    ? centerPosition.y - elementHeight / 2
    : (options.y ?? 100);
  console.log(`[createFabricElement] Calculated elementX=${elementX}, elementY=${elementY}`);

  // Use the new high-contrast color utility
  const defaultColors = getHighContrastElementColors(type);

  // Build the element object
  const element: FabricCanvasElement = {
    ...otherProps, // Spread other properties from the initial options destructuring (line 51)
    id: options.id || generateId(), // Use options.id if provided, else generate
    type: type as FabricCanvasElement['type'], // 'type' is from function parameters (destructured from options)
    x: elementX, // Use calculated X
    y: elementY, // Use calculated Y
    width: elementWidth, // Use calculated width
    height: elementHeight, // Use calculated height
    content: content, // 'content' is from function parameters (destructured from options)
    color: color || defaultColors.color, // 'color' is from function parameters, fallback to default
    backgroundColor: backgroundColor || defaultColors.backgroundColor, // 'backgroundColor' from function parameters, fallback to default
    fontSize: fontSize, // 'fontSize' is from function parameters (already has a default)
    textAlignment: textAlignment, // 'textAlignment' is from function parameters (already has a default)
    isBold: isBold, // 'isBold' is from function parameters (already has a default)
    isItalic: isItalic, // 'isItalic' is from function parameters (already has a default)
    isLocked: isLocked, // 'isLocked' is from function parameters (already has a default)
    strokeColor: strokeColor || defaultColors.strokeColor, // 'strokeColor' from function parameters, fallback to default
    strokeWidth: strokeWidth, // 'strokeWidth' is from function parameters (already has a default)

    // Type-specific properties - 'radius' and 'points' are from function parameters (destructured from options)
    ...(type === 'circle' && { radius: radius ?? elementWidth / 2 }),
    ...( (type === 'line' || type === 'drawing') && { 
        points: points ?? [
          { x: elementX, y: elementY },
          { x: elementX + elementWidth, y: elementY + elementHeight }
        ]
      }
    ),
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
    console.log('🚀 DEBUG: createElementDirectly called with options:', options);
    
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

    console.log('🚀 DEBUG: Store state retrieved:', {
      elementCount: Object.keys(currentElements).length,
      hasFabricCanvas: !!fabricCanvas,
      fabricCanvasType: fabricCanvas?.constructor?.name
    });

    // Get the center position of the visible canvas area
    const rect = canvasContainerRef.current.getBoundingClientRect();
    console.log(`[createElementDirectly] Canvas container rect: width=${rect.width}, height=${rect.height}, top=${rect.top}, left=${rect.left}`);
    const screenCenterPosition = {
      x: rect.width / 2,
      y: rect.height / 2
    };
    console.log(`[createElementDirectly] Initial screen centerPosition: x=${screenCenterPosition.x}, y=${screenCenterPosition.y}`);
    // Make a mutable copy for adjustment
    const adjustedCenterPosition = { ...screenCenterPosition };

    // If we have a Fabric.js canvas, adjust for viewport
    if (fabricCanvas) {
      const zoom = fabricCanvas.getZoom();
      const vpt = fabricCanvas.viewportTransform; // [scaleX, skewY, skewX, scaleY, translateX, translateY]
      console.log(`[createElementDirectly] Fabric canvas zoom: ${zoom}, vpt: [${vpt.join(', ')}] (panX=${vpt[4]}, panY=${vpt[5]})`);
      
      // Convert screen center to canvas coordinates
      adjustedCenterPosition.x = (screenCenterPosition.x - vpt[4]) / zoom;
      adjustedCenterPosition.y = (screenCenterPosition.y - vpt[5]) / zoom;
      console.log(`[createElementDirectly] Adjusted canvas centerPosition: x=${adjustedCenterPosition.x}, y=${adjustedCenterPosition.y}`);
    } else {
      console.log('[createElementDirectly] Fabric canvas not available for viewport adjustment.');
    }

    // Create the new element
    const newElement = createFabricElement(options, generateId, adjustedCenterPosition);

    // Validate the element
    if (!newElement.id || !newElement.type || typeof newElement.x !== 'number' || typeof newElement.y !== 'number') {
      console.error('Fabric Canvas: Failed to create valid element:', newElement);
      return;
    }

    console.log(`Fabric Canvas: Creating new ${newElement.type} element with properties: x=${newElement.x}, y=${newElement.y}, width=${newElement.width}, height=${newElement.height}, type=${newElement.type}, id=${newElement.id}`);

    // Add to store (this will automatically create the Fabric.js object)
    console.log('🚀 DEBUG: About to call addElement with:', newElement);
    addElement(newElement);
    console.log('🚀 DEBUG: addElement called successfully');
    
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
 * Get default element configurations with theme-aware colors
 */
export function getDefaultElementConfigs(): Record<string, Partial<CreateElementOptions>> {
  return {
    text: {
      type: 'text',
      content: 'Text',
      fontSize: 'medium',
      ...getHighContrastElementColors('text'),
    },
    'sticky-note': {
      type: 'sticky-note',
      content: 'Note',
      fontSize: 'medium',
      ...getHighContrastElementColors('sticky-note'),
    },
    rectangle: {
      type: 'rectangle',
      ...getHighContrastElementColors('rectangle'),
    },
    square: {
      type: 'square',
      width: 80,
      height: 80,
      ...getHighContrastElementColors('square'),
    },
    circle: {
      type: 'circle',
      radius: 40,
      ...getHighContrastElementColors('circle'),
    },
    triangle: {
      type: 'triangle',
      ...getHighContrastElementColors('triangle'),
    },
    star: {
      type: 'star' as any,
      ...getHighContrastElementColors('star'),
    },
    hexagon: {
      type: 'hexagon' as any,
      ...getHighContrastElementColors('hexagon'),
    },
    arrow: {
      type: 'arrow' as any,
      ...getHighContrastElementColors('arrow'),
    },
    line: {
      type: 'line',
      ...getHighContrastElementColors('line'),
    },
    drawing: {
      type: 'drawing',
      ...getHighContrastElementColors('drawing'),
    },
  };
}

/**
 * Default element configurations for different types
 * @deprecated Use getDefaultElementConfigs() for theme-aware colors
 */
export const DEFAULT_ELEMENT_CONFIGS: Record<string, Partial<CreateElementOptions>> = getDefaultElementConfigs();

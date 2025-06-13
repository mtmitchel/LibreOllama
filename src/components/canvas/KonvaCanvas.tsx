// src/components/Canvas/KonvaCanvas.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Transformer, Rect, Circle, Line, Star, Arrow } from 'react-konva';
import Konva from 'konva';
import { useKonvaCanvasStore, CanvasElement, RichTextSegment } from '../../stores/konvaCanvasStore';
import RichTextRenderer, { RichTextElementType } from './RichTextRenderer';
import UnifiedTextElement from './UnifiedTextElement';
import ImageElement from './ImageElement';
import TextEditingOverlay from './TextEditingOverlay';
import FloatingTextToolbar from './FloatingTextToolbar';
import { designSystem } from '../../styles/designSystem';

// CanvasElement and RichTextSegment are now imported from the store.
// Local PanZoomState can remain if specific, or be imported if common.
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.RefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef, // Use this passed-in ref
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  const { elements, selectedTool, selectedElementId, editingTextId, setSelectedElement, addElement, updateElement, applyTextFormat, setEditingTextId, updateElementText } = useKonvaCanvasStore();

  // State for text editing overlays - completely separate from Konva
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [editText, setEditText] = useState('');
  const [showFormatMenu, setShowFormatMenu] = useState(false);
  const [textareaPosition, setTextareaPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [menuPosition, setMenuPosition] = useState<{ x: number; y: number } | null>(null);
  const [previewFormat, setPreviewFormat] = useState<{
    bold: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
    fontSize: number;
    color: string;
    fontFamily: string;
    listType: 'none' | 'bullet' | 'numbered';
    isHyperlink: boolean;
    hyperlinkUrl: string;
  }>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    fontSize: 16,
    color: '#3b82f6', // Blue default color
    fontFamily: 'Inter, sans-serif',
    listType: 'none',
    isHyperlink: false,
    hyperlinkUrl: ''
  });
  const [appliedFormats, setAppliedFormats] = useState<Set<string>>(new Set());

  // Get elements from store
  const elementArray = Object.values(elements);

  // Performance optimization: removed excessive logging

  // Canvas initialization check
  useEffect(() => {
    console.log('🎨 KonvaCanvas initialized:', {
      width,
      height,
      selectedTool,
      storeElementsCount: Object.keys(elements).length
    });
  }, [width, height, selectedTool, elements]);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  // stageRef is now passed as a prop
  const layerRef = useRef<Konva.Layer>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  
  // Update transformer when selection changes
  useEffect(() => {
    const transformer = transformerRef.current;
    const layer = layerRef.current;
    if (!transformer || !layer) return;

    // Detach from previous nodes and remove listeners
    transformer.nodes().forEach(node => node.off('transformend'));
    transformer.nodes([]);

    if (selectedElementId) {
      const nodeToTransform = layer.findOne(`#${selectedElementId}`);

      if (nodeToTransform) {
        transformer.nodes([nodeToTransform]);

        // Add transform event handler to update element in store
        const handleTransformEnd = () => {
          const scaleX = nodeToTransform.scaleX();
          const scaleY = nodeToTransform.scaleY();
          const element = elements[selectedElementId];
          if (!element) return;

          const updates: Partial<CanvasElement> = {
            x: nodeToTransform.x(),
            y: nodeToTransform.y(),
            rotation: nodeToTransform.rotation(),
          };

          // Apply scale to dimensions based on element type
          switch (element.type) {
            case 'rectangle':
            case 'sticky-note':
              updates.width = Math.max(20, (element.width || 100) * scaleX);
              updates.height = Math.max(20, (element.height || 100) * scaleY);
              break;
            case 'circle':
              updates.radius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
              break;
            case 'star':
              updates.radius = Math.max(5, (element.radius || 50) * Math.max(scaleX, scaleY));
              updates.innerRadius = Math.max(2, (element.innerRadius || 25) * Math.max(scaleX, scaleY));
              break;
            case 'text':
            case 'rich-text':
              updates.width = Math.max(50, (element.width || 200) * scaleX);
              // Don't scale font size for text elements - just width
              break;
            case 'line':
            case 'arrow':
            case 'pen':
              if (element.points && element.points.length >= 2) {
                const scaledPoints = element.points.map((point, index) => 
                  index % 2 === 0 ? point * scaleX : point * scaleY
                );
                updates.points = scaledPoints;
              }
              break;
            case 'triangle':
              updates.width = Math.max(50, (element.width || 100) * scaleX);
              updates.height = Math.max(50, (element.height || 60) * scaleY);
              break;
            case 'image':
              updates.width = Math.max(20, (element.width || 100) * scaleX);
              updates.height = Math.max(20, (element.height || 100) * scaleY);
              break;
          }

          // Reset scale after applying to dimensions
          nodeToTransform.scaleX(1);
          nodeToTransform.scaleY(1);

          updateElement(selectedElementId, updates);
        };

        nodeToTransform.on('transformend', handleTransformEnd);
      }
    }
    layer.batchDraw();
  }, [selectedElementId, editingTextId, elements, updateElement]);
  
  // Add virtualization for large numbers of elements
  const MAX_VISIBLE_ELEMENTS = 1000;

  // Handler for starting text editing from UnifiedTextElement
  const handleStartTextEdit = useCallback((elementId: string) => {
    console.log('🐛 [DEBUG] KonvaCanvas handleStartTextEdit called for element:', elementId);
    
    const element = elements[elementId];
    if (!element) return;

    // Fix 3: Simplified and improved viewport boundary detection logic
    const calculateMenuPosition = (elementX: number, elementY: number, elementWidth: number, elementHeight: number) => {
      const menuHeight = 400;
      const menuWidth = Math.max(320, Math.min(elementWidth, 400));
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const margin = 20;
      
      // Simple, reliable boundary detection
      let menuX = elementX + elementWidth + margin; // Try right side first
      let menuY = elementY;
      
      // Check horizontal bounds - if doesn't fit on right, try left
      if (menuX + menuWidth > viewportWidth - margin) {
        menuX = elementX - menuWidth - margin; // Try left side
        if (menuX < margin) {
          // If doesn't fit on left either, center it
          menuX = Math.max(margin, (viewportWidth - menuWidth) / 2);
        }
      }
      
      // Check vertical bounds - ensure menu fits within viewport
      if (menuY + menuHeight > viewportHeight - margin) {
        menuY = Math.max(margin, viewportHeight - menuHeight - margin);
      }
      
      // Final bounds check to ensure menu never goes outside viewport
      menuX = Math.max(margin, Math.min(menuX, viewportWidth - menuWidth - margin));
      menuY = Math.max(margin, Math.min(menuY, viewportHeight - menuHeight - margin));
      
      return { x: menuX, y: menuY };
    };
    
    if (element.type === 'text' || element.type === 'sticky-note') {
      console.log('🐛 [DEBUG] KonvaCanvas - Setting up editing state for text/sticky-note element');
      
      setEditingElement(element);
      setEditText(element.text || '');
      setShowFormatMenu(true);
      
      // Initialize preview format from element
      setPreviewFormat({
        bold: element.fontStyle?.includes('bold') || false,
        italic: element.fontStyle?.includes('italic') || false,
        underline: element.textDecoration?.includes('underline') || false,
        strikethrough: element.textDecoration?.includes('line-through') || false,
        fontSize: element.fontSize || 16,
        color: element.fill || element.textColor || '#3b82f6',
        fontFamily: element.fontFamily || 'Inter, sans-serif',
        listType: (element.listType as 'none' | 'bullet' | 'numbered') || 'none' as const,
        isHyperlink: element.isHyperlink || false,
        hyperlinkUrl: element.hyperlinkUrl || ''
      });
      
      // Calculate positions for overlay with enhanced positioning logic
      if (stageRef.current) {
        console.log('🔍 [POSITION DEBUG] Starting position calculation for element:', element.id);
        
        const stage = stageRef.current;
        const container = stage.container();
        const containerRect = container.getBoundingClientRect();
        
        // Debug stage and container data
        console.log('🔍 [POSITION DEBUG] Stage data:', {
          stageRef: !!stageRef.current,
          stageWidth: stage.width(),
          stageHeight: stage.height(),
          stagePosition: { x: stage.x(), y: stage.y() },
          stageScale: { x: stage.scaleX(), y: stage.scaleY() }
        });
        
        console.log('🔍 [POSITION DEBUG] Container data:', {
          containerRect: {
            left: containerRect.left,
            top: containerRect.top,
            width: containerRect.width,
            height: containerRect.height,
            right: containerRect.right,
            bottom: containerRect.bottom
          },
          containerElement: container.tagName,
          containerClasses: container.className
        });
        
        console.log('🔍 [POSITION DEBUG] Element data:', {
          id: element.id,
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          text: element.text?.substring(0, 50) + '...'
        });
        
        // Enhanced position calculation using proper stage-to-screen coordinate conversion
        const stageScale = stage.scaleX();
        const stageTransform = stage.getAbsoluteTransform();
        
        console.log('🔍 [POSITION DEBUG] Stage transform data:', {
          stageScale,
          stageTransformMatrix: [
            stageTransform.m[0], stageTransform.m[1], stageTransform.m[2],
            stageTransform.m[3], stageTransform.m[4], stageTransform.m[5]
          ],
          panZoomState
        });
        
        // Use proper stage-to-screen coordinate conversion
        // This accounts for the full transform matrix including position and scale
        const elementCanvasPoint = { x: element.x, y: element.y };
        const elementScreenPoint = stageTransform.point(elementCanvasPoint);
        
        console.log('🔍 [POSITION DEBUG] Proper coordinate conversion:', {
          elementCanvasPos: elementCanvasPoint,
          stagePosition: { x: stage.x(), y: stage.y() },
          elementScreenPoint,
          transformation: 'Using stage.getAbsoluteTransform().point() method'
        });
        
        // Calculate textarea position - position exactly where text element appears
        const textareaX = containerRect.left + elementScreenPoint.x;
        const textareaY = containerRect.top + elementScreenPoint.y;
        const textareaWidth = Math.max(200, (element.width || 200) * stageScale);
        const textareaHeight = Math.max(100, (element.height || 100) * stageScale);
        
        console.log('🔍 [POSITION DEBUG] Textarea position calculation:', {
          textareaX: `${containerRect.left} + ${elementScreenPoint.x} = ${textareaX}`,
          textareaY: `${containerRect.top} + ${elementScreenPoint.y} = ${textareaY}`,
          textareaWidth: `max(200, ${element.width} * ${stageScale}) = ${textareaWidth}`,
          textareaHeight: `max(100, ${element.height} * ${stageScale}) = ${textareaHeight}`,
          finalTextareaPos: { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight }
        });
        
        const menuPosition = calculateMenuPosition(textareaX, textareaY, textareaWidth, textareaHeight);
        const menuX = menuPosition.x;
        const menuY = menuPosition.y;
        
        console.log('🔍 [POSITION DEBUG] === FINAL POSITION SUMMARY ===');
        console.log('🔍 [POSITION DEBUG] Element:', element.id, 'at canvas pos:', { x: element.x, y: element.y });
        console.log('🔍 [POSITION DEBUG] Container rect:', containerRect);
        console.log('🔍 [POSITION DEBUG] Stage scale:', stageScale);
        console.log('🔍 [POSITION DEBUG] Element screen pos:', elementScreenPoint);
        console.log('🔍 [POSITION DEBUG] Final textarea pos:', { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight });
        console.log('🔍 [POSITION DEBUG] Final menu pos:', { x: menuX, y: menuY });
        console.log('🔍 [POSITION DEBUG] Viewport size:', { width: window.innerWidth, height: window.innerHeight });
        console.log('🔍 [POSITION DEBUG] === END POSITION SUMMARY ===');
        
        const finalTextareaPos = { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight };
        const finalMenuPos = { x: menuX, y: menuY };
        
        console.log('🔍 [POSITION DEBUG] Setting state with calculated positions:', {
          textareaPosition: finalTextareaPos,
          menuPosition: finalMenuPos
        });
        
        setTextareaPosition(finalTextareaPos);
        setMenuPosition(finalMenuPos);
        
        console.log('🔍 [POSITION DEBUG] State setters called - positions should now be available to TextEditingOverlay');
      }
    } else if (element.type === 'rich-text') {
      // Handle rich-text elements (existing logic)
      console.log('🐛 [DEBUG] KonvaCanvas - Rich text element found, setting up editing state');
      
      setEditingTextId(elementId);
      setEditingElement(element);
      setEditText(element.text || '');
      setShowFormatMenu(true);
      
      // Calculate positions for overlay with enhanced positioning logic
      if (stageRef.current) {
        const stage = stageRef.current;
        const container = stage.container();
        const containerRect = container.getBoundingClientRect();
        
        // Enhanced position calculation using proper stage-to-screen coordinate conversion
        const stageScale = stage.scaleX();
        const stageTransform = stage.getAbsoluteTransform();
        
        // Use proper stage-to-screen coordinate conversion for rich-text
        const elementCanvasPoint = { x: element.x, y: element.y };
        const elementScreenPoint = stageTransform.point(elementCanvasPoint);
        
        console.log('🔍 [POSITION DEBUG] Rich-text proper coordinate conversion:', {
          elementCanvasPos: elementCanvasPoint,
          stagePosition: { x: stage.x(), y: stage.y() },
          elementScreenPoint,
          transformation: 'Using stage.getAbsoluteTransform().point() method'
        });
        
        // Calculate textarea position - position exactly where text element appears
        const textareaX = containerRect.left + elementScreenPoint.x;
        const textareaY = containerRect.top + elementScreenPoint.y;
        const textareaWidth = Math.max(200, (element.width || 200) * stageScale);
        const textareaHeight = Math.max(100, (element.height || 100) * stageScale);
        
        // Fix 3: Use same simplified menu positioning logic for rich-text
        const menuPosition = calculateMenuPosition(textareaX, textareaY, textareaWidth, textareaHeight);
        const menuX = menuPosition.x;
        const menuY = menuPosition.y;
        
        console.log('🐛 [DEBUG] Enhanced rich-text position calculation:', {
          containerRect: { left: containerRect.left, top: containerRect.top },
          elementPos: { x: element.x, y: element.y },
          stageScale,
          elementScreenPoint,
          textareaPos: { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight },
          menuPosition: { x: menuX, y: menuY },
          viewport: { width: window.innerWidth, height: window.innerHeight }
        });
        
        const finalTextareaPos = { x: textareaX, y: textareaY, width: textareaWidth, height: textareaHeight };
        const finalMenuPos = { x: menuX, y: menuY };
        
        console.log('🔍 [POSITION DEBUG] Setting rich-text state with calculated positions:', {
          textareaPosition: finalTextareaPos,
          menuPosition: finalMenuPos
        });
        
        setTextareaPosition(finalTextareaPos);
        setMenuPosition(finalMenuPos);
        
        console.log('🔍 [POSITION DEBUG] Rich-text state setters called - positions should now be available to TextEditingOverlay');
      }
    }
  }, [elements, setEditingTextId, stageRef]);

  const handleTextUpdate = useCallback((elementId: string, newText: string) => {
    updateElementText(elementId, newText);
  }, [updateElementText]);

  const handleEditingCancel = useCallback(() => {
    setEditingTextId(null);
    setEditingElement(null);
    setEditText('');
    setShowFormatMenu(false);
    setTextareaPosition(null);
    setMenuPosition(null);
    setAppliedFormats(new Set());
  }, [setEditingTextId]);

  const handleEditingDone = useCallback(() => {
    console.log('🔍 [SAVE DEBUG] handleEditingDone called with:', {
      editingElement: editingElement?.id,
      editText,
      previewFormat
    });
    
    if (editingElement) {
      if (editingElement.type === 'text' || editingElement.type === 'sticky-note') {
        // Build the font style string
        let fontStyle = 'normal';
        if (previewFormat.bold && previewFormat.italic) {
          fontStyle = 'bold italic';
        } else if (previewFormat.bold) {
          fontStyle = 'bold';
        } else if (previewFormat.italic) {
          fontStyle = 'italic';
        }
        
        // Build the text decoration string
        const decorations = [];
        if (previewFormat.underline) decorations.push('underline');
        if (previewFormat.strikethrough) decorations.push('line-through');
        const textDecoration = decorations.length > 0 ? decorations.join(' ') : 'none';
        
        // Ensure we save all formatting changes
        const updateData = {
          text: editText,
          fontSize: previewFormat.fontSize,
          fontFamily: previewFormat.fontFamily,
          [editingElement.type === 'sticky-note' ? 'textColor' : 'fill']: previewFormat.color,
          fontStyle,
          textDecoration,
          listType: previewFormat.listType,
          isHyperlink: previewFormat.isHyperlink,
          hyperlinkUrl: previewFormat.hyperlinkUrl
        };
        
        console.log('🔍 [SAVE DEBUG] Applying formatting to element:', {
          elementId: editingElement.id,
          elementType: editingElement.type,
          updateData,
          currentElementState: editingElement
        });
        
        updateElement(editingElement.id, updateData);
        
        console.log('🔍 [SAVE DEBUG] updateElement called successfully');
      } else {
        // For rich-text and other elements
        updateElement(editingElement.id, { text: editText });
      }
    }
    
    // Clear editing state
    handleEditingCancel();
  }, [editingElement, editText, previewFormat, updateElement, handleEditingCancel]);

  const handleFormattingChange = useCallback((formatType: string, value?: any) => {
    setPreviewFormat(prev => {
      const newFormat = { ...prev };
      
      switch (formatType) {
        case 'bold':
          newFormat.bold = !prev.bold;
          break;
        case 'italic':
          newFormat.italic = !prev.italic;
          break;
        case 'underline':
          newFormat.underline = !prev.underline;
          break;
        case 'strikethrough':
          newFormat.strikethrough = !prev.strikethrough;
          break;
        case 'fontSize':
          newFormat.fontSize = parseInt(value) || 16;
          break;
        case 'color':
          newFormat.color = value || '#000000';
          break;
        case 'fontFamily':
          newFormat.fontFamily = value || 'Inter, sans-serif';
          break;
        case 'listType':
          newFormat.listType = value || 'none';
          break;
        case 'isHyperlink':
          newFormat.isHyperlink = !prev.isHyperlink;
          if (!newFormat.isHyperlink) {
            newFormat.hyperlinkUrl = '';
          }
          break;
        case 'hyperlinkUrl':
          newFormat.hyperlinkUrl = value || '';
          if (value) {
            newFormat.isHyperlink = true;
          }
          break;
      }
      
      return newFormat;
    });
  }, []);

  const handleFormatChange = useCallback((elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => {
    applyTextFormat(elementId, format, selection);
  }, [applyTextFormat]);

  const visibleElements = useMemo(() => {
    if (elementArray.length <= MAX_VISIBLE_ELEMENTS) {
      return elementArray;
    }
    
    // Implement viewport culling for better performance
    const viewportBounds = {
      x: -panZoomState.position.x / panZoomState.scale,
      y: -panZoomState.position.y / panZoomState.scale,
      width: (stageRef.current?.width() || window.innerWidth) / panZoomState.scale,
      height: (stageRef.current?.height() || window.innerHeight) / panZoomState.scale
    };
    
    return elementArray.filter(element => {
      // Always include selected elements and text elements being edited
      if (element.id === selectedElementId || 
          (editingTextId === element.id && (element.type === 'text' || element.type === 'sticky-note'))) {
        return true;
      }
      
      // Check if element intersects with viewport
      const elementBounds = {
        x: element.x,
        y: element.y,
        width: element.width || 100,
        height: element.height || 100
      };
      
      return !(elementBounds.x + elementBounds.width < viewportBounds.x ||
               elementBounds.x > viewportBounds.x + viewportBounds.width ||
               elementBounds.y + elementBounds.height < viewportBounds.y ||
               elementBounds.y > viewportBounds.y + viewportBounds.height);
    }).slice(0, MAX_VISIBLE_ELEMENTS);
  }, [elementArray, panZoomState, selectedElementId, editingTextId]);

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🎯 Mouse down - tool:', selectedTool, 'target:', e.target.getClassName());
    
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      if (!stage) return;

      // Get relative position accounting for stage transforms
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      setCurrentPath([pos.x, pos.y]);
    }
  }, [selectedTool]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawing || selectedTool !== 'pen') return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Get relative position accounting for stage transforms
    const point = stage.getRelativePointerPosition();
    if (!point) return;
    setCurrentPath(prev => [...prev, point.x, point.y]);
  }, [isDrawing, selectedTool]);

  const handleMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    // Pen tool is special, it draws on mouse move and finalizes on mouse up.
    if (selectedTool === 'pen') {
      if (isDrawing && currentPath.length > 2) { // Ensure there's something to draw
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          id: generateId(),
          type: 'pen',
          x: 0, // Pen drawings are positioned by their points array, not a single x/y
          y: 0,
          points: currentPath,
          stroke: designSystem.colors.secondary[800],
          strokeWidth: 3,
          fill: 'transparent',
        };
        addElement(newElement);
      }
      setCurrentPath([]);
      setIsDrawing(false);
      return;
    }

    // For other tools, we create the element on mouse up (a "click" action).
    // We check isDrawing to ensure this only happens after a mouseDown on the canvas.
    // DISABLED: Elements are now created immediately from toolbar, not on canvas clicks
    /*
    if (isDrawing) {
      const stage = e.target.getStage();
      if (!stage) {
        setIsDrawing(false);
        return;
      }

      const pointer = stage.getPointerPosition();
      if (!pointer) {
        setIsDrawing(false);
        return;
      }

      // This is the crucial part: get pointer position relative to the stage's transform
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);

      const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const elementId = generateId();
      let newElement: CanvasElement | null = null;

      switch (selectedTool) {
        case 'rectangle':
          newElement = { id: elementId, type: 'rectangle', x: pos.x - 75, y: pos.y - 50, width: 150, height: 100, fill: designSystem.colors.primary[200] };
          break;
        case 'circle':
          newElement = { id: elementId, type: 'circle', x: pos.x, y: pos.y, radius: 60, fill: designSystem.colors.success[500] };
          break;
        case 'star':
          newElement = { id: elementId, type: 'star', x: pos.x, y: pos.y, numPoints: 5, innerRadius: 30, outerRadius: 70, fill: designSystem.colors.warning[500] };
          break;
        case 'line':
          // A simple horizontal line
          newElement = { id: elementId, type: 'line', x: pos.x - 75, y: pos.y, points: [0, 0, 150, 0], stroke: designSystem.colors.secondary[800], strokeWidth: 4 };
          break;
        case 'text':
          newElement = { id: elementId, type: 'text', x: pos.x, y: pos.y, text: 'Double-click to edit', fontSize: 24, fontFamily: designSystem.typography.fontFamily.sans, fill: designSystem.colors.secondary[900], width: 250 };
          break;
        case 'rich-text':
          newElement = { id: elementId, type: 'rich-text', x: pos.x, y: pos.y, segments: [{ text: 'Formatted text', fill: designSystem.colors.primary[500], fontSize: 24, fontFamily: designSystem.typography.fontFamily.sans }], width: 200 };
          break;
      }

      if (newElement) {
        addElement(newElement);
        setSelectedElement(elementId); // Select the new element for immediate interaction
      }
    }
    */
    
    setIsDrawing(false);
  }, [isDrawing, selectedTool, currentPath, addElement, setSelectedElement]);

  // Canvas click handler - ONLY handles selection/deselection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      console.log('🎯 Ignoring stage click - part of double-click sequence');
      return;
    }

    const stage = e.target.getStage();
    
    console.log('🎯 Stage click - target:', e.target.getClassName(), 'targetId:', e.target.id());

    // Check if clicked on empty space
    const clickedOnEmpty = e.target === stage;
    
    console.log('🎯 Clicked on empty space?', clickedOnEmpty);

    if (clickedOnEmpty) {
      // ONLY deselect on empty clicks - NEVER create elements here
      console.log('🎯 Empty space clicked - deselecting all');
      setSelectedElement(null);
      
      // Clear transformer
      if (transformerRef.current) {
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    // If we get here, user clicked on an existing element - let element handler deal with it
    console.log('🎯 Clicked on existing element');
  }, [setSelectedElement]);

  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      return;
    }

    e.cancelBubble = true;
    e.evt?.stopPropagation();
    setSelectedElement(element.id);
    onElementSelect?.(element);
  }, [onElementSelect, setSelectedElement]);



  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    const newX = e.target.x();
    const newY = e.target.y();
    
    updateElement(elementId, { x: newX, y: newY });
  }, [updateElement]);

  // Removed duplicate handleTransformEnd - now handled in useEffect above


  
  // Render individual canvas elements based on their type
  const renderElement = useCallback((element: CanvasElement): React.ReactNode => {
    console.log('🎨 Rendering element:', element.type, element.id, element);
    
    const isSelected = element.id === selectedElementId;
    const isEditing = editingTextId === element.id;
    const isDraggable = !isEditing && selectedTool === 'select';

    // DIAGNOSTIC: Log draggable state decisions
    console.log('🔍 [DRAG DEBUG]', {
      elementId: element.id,
      elementType: element.type,
      isSelected,
      isEditing,
      selectedTool,
      isDraggable,
      dragConditions: {
        notEditing: !isEditing,
        toolIsSelect: selectedTool === 'select',
        bothTrue: !isEditing && selectedTool === 'select'
      }
    });

    // Common props for Konva shapes, passed to UnifiedTextElement or RichTextRenderer as well
    const konvaElementProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      draggable: isDraggable, // Draggable only with select tool
      onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(e, element),
      onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, element.id),
      opacity: 1, // Keep elements fully visible even when editing
      stroke: isSelected ? designSystem.colors.primary[500] : element.stroke,
      strokeWidth: isSelected ? (element.strokeWidth || 1) + 1.5 : element.strokeWidth,
      shadowColor: isSelected ? designSystem.colors.primary[300] : undefined,
      shadowBlur: isSelected ? 10 : 0,
      shadowOpacity: isSelected ? 0.7 : 0,
      perfectDrawEnabled: false, // Improves performance for many shapes
    };

    switch (element.type) {
      case 'rectangle':
        return (
          <Rect
            key={element.id}
            {...konvaElementProps}
            width={element.width}
            height={element.height}
            fill={element.fill || designSystem.colors.primary[100]}
            cornerRadius={designSystem.borderRadius.md}
          />
        );
      case 'circle':
        return (
          <Circle
            key={element.id}
            {...konvaElementProps}
            radius={element.radius}
            fill={element.fill || designSystem.colors.secondary[100]}
          />
        );
      case 'text':
        return (
          <UnifiedTextElement
            key={element.id}
            element={{
              ...element,
              type: 'text',
              text: element.text || ''
            }}
            isSelected={isSelected}
            isEditing={editingElement?.id === element.id} // Pass editing state to hide original text
            onUpdate={updateElement}
            onSelect={setSelectedElement}
            onStartEdit={handleStartTextEdit}
            konvaProps={{
              id: element.id,
              draggable: true, // Always draggable
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(e, element),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, element.id)
            }}
          />
        );
      case 'sticky-note':
        return (
          <UnifiedTextElement
            key={element.id}
            element={{
              ...element,
              type: 'sticky-note',
              text: element.text || ''
            }}
            isSelected={isSelected}
            isEditing={editingElement?.id === element.id} // Pass editing state to hide original text
            onUpdate={updateElement}
            onSelect={setSelectedElement}
            onStartEdit={handleStartTextEdit}
            konvaProps={{
              id: element.id,
              draggable: true, // Always draggable
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(e, element),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, element.id)
            }}
          />
        );
      case 'rich-text':
        return (
          <RichTextRenderer
            key={element.id}
            element={element as RichTextElementType}
            {...konvaElementProps}
            onFormatChange={handleFormatChange}
            onDblClick={(e: any) => {
              e.cancelBubble = true;
              e.evt?.stopPropagation();
              handleStartTextEdit(element.id);
            }}
            isEditing={editingTextId === element.id}
            onTextUpdate={handleTextUpdate}
            onEditingCancel={handleEditingCancel}
          />
        );
      case 'arrow':
        return (
          <Arrow
            key={element.id}
            {...konvaElementProps}
            points={element.points || [0, 0, 100, 0]}
            stroke={element.stroke || '#6b7280'}
            strokeWidth={element.strokeWidth || 2}
            fill={element.fill || element.stroke || '#6b7280'} // Fill is for the arrowhead
            pointerLength={10}
            pointerWidth={8}
            lineCap="round"
            lineJoin="round"
            rotation={element.rotation || 0}
          />
        );
      case 'line':
      case 'pen':
        return (
          <Line
            key={element.id}
            {...konvaElementProps}
            points={element.points}
            stroke={element.stroke || (element.type === 'pen' ? designSystem.colors.secondary[800] : designSystem.canvasStyles.border)}
            strokeWidth={element.strokeWidth || (element.type === 'pen' ? 3 : 2)}
            lineCap="round"
            lineJoin="round"
            tension={element.type === 'pen' ? 0.5 : 0}
            rotation={element.rotation || 0}
          />
        );
      case 'star':
        return (
          <Star
            key={element.id}
            {...konvaElementProps}
            numPoints={element.sides || 5}
            innerRadius={element.innerRadius || (element.width || 100) / 4}
            outerRadius={element.radius || (element.width || 100) / 2}
            fill={element.fill || designSystem.colors.warning[500]}
            stroke={element.stroke || designSystem.colors.warning[600]}
            strokeWidth={element.strokeWidth || 2}
          />
        );
      case 'triangle':
        return (
          <Line 
            key={element.id}
            {...konvaElementProps}
            points={[
              0, -(element.height || 60) / 2, 
              (element.width || 100) / 2, (element.height || 60) / 2, 
              -(element.width || 100) / 2, (element.height || 60) / 2, 
            ]}
            closed
            fill={element.fill || designSystem.colors.success[500]}
            stroke={element.stroke || designSystem.colors.success[500]} // Assuming success[500] for both fill and stroke if not specified
            strokeWidth={element.strokeWidth || 2}
          />
        );
      case 'image':
        return (
          <ImageElement
            key={element.id}
            element={element}
            konvaProps={konvaElementProps}
          />
        );
      default:
        console.warn('Unhandled element type in renderElement:', element.type);
        return null;
    }
  }, [selectedElementId, editingTextId, selectedTool, applyTextFormat, designSystem, setSelectedElement, updateElement, onElementSelect, handleFormatChange, handleStartTextEdit, handleTextUpdate, handleEditingCancel]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !editingTextId) {
          const { deleteElement } = useKonvaCanvasStore.getState();
          deleteElement(selectedElementId);
          setSelectedElement(null);
        }
      } else if (e.key === 'Escape') {
        setSelectedElement(null);
        if (editingTextId) {
          // Call the store action to cancel editing
          setEditingTextId(null); 
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, editingTextId, setSelectedElement, setEditingTextId]);

  return (
    <div 
      className="konva-canvas-container"
      style={{
        border: `2px solid ${designSystem.colors.secondary[200]}`,
        borderRadius: `${designSystem.borderRadius.lg}px`,
        boxShadow: designSystem.shadows.lg,
        background: designSystem.canvasStyles.background,
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Canvas ready indicator */}
      {elementArray.length === 0 && (
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '20px',
          background: 'rgba(59, 130, 246, 0.1)',
          padding: '8px 12px',
          borderRadius: '6px',
          fontSize: '14px',
          color: '#3B82F6',
          fontFamily: designSystem.typography.fontFamily.sans,
          zIndex: 10,
          pointerEvents: 'none'
        }}>
          🎨 Canvas ready! Select a tool from the toolbar to create elements
        </div>
      )}
        <Stage
        ref={stageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleStageClick}
        onWheel={onWheelHandler}
        onTouchMove={onTouchMoveHandler}
        onTouchEnd={onTouchEndHandler}
        draggable={selectedTool === 'pan'}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
        style={{ 
          display: 'block',
          backgroundColor: designSystem.canvasStyles.background,
          cursor: selectedTool === 'pan' ? 'grab' : 'default'
        }}
      ><Layer ref={layerRef}>{visibleElements.map(element => renderElement(element))}{isDrawing && currentPath.length > 0 && (
            <Line
              points={currentPath}
              stroke="#000000"
              strokeWidth={2}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
            />
          )}<Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={selectedElementId && elements[selectedElementId] && 
              elements[selectedElementId].type === 'text'
              ? ['middle-left', 'middle-right'] // Only horizontal resize for text
              : ['top-left', 'top-center', 'top-right',
                 'middle-left', 'middle-right',
                 'bottom-left', 'bottom-center', 'bottom-right']
            }
            borderStroke="#2196F3"
            borderStrokeWidth={3}
            borderDash={[8, 4]}
            anchorFill="#FFFFFF"
            anchorStroke="#2196F3"
            anchorStrokeWidth={3}
            anchorSize={12}
            anchorCornerRadius={6}
            rotationAnchorOffset={30}
            rotationSnapTolerance={5}
            // Enhanced visual feedback
            padding={5}
            // Add shadow effect for better visibility
            shadowColor="rgba(33, 150, 243, 0.3)"
            shadowBlur={8}
            shadowOffset={{ x: 0, y: 2 }}
          /></Layer></Stage>

      {/* Text editing overlay - completely outside Konva */}
      {editingElement && textareaPosition && (
        <TextEditingOverlay
          isEditing={true}
          element={{
            id: editingElement.id,
            x: editingElement.x,
            y: editingElement.y,
            text: editingElement.text || '',
            width: editingElement.width,
            height: editingElement.height,
            fontSize: editingElement.fontSize,
            fontFamily: editingElement.fontFamily,
            fill: editingElement.fill,
            type: 'text', // Rich text treated as text for overlay purposes
            backgroundColor: editingElement.backgroundColor,
            textColor: editingElement.textColor
          }}
          editText={editText}
          onEditTextChange={(newText) => {
            console.log('🔍 [STATE DEBUG] KonvaCanvas setEditText called:', {
              currentEditText: editText,
              newText,
              editingElement: editingElement?.id,
              textareaPosition,
              menuPosition
            });
            setEditText(newText);
          }}
          showFormatMenu={false} // Disable old format menu
          textareaPosition={textareaPosition}
          menuPosition={menuPosition}
          previewFormat={previewFormat}
          appliedFormats={appliedFormats}
          onFormatting={handleFormattingChange}
          onCancel={handleEditingCancel}
          onDone={handleEditingDone}
          stageRef={stageRef}
        />
      )}

      {/* New Floating Text Toolbar */}
      {editingElement && (
        <FloatingTextToolbar
          element={{
            id: editingElement.id,
            x: editingElement.x,
            y: editingElement.y,
            width: editingElement.width,
            height: editingElement.height
          }}
          isVisible={showFormatMenu}
          format={previewFormat}
          onFormatChange={handleFormattingChange}
          onDone={handleEditingDone}
          onCancel={handleEditingCancel}
          stageRef={stageRef}
        />
      )}
    </div>
  );
};

export default KonvaCanvas;

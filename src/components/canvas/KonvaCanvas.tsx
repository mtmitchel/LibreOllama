// src/components/canvas/KonvaCanvas.tsx
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage, Layer, Transformer, Rect, Circle, Line, Star, Arrow } from 'react-konva';
import Konva from 'konva';
import { useKonvaCanvasStore, CanvasElement, RichTextSegment } from '../../stores/konvaCanvasStore';
import RichTextRenderer, { RichTextElementType } from './RichTextRenderer';
import UnifiedTextElement from './UnifiedTextElement';
import ImageElement from './ImageElement';
import ConnectorRenderer from './ConnectorRenderer';
import TextEditingOverlay from './TextEditingOverlay';
import { RichTextCellEditor } from './RichTextCellEditor';
import SectionElement from './SectionElement';
import StickyNoteElement from './StickyNoteElement';
import { EnhancedTableElement } from '../canvas/EnhancedTableElement'; // Using enhanced table implementation
import { designSystem } from '../../styles/designSystem';
import '../../styles/konvaCanvas.css';
import '../../styles/canvas-enhancements.css';
import '../../styles/canvas-sections-enhanced.css';
import '../../styles/canvas-transform-enhanced.css';
import '../../styles/text-editing-enhanced.css';
import { SectionElement as SectionType, isElementInSection } from '../../types/section';

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
  const { elements, sections, selectedTool, selectedElementId, editingTextId, setSelectedElement, addElement, updateElement, applyTextFormat, setEditingTextId, updateElementText, setSelectedTool, createSection, updateSection, addElementToSection, removeElementFromSection, handleSectionDragEnd } = useKonvaCanvasStore();

  // State for text editing overlays - completely separate from Konva
  const [editingElement, setEditingElement] = useState<CanvasElement | null>(null);
  const [editText, setEditText] = useState('');
  const [textareaPosition, setTextareaPosition] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Unified rich text editing data for ALL text editing (text, sticky notes, AND table cells)
  const [richTextEditingData, setRichTextEditingData] = useState<{
    isEditing: boolean;
    cellPosition: { x: number; y: number; width: number; height: number };
    cellText: string;
    richTextSegments: RichTextSegment[];
    fontSize?: number;
    fontFamily?: string;
    textColor?: string;
    textAlign?: 'left' | 'center' | 'right';
    onTextChange: (text: string) => void;
    onRichTextChange?: (segments: RichTextSegment[]) => void;
    onFinishEditing: (finalSegments: RichTextSegment[]) => void;
    onCancelEditing: () => void;
    elementId?: string;
    elementType?: 'text' | 'sticky-note' | 'table-cell';
  } | null>(null);

  // Debug effect to monitor rich text editing data changes
  useEffect(() => {
    console.log('🎯 [RICH TEXT EDITING DEBUG] === RICH TEXT EDITING DATA CHANGE ===');
    console.log('🎯 [RICH TEXT EDITING DEBUG] Rich text editing data updated:', richTextEditingData);
    if (richTextEditingData) {
      console.log('🎯 [RICH TEXT EDITING DEBUG] Editing details:', {
        isEditing: richTextEditingData.isEditing,
        cellPosition: richTextEditingData.cellPosition,
        cellText: richTextEditingData.cellText,
        elementId: richTextEditingData.elementId,
        elementType: richTextEditingData.elementType,
        hasOnTextChange: !!richTextEditingData.onTextChange,
        hasOnFinishEditing: !!richTextEditingData.onFinishEditing,
        hasOnCancelEditing: !!richTextEditingData.onCancelEditing
      });
    } else {
      console.log('🎯 [RICH TEXT EDITING DEBUG] Rich text editing data is null');
    }
  }, [richTextEditingData]);

  const [previewFormat] = useState<{
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
    textAlign: 'left' | 'center' | 'right';
    textStyle: 'default' | 'heading' | 'subheading';
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
    hyperlinkUrl: '',
    textAlign: 'left',
    textStyle: 'default'
  });
  
  // Connector drawing state
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart, setConnectorStart] = useState<{x: number; y: number; elementId?: string; anchor?: string} | null>(null);
  const [connectorEnd, setConnectorEnd] = useState<{x: number; y: number; elementId?: string; anchor?: string} | null>(null);
  
  // Section drawing state
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [sectionStart, setSectionStart] = useState<{x: number; y: number} | null>(null);
  const [previewSection, setPreviewSection] = useState<{x: number; y: number; width: number; height: number} | null>(null);

  // Get elements and sections from store separately
  const elementArray = Object.values(elements);
  const sectionsArray = Object.values(sections);

  // Performance optimization: removed excessive logging

  // Canvas initialization check removed to reduce console noise

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
      const element = elements[selectedElementId];
      const section = sections[selectedElementId];
      
      // Check if element is locked
      const isLocked = (element && (element as any).isLocked) || (section && section.isLocked);

      if (nodeToTransform && !isLocked) {
        transformer.nodes([nodeToTransform]);

        // Add transform event handler to update element in store
        const handleTransformEnd = () => {
          const scaleX = nodeToTransform.scaleX();
          const scaleY = nodeToTransform.scaleY();
          const rotation = nodeToTransform.rotation();
          const element = elements[selectedElementId];
          const section = sections[selectedElementId];
          
          if (!element && !section) return;

          // Handle sections differently from regular elements
          if (section) {
            console.log('[SECTION RESIZE DEBUG] Section transform detected:', {
              sectionId: selectedElementId,
              oldDimensions: { width: section.width, height: section.height },
              scaleFactors: { scaleX, scaleY },
              newDimensions: {
                width: Math.max(50, section.width * scaleX),
                height: Math.max(30, section.height * scaleY)
              },
              containedElements: section.containedElementIds
            });
            
            const sectionUpdates = {
              x: nodeToTransform.x(),
              y: nodeToTransform.y(),
              width: Math.max(50, section.width * scaleX),
              height: Math.max(30, section.height * scaleY),
              rotation: rotation,
            };
            
            // Reset scale after applying to dimensions
            nodeToTransform.scaleX(1);
            nodeToTransform.scaleY(1);
            
            updateSection(selectedElementId, sectionUpdates);
            
            console.log('[SECTION RESIZE DEBUG] Scaling contained elements by factors:', scaleX, scaleY);
            section.containedElementIds.forEach(childId => {
              const child = elements[childId];
              if (!child) return;
              const scaledX = child.x * scaleX;
              const scaledY = child.y * scaleY;
              const childUpdates: Partial<typeof child> = { x: scaledX, y: scaledY };
              switch (child.type) {
                case 'rectangle':
                case 'sticky-note':
                case 'rich-text':
                case 'text':
                  if (child.width !== undefined) childUpdates.width = child.width * scaleX;
                  if (child.height !== undefined) childUpdates.height = child.height * scaleY;
                  break;
                case 'circle':
                case 'star': {
                  const factor = Math.max(scaleX, scaleY);
                  if ((child as any).radius !== undefined) (childUpdates as any).radius = (child as any).radius * factor;
                  if ((child as any).innerRadius !== undefined) (childUpdates as any).innerRadius = (child as any).innerRadius * factor;
                  break;
                }
                case 'image':
                  if (child.width !== undefined) childUpdates.width = child.width * scaleX;
                  if (child.height !== undefined) childUpdates.height = child.height * scaleY;
                  break;
              }
              updateElement(childId, childUpdates);
            });
            console.log('[SECTION RESIZE DEBUG] Contained elements scaled.');
            return;
          }

          let updates: Partial<CanvasElement>;

          // For point-based elements (pen, triangle), let Konva handle transformations naturally
          // Connectors should not be transformable as they manage their own positioning
          if ((element.type === 'pen' || element.type === 'triangle') && element.points) {
            updates = {
              x: nodeToTransform.x(),
              y: nodeToTransform.y(),
              rotation: rotation,
            };
            
            // Don't reset the node's transformation - let Konva handle it naturally

          } else {
            // Handle property-based shapes (Rect, Circle, Text, etc.)
            updates = {
              x: nodeToTransform.x(),
              y: nodeToTransform.y(),
              rotation: rotation,
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
              case 'image':
                updates.width = Math.max(20, (element.width || 100) * scaleX);
                updates.height = Math.max(20, (element.height || 100) * scaleY);
                break;
            }

            // Reset scale after applying to dimensions
            nodeToTransform.scaleX(1);
            nodeToTransform.scaleY(1);
          }

          updateElement(selectedElementId, updates);
          
          // CRITICAL FIX: If element is inside a section, ensure coordinates are properly handled
          if (element.sectionId && sections[element.sectionId] && (updates.x !== undefined || updates.y !== undefined)) {
            // Element was moved within section via transform handles
            // The updateElement call above should handle relative positioning automatically
            console.log('📍 Element transformed within section:', selectedElementId, 'in section:', element.sectionId);
          }
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

    if (element.type === 'text' || element.type === 'sticky-note') {
      console.log('🐛 [DEBUG] KonvaCanvas - Setting up rich text editing for text/sticky-note element');
      
      setEditingTextId(elementId);
      
      // Calculate positions for rich text editor
      if (stageRef.current) {
        const stage = stageRef.current;
        const container = stage.container();
        const containerRect = container.getBoundingClientRect();
        
        // Enhanced position calculation using proper stage-to-screen coordinate conversion
        const stageScale = stage.scaleX();
        const stageTransform = stage.getAbsoluteTransform();
        
        // CRITICAL FIX: For elements in sections, we need absolute coordinates
        // Check if element has a sectionId (new coordinate system)
        let elementCanvasPoint: { x: number; y: number };
        
        if (element.sectionId && sections[element.sectionId]) {
          // Element is in a section - convert relative to absolute coordinates
          const section = sections[element.sectionId];
          elementCanvasPoint = {
            x: section.x + element.x,
            y: section.y + element.y
          };
        } else {
          // Element is on main stage - use coordinates directly
          elementCanvasPoint = { x: element.x, y: element.y };
        }
        
        const elementScreenPoint = stageTransform.point(elementCanvasPoint);
        
        // Calculate editing position - position exactly where text element appears
        const editingX = containerRect.left + elementScreenPoint.x;
        const editingY = containerRect.top + elementScreenPoint.y;
        const editingWidth = Math.max(200, (element.width || 200) * stageScale);
        const editingHeight = Math.max(100, (element.height || 100) * stageScale);
        
        const editingPosition = { x: editingX, y: editingY, width: editingWidth, height: editingHeight };
        
        // Set up rich text editing data
        setRichTextEditingData({
          isEditing: true,
          cellPosition: editingPosition,
          cellText: element.text || '',
          richTextSegments: (element as any).richTextSegments || [],
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          textColor: element.textColor || element.fill,
          textAlign: element.textAlign || 'left',
          elementId: elementId,
          elementType: element.type as 'text' | 'sticky-note',
          onTextChange: (newText: string) => {
            updateElement(elementId, { text: newText });
          },
          onRichTextChange: (segments: any[]) => {
            updateElement(elementId, { ...element, richTextSegments: segments } as any);
          },
          onFinishEditing: (finalSegments: RichTextSegment[]) => {
            console.log('🎯 [RICH TEXT EDITING DEBUG] onFinishEditing called for text/sticky-note element:', elementId);
            // Update the element with the final segments
            updateElement(elementId, { ...element, richTextSegments: finalSegments } as any);
            setEditingTextId(null);
            setRichTextEditingData(null);
          },
          onCancelEditing: () => {
            console.log('🎯 [RICH TEXT EDITING DEBUG] onCancelEditing called for text/sticky-note element:', elementId);
            setEditingTextId(null);
            setRichTextEditingData(null);
          }
        });
      }
    } else if (element.type === 'rich-text') {
      // Rich-text elements should also use the unified rich text editor
      console.log('🐛 [DEBUG] KonvaCanvas - Setting up rich text editing for rich-text element');
      
      setEditingTextId(elementId);
      
      // Calculate positions for rich text editor (same logic as text/sticky-note)
      if (stageRef.current) {
        const stage = stageRef.current;
        const container = stage.container();
        const containerRect = container.getBoundingClientRect();
        
        const stageScale = stage.scaleX();
        const stageTransform = stage.getAbsoluteTransform();
        
        let elementCanvasPoint: { x: number; y: number };
        
        if (element.sectionId && sections[element.sectionId]) {
          const section = sections[element.sectionId];
          elementCanvasPoint = {
            x: section.x + element.x,
            y: section.y + element.y
          };
        } else {
          elementCanvasPoint = { x: element.x, y: element.y };
        }
        
        const elementScreenPoint = stageTransform.point(elementCanvasPoint);
        
        const editingX = containerRect.left + elementScreenPoint.x;
        const editingY = containerRect.top + elementScreenPoint.y;
        const editingWidth = Math.max(200, (element.width || 200) * stageScale);
        const editingHeight = Math.max(100, (element.height || 100) * stageScale);
        
        const editingPosition = { x: editingX, y: editingY, width: editingWidth, height: editingHeight };
        
        // Set up rich text editing data for rich-text elements
        setRichTextEditingData({
          isEditing: true,
          cellPosition: editingPosition,
          cellText: element.text || '',
          richTextSegments: (element as any).richTextSegments || [],
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          textColor: element.textColor || element.fill,
          textAlign: element.textAlign || 'left',
          elementId: elementId,
          elementType: 'text', // Treat rich-text as text for editing purposes
          onTextChange: (newText: string) => {
            updateElement(elementId, { text: newText });
          },
          onRichTextChange: (segments: any[]) => {
            updateElement(elementId, { ...element, richTextSegments: segments } as any);
          },
          onFinishEditing: (finalSegments: RichTextSegment[]) => {
            // Update the element with the final segments
            updateElement(elementId, { ...element, richTextSegments: finalSegments } as any);
            setEditingTextId(null);
            setRichTextEditingData(null);
          },
          onCancelEditing: () => {
            setEditingTextId(null);
            setRichTextEditingData(null);
          }
        });
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
    setTextareaPosition(null);
    setRichTextEditingData(null); // Clear rich text editing data
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
        
        // CRITICAL FIX: For elements inside sections, preserve their relative coordinates
        // Only update text formatting properties, never coordinates during text editing completion
        const updateData: Partial<CanvasElement> = {
          text: editText,
          fontSize: previewFormat.fontSize,
          fontFamily: previewFormat.fontFamily,
          [editingElement.type === 'sticky-note' ? 'textColor' : 'fill']: previewFormat.color,
          fontStyle,
          textDecoration,
          listType: previewFormat.listType,
          isHyperlink: previewFormat.isHyperlink,
          hyperlinkUrl: previewFormat.hyperlinkUrl,
          textAlign: previewFormat.textAlign
        };
        
        // Explicitly exclude x, y coordinates to prevent section jumping
        // Text editing should NEVER modify element position
        delete (updateData as any).x;
        delete (updateData as any).y;
        delete (updateData as any).sectionId;
        
        console.log('🔍 [SAVE DEBUG] Applying formatting to element (coordinates preserved):', {
          elementId: editingElement.id,
          elementType: editingElement.type,
          updateData,
          currentElementState: editingElement,
          elementSectionId: editingElement.sectionId
        });
        
        updateElement(editingElement.id, updateData);
        
        console.log('🔍 [SAVE DEBUG] updateElement called successfully');
      } else {
        // For rich-text and other elements - also preserve coordinates
        const updateData: Partial<CanvasElement> = { text: editText };
        delete (updateData as any).x;
        delete (updateData as any).y;
        delete (updateData as any).sectionId;
        
        updateElement(editingElement.id, updateData);
      }
    }
    
    // Clear editing state
    handleEditingCancel();
  }, [editingElement, editText, previewFormat, updateElement, handleEditingCancel]);

  const handleFormatChange = useCallback((elementId: string, format: Partial<RichTextSegment>, selection: { start: number; end: number }) => {
    applyTextFormat(elementId, format, selection);
  }, [applyTextFormat]);

  // Handler for table cell editing - this connects EnhancedTableElement to RichTextCellEditor
  const handleTableEditingStateChange = useCallback((editingData: any) => {
    console.log('🎯 [TABLE EDITING DEBUG] === TABLE EDITING STATE CHANGE ===');
    console.log('🎯 [TABLE EDITING DEBUG] Editing data received:', editingData);
    
    if (editingData && editingData.isEditing) {
      console.log('🎯 [TABLE EDITING DEBUG] Setting up rich text editing for table cell');
      
      // Convert table editing data to rich text editing format
      setRichTextEditingData({
        isEditing: true,
        cellPosition: editingData.cellPosition,
        cellText: editingData.cellText,
        richTextSegments: editingData.richTextSegments || [],
        fontSize: editingData.fontSize,
        fontFamily: editingData.fontFamily,
        textColor: editingData.textColor,
        textAlign: editingData.textAlign,
        elementType: 'table-cell', // Mark as table cell
        onTextChange: editingData.onTextChange,
        onRichTextChange: editingData.onRichTextChange,
        onFinishEditing: () => {
          console.log('🎯 [TABLE EDITING DEBUG] Table cell editing finished');
          setRichTextEditingData(null);
          editingData.onFinishEditing();
        },
        onCancelEditing: () => {
          console.log('🎯 [TABLE EDITING DEBUG] Table cell editing cancelled');
          setRichTextEditingData(null);
          editingData.onCancelEditing();
        }
      });
    } else {
      console.log('🎯 [TABLE EDITING DEBUG] Clearing table editing state');
      setRichTextEditingData(null);
    }
  }, []);

  const visibleElements = useMemo(() => {
    // Separate free elements (no sectionId) and sectioned elements
    const freeElements = elementArray.filter(element =>
      !element.sectionId && element.type !== 'section'
    );
    
    // Combine sections and free elements for top-level rendering
    const topLevelElements = [...sectionsArray, ...freeElements];
    
    if (topLevelElements.length <= MAX_VISIBLE_ELEMENTS) {
      return topLevelElements;
    }
    
    // Implement viewport culling for better performance
    const viewportBounds = {
      x: -panZoomState.position.x / panZoomState.scale,
      y: -panZoomState.position.y / panZoomState.scale,
      width: (stageRef.current?.width() || window.innerWidth) / panZoomState.scale,
      height: (stageRef.current?.height() || window.innerHeight) / panZoomState.scale
    };
    
    return topLevelElements.filter(element => {
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
  }, [elementArray, sectionsArray, panZoomState, selectedElementId, editingTextId]);

  // Helper function to validate connector coordinates
  const validateConnectorCoordinates = (start: any, end: any) => {
    const isValidPoint = (point: any) => {
      return point && typeof point.x === 'number' && typeof point.y === 'number' && 
             !isNaN(point.x) && !isNaN(point.y);
    };
    
    if (!isValidPoint(start) || !isValidPoint(end)) {
      console.error('❌ Invalid connector coordinates:', { start, end });
      return false;
    }
    
    // Check for (0,0) fallback which might indicate coordinate system issues
    if ((start.x === 0 && start.y === 0) || (end.x === 0 && end.y === 0)) {
      console.warn('⚠️ Connector using (0,0) coordinates - possible coordinate system issue:', { start, end });
    }
    
    return true;
  };

  // Helper function to find nearest element for connector snapping
  const findNearestElement = useCallback((x: number, y: number) => {
    const SNAP_DISTANCE = 20;
    const elementsArray = Object.values(elements);
    
    for (const element of elementsArray) {
      if (element.type === 'connector') continue; // Don't snap to other connectors
      
      // Calculate potential anchor points
      const anchors = ['center', 'top', 'bottom', 'left', 'right', 'corner-tl', 'corner-tr', 'corner-bl', 'corner-br'];
      
      for (const anchor of anchors) {
        const anchorPoint = getAnchorPoint(element, anchor as any);
        const distance = Math.sqrt(
          Math.pow(x - anchorPoint.x, 2) + Math.pow(y - anchorPoint.y, 2)
        );
        
        if (distance <= SNAP_DISTANCE) {
          return { element, anchor, point: anchorPoint };
        }
      }
    }
    
    return null;
  }, [elements, sections]);

  // Helper function to get anchor point coordinates
  const getAnchorPoint = (element: CanvasElement, anchor: string) => {
    // Get element coordinates - convert to absolute if in a section
    let elementX = element.x;
    let elementY = element.y;
    
    if (element.sectionId && sections[element.sectionId]) {
      const section = sections[element.sectionId];
      elementX = section.x + element.x;
      elementY = section.y + element.y;
    }
    
    const { width = 0, height = 0, radius = 0 } = element;
    
    // For circles, use radius
    if (radius > 0) {
      const points = {
        'top': { x: elementX, y: elementY - radius },
        'bottom': { x: elementX, y: elementY + radius },
        'center': { x: elementX, y: elementY }
      };
      return points[anchor as keyof typeof points] || { x: elementX, y: elementY };
    }
    
    // For rectangles and other shapes
    const points = {
      'top': { x: elementX + width / 2, y: elementY },
      'bottom': { x: elementX + width / 2, y: elementY + height },
      'left': { x: elementX, y: elementY + height / 2 },
      'right': { x: elementX + width, y: elementY + height / 2 },
      'center': { x: elementX + width / 2, y: elementY + height / 2 },
      'corner-tl': { x: elementX, y: elementY },
      'corner-tr': { x: elementX + width, y: elementY },
      'corner-bl': { x: elementX, y: elementY + height },
      'corner-br': { x: elementX + width, y: elementY + height }
    };
    
    return points[anchor as keyof typeof points] || { x: elementX + width / 2, y: elementY + height / 2 };
  };

  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle table tool - use enhanced table creation from store
    // Table creation is handled by KonvaToolbar.tsx, not here
    // This prevents duplicate table creation when clicking on canvas

    // Handle section tool
    if (selectedTool === 'section') {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);
      
      console.log('📦 Starting section at:', `(${Math.round(pos.x)}, ${Math.round(pos.y)})`);
      
      setIsDrawingSection(true);
      setSectionStart({ x: pos.x, y: pos.y });
      setPreviewSection({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }
    
    // Handle connector tools
    if (selectedTool.startsWith('connector-')) {
      const stage = e.target.getStage();
      if (!stage) return;
      // Use stage coordinates for pointer
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointer);
      
      // If we're already drawing a connector, this click should complete it
      if (isDrawingConnector && connectorStart) {
        console.log('🔗 Completing connector at:', `(${Math.round(stagePos.x)}, ${Math.round(stagePos.y)})`);
        
        // Check if we're snapping to an element
        const snapTarget = findNearestElement(stagePos.x, stagePos.y);
        const endPoint = snapTarget
          ? {
              x: snapTarget.point.x,
              y: snapTarget.point.y,
              elementId: snapTarget.element.id,
              anchor: snapTarget.anchor
            }
          : { x: stagePos.x, y: stagePos.y };
        
        // Validate coordinates before creating connector
        if (!validateConnectorCoordinates(connectorStart, endPoint)) {
          console.error('❌ Invalid connector coordinates, aborting creation');
          setIsDrawingConnector(false);
          setConnectorStart(null);
          setConnectorEnd(null);
          return;
        }
        
        console.log('🔗 Creating connector:', {
          start: `(${Math.round(connectorStart.x)}, ${Math.round(connectorStart.y)})`,
          end: `(${Math.round(endPoint.x)}, ${Math.round(endPoint.y)})`
        });
        
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Create the connector element
        const connectorElement: CanvasElement = {
          id: generateId(),
          type: 'connector',
          subType: selectedTool === 'connector-arrow' ? 'arrow' : 'line',
          x: 0,
          y: 0,
          startPoint: {
            x: connectorStart.x,
            y: connectorStart.y,
            connectedElementId: connectorStart.elementId,
            anchorPoint: connectorStart.anchor as any
          },
          endPoint: {
            x: endPoint.x,
            y: endPoint.y,
            connectedElementId: endPoint.elementId,
            anchorPoint: endPoint.anchor as any
          },
          connectorStyle: {
            strokeColor: '#1E293B',
            strokeWidth: 2,
            strokeDashArray: undefined,
            hasStartArrow: false,
            hasEndArrow: selectedTool === 'connector-arrow',
            arrowSize: 10
          },
          pathPoints: [connectorStart.x, connectorStart.y, endPoint.x, endPoint.y]
        };

        addElement(connectorElement);
        
        // Reset connector drawing state
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
        
        // Switch back to select tool
        setSelectedTool('select');
        return;
      }
      
      // Otherwise, start a new connector
      console.log('🔗 Starting connector at:', `(${Math.round(stagePos.x)}, ${Math.round(stagePos.y)})`);
      
      // Check if we're snapping to an element
      const snapTarget = findNearestElement(stagePos.x, stagePos.y);
      const startPoint = snapTarget
        ? {
            x: snapTarget.point.x,
            y: snapTarget.point.y,
            elementId: snapTarget.element.id,
            anchor: snapTarget.anchor
          }
        : { x: stagePos.x, y: stagePos.y };
      setConnectorStart(startPoint);
      setConnectorEnd({ x: stagePos.x, y: stagePos.y });
      setIsDrawingConnector(true);
      return;
    }
    
    if (selectedTool === 'pen') {
      setIsDrawing(true);
      const stage = e.target.getStage();
      if (!stage) return;

      // Get relative position accounting for stage transforms
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      setCurrentPath([pos.x, pos.y]);
    }
  }, [selectedTool, findNearestElement, isDrawingConnector, connectorStart, validateConnectorCoordinates, addElement, setSelectedTool]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle section drawing
    if (isDrawingSection && sectionStart) {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);
      
      const width = pos.x - sectionStart.x;
      const height = pos.y - sectionStart.y;
      
      // Allow drawing in any direction
      const newPreview = {
        x: width < 0 ? pos.x : sectionStart.x,
        y: height < 0 ? pos.y : sectionStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      };
      
      setPreviewSection(newPreview);
      return;
    }
    
    // Handle connector drawing
    if (isDrawingConnector && connectorStart) {
      const stage = e.target.getStage();
      if (!stage) return;
      // Use stage coordinates for pointer
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointer);
      // Check if we're snapping to an element
      const snapTarget = findNearestElement(stagePos.x, stagePos.y);
      const endPoint = snapTarget
        ? {
            x: snapTarget.point.x,
            y: snapTarget.point.y,
            elementId: snapTarget.element.id,
            anchor: snapTarget.anchor
          }
        : { x: stagePos.x, y: stagePos.y };
      setConnectorEnd(endPoint);
      return;
    }

    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    if (!stage) return;

    // Get relative position accounting for stage transforms
    const point = stage.getRelativePointerPosition();
    if (!point) return;
    
    if (selectedTool === 'pen') {
      // For pen tool, add all points for smooth curves
      setCurrentPath(prev => [...prev, point.x, point.y]);
    }
  }, [isDrawing, selectedTool, isDrawingConnector, connectorStart, findNearestElement, isDrawingSection, sectionStart]);

  const handleMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    // Handle section completion
    if (isDrawingSection && previewSection) {
      // Only create section if it has a reasonable size
      if (previewSection.width > 20 && previewSection.height > 20) {
        const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newSection: SectionType = {
          id: generateId(),
          type: 'section',
          x: previewSection.x,
          y: previewSection.y,
          width: previewSection.width,
          height: previewSection.height,
          title: `Section ${Object.keys(sections).length + 1}`,
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: '#3B82F6',
          borderWidth: 2,
          cornerRadius: 8,
          isHidden: false,
          isLocked: false,
          containedElementIds: []
        };
        
        console.log('📦 Creating section:', newSection);
        createSection(newSection);
        
        // Check for elements within the new section bounds
        Object.values(elements).forEach(element => {
          if (element.type !== 'section' && isElementInSection(element, newSection)) {
            useKonvaCanvasStore.getState().addElementToSection(element.id, newSection.id);
          }
        });
        
        // Switch back to select tool after creating section to prevent unwanted section creation
        setSelectedTool('select');
      }
      
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
      return;
    }
    
    // Note: Connector completion is now handled in handleMouseDown when clicking to complete
    // This prevents the issue where a second click would start a new connector instead of completing the current one
    
    // Pen tool draws on mouse move and finalize on mouse up.
    if (selectedTool === 'pen') {
      if (isDrawing && currentPath.length >= 4) { // Ensure there's something to draw (at least start and end points)
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          id: generateId(),
          type: selectedTool,
          x: 0, // Drawings are positioned by their points array, not a single x/y
          y: 0,
          points: currentPath,
          stroke: selectedTool === 'pen' ? designSystem.colors.secondary[800] : '#1E293B',
          strokeWidth: selectedTool === 'pen' ? 3 : 2,
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
  }, [isDrawing, selectedTool, currentPath, addElement, isDrawingSection, previewSection, sections, elements, createSection]);

  // Canvas click handler - ONLY handles selection/deselection
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    console.log('🎯 [STAGE CLICK DEBUG] === Stage Click Handler ===');
    console.log('🎯 [STAGE CLICK DEBUG] Event detail:', e.evt?.detail);
    console.log('🎯 [STAGE CLICK DEBUG] Current selection:', selectedElementId);
    
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      console.log('🎯 [STAGE CLICK DEBUG] Double-click detected, ignoring');
      return;
    }

    // Don't handle stage clicks while drawing connectors - let mouseDown handle it
    if (isDrawingConnector) {
      console.log('🎯 [STAGE CLICK DEBUG] Drawing connector, ignoring stage click');
      return;
    }

    const stage = e.target.getStage();
    
    // Check if clicked on a table element or table-related component
    const clickedTable = e.target.findAncestor?.('.konva-table') || 
                        e.target.hasName?.('table-element') ||
                        e.target.getClassName?.() === 'Rect' && e.target.getParent?.()?.hasName?.('table-element');
    
    // Check if clicked on empty space
    const clickedOnEmpty = e.target === stage;
    console.log('🎯 [STAGE CLICK DEBUG] Clicked on empty space:', clickedOnEmpty);
    console.log('🎯 [STAGE CLICK DEBUG] Clicked on table:', clickedTable);
    console.log('🎯 [STAGE CLICK DEBUG] Event target type:', e.target.getType?.());
    
    if (clickedOnEmpty && !clickedTable) {
      console.log('🎯 [STAGE CLICK DEBUG] Deselecting current element:', selectedElementId);
      // ONLY deselect on empty clicks - NEVER create elements here
      setSelectedElement(null);
      
      // Clear transformer
      if (transformerRef.current) {
        console.log('🎯 [STAGE CLICK DEBUG] Clearing transformer nodes');
        transformerRef.current.nodes([]);
        transformerRef.current.getLayer()?.batchDraw();
      }
      return;
    }

    console.log('🎯 [STAGE CLICK DEBUG] Click on element, letting element handler deal with it');
    // If we get here, user clicked on an existing element - let element handler deal with it
  }, [setSelectedElement, isDrawingConnector, selectedElementId]);

  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    // Ignore if this is part of a double-click sequence
    if (e.evt?.detail > 1) {
      return;
    }

    e.cancelBubble = true;
    e.evt?.stopPropagation();
    // If clicked again on the same element inside a section, select its parent section
    if (selectedElementId === element.id && element.sectionId) {
      setSelectedElement(element.sectionId);
      return;
    }
    setSelectedElement(element.id);
    onElementSelect?.(element);
  }, [onElementSelect, setSelectedElement, selectedElementId]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    e.cancelBubble = true;
    const node = e.target;
    console.debug(`[Canvas Debug] handleDragEnd start - element: ${elementId}, node.x(): ${node.x()}, node.y(): ${node.y()}`);
    const absPos = node.getAbsolutePosition();
    console.debug(`[Canvas Debug] handleDragEnd start - absolutePos: x:${absPos.x}, y:${absPos.y}`);
    const element = elements[elementId];
    if (!element) return;
    
    console.log('🔍 [DRAG DEBUG] === Drag End Event ===');
    console.log('🔍 [DRAG DEBUG] Element ID:', elementId);
    console.log('🔍 [DRAG DEBUG] Element type:', element.type);
    console.log('🔍 [DRAG DEBUG] Current sectionId:', element.sectionId);
    console.log('🔍 [DRAG DEBUG] Node position:', { x: node.x(), y: node.y() });
    console.log('🔍 [DRAG DEBUG] Node absolute position:', node.absolutePosition());
    
    // Handle section drag separately
    if (element.type === 'section') {
      const newPosition = { x: node.x(), y: node.y() };
      console.log('🔍 [DRAG DEBUG] Section drag - updating position to:', newPosition);
      handleSectionDragEnd(elementId, newPosition);
      return;
    }
    
    // For regular elements, we need to determine their new section membership
    const stage = node.getStage();
    if (!stage) return;
    
    // Get the absolute position of the dragged element
    const absolutePos = node.absolutePosition();
    
    // Find which section (if any) the element is now inside
    const targetSection = Object.values(sections).find(section => {
      return absolutePos.x >= section.x &&
             absolutePos.x <= section.x + section.width &&
             absolutePos.y >= section.y &&
             absolutePos.y <= section.y + section.height;
    });
    
    const currentSectionId = element.sectionId;
    
    if (targetSection && targetSection.id !== currentSectionId) {
      console.debug(`[Canvas Debug] targetSection id:${targetSection.id}, x:${targetSection.x}, y:${targetSection.y}`);
      console.debug(`[Canvas Debug] currentSectionId (old): ${currentSectionId}`);
      // Element moved into a new section
      // FIXED: Use the node's current position, which is already correct for section-relative coordinates
      // The element is dragged within the section Group, so node.x() and node.y() are already relative
      const absPosForDrop = node.absolutePosition();
      const relX = absPosForDrop.x - targetSection.x;
      const relY = absPosForDrop.y - targetSection.y;
      
      // Update element with new section and relative coordinates
      console.debug(`[Canvas Debug] Calculated rel drop coords: relX:${relX}, relY:${relY}`);
      updateElement(elementId, {
        x: relX,
        y: relY,
        sectionId: targetSection.id
      });
      
      // Update section membership in store
      if (currentSectionId) {
        removeElementFromSection(elementId);
      }
      console.debug(`[Canvas Debug] Dropping element ${elementId} into section ${targetSection.id} at relative x:${relX}, y:${relY}`);
      addElementToSection(elementId, targetSection.id);
      // Log post-store state for diagnosis
      {
        const postElement = useKonvaCanvasStore.getState().elements[elementId];
        console.debug(`[Canvas Debug] Post-store element state: x:${postElement.x}, y:${postElement.y}, sectionId:${postElement.sectionId}`);
      }
      
    } else if (!targetSection && currentSectionId) {
      // Element moved out of section to main canvas
      // Use absolute position
      updateElement(elementId, {
        x: absolutePos.x,
        y: absolutePos.y,
        sectionId: null
      });
      removeElementFromSection(elementId);
      
    } else if (!currentSectionId && !targetSection) {
      // Element moved on main canvas (no section change)
      updateElement(elementId, {
        x: node.x(),
        y: node.y()
      });
    } else if (currentSectionId && targetSection && targetSection.id === currentSectionId) {
      console.debug(`[Canvas Debug] Move within same section - element:${elementId}, section:${currentSectionId}`);
      console.debug(`[Canvas Debug] Node coords relative: x:${node.x()}, y:${node.y()}`);
      console.debug(`[Canvas Debug] Section position: x:${targetSection?.x}, y:${targetSection?.y}`);
      // Element moved within same section - just update relative position
      console.debug(`[Canvas Debug] Pre-store element state:`, useKonvaCanvasStore.getState().elements[elementId]);
      updateElement(elementId, {
        x: node.x(),
        y: node.y()
      });
      {
        const postEl = useKonvaCanvasStore.getState().elements[elementId];
        console.debug(`[Canvas Debug] Post-store within-section element state: x:${postEl.x}, y:${postEl.y}, sectionId:${postEl.sectionId}`);
      }
    }
    
    // Update any connectors attached to this element
    setTimeout(() => {
      const connectedConnectors = Object.values(elements).filter(
        el => el.type === 'connector' &&
        (el.startPoint?.connectedElementId === elementId ||
         el.endPoint?.connectedElementId === elementId)
      );

      connectedConnectors.forEach(connector => {
        if (!connector.startPoint || !connector.endPoint) return;
        
        let newStartPoint = connector.startPoint;
        let newEndPoint = connector.endPoint;
        
        // Update start point if connected to moved element
        if (connector.startPoint.connectedElementId === elementId) {
          const movedElement = elements[elementId];
          if (movedElement && connector.startPoint.anchorPoint) {
            const newAnchor = getAnchorPoint(movedElement, connector.startPoint.anchorPoint);
            newStartPoint = {
              ...connector.startPoint,
              x: newAnchor.x,
              y: newAnchor.y
            };
          }
        }
        
        // Update end point if connected to moved element
        if (connector.endPoint.connectedElementId === elementId) {
          const movedElement = elements[elementId];
          if (movedElement && connector.endPoint.anchorPoint) {
            const newAnchor = getAnchorPoint(movedElement, connector.endPoint.anchorPoint);
            newEndPoint = {
              ...connector.endPoint,
              x: newAnchor.x,
              y: newAnchor.y
            };
          }
        }
        
        // Update the connector with new endpoints and recalculate path
        updateElement(connector.id, {
          startPoint: newStartPoint,
          endPoint: newEndPoint,
          pathPoints: [newStartPoint.x, newStartPoint.y, newEndPoint.x, newEndPoint.y]
        });
      });
    }, 0);
  }, [updateElement, elements, sections, handleSectionDragEnd, removeElementFromSection, addElementToSection]);

  // Removed duplicate handleTransformEnd - now handled in useEffect above

  // ...existing code...

  // Render individual canvas elements based on their type
  const renderElement = useCallback((element: CanvasElement): React.ReactNode => {
    const isSelected = element.id === selectedElementId;
    const isEditing = editingTextId === element.id;
    
    // Elements inside sections should remain draggable for repositioning within/between sections
    // Disable child drags when their parent section is selected, so dragging moves the section instead
    // Allow dragging when select tool is active OR when the tool matches the element type (e.g., "table" tool for table elements)
    const isDraggable =
      !isEditing &&
      (selectedTool === 'select' || selectedTool === element.type) &&
      !(element as any).isLocked &&
      !(element.sectionId && selectedElementId === element.sectionId);

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
              draggable: isDraggable, // Respect locked state
              onClick: (e: Konva.KonvaEventObject<MouseEvent>) => handleElementClick(e, element),
              onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => handleDragEnd(e, element.id)
            }}
          />
        );
      case 'sticky-note':
        return (
          <StickyNoteElement
            key={element.id}
            element={element}
            isSelected={isSelected}
            isEditing={editingTextId === element.id} // Pass editing state
            isDraggable={isDraggable}
            onSelect={(_, e) => handleElementClick(e, element)}
            onDragEnd={(e) => handleDragEnd(e, element.id)}
            onDoubleClick={(e) => {
              e.cancelBubble = true;
              handleStartTextEdit(element.id);
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
      case 'pen':
        return (
          <Line
            key={element.id}
            {...konvaElementProps}
            points={element.points || [0, 0, 100, 0]}
            stroke={element.stroke || designSystem.colors.secondary[800]}
            strokeWidth={element.strokeWidth || 3}
            lineCap="round"
            lineJoin="round"
            tension={0.5}
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
            points={element.points || [
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
      case 'connector':
        return (
          <ConnectorRenderer
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={() => setSelectedElement(element.id)}
            elements={elements}
            sections={sections}
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
      case 'section':
        const section = element as SectionType;
        console.log('🔍 [SECTION DEBUG] Rendering section:', section.id, {
          position: { x: section.x, y: section.y },
          size: { width: section.width, height: section.height },
          containedElements: section.containedElementIds,
          isDraggable
        });
        
        return (
          <SectionElement
            key={element.id}
            section={section}
            isSelected={isSelected}
            onUpdate={updateSection}
            onSelect={setSelectedElement}
            onDragEnd={handleDragEnd}
            isDraggable={isDraggable}
            elements={elements}
            renderElement={renderElement}
          />
        );
      case 'table':
        return (
          <EnhancedTableElement // Using enhanced table implementation
            key={element.id}
            element={element}
            isSelected={isSelected}
            onSelect={(element) => {
              setSelectedElement(element.id);
            }}
            onUpdate={(updates) => {
              console.log('🔍 [CANVAS DEBUG] Table update:', updates);
              updateElement(element.id, updates);
            }}
            onDragEnd={(e) => handleDragEnd(e, element.id)}
            stageRef={stageRef}
            onEditingStateChange={handleTableEditingStateChange}
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
      console.log('🎯 [KEYBOARD DEBUG] Key pressed:', e.key, {
        selectedElementId,
        editingTextId,
        isDrawingConnector,
        target: e.target
      });
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !editingTextId) {
          console.log('🎯 [KEYBOARD DEBUG] Deleting element:', selectedElementId);
          const { deleteElement } = useKonvaCanvasStore.getState();
          deleteElement(selectedElementId);
          setSelectedElement(null);
        }
      } else if (e.key === 'Escape') {
        console.log('🎯 [KEYBOARD DEBUG] Escape pressed - canceling operations');
        // Cancel connector drawing if in progress
        if (isDrawingConnector) {
          console.log('🎯 [KEYBOARD DEBUG] Canceling connector drawing');
          setIsDrawingConnector(false);
          setConnectorStart(null);
          setConnectorEnd(null);
          return;
        }
        console.log('🎯 [KEYBOARD DEBUG] Clearing selection and editing state');
        setSelectedElement(null);
        if (editingTextId) {
          // Call the store action to cancel editing
          console.log('🎯 [KEYBOARD DEBUG] Clearing editing text ID:', editingTextId);
          setEditingTextId(null);
          setRichTextEditingData(null); // Also clear rich text editing data
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, editingTextId, setSelectedElement, setEditingTextId, isDrawingConnector]);

  // Safe ref callback to avoid read-only ref issues
  const handleStageRef = useCallback((stage: Konva.Stage | null) => {
    if (stageRef && typeof stageRef === 'object' && 'current' in stageRef) {
      try {
        (stageRef as React.MutableRefObject<Konva.Stage | null>).current = stage;
      } catch (error) {
        console.warn('Could not assign to stageRef:', error);
      }
    }
  }, [stageRef]);

  return (
    <div className="konva-canvas-container">
      <Stage
        ref={handleStageRef}
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
          cursor: selectedTool === 'pan' ? 'grab' : (selectedTool.startsWith('connector-') ? 'crosshair' : 'default')
        }}
      >
        {/* Connector Tool for drawing connectors */}
        <Layer ref={layerRef}>{visibleElements.map(element => renderElement(element))}
          {/* Preview line during pen drawing */}
          {isDrawing && currentPath.length > 0 && selectedTool === 'pen' && (
            <Line
              points={currentPath}
              stroke={designSystem.colors.secondary[800]}
              strokeWidth={3}
              lineCap="round"
              lineJoin="round"
              tension={0.5}
              opacity={0.7}
            />
          )}
          
          {/* Connector preview during drawing */}
          {isDrawingConnector && connectorStart && connectorEnd && (
            <>
              {/* Preview connector line/arrow */}
              {selectedTool === 'connector-arrow' ? (
                <Arrow
                  points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fill="#3B82F6"
                  pointerLength={10}
                  pointerWidth={10}
                  opacity={0.7}
                  dash={[5, 5]}
                  listening={false}
                />
              ) : (
                <Line
                  points={[connectorStart.x, connectorStart.y, connectorEnd.x, connectorEnd.y]}
                  stroke="#3B82F6"
                  strokeWidth={2}
                  opacity={0.7}
                  dash={[5, 5]}
                  listening={false}
                />
              )}
              
              {/* Snap indicators */}
              {connectorStart.elementId && (
                <Circle
                  x={connectorStart.x}
                  y={connectorStart.y}
                  radius={4}
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  opacity={0.8}
                  listening={false}
                />
              )}
              {connectorEnd.elementId && (
                <Circle
                  x={connectorEnd.x}
                  y={connectorEnd.y}
                  radius={4}
                  fill="#3B82F6"
                  stroke="#1E40AF"
                  strokeWidth={2}
                  opacity={0.8}
                  listening={false}
                />
              )}
            </>
          )}
          
          {/* Section preview during drawing */}
          {isDrawingSection && previewSection && (
            <Rect
              x={previewSection.x}
              y={previewSection.y}
              width={previewSection.width}
              height={previewSection.height}
              fill="rgba(59, 130, 246, 0.1)"
              stroke="#3B82F6"
              strokeWidth={2}
              dash={[5, 5]}
              opacity={0.7}
              listening={false}
            />
          )}
          
          <Transformer
            ref={transformerRef}
            boundBoxFunc={(oldBox, newBox) => {
              // Limit resize to minimum size
              if (newBox.width < 5 || newBox.height < 5) {
                return oldBox;
              }
              return newBox;
            }}
            rotateEnabled={true}
            enabledAnchors={(() => {
              if (!selectedElementId || !elements[selectedElementId]) return [];
              
              const selectedElement = elements[selectedElementId];
              const selectedSection = sections[selectedElementId];
              
              if (selectedElement?.type === 'text') {
                // Text elements: only horizontal resize
                return ['middle-left', 'middle-right'];
              } else if (selectedElement?.type === 'table') {
                // Table elements: disable transformer (use custom resize handles)
                return [];
              } else if (selectedSection?.type === 'section') {
                // Sections: full resize capability
                return ['top-left', 'top-center', 'top-right',
                        'middle-left', 'middle-right',
                        'bottom-left', 'bottom-center', 'bottom-right'];
              } else {
                // Other elements: full resize capability
                return ['top-left', 'top-center', 'top-right',
                        'middle-left', 'middle-right',
                        'bottom-left', 'bottom-center', 'bottom-right'];
              }
            })()}
            borderStroke="#3B82F6"
            borderStrokeWidth={2}
            borderDash={[8, 4]}
            anchorFill="#FFFFFF"
            anchorStroke="#3B82F6"
            anchorStrokeWidth={2}
            anchorSize={14}
            anchorCornerRadius={7}
            rotateAnchorOffset={35}
            rotationSnapTolerance={5}
            rotateAnchorSize={20}
            rotateAnchorFill="#3B82F6"
            rotateAnchorStroke="#FFFFFF"
            rotateAnchorStrokeWidth={2}
            // Enhanced visual feedback
            padding={8}
            // Add shadow effect for better visibility
            shadowColor="rgba(59, 130, 246, 0.3)"
            shadowBlur={12}
            shadowOffset={{ x: 0, y: 4 }}
            shadowOpacity={0.5}
          /></Layer></Stage>

      {/* Text editing overlay - completely outside Konva */}
      {editingElement && textareaPosition && (
        <TextEditingOverlay
          isEditing={true}
          element={{
            id: editingElement.id,
            x: editingElement.x,
            y: editingElement.y,
            width: editingElement.width,
            height: editingElement.height,
            text: editingElement.text || '',
            fontSize: editingElement.fontSize,
            fontFamily: editingElement.fontFamily,
            textColor: editingElement.textColor,
            fill: editingElement.fill,
            backgroundColor: editingElement.backgroundColor,
            type: editingElement.type as 'text' | 'sticky-note'
          }}
          editText={editText}
          onEditTextChange={setEditText}
          textareaPosition={textareaPosition}
          onCancel={handleEditingCancel}
          onDone={handleEditingDone}
          stageRef={stageRef}
        />
      )}

      {/* Unified rich text editing overlay for ALL text editing (text, sticky notes, AND table cells) */}
      {richTextEditingData && (
        <RichTextCellEditor
          isEditing={richTextEditingData.isEditing}
          cellPosition={richTextEditingData.cellPosition}
          initialSegments={richTextEditingData.richTextSegments}
          onRichTextChange={richTextEditingData.onRichTextChange || (() => {})}
          onFinishEditing={richTextEditingData.onFinishEditing}
          onCancelEditing={richTextEditingData.onCancelEditing}
          defaultFormat={{
            fontSize: richTextEditingData.fontSize || 14,
            fontFamily: richTextEditingData.fontFamily || designSystem.typography.fontFamily.sans,
            textColor: richTextEditingData.textColor || designSystem.colors.secondary[800],
            textAlign: richTextEditingData.textAlign || 'left',
            bold: false,
            italic: false,
            underline: false,
            strikethrough: false,
            listType: 'none',
            isHyperlink: false,
            hyperlinkUrl: '',
            textStyle: 'default',
          }}
        />
      )}

    </div>
  );
};

export default KonvaCanvas;

/**
 * TextTool - FigJam-style Interactive Text Tool
 * 
 * Features:
 * - Crosshair cursor with "Add text" preview following mouse
 * - Click to create text box with blue border and blinking caret
 * - Real-time horizontal expansion while typing
 * - Click away to show resize handles (blue border with corner handles)
 * - Final click away removes borders, shows only text
 * - Click existing text to re-edit with blue border
 */

import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Group, Text, Rect, Line } from 'react-konva';
import Konva from 'konva';
// Removed scheduler to prevent recursion issues
import { useUnifiedCanvasStore } from '../../../stores/unifiedCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { Vector2d } from '../base';
import { nanoid } from 'nanoid';
import { TextElement, ElementId } from '../../../types/enhanced.types';
import { measureTextDimensions } from '../../../utils/textEditingUtils';
import { useCursorManager } from '../../../utils/performance/cursorManager';
import { useSingleRAF } from '../../../hooks/useRAFManager';

interface TextToolProps {
  stageRef: React.RefObject<Konva.Stage | null>;
  isActive: boolean;
}

// FigJam-style text states
type TextToolState = 
  | 'idle'           // Tool active, showing cursor preview
  | 'preview'        // Clicked, showing preview box with caret
  | 'editing'        // User is typing
  | 'resize'         // Showing resize handles after edit complete

export const TextTool: React.FC<TextToolProps> = ({ stageRef, isActive }) => {
  // Local state for FigJam-style UX
  const [toolState, setToolState] = useState<TextToolState>('idle');
  const [previewPos, setPreviewPos] = useState<Vector2d | null>(null);
  const [currentText, setCurrentText] = useState('');
  const [textWidth, setTextWidth] = useState(120); // Start with default width
  const [editingElementId, setEditingElementId] = useState<ElementId | null>(null);
  
  // Animation state for blinking caret
  const [caretVisible, setCaretVisible] = useState(true);
  const caretInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Cursor management
  const cursorManager = useCursorManager();
  
  // Direct Konva cursor layer refs (performance optimization)
  const cursorLayerRef = useRef<Konva.Layer | null>(null);
  const cursorGroupRef = useRef<Konva.Group | null>(null);
  
  // Centralized RAF management for mouse move events
  const mouseMoveRAF = useSingleRAF('TextTool-mouseMove');
  const latestMouseEvent = useRef<Konva.KonvaEventObject<MouseEvent> | null>(null);

  // Atomic store selectors (React 19 + Zustand 5.0 optimization)
  const addElement = useUnifiedCanvasStore(state => state.addElement);
  const updateElement = useUnifiedCanvasStore(state => state.updateElement);
  const setTextEditingElement = useUnifiedCanvasStore(state => state.setTextEditingElement);
  const selectElement = useUnifiedCanvasStore(state => state.selectElement);
  const clearSelection = useUnifiedCanvasStore(state => state.clearSelection);
  const findStickyNoteAtPoint = useUnifiedCanvasStore(state => state.findStickyNoteAtPoint);
  const addElementToStickyNote = useUnifiedCanvasStore(state => state.addElementToStickyNote);
  const setActiveTool = useUnifiedCanvasStore(state => state.setActiveTool);

  // Start caret blinking animation
  useEffect(() => {
    if (toolState === 'preview' || toolState === 'editing') {
      caretInterval.current = setInterval(() => {
        setCaretVisible(prev => !prev);
      }, 500);
    } else {
      if (caretInterval.current) {
        clearInterval(caretInterval.current);
        caretInterval.current = null;
      }
      setCaretVisible(true);
    }

    return () => {
      if (caretInterval.current) {
        clearInterval(caretInterval.current);
      }
    };
  }, [toolState]);

  // Simplified cursor layer initialization to prevent infinite recursion
  useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;
    
    // Clean up any existing cursor layer first
    if (cursorLayerRef.current) {
      cursorLayerRef.current.remove();
      cursorLayerRef.current = null;
      cursorGroupRef.current = null;
    }
    
    // Create optimized Layer for cursor
    const cursorLayer = new Konva.Layer({ 
      listening: false,
      perfectDrawEnabled: false
    });
    const cursorGroup = new Konva.Group({ 
      listening: false,
      visible: false
    });
    
    // Create cursor elements
    // Draw crosshair with two segments each (avoid NaN coordinates)
    const crosshairH1 = new Konva.Line({
      points: [-10, 0, -2, 0],
      stroke: '#000000',
      strokeWidth: 1,
      listening: false
    });
    const crosshairH2 = new Konva.Line({
      points: [2, 0, 10, 0],
      stroke: '#000000',
      strokeWidth: 1,
      listening: false
    });
    
    const crosshairV1 = new Konva.Line({
      points: [0, -10, 0, -2],
      stroke: '#000000',
      strokeWidth: 1,
      listening: false
    });
    const crosshairV2 = new Konva.Line({
      points: [0, 2, 0, 10],
      stroke: '#000000',
      strokeWidth: 1,
      listening: false
    });
    
    const previewText = new Konva.Text({
      x: 8,
      y: 8,
      text: 'Add text',
      fontSize: 24,
      fontFamily: 'Inter',
      fill: '#999999',
      listening: false
    });
    
    // Ensure all elements are valid before adding
    if (cursorGroup && crosshairH1 && crosshairH2 && crosshairV1 && crosshairV2 && previewText) {
      cursorGroup.add(crosshairH1, crosshairH2, crosshairV1, crosshairV2, previewText);
    }
    if (cursorLayer && cursorGroup) {
      cursorLayer.add(cursorGroup);
    }
    if (stage && cursorLayer) {
      stage.add(cursorLayer);
    }
    
    // Store refs
    cursorLayerRef.current = cursorLayer;
    cursorGroupRef.current = cursorGroup;
    
    // RAF-optimized mousemove handler 
    const handleMouseMove = (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (toolState !== 'idle' || !cursorGroup) return;

      // Store the latest mouse event data
      latestMouseEvent.current = e;
      
      // Use centralized RAF management for cursor updates
      mouseMoveRAF.scheduleRAF(() => {
        // Process the latest mouse event
        const latestEvent = latestMouseEvent.current;
        if (!latestEvent) return;

        const pointer = stage.getPointerPosition();
        if (!pointer) return;

        cursorGroup.position(pointer);
        if (!cursorGroup.visible()) {
          cursorGroup.visible(true);
        }
        cursorLayer.batchDraw();
      }, 'cursor-update');
    };

    const handleMouseLeave = () => {
      if (cursorGroup && cursorGroup.visible()) {
        cursorGroup.visible(false);
        cursorLayer.batchDraw();
      }
    };

    // Bind events
    stage.on('mousemove', handleMouseMove);
    stage.on('mouseleave', handleMouseLeave);

    return () => {
      stage.off('mousemove', handleMouseMove);
      stage.off('mouseleave', handleMouseLeave);
      if (cursorLayerRef.current) {
        cursorLayerRef.current.remove();
        cursorLayerRef.current = null;
        cursorGroupRef.current = null;
      }
    };
  }, [isActive, stageRef]);

  // Handle clicks - simplified to prevent recursion
  useEffect(() => {
    if (!isActive || !stageRef.current) return;

    const stage = stageRef.current;

    const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const transform = stage.getAbsoluteTransform().copy().invert();
      const canvasPos = transform.point(pointer);

      // Check if click is on existing text element for editing
      const target = e.target;
      if (target && target.id && target.id().includes('-text')) {
        // Extract element ID from text node ID (format: "elementId-text")
        const elementId = target.id().replace('-text', '') as ElementId;
        
        // Switch to select tool and start text editing
        clearSelection();
        setTextEditingElement(elementId);
        return;
      }

      // Handle clicks on stage background
      if (e.target !== stage) return;

      if (toolState === 'idle') {
        // First click: create text element immediately with default text
        const defaultText = 'Text';
        const textElement: TextElement = {
          id: nanoid() as ElementId,
          type: 'text',
          x: canvasPos.x,
          y: canvasPos.y,
          width: 120,
          height: 32,
          text: defaultText,
          fontSize: 24,
          fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          fill: '#000000',
          fontStyle: 'normal',
          textAlign: 'left',
          isLocked: false,
          sectionId: undefined,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isHidden: false
        };

        // Add to store
        addElement(textElement);
        
        // Check for sticky note integration
        const stickyNoteId = findStickyNoteAtPoint(canvasPos);
        if (stickyNoteId) {
          addElementToStickyNote(textElement.id, stickyNoteId);
        }

        // Select the element and switch to select tool
        selectElement(textElement.id, false);
        setActiveTool('select');
        
        // Update cursor to select tool cursor
        cursorManager.updateForTool('select');
        
        // Start editing the text immediately
        setTextEditingElement(textElement.id);
      } else if (toolState === 'preview' || toolState === 'editing') {
        // Click away: finish editing and create/update element
        finishEditing();
      }
    };

    stage.on('click', handleClick);

    return () => {
      stage.off('click', handleClick);
    };
  }, [isActive, stageRef, toolState]);

  // Create hidden input for text capture
  const createHiddenInput = useCallback((position: Vector2d) => {
    if (!stageRef.current) return;

    // Remove any existing hidden input
    const existingInput = document.getElementById('figma-text-input');
    if (existingInput) {
      existingInput.remove();
    }

    const input = document.createElement('input');
    input.id = 'figma-text-input';
    input.type = 'text';
    input.style.position = 'fixed';
    input.style.left = '-9999px';
    input.style.top = '-9999px';
    input.style.opacity = '0';
    input.style.pointerEvents = 'none';
    
    document.body.appendChild(input);
    input.focus();

    // Handle typing
    const handleInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      const text = target.value;
      setCurrentText(text);
      setToolState('editing');

      // Calculate new width based on text
      if (text.trim()) {
        const dimensions = measureTextDimensions(text, 24, 'Inter', 600, false);
        setTextWidth(Math.max(120, dimensions.width + 20)); // Add padding
      } else {
        setTextWidth(120);
      }
    };

    // Handle enter/escape
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        finishEditing();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditing();
      }
    };

    input.addEventListener('input', handleInput);
    input.addEventListener('keydown', handleKeyDown);

    // Store cleanup function
    input.dataset.cleanup = 'true';
  }, [stageRef]);

  // Cleanup hidden input
  const cleanupInput = useCallback(() => {
    const input = document.getElementById('figma-text-input');
    if (input) {
      input.remove();
    }
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setToolState('idle');
    setPreviewPos(null);
    setCurrentText('');
    setTextWidth(120);
    cleanupInput();
  }, [cleanupInput]);

  // Finish editing and create/update text element
  const finishEditing = useCallback(() => {
    const currentPreviewPos = previewPos;
    const currentTextValue = currentText;
    const currentWidth = textWidth;
    
    if (!currentPreviewPos) return;

    const finalText = currentTextValue.trim();
    
    if (finalText) {
      // Create new text element
      const textElement: TextElement = {
        id: nanoid() as ElementId,
        type: 'text',
        x: currentPreviewPos.x,
        y: currentPreviewPos.y,
        width: currentWidth,
        height: 32,
        text: finalText,
        fontSize: 24,
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        fill: '#000000',
        fontStyle: 'normal',
        textAlign: 'left',
        isLocked: false,
        sectionId: undefined,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isHidden: false
      };

      // Add to store using atomic selectors
      addElement(textElement);
      
      // Check for sticky note integration
      const stickyNoteId = findStickyNoteAtPoint(currentPreviewPos);
      if (stickyNoteId) {
        addElementToStickyNote(textElement.id, stickyNoteId);
      }

      // Select the element to show resize handles and switch to select tool
      selectElement(textElement.id, false);
      setActiveTool('select');
      setEditingElementId(textElement.id);
      setToolState('resize');
      
      // Update cursor to select tool cursor
      cursorManager.updateForTool('select' as any);
    } else {
      // No text entered, cancel
      cancelEditing();
    }

    // Cleanup
    cleanupInput();
  }, [previewPos, currentText, textWidth, addElement, findStickyNoteAtPoint, addElementToStickyNote, selectElement, setActiveTool, cancelEditing, cleanupInput]);

  // Reset state when tool becomes inactive
  useEffect(() => {
    if (!isActive) {
      setToolState('idle');
      setPreviewPos(null);
      setCurrentText('');
      setTextWidth(120);
      setCursorPos(null);
      setEditingElementId(null);
      cleanupInput();
    }
  }, [isActive, cleanupInput]);

  // Cursor position state (missing from original implementation)
  const setCursorPos = useCallback((pos: Vector2d | null) => {
    // This function was referenced but not defined - adding stub implementation
    // In a full implementation, this would manage cursor position state
  }, []);


  // Render preview box with blinking caret
  const renderPreviewBox = () => {
    if (!previewPos || (toolState !== 'preview' && toolState !== 'editing')) return null;

    return (
      <Group x={previewPos.x} y={previewPos.y}>
        {/* Blue border */}
        <Rect
          x={-2}
          y={-2}
          width={textWidth + 4}
          height={32}
          stroke="#3B82F6"
          strokeWidth={2}
          fill="rgba(255, 255, 255, 0.95)"
          cornerRadius={4}
          listening={false}
        />
        
        {/* Text content */}
        <Text
          x={8}
          y={2}
          text={currentText || 'Add text'}
          fontSize={24}
          fontFamily="Inter"
          fill={currentText ? '#000000' : '#999999'}
          listening={false}
        />
        
        {/* Blinking caret */}
        {caretVisible && (
          <Line
            points={[
              currentText ? measureTextDimensions(currentText, 24, 'Inter', 600, false).width + 10 : 10,
              2,
              currentText ? measureTextDimensions(currentText, 24, 'Inter', 600, false).width + 10 : 10,
              26
            ]}
            stroke="#3B82F6"
            strokeWidth={1}
            listening={false}
          />
        )}
      </Group>
    );
  };

  if (!isActive) return null;

  // Return null when using direct Konva layers - preview handled by Konva layer
  if (toolState === 'idle') {
    return null; 
  }

  return (
    <Group>
      {renderPreviewBox()}
    </Group>
  );
}; 
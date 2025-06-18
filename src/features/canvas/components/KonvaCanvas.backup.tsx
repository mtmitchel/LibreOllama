import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Stage } from 'react-konva';
import Konva from 'konva';
import { useKonvaCanvasStore } from '../stores';
import type { CanvasElement, RichTextSegment } from '../types';
import { RichTextCellEditor } from '../../../components/canvas/RichTextCellEditor';
import { Html } from 'react-konva-utils';
import KonvaErrorBoundary from '../../../components/canvas/KonvaErrorBoundary';
import { designSystem } from '../../../styles/designSystem';
import { CanvasLayerManager } from '../layers/CanvasLayerManager';
import { debug } from '../utils/debug';
import '../../../styles/konvaCanvas.css';
import '../../../styles/canvas-enhancements.css';
import '../../../styles/canvas-sections-enhanced.css';
import '../../../styles/canvas-transform-enhanced.css';
import '../../../styles/text-editing-enhanced.css';

// Local interfaces
interface PanZoomState {
  scale: number;
  position: { x: number; y: number };
}

interface KonvaCanvasProps {
  width: number;
  height: number;
  onElementSelect?: (element: CanvasElement) => void;
  panZoomState: PanZoomState;
  stageRef: React.MutableRefObject<Konva.Stage | null>;
  onWheelHandler: (e: Konva.KonvaEventObject<WheelEvent>) => void;
  onTouchMoveHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
  onTouchEndHandler?: (e: Konva.KonvaEventObject<TouchEvent>) => void;
}

const KonvaCanvas: React.FC<KonvaCanvasProps> = ({
  width,
  height,
  onElementSelect,
  panZoomState,
  stageRef: externalStageRef,
  onWheelHandler,
  onTouchMoveHandler,
  onTouchEndHandler
}) => {
  // Internal stage ref to avoid React strict mode issues
  const internalStageRef = useRef<Konva.Stage | null>(null);
  
  // Sync internal ref with external ref
  useEffect(() => {
    if (externalStageRef && internalStageRef.current) {
      externalStageRef.current = internalStageRef.current;
    }
  }, [externalStageRef]);

  // Use specific selectors to prevent unnecessary re-renders
  const elements = useKonvaCanvasStore(state => state.elements);
  const sections = useKonvaCanvasStore(state => state.sections);
  const selectedElementId = useKonvaCanvasStore(state => state.selectedElementId);
  const selectedTool = useKonvaCanvasStore(state => state.selectedTool);
  const editingTextId = useKonvaCanvasStore(state => state.editingTextId);
  
  // Get stable action functions using selectors
  const addElement = useKonvaCanvasStore(state => state.addElement);
  const updateElement = useKonvaCanvasStore(state => state.updateElement);
  const deleteElement = useKonvaCanvasStore(state => state.deleteElement);
  const selectElement = useKonvaCanvasStore(state => state.setSelectedElement);
  const clearSelection = useKonvaCanvasStore(state => state.clearSelection);
  const setSelectedTool = useKonvaCanvasStore(state => state.setSelectedTool);
  const setEditingTextId = useKonvaCanvasStore(state => state.setEditingTextId);
  const createSection = useKonvaCanvasStore(state => state.createSection);
  const addElementToSection = useKonvaCanvasStore(state => state.addElementToSection);
  const removeElementFromSection = useKonvaCanvasStore(state => state.removeElementFromSection);
  const handleSectionDragEnd = useKonvaCanvasStore(state => state.handleSectionDragEnd);
  
  // Performance logging - only on mount to avoid infinite loops
  useEffect(() => {
    debug.canvas.performance('KonvaCanvas mounted');
  }, []);

  // Drawing states
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<number[]>([]);
  const [isDrawingConnector, setIsDrawingConnector] = useState(false);
  const [connectorStart, setConnectorStart] = useState<{x: number; y: number; elementId?: string; anchor?: string} | null>(null);
  const [connectorEnd, setConnectorEnd] = useState<{x: number; y: number; elementId?: string; anchor?: string} | null>(null);
  const [isDrawingSection, setIsDrawingSection] = useState(false);
  const [sectionStart, setSectionStart] = useState<{x: number; y: number} | null>(null);
  const [previewSection, setPreviewSection] = useState<{x: number; y: number; width: number; height: number} | null>(null);

  // Rich text editing state
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

  // Memoize elements array with shallow comparison to prevent unnecessary re-renders
  const elementsArray = useMemo(() => {
    const elementIds = Object.keys(elements);
    return elementIds.map(id => elements[id]).filter(Boolean);
  }, [elements]);

  // Helper function to get anchor point coordinates - memoized to prevent infinite loops
  const getAnchorPoint = useCallback((element: CanvasElement, anchor: string) => {
    let elementX = element.x;
    let elementY = element.y;
    
    if (element.sectionId && sections[element.sectionId]) {
      const section = sections[element.sectionId];
      if (section) {
        elementX = section.x + element.x;
        elementY = section.y + element.y;
      }
    }
    
    const { width = 0, height = 0, radius = 0 } = element;
    
    if (radius > 0) {
      const points = {
        'top': { x: elementX, y: elementY - radius },
        'bottom': { x: elementX, y: elementY + radius },
        'center': { x: elementX, y: elementY }
      };
      return points[anchor as keyof typeof points] || { x: elementX, y: elementY };
    }
    
    const points = {
      'top': { x: elementX + width / 2, y: elementY },
      'bottom': { x: elementX + width / 2, y: elementY + height },
      'left': { x: elementX, y: elementY + height / 2 },
      'right': { x: elementX + width, y: elementY + height / 2 },
      'center': { x: elementX + width / 2, y: elementY + height / 2 }
    };
    
    return points[anchor as keyof typeof points] || { x: elementX + width / 2, y: elementY + height / 2 };
  }, [sections]);

  // Helper function to find nearest element for connector snapping
  const findNearestElement = useCallback((x: number, y: number) => {
    const SNAP_DISTANCE = 20;
    
    for (const element of elementsArray) {
      if (!element || element.type === 'connector') continue;
      
      const anchors = ['center', 'top', 'bottom', 'left', 'right'];
      for (const anchor of anchors) {
        const anchorPoint = getAnchorPoint(element, anchor);
        const distance = Math.sqrt(
          Math.pow(x - anchorPoint.x, 2) + Math.pow(y - anchorPoint.y, 2)
        );
        
        if (distance <= SNAP_DISTANCE) {
          return { element, anchor, point: anchorPoint };
        }
      }
    }
    return null;
  }, [elementsArray, getAnchorPoint]);

  // Mouse event handlers
  const handleMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!editingTextId && !richTextEditingData) {
      e.evt.preventDefault();
    }
    
    if (selectedTool === 'section') {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const pos = transform.point(pointer);
      
      setIsDrawingSection(true);
      setSectionStart({ x: pos.x, y: pos.y });
      setPreviewSection({ x: pos.x, y: pos.y, width: 0, height: 0 });
      return;
    }
    
    if (selectedTool.startsWith('connector-')) {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointer);
      
      if (isDrawingConnector && connectorStart) {
        // Complete connector
        const snapTarget = findNearestElement(stagePos.x, stagePos.y);
        const endPoint = snapTarget && snapTarget.element
          ? { x: snapTarget.point.x, y: snapTarget.point.y, elementId: snapTarget.element.id, anchor: snapTarget.anchor }
          : { x: stagePos.x, y: stagePos.y };
        
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const connectorElement: CanvasElement = {
          id: generateId(),
          type: 'connector',
          subType: selectedTool === 'connector-arrow' ? 'arrow' : 'line',
          x: 0,
          y: 0,
          startPoint: {
            x: connectorStart.x,
            y: connectorStart.y,
            connectedElementId: connectorStart.elementId || '',
            anchorPoint: connectorStart.anchor as any
          },
          endPoint: {
            x: endPoint.x,
            y: endPoint.y,
            connectedElementId: endPoint.elementId || '',
            anchorPoint: endPoint.anchor as any
          },
          connectorStyle: {
            strokeColor: '#1E293B',
            strokeWidth: 2,
            strokeDashArray: [],
            hasStartArrow: false,
            hasEndArrow: selectedTool === 'connector-arrow',
            arrowSize: 10
          },
          pathPoints: [connectorStart.x, connectorStart.y, endPoint.x, endPoint.y]
        };

        addElement(connectorElement);
        setIsDrawingConnector(false);
        setConnectorStart(null);
        setConnectorEnd(null);
        setSelectedTool('select');
        return;
      }
      
      // Start connector
      const snapTarget = findNearestElement(stagePos.x, stagePos.y);
      const startPoint = snapTarget && snapTarget.element
        ? { x: snapTarget.point.x, y: snapTarget.point.y, elementId: snapTarget.element.id, anchor: snapTarget.anchor }
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
      const pos = stage.getRelativePointerPosition();
      if (!pos) return;
      setCurrentPath([pos.x, pos.y]);
    }
  }, [selectedTool, findNearestElement, isDrawingConnector, connectorStart, addElement, setSelectedTool, editingTextId, richTextEditingData]);

  const handleMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
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
      
      const newPreview = {
        x: width < 0 ? pos.x : sectionStart.x,
        y: height < 0 ? pos.y : sectionStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      };
      
      setPreviewSection(newPreview);
      return;
    }
    
    if (isDrawingConnector && connectorStart) {
      const stage = e.target.getStage();
      if (!stage) return;
      
      const pointer = stage.getPointerPosition();
      if (!pointer) return;
      const transform = stage.getAbsoluteTransform().copy();
      transform.invert();
      const stagePos = transform.point(pointer);
      
      const snapTarget = findNearestElement(stagePos.x, stagePos.y);
      const endPoint = snapTarget && snapTarget.element
        ? { x: snapTarget.point.x, y: snapTarget.point.y, elementId: snapTarget.element.id, anchor: snapTarget.anchor }
        : { x: stagePos.x, y: stagePos.y };
      setConnectorEnd(endPoint);
      return;
    }

    if (!isDrawing) return;
    
    const stage = e.target.getStage();
    if (!stage) return;
    const point = stage.getRelativePointerPosition();
    if (!point) return;
    
    if (selectedTool === 'pen') {
      setCurrentPath(prev => [...prev, point.x, point.y]);
    }
  }, [isDrawing, selectedTool, isDrawingConnector, connectorStart, findNearestElement, isDrawingSection, sectionStart]);

  const handleMouseUp = useCallback((_e: Konva.KonvaEventObject<MouseEvent>) => {
    if (isDrawingSection && previewSection) {
      if (previewSection.width > 20 && previewSection.height > 20) {
        const generateId = () => `section_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newSection = {
          id: generateId(),
          type: 'section' as const,
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
        
        createSection(newSection);
        setSelectedTool('select');
      }
      
      setIsDrawingSection(false);
      setSectionStart(null);
      setPreviewSection(null);
      return;
    }
    
    if (selectedTool === 'pen') {
      if (isDrawing && currentPath.length >= 4) {
        const generateId = () => `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newElement: CanvasElement = {
          id: generateId(),
          type: selectedTool,
          x: 0,
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
    
    setIsDrawing(false);
  }, [isDrawing, selectedTool, currentPath, addElement, isDrawingSection, previewSection, sections, createSection, setSelectedTool]);

  // Canvas click handler
  const handleStageClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (e.evt?.detail > 1) return;
    if (isDrawingConnector) return;

    const stage = e.target.getStage();
    const clickedOnEmpty = e.target === stage;
    
    if (clickedOnEmpty) {
      clearSelection();
    }
  }, [isDrawingConnector, clearSelection]);

  // Element interaction handlers
  const handleElementClick = useCallback((e: Konva.KonvaEventObject<MouseEvent>, element: CanvasElement) => {
    if (e.evt?.detail > 1) return;
    e.cancelBubble = true;
    e.evt?.stopPropagation();
    
    if (selectedElementId === element.id && element.sectionId) {
      selectElement(element.sectionId);
      return;
    }
    selectElement(element.id);
    onElementSelect?.(element);
  }, [onElementSelect, selectElement, selectedElementId]);

  const handleDragEnd = useCallback((e: Konva.KonvaEventObject<DragEvent>, elementId: string) => {
    e.cancelBubble = true;
    const node = e.target;
    const element = elements[elementId];
    if (!element) return;
    
    if (element.type === 'section') {
      const newPosition = { x: node.x(), y: node.y() };
      handleSectionDragEnd(elementId, newPosition);
      return;
    }
    
    const stage = node.getStage();
    if (!stage) return;
    
    const absolutePos = node.absolutePosition();
    const targetSection = Object.values(sections).find(section => {
      return absolutePos.x >= section.x &&
             absolutePos.x <= section.x + section.width &&
             absolutePos.y >= section.y &&
             absolutePos.y <= section.y + section.height;
    });
    
    const currentSectionId = element.sectionId;
    
    if (targetSection && targetSection.id !== currentSectionId) {
      const relX = absolutePos.x - targetSection.x;
      const relY = absolutePos.y - targetSection.y;
      
      updateElement(elementId, {
        x: relX,
        y: relY,
        sectionId: targetSection.id
      });
      
      if (currentSectionId) {
        removeElementFromSection(elementId);
      }
      addElementToSection(elementId, targetSection.id);
    } else if (!targetSection && currentSectionId) {
      updateElement(elementId, {
        x: absolutePos.x,
        y: absolutePos.y,
        sectionId: null
      });
      removeElementFromSection(elementId);
    } else if (!currentSectionId && !targetSection) {
      updateElement(elementId, {
        x: node.x(),
        y: node.y()
      });
    } else if (currentSectionId && targetSection && targetSection.id === currentSectionId) {
      updateElement(elementId, {
        x: node.x(),
        y: node.y()
      });
    }
  }, [updateElement, elements, sections, handleSectionDragEnd, removeElementFromSection, addElementToSection]);

  // Text editing handlers
  const handleStartTextEdit = useCallback((elementId: string) => {
    if (elementId.includes('-cell-')) {
      // Handle table cell editing
      const parts = elementId.split('-cell-');
      const tableId = parts[0];
      const cellParts = parts[1]?.split('-') || ['0', '0'];
      const rowIndex = parseInt(cellParts[0] || '0', 10);
      const colIndex = parseInt(cellParts[1] || '0', 10);
      
      const tableElement = tableId ? elements[tableId] : undefined;
      if (!tableElement || tableElement.type !== 'table') return;
      
      if (internalStageRef.current) {
        const stage = internalStageRef.current;
        const cellNode = stage.findOne(`#${elementId}`);
        
        if (cellNode) {
          const cellPosition = cellNode.getAbsolutePosition();
          const cellAttrs = cellNode.getAttrs();
          const enhancedTableData = tableElement.enhancedTableData;
          const cellData = (enhancedTableData?.cells &&
                           rowIndex < enhancedTableData.cells.length &&
                           enhancedTableData.cells[rowIndex] &&
                           colIndex < enhancedTableData.cells[rowIndex].length)
                           ? enhancedTableData.cells[rowIndex][colIndex]
                           : { text: '' };
          const cellText = cellData?.text || '';
          
          const editingPosition = {
            x: cellPosition.x,
            y: cellPosition.y,
            width: cellAttrs.width || 100,
            height: cellAttrs.height || 40
          };
          
          const newRichTextEditingData = {
            isEditing: true,
            cellPosition: editingPosition,
            cellText: cellText,
            richTextSegments: [],
            fontSize: 14,
            fontFamily: 'Inter',
            textColor: '#000000',
            elementId: elementId,
            elementType: 'table-cell' as const,
            onTextChange: (text: string) => {
              console.log('Table cell text change:', text);
            },
            onRichTextChange: (segments: RichTextSegment[]) => {
              console.log('Table cell rich text change:', segments);
            },
            onFinishEditing: (finalSegments: RichTextSegment[]) => {
              const newText = finalSegments.map(seg => seg.text).join('');
              
              if (enhancedTableData) {
                const newEnhancedTableData = { 
                  ...enhancedTableData,
                  cells: [...(enhancedTableData.cells || [])],
                  rows: enhancedTableData.rows || [],
                  columns: enhancedTableData.columns || []
                };
                
                if (rowIndex >= 0 && rowIndex < newEnhancedTableData.cells.length &&
                    colIndex >= 0 && newEnhancedTableData.cells[rowIndex] &&
                    colIndex < newEnhancedTableData.cells[rowIndex].length) {
                  const currentCell = newEnhancedTableData.cells[rowIndex][colIndex];
                  if (currentCell) {
                    newEnhancedTableData.cells[rowIndex][colIndex] = {
                      ...currentCell,
                      text: newText,
                      containedElementIds: currentCell.containedElementIds || []
                    };
                  }
                }
                
                if (tableId) {
                  updateElement(tableId, { enhancedTableData: newEnhancedTableData });
                }
              }
              setRichTextEditingData(null);
            },
            onCancelEditing: () => {
              setRichTextEditingData(null);
            }
          };
          
          setRichTextEditingData(newRichTextEditingData);
        }
      }
      return;
    }
    
    const element = elements[elementId];
    if (!element) return;

    if (element.type === 'text' || element.type === 'sticky-note' || element.type === 'rich-text') {
      setEditingTextId(elementId);
    }
  }, [elements, sections, setEditingTextId, internalStageRef, updateElement]);

  // Keyboard event handling
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (richTextEditingData?.isEditing) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId && !editingTextId && !richTextEditingData?.isEditing) {
          deleteElement(selectedElementId);
          clearSelection();
        }
      } else if (e.key === 'Escape') {
        if (isDrawingConnector) {
          setIsDrawingConnector(false);
          setConnectorStart(null);
          setConnectorEnd(null);
          return;
        }
        
        if (selectedElementId && !editingTextId && !richTextEditingData?.isEditing) {
          clearSelection();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedElementId, editingTextId, deleteElement, clearSelection, isDrawingConnector, richTextEditingData]);

  return (
    <div className="konva-canvas-container">
      <Stage
        ref={internalStageRef}
        width={width}
        height={height}
        onMouseDown={handleMouseDown}
        onMousemove={handleMouseMove}
        onMouseup={handleMouseUp}
        onClick={handleStageClick}
        onWheel={onWheelHandler}
        {...(onTouchMoveHandler && { onTouchMove: onTouchMoveHandler })}
        {...(onTouchEndHandler && { onTouchEnd: onTouchEndHandler })}
        draggable={selectedTool === 'pan'}
        x={panZoomState.position.x}
        y={panZoomState.position.y}
        scaleX={panZoomState.scale}
        scaleY={panZoomState.scale}
        style={{
          display: 'block',
          backgroundColor: designSystem.canvasStyles.background,
          cursor: selectedTool === 'pan' ? 'grab' : (selectedTool.startsWith('connector-') ? 'crosshair' : 'default'),
          userSelect: editingTextId || richTextEditingData ? 'text' : 'none',
          WebkitUserSelect: editingTextId || richTextEditingData ? 'text' : 'none',
        }}
      >
        {/* Multi-Layer Architecture Implementation */}
        <CanvasLayerManager
          stageWidth={width}
          stageHeight={height}
          stageRef={internalStageRef}
          onElementSelect={onElementSelect || (() => {})}
          onElementUpdate={updateElement}
          onElementDragEnd={handleDragEnd}
          onElementClick={handleElementClick}
          onStartTextEdit={handleStartTextEdit}
          isDrawing={isDrawing}
          currentPath={currentPath}
          isDrawingConnector={isDrawingConnector}
          connectorStart={connectorStart}
          connectorEnd={connectorEnd}
          isDrawingSection={isDrawingSection}
          previewSection={previewSection}
        />

        {/* Rich text editing overlay for table cells */}
        {richTextEditingData && richTextEditingData.isEditing && richTextEditingData.cellPosition && (
          <Html
            divProps={{
              ['data-portal-isolated']: 'true',
              style: {
                position: 'absolute',
                zIndex: 1000,
                pointerEvents: 'auto',
                width: `${richTextEditingData.cellPosition.width}px`,
                height: `${richTextEditingData.cellPosition.height}px`,
              }
            } as any}
            transformFunc={(attrs: any) => {
              return {
                ...attrs,
                x: richTextEditingData.cellPosition.x,
                y: richTextEditingData.cellPosition.y,
              };
            }}
          >
            <KonvaErrorBoundary fallback={null}>
              <RichTextCellEditor
                isEditing={richTextEditingData.isEditing}
                cellPosition={{ x: 0, y: 0, width: richTextEditingData.cellPosition.width, height: richTextEditingData.cellPosition.height }}
                initialSegments={richTextEditingData.richTextSegments}
                onRichTextChange={richTextEditingData.onRichTextChange || (() => {})}
                onFinishEditing={richTextEditingData.onFinishEditing}
                onCancelEditing={richTextEditingData.onCancelEditing}
                defaultFormat={{
                  fontSize: richTextEditingData.fontSize || 14,
                  fontFamily: richTextEditingData.fontFamily || 'Inter',
                  textColor: richTextEditingData.textColor || '#1E293B',
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
            </KonvaErrorBoundary>
          </Html>
        )}
      </Stage>
    </div>
  );
};

export default KonvaCanvas;

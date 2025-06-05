import React, { useRef, useCallback, useEffect, useState, useMemo } from 'react';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import {
  Move,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Square,
  Circle,
  Triangle,
  StickyNote,
  Type,
  Pen,
  ArrowRight,
  Frame,
  Image,
  Palette,
  Grid3X3,
  Layers,
  Undo,
  Redo,
  Copy,
  Trash2,
  Download,
  Upload,
  Settings,
  Maximize2,
  MousePointer,
  Minus,
  Plus,
  Hand,
  Eraser
} from 'lucide-react';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '../ui/dropdown-menu';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { useWhiteboard } from '../../hooks/use-whiteboard-fixed';
import { 
  WhiteboardToolType, 
  AnyWhiteboardElement, 
  WhiteboardPoint, 
  WhiteboardBounds,
  WhiteboardShapeType 
} from '../../lib/whiteboard-types';
import { 
  WhiteboardColors, 
  WhiteboardCoordinates, 
  WhiteboardGrid,
  WhiteboardKeyboard 
} from '../../lib/whiteboard-utils';

interface WhiteboardCanvasProps {
  initialState?: any;
  onSave?: (state: any) => Promise<void>;
  className?: string;
  focusMode?: boolean;
  enableAutoSave?: boolean;
}

// Tool configuration
const TOOL_CONFIG = {
  select: { icon: MousePointer, label: 'Select', shortcut: 'V' },
  'sticky-note': { icon: StickyNote, label: 'Sticky Note', shortcut: 'S' },
  text: { icon: Type, label: 'Text', shortcut: 'T' },
  pen: { icon: Pen, label: 'Pen', shortcut: 'P' },
  shape: { icon: Square, label: 'Shape', shortcut: 'R' },
  line: { icon: Minus, label: 'Line', shortcut: 'L' },
  arrow: { icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
  frame: { icon: Frame, label: 'Frame', shortcut: 'F' },
  image: { icon: Image, label: 'Image', shortcut: 'I' },
  eraser: { icon: Eraser, label: 'Eraser', shortcut: 'E' }
} as const;

const SHAPE_TYPES: Array<{ type: WhiteboardShapeType; icon: React.ComponentType; label: string }> = [
  { type: 'rectangle', icon: Square, label: 'Rectangle' },
  { type: 'circle', icon: Circle, label: 'Circle' },
  { type: 'triangle', icon: Triangle, label: 'Triangle' },
  { type: 'diamond', icon: Square, label: 'Diamond' },
  { type: 'star', icon: Square, label: 'Star' },
  { type: 'hexagon', icon: Square, label: 'Hexagon' }
];

export function WhiteboardCanvas({
  initialState,
  onSave,
  className = '',
  focusMode = false,
  enableAutoSave = true
}: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<any>(null);
  
  // Interaction state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<WhiteboardPoint | null>(null);
  const [selectionBox, setSelectionBox] = useState<WhiteboardBounds | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [showMinimap, setShowMinimap] = useState(true);
  const [showLayers, setShowLayers] = useState(false);

  // Initialize whiteboard hook
  const {
    whiteboardState,
    toolState,
    viewport,
    selection,
    history,
    setActiveTool,
    createElement,
    updateElement,
    deleteElement,
    duplicateElement,
    moveElements,
    selectElement,
    selectElements,
    selectElementsInBounds,
    clearSelection,
    selectAll,
    setViewport,
    zoomIn,
    zoomOut,
    zoomToFit,
    zoomToSelection,
    resetZoom,
    panTo,
    undo,
    redo,
    canUndo,
    canRedo,
    screenToCanvas,
    canvasToScreen,
    getElementAtPoint,
    getVisibleElements,
    updateSettings,
    exportState,
    importState,
    updateContainerSize
  } = useWhiteboard({
    initialState,
    onSave,
    enableAutoSave
  });

  // Update container size when component mounts/resizes
  useEffect(() => {
    const updateSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect();
        updateContainerSize(rect.width, rect.height);
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, [updateContainerSize]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return; // Don't handle shortcuts when typing
      }

      // Tool shortcuts
      Object.entries(TOOL_CONFIG).forEach(([tool, config]) => {
        if (WhiteboardKeyboard.isShortcut(e, config.shortcut, false)) {
          e.preventDefault();
          setActiveTool(tool as WhiteboardToolType);
        }
      });

      // Action shortcuts
      if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.UNDO)) {
        e.preventDefault();
        undo();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.REDO)) {
        e.preventDefault();
        redo();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.COPY)) {
        e.preventDefault();
        if (selection.elementIds.length > 0) {
          selection.elementIds.forEach(duplicateElement);
        }
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.DELETE, false)) {
        e.preventDefault();
        selection.elementIds.forEach(deleteElement);
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.SELECT_ALL)) {
        e.preventDefault();
        selectAll();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.DESELECT_ALL, false)) {
        e.preventDefault();
        clearSelection();
      }

      // Zoom shortcuts
      if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.ZOOM_IN)) {
        e.preventDefault();
        zoomIn();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.ZOOM_OUT)) {
        e.preventDefault();
        zoomOut();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.ZOOM_TO_FIT)) {
        e.preventDefault();
        zoomToFit();
      } else if (WhiteboardKeyboard.isShortcut(e, WhiteboardKeyboard.SHORTCUTS.ZOOM_TO_SELECTION)) {
        e.preventDefault();
        zoomToSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    setActiveTool, undo, redo, duplicateElement, deleteElement, 
    selectAll, clearSelection, zoomIn, zoomOut, zoomToFit, zoomToSelection,
    selection.elementIds
  ]);

  // Mouse event handlers
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only left click

    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY });
    
    if (toolState.activeTool === 'select') {
      const elementAtPoint = getElementAtPoint(canvasPoint);
      
      if (elementAtPoint) {
        // Select element
        selectElement(elementAtPoint.id, e.ctrlKey || e.metaKey);
        setIsDragging(true);
        setDragStart(canvasPoint);
      } else {
        // Start selection box
        clearSelection();
        setDragStart(canvasPoint);
        setSelectionBox({ x: canvasPoint.x, y: canvasPoint.y, width: 0, height: 0 });
      }
    } else {
      // Create new element
      createElement(toolState.activeTool, canvasPoint);
      setActiveTool('select'); // Return to select tool
    }
  }, [
    toolState.activeTool, screenToCanvas, getElementAtPoint, 
    selectElement, clearSelection, createElement, setActiveTool
  ]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragStart) return;

    const canvasPoint = screenToCanvas({ x: e.clientX, y: e.clientY });
    
    if (toolState.activeTool === 'select') {
      if (selection.elementIds.length > 0 && isDragging) {
        // Move selected elements
        const delta = {
          x: canvasPoint.x - dragStart.x,
          y: canvasPoint.y - dragStart.y
        };
        moveElements(selection.elementIds, delta);
        setDragStart(canvasPoint);
      } else if (selectionBox) {
        // Update selection box
        const newBox = {
          x: Math.min(dragStart.x, canvasPoint.x),
          y: Math.min(dragStart.y, canvasPoint.y),
          width: Math.abs(canvasPoint.x - dragStart.x),
          height: Math.abs(canvasPoint.y - dragStart.y)
        };
        setSelectionBox(newBox);
      }
    }
  }, [
    dragStart, toolState.activeTool, selection.elementIds, isDragging,
    selectionBox, screenToCanvas, moveElements
  ]);

  const handleCanvasMouseUp = useCallback(() => {
    if (selectionBox && selectionBox.width > 5 && selectionBox.height > 5) {
      // Select elements in selection box
      selectElementsInBounds(selectionBox);
    }

    setIsDragging(false);
    setDragStart(null);
    setSelectionBox(null);
  }, [selectionBox, selectElementsInBounds]);

  // Render grid
  const renderGrid = useMemo(() => {
    if (!showGrid || !whiteboardState.settings.grid.enabled) return null;

    const gridSize = whiteboardState.settings.grid.size;
    const { vertical, horizontal } = WhiteboardGrid.getGridLines(
      viewport,
      gridSize,
      { width: 2000, height: 1500 } // Default canvas size
    );

    const gridLines = [
      ...vertical.map((x, i) => (
        <line
          key={`v-${i}`}
          x1={x}
          y1={0}
          x2={x}
          y2={1500}
          stroke={whiteboardState.settings.grid.color}
          strokeWidth={0.5}
          opacity={whiteboardState.settings.grid.opacity}
        />
      )),
      ...horizontal.map((y, i) => (
        <line
          key={`h-${i}`}
          x1={0}
          y1={y}
          x2={2000}
          y2={y}
          stroke={whiteboardState.settings.grid.color}
          strokeWidth={0.5}
          opacity={whiteboardState.settings.grid.opacity}
        />
      ))
    ];

    return (
      <svg 
        className="absolute inset-0 pointer-events-none" 
        style={{ zIndex: 0 }}
        width="100%" 
        height="100%"
      >
        {gridLines}
      </svg>
    );
  }, [showGrid, whiteboardState.settings.grid, viewport]);

  // Render element
  const renderElement = useCallback((element: AnyWhiteboardElement) => {
    const isSelected = selection.elementIds.includes(element.id);
    const screenPos = canvasToScreen(element.position);

    const commonProps = {
      key: element.id,
      className: `absolute cursor-pointer select-none ${isSelected ? 'ring-2 ring-blue-500' : ''}`,
      style: {
        left: screenPos.x,
        top: screenPos.y,
        width: element.size.width * viewport.zoom,
        height: element.size.height * viewport.zoom,
        zIndex: element.metadata.layer + 1,
        transform: `rotate(${element.transform.rotation}deg) scale(${element.transform.scaleX}, ${element.transform.scaleY})`
      },
      onMouseDown: (e: React.MouseEvent) => {
        e.stopPropagation();
        selectElement(element.id, e.ctrlKey || e.metaKey);
      },
      onDoubleClick: (e: React.MouseEvent) => {
        e.stopPropagation();
        // Handle double-click for editing
      }
    };

    switch (element.type) {
      case 'sticky-note':
        return (
          <div {...commonProps}>
            <Card 
              className="h-full w-full shadow-md hover:shadow-lg transition-shadow"
              style={{ 
                backgroundColor: element.style.color.fill,
                borderColor: element.style.color.stroke
              }}
            >
              <CardContent className="p-3 h-full">
                <Textarea
                  value={element.content}
                  onChange={(e) => updateElement(element.id, { content: e.target.value })}
                  className="w-full h-full border-none bg-transparent resize-none text-sm"
                  style={{ 
                    fontSize: (element.style.font?.size || 14) / viewport.zoom,
                    fontWeight: element.style.font?.weight || 'normal'
                  }}
                  placeholder="Enter text..."
                />
              </CardContent>
            </Card>
          </div>
        );

      case 'text':
        return (
          <div {...commonProps}>
            <div 
              className="h-full w-full p-2"
              style={{ 
                color: element.style.color.fill,
                fontSize: (element.style.font?.size || 16) / viewport.zoom,
                fontFamily: element.style.font?.family || 'Inter, sans-serif',
                fontWeight: element.style.font?.weight || 'normal',
                textAlign: element.style.font?.align || 'left'
              }}
            >
              <Textarea
                value={element.content}
                onChange={(e) => updateElement(element.id, { content: e.target.value })}
                className="w-full h-full border-none bg-transparent resize-none"
                placeholder="Enter text..."
              />
            </div>
          </div>
        );

      case 'shape':
        const shapeElement = element as any; // Type assertion for shape-specific properties
        return (
          <div {...commonProps}>
            <div 
              className="h-full w-full"
              style={{
                backgroundColor: element.style.color.fill,
                border: `${element.style.stroke.width}px ${element.style.stroke.style} ${element.style.color.stroke}`,
                borderRadius: shapeElement.shapeType === 'circle' ? '50%' : 
                             shapeElement.shapeType === 'rectangle' ? '8px' : '0'
              }}
            />
          </div>
        );

      case 'frame':
        const frameElement = element as any;
        return (
          <div {...commonProps}>
            <div 
              className="h-full w-full border-2 border-dashed"
              style={{
                borderColor: element.style.color.stroke,
                backgroundColor: 'transparent'
              }}
            >
              <div 
                className="absolute -top-6 left-0 text-sm font-medium"
                style={{ 
                  color: element.style.color.stroke,
                  fontSize: 12 / viewport.zoom
                }}
              >
                {frameElement.title}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  }, [selection.elementIds, canvasToScreen, viewport.zoom, selectElement, updateElement]);

  // Get visible elements for performance
  const visibleElements = useMemo(() => {
    return getVisibleElements();
  }, [getVisibleElements, whiteboardState.elements, viewport]);

  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Toolbar */}
      {!focusMode && (
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
          {/* Left side - Tools */}
          <div className="flex items-center gap-2">
            {/* Tool palette */}
            <div className="flex items-center gap-1 mr-4">
              {Object.entries(TOOL_CONFIG).map(([tool, config]) => {
                const Icon = config.icon;
                return (
                  <Button
                    key={tool}
                    variant={toolState.activeTool === tool ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTool(tool as WhiteboardToolType)}
                    title={`${config.label} (${config.shortcut})`}
                  >
                    <Icon className="h-4 w-4" />
                  </Button>
                );
              })}
            </div>

            {/* Shape selector for shape tool */}
            {toolState.activeTool === 'shape' && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Square className="h-4 w-4 mr-2" />
                    Shape
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  {SHAPE_TYPES.map(({ type, icon: IconComponent, label }) => {
                    const Icon = IconComponent as React.ComponentType<{ className?: string }>;
                    return (
                      <DropdownMenuItem key={type} onClick={() => {
                        // This would update tool state in a real implementation
                        // For now, we'll just create the shape with the selected type
                        console.log('Selected shape type:', type);
                      }}>
                        <Icon className="h-4 w-4 mr-2" />
                        {label}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Center - Canvas name */}
          <div className="flex items-center gap-2">
            <Input
              value={whiteboardState.name}
              onChange={(e) => {
                // Update canvas name using proper state management
                importState({ name: e.target.value });
              }}
              className="text-lg font-semibold border-none bg-transparent text-center"
              placeholder="Untitled Whiteboard"
            />
          </div>

          {/* Right side - View controls */}
          <div className="flex items-center gap-2">
            {/* History controls */}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={undo} 
              disabled={!canUndo}
              title="Undo (Ctrl+Z)"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={redo} 
              disabled={!canRedo}
              title="Redo (Ctrl+Y)"
            >
              <Redo className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Zoom controls */}
            <Button variant="ghost" size="sm" onClick={zoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground min-w-[4rem] text-center">
              {Math.round(viewport.zoom * 100)}%
            </span>
            <Button variant="ghost" size="sm" onClick={zoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={resetZoom}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={zoomToFit}>
              <Maximize2 className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* View options */}
            <Button
              variant={showGrid ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowGrid(!showGrid)}
              title="Toggle Grid (G)"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>

            <Button
              variant={showLayers ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowLayers(!showLayers)}
              title="Layers"
            >
              <Layers className="h-4 w-4" />
            </Button>

            {/* Settings */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-64">
                <div className="p-3 space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="show-grid">Show Grid</Label>
                    <Switch
                      id="show-grid"
                      checked={whiteboardState.settings.grid.enabled}
                      onCheckedChange={(checked) => 
                        updateSettings({ 
                          grid: { ...whiteboardState.settings.grid, enabled: checked }
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="snap-to-grid">Snap to Grid</Label>
                    <Switch
                      id="snap-to-grid"
                      checked={whiteboardState.settings.grid.snapEnabled}
                      onCheckedChange={(checked) => 
                        updateSettings({ 
                          grid: { ...whiteboardState.settings.grid, snapEnabled: checked }
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Grid Size</Label>
                    <Slider
                      value={[whiteboardState.settings.grid.size]}
                      onValueChange={([value]) => 
                        updateSettings({ 
                          grid: { ...whiteboardState.settings.grid, size: value }
                        })
                      }
                      min={10}
                      max={50}
                      step={5}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Background Color</Label>
                    <div className="grid grid-cols-6 gap-1">
                      {WhiteboardColors.STICKY_NOTE_COLORS.map(color => (
                        <button
                          key={color}
                          className={`w-6 h-6 rounded border-2 ${
                            whiteboardState.settings.backgroundColor === color 
                              ? 'border-blue-500' 
                              : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: color }}
                          onClick={() => updateSettings({ backgroundColor: color })}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* Canvas Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          ref={canvasRef}
          className="w-full h-full relative"
          style={{ backgroundColor: whiteboardState.settings.backgroundColor }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Grid */}
          {renderGrid}

          {/* Elements */}
          <div className="absolute inset-0">
            {visibleElements.map(renderElement)}
          </div>

          {/* Selection box */}
          {selectionBox && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-500 bg-opacity-10 pointer-events-none"
              style={{
                left: selectionBox.x,
                top: selectionBox.y,
                width: selectionBox.width,
                height: selectionBox.height
              }}
            />
          )}
        </div>

        {/* Selection controls */}
        {selection.elementIds.length > 0 && (
          <div className="absolute top-4 left-4 bg-background border border-border rounded-lg shadow-lg p-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">
                {selection.elementIds.length} selected
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selection.elementIds.forEach(duplicateElement)}
                title="Duplicate (Ctrl+D)"
              >
                <Copy className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => selection.elementIds.forEach(deleteElement)}
                className="text-red-600 hover:text-red-700"
                title="Delete (Del)"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              {selection.elementIds.length === 1 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Palette className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <div className="p-2">
                      <div className="grid grid-cols-4 gap-1">
                        {WhiteboardColors.STICKY_NOTE_COLORS.map(color => (
                          <button
                            key={color}
                            className="w-6 h-6 rounded border border-gray-300"
                            style={{ backgroundColor: color }}
                            onClick={() => updateElement(selection.elementIds[0], {
                              style: {
                                color: { fill: color, stroke: '#000000', opacity: 1 },
                                stroke: { width: 2, style: 'solid' }
                              }
                            })}
                          />
                        ))}
                      </div>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        )}

        {/* Minimap */}
        {showMinimap && !focusMode && (
          <div className="absolute bottom-4 right-4 w-48 h-32 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
            <div className="w-full h-full relative bg-gray-50">
              <div className="text-xs p-2 border-b border-border bg-background">
                Overview
              </div>
              <div className="absolute inset-0 top-6">
                {whiteboardState.elements.map(element => (
                  <div
                    key={element.id}
                    className="absolute bg-blue-500 opacity-60 rounded"
                    style={{
                      left: `${(element.position.x / 2000) * 100}%`,
                      top: `${(element.position.y / 1500) * 100}%`,
                      width: `${Math.max(2, (element.size.width / 2000) * 100)}%`,
                      height: `${Math.max(2, (element.size.height / 1500) * 100)}%`
                    }}
                  />
                ))}
                {/* Viewport indicator */}
                <div
                  className="absolute border-2 border-red-500 bg-red-500 bg-opacity-20"
                  style={{
                    left: `${Math.max(0, (-viewport.x / viewport.zoom / 2000) * 100)}%`,
                    top: `${Math.max(0, (-viewport.y / viewport.zoom / 1500) * 100)}%`,
                    width: `${Math.min(100, (800 / viewport.zoom / 2000) * 100)}%`,
                    height: `${Math.min(100, (600 / viewport.zoom / 1500) * 100)}%`
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Status bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-2">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-4">
              <span>{whiteboardState.elements.length} elements</span>
              <span>Zoom: {Math.round(viewport.zoom * 100)}%</span>
              {selection.elementIds.length > 0 && (
                <span>{selection.elementIds.length} selected</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">
                {toolState.activeTool}
              </Badge>
              {canUndo || canRedo ? (
                <span>{history.undoStack.length} actions</span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
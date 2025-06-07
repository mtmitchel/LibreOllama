import React, { useState, useRef, useCallback } from 'react';
import {
  MousePointer2,
  Type,
  StickyNote,
  RectangleHorizontal,
  Circle,
  Share,
  Pencil,
  MousePointerClick,
  ChevronRight,
  Search,
  Plus,
  Share2
} from 'lucide-react';
import { PageLayout } from '../components/ui/PageLayout';

interface CanvasElement {
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
}

type CanvasTool = 'select' | 'text' | 'sticky-note' | 'rectangle' | 'circle' | 'line' | 'pen';

const Canvas: React.FC = () => {
  const [activeTool, setActiveTool] = useState<CanvasTool>('select');
  const [elements, setElements] = useState<CanvasElement[]>([
    {
      id: '1',
      type: 'sticky-note',
      x: 50,
      y: 120,
      width: 180,
      height: 180,
      content: 'Brainstorm ideas for the new feature',
      color: '#facc15'
    },
    {
      id: '2',
      type: 'sticky-note',
      x: 280,
      y: 120,
      width: 180,
      height: 180,
      content: 'User research findings',
      color: '#fb7185'
    },
    {
      id: '3',
      type: 'rectangle',
      x: 500,
      y: 150,
      width: 120,
      height: 80,
      color: 'var(--accent-primary)'
    },
    {
      id: '4',
      type: 'circle',
      x: 100,
      y: 350,
      width: 100,
      height: 100,
      color: '#10b981'
    },
    {
      id: '5',
      type: 'text',
      x: 300,
      y: 50,
      content: 'Project Brainstorming Session'
    }
  ]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const tools = [
    { id: 'select', icon: MousePointer2, title: 'Select' },
    { id: 'text', icon: Type, title: 'Text' },
    { id: 'sticky-note', icon: StickyNote, title: 'Sticky Note' },
    { id: 'rectangle', icon: RectangleHorizontal, title: 'Rectangle' },
    { id: 'circle', icon: Circle, title: 'Circle' },
    { id: 'line', icon: Share, title: 'Line/Connector' },
    { id: 'pen', icon: Pencil, title: 'Pen' }
  ];

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (activeTool === 'select' || isDragging) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const newElement: CanvasElement = {
      id: Date.now().toString(),
      type: activeTool as 'sticky-note' | 'rectangle' | 'circle' | 'text',
      x,
      y,
      width: activeTool === 'sticky-note' ? 180 : activeTool === 'rectangle' ? 120 : activeTool === 'circle' ? 100 : undefined,
      height: activeTool === 'sticky-note' ? 180 : activeTool === 'rectangle' ? 80 : activeTool === 'circle' ? 100 : undefined,
      content: activeTool === 'sticky-note' ? '' : activeTool === 'text' ? 'New text' : undefined
    };

    setElements(prev => [...prev, newElement]);
    setActiveTool('select');
  }, [activeTool, isDragging]);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    if (activeTool !== 'select') return;

    const element = elements.find(el => el.id === elementId);
    if (!element) return;

    setSelectedElement(elementId);
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - element.x,
      y: e.clientY - element.y
    });
  }, [activeTool, elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: newX, y: newY }
        : el
    ));
  }, [isDragging, selectedElement, dragOffset]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  const handleElementContentChange = useCallback((elementId: string, content: string) => {
    setElements(prev => prev.map(el => 
      el.id === elementId 
        ? { ...el, content }
        : el
    ));
  }, []);

  const renderElement = (element: CanvasElement) => {
    const style = {
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height
    };

    const handleMouseDown = (e: React.MouseEvent) => {
      handleElementMouseDown(e, element.id);
    };

    switch (element.type) {
      case 'sticky-note':
        return (
          <div
            key={element.id}
            className="canvas-element sticky-note"
            style={{
              ...style,
              background: element.color || '#facc15'
            }}
            onMouseDown={handleMouseDown}
          >
            <textarea
              defaultValue={element.content}
              placeholder="Type your note..."
              onMouseDown={(e) => e.stopPropagation()}
              className="bg-transparent border-none outline-none w-full h-full resize-none font-inherit text-sm text-gray-800"
            />
          </div>
        );
      case 'rectangle':
        return (
          <div
            key={element.id}
            className="canvas-element canvas-shape rectangle rounded-md border-2 border-white/20"
            style={{
              ...style,
              background: element.color || 'var(--accent-primary)'
            }}
            onMouseDown={handleMouseDown}
          />
        );
      case 'circle':
        return (
          <div
            key={element.id}
            className="canvas-element canvas-shape circle rounded-full border-2 border-white/20"
            style={{
              ...style,
              background: element.color || 'var(--success)'
            }}
            onMouseDown={handleMouseDown}
          />
        );
      case 'text':
        return (
          <div
            key={element.id}
            className="canvas-element canvas-text text-lg font-semibold whitespace-nowrap"
            style={{
              left: element.x,
              top: element.y,
              color: element.color || 'var(--text-primary)'
            }}
            onMouseDown={handleMouseDown}
          >
            {element.content}
          </div>
        );
      default:
        return null;
    }
  };

  const handleNewCanvas = () => {
    // TODO: Implement new canvas creation
    console.log('Create new canvas');
  };

  const handleShareCanvas = () => {
    // TODO: Implement canvas sharing
    console.log('Share canvas');
  };

  const headerProps = {
    title: "Canvas",
    primaryAction: {
      label: 'New canvas',
      onClick: handleNewCanvas,
      icon: <Plus size={16} />
    },
    secondaryActions: [
      {
        label: 'Share',
        onClick: handleShareCanvas,
        variant: 'ghost'
      }
    ]
  };

  return (
    <PageLayout headerProps={headerProps}>
      <div className="canvas-layout">
        {/* Canvas Toolbar */}
        <div className="canvas-toolbar-wrapper">
          <div className="canvas-toolbar">
            {tools.map((tool) => {
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  className={`canvas-tool ${activeTool === tool.id ? 'active' : ''}`}
                  title={tool.title}
                  onClick={() => setActiveTool(tool.id as CanvasTool)}
                >
                  <Icon size={20} />
                </button>
              );
            })}
          </div>
        </div>

      {/* Canvas Area */}
      <div 
        className="canvas-area"
        ref={canvasRef}
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        <div className="canvas-grid" />
        
        {/* Canvas Elements */}
        {elements.map(renderElement)}

        {/* Empty State */}
        {elements.length === 0 && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-text-muted text-center">
            <MousePointerClick size={48} className="mb-3" />
            <p>Use the toolbar to add elements to your canvas.</p>
          </div>
        )}
      </div>

      {/* Minimap */}
      <div className="minimap">
        {/* Minimap content would be a scaled down version of canvas-area */}
      </div>

      {/* Properties Panel */}
      <div className={`properties-panel ${selectedElement ? 'block' : 'hidden'}`}>
        <h3 className="properties-title">Element Properties</h3>
        {selectedElement ? (
          <div>
            <p className="text-text-tertiary text-xs">
              Selected: {elements.find(el => el.id === selectedElement)?.type}
            </p>
            <button 
              onClick={() => {
                setElements(prev => prev.filter(el => el.id !== selectedElement));
                setSelectedElement(null);
              }}
              className="mt-3 px-3 py-2 bg-accent-primary text-white border-none rounded-md cursor-pointer text-xs"
            >
              Delete Element
            </button>
          </div>
        ) : (
          <p className="text-text-tertiary text-xs">
            Select an element to see its properties.
          </p>
        )}
      </div>
      </div>
    </PageLayout>
  );
};

export default Canvas;
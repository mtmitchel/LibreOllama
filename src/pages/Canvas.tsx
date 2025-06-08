import React, { useState, useRef, useCallback, useEffect } from 'react';
import { 
  MousePointer2, 
  Type, 
  StickyNote, 
  RectangleHorizontal, 
  Circle, 
  Share, 
  Pencil, 
  Plus,
  MousePointerClick
} from 'lucide-react';
import { Card, Button } from '../components/ui'; // Updated to use Button from ui/index.tsx
import { useHeader } from '../contexts/HeaderContext';

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
  const { setHeaderProps } = useHeader();
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
    { id: 'line', icon: Share, title: 'Line/Connector' }, // Share icon seems to be a placeholder, consider using a more appropriate icon for 'Line/Connector'
    { id: 'pen', icon: Pencil, title: 'Pen' }
  ];

  const handleNewCanvas = useCallback(() => {
    // TODO: Implement new canvas functionality
    console.log('New canvas clicked');
  }, []);

  const handleShareCanvas = useCallback(() => {
    // TODO: Implement share canvas functionality
    console.log('Share canvas clicked');
  }, []);

  useEffect(() => {
    setHeaderProps({
      title: "Canvas",
      primaryAction: {
        label: 'New canvas',
        onClick: handleNewCanvas,
        icon: <Plus size={16} />,
        variant: 'primary' // Added variant for consistency
      },
      secondaryActions: [
        {
          label: 'Share',
          onClick: handleShareCanvas,
          icon: <Share size={16} />,
          variant: 'secondary' // Added variant for consistency
        }
      ]
    });
  }, [setHeaderProps, handleNewCanvas, handleShareCanvas]);

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

    const isSelected = selectedElement === element.id;

    switch (element.type) {
      case 'sticky-note':
        return (
          // Using Card for sticky notes for consistent styling and shadow.
          <Card
            key={element.id}
            className={`absolute cursor-move p-3 ${
              isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
            }`}
            style={{
              ...style,
              backgroundColor: element.color || '#facc15'
            }}
            onMouseDown={handleMouseDown}
          >
            <textarea
              defaultValue={element.content}
              placeholder="Type your note..."
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-sm text-gray-800 placeholder-gray-500"
            // style={{ color: 'rgba(0, 0, 0, 0.8)' }} // Removed direct style, rely on Tailwind or Card defaults
            />
          </Card>
        );
      case 'rectangle':
        return (
          // Rectangles and Circles are not Cards by default. Removed shadow-lg for a flatter design, consistent with less prominent elements.
          <div
            key={element.id}
            className={`absolute cursor-move rounded-md ${ // Removed border-2 border-white/20 and shadow-lg
              isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
            }`}
            style={{
              ...style,
              backgroundColor: element.color || '#3b82f6'
            }}
            onMouseDown={handleMouseDown}
          />
        );
      case 'circle':
        return (
          // Similar to rectangle, removed shadow-lg and border for flatter design.
          <div
            key={element.id}
            className={`absolute cursor-move rounded-full ${ // Removed border-2 border-white/20 and shadow-lg
              isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
            }`}
            style={{
              ...style,
              backgroundColor: element.color || '#10b981'
            }}
            onMouseDown={handleMouseDown}
          />
        );
      case 'text':
        return (
          // Minimal styling for text elements, ensuring they are selectable and fit with the overall design.
          <div
            key={element.id}
            className={`absolute cursor-move p-1 ${ // Added minimal padding for easier selection with ring.
              isSelected ? 'ring-2 ring-accent ring-offset-2 rounded px-2 py-1' : ''
            }`}
            style={{
              left: element.x,
              top: element.y,
              // color: element.color || 'currentColor' // Rely on className for text color if possible
            }}
            onMouseDown={handleMouseDown}
          >
            {/* Using an input for editable text, styled to be unobtrusive */}
            <input 
              type="text"
              defaultValue={element.content}
              className="bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded text-text-primary text-lg"
              onMouseDown={(e) => e.stopPropagation()} // Prevent canvas click when clicking text input
              // onBlur={(e) => updateElementContent(element.id, e.target.value)} // Example: update on blur
            />
          </div>
        );
      default:
        return null;
    }
  };

  // The header is now set up within the useEffect hook above.

  // The header is now set up within the useEffect hook above, so the explicit Page Header div is removed.

  return (
    // Added p-4 and gap-4 for consistent padding and spacing around the page content.
    // Changed bg-bg-secondary to bg-bg-app for consistency with other pages.
    <div className="relative w-full h-full bg-bg-app overflow-hidden flex flex-col p-4 gap-4">
      {/* Toolbar */}
      {/* Standardized Card usage for the toolbar. 
          Positioned it at the top, centered, using self-start to prevent stretching.
          Added p-2 and gap-2 for internal spacing. Uses Button component. 
      */}
      <Card padding="none" className="p-2 flex gap-2 items-center justify-center self-start z-10">
        {tools.map(tool => (
          <Button
            key={tool.id}
            title={tool.title}
            variant={activeTool === tool.id ? 'primary' : 'ghost'}
            size="icon"
            onClick={() => setActiveTool(tool.id as CanvasTool)}
          >
            <tool.icon size={18} />
          </Button>
        ))}
      </Card>

      {/* Canvas Area */}
      {/* Standardized canvas area appearance to match Card styling (bg-surface, border, shadow) 
          Ensured it fills available space with flex-1.
      */}
      <div 
        ref={canvasRef} 
        className="flex-1 bg-bg-surface border border-border-subtle rounded-lg shadow-sm relative overflow-hidden cursor-crosshair"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp} // Added onMouseLeave to handle mouse up outside canvas
      >
        {elements.map(renderElement)}
      </div>
    </div>
  );
};

export default Canvas;
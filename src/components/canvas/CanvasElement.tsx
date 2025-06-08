import React, { memo, useCallback } from 'react';
import { 
  Link
} from 'lucide-react';
import { Card } from '../ui';

export interface CanvasElement { // Added export
  id: string;
  type: 'sticky-note' | 'rectangle' | 'circle' | 'text' | 'triangle' | 'square' | 'hexagon' | 'star' | 'drawing' | 'line' | 'arrow' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  content?: string;
  color?: string;
  backgroundColor?: string;
  url?: string;
  path?: string;
  x2?: number;
  y2?: number;
  imageUrl?: string;
  imageName?: string;
  fontSize?: 'small' | 'medium' | 'large';
  isBold?: boolean;
  isItalic?: boolean;
  isBulletList?: boolean;
  textAlignment?: 'left' | 'center' | 'right';
}

interface CanvasElementProps {
  element: CanvasElement;
  isSelected: boolean;
  onMouseDown: (e: React.MouseEvent, elementId: string) => void;
  onTextFormatting: (elementId: string, rect: DOMRect) => void;
  onTextChange: (elementId: string, content: string) => void;
  onTextFormatPropertyChange: (elementId: string, property: keyof CanvasElement, value: any) => void;
  getTextStyles: (element: CanvasElement) => React.CSSProperties;
}

const CanvasElementComponent: React.FC<CanvasElementProps> = memo(({
  element,
  isSelected,
  onMouseDown,
  onTextFormatting,
  onTextChange,
  onTextFormatPropertyChange,
  getTextStyles
}) => {
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    onMouseDown(e, element.id);
  }, [onMouseDown, element.id]);

  const handleTextFocus = useCallback((e: React.FocusEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onTextFormatting(element.id, rect);
  }, [onTextFormatting, element.id]);

  const handleTextChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    onTextChange(element.id, e.target.value);
  }, [onTextChange, element.id]);

  const handleTextInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const value = (e.target as HTMLTextAreaElement).value;
    onTextFormatPropertyChange(element.id, 'content', value);
  }, [onTextFormatPropertyChange, element.id]);

  // Add will-change CSS property for selected/dragged elements for GPU acceleration
  const getElementStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {};
    if (isSelected) {
      baseStyles.willChange = 'transform, box-shadow';
    }
    return baseStyles;
  }, [isSelected]);

  switch (element.type) {
    case 'sticky-note':
      return (
        <Card
          key={element.id}
          className={`absolute cursor-move p-3 transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            backgroundColor: element.color || '#facc15',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          {element.url ? (
            <a
              href={element.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => e.stopPropagation()}
            >
              <textarea
                defaultValue={element.content}
                placeholder="Type your note..."
                onMouseDown={(e) => e.stopPropagation()}
                className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-800 placeholder-gray-500 pointer-events-none"
                style={{
                  ...getTextStyles(element),
                  whiteSpace: 'pre-wrap'
                }}
                readOnly
              />
              <Link size={12} className="absolute bottom-1 right-1" />
            </a>
          ) : (
            <textarea
              defaultValue={element.content}
              placeholder="Type your note..."
              onMouseDown={(e) => e.stopPropagation()}
              className="w-full h-full bg-transparent border-none resize-none focus:outline-none text-gray-800 placeholder-gray-500"
              style={{
                ...getTextStyles(element),
                whiteSpace: 'pre-wrap'
              }}
              onFocus={handleTextFocus}
              onBlur={() => {
                // Text formatting will be handled by parent component
              }}
              onChange={handleTextChange}
              onInput={handleTextInput}
            />
          )}
        </Card>
      );

    case 'rectangle':
    case 'square':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move rounded-md transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            backgroundColor: element.color || '#3b82f6',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        />
      );

    case 'circle':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move rounded-full transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            backgroundColor: element.color || '#10b981',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        />
      );

    case 'triangle':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: 0,
            height: 0,
            borderLeft: `${(element.width || 60) / 2}px solid transparent`,
            borderRight: `${(element.width || 60) / 2}px solid transparent`,
            borderBottom: `${element.height || 60}px solid ${element.color || '#8b5cf6'}`,
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        />
      );

    case 'star':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{ 
            left: element.x, 
            top: element.y,
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          <svg width={element.width || 60} height={element.height || 60}>
            <polygon
              points="30,2 37,20 57,20 42,32 48,52 30,40 12,52 18,32 3,20 23,20"
              fill={element.color || '#f59e0b'}
            />
          </svg>
        </div>
      );

    case 'hexagon':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{ 
            left: element.x, 
            top: element.y,
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          <svg width={element.width || 60} height={element.height || 60}>
            <polygon
              points="30,2 52,15 52,45 30,58 8,45 8,15"
              fill={element.color || '#06b6d4'}
            />
          </svg>
        </div>
      );

    case 'drawing':
      return (
        <svg
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 pointer-events-none ${
            isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
          }`}
          style={{ 
            left: 0, 
            top: 0, 
            width: '100%', 
            height: '100%',
            ...getElementStyles()
          }}
        >
          <path
            d={element.path}
            stroke={element.color || '#000000'}
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );

    case 'text':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move p-1 transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 rounded px-2 py-1 bg-white/80' : ''
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            backgroundColor: element.backgroundColor || 'transparent',
            borderRadius: element.backgroundColor ? '4px' : '0',
            padding: element.backgroundColor ? '4px 8px' : '4px',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          {element.url ? (
            <a
              href={element.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 underline"
              onClick={(e) => e.stopPropagation()}
            >
              {element.isBulletList ? (
                <textarea
                  defaultValue={element.content}
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded pointer-events-none resize-none"
                  style={{
                    ...getTextStyles(element),
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden'
                  }}
                  readOnly
                />
              ) : (
                <input 
                  type="text"
                  defaultValue={element.content}
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded pointer-events-none"
                  style={{
                    ...getTextStyles(element),
                    minHeight: '100%'
                  }}
                  readOnly
                />
              )}
              <Link size={12} className="inline ml-1" />
            </a>
          ) : (
            <>
              {element.isBulletList ? (
                <textarea
                  defaultValue={element.content}
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded text-text-primary resize-none"
                  style={{
                    ...getTextStyles(element),
                    whiteSpace: 'pre-wrap',
                    overflow: 'hidden'
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={handleTextFocus}
                  onBlur={() => {
                    // Text formatting will be handled by parent component
                  }}
                  onChange={handleTextChange}
                />
              ) : (
                <input 
                  type="text"
                  defaultValue={element.content}
                  className="w-full h-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-accent rounded text-text-primary"
                  style={{
                    ...getTextStyles(element),
                    minHeight: '100%'
                  }}
                  onMouseDown={(e) => e.stopPropagation()}
                  onFocus={handleTextFocus}
                  onBlur={() => {
                    // Text formatting will be handled by parent component
                  }}
                  onChange={handleTextChange}
                />
              )}
            </>
          )}
        </div>
      );

    case 'line':
      return (
        <svg
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
          }`}
          style={{
            left: Math.min(element.x, element.x2 || element.x) - 2,
            top: Math.min(element.y, element.y2 || element.y) - 2,
            width: Math.abs((element.x2 || element.x) - element.x) + 4,
            height: Math.abs((element.y2 || element.y) - element.y) + 4,
            pointerEvents: 'auto',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          <line
            x1={element.x - Math.min(element.x, element.x2 || element.x) + 2}
            y1={element.y - Math.min(element.y, element.y2 || element.y) + 2}
            x2={(element.x2 || element.x) - Math.min(element.x, element.x2 || element.x) + 2}
            y2={(element.y2 || element.y) - Math.min(element.y, element.y2 || element.y) + 2}
            stroke={element.color || '#000000'}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      );

    case 'arrow':
      return (
        <svg
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2' : ''
          }`}
          style={{
            left: Math.min(element.x, element.x2 || element.x) - 10,
            top: Math.min(element.y, element.y2 || element.y) - 10,
            width: Math.abs((element.x2 || element.x) - element.x) + 20,
            height: Math.abs((element.y2 || element.y) - element.y) + 20,
            pointerEvents: 'auto',
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          <defs>
            <marker
              id={`arrowhead-${element.id}`}
              markerWidth="10"
              markerHeight="7"
              refX="10"
              refY="3.5"
              orient="auto"
            >
              <polygon
                points="0 0, 10 3.5, 0 7"
                fill={element.color || '#000000'}
              />
            </marker>
          </defs>
          <line
            x1={element.x - Math.min(element.x, element.x2 || element.x) + 10}
            y1={element.y - Math.min(element.y, element.y2 || element.y) + 10}
            x2={(element.x2 || element.x) - Math.min(element.x, element.x2 || element.x) + 10}
            y2={(element.y2 || element.y) - Math.min(element.y, element.y2 || element.y) + 10}
            stroke={element.color || '#000000'}
            strokeWidth="2"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            markerEnd={`url(#arrowhead-${element.id})`}
          />
        </svg>
      );

    case 'image':
      return (
        <div
          key={element.id}
          className={`absolute cursor-move transition-all duration-200 ${
            isSelected ? 'ring-2 ring-accent ring-offset-2 shadow-lg scale-105' : 'hover:shadow-md'
          }`}
          style={{
            left: element.x,
            top: element.y,
            width: element.width,
            height: element.height,
            ...getElementStyles()
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            src={element.imageUrl}
            alt={element.imageName || 'Canvas image'}
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
        </div>
      );

    default:
      return null;
  }
}, (prevProps, nextProps) => {
  // Custom comparison function for memo optimization
  // Only re-render if element properties or selection state change
  return (
    prevProps.element.id === nextProps.element.id &&
    prevProps.isSelected === nextProps.isSelected &&
    JSON.stringify(prevProps.element) === JSON.stringify(nextProps.element)
  );
});

CanvasElementComponent.displayName = 'CanvasElement';

export default CanvasElementComponent;

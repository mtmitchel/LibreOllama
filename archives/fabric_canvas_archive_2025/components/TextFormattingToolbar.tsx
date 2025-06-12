import React from 'react';
import {
  Bold,
  Italic,
  List,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link
} from 'lucide-react';
import { Card, Button } from '../ui';
import { CanvasElement } from '../../stores/fabricCanvasStore';

interface TextFormattingToolbarProps {
  elementId: string;
  element: CanvasElement;
  position: { left: number; top: number };
  onToggleFormat: (elementId: string, formatType: 'isBold' | 'isItalic' | 'isBulletList') => void;
  onSetFontSize: (elementId: string, fontSize: 'small' | 'medium' | 'large') => void;
  onSetAlignment: (elementId: string, alignment: 'left' | 'center' | 'right') => void;
  onSetUrl: (elementId: string) => void;
  onUpdateContent: (elementId: string, content: string) => void;
}

export const TextFormattingToolbar: React.FC<TextFormattingToolbarProps> = ({
  elementId,
  element,
  position,
  onToggleFormat,
  onSetFontSize,
  onSetAlignment,
  onSetUrl,
  onUpdateContent
}) => {
  // Ensure toolbar stays within viewport bounds
  const adjustedPosition = {
    left: Math.max(10, Math.min(position.left, window.innerWidth - 320)), // 320px toolbar width + 10px margin
    top: Math.max(10, Math.min(position.top, window.innerHeight - 200)) // 200px toolbar height + 10px margin
  };

  return (
    <div 
      className="fixed z-50 text-formatting-toolbar" 
      style={{
        left: `${adjustedPosition.left}px`,
        top: `${adjustedPosition.top}px`
      }}
    >
      <Card className="p-4 min-w-80 shadow-xl border border-border-subtle bg-bg-primary">
        <div className="flex flex-col gap-3">
          {/* Font Size Row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Size:</span>
            <div className="flex gap-2">
              {(['small', 'medium', 'large'] as const).map(size => (
                <Button
                  key={size}
                  variant={element.fontSize === size ? 'primary' : 'ghost'}
                  size="sm"
                  className="h-9 px-4 text-sm capitalize font-medium"
                  onClick={() => onSetFontSize(elementId, size)}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Formatting Options Row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Format:</span>
            <div className="flex gap-2">
              <Button
                variant={element.isBold ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => onToggleFormat(elementId, 'isBold')}
                title="Bold"
              >
                <Bold size={20} />
              </Button>
              <Button
                variant={element.isItalic ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => onToggleFormat(elementId, 'isItalic')}
                title="Italic"
              >
                <Italic size={20} />
              </Button>
              <Button
                variant={element.isBulletList ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => {
                  if (element.content) {
                    const newContent = element.isBulletList 
                      ? removeBulletFormatting(element.content)
                      : formatBulletText(element.content);
                    onUpdateContent(elementId, newContent);
                  }
                  onToggleFormat(elementId, 'isBulletList');
                }}
                title="Bullet List"
              >
                <List size={20} />
              </Button>
            </div>
          </div>

          {/* Alignment Row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Align:</span>
            <div className="flex gap-2">
              <Button
                variant={element.textAlignment === 'left' ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => onSetAlignment(elementId, 'left')}
                title="Align Left"
              >
                <AlignLeft size={20} />
              </Button>
              <Button
                variant={element.textAlignment === 'center' ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => onSetAlignment(elementId, 'center')}
                title="Align Center"
              >
                <AlignCenter size={20} />
              </Button>
              <Button
                variant={element.textAlignment === 'right' ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 w-10 p-2 flex items-center justify-center"
                onClick={() => onSetAlignment(elementId, 'right')}
                title="Align Right"
              >
                <AlignRight size={20} />
              </Button>
            </div>
          </div>

          {/* URL Row */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-text-secondary mr-3 min-w-fit font-medium">Link:</span>
            <div className="flex gap-2">
              <Button
                variant={element.url ? 'primary' : 'ghost'}
                size="sm"
                className="h-10 px-4 text-sm flex items-center gap-2 font-medium"
                onClick={() => onSetUrl(elementId)}
                title="Add/Edit URL"
              >
                <Link size={18} />
                {element.url ? 'Edit' : 'Add'} URL
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// Helper functions for bullet formatting
const formatBulletText = (text: string) => {
  if (!text) return text;
  
  const lines = text.split('\n');
  return lines.map(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('•')) {
      return `• ${trimmedLine}`;
    }
    return line;
  }).join('\n');
};

const removeBulletFormatting = (text: string) => {
  if (!text) return text;
  
  const lines = text.split('\n');
  return lines.map(line => {
    return line.replace(/^•\s*/, '');
  }).join('\n');
};

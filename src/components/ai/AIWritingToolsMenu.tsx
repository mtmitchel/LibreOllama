import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Card, Button, Text } from '../ui';
import { 
  Sparkles, 
  Edit3, 
  FileText, 
  Languages, 
  CheckCircle,
  MessageSquare,
  Lightbulb,
  Zap,
  ArrowRight,
  X
} from 'lucide-react';
import { cn } from '../../core/lib/utils';
import type { TextSelection } from '../../core/hooks/useTextSelection';

interface AIWritingToolsMenuProps {
  selection: TextSelection;
  onClose: () => void;
  onAction: (action: AIAction, text: string) => void;
}

export type AIAction = 
  | 'rewrite-professional'
  | 'rewrite-friendly' 
  | 'rewrite-concise'
  | 'rewrite-expanded'
  | 'proofread'
  | 'summarize'
  | 'translate'
  | 'explain'
  | 'create-task'
  | 'create-note'
  | 'ask-ai';

interface MenuItem {
  id: AIAction;
  label: string;
  icon: React.ReactNode;
  description?: string;
  category: 'rewrite' | 'edit' | 'transform' | 'create';
}

const menuItems: MenuItem[] = [
  // Rewrite options
  { id: 'rewrite-professional', label: 'Professional', icon: <Edit3 size={16} />, category: 'rewrite' },
  { id: 'rewrite-friendly', label: 'Friendly', icon: <Edit3 size={16} />, category: 'rewrite' },
  { id: 'rewrite-concise', label: 'Concise', icon: <Edit3 size={16} />, category: 'rewrite' },
  { id: 'rewrite-expanded', label: 'Expanded', icon: <Edit3 size={16} />, category: 'rewrite' },
  
  // Edit options
  { id: 'proofread', label: 'Proofread', icon: <CheckCircle size={16} />, category: 'edit' },
  
  // Transform options
  { id: 'summarize', label: 'Summarize', icon: <FileText size={16} />, category: 'transform' },
  { id: 'translate', label: 'Translate', icon: <Languages size={16} />, category: 'transform' },
  { id: 'explain', label: 'Explain', icon: <Lightbulb size={16} />, category: 'transform' },
  
  // Create options
  { id: 'create-task', label: 'Create Task', icon: <CheckCircle size={16} />, category: 'create' },
  { id: 'create-note', label: 'Create Note', icon: <FileText size={16} />, category: 'create' },
  { id: 'ask-ai', label: 'Ask AI', icon: <MessageSquare size={16} />, category: 'create' },
];

export function AIWritingToolsMenu({ selection, onClose, onAction }: AIWritingToolsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  useEffect(() => {
    if (!selection.rect) return;

    const { rect } = selection;
    const menuHeight = 300; // Approximate menu height
    const menuWidth = 240; // Menu width
    const padding = 8;

    // Calculate position
    let top = rect.top - menuHeight - padding;
    let left = rect.left + (rect.width / 2) - (menuWidth / 2);

    // Adjust if menu would go off-screen
    if (top < padding) {
      top = rect.bottom + padding;
    }
    if (left < padding) {
      left = padding;
    }
    if (left + menuWidth > window.innerWidth - padding) {
      left = window.innerWidth - menuWidth - padding;
    }

    setPosition({ top, left });
  }, [selection.rect]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const handleAction = (action: AIAction) => {
    onAction(action, selection.text);
    onClose();
  };

  const rewriteItems = menuItems.filter(item => item.category === 'rewrite');
  const otherItems = menuItems.filter(item => item.category !== 'rewrite');

  return createPortal(
    <div
      ref={menuRef}
      className="fixed z-[100]"
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Card className="w-60 p-2 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-1">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-accent-primary" />
            <Text size="sm" weight="semibold">AI Writing Tools</Text>
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="h-6 w-6"
          >
            <X size={14} />
          </Button>
        </div>

        {/* Rewrite Section */}
        <div className="mb-2">
          <div 
            className="px-2 py-1 cursor-pointer rounded hover:bg-hover"
            onClick={() => setActiveCategory(activeCategory === 'rewrite' ? null : 'rewrite')}
          >
            <div className="flex items-center justify-between">
              <Text size="xs" variant="secondary" weight="medium">Rewrite</Text>
              <ArrowRight 
                size={12} 
                className={cn(
                  "transition-transform text-tertiary",
                  activeCategory === 'rewrite' && "rotate-90"
                )}
              />
            </div>
          </div>
          
          {activeCategory === 'rewrite' && (
            <div className="grid grid-cols-2 gap-1 mt-1 px-1">
              {rewriteItems.map(item => (
                <Button
                  key={item.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAction(item.id)}
                  className="justify-start text-xs h-8"
                >
                  {item.label}
                </Button>
              ))}
            </div>
          )}
        </div>

        {/* Other Actions */}
        <div className="space-y-0.5">
          {otherItems.map(item => (
            <button
              key={item.id}
              onClick={() => handleAction(item.id)}
              className="w-full px-2 py-2 text-left rounded hover:bg-hover transition-colors flex items-start gap-2 group"
            >
              <span className="text-secondary group-hover:text-primary transition-colors mt-0.5">
                {item.icon}
              </span>
              <div className="flex-1">
                <Text size="sm" className="group-hover:text-primary transition-colors">
                  {item.label}
                </Text>
              </div>
              {item.category === 'transform' && (
                <Zap size={12} className="text-accent-primary mt-1" />
              )}
            </button>
          ))}
        </div>

        {/* Footer hint */}
        <div className="px-2 pt-2 mt-2 border-t border-border-subtle">
          <Text size="xs" variant="tertiary">
            Press Ctrl+J to open anytime
          </Text>
        </div>
      </Card>
    </div>,
    document.body
  );
}
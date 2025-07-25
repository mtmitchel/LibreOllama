import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '../ui';
import { 
  RefreshCw,
  CheckCircle, 
  FileText, 
  Languages, 
  Lightbulb, 
  List,
  Key,
  MessageSquare,
  Send,
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
  | 'create-list'
  | 'key-points'
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
  { id: 'rewrite-professional', label: 'Make professional', icon: <RefreshCw size={16} className="text-purple-500" />, category: 'rewrite' },
  { id: 'rewrite-friendly', label: 'Make friendly', icon: <RefreshCw size={16} className="text-purple-500" />, category: 'rewrite' },
  { id: 'rewrite-concise', label: 'Make concise', icon: <RefreshCw size={16} className="text-purple-500" />, category: 'rewrite' },
  
  // Edit options
  { id: 'proofread', label: 'Proofread', icon: <CheckCircle size={16} className="text-purple-500" />, category: 'edit' },
  
  // Transform options
  { id: 'summarize', label: 'Summarize', icon: <FileText size={16} className="text-purple-500" />, category: 'transform' },
  { id: 'translate', label: 'Translate', icon: <Languages size={16} className="text-purple-500" />, category: 'transform' },
  { id: 'explain', label: 'Explain', icon: <Lightbulb size={16} className="text-purple-500" />, category: 'transform' },
  { id: 'create-list', label: 'Create list', icon: <List size={16} className="text-purple-500" />, category: 'transform' },
  { id: 'key-points', label: 'Extract key points', icon: <Key size={16} className="text-purple-500" />, category: 'transform' },
  
  // Create options
  { id: 'create-task', label: 'Create task', icon: <CheckCircle size={16} className="text-purple-500" />, category: 'create' },
  { id: 'create-note', label: 'Create note', icon: <FileText size={16} className="text-purple-500" />, category: 'create' },
  { id: 'ask-ai', label: 'Ask AI anything...', icon: <MessageSquare size={16} className="text-purple-500" />, category: 'create' },
];

export function AIWritingToolsMenu({ selection, onClose, onAction }: AIWritingToolsMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isPositioned, setIsPositioned] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [aiQuestion, setAiQuestion] = useState('');

  const calculatePosition = useCallback(() => {
    if (!selection.rect || !menuRef.current) {
      return;
    }

    const { rect } = selection;
    
    console.log('AIWritingToolsMenu positioning (calculatePosition):', { 
      rectValues: rect,
      rectExpanded: JSON.stringify(rect, null, 2),
      text: selection.text,
      rectType: typeof rect,
      rectKeys: Object.keys(rect)
    });
    
    // If rect is empty/invalid, don't position the menu
    if (rect.width === 0 && rect.height === 0 && rect.left === 0 && rect.top === 0) {
      console.log('Rect is empty, not positioning menu');
      return;
    }
    
    // Get actual menu dimensions after it's rendered
    const menuElement = menuRef.current;
    const menuRect = menuElement.getBoundingClientRect();
    const menuHeight = menuRect.height > 0 ? menuRect.height : 300; // Use actual height or fallback
    const menuWidth = 280; // Match minWidth from component
    const padding = 12;

    // Position to the immediate right of the selected text
    let left = rect.right + 4; 
    let top = rect.top;

    // If menu would go off right edge, position to the left
    if (left + menuWidth > window.innerWidth - padding) {
      left = rect.left - menuWidth - padding;
    }

    // If menu would go off left edge, center it
    if (left < padding) {
      left = rect.left + (rect.width / 2) - (menuWidth / 2);
    }

    // Adjust vertical position if menu would go off bottom
    if (top + menuHeight > window.innerHeight - padding) {
      top = window.innerHeight - menuHeight - padding;
    }

    // Ensure menu doesn't go off top
    if (top < padding) {
      top = padding;
    }

    console.log('Final position:', { top, left, menuHeight, menuWidth, windowHeight: window.innerHeight });
    
    setPosition({ top, left });
    setIsPositioned(true);
  }, [selection.rect]);

  useLayoutEffect(() => {
    setIsPositioned(false); // Reset positioning state
    
    // Use setTimeout to ensure the menu is fully rendered before positioning
    const timer = setTimeout(() => {
      calculatePosition();
    }, 0);
    
    return () => clearTimeout(timer);
  }, [calculatePosition, activeCategory]); // Recalculate when activeCategory changes

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
      className={cn(
        "fixed z-[100] transition-opacity duration-100",
        isPositioned ? "opacity-100" : "opacity-0"
      )}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
      }}
    >
      <Card className="!bg-bg-primary animate-in fade-in slide-in-from-bottom-2 p-2 shadow-lg duration-200" style={{ backgroundColor: 'var(--bg-primary)', minWidth: '280px' }}>
        {/* Rephrase Section */}
        <button
          className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
          onClick={() => {
            const newCategory = activeCategory === 'rewrite' ? null : 'rewrite';
            setActiveCategory(newCategory);
            // Recalculate position after category change with a small delay
            setTimeout(() => calculatePosition(), 10);
          }}
        >
          <RefreshCw size={16} className="text-purple-500" />
          <span className="text-sm">Rephrase</span>
        </button>
        
        {activeCategory === 'rewrite' && (
          <div className="mb-1 space-y-0.5 pl-6">
            {rewriteItems.map(item => (
              <button
                key={item.id}
                onClick={() => handleAction(item.id)}
                className="w-full rounded px-2 py-1 text-left text-sm hover:bg-hover"
              >
                {item.label}
              </button>
            ))}
          </div>
        )}

        {/* AI Actions */}
        {otherItems.filter(item => item.category !== 'create').map(item => (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="border-border-subtle my-2 border-t"></div>

        {/* Create Actions */}
        {otherItems.filter(item => item.category === 'create' && item.id !== 'ask-ai').map(item => (
          <button
            key={item.id}
            onClick={() => handleAction(item.id)}
            className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-hover"
          >
            {item.icon}
            <span className="text-sm">{item.label}</span>
          </button>
        ))}

        <div className="border-border-subtle my-2 border-t"></div>

        {/* AI Input Field */}
        <div className="flex items-center gap-1">
          <input
            type="text"
            value={aiQuestion}
            onChange={(e) => setAiQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                if (aiQuestion.trim()) {
                  onAction('ask-ai', aiQuestion);
                  setAiQuestion('');
                }
              }
            }}
            placeholder="Ask AI anything..."
            className="border-border-subtle flex-1 rounded border bg-transparent px-2 py-1 text-sm focus:border-accent-primary focus:outline-none"
          />
          <button
            onClick={() => {
              if (aiQuestion.trim()) {
                onAction('ask-ai', aiQuestion);
                setAiQuestion('');
              }
            }}
            className="rounded p-1.5 hover:bg-hover"
            title="Send"
          >
            <Send size={14} />
          </button>
        </div>
      </Card>
    </div>,
    document.body
  );
}
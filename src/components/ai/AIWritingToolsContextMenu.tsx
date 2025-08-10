import React, { useState, useEffect, useLayoutEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Copy,
  Scissors,
  Clipboard,
  Sparkles,
  RefreshCw,
  FileText,
  Languages,
  CheckCircle,
  Lightbulb,
  List,
  Key,
  MessageSquare,
  ChevronRight,
  Search
} from 'lucide-react';
import { cn } from '../../core/lib/utils';

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
  | 'ask-custom'
  | 'ask-ai';

interface AIWritingToolsContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  selectedText: string;
  onAIAction: (action: AIAction, customQuestion?: string) => void;
  onCut?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  separator?: boolean;
  submenu?: MenuItem[];
  action?: () => void;
  disabled?: boolean;
}

const submenuScrollbarStyles = `
  .submenu-scrollbar {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  .submenu-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  .submenu-scrollbar::-webkit-scrollbar-track {
    background: transparent;
  }
  .submenu-scrollbar::-webkit-scrollbar-thumb {
    background: #d1d5db;
    border-radius: 3px;
  }
  .submenu-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #9ca3af;
  }
  .dark .submenu-scrollbar::-webkit-scrollbar-thumb {
    background: #4b5563;
  }
  .dark .submenu-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #6b7280;
  }
  /* Prevent rendering artifacts */
  .context-menu-container * {
    transform: translateZ(0);
    backface-visibility: hidden;
    -webkit-backface-visibility: hidden;
  }
`;

export function AIWritingToolsContextMenu({ 
  isOpen, 
  onClose, 
  position, 
  selectedText,
  onAIAction,
  onCut,
  onCopy,
  onPaste
}: AIWritingToolsContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({
    top: position.top,
    left: position.left,
    visibility: 'hidden' as const
  });
  const closeTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const hasSelection = selectedText && selectedText.trim().length > 0;

  // Calculate adjusted position after menu renders
  useLayoutEffect(() => {
    if (!isOpen || !menuRef.current) return;

    const menuRect = menuRef.current.getBoundingClientRect();
    const menuWidth = menuRect.width;
    const menuHeight = menuRect.height;
    const padding = 10;
    
    let finalLeft = position.left;
    let finalTop = position.top;
    
    // Check right boundary
    if (finalLeft + menuWidth > window.innerWidth - padding) {
      finalLeft = window.innerWidth - menuWidth - padding;
    }
    
    // Check left boundary
    if (finalLeft < padding) {
      finalLeft = padding;
    }
    
    // Check bottom boundary
    if (finalTop + menuHeight > window.innerHeight - padding) {
      finalTop = window.innerHeight - menuHeight - padding;
    }
    
    // Check top boundary
    if (finalTop < padding) {
      finalTop = padding;
    }
    
    setMenuStyle({
      top: finalTop,
      left: finalLeft,
      visibility: 'visible' as const
    });
  }, [isOpen, position.top, position.left]);

  // AI Writing Tools submenu items
  const aiWritingTools: MenuItem[] = [
    { id: 'rewrite-professional', label: 'Professional tone', icon: <RefreshCw size={14} />, action: () => {
      onAIAction('rewrite-professional');
    }},
    { id: 'rewrite-friendly', label: 'Friendly tone', icon: <RefreshCw size={14} />, action: () => {
      onAIAction('rewrite-friendly');
    }},
    { id: 'rewrite-concise', label: 'Make concise', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-concise') },
    { id: 'rewrite-expanded', label: 'Expand', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-expanded') },
    { id: 'separator-1', label: '', separator: true },
    { id: 'proofread', label: 'Proofread', icon: <CheckCircle size={14} />, action: () => onAIAction('proofread') },
    { id: 'summarize', label: 'Summarize', icon: <FileText size={14} />, action: () => onAIAction('summarize') },
    { id: 'translate', label: 'Translate...', icon: <Languages size={14} />, action: () => onAIAction('translate') },
    { id: 'explain', label: 'Explain', icon: <Lightbulb size={14} />, action: () => onAIAction('explain') },
    { id: 'separator-2', label: '', separator: true },
    { id: 'create-list', label: 'Create list', icon: <List size={14} />, action: () => onAIAction('create-list') },
    { id: 'key-points', label: 'Extract key points', icon: <Key size={14} />, action: () => onAIAction('key-points') },
    { id: 'separator-3', label: '', separator: true },
    { id: 'ask-ai', label: 'Ask AI...', icon: <MessageSquare size={14} />, action: () => onAIAction('ask-ai') }
  ];

  // Main menu items
  const menuItems: MenuItem[] = [
    { id: 'cut', label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', disabled: !hasSelection, action: onCut },
    { id: 'copy', label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', disabled: !hasSelection, action: onCopy },
    { id: 'paste', label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: onPaste },
    { id: 'separator-1', label: '', separator: true },
    { id: 'writing-tools', label: 'Writing tools', icon: <Sparkles size={14} />, submenu: aiWritingTools, disabled: !hasSelection },
    { id: 'separator-2', label: '', separator: true },
    { id: 'search', label: 'Search with Google...', icon: <Search size={14} />, disabled: !hasSelection, action: () => {
      if (selectedText) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
      }
    }}
  ];

  // Handle submenu hover
  const handleMenuItemHover = useCallback((item: MenuItem, event: React.MouseEvent<HTMLDivElement>) => {
    // Clear any pending close timeout
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = undefined;
    }

    if (item.submenu) {
      const rect = event.currentTarget.getBoundingClientRect();
      const submenuWidth = 220; // Match min-width
      const submenuHeight = item.submenu.length * 32 + 16; // Approximate height
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const padding = 20;
      
      // Calculate horizontal position
      let left = rect.right - 8; // Small overlap
      
      // If submenu would go off-screen right, position it to the left of the menu
      if (left + submenuWidth > viewportWidth - padding) {
        left = rect.left - submenuWidth + 8;
      }
      
      // Calculate vertical position
      let top = rect.top;
      
      // If submenu would go off-screen bottom, adjust upward
      if (top + submenuHeight > viewportHeight - padding) {
        top = Math.max(padding, viewportHeight - submenuHeight - padding);
      }
      
      setSubmenuPosition({
        top: top,
        left: left
      });
      setActiveSubmenu(item.id);
    } else if (activeSubmenu) {
      // Start close timer for non-submenu items
      closeTimeoutRef.current = setTimeout(() => {
        setActiveSubmenu(null);
      }, 100);
    }
  }, [activeSubmenu]);

  const handleMenuLeave = useCallback(() => {
    // Start timer to close submenu
    closeTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 100);
  }, []);

  const handleSubmenuEnter = useCallback(() => {
    // Cancel close timer when entering submenu
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = undefined;
    }
  }, []);

  const handleSubmenuLeave = useCallback(() => {
    // Start timer to close submenu when leaving
    closeTimeoutRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 100);
  }, []);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside menu
      const isOutsideMenu = menuRef.current && !menuRef.current.contains(event.target as Node);
      // Check if click is outside submenu (or submenu doesn't exist)
      const isOutsideSubmenu = !submenuRef.current || !submenuRef.current.contains(event.target as Node);
      
      if (isOutsideMenu && isOutsideSubmenu) {
        // Clear any pending timeouts
        if (closeTimeoutRef.current) {
          clearTimeout(closeTimeoutRef.current);
        }
        setActiveSubmenu(null);
        onClose();
      }
    };

    if (isOpen) {
      // Small delay to prevent immediate close on open
      const timer = setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside, true);
      }, 10);
      
      return () => {
        clearTimeout(timer);
        document.removeEventListener('mousedown', handleClickOutside, true);
      };
    }
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  const renderMenuItem = (item: MenuItem, isSubmenu = false) => {
    if (item.separator) {
      return <div key={item.id} className="mx-2 my-1 h-px bg-gray-200 dark:bg-gray-700" />;
    }

    return (
      <div
        key={item.id}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 px-3 py-1.5 asana-text-sm transition-colors",
          item.disabled 
            ? "cursor-not-allowed text-gray-400 dark:text-gray-600" 
            : "hover:bg-blue-50 dark:hover:bg-gray-800",
          !isSubmenu && item.submenu && "pr-8"
        )}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          
          if (item.disabled) {
            return;
          }
          
          // Don't close menu if item has submenu
          if (item.submenu) {
            // Toggle submenu visibility
            if (activeSubmenu === item.id) {
              setActiveSubmenu(null);
            }
            return;
          }
          
          // Execute action for items without submenu
          if (item.action) {
            // Clear any pending timeouts first
            if (closeTimeoutRef.current) {
              clearTimeout(closeTimeoutRef.current);
            }
            
            // Execute action
            item.action();
            
            // Always close the menu after action
            setActiveSubmenu(null);
            onClose();
          }
        }}
        onMouseEnter={(e) => {
          if (!isSubmenu) {
            handleMenuItemHover(item, e);
          }
        }}
      >
        {item.icon && (
          <span className={cn(
            "flex-shrink-0",
            item.disabled ? "opacity-50" : "text-gray-600 dark:text-gray-400"
          )}>
            {item.icon}
          </span>
        )}
        <span className={cn(
          "flex-1",
          item.disabled ? "opacity-50" : "text-gray-900 dark:text-gray-100"
        )}>
          {item.label}
        </span>
        {item.shortcut && (
          <span className="ml-auto text-[11px] text-gray-500 dark:text-gray-400">
            {item.shortcut}
          </span>
        )}
        {item.submenu && (
          <ChevronRight size={14} className="absolute right-2 text-gray-400" />
        )}
      </div>
    );
  };

  return createPortal(
    <>
      <style dangerouslySetInnerHTML={{ __html: submenuScrollbarStyles }} />
      {/* Main menu */}
      <div
        ref={menuRef}
        className="context-menu-container fixed z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        style={menuStyle}
        onMouseLeave={handleMenuLeave}
      >
        <div className="min-w-[220px] overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
          <div className="py-1">
            {menuItems.map(item => renderMenuItem(item))}
          </div>
        </div>
      </div>

      {/* Submenu */}
      {activeSubmenu && (
        <>
          {/* Invisible hover bridge */}
          <div
            className="fixed"
            style={{
              top: `${submenuPosition.top}px`,
              left: `${submenuPosition.left - 20}px`,
              width: '28px',
              height: '40px',
              pointerEvents: 'auto',
            }}
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          />
          
          <div
            className="fixed z-[101]"
            style={{
              top: `${submenuPosition.top}px`,
              left: `${submenuPosition.left}px`,
            }}
            ref={submenuRef}
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          >
            <div className="rounded-lg shadow-lg" style={{ overflow: 'hidden' }}>
              <div 
                className="submenu-scrollbar min-w-[200px] border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900"
                style={{
                  position: 'relative',
                  borderRadius: 'inherit',
                }}
              >
                <div className="py-1">
                  {menuItems
                    .find(item => item.id === activeSubmenu)
                    ?.submenu?.map((item) => renderMenuItem(item, true))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
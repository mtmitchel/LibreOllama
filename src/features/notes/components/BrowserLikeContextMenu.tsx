import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { BlockNoteEditor } from '@blocknote/core';
import { 
  Copy,
  Scissors,
  Clipboard,
  Type,
  Bold,
  Italic,
  Underline,
  Link,
  Image,
  Table,
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
  Search,
  Printer,
  Code,
  Quote,
  ListOrdered
} from 'lucide-react';
import { cn } from '../../../core/lib/utils';

interface BrowserLikeContextMenuProps {
  isOpen: boolean;
  onClose: () => void;
  position: { top: number; left: number };
  editor: BlockNoteEditor;
  onAIAction: (action: string, customQuestion?: string) => void;
  onFormatAction: (action: string) => void;
  onInsertAction: (action: string) => void;
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
`;

export function BrowserLikeContextMenu({ 
  isOpen, 
  onClose, 
  position, 
  editor, 
  onAIAction,
  onFormatAction,
  onInsertAction
}: BrowserLikeContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const submenuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [submenuPosition, setSubmenuPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const closeTimeoutRef = useRef<NodeJS.Timeout>();

  const selectedText = editor.getSelectedText();
  const hasSelection = selectedText && selectedText.trim().length > 0;

  // AI Writing Tools submenu items
  const aiWritingTools: MenuItem[] = [
    { id: 'rewrite-header', label: 'Rewrite', separator: true },
    { id: 'rewrite-professional', label: 'Professional tone', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-professional') },
    { id: 'rewrite-friendly', label: 'Friendly tone', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-friendly') },
    { id: 'rewrite-concise', label: 'Make concise', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-concise') },
    { id: 'rewrite-expanded', label: 'Expand', icon: <RefreshCw size={14} />, action: () => onAIAction('rewrite-expanded') },
    { separator: true },
    { id: 'transform-header', label: 'Transform', separator: true },
    { id: 'proofread', label: 'Proofread', icon: <CheckCircle size={14} />, action: () => onAIAction('proofread') },
    { id: 'summarize', label: 'Summarize', icon: <FileText size={14} />, action: () => onAIAction('summarize') },
    { id: 'translate', label: 'Translate...', icon: <Languages size={14} />, action: () => onAIAction('translate') },
    { id: 'explain', label: 'Explain', icon: <Lightbulb size={14} />, action: () => onAIAction('explain') },
    { separator: true },
    { id: 'format-header', label: 'Format', separator: true },
    { id: 'create-list', label: 'Create list', icon: <List size={14} />, action: () => onAIAction('create-list') },
    { id: 'key-points', label: 'Extract key points', icon: <Key size={14} />, action: () => onAIAction('key-points') },
    { separator: true },
    { id: 'ask-ai', label: 'Ask AI...', icon: <MessageSquare size={14} />, action: () => onAIAction('ask-custom') }
  ];

  // Formatting submenu items
  const formattingTools: MenuItem[] = [
    { id: 'bold', label: 'Bold', icon: <Bold size={14} />, shortcut: 'Ctrl+B', action: () => onFormatAction('bold') },
    { id: 'italic', label: 'Italic', icon: <Italic size={14} />, shortcut: 'Ctrl+I', action: () => onFormatAction('italic') },
    { id: 'underline', label: 'Underline', icon: <Underline size={14} />, shortcut: 'Ctrl+U', action: () => onFormatAction('underline') },
    { separator: true },
    { id: 'code', label: 'Code', icon: <Code size={14} />, action: () => onFormatAction('code') },
    { id: 'quote', label: 'Quote', icon: <Quote size={14} />, action: () => onFormatAction('quote') },
    { separator: true },
    { id: 'bullet-list', label: 'Bullet list', icon: <List size={14} />, action: () => onFormatAction('bulletListItem') },
    { id: 'numbered-list', label: 'Numbered list', icon: <ListOrdered size={14} />, action: () => onFormatAction('numberedListItem') }
  ];

  // Insert submenu items
  const insertTools: MenuItem[] = [
    { id: 'link', label: 'Link...', icon: <Link size={14} />, shortcut: 'Ctrl+K', action: () => onInsertAction('link') },
    { id: 'image', label: 'Image...', icon: <Image size={14} />, action: () => onInsertAction('image') },
    { id: 'table', label: 'Table', icon: <Table size={14} />, action: () => onInsertAction('table') }
  ];

  // Main menu items
  const menuItems: MenuItem[] = [
    { id: 'cut', label: 'Cut', icon: <Scissors size={14} />, shortcut: 'Ctrl+X', disabled: !hasSelection, action: () => document.execCommand('cut') },
    { id: 'copy', label: 'Copy', icon: <Copy size={14} />, shortcut: 'Ctrl+C', disabled: !hasSelection, action: () => document.execCommand('copy') },
    { id: 'paste', label: 'Paste', icon: <Clipboard size={14} />, shortcut: 'Ctrl+V', action: () => document.execCommand('paste') },
    { separator: true },
    { id: 'writing-tools', label: 'Writing tools', icon: <Sparkles size={14} />, submenu: aiWritingTools, disabled: !hasSelection },
    { id: 'format', label: 'Format', icon: <Type size={14} />, submenu: formattingTools },
    { id: 'insert', label: 'Insert', icon: <Image size={14} />, submenu: insertTools },
    { separator: true },
    { id: 'search', label: 'Search with Google...', icon: <Search size={14} />, disabled: !hasSelection, action: () => {
      if (selectedText) {
        window.open(`https://www.google.com/search?q=${encodeURIComponent(selectedText)}`, '_blank');
      }
    }},
    { separator: true },
    { id: 'print', label: 'Print...', icon: <Printer size={14} />, shortcut: 'Ctrl+P', action: () => window.print() }
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
      setSubmenuPosition({
        top: rect.top,
        left: rect.right - 8 // Small overlap
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
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
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
      if (item.label) {
        // Section header
        return (
          <div key={item.id} className="bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-500 dark:bg-gray-800 dark:text-gray-400">
            {item.label}
          </div>
        );
      }
      // Separator line
      return <div key={`separator-${item.id}`} className="mx-2 my-1 h-px bg-gray-200 dark:bg-gray-700" />;
    }

    return (
      <div
        key={item.id}
        className={cn(
          "group relative flex cursor-pointer items-center gap-3 px-3 py-1.5 text-sm transition-colors",
          item.disabled 
            ? "cursor-not-allowed text-gray-400 dark:text-gray-600" 
            : "hover:bg-blue-50 dark:hover:bg-gray-800",
          !isSubmenu && item.submenu && "pr-8"
        )}
        onClick={(e) => {
          if (!item.disabled && item.action) {
            e.stopPropagation();
            item.action();
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
          <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">
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
        className="fixed z-[100] animate-in fade-in slide-in-from-top-2 duration-200"
        style={{
          top: `${position.top}px`,
          left: `${position.left}px`,
        }}
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
              top: `${Math.max(8, Math.min(submenuPosition.top, window.innerHeight - 400))}px`,
              left: `${submenuPosition.left}px`,
            }}
            ref={submenuRef}
            onMouseEnter={handleSubmenuEnter}
            onMouseLeave={handleSubmenuLeave}
          >
            <div 
              className="submenu-scrollbar min-w-[200px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              style={{
                maxHeight: `${window.innerHeight - 32}px`,
                overflowY: 'auto',
                overflowX: 'hidden',
                // Force hardware acceleration to prevent artifacts
                transform: 'translateZ(0)',
                willChange: 'transform',
              }}
            >
              {menuItems
                .find(item => item.id === activeSubmenu)
                ?.submenu?.map(item => renderMenuItem(item, true))}
            </div>
          </div>
        </>
      )}
    </>,
    document.body
  );
}
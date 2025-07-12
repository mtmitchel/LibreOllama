import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import {
  FileText,
  FileType2,
  FileUp,
  Trash2,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';

const ContextMenuItem = ({
  children,
  onClick,
  className = '',
  variant = 'default',
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}) => {
  const variantClasses = {
    default: 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
    destructive: 'text-[var(--error)] hover:bg-[var(--error)]/10',
  };
  return (
    <button
      onClick={onClick}
      className={`w-full px-[var(--space-3)] py-[var(--space-2)] text-left text-sm transition-colors flex items-center focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] rounded-sm ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const ContextMenuSeparator = () => {
  return <div className="h-px my-[var(--space-1)] bg-[var(--border-default)]" />;
};

interface TiptapContextMenuProps {
  editor: Editor;
  children: React.ReactNode;
  className?: string;
}

export const TiptapContextMenu: React.FC<TiptapContextMenuProps> = ({
  editor,
  children,
  className,
}) => {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);

  const handleContextMenu = (event: React.MouseEvent) => {
    // Only show custom menu if a table is active
    if (editor.isActive('table')) {
      event.preventDefault();
      setPosition({ x: event.clientX, y: event.clientY });
      setVisible(true);
    }
    // Otherwise, do nothing and allow the default browser context menu
  };

  useEffect(() => {
    const handleClick = () => setVisible(false);
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setVisible(false);
      }
    };

    if (visible) {
      document.addEventListener('click', handleClick);
      document.addEventListener('keydown', handleEsc);
    }

    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [visible]);

  useLayoutEffect(() => {
    if (visible && menuRef.current) {
      const { innerWidth, innerHeight } = window;
      const { offsetWidth, offsetHeight } = menuRef.current;
      let newX = position.x;
      let newY = position.y;

      if (position.x + offsetWidth > innerWidth) {
        newX = innerWidth - offsetWidth - 8; // 8px padding from edge
      }
      if (position.y + offsetHeight > innerHeight) {
        newY = innerHeight - offsetHeight - 8; // 8px padding from edge
      }
      
      setPosition({ x: newX, y: newY });
    }
  }, [visible]);

  const handleItemClick = (action: () => void) => {
    action();
    setVisible(false);
  };

  const tableMenuItems = (
    <>
      <ContextMenuItem onClick={() => handleItemClick(() => editor.chain().focus().addRowBefore().run())}>
        <ArrowUp className="mr-2" size={16} />
        <span>Insert row above</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleItemClick(() => editor.chain().focus().addRowAfter().run())}>
        <ArrowDown className="mr-2" size={16} />
        <span>Insert row below</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleItemClick(() => editor.chain().focus().addColumnBefore().run())}>
        <ArrowLeft className="mr-2" size={16} />
        <span>Insert column left</span>
      </ContextMenuItem>
      <ContextMenuItem onClick={() => handleItemClick(() => editor.chain().focus().addColumnAfter().run())}>
        <ArrowRight className="mr-2" size={16} />
        <span>Insert column right</span>
      </ContextMenuItem>
      <ContextMenuSeparator />
      <ContextMenuItem variant="destructive" onClick={() => handleItemClick(() => editor.chain().focus().deleteRow().run())}>
        <Trash2 className="mr-2" size={16} />
        <span>Delete row</span>
      </ContextMenuItem>
      <ContextMenuItem variant="destructive" onClick={() => handleItemClick(() => editor.chain().focus().deleteColumn().run())}>
        <Trash2 className="mr-2" size={16} />
        <span>Delete column</span>
      </ContextMenuItem>
      <ContextMenuItem variant="destructive" onClick={() => handleItemClick(() => editor.chain().focus().deleteTable().run())}>
        <Trash2 className="mr-2" size={16} />
        <span>Delete table</span>
      </ContextMenuItem>
    </>
  );

  return (
    <div onContextMenu={handleContextMenu} className={className}>
      {children}
      {visible &&
        createPortal(
          <div
            ref={menuRef}
            style={{ top: position.y, left: position.x }}
            className="fixed bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md shadow-lg z-50 py-[var(--space-1)] animate-in fade-in-0 zoom-in-95 w-56"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-[var(--space-1)] p-[var(--space-1)]">
              {tableMenuItems}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}; 
import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import type { Editor } from '@tiptap/react';
import {
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
    default: 'text-primary hover:bg-tertiary',
    destructive: 'text-error hover:bg-error/10',
  };
  return (
    <button
      onClick={onClick}
      className={`focus:ring-accent-primary focus:ring-offset-elevated flex w-full items-center rounded-sm px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const ContextMenuSeparator = () => {
  return <div className="bg-border-default my-1 h-px" />;
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
    // Show menu only if selection is within a table
    if (!editor.isActive('table')) {
      return;
    }
    event.preventDefault();
    setPosition({ x: event.clientX, y: event.clientY });
    setVisible(true);
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
            className="border-border-default animate-in fade-in-0 zoom-in-95 fixed z-50 w-56 rounded-md border bg-elevated py-1 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col gap-1 p-1">
              {tableMenuItems}
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}; 
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Card } from './index';

interface ContextMenuItem {
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children,
  onOpen,
  onClose
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        handleClose();
      }
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
        document.removeEventListener('keydown', handleEscapeKey);
      };
    }
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const x = e.clientX;
    const y = e.clientY;

    // Adjust position to keep menu on screen
    const menuWidth = 200; // Approximate width
    const menuHeight = items.length * 40; // Approximate height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const adjustedX = x + menuWidth > windowWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > windowHeight ? y - menuHeight : y;

    setPosition({ x: adjustedX, y: adjustedY });
    setIsOpen(true);
    onOpen?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    onClose?.();
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (!item.disabled && !item.separator && item.onClick) {
      item.onClick();
      handleClose();
    }
  };

  return (
    <>
      <div ref={triggerRef} onContextMenu={handleContextMenu}>
        {children}
      </div>
      {isOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50"
          style={{ left: position.x, top: position.y }}
        >
          <Card className="!bg-bg-primary min-w-[180px] p-1 shadow-lg" style={{ backgroundColor: 'var(--bg-primary)' }}>
            {items.map((item, index) => (
              item.separator ? (
                <div key={index} className="bg-border-default my-1 h-px" />
              ) : (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`flex w-full items-center gap-2 rounded px-3 py-2 text-sm transition-colors ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : item.destructive
                      ? 'hover:bg-error hover:text-white'
                      : 'hover:bg-tertiary'
                  } ${item.destructive ? 'text-error' : 'text-primary'}`}
                >
                  {item.icon && (
                    <span className="shrink-0">{item.icon}</span>
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            ))}
          </Card>
        </div>,
        document.body
      )}
    </>
  );
};
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
          <div className="min-w-[220px] rounded-[12px] border border-neutral-200 bg-white shadow-lg p-1">
            {items.map((item, index) => (
              item.separator ? (
                <div key={index} className="my-1 h-px bg-neutral-100" />
              ) : (
                <button
                  key={index}
                  onClick={() => handleItemClick(item)}
                  disabled={item.disabled}
                  className={`h-8 px-2.5 rounded-[8px] flex items-center gap-2.5 text-[13px] text-neutral-800 w-full transition-colors ${
                    item.disabled
                      ? 'cursor-not-allowed opacity-50'
                      : item.destructive
                      ? 'text-red-600 hover:bg-red-50'
                      : 'hover:bg-neutral-50'
                  }`}
                >
                  {item.icon && (
                    <span className="shrink-0">{item.icon}</span>
                  )}
                  <span className="flex-1 text-left">{item.label}</span>
                </button>
              )
            ))}
          </div>
        </div>,
        document.body
      )}
    </>
  );
};
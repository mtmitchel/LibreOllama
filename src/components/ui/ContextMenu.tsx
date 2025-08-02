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
  const isClickingButtonRef = useRef(false);

  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      // Skip if we're in the middle of clicking a button
      if (isClickingButtonRef.current) {
        console.log('Skipping outside click - button is being clicked');
        isClickingButtonRef.current = false;
        return;
      }
      
      console.log('Click outside handler fired', event.target);
      const target = event.target as Node;
      
      // Don't close if clicking inside the menu
      if (menuRef.current && menuRef.current.contains(target)) {
        console.log('Click is inside menu, not closing');
        return;
      }
      
      // Don't close if clicking on the trigger element
      if (triggerRef.current && triggerRef.current.contains(target)) {
        console.log('Click is on trigger, not closing');
        return;
      }
      
      console.log('Click is outside, closing menu');
      handleClose();
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Add listeners after a longer delay to avoid immediate closure
    const timer = setTimeout(() => {
      // Use bubble phase (false) instead of capture phase (true)
      document.addEventListener('click', handleClickOutside, false);
      document.addEventListener('keydown', handleEscapeKey);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, false);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log('Context menu opened at:', e.clientX, e.clientY, 'Items:', items.length);

    const x = e.clientX;
    const y = e.clientY;

    // Adjust position to keep menu on screen
    const menuWidth = 220; // Approximate width
    const menuHeight = items.length * 32 + 20; // Approximate height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    const adjustedX = x + menuWidth > windowWidth ? x - menuWidth : x;
    const adjustedY = y + menuHeight > windowHeight ? y - menuHeight : y;

    setPosition({ x: adjustedX, y: adjustedY });
    setIsOpen(true);
    console.log('Context menu isOpen set to true');
    onOpen?.();
  };

  const handleClose = () => {
    console.log('Context menu closing');
    setIsOpen(false);
    onClose?.();
  };

  // Debug effect
  useEffect(() => {
    console.log('Context menu isOpen state changed to:', isOpen);
  }, [isOpen]);

  const handleItemClick = (e: React.MouseEvent, item: ContextMenuItem) => {
    console.log('Context menu item clicked:', item.label);
    e.preventDefault();
    e.stopPropagation();
    
    // Set flag to prevent immediate outside click
    isClickingButtonRef.current = true;
    
    if (!item.disabled && !item.separator && item.onClick) {
      console.log('Executing item action...');
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
          className="fixed z-[999999]"
          style={{ 
            left: `${position.x}px`, 
            top: `${position.y}px`,
            pointerEvents: 'auto'
          }}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <div className="min-w-[220px] rounded-[12px] border border-neutral-200 bg-white shadow-2xl p-1" role="menu" style={{ backgroundColor: 'white' }}>
            {items.map((item, index) => (
              item.separator ? (
                <div key={index} className="my-1 h-px bg-neutral-100" />
              ) : (
                <button
                  key={index}
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Execute the action on mousedown instead of click
                    if (!item.disabled && !item.separator && item.onClick) {
                      item.onClick();
                      handleClose();
                    }
                  }}
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
import React, { useState, useEffect, useRef, ReactNode, useId } from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System ContextMenu Component
 * 
 * DLS Compliant Context Menu following Asana patterns
 * - Portal-based rendering for proper z-index layering
 * - Smart positioning to stay within viewport
 * - Keyboard navigation support
 * - Destructive action styling
 * - Separator support for menu organization
 */

const contextMenuVariants = cva(
  `
    min-w-[220px] 
    rounded-[var(--radius-lg)]
    border border-[var(--border-default)]
    bg-[var(--bg-surface)]
    shadow-[var(--shadow-lg)]
    p-[var(--space-1)]
    backdrop-blur-sm
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    z-[999999]
  `,
  {
    variants: {
      size: {
        sm: 'min-w-[180px]',
        md: 'min-w-[220px]',
        lg: 'min-w-[280px]',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  }
);

const menuItemVariants = cva(
  `
    w-full
    h-8
    px-[var(--space-2)]
    rounded-[var(--radius-md)]
    flex items-center gap-[var(--space-2)]
    asana-text-base
    text-left
    border-none
    bg-transparent
    cursor-pointer
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    focus:outline-none
    focus:ring-1
    focus:ring-[var(--border-focus)]
  `,
  {
    variants: {
      variant: {
        default: `
          text-[color:var(--text-primary)]
          hover:bg-[var(--bg-secondary)]
          hover:text-[color:var(--text-primary)]
          focus:bg-[var(--bg-secondary)]
        `,
        destructive: `
          text-[color:var(--status-error)]
          hover:bg-[var(--status-error-subtle)]
          hover:text-[color:var(--status-error)]
          focus:bg-[var(--status-error-subtle)]
        `,
      },
      disabled: {
        true: `
          opacity-50
          cursor-not-allowed
          pointer-events-none
        `,
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface ContextMenuItem {
  id?: string;
  label?: string;
  icon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
  shortcut?: string;
  submenu?: ContextMenuItem[];
}

export interface ContextMenuProps extends VariantProps<typeof contextMenuVariants> {
  items: ContextMenuItem[];
  children: ReactNode;
  onOpen?: () => void;
  onClose?: () => void;
  disabled?: boolean;
  closeOnItemClick?: boolean;
  className?: string;
  portal?: boolean;
  placement?: 'auto' | 'top' | 'bottom' | 'left' | 'right';
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  items,
  children,
  onOpen,
  onClose,
  disabled = false,
  closeOnItemClick = true,
  className = '',
  portal = true,
  placement = 'auto',
  size,
}) => {
  const menuId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLButtonElement | null)[]>([]);

  // Get focusable items (exclude separators and disabled items)
  const focusableItems = items.filter(item => 
    !item.separator && !item.disabled
  );

  // Handle outside clicks and escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Don't close if clicking inside the menu
      if (menuRef.current?.contains(target)) return;
      
      // Don't close if clicking on the trigger element
      if (triggerRef.current?.contains(target)) return;
      
      handleClose();
    };

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleClose();
      }
    };

    // Keyboard navigation
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev < focusableItems.length - 1 ? prev + 1 : 0;
            const itemIndex = items.findIndex(item => item === focusableItems[next]);
            itemsRef.current[itemIndex]?.focus();
            return next;
          });
          break;

        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const next = prev > 0 ? prev - 1 : focusableItems.length - 1;
            const itemIndex = items.findIndex(item => item === focusableItems[next]);
            itemsRef.current[itemIndex]?.focus();
            return next;
          });
          break;

        case 'Enter':
        case ' ':
          event.preventDefault();
          if (focusedIndex >= 0 && focusedIndex < focusableItems.length) {
            const item = focusableItems[focusedIndex];
            handleItemClick(item);
          }
          break;

        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          const firstItemIndex = items.findIndex(item => item === focusableItems[0]);
          itemsRef.current[firstItemIndex]?.focus();
          break;

        case 'End':
          event.preventDefault();
          const lastIndex = focusableItems.length - 1;
          setFocusedIndex(lastIndex);
          const lastItemIndex = items.findIndex(item => item === focusableItems[lastIndex]);
          itemsRef.current[lastItemIndex]?.focus();
          break;
      }
    };

    // Add listeners with a small delay to prevent immediate closure
    const timer = setTimeout(() => {
      document.addEventListener('click', handleClickOutside, true);
      document.addEventListener('keydown', handleEscapeKey);
      document.addEventListener('keydown', handleKeyDown);
    }, 100);
    
    return () => {
      clearTimeout(timer);
      document.removeEventListener('click', handleClickOutside, true);
      document.removeEventListener('keydown', handleEscapeKey);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, focusedIndex, focusableItems, items]);

  // Smart positioning to keep menu within viewport
  const calculatePosition = (clientX: number, clientY: number) => {
    const menuWidth = 220;
    const menuHeight = items.length * 36 + 16; // Approximate height
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const padding = 8;

    let x = clientX;
    let y = clientY;

    // Adjust horizontal position
    if (placement === 'left' || (placement === 'auto' && x + menuWidth > windowWidth - padding)) {
      x = Math.max(padding, x - menuWidth);
    }

    // Adjust vertical position
    if (placement === 'top' || (placement === 'auto' && y + menuHeight > windowHeight - padding)) {
      y = Math.max(padding, y - menuHeight);
    }

    // Ensure menu stays within bounds
    x = Math.min(x, windowWidth - menuWidth - padding);
    y = Math.min(y, windowHeight - menuHeight - padding);
    x = Math.max(x, padding);
    y = Math.max(y, padding);

    return { x, y };
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();

    const { x, y } = calculatePosition(e.clientX, e.clientY);
    setPosition({ x, y });
    setIsOpen(true);
    setFocusedIndex(-1);
    onOpen?.();
  };

  const handleClose = () => {
    setIsOpen(false);
    setFocusedIndex(-1);
    onClose?.();
  };

  const handleItemClick = (item: ContextMenuItem) => {
    if (item.disabled || item.separator) return;

    item.onClick?.();
    
    if (closeOnItemClick) {
      handleClose();
    }
  };

  // Manage visibility for smooth transitions
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
    } else {
      // Keep visible during close animation
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const renderMenuItem = (item: ContextMenuItem, index: number) => {
    if (item.separator) {
      return (
        <div
          key={item.id || `separator-${index}`}
          className="my-[var(--space-1)] h-px bg-[var(--border-subtle)]"
          role="separator"
        />
      );
    }

    const isFocused = focusableItems.indexOf(item) === focusedIndex;

    return (
      <button
        key={item.id || `item-${index}`}
        ref={(el) => { itemsRef.current[index] = el; }}
        type="button"
        className={menuItemVariants({
          variant: item.destructive ? 'destructive' : 'default',
          disabled: item.disabled,
          className: isFocused ? 'ring-1 ring-[var(--border-focus)]' : '',
        })}
        onClick={() => handleItemClick(item)}
        disabled={item.disabled}
        role="menuitem"
        tabIndex={isFocused ? 0 : -1}
      >
        {item.icon && (
          <span className="shrink-0 text-[color:var(--text-secondary)]">
            {item.icon}
          </span>
        )}
        
        <span className="flex-1 text-left">
          {item.label}
        </span>

        {item.shortcut && (
          <span className="asana-text-sm text-[color:var(--text-muted)] font-mono">
            {item.shortcut}
          </span>
        )}
      </button>
    );
  };

  const menuContent = (
    <div
      ref={menuRef}
      className={`
        fixed
        transition-all duration-150 ease-out
        ${!isOpen ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
        ${contextMenuVariants({ size })}
        ${className}
      `}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        pointerEvents: 'auto',
        transformOrigin: 'top left',
      }}
      role="menu"
      aria-labelledby={menuId}
      onClick={(e) => e.stopPropagation()}
    >
      {items.map((item, index) => renderMenuItem(item, index))}
    </div>
  );

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        className={disabled ? 'pointer-events-none' : ''}
        style={{ WebkitUserSelect: 'none', userSelect: 'none' }}
      >
        {children}
      </div>
      
      {isVisible && portal && createPortal(menuContent, document.body)}
      {isVisible && !portal && menuContent}
    </>
  );
};

/**
 * Context Menu Hook for programmatic control
 */
export const useContextMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const open = (x: number, y: number) => {
    setPosition({ x, y });
    setIsOpen(true);
  };

  const close = () => {
    setIsOpen(false);
  };

  const toggle = (x: number, y: number) => {
    if (isOpen) {
      close();
    } else {
      open(x, y);
    }
  };

  return {
    isOpen,
    position,
    open,
    close,
    toggle,
  };
};

/**
 * Context Menu Trigger - For non-right-click triggers
 */
export interface ContextMenuTriggerProps {
  children: ReactNode;
  menu: ContextMenuItem[];
  onOpen?: () => void;
  onClose?: () => void;
  trigger?: 'click' | 'hover' | 'focus';
  disabled?: boolean;
}

export const ContextMenuTrigger: React.FC<ContextMenuTriggerProps> = ({
  children,
  menu,
  onOpen,
  onClose,
  trigger = 'click',
  disabled = false,
}) => {
  const { isOpen, position, open, close } = useContextMenu();
  const triggerRef = useRef<HTMLDivElement>(null);

  const handleTrigger = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = triggerRef.current?.getBoundingClientRect();
    if (rect) {
      if (trigger === 'click') {
        open(rect.left, rect.bottom + 4);
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      onOpen?.();
    } else {
      onClose?.();
    }
  }, [isOpen, onOpen, onClose]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={trigger === 'click' ? handleTrigger : undefined}
        className={disabled ? 'pointer-events-none' : 'cursor-pointer'}
      >
        {children}
      </div>
      
      {isOpen && (
        <ContextMenu
          items={menu}
          onClose={close}
        >
          <div
            style={{
              position: 'fixed',
              left: position.x,
              top: position.y,
              pointerEvents: 'none',
            }}
          />
        </ContextMenu>
      )}
    </>
  );
};
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Design System Popover Component
 * 
 * DLS Compliant Popover following Asana patterns
 * - Clean white background with subtle shadow
 * - Smooth animations
 * - Smart positioning to stay within viewport
 */

export type PopoverPlacement = 
  | 'top' 
  | 'top-start' 
  | 'top-end'
  | 'bottom' 
  | 'bottom-start' 
  | 'bottom-end'
  | 'left' 
  | 'left-start' 
  | 'left-end'
  | 'right' 
  | 'right-start' 
  | 'right-end';

export interface PopoverProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: PopoverPlacement;
  trigger?: 'click' | 'hover';
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  contentClassName?: string;
  offset?: number;
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
  showArrow?: boolean;
}

export const Popover: React.FC<PopoverProps> = ({
  children,
  content,
  placement = 'bottom',
  trigger = 'click',
  open: controlledOpen,
  onOpenChange,
  className = '',
  contentClassName = '',
  offset = 8,
  closeOnClickOutside = true,
  closeOnEscape = true,
  showArrow = true,
}) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [actualPlacement, setActualPlacement] = useState(placement);
  const triggerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout>();

  const isControlled = controlledOpen !== undefined;
  const isOpen = isControlled ? controlledOpen : internalOpen;

  const setOpen = useCallback((open: boolean) => {
    if (isControlled) {
      onOpenChange?.(open);
    } else {
      setInternalOpen(open);
      onOpenChange?.(open);
    }
  }, [isControlled, onOpenChange]);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !contentRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    let top = 0;
    let left = 0;
    let finalPlacement = placement;

    // Calculate initial position based on placement
    switch (placement) {
      case 'top':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'top-start':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.left;
        break;
      case 'top-end':
        top = triggerRect.top - contentRect.height - offset;
        left = triggerRect.right - contentRect.width;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
        break;
      case 'bottom-start':
        top = triggerRect.bottom + offset;
        left = triggerRect.left;
        break;
      case 'bottom-end':
        top = triggerRect.bottom + offset;
        left = triggerRect.right - contentRect.width;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'left-start':
        top = triggerRect.top;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'left-end':
        top = triggerRect.bottom - contentRect.height;
        left = triggerRect.left - contentRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        left = triggerRect.right + offset;
        break;
      case 'right-start':
        top = triggerRect.top;
        left = triggerRect.right + offset;
        break;
      case 'right-end':
        top = triggerRect.bottom - contentRect.height;
        left = triggerRect.right + offset;
        break;
    }

    // Adjust position to stay within viewport
    if (left < 8) left = 8;
    if (left + contentRect.width > viewport.width - 8) {
      left = viewport.width - contentRect.width - 8;
    }
    if (top < 8) {
      top = triggerRect.bottom + offset;
      finalPlacement = placement.replace('top', 'bottom') as PopoverPlacement;
    }
    if (top + contentRect.height > viewport.height - 8) {
      top = triggerRect.top - contentRect.height - offset;
      finalPlacement = placement.replace('bottom', 'top') as PopoverPlacement;
    }

    setPosition({ top, left });
    setActualPlacement(finalPlacement);
  }, [placement, offset]);

  useEffect(() => {
    if (isOpen) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isOpen, calculatePosition]);

  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        triggerRef.current &&
        contentRef.current &&
        !triggerRef.current.contains(event.target as Node) &&
        !contentRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, closeOnClickOutside, setOpen]);

  useEffect(() => {
    if (!isOpen || !closeOnEscape) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEscape, setOpen]);

  const handleTriggerClick = () => {
    if (trigger === 'click') {
      setOpen(!isOpen);
    }
  };

  const handleMouseEnter = () => {
    if (trigger === 'hover') {
      clearTimeout(hoverTimeoutRef.current);
      setOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      hoverTimeoutRef.current = setTimeout(() => {
        setOpen(false);
      }, 100);
    }
  };

  const getArrowStyles = () => {
    const arrowSize = 6;
    const styles: React.CSSProperties = {
      position: 'absolute',
      width: arrowSize * 2,
      height: arrowSize * 2,
      backgroundColor: 'white',
      transform: 'rotate(45deg)',
      boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
    };

    if (actualPlacement.startsWith('top')) {
      styles.bottom = -arrowSize;
      styles.boxShadow = '2px 2px 2px rgba(0,0,0,0.05)';
    }
    if (actualPlacement.startsWith('bottom')) {
      styles.top = -arrowSize;
      styles.boxShadow = '-2px -2px 2px rgba(0,0,0,0.05)';
    }
    if (actualPlacement.startsWith('left')) {
      styles.right = -arrowSize;
      styles.boxShadow = '2px -2px 2px rgba(0,0,0,0.05)';
    }
    if (actualPlacement.startsWith('right')) {
      styles.left = -arrowSize;
      styles.boxShadow = '-2px 2px 2px rgba(0,0,0,0.05)';
    }

    if (actualPlacement.includes('-start')) {
      if (actualPlacement.startsWith('top') || actualPlacement.startsWith('bottom')) {
        styles.left = 16;
      } else {
        styles.top = 16;
      }
    } else if (actualPlacement.includes('-end')) {
      if (actualPlacement.startsWith('top') || actualPlacement.startsWith('bottom')) {
        styles.right = 16;
      } else {
        styles.bottom = 16;
      }
    } else {
      if (actualPlacement.startsWith('top') || actualPlacement.startsWith('bottom')) {
        styles.left = '50%';
        styles.transform = 'translateX(-50%) rotate(45deg)';
      } else {
        styles.top = '50%';
        styles.transform = 'translateY(-50%) rotate(45deg)';
      }
    }

    return styles;
  };

  return (
    <>
      <div
        ref={triggerRef}
        className={className}
        onClick={handleTriggerClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children}
      </div>

      {isOpen && createPortal(
        <div
          ref={contentRef}
          className={`fixed z-[var(--z-popover)] bg-[var(--bg-primary)] border border-[var(--border-default)] rounded-[var(--radius-md)] shadow-[var(--shadow-popover)] animate-in fade-in-0 zoom-in-95 duration-[var(--transition-duration)] ${contentClassName}`}
          style={{
            top: position.top,
            left: position.left,
          }}
          onMouseEnter={trigger === 'hover' ? handleMouseEnter : undefined}
          onMouseLeave={trigger === 'hover' ? handleMouseLeave : undefined}
        >
          {showArrow && <div style={{
            ...getArrowStyles(),
            backgroundColor: 'var(--bg-primary)',
          }} />}
          {content}
        </div>,
        document.body
      )}
    </>
  );
};

/**
 * Simple Popover Content Container
 * Provides consistent padding and styling for popover content
 */
export const PopoverContent: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`p-[var(--space-1-5)] ${className}`}>
      {children}
    </div>
  );
};

/**
 * Popover Header
 * For popovers that need a title
 */
export const PopoverHeader: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-[var(--space-1-5)] py-[var(--space-1)] border-b border-[var(--border-default)] ${className}`}>
      <h3 className="text-[var(--text-body)] font-semibold text-[var(--text-primary)]">{children}</h3>
    </div>
  );
};

/**
 * Popover Footer
 * For popovers with actions
 */
export const PopoverFooter: React.FC<{
  children: React.ReactNode;
  className?: string;
}> = ({ children, className = '' }) => {
  return (
    <div className={`px-[var(--space-1-5)] py-[var(--space-1)] border-t border-[var(--border-default)] ${className}`}>
      {children}
    </div>
  );
};
import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

/**
 * Design System Tooltip Component
 * 
 * DLS Compliant Tooltip following Asana patterns
 * - Minimal, informative tooltips
 * - Smart positioning
 * - Smooth fade animations
 */

export type TooltipPlacement = 
  | 'top' 
  | 'bottom' 
  | 'left' 
  | 'right';

export interface TooltipProps {
  children: React.ReactNode;
  content: React.ReactNode;
  placement?: TooltipPlacement;
  delay?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  offset?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 500,
  disabled = false,
  className = '',
  contentClassName = '',
  offset = 8,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const calculatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    let top = 0;
    let left = 0;

    switch (placement) {
      case 'top':
        top = triggerRect.top - tooltipRect.height - offset;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'bottom':
        top = triggerRect.bottom + offset;
        left = triggerRect.left + (triggerRect.width - tooltipRect.width) / 2;
        break;
      case 'left':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.left - tooltipRect.width - offset;
        break;
      case 'right':
        top = triggerRect.top + (triggerRect.height - tooltipRect.height) / 2;
        left = triggerRect.right + offset;
        break;
    }

    // Keep tooltip within viewport
    const padding = 8;
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight,
    };

    if (left < padding) left = padding;
    if (left + tooltipRect.width > viewport.width - padding) {
      left = viewport.width - tooltipRect.width - padding;
    }
    if (top < padding) {
      // Flip to bottom if too close to top
      if (placement === 'top') {
        top = triggerRect.bottom + offset;
      } else {
        top = padding;
      }
    }
    if (top + tooltipRect.height > viewport.height - padding) {
      // Flip to top if too close to bottom
      if (placement === 'bottom') {
        top = triggerRect.top - tooltipRect.height - offset;
      } else {
        top = viewport.height - tooltipRect.height - padding;
      }
    }

    setPosition({ top, left });
  };

  useEffect(() => {
    if (isVisible) {
      calculatePosition();
      window.addEventListener('resize', calculatePosition);
      window.addEventListener('scroll', calculatePosition, true);
      
      return () => {
        window.removeEventListener('resize', calculatePosition);
        window.removeEventListener('scroll', calculatePosition, true);
      };
    }
  }, [isVisible, placement]);

  const handleMouseEnter = () => {
    if (disabled || !content) return;
    
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timeoutRef.current);
    setIsVisible(false);
  };

  const handleFocus = () => {
    if (disabled || !content) return;
    setIsVisible(true);
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  if (!content) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={triggerRef}
        className={`inline-block ${className}`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocus={handleFocus}
        onBlur={handleBlur}
      >
        {children}
      </div>

      {isVisible && !disabled && createPortal(
        <div
          ref={tooltipRef}
          role="tooltip"
          className={`
            fixed z-[var(--z-tooltip)]
            px-[var(--space-1)] py-[var(--space-0-5)]
            bg-[var(--text-primary)]
            text-[var(--text-on-brand)]
            text-[var(--text-small)]
            font-normal
            rounded-[var(--radius-sm)]
            shadow-[var(--shadow-popover)]
            pointer-events-none
            animate-in fade-in-0 zoom-in-95
            duration-[var(--transition-duration)]
            ${contentClassName}
          `}
          style={{
            top: position.top,
            left: position.left,
          }}
        >
          {content}
          <div
            className="absolute w-2 h-2 bg-[var(--text-primary)] rotate-45"
            style={{
              ...(placement === 'top' && {
                bottom: '-4px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
              }),
              ...(placement === 'bottom' && {
                top: '-4px',
                left: '50%',
                transform: 'translateX(-50%) rotate(45deg)',
              }),
              ...(placement === 'left' && {
                right: '-4px',
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
              }),
              ...(placement === 'right' && {
                left: '-4px',
                top: '50%',
                transform: 'translateY(-50%) rotate(45deg)',
              }),
            }}
          />
        </div>,
        document.body
      )}
    </>
  );
};

/**
 * Keyboard Shortcut Tooltip
 * Special tooltip variant for displaying keyboard shortcuts
 */
export const KeyboardTooltip: React.FC<{
  children: React.ReactNode;
  keys: string[];
  description?: string;
  placement?: TooltipPlacement;
}> = ({ children, keys, description, placement = 'bottom' }) => {
  const content = (
    <div className="flex items-center gap-[var(--space-1)]">
      {description && (
        <span className="mr-[var(--space-1)]">{description}</span>
      )}
      <div className="flex items-center gap-[2px]">
        {keys.map((key, index) => (
          <React.Fragment key={key}>
            <kbd className="
              inline-block
              px-[4px] py-[2px]
              bg-[rgba(255,255,255,0.1)]
              border border-[rgba(255,255,255,0.2)]
              rounded-[2px]
              text-[10px]
              font-mono
            ">
              {key}
            </kbd>
            {index < keys.length - 1 && (
              <span className="text-[10px] opacity-60">+</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );

  return (
    <Tooltip content={content} placement={placement} delay={300}>
      {children}
    </Tooltip>
  );
};

/**
 * Info Tooltip
 * Tooltip with an info icon trigger
 */
export const InfoTooltip: React.FC<{
  content: React.ReactNode;
  placement?: TooltipPlacement;
  iconSize?: number;
  className?: string;
}> = ({ content, placement = 'top', iconSize = 14, className = '' }) => {
  return (
    <Tooltip content={content} placement={placement} delay={300}>
      <button
        type="button"
        className={`
          inline-flex items-center justify-center
          w-4 h-4
          text-[var(--text-secondary)]
          hover:text-[var(--text-primary)]
          transition-colors
          duration-[var(--transition-duration)]
          ${className}
        `}
        aria-label="More information"
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <circle cx="8" cy="5" r="0.75" fill="currentColor"/>
          <path d="M8 7.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </Tooltip>
  );
};
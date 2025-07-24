import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Text } from './index';

interface TooltipProps {
  content: React.ReactNode;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
  variant?: 'default' | 'dark' | 'light' | 'warning' | 'error';
  size?: 'sm' | 'md' | 'lg';
  delay?: number;
  maxWidth?: string;
  truncate?: boolean;
  truncateLength?: number;
  disabled?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
  trigger?: 'hover' | 'click' | 'focus' | 'manual';
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function Tooltip({
  content,
  children,
  position = 'auto',
  variant = 'default',
  size = 'md',
  delay = 300,
  maxWidth = '320px',
  truncate = false,
  truncateLength = 100,
  disabled = false,
  className = '',
  contentClassName = '',
  arrow = true,
  trigger = 'hover',
  isOpen: controlledIsOpen,
  onOpenChange
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('bottom');
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const [arrowStyle, setArrowStyle] = useState<React.CSSProperties>({});
  
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | undefined>(undefined);

  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : isVisible;

  // Size configuration
  const sizeClasses = {
    sm: {
      padding: 'px-2 py-1',
      text: 'text-xs',
      maxWidth: '200px'
    },
    md: {
      padding: 'px-3 py-2',
      text: 'text-sm',
      maxWidth: '280px'
    },
    lg: {
      padding: 'px-4 py-3',
      text: 'text-base',
      maxWidth: '320px'
    }
  };

  // Variant configuration
  const variantClasses = {
    default: 'bg-gray-900 text-white border-gray-700',
    dark: 'bg-gray-800 text-gray-200 border-gray-600',
    light: 'bg-white text-gray-900 border-gray-300 shadow-lg',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    error: 'bg-red-100 text-red-800 border-red-300'
  };

  const currentSizeClasses = sizeClasses[size];
  const currentVariantClasses = variantClasses[variant];

  // Position calculation
  const calculatePosition = useCallback(() => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const viewport = {
      width: window.innerWidth,
      height: window.innerHeight
    };

    let newPosition: 'top' | 'bottom' | 'left' | 'right' = position === 'auto' ? 'bottom' : position;
    
    // Auto position logic
    if (position === 'auto') {
      const spaceTop = triggerRect.top;
      const spaceBottom = viewport.height - triggerRect.bottom;
      const spaceRight = viewport.width - triggerRect.right;

      if (spaceBottom >= tooltipRect.height + 8) {
        newPosition = 'bottom';
      } else if (spaceTop >= tooltipRect.height + 8) {
        newPosition = 'top';
      } else if (spaceRight >= tooltipRect.width + 8) {
        newPosition = 'right';
      } else {
        newPosition = 'left';
      }
    }

    // Calculate tooltip position
    let tooltipX = 0;
    let tooltipY = 0;
    let arrowX = 0;
    let arrowY = 0;

    const offset = 8;
    const arrowSize = 6;

    switch (newPosition) {
      case 'top':
        tooltipX = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        tooltipY = triggerRect.top - tooltipRect.height - offset;
        arrowX = tooltipRect.width / 2 - arrowSize;
        arrowY = tooltipRect.height;
        break;
      case 'bottom':
        tooltipX = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
        tooltipY = triggerRect.bottom + offset;
        arrowX = tooltipRect.width / 2 - arrowSize;
        arrowY = -arrowSize;
        break;
      case 'left':
        tooltipX = triggerRect.left - tooltipRect.width - offset;
        tooltipY = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        arrowX = tooltipRect.width;
        arrowY = tooltipRect.height / 2 - arrowSize;
        break;
      case 'right':
        tooltipX = triggerRect.right + offset;
        tooltipY = triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2;
        arrowX = -arrowSize;
        arrowY = tooltipRect.height / 2 - arrowSize;
        break;
    }

    // Keep tooltip within viewport
    if (tooltipX < 8) tooltipX = 8;
    if (tooltipX + tooltipRect.width > viewport.width - 8) {
      tooltipX = viewport.width - tooltipRect.width - 8;
    }
    if (tooltipY < 8) tooltipY = 8;
    if (tooltipY + tooltipRect.height > viewport.height - 8) {
      tooltipY = viewport.height - tooltipRect.height - 8;
    }

    setTooltipPosition(newPosition);
    setTooltipStyle({
      position: 'fixed',
      left: `${tooltipX}px`,
      top: `${tooltipY}px`,
      zIndex: 1000
    });
    setArrowStyle({
      position: 'absolute',
      left: `${arrowX}px`,
      top: `${arrowY}px`
    });
  }, [position]);

  const showTooltip = () => {
    if (disabled) return;
    
    if (delay > 0) {
      timeoutRef.current = window.setTimeout(() => {
        setIsVisible(true);
        onOpenChange?.(true);
      }, delay);
    } else {
      setIsVisible(true);
      onOpenChange?.(true);
    }
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    setIsVisible(false);
    onOpenChange?.(false);
  };

  const handleTriggerInteraction = (event: React.MouseEvent | React.FocusEvent) => {
    if (trigger === 'hover') {
      if (event.type === 'mouseenter') {
        showTooltip();
      } else if (event.type === 'mouseleave') {
        hideTooltip();
      }
    } else if (trigger === 'focus') {
      if (event.type === 'focus') {
        showTooltip();
      } else if (event.type === 'blur') {
        hideTooltip();
      }
    } else if (trigger === 'click') {
      if (event.type === 'click') {
        if (isOpen) {
          hideTooltip();
        } else {
          showTooltip();
        }
      }
    }
  };

  // Position calculation effect
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is updated
      const timer = setTimeout(calculatePosition, 0);
      return () => clearTimeout(timer);
    }
  }, [isOpen, content, calculatePosition]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const getArrowBorderColor = () => {
    switch (variant) {
      case 'light':
        return 'border-gray-300';
      case 'warning':
        return 'border-yellow-300';
      case 'error':
        return 'border-red-300';
      default:
        return 'border-gray-700';
    }
  };

  const getArrowClasses = () => {
    const baseClasses = 'absolute w-0 h-0';
    const borderColor = getArrowBorderColor();
    
    switch (tooltipPosition) {
      case 'top':
        return `${baseClasses} border-l-[6px] border-r-[6px] border-t-[6px] border-l-transparent border-r-transparent ${borderColor}`;
      case 'bottom':
        return `${baseClasses} border-l-[6px] border-r-[6px] border-b-[6px] border-l-transparent border-r-transparent ${borderColor}`;
      case 'left':
        return `${baseClasses} border-t-[6px] border-b-[6px] border-l-[6px] border-t-transparent border-b-transparent ${borderColor}`;
      case 'right':
        return `${baseClasses} border-t-[6px] border-b-[6px] border-r-[6px] border-t-transparent border-b-transparent ${borderColor}`;
      default:
        return baseClasses;
    }
  };

  const processedContent = truncate && typeof content === 'string' && content.length > truncateLength
    ? `${content.slice(0, truncateLength)}...`
    : content;

  const triggerProps = {
    ref: triggerRef,
    ...(trigger === 'hover' && {
      onMouseEnter: handleTriggerInteraction,
      onMouseLeave: handleTriggerInteraction
    }),
    ...(trigger === 'focus' && {
      onFocus: handleTriggerInteraction,
      onBlur: handleTriggerInteraction
    }),
    ...(trigger === 'click' && {
      onClick: handleTriggerInteraction
    })
  };

  return (
    <>
      <div {...triggerProps} className={className}>
        {children}
      </div>
      
      {isOpen && (
        <div
          ref={tooltipRef}
          className={`
            ${currentSizeClasses.padding}
            ${currentSizeClasses.text}
            ${currentVariantClasses}
            whitespace-nowrap rounded-lg
            border
            ${contentClassName}
          `}
          style={{
            ...tooltipStyle,
            maxWidth: maxWidth || currentSizeClasses.maxWidth
          }}
        >
          {processedContent}
          {arrow && (
            <div
              style={arrowStyle}
              className={getArrowClasses()}
            />
          )}
        </div>
      )}
    </>
  );
}

interface TooltipTriggerProps {
  children: React.ReactNode;
  tooltip: React.ReactNode;
  className?: string;
}

export function TooltipTrigger({ children, tooltip, className }: TooltipTriggerProps) {
  return (
    <Tooltip content={tooltip} className={className}>
      {children}
    </Tooltip>
  );
}

interface TruncatedTextProps {
  children: string;
  maxLength?: number;
  tooltip?: boolean;
  className?: string;
}

export function TruncatedText({
  children,
  maxLength = 50,
  tooltip = true,
  className = ''
}: TruncatedTextProps) {
  const isTruncated = children.length > maxLength;
  const displayText = isTruncated ? `${children.slice(0, maxLength)}...` : children;

  if (!isTruncated || !tooltip) {
    return <span className={className}>{displayText}</span>;
  }

  return (
    <Tooltip content={children} truncate={false}>
      <span className={`cursor-help ${className}`}>{displayText}</span>
    </Tooltip>
  );
} 
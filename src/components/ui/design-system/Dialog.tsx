import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from './Button';

/**
 * Design System Dialog Component
 * 
 * DLS Compliant Modal Dialog following Asana patterns
 * - Clean modal overlay with proper focus management
 * - Accessible with keyboard navigation
 * - Smooth animations and transitions
 */

interface DialogContextValue {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DialogContext = createContext<DialogContextValue>({
  open: false,
  onOpenChange: () => {},
});

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

export const Dialog: React.FC<DialogProps> = ({
  open = false,
  onOpenChange = () => {},
  children,
}) => {
  return (
    <DialogContext.Provider value={{ open, onOpenChange }}>
      {children}
    </DialogContext.Provider>
  );
};

/**
 * Dialog Trigger - Element that opens the dialog
 */
export const DialogTrigger: React.FC<{ children: React.ReactNode; asChild?: boolean }> = ({ 
  children, 
  asChild = false 
}) => {
  const { onOpenChange } = useContext(DialogContext);
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }
  
  return (
    <button onClick={() => onOpenChange(true)}>
      {children}
    </button>
  );
};

/**
 * Dialog Portal - Renders dialog content in a portal
 */
export const DialogPortal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { open } = useContext(DialogContext);
  
  if (!open) return null;
  
  return createPortal(children, document.body);
};

/**
 * Dialog Overlay - Background overlay
 */
export const DialogOverlay: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ 
  className = '', 
  ...props 
}) => {
  const { onOpenChange } = useContext(DialogContext);
  
  return (
    <div
      className={`
        fixed inset-0 z-[var(--z-modal-overlay)]
        bg-black/40 backdrop-blur-sm
        animate-in fade-in-0
        duration-[var(--transition-duration)]
        ${className}
      `}
      onClick={() => onOpenChange(false)}
      {...props}
    />
  );
};

/**
 * Dialog Content - Main dialog container
 */
export interface DialogContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  showCloseButton?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const DialogContent: React.FC<DialogContentProps> = ({
  children,
  showCloseButton = true,
  size = 'md',
  className = '',
  ...props
}) => {
  const { open, onOpenChange } = useContext(DialogContext);
  const contentRef = useRef<HTMLDivElement>(null);
  
  // Focus management
  useEffect(() => {
    if (open && contentRef.current) {
      const previouslyFocused = document.activeElement as HTMLElement;
      
      // Focus the dialog content
      contentRef.current.focus();
      
      return () => {
        // Restore focus when dialog closes
        previouslyFocused?.focus();
      };
    }
  }, [open]);
  
  // Escape key handler
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    
    if (open) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }
    
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [open, onOpenChange]);
  
  if (!open) return null;
  
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-[90vw]',
  };
  
  return (
    <DialogPortal>
      <DialogOverlay />
      <div className="fixed inset-0 z-[var(--z-modal)] flex items-center justify-center p-[var(--space-4)]">
        <div
          ref={contentRef}
          tabIndex={-1}
          className={`
            relative w-full ${sizeClasses[size]}
            max-h-[85vh] overflow-auto
            bg-[var(--bg-primary)]
            border border-[var(--border-default)]
            rounded-[var(--radius-lg)]
            shadow-[var(--shadow-modal)]
            animate-in zoom-in-95 fade-in-0
            duration-[var(--transition-duration)]
            ${className}
          `}
          onClick={(e) => e.stopPropagation()}
          {...props}
        >
          {showCloseButton && (
            <button
              onClick={() => onOpenChange(false)}
              className={`
                absolute top-[var(--space-3)] right-[var(--space-3)]
                p-[var(--space-1)]
                rounded-[var(--radius-md)]
                text-[var(--text-secondary)]
                hover:bg-[var(--bg-secondary)]
                hover:text-[var(--text-primary)]
                transition-[var(--transition-property)]
                duration-[var(--transition-duration)]
                z-10
              `}
              aria-label="Close dialog"
            >
              <X size={20} />
            </button>
          )}
          {children}
        </div>
      </div>
    </DialogPortal>
  );
};

/**
 * Dialog Header - Header section with title
 */
export const DialogHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        px-[var(--space-6)] pt-[var(--space-6)] pb-[var(--space-4)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Dialog Title - Dialog title text
 */
export const DialogTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h2
      className={`
        text-[var(--text-heading)]
        font-semibold
        text-[var(--text-primary)]
        ${className}
      `}
      {...props}
    >
      {children}
    </h2>
  );
};

/**
 * Dialog Description - Subtitle or description text
 */
export const DialogDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p
      className={`
        mt-[var(--space-1)]
        text-[var(--text-body)]
        text-[var(--text-secondary)]
        ${className}
      `}
      {...props}
    >
      {children}
    </p>
  );
};

/**
 * Dialog Body - Main content area
 */
export const DialogBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`
        px-[var(--space-6)] py-[var(--space-2)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Dialog Footer - Footer with action buttons
 */
export interface DialogFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  align?: 'left' | 'center' | 'right' | 'between';
}

export const DialogFooter: React.FC<DialogFooterProps> = ({
  children,
  align = 'right',
  className = '',
  ...props
}) => {
  const alignmentClasses = {
    left: 'justify-start',
    center: 'justify-center', 
    right: 'justify-end',
    between: 'justify-between',
  };
  
  return (
    <div
      className={`
        flex items-center ${alignmentClasses[align]}
        gap-[var(--space-2)]
        px-[var(--space-6)] pt-[var(--space-4)] pb-[var(--space-6)]
        border-t border-[var(--border-subtle)]
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Simple Dialog - All-in-one dialog component
 */
export interface SimpleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  size?: DialogContentProps['size'];
}

export const SimpleDialog: React.FC<SimpleDialogProps> = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = 'md',
}) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size={size}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        {children && <DialogBody>{children}</DialogBody>}
        {footer && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </Dialog>
  );
};
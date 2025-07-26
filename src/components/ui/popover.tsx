import * as React from 'react';
import { cn } from '../../lib/utils';

interface PopoverProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}

interface PopoverContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

const PopoverContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
}>({
  open: false,
  onOpenChange: () => {},
  triggerRef: { current: null },
});

export function Popover({ open = false, onOpenChange = () => {}, children }: PopoverProps) {
  const triggerRef = React.useRef<HTMLElement>(null);
  
  return (
    <PopoverContext.Provider value={{ open, onOpenChange, triggerRef }}>
      {children}
    </PopoverContext.Provider>
  );
}

export function PopoverTrigger({ children, asChild }: { children: React.ReactNode; asChild?: boolean }) {
  const { onOpenChange, triggerRef } = React.useContext(PopoverContext);
  
  if (asChild) {
    const child = React.Children.only(children) as React.ReactElement;
    return React.cloneElement(child, {
      ref: triggerRef,
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e);
        onOpenChange(true);
      },
    });
  }
  
  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={() => onOpenChange(true)}
    >
      {children}
    </button>
  );
}

export function PopoverContent({ 
  className, 
  align = 'center', 
  sideOffset = 4,
  children,
  ...props 
}: PopoverContentProps) {
  const { open, onOpenChange, triggerRef } = React.useContext(PopoverContext);
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        onOpenChange(false);
      }
    };
    
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false);
    };
    
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open, onOpenChange, triggerRef]);
  
  if (!open) return null;
  
  const triggerRect = triggerRef.current?.getBoundingClientRect();
  if (!triggerRect) return null;
  
  const style: React.CSSProperties = {
    position: 'fixed',
    top: triggerRect.bottom + sideOffset,
    ...(align === 'start' && { left: triggerRect.left }),
    ...(align === 'center' && { left: triggerRect.left + triggerRect.width / 2, transform: 'translateX(-50%)' }),
    ...(align === 'end' && { right: window.innerWidth - triggerRect.right }),
  };
  
  return (
    <div
      ref={contentRef}
      className={cn(
        "z-50 w-72 rounded-md border bg-white p-4 shadow-md animate-in fade-in-0 zoom-in-95",
        className
      )}
      style={style}
      {...props}
    >
      {children}
    </div>
  );
}
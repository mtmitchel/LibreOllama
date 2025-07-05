import React, { useState, useRef, useEffect } from 'react';

interface DropdownMenuProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  className?: string;
}

interface DropdownMenuItemProps {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

export function DropdownMenu({ children, trigger, className = '' }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node) &&
          triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  // Clone the trigger element to add our event handlers
  const triggerElement = React.cloneElement(
    trigger as React.ReactElement,
    {
      ref: triggerRef,
      onClick: handleTriggerClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    }
  );

  return (
    <div className={`relative ${className}`}>
      {triggerElement}
      
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 min-w-[160px] bg-surface border border-border-default rounded-md shadow-lg z-50 py-1"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>
      )}
    </div>
  );
}

export function DropdownMenuItem({ 
  children, 
  onClick, 
  className = '', 
  variant = 'default' 
}: DropdownMenuItemProps) {
  const variantClasses = {
    default: 'text-[var(--text-primary)] hover:bg-[var(--bg-surface)]',
    destructive: 'text-[var(--error)] hover:bg-[var(--error)] hover:bg-opacity-10 hover:text-[var(--error)]'
  };

  return (
    <button
      className={`w-full px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary rounded-sm ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <hr className="my-1 border-t border-border-default" />;
} 
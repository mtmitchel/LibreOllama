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
  const triggerRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        onClick={handleTriggerClick}
        className="outline-none"
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          className="absolute right-0 top-full mt-1 min-w-[160px] bg-bg-primary border border-border-default rounded-md shadow-lg z-50 py-1"
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
    default: 'text-text-primary hover:bg-bg-surface',
    destructive: 'text-red-500 hover:bg-red-50 hover:text-red-600'
  };

  return (
    <button
      className={`w-full px-3 py-2 text-left text-sm transition-colors ${variantClasses[variant]} ${className}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function DropdownMenuSeparator() {
  return <hr className="my-1 border-t border-border-subtle" />;
} 
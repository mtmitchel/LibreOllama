import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// 1. Create Context
interface DropdownMenuContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | null>(null);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu provider');
  }
  return context;
};

// 2. Main DropdownMenu Component (Provider)
export function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const value = { isOpen, setIsOpen, triggerRef, menuRef };

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

// 3. Trigger Component
interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger = ({ children, asChild = false }: DropdownMenuTriggerProps) => {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu();
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef as any,
      onClick: handleTriggerClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleTriggerClick}
      aria-expanded={isOpen}
      aria-haspopup="true"
    >
      {children}
    </button>
  );
};

// 4. Content Component
interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuContent = ({ children, className = '' }: DropdownMenuContentProps) => {
  const { isOpen, menuRef } = useDropdownMenu();

  if (!isOpen) return null;

  return (
    <div
      ref={menuRef}
      className={`absolute right-0 top-full mt-1 min-w-[160px] bg-[var(--bg-elevated)] border border-[var(--border-default)] rounded-md shadow-lg z-50 py-1 ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
};

// 5. Item Component
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
}

const DropdownMenuItem = ({ 
  children, 
  onSelect, 
  className = '', 
  variant = 'default' 
}: DropdownMenuItemProps) => {
  const { setIsOpen } = useDropdownMenu();
  const variantClasses = {
    default: 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
    destructive: 'text-[var(--error)] hover:bg-[var(--error)]/10'
  };

  const handleSelect = () => {
    onSelect?.();
    setIsOpen(false);
  };

  return (
    <button
      className={`w-full px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-bg-primary rounded-sm ${variantClasses[variant]} ${className}`}
      onClick={handleSelect}
    >
      {children}
    </button>
  );
};

// 6. Separator Component
const DropdownMenuSeparator = () => {
  return <hr className="my-1 border-t border-border-default" />;
};

// Attach sub-components
DropdownMenu.Trigger = DropdownMenuTrigger;
DropdownMenu.Content = DropdownMenuContent;
DropdownMenu.Item = DropdownMenuItem;
DropdownMenu.Separator = DropdownMenuSeparator; 
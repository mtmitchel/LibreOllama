import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

// 1. Create Context
interface DropdownMenuContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  itemRefs: React.RefObject<(HTMLButtonElement | null)[]>;
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
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      switch (event.key) {
        case 'Escape':
          event.preventDefault();
          setIsOpen(false);
          setFocusedIndex(-1);
          triggerRef.current?.focus();
          break;
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex(prev => {
            const nextIndex = prev < itemRefs.current.length - 1 ? prev + 1 : 0;
            itemRefs.current[nextIndex]?.focus();
            return nextIndex;
          });
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex(prev => {
            const prevIndex = prev > 0 ? prev - 1 : itemRefs.current.length - 1;
            itemRefs.current[prevIndex]?.focus();
            return prevIndex;
          });
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          itemRefs.current[0]?.focus();
          break;
        case 'End':
          event.preventDefault();
          const lastIndex = itemRefs.current.length - 1;
          setFocusedIndex(lastIndex);
          itemRefs.current[lastIndex]?.focus();
          break;
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, focusedIndex]);

  // Reset focus index when menu opens
  useEffect(() => {
    if (isOpen) {
      setFocusedIndex(-1);
    }
  }, [isOpen]);

  const value = { 
    isOpen, 
    setIsOpen, 
    triggerRef, 
    menuRef, 
    focusedIndex, 
    setFocusedIndex,
    itemRefs 
  };

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
  const { isOpen, setIsOpen, triggerRef, setFocusedIndex } = useDropdownMenu();
  
  const handleTriggerClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(!isOpen);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setIsOpen(true);
      setFocusedIndex(-1);
    }
  };

  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children, {
      ref: triggerRef as any,
      onClick: handleTriggerClick,
      onKeyDown: handleKeyDown,
      'aria-expanded': isOpen,
      'aria-haspopup': true,
    } as React.HTMLAttributes<HTMLElement>);
  }

  return (
    <button
      ref={triggerRef as React.RefObject<HTMLButtonElement>}
      onClick={handleTriggerClick}
      onKeyDown={handleKeyDown}
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
      role="menu"
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

let itemCounter = 0;

const DropdownMenuItem = ({ 
  children, 
  onSelect, 
  className = '', 
  variant = 'default' 
}: DropdownMenuItemProps) => {
  const { setIsOpen, itemRefs, focusedIndex, setFocusedIndex } = useDropdownMenu();
  const [itemIndex] = useState(() => itemCounter++);
  
  const variantClasses = {
    default: 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]',
    destructive: 'text-[var(--error)] hover:bg-[var(--error)]/10'
  };

  const handleSelect = () => {
    onSelect?.();
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect();
    }
  };

  const handleMouseEnter = () => {
    setFocusedIndex(itemIndex);
  };

  // Register this item ref
  useEffect(() => {
    return () => {
      // Reset counter when component unmounts (when menu closes)
      if (itemIndex === itemCounter - 1) {
        itemCounter = 0;
      }
    };
  }, [itemIndex]);

  return (
    <button
      ref={(el) => {
        if (itemRefs.current) {
          itemRefs.current[itemIndex] = el;
        }
      }}
      role="menuitem"
      className={`w-full px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-elevated)] rounded-sm ${variantClasses[variant]} ${className}`}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      onMouseEnter={handleMouseEnter}
      tabIndex={focusedIndex === itemIndex ? 0 : -1}
    >
      {children}
    </button>
  );
};

// 6. Separator Component
const DropdownMenuSeparator = () => {
  return <hr className="my-1 border-t border-[var(--border-default)]" role="separator" />;
};

// Reset item counter when menu unmounts
const originalDropdownMenu = DropdownMenu;
const WrappedDropdownMenu = (props: { children: React.ReactNode }) => {
  useEffect(() => {
    return () => {
      itemCounter = 0;
    };
  }, []);
  
  return originalDropdownMenu(props);
};

// Attach sub-components
WrappedDropdownMenu.Trigger = DropdownMenuTrigger;
WrappedDropdownMenu.Content = DropdownMenuContent;
WrappedDropdownMenu.Item = DropdownMenuItem;
WrappedDropdownMenu.Separator = DropdownMenuSeparator;

export { WrappedDropdownMenu as DropdownMenu }; 
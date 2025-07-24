import React, { useState, useRef, useEffect, createContext, useContext, useLayoutEffect } from 'react';
import ReactDOM from 'react-dom';
import { ChevronRight } from 'lucide-react';

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
      
      const currentIndex = focusedIndex;
      const itemCount = itemRefs.current.length;
      
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setFocusedIndex((currentIndex + 1) % itemCount);
          itemRefs.current[(currentIndex + 1) % itemCount]?.focus();
          break;
        case 'ArrowUp':
          event.preventDefault();
          setFocusedIndex((currentIndex - 1 + itemCount) % itemCount);
          itemRefs.current[(currentIndex - 1 + itemCount) % itemCount]?.focus();
          break;
        case 'Home':
          event.preventDefault();
          setFocusedIndex(0);
          itemRefs.current[0]?.focus();
          break;
        case 'End': {
          event.preventDefault();
          const lastIndex = itemRefs.current.length - 1;
          setFocusedIndex(lastIndex);
          itemRefs.current[lastIndex]?.focus();
          break;
        }
        case 'Escape':
          setIsOpen(false);
          triggerRef.current?.focus();
          break;
        default:
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
    const originalOnClick = (children.props as any).onClick;
    const composedOnClick = (e: React.MouseEvent) => {
      originalOnClick?.(e);
      handleTriggerClick(e);
    };
    
    return React.cloneElement(children, {
      ref: triggerRef as React.RefObject<HTMLElement>,
      onClick: composedOnClick,
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
  const { isOpen, menuRef, triggerRef } = useDropdownMenu();
  const [style, setStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setStyle({
        position: 'fixed',
        top: `${rect.bottom + 4}px`, // Add some space
        left: `${rect.left}px`,
        minWidth: `${rect.width}px`,
      });
    }
  }, [isOpen, triggerRef]);
  
  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <div
      ref={menuRef}
      style={style}
      role="menu"
      className={`border-border-default animate-in fade-in-0 zoom-in-95 z-[9999] rounded-md border bg-surface py-1 shadow-lg ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>,
    document.body
  );
};

// 6. Sub-menu Components
const SubMenuContext = createContext<{
  isSubMenuOpen: boolean;
  setIsSubMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  handleOpen: () => void;
  handleClose: () => void;
} | null>(null);

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
    const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const timerRef = useRef<number | undefined>(undefined);

    const handleOpen = () => {
        window.clearTimeout(timerRef.current);
        if (!isSubMenuOpen) {
            setIsSubMenuOpen(true);
        }
    };
    
    const handleClose = () => {
        console.log('⏰ DropdownMenuSub handleClose called - with delay');
        // Add a small delay to prevent race conditions when moving from trigger to submenu
        timerRef.current = window.setTimeout(() => {
            setIsSubMenuOpen(false);
        }, 150);
    };

    const value = { isSubMenuOpen, setIsSubMenuOpen, triggerRef, handleOpen, handleClose };

    return (
        <SubMenuContext.Provider value={value}>
            <div className="relative">
                {children}
            </div>
        </SubMenuContext.Provider>
    );
}

const DropdownMenuSubTrigger = ({ children, className, ...props }: DropdownMenuItemProps) => {
    const { triggerRef, handleOpen, handleClose, isSubMenuOpen, setIsSubMenuOpen } = useContext(SubMenuContext)!;
    
    const handleClick = (e: React.MouseEvent) => {
        console.log('🖱️ DropdownMenuSubTrigger handleClick called');
        e.preventDefault();
        e.stopPropagation();
        setIsSubMenuOpen(!isSubMenuOpen);
    };
    
    return (
        <button
            ref={triggerRef}
            onClick={handleClick}
            onMouseEnter={handleOpen}
            onMouseLeave={handleClose}
            className={`focus:ring-accent-primary flex w-full items-center justify-between rounded-sm px-3 py-2 text-left text-sm text-primary transition-colors hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${className}`}
            {...props}
        >
            {children}
            <ChevronRight size={16} />
        </button>
    );
};

const DropdownMenuSubContent = ({ children, className }: DropdownMenuContentProps) => {
    const { isSubMenuOpen, triggerRef, handleOpen, handleClose } = useContext(SubMenuContext)!;
    const [style, setStyle] = useState<React.CSSProperties>({ opacity: 0, position: 'fixed' });
    const menuRef = useRef<HTMLDivElement>(null);
    const contentTimerRef = useRef<number | undefined>(undefined);

    // Clear timers on unmount
    useEffect(() => {
        return () => {
            if (contentTimerRef.current) {
                window.clearTimeout(contentTimerRef.current);
            }
        };
    }, []);

    useLayoutEffect(() => {
      if (isSubMenuOpen && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        
        // Position submenu to overlap with trigger to prevent dead zones
        const initialLeft = rect.right - 8; // Overlap by 8px to create buffer
        const initialTop = rect.top;
        
        // Set initial position for measurement
        setStyle({
            position: 'fixed',
            zIndex: 10000,
            top: `${initialTop}px`,
            left: `${initialLeft}px`,
            opacity: 1,
        });
        
        // Adjust positioning after render if needed
        setTimeout(() => {
          if (menuRef.current && isSubMenuOpen) {
            const menuRect = menuRef.current.getBoundingClientRect();
            
            // Check if we need to adjust horizontal positioning
            const spaceOnRight = window.innerWidth - rect.right;
            let left = rect.right - 8; // Overlap by 8px
            if (spaceOnRight < menuRect.width && rect.left > menuRect.width) {
              left = rect.left - menuRect.width + 8; // Overlap when positioning left
            }

            // Check if we need to adjust vertical positioning
            const spaceBelow = window.innerHeight - rect.bottom;
            let top = rect.top;
            if (spaceBelow < menuRect.height && rect.top > menuRect.height) {
              top = rect.bottom - menuRect.height;
            }

            // Update with adjusted positioning if needed
            setStyle({
                position: 'fixed',
                zIndex: 10000,
                top: `${top}px`,
                left: `${left}px`,
                opacity: 1,
            });
          }
        }, 0);
      } else {
        setStyle({ opacity: 0, position: 'fixed', zIndex: -1 });
      }
    }, [isSubMenuOpen, triggerRef]);

    if (!isSubMenuOpen) return null;

    const handleContentMouseEnter = () => {
        console.log('🎯 SubContent mouseEnter - clearing close timer');
        if (contentTimerRef.current) {
            window.clearTimeout(contentTimerRef.current);
        }
        handleOpen();
    };

    const handleContentMouseLeave = () => {
        console.log('🎯 SubContent mouseLeave - starting close timer');
        contentTimerRef.current = window.setTimeout(() => {
            handleClose();
        }, 150);
    };

    return ReactDOM.createPortal(
        <div 
            ref={menuRef}
            style={style}
            onMouseEnter={handleContentMouseEnter}
            onMouseLeave={handleContentMouseLeave}
            onMouseDown={(e) => e.stopPropagation()}
            className={`border-border-default animate-in fade-in-0 zoom-in-95 z-[10000] rounded-md border bg-surface py-1 shadow-lg ${className}`}
        >
            {children}
        </div>,
        document.body
    );
};

// 7. Item Component
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

let itemCounter = 0;

const DropdownMenuItem = ({
  children,
  onSelect,
  className = '',
  variant = 'default',
  disabled = false
}: DropdownMenuItemProps) => {
  const dropdownContext = useContext(DropdownMenuContext);
  const subMenuContext = useContext(SubMenuContext);
  
  // Use the appropriate context based on whether we're in a submenu
  const context = subMenuContext || dropdownContext;
  const isInSubmenu = !!subMenuContext;
  
  const { setIsOpen, itemRefs, focusedIndex, setFocusedIndex } = dropdownContext!;
  const [itemIndex] = useState(() => itemCounter++);
  
  const variantClasses = {
    default: 'text-primary hover:bg-tertiary',
    destructive: 'text-error hover:bg-error/10'
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (disabled) return;
    
    console.log('🎯 DropdownMenuItem handleSelect called', { onSelect: !!onSelect, isInSubmenu });
    e.preventDefault();
    e.stopPropagation();
    
    // Execute the onSelect callback
    if (onSelect) {
      console.log('🚀 Executing onSelect callback');
      onSelect();
    }
    
    // Close the submenu if we're in one
    if (isInSubmenu && subMenuContext) {
      console.log('🔒 Closing submenu');
      subMenuContext.setIsSubMenuOpen(false);
    }
    
    // Close the main menu
    console.log('🔒 Closing main menu');
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleSelect(e as unknown as React.MouseEvent);
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
      disabled={disabled}
      className={`focus:ring-accent-primary w-full rounded-sm px-3 py-2 text-left text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${variantClasses[variant]} ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      onClick={handleSelect}
      onMouseDown={(e) => e.preventDefault()}
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
  return <div className="bg-border-default my-1 h-px" />;
};

// 7. Compound Component
const WrappedDropdownMenu = (props: { children: React.ReactNode }) => {
  return <DropdownMenu {...props} />;
};

WrappedDropdownMenu.Trigger = DropdownMenuTrigger;
WrappedDropdownMenu.Content = DropdownMenuContent;
WrappedDropdownMenu.Item = DropdownMenuItem;
WrappedDropdownMenu.Sub = DropdownMenuSub;
WrappedDropdownMenu.SubTrigger = DropdownMenuSubTrigger;
WrappedDropdownMenu.SubContent = DropdownMenuSubContent;
WrappedDropdownMenu.Separator = DropdownMenuSeparator;

export { 
  WrappedDropdownMenu as DropdownMenu, 
  DropdownMenuTrigger, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSub, 
  DropdownMenuSubTrigger, 
  DropdownMenuSubContent, 
  DropdownMenuSeparator 
};
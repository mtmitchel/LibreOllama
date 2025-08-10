/**
 * Legacy DropdownMenu Compatibility Wrapper
 * 
 * This file provides backward compatibility for the legacy DropdownMenu API
 * by wrapping the design-system Dropdown component.
 * 
 * @deprecated Use design-system/Dropdown directly for new implementations
 */

import React, { useState, useRef, useEffect, createContext, useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import { Dropdown, ActionMenu } from './design-system/Dropdown';
import { Popover, PopoverContent } from './design-system/Popover';

// Legacy Context for compound component pattern
interface DropdownMenuContextProps {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLElement | null>;
  menuRef: React.RefObject<HTMLDivElement | null>;
  focusedIndex: number;
  setFocusedIndex: React.Dispatch<React.SetStateAction<number>>;
  itemRefs: React.RefObject<(HTMLButtonElement | null)[]>;
  items: Array<{
    children: React.ReactNode;
    onSelect?: () => void;
    variant?: 'default' | 'destructive';
    disabled?: boolean;
    separator?: boolean;
  }>;
  addItem: (item: any) => void;
}

const DropdownMenuContext = createContext<DropdownMenuContextProps | null>(null);

const useDropdownMenu = () => {
  const context = useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('useDropdownMenu must be used within a DropdownMenu provider');
  }
  return context;
};

// Main DropdownMenu wrapper
function DropdownMenu({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [items, setItems] = useState<any[]>([]);
  const menuRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const addItem = (item: any) => {
    setItems(prev => [...prev, item]);
  };

  const value = { 
    isOpen, 
    setIsOpen, 
    triggerRef, 
    menuRef, 
    focusedIndex, 
    setFocusedIndex,
    itemRefs,
    items,
    addItem
  };

  // Extract trigger and content from children
  let trigger: React.ReactNode = null;
  let content: React.ReactNode = null;
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      if (child.type === DropdownMenuTrigger) {
        trigger = child;
      } else if (child.type === DropdownMenuContent) {
        content = child;
      }
    }
  });

  return (
    <DropdownMenuContext.Provider value={value}>
      <div className="relative">
        {trigger}
        {content}
      </div>
    </DropdownMenuContext.Provider>
  );
}

// Trigger Component - wraps the Popover trigger
interface DropdownMenuTriggerProps {
  children: React.ReactNode;
  asChild?: boolean;
}

const DropdownMenuTrigger = ({ children, asChild = false }: DropdownMenuTriggerProps) => {
  const { isOpen, setIsOpen, triggerRef } = useDropdownMenu();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsOpen(!isOpen);
  };
  
  // If asChild, try to pass props to child element
  if (asChild && React.isValidElement(children)) {
    const childElement = React.Children.only(children) as React.ReactElement<any>;
    return React.cloneElement(childElement, {
      onClick: handleClick,
      ref: triggerRef as any
    });
  }
  
  // Otherwise wrap in a div
  return (
    <div
      ref={triggerRef as React.RefObject<HTMLDivElement>}
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup={true}
      className="inline-block"
    >
      {children}
    </div>
  );
};

// Content Component - renders items using PopoverContent
interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
}

const DropdownMenuContent = ({ children, className = '' }: DropdownMenuContentProps) => {
  const { isOpen, menuRef, items } = useDropdownMenu();
  
  // Collect items from children
  const menuItems: React.ReactNode[] = [];
  
  React.Children.forEach(children, (child) => {
    if (React.isValidElement(child)) {
      menuItems.push(child);
    }
  });

  if (!isOpen) return null;

  return (
    <PopoverContent
      className={`min-w-[180px] py-[var(--space-0-5)] ${className}`}
    >
      <div ref={menuRef} role="menu">
        {menuItems}
      </div>
    </PopoverContent>
  );
};

// Sub-menu context for nested menus
const SubMenuContext = createContext<{
  isSubMenuOpen: boolean;
  setIsSubMenuOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
} | null>(null);

function DropdownMenuSub({ children }: { children: React.ReactNode }) {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const value = { isSubMenuOpen, setIsSubMenuOpen, triggerRef };

  return (
    <SubMenuContext.Provider value={value}>
      <div className="relative">
        {children}
      </div>
    </SubMenuContext.Provider>
  );
}

// Item Component props
interface DropdownMenuItemProps {
  children: React.ReactNode;
  onSelect?: () => void;
  className?: string;
  variant?: 'default' | 'destructive';
  disabled?: boolean;
}

const DropdownMenuSubTrigger = ({ children, className, ...props }: DropdownMenuItemProps) => {
  const { triggerRef, isSubMenuOpen, setIsSubMenuOpen } = useContext(SubMenuContext)!;
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsSubMenuOpen(!isSubMenuOpen);
  };
  
  return (
    <button
      ref={triggerRef}
      onClick={handleClick}
      className={`focus:ring-accent-primary flex w-full items-center justify-between rounded-sm px-3 py-2 text-left asana-text-sm text-primary transition-colors hover:bg-tertiary focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-surface ${className}`}
      {...props}
    >
      {children}
      <ChevronRight size={16} />
    </button>
  );
};

const DropdownMenuSubContent = ({ children, className }: DropdownMenuContentProps) => {
  const { isSubMenuOpen } = useContext(SubMenuContext)!;
  
  if (!isSubMenuOpen) return null;

  return (
    <PopoverContent 
      className={`absolute left-full top-0 ml-1 min-w-[180px] py-[var(--space-0-5)] ${className}`}
    >
      {children}
    </PopoverContent>
  );
};

// Item Component
const DropdownMenuItem = ({
  children,
  onSelect,
  className = '',
  variant = 'default',
  disabled = false
}: DropdownMenuItemProps) => {
  const dropdownContext = useContext(DropdownMenuContext);
  const subMenuContext = useContext(SubMenuContext);
  
  const isInSubmenu = !!subMenuContext;
  
  const { setIsOpen } = dropdownContext!;
  
  const variantClasses = {
    default: 'text-primary hover:bg-tertiary',
    destructive: 'text-error hover:bg-error/10'
  };

  const handleSelect = (e: React.MouseEvent) => {
    if (disabled) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    if (onSelect) {
      onSelect();
    }
    
    if (isInSubmenu && subMenuContext) {
      subMenuContext.setIsSubMenuOpen(false);
    }
    
    setIsOpen(false);
  };

  return (
    <button
      role="menuitem"
      disabled={disabled}
      className={`w-full flex items-center gap-[var(--space-1)] px-[var(--space-1-5)] py-[var(--space-1)] asana-text-base text-left transition-[var(--transition-property)] duration-[var(--transition-duration)] ${variantClasses[variant]} ${className} ${disabled ? 'cursor-not-allowed opacity-50' : ''}`.trim()}
      onClick={handleSelect}
    >
      {children}
    </button>
  );
};

// Separator Component
const DropdownMenuSeparator = () => {
  return <div className="my-[var(--space-0-5)] h-px bg-[var(--border-default)]" />;
};

// Compound Component wrapper
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

// Re-export design system components for migration
export { Dropdown, ActionMenu } from './design-system/Dropdown';
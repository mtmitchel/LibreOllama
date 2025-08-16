import React from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../core/lib/utils';
import { Button } from './index';
import type { LucideIcon } from 'lucide-react';

interface FloatingActionButtonProps {
  icon: LucideIcon;
  label?: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  usePortal?: boolean;
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  className,
  usePortal = true,
}: FloatingActionButtonProps) {
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const sizeClasses = {
    sm: 'h-12 w-12',
    md: 'h-14 w-14',
    lg: 'h-16 w-16'
  };

  const iconSizes = {
    sm: 18,
    md: 20,
    lg: 24
  };

  const content = (
    <div className={cn('fixed z-[1000] pointer-events-auto', positionClasses[position], className)}>
      <Button
        variant={variant}
        onClick={onClick}
        className={cn(
          'rounded-full shadow-lg transition-all duration-200 hover:shadow-xl',
          'hover:scale-105 active:scale-95',
          sizeClasses[size],
          'flex items-center justify-center p-0',
          label && 'w-auto gap-2 px-6'
        )}
        aria-label={label || 'Floating action button'}
      >
        <Icon size={iconSizes[size]} />
        {label && <span className="font-medium">{label}</span>}
      </Button>
    </div>
  );

  return usePortal ? createPortal(content, document.body) : content;
}

// Extended FAB with menu options
interface FABMenuItem {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
}

interface FloatingActionMenuProps extends Omit<FloatingActionButtonProps, 'onClick'> {
  items: FABMenuItem[];
}

export function FloatingActionMenu({
  icon: Icon,
  items,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  className,
  usePortal = true,
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      console.log('FloatingActionMenu opened with items:', items);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, items]);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const menuDirection = position.includes('bottom') ? 'bottom-full mb-3' : 'top-full mt-3';

  const content = (
    <div ref={menuRef} className={cn('fixed z-[1000] pointer-events-auto', positionClasses[position], className)}>
      {/* Menu items */}
      {isOpen && (
        <div 
          className={cn('absolute', menuDirection, 'right-0')} 
          style={{ 
            minWidth: '200px',
            zIndex: 99999,
          }}
        >
          <div 
            className="rounded-lg border-2 p-3 shadow-2xl"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.98)',
              borderColor: 'rgba(0, 0, 0, 0.1)',
              backdropFilter: 'blur(10px)',
            }}
          >
            <div className="flex flex-col gap-2">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="flex w-full items-center justify-start gap-3 whitespace-nowrap rounded-md px-4 py-2.5 transition-all text-left"
              style={{
                backgroundColor: 'transparent',
                color: '#1f2937',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(0, 0, 0, 0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              <item.icon size={18} />
              <span className="text-sm font-semibold">{item.label}</span>
            </button>
          ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Main FAB */}
      <FloatingActionButton
        icon={Icon}
        onClick={() => setIsOpen(!isOpen)}
        variant={variant}
        size={size}
        className={cn('transition-transform duration-200', isOpen && 'rotate-45')}
        usePortal={false}
      />
    </div>
  );

  return usePortal ? createPortal(content, document.body) : content;
}
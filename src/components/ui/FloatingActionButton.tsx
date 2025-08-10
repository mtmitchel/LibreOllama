import React from 'react';
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
}

export function FloatingActionButton({
  icon: Icon,
  label,
  onClick,
  position = 'bottom-right',
  variant = 'primary',
  size = 'md',
  className
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

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
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
  className
}: FloatingActionMenuProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  const menuDirection = position.includes('bottom') ? 'bottom-full mb-2' : 'top-full mt-2';

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Menu items */}
      {isOpen && (
        <div className={cn('absolute', menuDirection, 'right-0 space-y-2')}>
          {items.map((item, index) => (
            <Button
              key={index}
              variant="secondary"
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              className="flex w-auto items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 shadow-md hover:shadow-lg"
            >
              <item.icon size={16} />
              <span className="asana-text-sm">{item.label}</span>
            </Button>
          ))}
        </div>
      )}
      
      {/* Main FAB */}
      <FloatingActionButton
        icon={Icon}
        onClick={() => setIsOpen(!isOpen)}
        variant={variant}
        size={size}
        className={cn(isOpen && 'rotate-45')}
      />
    </div>
  );
}
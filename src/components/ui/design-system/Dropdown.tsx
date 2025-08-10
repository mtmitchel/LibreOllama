import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, MoreHorizontal } from 'lucide-react';
import { Popover, PopoverContent } from './Popover';

/**
 * Design System Dropdown Component
 * 
 * DLS Compliant Dropdown Menu following Asana patterns
 * Builds on top of Popover for consistent behavior
 */

export interface DropdownItem {
  value: string;
  label: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

export interface DropdownProps {
  items: DropdownItem[];
  onSelect?: (value: string) => void;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  menuClassName?: string;
  placement?: 'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end';
  closeOnSelect?: boolean;
}

export const Dropdown: React.FC<DropdownProps> = ({
  items = [],
  onSelect,
  trigger,
  triggerClassName = '',
  menuClassName = '',
  placement = 'bottom-start',
  closeOnSelect = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (item: DropdownItem) => {
    if (item.disabled || item.separator) return;
    
    onSelect?.(item.value);
    
    if (closeOnSelect) {
      setIsOpen(false);
    }
  };

  const defaultTrigger = (
    <button
      className={`
        inline-flex items-center justify-center
        p-[var(--space-1)]
        rounded-[var(--radius-md)]
        text-[color:var(--text-secondary)]
        hover:bg-[var(--bg-secondary)]
        transition-[var(--transition-property)]
        duration-[var(--transition-duration)]
        ${triggerClassName}
      `}
      aria-label="More options"
    >
      <MoreHorizontal size={16} />
    </button>
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      content={
        <div className={`min-w-[180px] py-[var(--space-0-5)] ${menuClassName}`}>
          {items && items.length > 0 ? items.map((item, index) => {
            if (item.separator) {
              return (
                <div
                  key={`separator-${index}`}
                  className="my-[var(--space-0-5)] h-px bg-[var(--border-default)]"
                />
              );
            }

            return (
              <button
                key={item.value}
                onClick={() => handleSelect(item)}
                disabled={item.disabled}
                className={`
                  w-full flex items-center gap-[var(--space-1)]
                  px-[var(--space-1-5)] py-[var(--space-1)]
                  asana-text-base text-left
                  transition-[var(--transition-property)]
                  duration-[var(--transition-duration)]
                  ${item.disabled 
                    ? 'text-[color:var(--text-muted)] cursor-not-allowed' 
                    : item.destructive
                      ? 'text-[var(--semantic-error)] hover:bg-red-50'
                      : 'text-[color:var(--text-primary)] hover:bg-[var(--bg-secondary)]'
                  }
                `}
              >
                {item.icon && (
                  <span className="flex-shrink-0 w-4 h-4">
                    {item.icon}
                  </span>
                )}
                <span className="flex-1">{item.label}</span>
              </button>
            );
          }) : (
            <div className="px-[var(--space-1-5)] py-[var(--space-1)] text-[color:var(--text-secondary)] asana-text-sm">
              No options available
            </div>
          )}
        </div>
      }
      placement={placement as any}
      trigger="click"
    >
      {trigger || defaultTrigger}
    </Popover>
  );
};

/**
 * Action Menu - Common dropdown pattern for row actions
 */
export interface ActionMenuItem {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
  disabled?: boolean;
  destructive?: boolean;
  separator?: boolean;
}

export const ActionMenu: React.FC<{
  items: ActionMenuItem[];
  trigger?: React.ReactNode;
  placement?: DropdownProps['placement'];
}> = ({ items, trigger, placement = 'bottom-end' }) => {
  const dropdownItems: DropdownItem[] = items.map((item, index) => ({
    value: `action-${index}`,
    label: item.label,
    icon: item.icon,
    disabled: item.disabled,
    destructive: item.destructive,
    separator: item.separator,
  }));

  const handleSelect = (value: string) => {
    const index = parseInt(value.replace('action-', ''));
    const item = items[index];
    if (item && !item.separator && item.onClick) {
      item.onClick();
    }
  };

  return (
    <Dropdown
      items={dropdownItems}
      onSelect={handleSelect}
      trigger={trigger}
      placement={placement}
    />
  );
};

/**
 * Select Dropdown - Alternative to Select component with custom rendering
 */
export const SelectDropdown: React.FC<{
  options: Array<{ value: string; label: string; icon?: React.ReactNode }>;
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
}> = ({ options, value, onChange, placeholder = 'Select...', className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find(opt => opt.value === value);

  const dropdownItems: DropdownItem[] = options.map(opt => ({
    ...opt,
    value: opt.value,
  }));

  return (
    <Dropdown
      items={dropdownItems}
      onSelect={(val) => {
        onChange?.(val);
        setIsOpen(false);
      }}
      trigger={
        <button
          className={`
            flex items-center justify-between
            min-w-[200px] px-[var(--space-1-5)] py-[var(--space-1)]
            bg-[var(--bg-secondary)]
            border border-[var(--border-default)]
            rounded-[var(--radius-md)]
            asana-text-base text-left
            hover:border-[var(--border-focus)]
            transition-[var(--transition-property)]
            duration-[var(--transition-duration)]
            ${className}
          `}
        >
          <span className="flex items-center gap-[var(--space-1)]">
            {selectedOption?.icon && (
              <span className="flex-shrink-0">{selectedOption.icon}</span>
            )}
            <span className={!selectedOption ? 'text-[color:var(--text-secondary)]' : ''}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </span>
          <ChevronDown size={16} className="text-[color:var(--text-secondary)]" />
        </button>
      }
      placement="bottom-start"
    />
  );
};
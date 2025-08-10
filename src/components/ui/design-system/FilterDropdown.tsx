import React, { useState, useRef } from 'react';
import { Check, X, Filter, ChevronDown } from 'lucide-react';
import { Popover, PopoverContent } from './Popover';
import { Button } from './Button';
import { Badge } from './Badge';

/**
 * Design System FilterDropdown Component
 * 
 * DLS Compliant Filter Dropdown following Asana patterns
 * - Multi-select filtering interface
 * - Search within options
 * - Select/clear all actions
 * - Visual filter indicators
 */

export interface FilterOption {
  value: string;
  label: string;
  color?: string;
  count?: number;
  disabled?: boolean;
}

export interface FilterDropdownProps {
  options: FilterOption[];
  selectedValues: string[];
  onSelectionChange: (values: string[]) => void;
  title?: string;
  placeholder?: string;
  searchable?: boolean;
  showCount?: boolean;
  maxHeight?: number;
  trigger?: React.ReactNode;
  triggerClassName?: string;
  disabled?: boolean;
  placement?: 'bottom' | 'bottom-start' | 'bottom-end' | 'top' | 'top-start' | 'top-end';
  onOpen?: () => void;
  onClose?: () => void;
}

export const FilterDropdown: React.FC<FilterDropdownProps> = ({
  options,
  selectedValues,
  onSelectionChange,
  title = 'Filter',
  placeholder = 'Search filters...',
  searchable = true,
  showCount = true,
  maxHeight = 320,
  trigger,
  triggerClassName = '',
  disabled = false,
  placement = 'bottom-start',
  onOpen,
  onClose,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Filter options based on search query
  const filteredOptions = searchable
    ? options.filter(option =>
        option.label.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : options;

  const handleToggle = (value: string) => {
    const newValues = selectedValues.includes(value)
      ? selectedValues.filter(v => v !== value)
      : [...selectedValues, value];
    onSelectionChange(newValues);
  };

  const handleSelectAll = () => {
    const selectableOptions = filteredOptions.filter(opt => !opt.disabled);
    const allValues = selectableOptions.map(opt => opt.value);
    const newValues = [...new Set([...selectedValues, ...allValues])];
    onSelectionChange(newValues);
  };

  const handleClearAll = () => {
    const remainingValues = selectedValues.filter(value =>
      !filteredOptions.some(opt => opt.value === value)
    );
    onSelectionChange(remainingValues);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      onOpen?.();
      // Focus search input when opened
      setTimeout(() => {
        if (searchable && searchInputRef.current) {
          searchInputRef.current.focus();
        }
      }, 100);
    } else {
      onClose?.();
      setSearchQuery('');
    }
  };

  const hasFilteredSelection = filteredOptions.some(opt =>
    selectedValues.includes(opt.value)
  );

  const defaultTrigger = (
    <Button
      variant="outline"
      size="sm"
      className={`
        ${selectedValues.length > 0 ? 'border-[var(--brand-primary)] text-[var(--brand-primary)]' : ''}
        ${triggerClassName}
      `}
      disabled={disabled}
    >
      <Filter size={14} />
      {title}
      {selectedValues.length > 0 && (
        <Badge size="sm" variant="primary" className="ml-[var(--space-1)]">
          {selectedValues.length}
        </Badge>
      )}
      <ChevronDown size={14} className="opacity-60" />
    </Button>
  );

  return (
    <Popover
      open={isOpen}
      onOpenChange={handleOpenChange}
      placement={placement}
      trigger="click"
      content={
        <PopoverContent className="p-0 min-w-[280px]">
        {/* Header */}
        <div className="flex items-center justify-between p-[var(--space-3)] border-b border-[var(--border-subtle)]">
          <h3 className="asana-text-base font-medium text-[color:var(--text-primary)]">
            {title}
          </h3>
          <button
            onClick={() => handleOpenChange(false)}
            className={`
              p-[var(--space-0-5)]
              rounded-[var(--radius-sm)]
              text-[color:var(--text-secondary)]
              hover:bg-[var(--bg-secondary)]
              hover:text-[color:var(--text-primary)]
              transition-[var(--transition-property)]
              duration-[var(--transition-duration)]
            `}
          >
            <X size={14} />
          </button>
        </div>

        {/* Search */}
        {searchable && (
          <div className="p-[var(--space-3)] border-b border-[var(--border-subtle)]">
            <input
              ref={searchInputRef}
              type="text"
              placeholder={placeholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`
                w-full
                px-[var(--space-2)] py-[var(--space-1)]
                bg-[var(--bg-secondary)]
                border border-[var(--border-default)]
                rounded-[var(--radius-sm)]
                asana-text-base
                text-[color:var(--text-primary)]
                placeholder:text-[color:var(--text-muted)]
                focus:border-[var(--border-focus)]
                focus:outline-none
                transition-[var(--transition-property)]
                duration-[var(--transition-duration)]
              `}
            />
          </div>
        )}

        {/* Actions */}
        {filteredOptions.length > 0 && (
          <div className="flex items-center justify-between px-[var(--space-3)] py-[var(--space-2)] border-b border-[var(--border-subtle)]">
            <button
              onClick={handleSelectAll}
              className={`
                px-[var(--space-1)] py-[var(--space-0-5)]
                 asana-text-sm
                text-[var(--brand-primary)]
                hover:bg-[var(--brand-subtle)]
                rounded-[var(--radius-sm)]
                transition-[var(--transition-property)]
                duration-[var(--transition-duration)]
              `}
            >
              Select all
            </button>
            <button
              onClick={handleClearAll}
              disabled={!hasFilteredSelection}
              className={`
                px-[var(--space-1)] py-[var(--space-0-5)]
                 asana-text-sm
                 text-[color:var(--text-secondary)]
                hover:bg-[var(--bg-secondary)]
                rounded-[var(--radius-sm)]
                transition-[var(--transition-property)]
                duration-[var(--transition-duration)]
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              Clear all
            </button>
          </div>
        )}

        {/* Options */}
        <div className="max-h-[200px] overflow-y-auto">
          {filteredOptions.length === 0 ? (
            <div className="py-[var(--space-6)] text-center">
              <p className="asana-text-sm text-[color:var(--text-muted)]">
                {searchQuery ? 'No options match your search' : 'No options available'}
              </p>
            </div>
          ) : (
            <div className="py-[var(--space-1)]">
              {filteredOptions.map((option) => {
                const isSelected = selectedValues.includes(option.value);
                
                return (
                  <label
                    key={option.value}
                    className={`
                      flex items-center gap-[var(--space-2)]
                      px-[var(--space-3)] py-[var(--space-1-5)]
                      cursor-pointer
                      hover:bg-[var(--bg-secondary)]
                      transition-[var(--transition-property)]
                      duration-[var(--transition-duration)]
                      ${option.disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => !option.disabled && handleToggle(option.value)}
                      disabled={option.disabled}
                      className="sr-only"
                    />
                    
                    {/* Checkbox */}
                    <div
                      className={`
                        w-4 h-4 rounded-[var(--radius-sm)]
                        border-2 flex items-center justify-center
                        transition-[var(--transition-property)]
                        duration-[var(--transition-duration)]
                        ${isSelected
                          ? 'bg-[var(--brand-primary)] border-[var(--brand-primary)]'
                          : 'bg-transparent border-[var(--border-default)]'
                        }
                      `}
                    >
                      {isSelected && <Check size={10} className="text-[color:var(--text-on-brand)]" />}
                    </div>

                    {/* Option Content */}
                    <div className="flex-1 flex items-center justify-between">
                      <div className="flex items-center gap-[var(--space-1)]">
                        {option.color && (
                          <span
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: option.color }}
                          />
                        )}
                        <span className="asana-text-base text-[color:var(--text-primary)]">
                          {option.label}
                        </span>
                      </div>
                      
                      {showCount && option.count !== undefined && (
                        <span className="asana-text-sm text-[color:var(--text-muted)]">
                          {option.count}
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {selectedValues.length > 0 && (
          <div className="px-[var(--space-3)] py-[var(--space-2)] border-t border-[var(--border-subtle)]">
             <p className="asana-text-sm text-[color:var(--text-secondary)]">
              {selectedValues.length} item{selectedValues.length !== 1 ? 's' : ''} selected
            </p>
          </div>
        )}
      </PopoverContent>
      }
    >
      {trigger || defaultTrigger}
    </Popover>
  );
};

/**
 * Simple Filter Button - Basic filter toggle
 */
export interface FilterButtonProps {
  active?: boolean;
  count?: number;
  onClick?: () => void;
  children: React.ReactNode;
  variant?: 'outline' | 'ghost';
  size?: 'sm' | 'md';
}

export const FilterButton: React.FC<FilterButtonProps> = ({
  active = false,
  count,
  onClick,
  children,
  variant = 'outline',
  size = 'sm',
}) => {
  const mappedSize: 'sm' | 'default' = size === 'md' ? 'default' : 'sm';
  return (
    <Button
      variant={active ? 'primary' : variant}
      size={mappedSize}
      onClick={onClick}
      className={active ? 'shadow-[var(--shadow-focus)]' : ''}
    >
      <Filter size={14} />
      {children}
      {count !== undefined && count > 0 && (
        <Badge size="sm" variant={active ? 'secondary' : 'primary'}>
          {count}
        </Badge>
      )}
    </Button>
  );
};

/**
 * Filter Bar - Container for multiple filters
 */
export interface FilterBarProps {
  children: React.ReactNode;
  className?: string;
  gap?: 'sm' | 'md' | 'lg';
  wrap?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  children,
  className = '',
  gap = 'sm',
  wrap = true,
}) => {
  const gapClasses = {
    sm: 'gap-[var(--space-1)]',
    md: 'gap-[var(--space-2)]',
    lg: 'gap-[var(--space-3)]',
  };

  return (
    <div
      className={`
        flex items-center
        ${wrap ? 'flex-wrap' : ''}
        ${gapClasses[gap]}
        ${className}
      `}
    >
      {children}
    </div>
  );
};
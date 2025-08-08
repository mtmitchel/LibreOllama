import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Design System Select Component
 * 
 * DLS Compliant Select/Dropdown following Asana patterns
 * - Background: #F6F7F8 (default input background)
 * - Focus state with #796EFF ring
 * - Smooth transitions and proper shadows
 */

const selectTriggerVariants = cva(
  `
    flex items-center justify-between w-full
    px-[var(--space-1-5)] py-[var(--space-1)]
    text-[var(--text-body)]
    font-[family-name:var(--font-family-sans)]
    bg-[var(--bg-secondary)]
    border border-[var(--border-default)]
    rounded-[var(--radius-md)]
    cursor-pointer
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
    outline-none
    hover:border-[var(--border-focus)]
    focus:border-[var(--brand-primary)]
    focus:shadow-[var(--shadow-focus)]
    disabled:opacity-50
    disabled:cursor-not-allowed
  `
);

const selectMenuVariants = cva(
  `
    absolute z-[var(--z-dropdown)] w-full mt-1 py-1
    bg-[var(--bg-primary)]
    border border-[var(--border-default)]
    rounded-[var(--radius-md)]
    shadow-[var(--shadow-popover)]
    overflow-hidden
    animate-in fade-in-0 zoom-in-95
  `
);

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
  icon?: React.ReactNode;
}

export interface SelectProps {
  options: SelectOption[];
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  size?: 'sm' | 'default' | 'lg';
}

export const Select = React.forwardRef<HTMLDivElement, SelectProps>(
  ({ 
    options, 
    value, 
    onChange, 
    placeholder = 'Select an option',
    disabled = false,
    className = '',
    label,
    error,
    size = 'default',
  }, ref) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedValue, setSelectedValue] = useState(value);
    const containerRef = useRef<HTMLDivElement>(null);

    const sizeClasses = {
      sm: 'h-8 text-xs',
      default: 'h-10 text-sm',
      lg: 'h-12 text-base',
    };

    useEffect(() => {
      setSelectedValue(value);
    }, [value]);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      };

      if (isOpen) {
        document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }, [isOpen]);

    const handleSelect = (optionValue: string) => {
      setSelectedValue(optionValue);
      onChange?.(optionValue);
      setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === selectedValue);

    return (
      <div ref={ref} className={`relative ${className}`}>
        {label && (
          <label className="block mb-1.5 text-sm font-medium text-[#151B26]">
            {label}
          </label>
        )}
        
        <div ref={containerRef} className="relative">
          <button
            type="button"
            onClick={() => !disabled && setIsOpen(!isOpen)}
            className={`${selectTriggerVariants()} ${sizeClasses[size]} ${
              error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''
            }`}
            disabled={disabled}
            aria-expanded={isOpen}
            aria-haspopup="listbox"
          >
            <span className={`flex items-center gap-2 ${!selectedOption ? 'text-[var(--text-secondary)]' : 'text-[var(--text-primary)]'}`}>
              {selectedOption?.icon && (
                <span className="flex-shrink-0">{selectedOption.icon}</span>
              )}
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronDown 
              size={16} 
              className={`text-[var(--text-secondary)] transition-transform duration-[var(--transition-duration)] ${
                isOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {isOpen && (
            <div 
              className={selectMenuVariants()}
              role="listbox"
              aria-label={label || 'Select options'}
            >
              <div className="max-h-60 overflow-auto">
                {options.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => !option.disabled && handleSelect(option.value)}
                    disabled={option.disabled}
                    className={[
                      'flex',
                      'items-center',
                      'justify-between',
                      'w-full',
                      'px-3',
                      'py-2',
                      'text-sm',
                      'text-left',
                      'transition-colors',
                      'duration-150',
                      option.disabled 
                        ? 'text-[#6B6F76] opacity-50 cursor-not-allowed' 
                        : 'text-[#151B26] hover:bg-[#F6F7F8] cursor-pointer',
                      option.value === selectedValue ? 'bg-[#796EFF]/10' : '',
                    ].join(' ')}
                    role="option"
                    aria-selected={option.value === selectedValue}
                  >
                    <span className="flex items-center gap-2">
                      {option.icon && (
                        <span className="flex-shrink-0">{option.icon}</span>
                      )}
                      {option.label}
                    </span>
                    {option.value === selectedValue && (
                      <Check size={16} className="text-[#796EFF]" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-1.5 text-xs text-red-500">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

/**
 * Native HTML Select for forms
 * Styled to match the custom Select component
 */
export const NativeSelect = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    error?: string;
  }
>(({ label, error, className = '', children, ...props }, ref) => {
  return (
    <div className="relative">
      {label && (
        <label className="block mb-[var(--space-0-5)] text-[var(--text-label)] font-medium text-[var(--text-primary)]">
          {label}
        </label>
      )}
      
      <div className="relative">
        <select
          ref={ref}
          className={[
            'appearance-none',
            'w-full',
            'px-3',
            'py-2',
            'pr-8',
            'text-sm',
            'font-sans',
            'bg-[#F6F7F8]',
            'text-[#151B26]',
            'border',
            'border-[#E8E8E9]',
            'rounded-lg',
            'cursor-pointer',
            'transition-all',
            'duration-200',
            'outline-none',
            'hover:border-[#D1D5DB]',
            'focus:border-[#796EFF]',
            'focus:ring-2',
            'focus:ring-[#796EFF]/20',
            'disabled:opacity-50',
            'disabled:cursor-not-allowed',
            error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : '',
            className,
          ].join(' ')}
          {...props}
        >
          {children}
        </select>
        <ChevronDown 
          size={16} 
          className="absolute right-2 top-1/2 -translate-y-1/2 text-[#6B6F76] pointer-events-none"
        />
      </div>

      {error && (
        <p className="mt-1.5 text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
});

NativeSelect.displayName = 'NativeSelect';
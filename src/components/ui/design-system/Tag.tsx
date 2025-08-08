import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { X, Hash } from 'lucide-react';

/**
 * Design System Tag Component
 * 
 * DLS Compliant Tag following Asana patterns
 * - Categorization and labeling
 * - Interactive tags for filtering
 * - Color-coded for different categories
 */

const tagVariants = cva(
  `
    inline-flex items-center
    text-[var(--text-small)]
    font-normal
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      variant: {
        solid: '',
        outline: 'bg-transparent border',
        ghost: 'bg-transparent',
      },
      color: {
        default: '',
        primary: '',
        secondary: '',
        success: '',
        warning: '',
        error: '',
        info: '',
      },
      size: {
        sm: 'px-[var(--space-1-5)] py-[2px] text-[11px] rounded-[var(--radius-sm)]',
        md: 'px-[var(--space-2)] py-[var(--space-0-5)] text-[var(--text-small)] rounded-[var(--radius-md)]',
        lg: 'px-[var(--space-3)] py-[var(--space-1)] text-[var(--text-body)] rounded-[var(--radius-md)]',
      },
      interactive: {
        true: 'cursor-pointer',
        false: '',
      },
    },
    compoundVariants: [
      // Solid variants
      {
        variant: 'solid',
        color: 'default',
        className: 'bg-[var(--bg-tertiary)] text-[var(--text-primary)]',
      },
      {
        variant: 'solid',
        color: 'primary',
        className: 'bg-[var(--brand-primary)] text-[var(--text-on-brand)]',
      },
      {
        variant: 'solid',
        color: 'secondary',
        className: 'bg-[var(--bg-secondary)] text-[var(--text-secondary)]',
      },
      {
        variant: 'solid',
        color: 'success',
        className: 'bg-[var(--semantic-success)] text-white',
      },
      {
        variant: 'solid',
        color: 'warning',
        className: 'bg-[var(--semantic-warning)] text-white',
      },
      {
        variant: 'solid',
        color: 'error',
        className: 'bg-[var(--semantic-error)] text-white',
      },
      {
        variant: 'solid',
        color: 'info',
        className: 'bg-[var(--brand-subtle)] text-[var(--brand-primary)]',
      },
      // Outline variants
      {
        variant: 'outline',
        color: 'default',
        className: 'border-[var(--border-default)] text-[var(--text-primary)]',
      },
      {
        variant: 'outline',
        color: 'primary',
        className: 'border-[var(--brand-primary)] text-[var(--brand-primary)]',
      },
      {
        variant: 'outline',
        color: 'secondary',
        className: 'border-[var(--border-subtle)] text-[var(--text-secondary)]',
      },
      {
        variant: 'outline',
        color: 'success',
        className: 'border-[var(--semantic-success)] text-[var(--semantic-success)]',
      },
      {
        variant: 'outline',
        color: 'warning',
        className: 'border-[var(--semantic-warning)] text-[var(--semantic-warning)]',
      },
      {
        variant: 'outline',
        color: 'error',
        className: 'border-[var(--semantic-error)] text-[var(--semantic-error)]',
      },
      {
        variant: 'outline',
        color: 'info',
        className: 'border-[var(--brand-primary)] text-[var(--brand-primary)]',
      },
      // Ghost variants
      {
        variant: 'ghost',
        color: 'default',
        className: 'text-[var(--text-primary)] hover:bg-[var(--bg-secondary)]',
      },
      {
        variant: 'ghost',
        color: 'primary',
        className: 'text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)]',
      },
      {
        variant: 'ghost',
        color: 'secondary',
        className: 'text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]',
      },
      {
        variant: 'ghost',
        color: 'success',
        className: 'text-[var(--semantic-success)] hover:bg-[var(--semantic-success-bg)]',
      },
      {
        variant: 'ghost',
        color: 'warning',
        className: 'text-[var(--semantic-warning)] hover:bg-[var(--semantic-warning-bg)]',
      },
      {
        variant: 'ghost',
        color: 'error',
        className: 'text-[var(--semantic-error)] hover:bg-[var(--semantic-error-bg)]',
      },
      {
        variant: 'ghost',
        color: 'info',
        className: 'text-[var(--brand-primary)] hover:bg-[var(--brand-subtle)]',
      },
      // Interactive hover states
      {
        interactive: true,
        variant: 'solid',
        className: 'hover:opacity-80',
      },
      {
        interactive: true,
        variant: 'outline',
        className: 'hover:opacity-80',
      },
    ],
    defaultVariants: {
      variant: 'solid',
      color: 'default',
      size: 'md',
      interactive: false,
    },
  }
);

export interface TagProps 
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof tagVariants> {
  children: React.ReactNode;
  onRemove?: () => void;
  icon?: React.ReactNode;
  prefix?: string;
}

export const Tag = React.forwardRef<HTMLSpanElement, TagProps>(
  ({ 
    className = '', 
    variant, 
    color,
    size, 
    interactive,
    children, 
    onRemove,
    icon,
    prefix,
    onClick,
    ...props 
  }, ref) => {
    const isClickable = Boolean(onClick || onRemove);
    
    return (
      <span
        ref={ref}
        className={`${tagVariants({ variant, color, size, interactive: interactive ?? isClickable })} ${className}`}
        onClick={onClick}
        {...props}
      >
        {icon && (
          <span className="mr-[var(--space-0-5)] flex-shrink-0">
            {icon}
          </span>
        )}
        {prefix && (
          <span className="opacity-60 mr-[2px]">{prefix}</span>
        )}
        {children}
        {onRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className={`
              ml-[var(--space-1)]
              -mr-[var(--space-0-5)]
              p-[2px]
              rounded-full
              hover:bg-[var(--bg-hover)]
              transition-colors
              duration-[var(--transition-duration)]
              opacity-60 hover:opacity-100
            `}
            aria-label="Remove tag"
          >
            <X size={12} />
          </button>
        )}
      </span>
    );
  }
);

Tag.displayName = 'Tag';

/**
 * Hash Tag - Tag with hash prefix
 */
export interface HashTagProps extends Omit<TagProps, 'icon' | 'prefix'> {
  tag: string;
}

export const HashTag: React.FC<HashTagProps> = ({
  tag,
  variant = 'ghost',
  color = 'primary',
  ...props
}) => {
  return (
    <Tag
      variant={variant}
      color={color}
      icon={<Hash size={12} />}
      {...props}
    >
      {tag}
    </Tag>
  );
};

/**
 * Color Tag - Tag with color indicator
 */
export interface ColorTagProps extends Omit<TagProps, 'icon'> {
  colorCode: string;
  label: string;
}

export const ColorTag: React.FC<ColorTagProps> = ({
  colorCode,
  label,
  ...props
}) => {
  return (
    <Tag
      icon={
        <span 
          className="w-[8px] h-[8px] rounded-full" 
          style={{ backgroundColor: colorCode }}
        />
      }
      {...props}
    >
      {label}
    </Tag>
  );
};

/**
 * Tag Group - Container for multiple tags
 */
export interface TagGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  gap?: 'sm' | 'md' | 'lg';
  wrap?: boolean;
}

export const TagGroup: React.FC<TagGroupProps> = ({
  children,
  gap = 'sm',
  wrap = true,
  className = '',
  ...props
}) => {
  const gapClasses = {
    sm: 'gap-[var(--space-1)]',
    md: 'gap-[var(--space-2)]',
    lg: 'gap-[var(--space-3)]',
  };
  
  return (
    <div
      className={`
        inline-flex items-center
        ${wrap ? 'flex-wrap' : ''}
        ${gapClasses[gap]}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

/**
 * Tag Input - For adding tags dynamically
 */
export interface TagInputProps {
  tags: string[];
  onAddTag: (tag: string) => void;
  onRemoveTag: (index: number) => void;
  placeholder?: string;
  maxTags?: number;
  variant?: TagProps['variant'];
  color?: TagProps['color'];
  size?: TagProps['size'];
}

export const TagInput: React.FC<TagInputProps> = ({
  tags,
  onAddTag,
  onRemoveTag,
  placeholder = 'Add tag...',
  maxTags,
  variant = 'solid',
  color = 'primary',
  size = 'md',
}) => {
  const [inputValue, setInputValue] = React.useState('');
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      e.preventDefault();
      if (!maxTags || tags.length < maxTags) {
        onAddTag(inputValue.trim());
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onRemoveTag(tags.length - 1);
    }
  };
  
  return (
    <div className="flex flex-wrap items-center gap-[var(--space-1)] p-[var(--space-2)] border border-[var(--border-default)] rounded-[var(--radius-md)] focus-within:border-[var(--border-focus)] transition-colors duration-[var(--transition-duration)]">
      {tags.map((tag, index) => (
        <Tag
          key={index}
          variant={variant}
          color={color}
          size={size}
          onRemove={() => onRemoveTag(index)}
        >
          {tag}
        </Tag>
      ))}
      {(!maxTags || tags.length < maxTags) && (
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length === 0 ? placeholder : ''}
          className="flex-1 min-w-[100px] outline-none bg-transparent text-[var(--text-primary)] placeholder-[var(--text-muted)]"
        />
      )}
    </div>
  );
};
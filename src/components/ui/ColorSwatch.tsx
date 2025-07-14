import React from 'react';
import { Check } from 'lucide-react';

interface ColorSwatchProps {
  color: string;
  size?: 'sm' | 'md' | 'lg';
  selected?: boolean;
  disabled?: boolean;
  label?: string;
  className?: string;
  onClick?: () => void;
  showCheckmark?: boolean;
}

export function ColorSwatch({
  color,
  size = 'md',
  selected = false,
  disabled = false,
  label,
  className = '',
  onClick,
  showCheckmark = true
}: ColorSwatchProps) {
  const sizeClasses = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  const checkmarkSizes = {
    sm: 12,
    md: 14,
    lg: 18
  };

  const isLightColor = (hexColor: string): boolean => {
    // Remove # if present
    const hex = hexColor.replace('#', '');
    
    // Parse RGB values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    return luminance > 0.5;
  };

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled && onClick) {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <button
      type="button"
      className={`
        relative rounded-md border-2 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-accent-primary focus:ring-offset-2
        ${sizeClasses[size]}
        ${selected ? 'border-accent-primary shadow-md' : 'border-default hover:border-primary'}
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer motion-safe:hover:scale-110'}
        ${className}
      `.trim()}
      style={{ backgroundColor: color }}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={label || `Color ${color}`}
      title={label || color}
      role="option"
      aria-selected={selected}
    >
      {/* Checkmark for selected state */}
      {selected && showCheckmark && (
        <div className="absolute inset-0 flex items-center justify-center">
          <Check
            size={checkmarkSizes[size]}
            className={`${
              isLightColor(color) ? 'text-primary' : 'text-white'
            } drop-shadow-sm`}
          />
        </div>
      )}
      
      {/* Pattern overlay for transparent/null colors */}
      {color === 'transparent' || color === 'none' && (
        <div className="absolute inset-0 rounded-[inherit] bg-transparent bg-[linear-gradient(45deg,_transparent_25%,_#f0f0f0_25%,_#f0f0f0_50%,_transparent_50%,_transparent_75%,_#f0f0f0_75%)] bg-[length:8px_8px] opacity-0" />
      )}
    </button>
  );
}

interface ColorPaletteProps {
  colors: string[];
  selectedColor?: string;
  onColorSelect: (color: string) => void;
  size?: 'sm' | 'md' | 'lg';
  columns?: number;
  className?: string;
  label?: string;
}

export function ColorPalette({
  colors,
  selectedColor,
  onColorSelect,
  size = 'md',
  columns = 8,
  className = '',
  label = 'Color palette'
}: ColorPaletteProps) {
  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-2',
    lg: 'gap-3'
  };

  return (
    <div className={`${className}`} role="group" aria-label={label}>
      <div
        className={`grid ${gapClasses[size]}`}
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {colors.map((color, index) => (
          <ColorSwatch
            key={`${color}-${index}`}
            color={color}
            size={size}
            selected={selectedColor === color}
            onClick={() => onColorSelect(color)}
          />
        ))}
      </div>
    </div>
  );
} 
import React from 'react';

interface DragOverlayProps {
  children: React.ReactNode;
  isActive?: boolean;
  elevation?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  style?: React.CSSProperties;
}

export function DragOverlay({
  children,
  isActive = false,
  elevation = 'lg',
  className = '',
  style
}: DragOverlayProps) {
  const elevationClasses = {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl'
  };

  return (
    <div
      className={`
        ${elevationClasses[elevation]}
        ${isActive ? 'rotate-1 scale-105' : ''}
        transition-all duration-200 ease-out
        ${className}
      `}
      style={{
        transform: isActive ? 'scale(1.05) rotate(2deg)' : undefined,
        ...style
      }}
    >
      {children}
    </div>
  );
}

interface LiftedCardProps {
  children: React.ReactNode;
  isDragging?: boolean;
  isHovered?: boolean;
  elevation?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  style?: React.CSSProperties;
}

export function LiftedCard({
  children,
  isDragging = false,
  isHovered = false,
  elevation = 'sm',
  borderRadius = 'md',
  padding = 'md',
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave,
  style
}: LiftedCardProps) {
  const [isInternalHovered, setIsInternalHovered] = React.useState(false);
  const actuallyHovered = isHovered || isInternalHovered;

  const elevationClasses = {
    none: '',
    sm: actuallyHovered ? 'shadow-md' : 'shadow-sm',
    md: actuallyHovered ? 'shadow-lg' : 'shadow-md',
    lg: actuallyHovered ? 'shadow-xl' : 'shadow-lg',
    xl: actuallyHovered ? 'shadow-2xl' : 'shadow-xl'
  };

  const radiusClasses = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl'
  };

  const paddingClasses = {
    none: '',
    sm: 'p-2',
    md: 'p-4',
    lg: 'p-6'
  };

  const handleMouseEnter = () => {
    setIsInternalHovered(true);
    onMouseEnter?.();
  };

  const handleMouseLeave = () => {
    setIsInternalHovered(false);
    onMouseLeave?.();
  };

  return (
    <div
      className={`
        border-border-default border bg-surface
        ${elevationClasses[elevation]}
        ${radiusClasses[borderRadius]}
        ${paddingClasses[padding]}
        ${isDragging ? 'rotate-1 scale-95 opacity-50' : ''}
        ${actuallyHovered && !isDragging ? '-translate-y-1 scale-[1.02]' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        transition-all duration-200 ease-out
        ${className}
      `}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        transform: isDragging 
          ? 'scale(0.95) rotate(1deg)' 
          : actuallyHovered && !isDragging 
            ? 'scale(1.02) translateY(-4px)' 
            : undefined,
        ...style
      }}
    >
      {children}
    </div>
  );
}

interface DragPreviewProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function DragPreview({
  children,
  className = '',
  style
}: DragPreviewProps) {
  return (
    <div
      className={`
        border-border-primary pointer-events-none rotate-2
        scale-110 rounded-lg border
        bg-surface p-4 opacity-90
        shadow-xl
        ${className}
      `}
      style={{
        transform: 'scale(1.1) rotate(2deg)',
        filter: 'brightness(1.05)',
        ...style
      }}
    >
      {children}
    </div>
  );
}

interface DropZoneProps {
  children: React.ReactNode;
  isActive?: boolean;
  isHovered?: boolean;
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
  style?: React.CSSProperties;
}

export function DropZone({
  children,
  isActive = false,
  isHovered = false,
  variant = 'default',
  className = '',
  style
}: DropZoneProps) {
  const variantClasses = {
    default: {
      base: 'border-border-default bg-tertiary/20',
      active: 'border-accent-primary bg-accent-soft',
      hovered: 'border-accent-primary/60 bg-accent-soft/60'
    },
    success: {
      base: 'border-border-default bg-tertiary/20',
      active: 'border-success bg-success/10',
      hovered: 'border-success/60 bg-success/5'
    },
    warning: {
      base: 'border-border-default bg-tertiary/20',
      active: 'border-warning bg-warning/10',
      hovered: 'border-warning/60 bg-warning/5'
    },
    error: {
      base: 'border-border-default bg-tertiary/20',
      active: 'border-error bg-error/10',
      hovered: 'border-error/60 bg-error/5'
    }
  };

  const getVariantClass = () => {
    if (isActive) return variantClasses[variant].active;
    if (isHovered) return variantClasses[variant].hovered;
    return variantClasses[variant].base;
  };

  return (
    <div
      className={`
        rounded-lg border-2 border-dashed p-4
        transition-all duration-200 ease-out
        ${getVariantClass()}
        ${isActive ? 'scale-[1.02]' : ''}
        ${className}
      `}
      style={style}
    >
      {children}
    </div>
  );
}

interface DragIndicatorProps {
  isVisible?: boolean;
  position?: 'top' | 'bottom' | 'left' | 'right';
  variant?: 'default' | 'success' | 'warning' | 'error';
  className?: string;
}

export function DragIndicator({
  isVisible = false,
  position = 'bottom',
  variant = 'default',
  className = ''
}: DragIndicatorProps) {
  const variantClasses = {
    default: 'bg-accent-primary',
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-error'
  };

  const positionClasses = {
    top: 'h-0.5 w-full',
    bottom: 'h-0.5 w-full',
    left: 'w-0.5 h-full',
    right: 'w-0.5 h-full'
  };

  if (!isVisible) return null;

  return (
    <div
      className={`
        ${positionClasses[position]}
        ${variantClasses[variant]}
        animate-pulse
        rounded-full
        transition-all duration-200
        ${className}
      `}
    />
  );
} 
import React from 'react';
import { cn } from '../../core/lib/utils';

export interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'circle' | 'square';
  fallbackIcon?: React.ReactNode;
  className?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ name, src, size = 'md', variant = 'circle', fallbackIcon, className, ...props }, ref) => {
    const sizeClasses = {
      xs: 'w-6 h-6 text-xs',
      sm: 'w-7 h-7 text-xs',
      md: 'w-8 h-8 text-sm',
      lg: 'w-10 h-10 text-base',
      xl: 'w-12 h-12 text-lg',
    };

    const variantClasses = {
      circle: 'rounded-full',
      square: 'rounded-md',
    };

    // Generate initials from name
    const getInitials = (name: string) => {
      return name
        .split(' ')
        .map(word => word.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
    };

    // Generate a consistent color based on name
    const getAvatarColor = (name: string) => {
      const colors = [
        'bg-blue-500',
        'bg-green-500',
        'bg-purple-500',
        'bg-pink-500',
        'bg-indigo-500',
        'bg-yellow-500',
        'bg-red-500',
        'bg-teal-500',
        'bg-orange-500',
        'bg-cyan-500',
      ];
      
      let hash = 0;
      for (let i = 0; i < name.length; i++) {
        hash = name.charCodeAt(i) + ((hash << 5) - hash);
      }
      
      return colors[Math.abs(hash) % colors.length];
    };

    const initials = name ? getInitials(name) : '';
    const backgroundColor = name ? getAvatarColor(name) : 'bg-primary';

    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-center flex-shrink-0 font-bold text-white transition-colors',
          sizeClasses[size],
          variantClasses[variant],
          src ? 'bg-muted' : backgroundColor,
          className
        )}
        {...props}
      >
        {src ? (
          <img
            src={src}
            alt={name || 'Avatar'}
            className={cn(
              'w-full h-full object-cover',
              variantClasses[variant]
            )}
          />
        ) : initials ? (
          <span>{initials}</span>
        ) : fallbackIcon ? (
          fallbackIcon
        ) : (
          <svg
            className="w-1/2 h-1/2 text-white"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export { Avatar }; 
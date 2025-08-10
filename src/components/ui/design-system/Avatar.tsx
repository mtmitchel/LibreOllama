import React, { useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { User, Users, Bot } from 'lucide-react';

/**
 * Design System Avatar Component
 * 
 * DLS Compliant Avatar following Asana patterns
 * - User profile images with fallbacks
 * - Initials display
 * - Status indicators
 * - Group avatars
 */

const avatarVariants = cva(
  `
    relative inline-flex items-center justify-center
    font-medium text-[color:var(--text-on-brand)]
    bg-[var(--bg-tertiary)]
    overflow-hidden
    transition-[var(--transition-property)]
    duration-[var(--transition-duration)]
  `,
  {
    variants: {
      size: {
        xs: 'w-6 h-6 text-[10px]',
        sm: 'w-8 h-8 text-[11px]',
        md: 'w-10 h-10 asana-text-sm',
        lg: 'w-12 h-12 asana-text-base',
        xl: 'w-16 h-16 asana-text-lg',
        '2xl': 'w-20 h-20 text-[20px]',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-[var(--radius-md)]',
      },
    },
    defaultVariants: {
      size: 'md',
      shape: 'circle',
    },
  }
);

export interface AvatarProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  name?: string;
  src?: string;
  alt?: string;
  fallback?: React.ReactNode;
  status?: 'online' | 'offline' | 'busy' | 'away';
  statusPosition?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

// Color palette for avatar backgrounds
const avatarColors = [
  '#796EFF', // brand-primary
  '#4573D2', // blue
  '#32A852', // green
  '#F7B500', // yellow
  '#E8384F', // red
  '#A86DFF', // purple
  '#00BFA0', // teal
  '#FF6C37', // orange
  '#0052CC', // navy
  '#6B778C', // gray
];

// Generate consistent color from string
const getAvatarColor = (str: string): string => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
};

// Generate initials from name
const getInitials = (name: string): string => {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  }
  return parts[0].slice(0, 2).toUpperCase();
};

export const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ 
    className = '', 
    size, 
    shape,
    name,
    src,
    alt,
    fallback,
    status,
    statusPosition = 'bottom-right',
    style,
    ...props 
  }, ref) => {
    const [imageError, setImageError] = useState(false);
    const showImage = src && !imageError;
    const initials = name ? getInitials(name) : '';
    const backgroundColor = name ? getAvatarColor(name) : undefined;
    
    const statusClasses = {
      'top-right': 'top-0 right-0',
      'bottom-right': 'bottom-0 right-0',
      'top-left': 'top-0 left-0',
      'bottom-left': 'bottom-0 left-0',
    };
    
    const statusColors = {
      online: 'bg-[var(--semantic-success)]',
      offline: 'bg-[var(--text-muted)]',
      busy: 'bg-[var(--semantic-error)]',
      away: 'bg-[var(--semantic-warning)]',
    };
    
    return (
      <div
        ref={ref}
        className={`${avatarVariants({ size, shape })} ${className}`}
        style={{
          ...style,
          ...(backgroundColor && !showImage ? { backgroundColor } : {}),
        }}
        {...props}
      >
        {showImage ? (
          <img
            src={src}
            alt={alt || name || 'Avatar'}
            className="w-full h-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : initials ? (
          <span className="select-none">{initials}</span>
        ) : fallback ? (
          fallback
        ) : (
          <User size={size === 'xs' ? 14 : size === 'sm' ? 16 : size === 'md' ? 18 : size === 'lg' ? 20 : size === 'xl' ? 24 : 28} />
        )}
        
        {status && (
          <span
            className={`
              absolute ${statusClasses[statusPosition]}
              w-[25%] h-[25%] min-w-[8px] min-h-[8px]
              ${statusColors[status]}
              rounded-full
              border-2 border-[var(--bg-primary)]
            `}
          />
        )}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

/**
 * Avatar Group - Stack multiple avatars
 */
export interface AvatarGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: 'tight' | 'normal' | 'loose';
}

export const AvatarGroup: React.FC<AvatarGroupProps> = ({
  children,
  max = 3,
  size = 'md',
  spacing = 'tight',
  className = '',
  ...props
}) => {
  const childArray = React.Children.toArray(children);
  const visibleChildren = max ? childArray.slice(0, max) : childArray;
  const remainingCount = max && childArray.length > max ? childArray.length - max : 0;
  
  const spacingClasses = {
    tight: '-space-x-2',
    normal: '-space-x-1',
    loose: 'space-x-1',
  };
  
  return (
    <div
      className={`
        flex items-center
        ${spacingClasses[spacing]}
        ${className}
      `}
      {...props}
    >
      {visibleChildren.map((child, index) => 
        React.isValidElement(child) ? (
          <div key={index} className="relative" style={{ zIndex: visibleChildren.length - index }}>
            {React.cloneElement(child as React.ReactElement<any>, {
              size,
              className: `border-2 border-[var(--bg-primary)] ${((child as React.ReactElement<any>).props?.className) || ''}`,
            })}
          </div>
        ) : null
      )}
      {remainingCount > 0 && (
        <div className="relative" style={{ zIndex: 0 }}>
          <Avatar
            size={size}
            className="border-2 border-[var(--bg-primary)] bg-[var(--bg-secondary)] text-[color:var(--text-secondary)]"
            fallback={<span className="text-[0.75em]">+{remainingCount}</span>}
          />
        </div>
      )}
    </div>
  );
};

/**
 * User Avatar - Specialized avatar for user profiles
 */
export interface UserAvatarProps extends Omit<AvatarProps, 'fallback'> {
  userId?: string;
  online?: boolean;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
  userId,
  online,
  status = online ? 'online' : undefined,
  ...props
}) => {
  return (
    <Avatar
      status={status}
      fallback={<User size={16} />}
      {...props}
    />
  );
};

/**
 * Bot Avatar - Specialized avatar for AI/bots
 */
export interface BotAvatarProps extends Omit<AvatarProps, 'fallback' | 'shape'> {
  botName?: string;
}

export const BotAvatar: React.FC<BotAvatarProps> = ({
  botName = 'Bot',
  name = botName,
  ...props
}) => {
  return (
    <Avatar
      name={name}
      shape="square"
      fallback={<Bot size={16} />}
      className="bg-[var(--brand-primary)]"
      {...props}
    />
  );
};

/**
 * Team Avatar - Specialized avatar for teams/groups
 */
export interface TeamAvatarProps extends Omit<AvatarProps, 'fallback' | 'shape'> {
  teamName?: string;
  memberCount?: number;
}

export const TeamAvatar: React.FC<TeamAvatarProps> = ({
  teamName = 'Team',
  memberCount,
  name = teamName,
  ...props
}) => {
  return (
    <Avatar
      name={name}
      shape="square"
      fallback={
        <div className="flex flex-col items-center justify-center">
          <Users size={14} />
          {memberCount && memberCount > 0 && (
            <span className="text-[8px] mt-[-2px]">{memberCount}</span>
          )}
        </div>
      }
      {...props}
    />
  );
};
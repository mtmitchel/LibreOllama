import React from 'react';

interface TypingIndicatorProps {
  isVisible?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'subtle';
  dotColor?: string;
  className?: string;
  label?: string;
}

export function TypingIndicator({
  isVisible = true,
  size = 'md',
  variant = 'default',
  dotColor,
  className = '',
  label = 'Someone is typing...'
}: TypingIndicatorProps) {
  const sizeClasses = {
    sm: {
      container: 'px-3 py-2',
      dots: 'w-1 h-1',
      gap: 'gap-1',
      text: 'text-[11px]'
    },
    md: {
      container: 'px-4 py-3',
      dots: 'w-1.5 h-1.5',
      gap: 'gap-1.5',
      text: 'asana-text-sm'
    },
    lg: {
      container: 'px-5 py-4',
      dots: 'w-2 h-2',
      gap: 'gap-2',
      text: 'asana-text-base'
    }
  };

  const variantClasses = {
    default: {
      container: 'bg-surface border border-border-default rounded-lg shadow-sm',
      dots: dotColor || 'bg-secondary'
    },
    ghost: {
      container: 'bg-transparent',
      dots: dotColor || 'bg-secondary'
    },
    subtle: {
      container: 'bg-tertiary/30 rounded-lg',
      dots: dotColor || 'bg-secondary'
    }
  };

  const { container: containerClass, dots: dotSizeClass, gap: gapClass } = sizeClasses[size];
  const { container: variantContainerClass, dots: variantDotClass } = variantClasses[variant];

  if (!isVisible) return null;

  return (
    <div
      className={`
        inline-flex items-center
        ${containerClass}
        ${variantContainerClass}
        ${className}
      `}
      role="status"
      aria-label={label}
      aria-live="polite"
    >
      <div className={`flex items-center ${gapClass}`}>
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className={`
              ${dotSizeClass}
              ${variantDotClass}
              animate-pulse
              rounded-full
            `}
            style={{
              animationDelay: `${index * 200}ms`,
              animationDuration: '1.2s',
              animationIterationCount: 'infinite'
            }}
          />
        ))}
      </div>
    </div>
  );
}

interface ChatTypingIndicatorProps {
  users?: string[];
  isVisible?: boolean;
  avatarUrls?: string[];
  size?: 'sm' | 'md' | 'lg';
  maxUsers?: number;
  className?: string;
}

export function ChatTypingIndicator({
  users = [],
  isVisible = true,
  avatarUrls = [],
  size = 'md',
  maxUsers = 3,
  className = ''
}: ChatTypingIndicatorProps) {
  const sizeClasses = {
    sm: {
      avatar: 'w-6 h-6',
      container: 'px-3 py-2',
      text: 'text-[11px]'
    },
    md: {
      avatar: 'w-8 h-8',
      container: 'px-4 py-3',
      text: 'asana-text-sm'
    },
    lg: {
      avatar: 'w-10 h-10',
      container: 'px-5 py-4',
      text: 'asana-text-base'
    }
  };

  const { avatar: avatarClass, container: containerClass, text: textClass } = sizeClasses[size];

  const visibleUsers = users.slice(0, maxUsers);
  const remainingCount = Math.max(0, users.length - maxUsers);

  if (!isVisible || users.length === 0) return null;

  const getTypingText = () => {
    if (visibleUsers.length === 1) {
      return `${visibleUsers[0]} is typing...`;
    } else if (visibleUsers.length === 2) {
      return `${visibleUsers[0]} and ${visibleUsers[1]} are typing...`;
    } else {
      const displayText = visibleUsers.slice(0, -1).join(', ') + `, and ${visibleUsers[visibleUsers.length - 1]}`;
      return `${displayText}${remainingCount > 0 ? ` and ${remainingCount} other${remainingCount === 1 ? '' : 's'}` : ''} are typing...`;
    }
  };

  return (
    <div
      className={`
        inline-flex items-center gap-3
        ${containerClass}
        border-border-default rounded-lg border bg-surface shadow-sm
        ${className}
      `}
      role="status"
      aria-label={getTypingText()}
      aria-live="polite"
    >
      {/* User avatars */}
      {visibleUsers.length > 0 && (
        <div className="flex -space-x-1">
          {visibleUsers.map((user, index) => (
            <div
              key={user}
              className={`
                ${avatarClass}
                border-surface flex items-center
                justify-center rounded-full border-2 bg-accent-soft
                ${textClass} font-medium text-accent-primary
              `}
              title={user}
            >
              {avatarUrls[index] ? (
                <img
                  src={avatarUrls[index]}
                  alt={user}
                  className={`${avatarClass} rounded-full object-cover`}
                />
              ) : (
                user.charAt(0).toUpperCase()
              )}
            </div>
          ))}
          {remainingCount > 0 && (
            <div
              className={`
                ${avatarClass}
                border-surface flex items-center
                justify-center rounded-full border-2 bg-tertiary
                ${textClass} font-medium text-secondary
              `}
              title={`${remainingCount} more`}
            >
              +{remainingCount}
            </div>
          )}
        </div>
      )}

      {/* Typing indicator */}
      <div className="flex items-center gap-2">
        <TypingIndicator
          variant="ghost"
          size={size}
          isVisible={true}
          label=""
        />
        <span className={`${textClass} text-secondary`}>
          {visibleUsers.length === 1 ? 'is typing...' : 'are typing...'}
        </span>
      </div>
    </div>
  );
}

interface SimpleTypingDotsProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export function SimpleTypingDots({
  size = 'md',
  color = 'bg-secondary',
  className = ''
}: SimpleTypingDotsProps) {
  const sizeClasses = {
    sm: 'w-1 h-1',
    md: 'w-1.5 h-1.5',
    lg: 'w-2 h-2'
  };

  const gapClasses = {
    sm: 'gap-1',
    md: 'gap-1.5',
    lg: 'gap-2'
  };

  return (
    <div className={`flex items-center ${gapClasses[size]} ${className}`}>
      {[0, 1, 2].map((index) => (
        <div
          key={index}
          className={`
            ${sizeClasses[size]}
            ${color}
            rounded-full
          `}
          style={{
            animation: `typing-bounce 1.4s infinite ${index * 0.2}s`
          }}
        />
      ))}
      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-8px);
            opacity: 1;
          }
        }
      `
      }} />
    </div>
  );
} 
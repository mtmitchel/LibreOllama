import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'default' | 'none';
}

export const Card: React.FC<CardProps> = ({ children, className = '', padding = 'default' }) => {
  const paddingClass = padding === 'default' ? 'p-4 sm:p-5' : '';
  return (
    <div className={`bg-surface border border-border-subtle rounded-lg shadow-sm ${paddingClass} ${className}`}>
      {children}
    </div>
  );
};

// Add a display name for better debugging
Card.displayName = 'Card';

export default Card;
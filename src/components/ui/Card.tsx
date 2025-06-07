// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType; // Allows rendering as 'div', 'li', etc.
  padding?: 'default' | 'none'; // Control padding
}

export const Card: React.FC<CardProps> = ({ children, className = '', as: Component = 'div', padding = 'default' }) => {
  const paddingClass = padding === 'default' ? 'p-4 sm:p-6' : '';

  return (
    <Component
      className={`
        bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg 
        transition-all duration-200 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-600
        ${paddingClass}
        ${className}
      `}
    >
      {children}
    </Component>
  );
  };
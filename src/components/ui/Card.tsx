// src/components/ui/Card.tsx
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
}

export const Card: React.FC<CardProps> = ({ children, className = '', as: Component = 'div' }) => {
  // These Tailwind classes define the "Card" component style once.
  const baseClasses = "bg-surface border border-border-subtle rounded-lg p-5 transition-all duration-200 hover:shadow-md hover:border-border-default";
  return (
    <Component className={`${baseClasses} ${className}`}>
      {children}
    </Component>
  );
};
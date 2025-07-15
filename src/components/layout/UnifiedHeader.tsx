import React from 'react';
import { Button } from '../ui';
import { useHeader } from '../../app/contexts/HeaderContext'; // Import useHeader

// Type definitions for the UnifiedHeader component
interface BreadcrumbItem {
  path: string;
  label: string;
}

interface PrimaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode;
}

interface SecondaryAction {
  label: string;
  onClick: () => void;
  icon?: React.ReactNode; // Added icon property
  variant?: 'ghost' | 'secondary';
}

// UnifiedHeaderProps now only defines props not managed by HeaderContext
interface UnifiedHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  // title: string; // Title will now come from HeaderContext
  subtitle?: string;
  primaryAction?: PrimaryAction;
  viewSwitcher?: React.ReactNode;
  secondaryActions?: SecondaryAction[];
}

export function UnifiedHeader({
  breadcrumb,
  // title, // Remove title from destructured props
  subtitle,
  primaryAction,
  viewSwitcher,
  secondaryActions
}: UnifiedHeaderProps) {
  const { headerProps } = useHeader(); // Use the header context
  const title = headerProps.title; // Get title from context

  return (
    <header className="flex h-16 items-center px-4 md:px-6">
      <div className="flex items-center space-x-4 flex-1">
        {/* Title and Subtitle */}
        <div className="flex flex-col">
          {title && <h1 className="text-xl font-semibold">{title}</h1>}
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {secondaryActions && secondaryActions.map((action, index) => (
          <Button key={index} variant={action.variant || 'ghost'} size="sm" onClick={action.onClick}>
            {action.icon && <span className="mr-2">{action.icon}</span>}
            {action.label}
          </Button>
        ))}
        {primaryAction && (
          <Button variant="primary" size="sm" onClick={primaryAction.onClick}>
            {primaryAction.icon && <span className="mr-2">{primaryAction.icon}</span>}
            {primaryAction.label}
          </Button>
        )}

        {/* View Switcher */}
        {viewSwitcher && (
          <div style={{ marginLeft: '0' }}>
            {viewSwitcher}
          </div>
        )}
      </div>
    </header>
  );
}

export default UnifiedHeader; 
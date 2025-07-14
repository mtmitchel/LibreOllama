import React from 'react';
import { Button } from '../ui';

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
  variant?: 'ghost' | 'secondary';
}

interface UnifiedHeaderProps {
  breadcrumb?: BreadcrumbItem[];
  title: string;
  primaryAction?: PrimaryAction;
  viewSwitcher?: React.ReactNode;
  secondaryActions?: SecondaryAction[];
}

export function UnifiedHeader({
  breadcrumb,
  title,
  primaryAction,
  viewSwitcher,
  secondaryActions
}: UnifiedHeaderProps) {
  const headerStyle = {
    minHeight: '72px',
    background: 'var(--bg-surface)',
    borderBottom: '1px solid var(--border-subtle)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: `0 var(--space-5)`,
    gap: 'var(--space-5)'
  };

  const leftSectionStyle = {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 'var(--space-1)',
    flex: '1',
    minWidth: '0'
  };

  const breadcrumbStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-1)',
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    margin: 'var(--space-1) 0'
  };

  const titleStyle = {
    fontSize: '18px',
    fontWeight: '600',
    color: 'var(--text-primary)',
    margin: '0',
    lineHeight: '1.2'
  };

  const rightSectionStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-3)',
    flexShrink: 0
  };

  const secondaryActionsStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 'var(--space-2)'
  };

  const separatorStyle = {
    color: 'var(--text-muted)',
    fontSize: '12px',
    userSelect: 'none' as const
  };

  return (
    <header style={headerStyle}>
      <div style={leftSectionStyle}>
        {breadcrumb && breadcrumb.length > 0 && (
          <nav style={breadcrumbStyle}>
            {breadcrumb.map((item, index) => (
              <React.Fragment key={item.path}>
                <span>{item.label}</span>
                {index < breadcrumb.length - 1 && (
                  <span style={separatorStyle}>›</span>
                )}
              </React.Fragment>
            ))}
          </nav>
        )}
        <h1 style={titleStyle}>{title}</h1>
      </div>

      <div style={rightSectionStyle}>
        {/* Secondary Actions */}
        {secondaryActions && secondaryActions.length > 0 && (
          <div style={secondaryActionsStyle}>
            {secondaryActions.map((action, index) => (
              <Button
                key={index}
                variant={action.variant || 'ghost'}
                onClick={action.onClick}
                size="default"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}

        {/* Primary Action Button */}
        {primaryAction && (
          <Button
            variant="primary"
            onClick={primaryAction.onClick}
            className="gap-2"
          >
            {primaryAction.icon}
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
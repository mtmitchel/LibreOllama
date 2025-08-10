import React from 'react';

export interface WidgetHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  withDivider?: boolean;
  className?: string;
}

/**
 * WidgetHeader
 * Consistent header for dashboard widgets and sections.
 * Keeps visual parity with `.asana-card-header`.
 */
export const WidgetHeader = React.forwardRef<HTMLDivElement, WidgetHeaderProps>(
  ({ title, subtitle, actions, withDivider = true, className = '', ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={`asana-card-header${withDivider ? '' : ' asana-card-header--no-divider'} ${className}`.trim()}
        {...props}
      >
        <div className="asana-card-header-left">
          {typeof title === 'string' ? (
            <h3 className="asana-card-title">{title}</h3>
          ) : (
            title
          )}
          {subtitle && (
            <div className="asana-card-subtitle">{subtitle}</div>
          )}
        </div>
        {actions && (
          <div className="asana-card-header-actions">{actions}</div>
        )}
      </div>
    );
  }
);

WidgetHeader.displayName = 'WidgetHeader';

export default WidgetHeader;



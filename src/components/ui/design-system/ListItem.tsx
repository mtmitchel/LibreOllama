import React from 'react';

export interface ListItemProps extends React.HTMLAttributes<HTMLDivElement> {
  leading?: React.ReactNode;
  primary: React.ReactNode;
  secondary?: React.ReactNode;
  meta?: React.ReactNode;
  dense?: boolean;
  interactive?: boolean;
  onActivate?: () => void;
}

/**
 * ListItem
 * Unified list row used for mail preview, recent activity, tasks, etc.
 */
export const ListItem = React.forwardRef<HTMLDivElement, ListItemProps>(
  (
    { leading, primary, secondary, meta, dense = false, interactive = true, onActivate, className = '', ...props },
    ref
  ) => {
    const Component = interactive ? 'button' : ('div' as const);
    const roleProps = interactive ? { type: 'button' as const, onClick: onActivate } : {};

    return (
      <Component
        ref={ref as any}
        className={`asana-list-item ${dense ? 'asana-list-item--dense' : ''} ${className}`.trim()}
        {...(roleProps as any)}
        {...props}
      >
        {leading && <div className="asana-list-leading">{leading}</div>}
        <div className="asana-list-content">
          <div className="asana-list-primary">{primary}</div>
          {secondary && (
            <div className="asana-list-secondary">{secondary}</div>
          )}
        </div>
        {meta && <div className="asana-list-meta">{meta}</div>}
      </Component>
    );
  }
);

ListItem.displayName = 'ListItem';

export default ListItem;



import React from 'react';

export interface MetricPillProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number | string;
  label: string;
  icon?: React.ReactNode;
  emphasis?: 'default' | 'subtle';
  size?: 'md' | 'sm';
}

/**
 * MetricPill
 * Compact stat display: prominent value, secondary label.
 * Uses ghost background to match Asana-esque cards.
 */
const MetricPill = React.forwardRef<HTMLDivElement, MetricPillProps>(({
  value,
  label,
  icon,
  emphasis = 'default',
  size = 'md',
  className = '',
  ...props
}, ref) => {
  const base = 'inline-flex items-center gap-2 rounded-md border';
  const style = emphasis === 'subtle'
    ? 'bg-[var(--bg-subtle)] border-[var(--border-subtle)]'
    : 'bg-[var(--bg-secondary)] border-[var(--border-default)]';
  const pad = size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2';
  const valueSize = size === 'sm' ? 'asana-text-sm' : 'asana-text-base';

  return (
    <div ref={ref} className={`${base} ${pad} ${style} ${className}`.trim()} {...props}>
      {icon && <span className="text-[color:var(--text-tertiary)]">{icon}</span>}
      <div className="min-w-0">
        <div className={`${valueSize} font-semibold text-[color:var(--text-primary)] leading-tight`}>
          {value}
        </div>
        <div className="text-[11px] text-[color:var(--text-secondary)] leading-tight">
          {label}
        </div>
      </div>
    </div>
  );
});

MetricPill.displayName = 'MetricPill';

export default MetricPill;



interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  label?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const statusLabels = {
  online: 'Online',
  offline: 'Offline', 
  busy: 'Busy',
  away: 'Away'
};

export function StatusIndicator({ 
  status, 
  label, 
  showLabel = false, 
  size = 'md',
  className 
}: StatusIndicatorProps) {
  return (
    <div className={`status-indicator ${className || ''}`.trim()}>
      <div 
        className={`status-indicator-dot status-${status} size-${size}`}
        title={label || statusLabels[status]}
      />
      {showLabel && (
        <span className="status-indicator-label">
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  );
}

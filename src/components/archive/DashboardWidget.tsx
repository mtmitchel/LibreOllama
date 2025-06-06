import { Button } from './ui';
import { LucideIcon } from 'lucide-react';

interface DashboardWidgetProps {
  title: string;
  description: string;
  icon: LucideIcon;
  primaryAction: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  stats?: {
    label: string;
    value: string | number;
    trend?: 'up' | 'down' | 'neutral';
  }[];
  className?: string;
}

export function DashboardWidget({ 
  title, 
  description, 
  icon: Icon, 
  primaryAction, 
  secondaryAction,
  stats,
  className = ''
}: DashboardWidgetProps) {
  return (
    <div className={`widget ${className}`.trim()}>
      <div className="widget-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: 'var(--accent-soft)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-primary)',
            transition: 'transform 0.2s ease'
          }}>
            <Icon style={{ width: '20px', height: '20px' }} />
          </div>
          <div>
            <h3 className="widget-title">{title}</h3>
            {stats && stats.length > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginTop: 'var(--space-1)' }}>
                {stats.map((stat, index) => (
                  <div key={index} style={{ fontSize: '14px' }}>
                    <span style={{ 
                      fontWeight: '500', 
                      color: 'var(--text-primary)' 
                    }}>
                      {stat.value}
                    </span>
                    <span style={{ 
                      color: 'var(--text-secondary)', 
                      marginLeft: 'var(--space-1)' 
                    }}>
                      {stat.label}
                    </span>
                  </div>                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <p style={{ 
        fontSize: '14px', 
        color: 'var(--text-secondary)', 
        marginBottom: 'var(--space-4)' 
      }}>
        {description}
      </p>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
        <Button 
          variant="secondary" 
          size="sm"
          onClick={primaryAction.onClick}
          style={{ flex: 1 }}
        >
          {primaryAction.label}
        </Button>
        {secondaryAction && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={secondaryAction.onClick}
          >
            {secondaryAction.label}
          </Button>
        )}
      </div>
    </div>
  );
}

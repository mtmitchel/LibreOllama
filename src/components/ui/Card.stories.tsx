import type { Story } from '@ladle/react';
import React from 'react';
import { Card, Button, Badge } from './index';
import { Settings, MoreHorizontal, TrendingUp } from 'lucide-react';

export const BasicCard: Story = () => (
  <Card>
    <h3 style={{ 
      margin: '0 0 16px 0', 
      color: 'var(--text-primary)',
      fontSize: '18px',
      fontWeight: '600'
    }}>
      Basic Card
    </h3>
    <p style={{ 
      margin: 0, 
      color: 'var(--text-secondary)',
      fontSize: '14px',
      lineHeight: '1.5'
    }}>
      This is a basic card component using the design system's surface background 
      and border colors. It provides a clean container for content.
    </p>
  </Card>
);

export const WidgetCard: Story = () => (
  <Card variant="widget">
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'flex-start',
      marginBottom: '16px'
    }}>
      <h3 style={{ 
        margin: 0, 
        color: 'var(--text-primary)',
        fontSize: '18px',
        fontWeight: '600'
      }}>
        Project Progress
      </h3>
      <Button variant="ghost" size="icon">
        <MoreHorizontal size={16} />
      </Button>
    </div>
    
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '8px'
      }}>
        <span style={{ 
          color: 'var(--text-primary)',
          fontSize: '16px',
          fontWeight: '600'
        }}>
          UI Migration Sprint
        </span>
        <span style={{ 
          color: 'var(--text-secondary)',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          67% complete
        </span>
      </div>
      
      <div style={{
        height: '8px',
        background: 'var(--bg-tertiary)',
        borderRadius: '4px',
        overflow: 'hidden'
      }}>
        <div style={{
          width: '67%',
          height: '100%',
          background: 'linear-gradient(90deg, var(--accent-primary), #22d3ee)',
          borderRadius: '4px'
        }} />
      </div>
    </div>
    
    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
      <Badge variant="success">On Track</Badge>
      <Badge variant="secondary">3 tasks left</Badge>
    </div>
    
    <Button variant="secondary" style={{ width: '100%' }}>
      View Details
    </Button>
  </Card>
);

export const CardSizes: Story = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    padding: '16px'
  }}>
    <Card padding="sm">
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Small Padding</h4>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
        Compact card with small padding.
      </p>
    </Card>
    
    <Card padding="default">
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Default Padding</h4>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
        Standard card with default padding.
      </p>
    </Card>
    
    <Card padding="lg">
      <h4 style={{ margin: '0 0 8px 0', color: 'var(--text-primary)' }}>Large Padding</h4>
      <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '14px' }}>
        Spacious card with large padding.
      </p>
    </Card>
  </div>
);

export const DashboardExample: Story = () => (
  <div style={{ 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    padding: '24px',
    background: 'var(--bg-primary)',
    minHeight: '400px'
  }}>
    <Card variant="widget">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Agent Status
        </h3>
        <Button variant="ghost" size="icon">
          <Settings size={16} />
        </Button>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--success)'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ 
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              General Assistant
            </div>
            <div style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '12px'
            }}>
              Llama 3.1 70B
            </div>
          </div>
          <Badge variant="success">Active</Badge>
        </div>
        
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px',
          padding: '12px',
          background: 'var(--bg-tertiary)',
          borderRadius: '8px'
        }}>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: 'var(--text-muted)'
          }} />
          <div style={{ flex: 1 }}>
            <div style={{ 
              color: 'var(--text-primary)',
              fontSize: '14px',
              fontWeight: '600'
            }}>
              Code Reviewer
            </div>
            <div style={{ 
              color: 'var(--text-tertiary)',
              fontSize: '12px'
            }}>
              Mixtral 8x7B
            </div>
          </div>
          <Badge variant="secondary">Offline</Badge>
        </div>
      </div>
    </Card>
    
    <Card variant="widget">
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3 style={{ 
          margin: 0, 
          color: 'var(--text-primary)',
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Quick Actions
        </h3>
      </div>
      
      <div style={{ 
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: '12px'
      }}>
        <Button variant="secondary">
          <TrendingUp size={16} />
          Start Chat
        </Button>
        <Button variant="secondary">
          <Settings size={16} />
          New Note
        </Button>
        <Button variant="secondary">
          <TrendingUp size={16} />
          Create Project
        </Button>
        <Button variant="secondary">
          <Settings size={16} />
          Open Canvas
        </Button>
      </div>
    </Card>
  </div>
);

// New Story: Card with Actions
export const WithActions: Story = () => (
  <div style={{ maxWidth: '400px', padding: '16px' }}>
    <Card>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <h3 style={{ fontSize: 'var(--font-size-lg)', fontWeight: 'var(--font-weight-semibold)', color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
            Card with Actions
          </h3>
          <p style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-secondary)' }}>
            This card demonstrates the proper layout for actions within a card. Actions should be placed in a footer element and use standard button variants.
          </p>
        </div>
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'flex-end', 
            gap: 'var(--space-3)', 
            paddingTop: 'var(--space-4)',
            borderTop: '1px solid var(--border-default)' 
          }}
        >
          <Button variant="ghost">Cancel</Button>
          <Button variant="primary">Confirm</Button>
        </div>
      </div>
    </Card>
  </div>
);

WithActions.meta = {
  title: 'Components/Card/With Actions',
  description: 'A standard card component with a header, content, and a footer containing action buttons.',
};

export default {
  title: 'Components/Card',
}; 
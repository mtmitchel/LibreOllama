import React from 'react';
import { CheckSquare, Plus } from 'lucide-react';
import { Button } from '../components/ui';

export function Tasks() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Tasks
          </h1>
          <p className="dashboard-subtitle">
            ADHD-optimized task management
          </p>
        </div>
        <div className="dashboard-controls">
          <Button variant="primary">
            <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            New Task
          </Button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
        <CheckSquare style={{ 
          width: '64px', 
          height: '64px', 
          color: 'var(--text-muted)', 
          margin: '0 auto var(--space-4) auto' 
        }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Tasks Module
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Kanban board functionality will be implemented here based on the Design System specifications.
        </p>
      </div>
    </div>
  );
}

export default Tasks;

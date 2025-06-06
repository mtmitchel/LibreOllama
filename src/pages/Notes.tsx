import React from 'react';
import { FileText, Plus } from 'lucide-react';
import { Button } from '../components/ui';

export function Notes() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
      <div className="dashboard-header">
        <div>
          <h1 className="dashboard-title">
            Notes
          </h1>
          <p className="dashboard-subtitle">
            Block-based note editor for capturing ideas
          </p>
        </div>
        <div className="dashboard-controls">
          <Button variant="primary">
            <Plus style={{ width: '16px', height: '16px', marginRight: '8px' }} />
            New Note
          </Button>
        </div>
      </div>

      <div className="card" style={{ textAlign: 'center', padding: 'var(--space-10)' }}>
        <FileText style={{ 
          width: '64px', 
          height: '64px', 
          color: 'var(--text-muted)', 
          margin: '0 auto var(--space-4) auto' 
        }} />
        <h2 style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
          Notes Module
        </h2>
        <p style={{ color: 'var(--text-secondary)' }}>
          Block editor functionality will be implemented here based on the Design System specifications.
        </p>
      </div>
    </div>
  );
}

export default Notes;

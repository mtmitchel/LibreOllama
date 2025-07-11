import React from 'react';
import { Card, Text, Button, Heading } from '../../../components/ui';
import { PanelRight, FileText, Calendar, Tag, Clock, CheckSquare, Link } from 'lucide-react';

interface NotesContextSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
  noteId?: string;
}

export const NotesContextSidebar: React.FC<NotesContextSidebarProps> = ({ 
  isOpen = true, 
  onToggle,
  noteId 
}) => {
  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="w-16 h-full flex flex-col bg-[var(--bg-secondary)]/30" padding="none">
        <div 
          className="border-b border-[var(--border-default)] flex flex-col items-center"
          style={{ padding: 'var(--space-3)' }}
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show context panel"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
          >
            <PanelRight size={20} />
          </Button>
        </div>
        
        <div 
          className="flex-1 flex flex-col items-center"
          style={{ 
            paddingTop: 'var(--space-4)',
            gap: 'var(--space-3)'
          }}
        >
          {/* Context indicators */}
          <div 
            className="flex flex-col items-center"
            style={{ gap: 'var(--space-2)' }}
          >
            {/* Note info indicator */}
            <div 
              title="Note Info"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <FileText size={14} />
            </div>
            
            {/* Tags indicator */}
            <div 
              title="Tags"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Tag size={14} />
            </div>
            
            {/* History indicator */}
            <div 
              title="History"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Clock size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div 
            className="flex flex-col items-center"
            style={{ 
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}
          >
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                3
              </Text>
            </div>
            <Text size="xs" variant="tertiary" className="text-center">
              Items
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="w-80 flex-shrink-0 flex flex-col h-full" padding="none">
      {/* Header */}
      <div 
        className="border-b border-[var(--border-default)] flex items-center justify-between"
        style={{ padding: 'var(--space-4)' }}
      >
        <div>
          <Heading level={4} style={{ marginBottom: 'var(--space-1)' }}>
            Context
          </Heading>
          <Text variant="secondary" size="sm">
            Related items for this note
          </Text>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide context panel"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <PanelRight size={18} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div 
        className="flex-1 overflow-y-auto"
        style={{ padding: 'var(--space-4)' }}
      >
        <div 
          className="flex flex-col"
          style={{ gap: 'var(--space-6)' }}
        >
          {/* Quick Actions */}
          <div>
            <Text size="sm" weight="semibold" variant="body" style={{ marginBottom: 'var(--space-3)' }}>
              Quick Actions
            </Text>
            <div 
              className="grid grid-cols-2 gap-[var(--space-2)]"
            >
              <Button variant="ghost" size="sm" className="justify-start">
                <CheckSquare size={14} className="mr-[var(--space-2)]" />
                Create Task
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Link size={14} className="mr-[var(--space-2)]" />
                Link Note
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Calendar size={14} className="mr-[var(--space-2)]" />
                Schedule
              </Button>
              <Button variant="ghost" size="sm" className="justify-start">
                <Tag size={14} className="mr-[var(--space-2)]" />
                Add Label
              </Button>
            </div>
          </div>

          {/* Note Details */}
          <div>
            <Text size="sm" weight="semibold" variant="body" style={{ marginBottom: 'var(--space-3)' }}>
              Note Details
            </Text>
            <div 
              className="flex flex-col"
              style={{ gap: 'var(--space-4)' }}
            >
              <div>
                <Text size="sm" weight="medium" color="secondary">
                  Tags
                </Text>
                <div className="flex flex-wrap gap-[var(--space-2)] mt-[var(--space-1)]">
                  <span className="bg-[var(--accent-ghost)] text-[var(--accent-primary)] text-xs font-medium px-[var(--space-2)] py-[var(--space-1)] rounded-full">
                    Project X
                  </span>
                  <span className="bg-[var(--accent-ghost)] text-[var(--accent-primary)] text-xs font-medium px-[var(--space-2)] py-[var(--space-1)] rounded-full">
                    Meeting
                  </span>
                </div>
              </div>
              <div>
                <Text size="sm" weight="medium" color="secondary">
                  Created
                </Text>
                <Text size="sm">January 1, 2025</Text>
              </div>
              <div>
                <Text size="sm" weight="medium" color="secondary">
                  Last Modified
                </Text>
                <Text size="sm">January 1, 2025</Text>
              </div>
              <div>
                <Text size="sm" weight="medium" color="secondary">
                  Word Count
                </Text>
                <Text size="sm">0 words</Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}; 
import React from 'react';
import { Card, Heading, Text, Button, Badge } from '../../../components/ui';
import { 
  FileText, 
  CheckSquare, 
  Pin, 
  Calendar, 
  User, 
  ExternalLink,
  Plus,
  PanelRight
} from 'lucide-react';

interface ContextItem {
  id: string;
  title: string;
  type: 'note' | 'task' | 'project' | 'message';
  status?: 'pending' | 'in-progress' | 'completed';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface ContextSidebarProps {
  isOpen?: boolean;
  conversationId?: string;
  onToggle?: () => void;
}

// Mock context data - in real app, this would come from the store/API
const mockContextData: ContextItem[] = [
  {
    id: 'note-1',
    title: 'Design System Component Specifications',
    type: 'note',
    date: '2 days ago'
  },
  {
    id: 'task-1',
    title: 'Implement chat message actions',
    type: 'task',
    status: 'in-progress',
    priority: 'high',
    date: 'Due today'
  },
  {
    id: 'task-2',
    title: 'Update button component variants',
    type: 'task',
    status: 'completed',
    priority: 'medium',
    date: 'Completed yesterday'
  },
  {
    id: 'message-1',
    title: 'Earlier discussion about color tokens',
    type: 'message',
    date: '1 hour ago'
  },
  {
    id: 'project-1',
    title: 'LibreOllama Design System',
    type: 'project',
    date: 'Active project'
  }
];

const getItemIcon = (type: ContextItem['type']) => {
  switch (type) {
    case 'note': return <FileText size={14} />;
    case 'task': return <CheckSquare size={14} />;
    case 'project': return <Calendar size={14} />;
    case 'message': return <Pin size={14} />;
    default: return <FileText size={14} />;
  }
};

const getStatusBadge = (item: ContextItem) => {
  if (item.status) {
    const statusConfig = {
      'pending': { variant: 'secondary' as const, label: 'Pending' },
      'in-progress': { variant: 'accent' as const, label: 'In Progress' },
      'completed': { variant: 'success' as const, label: 'Completed' }
    };
    const config = statusConfig[item.status];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  }
  
  if (item.priority) {
    const priorityConfig = {
      'low': { variant: 'secondary' as const, label: 'Low' },
      'medium': { variant: 'warning' as const, label: 'Medium' },
      'high': { variant: 'error' as const, label: 'High' }
    };
    const config = priorityConfig[item.priority];
    return <Badge variant={config.variant} className="text-xs">{config.label}</Badge>;
  }
  
  return null;
};

export function ContextSidebar({ isOpen = true, conversationId, onToggle }: ContextSidebarProps) {
  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="w-16 h-full flex flex-col bg-[var(--bg-secondary)]/30" padding="none">
        <div className="p-[var(--space-3)] border-b border-[var(--border-default)] flex flex-col items-center">
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
        
        <div className="flex-1 flex flex-col items-center pt-[var(--space-4)] gap-[var(--space-3)]">
          {/* Context indicators */}
          <div className="flex flex-col items-center gap-[var(--space-2)]">
            {/* Tasks indicator */}
            <div 
              title="Related Tasks"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <CheckSquare size={14} />
            </div>
            
            {/* Notes indicator */}
            <div 
              title="Linked Notes"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <FileText size={14} />
            </div>
            
            {/* Projects indicator */}
            <div 
              title="Related Projects"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Calendar size={14} />
            </div>
            
            {/* Pinned messages indicator */}
            <div 
              title="Pinned Messages"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Pin size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div className="flex flex-col items-center gap-[var(--space-1)] mt-[var(--space-2)]">
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                {mockContextData.length}
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

  const linkedNotes = mockContextData.filter(item => item.type === 'note');
  const relatedTasks = mockContextData.filter(item => item.type === 'task');
  const pinnedMessages = mockContextData.filter(item => item.type === 'message');
  const relatedProjects = mockContextData.filter(item => item.type === 'project');

  return (
    <Card className="w-80 flex-shrink-0 flex flex-col h-full" padding="none">
      {/* Header */}
      <div className="p-[var(--space-4)] border-b border-[var(--border-default)] flex items-center justify-between">
        <div>
          <Heading level={4} className="text-[var(--text-primary)] mb-[var(--space-1)]">
            Context
          </Heading>
          <Text variant="secondary" size="sm">
            Related items from across your workspace
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
      <div className="flex-1 overflow-y-auto p-[var(--space-4)] space-y-[var(--space-6)]">
        
        {/* Related Tasks */}
        {relatedTasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-[var(--space-3)]">
              <Text weight="semibold" size="sm" className="text-[var(--text-primary)]">
                Related Tasks
              </Text>
              <Button variant="ghost" size="sm" className="gap-[var(--space-1)]">
                <Plus size={12} />
                Add
              </Button>
            </div>
            <div className="space-y-[var(--space-2)]">
              {relatedTasks.map(item => (
                <div 
                  key={item.id}
                  className="p-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-[var(--space-3)]">
                    <div className="text-[var(--text-muted)] mt-[var(--space-0-5)]">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-[var(--space-2)]">
                        {getStatusBadge(item)}
                        <Text variant="tertiary" size="xs">
                          {item.date}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Notes */}
        {linkedNotes.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-[var(--space-3)]">
              <Text weight="semibold" size="sm" className="text-[var(--text-primary)]">
                Linked Notes
              </Text>
              <Button variant="ghost" size="sm" className="gap-[var(--space-1)]">
                <Plus size={12} />
                Link
              </Button>
            </div>
            <div className="space-y-[var(--space-2)]">
              {linkedNotes.map(item => (
                <div 
                  key={item.id}
                  className="p-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-[var(--space-3)]">
                    <div className="text-[var(--text-muted)] mt-[var(--space-0-5)]">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                      <Text variant="tertiary" size="xs">
                        {item.date}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Pinned Messages */}
        {pinnedMessages.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-[var(--space-3)]">
              <Text weight="semibold" size="sm" className="text-[var(--text-primary)]">
                Pinned Messages
              </Text>
            </div>
            <div className="space-y-[var(--space-2)]">
              {pinnedMessages.map(item => (
                <div 
                  key={item.id}
                  className="p-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-[var(--space-3)]">
                    <div className="text-[var(--text-muted)] mt-[var(--space-0-5)]">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                      <Text variant="tertiary" size="xs">
                        {item.date}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Related Projects */}
        {relatedProjects.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-[var(--space-3)]">
              <Text weight="semibold" size="sm" className="text-[var(--text-primary)]">
                Related Projects
              </Text>
            </div>
            <div className="space-y-[var(--space-2)]">
              {relatedProjects.map(item => (
                <div 
                  key={item.id}
                  className="p-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] hover:bg-[var(--bg-tertiary)] transition-colors cursor-pointer group"
                >
                  <div className="flex items-start gap-[var(--space-3)]">
                    <div className="text-[var(--text-muted)] mt-[var(--space-0-5)]">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-[var(--space-2)] mb-[var(--space-1)]">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                      <Text variant="tertiary" size="xs">
                        {item.date}
                      </Text>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </Card>
  );
} 
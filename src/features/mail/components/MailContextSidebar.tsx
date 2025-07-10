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
  PanelRight,
  Mail,
  Paperclip,
  Tag
} from 'lucide-react';

interface ContextItem {
  id: string;
  title: string;
  type: 'note' | 'task' | 'project' | 'message' | 'attachment' | 'label';
  status?: 'pending' | 'in-progress' | 'completed';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
  size?: string;
}

interface MailContextSidebarProps {
  isOpen?: boolean;
  messageId?: string;
  onToggle?: () => void;
}

// In real app, this would come from the store/API based on the selected message
const getContextData = (messageId?: string): ContextItem[] => {
  // TODO: Implement real context data fetching based on messageId
  // For now, return empty array until real implementation
  return [];
};

const getItemIcon = (type: ContextItem['type']) => {
  switch (type) {
    case 'note': return <FileText size={14} />;
    case 'task': return <CheckSquare size={14} />;
    case 'project': return <Calendar size={14} />;
    case 'message': return <Mail size={14} />;
    case 'attachment': return <Paperclip size={14} />;
    case 'label': return <Tag size={14} />;
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

export function MailContextSidebar({ isOpen = true, messageId, onToggle }: MailContextSidebarProps) {
  // Get context data for the current message
  const contextData = getContextData(messageId);
  
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
            {/* Attachments indicator */}
            <div 
              title="Attachments"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Paperclip size={14} />
            </div>
            
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
            
            {/* Related messages indicator */}
            <div 
              title="Related Messages"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Mail size={14} />
            </div>
            
            {/* Labels indicator */}
            <div 
              title="Labels"
              className="w-8 h-8 rounded-[var(--radius-md)] bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)] transition-colors cursor-pointer"
            >
              <Tag size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div 
            className="flex flex-col items-center mt-2"
            style={{ 
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}
          >
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                {contextData.length}
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

  const attachments = contextData.filter(item => item.type === 'attachment');
  const relatedTasks = contextData.filter(item => item.type === 'task');
  const linkedNotes = contextData.filter(item => item.type === 'note');
  const relatedMessages = contextData.filter(item => item.type === 'message');
  const labels = contextData.filter(item => item.type === 'label');
  const relatedProjects = contextData.filter(item => item.type === 'project');

  const ContextSection = ({ title, items, icon }: { title: string; items: ContextItem[]; icon: React.ReactNode }) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div 
          className="flex items-center mb-3"
          style={{ 
            marginBottom: 'var(--space-3)',
            gap: 'var(--space-2)'
          }}
        >
          <div className="text-[var(--text-secondary)]">{icon}</div>
          <Text size="sm" weight="semibold" variant="body">
            {title}
          </Text>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        
        <div 
          className="space-y-2"
          style={{ gap: 'var(--space-2)' }}
        >
          {items.map(item => (
            <Card
              key={item.id}
              padding="sm"
              className="cursor-pointer hover:bg-[var(--bg-surface)] transition-colors border border-[var(--border-default)]"
            >
              <div 
                className="flex items-start"
                style={{ gap: 'var(--space-2)' }}
              >
                <div className="text-[var(--text-secondary)] mt-1">
                  {getItemIcon(item.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <Text size="sm" weight="medium" className="truncate">
                    {item.title}
                  </Text>
                  <div 
                    className="flex items-center mt-1"
                    style={{ 
                      gap: 'var(--space-2)',
                      marginTop: 'var(--space-1)'
                    }}
                  >
                    <Text size="xs" variant="secondary">
                      {item.date}
                    </Text>
                    {item.size && (
                      <Text size="xs" variant="secondary">
                        {item.size}
                      </Text>
                    )}
                    {getStatusBadge(item)}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-[var(--text-secondary)] hover:text-[var(--text-primary)] opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <ExternalLink size={12} />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  };

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
            Related items for this message
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
          className="space-y-6"
          style={{ gap: 'var(--space-6)' }}
        >
          {/* Quick Actions */}
          <div>
            <Text size="sm" weight="semibold" variant="body" style={{ marginBottom: 'var(--space-3)' }}>
              Quick Actions
            </Text>
            <div 
              className="grid grid-cols-2"
              style={{ gap: 'var(--space-2)' }}
            >
              <Button variant="outline" size="sm" className="justify-start">
                <CheckSquare size={14} />
                Create Task
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <FileText size={14} />
                Take Note
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Calendar size={14} />
                Schedule
              </Button>
              <Button variant="outline" size="sm" className="justify-start">
                <Tag size={14} />
                Add Label
              </Button>
            </div>
          </div>

          {/* Show empty state if no context data */}
          {contextData.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-[var(--text-tertiary)] mb-2">
                <FileText size={24} className="mx-auto" />
              </div>
              <Text size="sm" variant="secondary" className="mb-1">
                No related items
              </Text>
              <Text size="xs" variant="tertiary">
                Select a message to see related tasks, notes, and attachments
              </Text>
            </div>
          ) : (
            <>
              {/* Context Sections */}
              <ContextSection 
                title="Attachments" 
                items={attachments} 
                icon={<Paperclip size={16} />} 
              />
              
              <ContextSection 
                title="Related Tasks" 
                items={relatedTasks} 
                icon={<CheckSquare size={16} />} 
              />
              
              <ContextSection 
                title="Linked Notes" 
                items={linkedNotes} 
                icon={<FileText size={16} />} 
              />
              
              <ContextSection 
                title="Related Messages" 
                items={relatedMessages} 
                icon={<Mail size={16} />} 
              />
              
              <ContextSection 
                title="Projects" 
                items={relatedProjects} 
                icon={<Calendar size={16} />} 
              />
              
              <ContextSection 
                title="Labels" 
                items={labels} 
                icon={<Tag size={16} />} 
              />
            </>
          )}
        </div>
      </div>
    </Card>
  );
} 
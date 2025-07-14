import React from 'react';
import { Card, Heading, Text, Button, Badge } from '../../../components/ui';
import { 
  FileText, 
  CheckSquare, 
  Pin, 
  Calendar, 
  ExternalLink,
  PanelRight,
  MessageSquare,
  Inbox
} from 'lucide-react';

interface ContextItem {
  id: string;
  title: string;
  type: 'note' | 'task' | 'project' | 'message' | 'event' | 'chat' | 'mail';
  status?: 'pending' | 'in-progress' | 'completed';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
}

interface ContextSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

// Mock context data - in real app, this would come from the store/API
const mockContextData: ContextItem[] = [];

const getItemIcon = (type: ContextItem['type']) => {
  switch (type) {
    case 'note':
      return <FileText className="size-4" />;
    case 'task':
      return <CheckSquare className="size-4" />;
    case 'project':
      return <Pin className="size-4" />;
    case 'message':
      return <MessageSquare className="size-4" />;
    case 'event':
      return <Calendar className="size-4" />;
    case 'chat':
      return <MessageSquare className="size-4" />;
    case 'mail':
      return <Inbox className="size-4" />;
    default:
      return <FileText className="size-4" />;
  }
};

const getStatusBadge = (item: ContextItem) => {
  if (!item.status) return null;
  
  const statusConfig = {
    pending: { variant: 'secondary' as const, text: 'Pending' },
    'in-progress': { variant: 'accent' as const, text: 'In Progress' },
    completed: { variant: 'success' as const, text: 'Completed' }
  };
  
  const config = statusConfig[item.status];
  if (!config) return null;
  
  return (
    <Badge variant={config.variant} className="text-xs">
      {config.text}
    </Badge>
  );
};

export function ContextSidebar({ isOpen = true, onToggle }: ContextSidebarProps) {
  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="flex h-full w-16 flex-col bg-sidebar" padding="none">
        <div className="border-border-default flex flex-col items-center border-b p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="text-secondary hover:text-primary"
          >
            <PanelRight size={20} />
          </Button>
        </div>
        
        <div className="flex flex-1 flex-col items-center gap-3 pt-4">
          {/* Context indicators */}
          <div className="flex flex-col items-center gap-2">
            {/* Tasks indicator */}
            <div 
              title="Related tasks"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <CheckSquare size={14} />
            </div>
            
            {/* Notes indicator */}
            <div 
              title="Linked notes"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <FileText size={14} />
            </div>
            
            {/* Projects indicator */}
            <div 
              title="Related projects"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <Calendar size={14} />
            </div>
            
            {/* Pinned messages indicator */}
            <div 
              title="Pinned messages"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <Pin size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-primary">
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
  const relatedEvents = mockContextData.filter(item => item.type === 'event');
  const relatedChats = mockContextData.filter(item => item.type === 'chat');
  const relatedMails = mockContextData.filter(item => item.type === 'mail');
  const relatedProjects = mockContextData.filter(item => item.type === 'project');

  return (
    <Card className="flex h-full w-80 shrink-0 flex-col" padding="none">
      {/* Header */}
      <div className="border-border-default flex items-center justify-between border-b p-4">
        <div>
          <Heading level={4} className="mb-1 text-primary">
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
            className="text-secondary hover:text-primary"
          >
            <PanelRight size={18} />
          </Button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        
        {/* Quick Actions */}
        <div>
          <Text size="sm" weight="semibold" variant="body" className="mb-3">
            Quick actions
          </Text>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <CheckSquare size={14} />
              Create task
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <FileText size={14} />
              Take note
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Calendar size={14} />
              Schedule
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Pin size={14} />
              Pin message
            </Button>
          </div>
        </div>

        {/* Separator */}
        <div className="border-border-subtle border-t" />
        
        {/* Related Tasks */}
        {relatedTasks.length > 0 && (
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related tasks
              </Text>
            </div>
            <div className="space-y-2">
              {relatedTasks.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
                          <ExternalLink size={12} />
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
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
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Linked notes
              </Text>
            </div>
            <div className="space-y-2">
              {linkedNotes.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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
            <div className="mb-3 flex items-center justify-between">
              <Text weight="semibold" size="sm" className="text-primary">
                Pinned Messages
              </Text>
            </div>
            <div className="space-y-2">
              {pinnedMessages.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related events
              </Text>
            </div>
            <div className="space-y-2">
              {relatedEvents.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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

        {/* Related Chats */}
        {relatedChats.length > 0 && (
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related chats
              </Text>
            </div>
            <div className="space-y-2">
              {relatedChats.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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

        {/* Related Mails */}
        {relatedMails.length > 0 && (
          <div>
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related mails
              </Text>
            </div>
            <div className="space-y-2">
              {relatedMails.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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
            <div className="mb-3 flex items-center">
              <Text weight="semibold" size="sm" className="text-primary">
                Related projects
              </Text>
            </div>
            <div className="space-y-2">
              {relatedProjects.map(item => (
                <div 
                  key={item.id}
                  className="border-border-default group cursor-pointer rounded-md border p-3 transition-colors hover:bg-tertiary"
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 text-muted">
                      {getItemIcon(item.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-start justify-between gap-2">
                        <Text size="sm" weight="medium" className="line-clamp-2">
                          {item.title}
                        </Text>
                        <Button variant="ghost" size="sm" className="p-1 opacity-0 transition-opacity group-hover:opacity-100">
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
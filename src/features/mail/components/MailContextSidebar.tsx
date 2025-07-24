import React, { useState } from 'react';
import { Card, Heading, Text, Button, Badge } from '../../../components/ui';
import { 
  FileText, 
  CheckSquare, 
  Pin, 
  Calendar, 
  CalendarDays,
  User, 
  ExternalLink,
  Plus,
  PanelRight,
  Mail,
  MessageSquare,
  Inbox,
  Paperclip,
  Tag,
  Settings,
  RotateCcw,
  List,
  MessageCircle,
  Eye,
  Archive
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';

interface ContextItem {
  id: string;
  title: string;
  type: 'note' | 'task' | 'project' | 'message' | 'attachment' | 'label' | 'event' | 'chat' | 'mail';
  status?: 'pending' | 'in-progress' | 'completed';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
  size?: string;
}

interface MailContextSidebarProps {
  isOpen?: boolean;
  messageId?: string;
  onToggle?: () => void;
  isThreadedView?: boolean;
  onThreadedViewChange?: (isThreaded: boolean) => void;
  listViewType?: 'enhanced';
  onListViewTypeChange?: (type: 'enhanced') => void;
}

interface MailSettings {
  viewMode: 'threaded' | 'flat';
  listType: 'enhanced';
  compactView: boolean;
  showPreview: boolean;
  markAsReadDelay: number;
  autoMarkAsRead: boolean;
  autoArchive: boolean;
  showImages: boolean;
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
    case 'event': return <CalendarDays size={14} />;
    case 'chat': return <MessageSquare size={14} />;
    case 'mail': return <Inbox size={14} />;
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

const defaultMailSettings: MailSettings = {
  viewMode: 'threaded',
  listType: 'enhanced',
  compactView: false,
  showPreview: true,
  markAsReadDelay: 2,
  autoMarkAsRead: true,
  autoArchive: false,
  showImages: false
};

export function MailContextSidebar({ 
  isOpen = true, 
  messageId, 
  onToggle,
  isThreadedView = true,
  onThreadedViewChange,
  listViewType = 'enhanced',
  onListViewTypeChange
}: MailContextSidebarProps) {
  const [activeTab, setActiveTab] = useState<'context' | 'settings'>('context');
  const [mailSettings, setMailSettings] = useState<MailSettings>(defaultMailSettings);
  
  // Get mail store
  const { labelSettings, updateLabelSettings } = useMailStore();
  
  // Get context data for the current message
  const contextData = getContextData(messageId);
  
  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="flex h-full w-16 flex-col bg-sidebar" padding="none">
        <div 
          className="border-border-default flex flex-col items-center border-b p-3"
        >
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show context panel"
            className="text-secondary hover:bg-tertiary hover:text-primary"
          >
            <PanelRight size={20} />
          </Button>
        </div>
        
        <div 
          className="flex flex-1 flex-col items-center gap-3 pt-4"
        >
          {/* Context indicators */}
                      <div 
              className="flex flex-col items-center gap-2"
            >
            {/* Attachments indicator */}
            <div 
              title="Attachments"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <Paperclip size={14} />
            </div>
            
            {/* Tasks indicator */}
            <div 
              title="Related Tasks"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <CheckSquare size={14} />
            </div>
            
            {/* Notes indicator */}
            <div 
              title="Linked Notes"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <FileText size={14} />
            </div>
            
            {/* Related messages indicator */}
            <div 
              title="Related Messages"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <Mail size={14} />
            </div>
            
            {/* Tags indicator */}
            <div 
              title="Tags"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-ghost"
            >
              <Tag size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div 
            className="mt-2 flex flex-col items-center gap-1"
          >
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-primary">
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
  const relatedEvents = contextData.filter(item => item.type === 'event');
  const relatedChats = contextData.filter(item => item.type === 'chat');
  const relatedMails = contextData.filter(item => item.type === 'mail');
  const tags = contextData.filter(item => item.type === 'label');
  const relatedProjects = contextData.filter(item => item.type === 'project');

  const ContextSection = ({ title, items, icon }: { title: string; items: ContextItem[]; icon: React.ReactNode }) => {
    if (items.length === 0) return null;

    return (
      <div>
        <div 
          className="mb-3 flex items-center"
          style={{ 
            marginBottom: 'var(--space-3)',
            gap: 'var(--space-2)'
          }}
        >
          <div className="text-secondary">{icon}</div>
          <Text size="sm" weight="semibold" variant="body">
            {title}
          </Text>
          <Badge variant="secondary" className="text-xs">
            {items.length}
          </Badge>
        </div>
        
        <div 
          className="gap-2 space-y-2"
        >
          {items.map(item => (
            <Card
              key={item.id}
              padding="sm"
              className="border-border-default cursor-pointer border transition-colors hover:bg-surface"
            >
              <div 
                className="flex items-start gap-2"
              >
                <div className="mt-1 text-secondary">
                  {getItemIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <Text size="sm" weight="medium" className="truncate">
                    {item.title}
                  </Text>
                  <div 
                    className="mt-1 flex items-center"
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
                  className="size-6 text-secondary opacity-0 transition-opacity hover:text-primary group-hover:opacity-100"
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

  const handleMailSettingsChange = (key: keyof MailSettings, value: any) => {
    setMailSettings(prev => ({ ...prev, [key]: value }));
    
    // Sync with parent component props
    if (key === 'viewMode') {
      onThreadedViewChange?.(value === 'threaded');
    }
    if (key === 'listType') {
      onListViewTypeChange?.(value);
    }
  };

  const handleResetSettings = () => {
    setMailSettings(defaultMailSettings);
    onThreadedViewChange?.(true);
    onListViewTypeChange?.('enhanced');
  };

  return (
    <Card className="flex h-full w-80 shrink-0 flex-col" padding="none">
      {/* Header with Tabs */}
      <div className="border-border-default border-b">
        <div className="p-4 pb-0">
          <div className="flex items-start justify-between">
            <div>
              <Heading level={4} className="mb-1 text-primary">
                {activeTab === 'context' ? 'Context' : 'Settings'}
              </Heading>
              <Text variant="secondary" size="sm">
                {activeTab === 'context' 
                  ? 'Related items for this message' 
                  : 'Mail view preferences'}
              </Text>
            </div>
            
            {/* Close Button */}
            {onToggle && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onToggle}
                title="Hide context panel"
                className="-mt-1 text-secondary hover:text-primary"
              >
                <PanelRight size={18} />
              </Button>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="border-border-subtle mt-4 flex border-b">
          <button
            onClick={() => setActiveTab('context')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'context'
                ? 'border-accent-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <MessageSquare size={14} />
            Context
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === 'settings'
                ? 'border-accent-primary text-primary'
                : 'border-transparent text-secondary hover:text-primary'
            }`}
          >
            <Settings size={14} />
            Settings
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'context' ? (
          <div className="space-y-6">
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
                  <Tag size={14} />
                  Add tag
                </Button>
              </div>
            </div>

            {/* Separator */}
            <div className="border-border-subtle border-t" />

            {/* Show empty state if no context data */}
            {contextData.length === 0 ? (
              <div className="py-8 text-center">
                <div className="mb-2 text-muted">
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
                  title="Related Events" 
                  items={relatedEvents} 
                  icon={<CalendarDays size={16} />} 
                />
                
                <ContextSection 
                  title="Related Chats" 
                  items={relatedChats} 
                  icon={<MessageSquare size={16} />} 
                />
                
                <ContextSection 
                  title="Related Mails" 
                  items={relatedMails} 
                  icon={<Inbox size={16} />} 
                />
                
                <ContextSection 
                  title="Projects" 
                  items={relatedProjects} 
                  icon={<Calendar size={16} />} 
                />
                
                <ContextSection 
                  title="Tags" 
                  items={tags} 
                  icon={<Tag size={16} />} 
                />
              </>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settings Tab */}
            
            {/* View Settings */}
            <div>
              <Text size="sm" weight="semibold" variant="body" className="mb-3 flex items-center gap-2">
                <Eye size={16} className="text-accent-primary" />
                View Settings
              </Text>
              
              <div className="space-y-4">
                {/* View Mode */}
                <div>
                  <Text size="sm" variant="body" className="mb-2">Message View</Text>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="viewMode"
                        checked={mailSettings.viewMode === 'threaded'}
                        onChange={() => handleMailSettingsChange('viewMode', 'threaded')}
                        className="text-accent-primary focus:ring-accent-primary"
                      />
                      <Text size="sm" variant="secondary">Threaded</Text>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="viewMode"
                        checked={mailSettings.viewMode === 'flat'}
                        onChange={() => handleMailSettingsChange('viewMode', 'flat')}
                        className="text-accent-primary focus:ring-accent-primary"
                      />
                      <Text size="sm" variant="secondary">Flat</Text>
                    </label>
                  </div>
                </div>

                {/* List Type */}
                <div>
                  <Text size="sm" variant="body" className="mb-2">List Type</Text>
                  <select 
                    value={mailSettings.listType}
                    onChange={(e) => handleMailSettingsChange('listType', e.target.value)}
                    className="border-border-default focus:ring-accent-primary w-full rounded-md border bg-surface px-3 py-2 text-primary focus:border-transparent focus:outline-none focus:ring-2"
                  >
                    <option value="enhanced">Enhanced</option>
                  </select>
                </div>

                {/* Compact View */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mailSettings.compactView}
                    onChange={(e) => handleMailSettingsChange('compactView', e.target.checked)}
                    className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                  />
                  <div>
                    <Text size="sm" weight="medium">Compact view</Text>
                    <Text size="xs" variant="tertiary">Show more messages in less space</Text>
                  </div>
                </label>

                {/* Show Preview */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mailSettings.showPreview}
                    onChange={(e) => handleMailSettingsChange('showPreview', e.target.checked)}
                    className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                  />
                  <div>
                    <Text size="sm" weight="medium">Show message preview</Text>
                    <Text size="xs" variant="tertiary">Display snippet of message content</Text>
                  </div>
                </label>
              </div>
            </div>

            {/* Behavior Settings */}
            <div>
              <Text size="sm" weight="semibold" variant="body" className="mb-3 flex items-center gap-2">
                <Settings size={16} className="text-accent-primary" />
                Behavior
              </Text>
              
              <div className="space-y-4">
                {/* Auto Mark as Read */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mailSettings.autoMarkAsRead}
                    onChange={(e) => handleMailSettingsChange('autoMarkAsRead', e.target.checked)}
                    className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                  />
                  <div>
                    <Text size="sm" weight="medium">Auto-mark as read</Text>
                    <Text size="xs" variant="tertiary">Automatically mark messages as read when opened</Text>
                  </div>
                </label>

                {/* Mark as Read Delay */}
                {mailSettings.autoMarkAsRead && (
                  <div>
                    <Text size="sm" variant="body" className="mb-2">Mark as read delay</Text>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={mailSettings.markAsReadDelay}
                        onChange={(e) => handleMailSettingsChange('markAsReadDelay', parseInt(e.target.value) || 0)}
                        min={0}
                        max={10}
                        className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-surface px-3 py-2 text-primary focus:border-transparent focus:outline-none focus:ring-2"
                      />
                      <Text size="sm" variant="secondary">seconds</Text>
                    </div>
                  </div>
                )}

                {/* Auto Archive */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mailSettings.autoArchive}
                    onChange={(e) => handleMailSettingsChange('autoArchive', e.target.checked)}
                    className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                  />
                  <div>
                    <Text size="sm" weight="medium">Auto-archive after reply</Text>
                    <Text size="xs" variant="tertiary">Automatically archive conversations after replying</Text>
                  </div>
                </label>

                {/* Show Images */}
                <label className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={mailSettings.showImages}
                    onChange={(e) => handleMailSettingsChange('showImages', e.target.checked)}
                    className="border-border-default focus:ring-accent-primary rounded text-accent-primary"
                  />
                  <div>
                    <Text size="sm" weight="medium">Always show images</Text>
                    <Text size="xs" variant="tertiary">Automatically load images in messages</Text>
                  </div>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div>
              <Text size="sm" weight="semibold" variant="body" className="mb-3 flex items-center gap-2">
                <RotateCcw size={16} className="text-accent-primary" />
                Actions
              </Text>
              
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleResetSettings}
                  className="justify-center"
                >
                  <RotateCcw size={14} className="mr-2" />
                  Reset to defaults
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
} 

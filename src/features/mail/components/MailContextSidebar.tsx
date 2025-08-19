import React, { useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Badge } from '../../../components/ui/design-system/Badge';
import { Heading, Text, Input, Textarea } from '../../../components/ui';
import { Tile } from '../../../components/ui/design-system/Tile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../../../components/ui/design-system/Dialog';
import { Link } from 'react-router-dom';
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
      'in-progress': { variant: 'info' as const, label: 'In Progress' },
      'completed': { variant: 'success' as const, label: 'Completed' }
    };
    const config = statusConfig[item.status];
    return <Badge variant={config.variant} className="text-[11px]">{config.label}</Badge>;
  }
  
  if (item.priority) {
    const priorityConfig = {
      'low': { variant: 'secondary' as const, label: 'Low' },
      'medium': { variant: 'warning' as const, label: 'Medium' },
      'high': { variant: 'error' as const, label: 'High' }
    };
    const config = priorityConfig[item.priority];
    return <Badge variant={config.variant} className="text-[11px]">{config.label}</Badge>;
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
  const [quickAction, setQuickAction] = useState<null | 'task' | 'note' | 'event' | 'label'>(null);
  const [qaState, setQaState] = useState({
    title: '',
    notes: '',
    due: '',
    startTime: '',
    endTime: '',
    label: ''
  });
  
  // Get mail store
  const { labelSettings, updateLabelSettings, currentMessage } = useMailStore();
  
  // Get context data for the current message
  const contextData = getContextData(messageId);

  // Prefill quick action dialogs from selected message
  React.useEffect(() => {
    if (!quickAction || !currentMessage) return;
    if (quickAction === 'task' || quickAction === 'note' || quickAction === 'event') {
      setQaState(prev => ({ ...prev, title: currentMessage.subject || prev.title }));
    }
    if (quickAction === 'event' && currentMessage?.date) {
      const d = currentMessage.date;
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const hh = String(d.getHours()).padStart(2, '0');
      const mi = String(d.getMinutes()).padStart(2, '0');
      setQaState(prev => ({ ...prev, due: `${yyyy}-${mm}-${dd}`, startTime: hh + ':' + mi }));
    }
  }, [quickAction, currentMessage]);
  
  // If closed, show slim 40px gutter handle aligned like Canvas/Chat
  if (!isOpen) {
    return (
      <div
        style={{
          width: '40px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: '-24px'
        }}
      >
        <button
          onClick={onToggle}
          title="Show context panel"
          aria-label="Show context panel"
          style={{
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '6px',
            background: 'transparent',
            border: 'none',
            color: '#7B8794',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#F4F6F8';
            e.currentTarget.style.color = '#323F4B';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = '#7B8794';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
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
          <Badge variant="secondary" className="text-[11px]">
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
      {/* Tabs row with toggle button - EXACTLY like Chat */}
      <div className="border-border-subtle flex border-b p-2 pl-3">
        <button
          onClick={() => setActiveTab('context')}
          className={`flex items-center gap-2 border-b-2 px-4 py-2 asana-text-sm font-medium transition-colors ${
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
          className={`flex items-center gap-2 border-b-2 px-4 py-2 asana-text-sm font-medium transition-colors ${
            activeTab === 'settings'
              ? 'border-accent-primary text-primary'
              : 'border-transparent text-secondary hover:text-primary'
          }`}
        >
          <Settings size={14} />
          Settings
        </button>
        <div className="ml-auto pr-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide context panel"
            className="size-8 p-0 text-secondary hover:text-primary"
          >
            <PanelRight size={18} strokeWidth={2} />
          </Button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'context' ? (
          <div className="space-y-6">
            {/* Quick Actions */}
            <div>
              <Text size="lg" weight="semibold" variant="body" className="mb-3 asana-text-lg">
                Quick actions
              </Text>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<CheckSquare size={16} />} label="Create task" onClick={() => setQuickAction('task')} />
                <Tile icon={<FileText size={16} />} label="Take note" onClick={() => setQuickAction('note')} />
                <Tile icon={<Calendar size={16} />} label="Schedule" onClick={() => setQuickAction('event')} />
                <Tile icon={<Tag size={16} />} label="Add label" onClick={() => setQuickAction('label')} />
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
                        className="focus:ring-accent-primary text-accent-primary"
                      />
                      <Text size="sm" variant="secondary">Threaded</Text>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="viewMode"
                        checked={mailSettings.viewMode === 'flat'}
                        onChange={() => handleMailSettingsChange('viewMode', 'flat')}
                        className="focus:ring-accent-primary text-accent-primary"
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
      {/* Quick Action Modals (centered) */}
      {quickAction && (
        <Dialog open={true} onOpenChange={(open) => { if (!open) setQuickAction(null); }}>
          <DialogContent size="sm" className="overflow-x-hidden">
            <DialogHeader>
              <DialogTitle>
                {quickAction === 'task' && 'Quick task'}
                {quickAction === 'note' && 'Quick note'}
                {quickAction === 'event' && 'Quick event'}
                {quickAction === 'label' && 'Add label'}
              </DialogTitle>
            </DialogHeader>
            <DialogBody>
              <div className="space-y-3">
                {quickAction !== 'label' && (
                  <Input
                    type="text"
                    placeholder={quickAction === 'note' ? 'Title (optional)' : 'Title'}
                    value={qaState.title}
                    onChange={(e) => setQaState({ ...qaState, title: e.target.value })}
                  />
                )}
                {quickAction === 'note' && (
                  <Textarea
                    placeholder="Write a quick note..."
                    value={qaState.notes}
                    onChange={(e) => setQaState({ ...qaState, notes: e.target.value })}
                    className="min-h-[100px]"
                  />
                )}
                {(quickAction === 'task' || quickAction === 'event') && (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={qaState.due}
                      onChange={(e) => setQaState({ ...qaState, due: e.target.value })}
                    />
                    {quickAction === 'event' ? (
                      <div className="grid grid-cols-2 gap-2 min-w-0">
                        <Input
                          type="time"
                          value={qaState.startTime}
                          onChange={(e) => setQaState({ ...qaState, startTime: e.target.value })}
                          className="min-w-0"
                        />
                        <Input
                          type="time"
                          value={qaState.endTime}
                          onChange={(e) => setQaState({ ...qaState, endTime: e.target.value })}
                          className="min-w-0"
                        />
                      </div>
                    ) : <div />}
                  </div>
                )}
                {quickAction === 'label' && (
                  <Input
                    type="text"
                    placeholder="Label name"
                    value={qaState.label}
                    onChange={(e) => setQaState({ ...qaState, label: e.target.value })}
                  />
                )}
              </div>
            </DialogBody>
            <DialogFooter>
              <div className="mr-auto flex items-center gap-2">
                {quickAction === 'task' && (
                  <Link to="/tasks" className="asana-text-sm text-[color:var(--brand-primary)] hover:underline">Go to tasks</Link>
                )}
                {quickAction === 'note' && (
                  <Link to="/notes" className="asana-text-sm text-[color:var(--brand-primary)] hover:underline">Go to notes</Link>
                )}
                {quickAction === 'event' && (
                  <Link to="/calendar" className="asana-text-sm text-[color:var(--brand-primary)] hover:underline">Go to calendar</Link>
                )}
                {/* no CTA for label */}
              </div>
              <Button variant="ghost" onClick={() => setQuickAction(null)}>Cancel</Button>
              <Button
                variant="primary"
                disabled={
                  (quickAction === 'task' && !qaState.title.trim()) ||
                  (quickAction === 'event' && !qaState.title.trim()) ||
                  (quickAction === 'label' && !qaState.label.trim())
                }
                onClick={() => {
                  console.log('Mail quick action submitted:', quickAction, qaState);
                  setQuickAction(null);
                  setQaState({ title: '', notes: '', due: '', startTime: '', endTime: '', label: '' });
                }}
              >
                {quickAction === 'label' ? 'Add' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Card>
  );
} 

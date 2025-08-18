import React, { useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Badge } from '../../../components/ui/design-system/Badge';
import { Heading, Text, Input, Textarea } from '../../../components/ui';
import { ListItem, Tile } from '../../../components/ui/design-system';
import { useChatStore } from '../stores/chatStore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../../../components/ui/design-system/Dialog';
import { Link } from 'react-router-dom';
import { 
  FileText, 
  CheckSquare, 
  Pin, 
  Calendar, 
  ExternalLink,
  PanelRight,
  MessageSquare,
  Inbox,
  Tag,
  Clock,
  Archive,
  Share2,
  Download,
  Star,
  CalendarDays,
  Settings,
  RotateCcw
} from 'lucide-react';

interface ContextItem {
  id: string;
  title: string;
  type: 'note' | 'task' | 'project' | 'message' | 'event' | 'chat' | 'mail' | 'attachment' | 'label';
  status?: 'pending' | 'in-progress' | 'completed';
  date?: string;
  priority?: 'low' | 'medium' | 'high';
  size?: string;
  excerpt?: string;
}

interface ChatSettings {
  systemPrompt: string;
  creativity: number;
  maxTokens: number;
}

interface ContextSidebarProps {
  isOpen?: boolean;
  conversationId?: string;
  onToggle?: () => void;
}

// Mock context data - in real app, this would come from the store/API based on conversationId
const getContextData = (conversationId?: string): ContextItem[] => {
  if (!conversationId) return [];
  
  // TODO: Replace with real data from store/API
  return [
    {
      id: '1',
      title: 'Project planning discussion',
      type: 'note',
      date: '2 hours ago',
      excerpt: 'Notes from our conversation about Q1 objectives...'
    },
    {
      id: '2', 
      title: 'Follow up on API implementation',
      type: 'task',
      status: 'pending',
      priority: 'high',
      date: 'Due tomorrow'
    },
    {
      id: '3',
      title: 'Team standup - AI features',
      type: 'event',
      date: 'Tomorrow 9:00 AM'
    }
  ];
};

const getItemIcon = (type: ContextItem['type']) => {
  switch (type) {
    case 'note':
      return <FileText size={14} />;
    case 'task':
      return <CheckSquare size={14} />;
    case 'project':
      return <Pin size={14} />;
    case 'message':
      return <MessageSquare size={14} />;
    case 'event':
      return <CalendarDays size={14} />;
    case 'chat':
      return <MessageSquare size={14} />;
    case 'mail':
      return <Inbox size={14} />;
    case 'attachment':
      return <FileText size={14} />;
    case 'label':
      return <Tag size={14} />;
    default:
      return <FileText size={14} />;
  }
};

const getStatusBadge = (item: ContextItem) => {
  if (item.status) {
    const statusConfig = {
      pending: { variant: 'secondary' as const, text: 'Pending' },
      'in-progress': { variant: 'info' as const, text: 'In Progress' },
      completed: { variant: 'success' as const, text: 'Completed' }
    };
    const config = statusConfig[item.status];
    return <Badge variant={config.variant} className="text-[11px]">{config.text}</Badge>;
  }
  
  if (item.priority) {
    const priorityConfig = {
      low: { variant: 'secondary' as const, text: 'Low' },
      medium: { variant: 'warning' as const, text: 'Medium' },
      high: { variant: 'error' as const, text: 'High' }
    };
    const config = priorityConfig[item.priority];
    return <Badge variant={config.variant} className="text-[11px]">{config.text}</Badge>;
  }
  
  return null;
};

export function ContextSidebar({ isOpen = false, conversationId, onToggle }: ContextSidebarProps) {
  const [activeTab, setActiveTab] = useState<'context' | 'settings'>('context');
  const [quickAction, setQuickAction] = useState<null | 'task' | 'note' | 'event' | 'label'>(null);
  const [qaState, setQaState] = useState({
    title: '',
    notes: '',
    due: '',
    startTime: '',
    endTime: '',
    label: ''
  });
  
  // Get chat store state and actions
  const {
    selectedModel,
    availableModels,
    currentSessionSettings,
    conversationSettings,
    updateCurrentSessionSettings,
    updateConversationSettings,
    saveAsModelDefault,
    resetCurrentSession,
    resetModelDefaults
  } = useChatStore();

  // Get the current model info
  const currentModel = availableModels.find(m => m.id === selectedModel);
  const modelName = currentModel?.name || selectedModel || 'No model selected';

  const contextData = getContextData(conversationId);

  // If closed, show only the toggle button
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
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all 150ms ease',
            padding: 0
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'var(--bg-secondary)';
            e.currentTarget.style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.color = 'var(--text-muted)';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // Filter context data by type
  const linkedNotes = contextData.filter(item => item.type === 'note');
  const relatedTasks = contextData.filter(item => item.type === 'task');
  const relatedEvents = contextData.filter(item => item.type === 'event');
  const relatedChats = contextData.filter(item => item.type === 'chat');
  const relatedMails = contextData.filter(item => item.type === 'mail');
  const relatedProjects = contextData.filter(item => item.type === 'project');
  const attachments = contextData.filter(item => item.type === 'attachment');
  const tags = contextData.filter(item => item.type === 'label');

  const ContextSection = ({ title, items, icon, emptyMessage }: { 
    title: string; 
    items: ContextItem[]; 
    icon: React.ReactNode;
    emptyMessage: string;
  }) => (
    <div>
      <div className="mb-3 flex items-center">
        <div className="mr-2 text-secondary">{icon}</div>
        <Text size="sm" weight="semibold" variant="body">
          {title}
        </Text>
        {items.length > 0 && (
          <Badge variant="secondary" className="ml-2 text-[11px]">
            {items.length}
          </Badge>
        )}
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-1">
          {items.map(item => (
            <ListItem
              key={item.id}
              leading={<span className="text-secondary mt-0.5 inline-flex">{getItemIcon(item.type)}</span>}
              primary={<Text as="span" size="sm" weight="medium" className="line-clamp-2">{item.title}</Text>}
              secondary={item.excerpt ? <Text as="span" size="xs" variant="tertiary" className="line-clamp-2">{item.excerpt}</Text> : undefined}
              meta={(
                <span className="inline-flex items-center gap-2">
                    {getStatusBadge(item)}
                  {item.date && <Text as="span" variant="tertiary" size="xs">{item.date}</Text>}
                  {item.size && <Text as="span" variant="tertiary" size="xs">{item.size}</Text>}
                </span>
              )}
              interactive={false}
              className="px-2 py-2"
            />
          ))}
        </div>
      ) : (
        <div className="py-4 text-center">
          <Text size="xs" variant="tertiary">
            {emptyMessage}
          </Text>
        </div>
      )}
    </div>
  );

  const handleSettingsChange = (key: keyof ChatSettings, value: any) => {
    updateCurrentSessionSettings({ [key]: value });
  };

  const handleClearPrompt = () => {
    updateCurrentSessionSettings({ systemPrompt: '' });
  };

  const handleResetAll = () => {
    resetCurrentSession();
  };

  const handleSaveAsDefault = () => {
    if (selectedModel) {
      saveAsModelDefault(selectedModel);
      // TODO: Show success toast notification
      console.log('Saved as default for model:', modelName);
    }
  };

  const handleResetModelDefaults = () => {
    if (selectedModel) {
      resetModelDefaults(selectedModel);
      // Reset current session to default values
      resetCurrentSession();
      console.log('Reset model defaults for:', modelName);
    }
  };

  return (
    <>
      <style>{`
          /* --- CUSTOM SLIDER --- */
          input[type="range"] {
            -webkit-appearance: none;
            appearance: none;
            width: 100%;
            cursor: pointer;
            background: transparent; /* The input itself is transparent; the track is styled below */
            height: 16px; /* Provides a larger clickable area */
          }
          
          input[type="range"]:focus {
            outline: none; /* We will style the thumb's focus state instead */
          }

          /* --- Slider Track --- */
          input[type="range"]::-webkit-slider-runnable-track {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            background: linear-gradient(
              to right,
              var(--accent-primary),
              var(--accent-primary) var(--value, 0%),
              var(--gray-400) var(--value, 0%),
              var(--gray-400) 100%
            );
          }

          input[type="range"]::-moz-range-track {
            width: 100%;
            height: 6px;
            border-radius: 3px;
            border: none;
            background: linear-gradient(
              to right,
              var(--accent-primary),
              var(--accent-primary) var(--value, 0%),
              var(--gray-400) var(--value, 0%),
              var(--gray-400) 100%
            );
          }

          /* --- Slider Thumb --- */
          input[type="range"]::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            height: 16px;
            width: 16px;
            margin-top: -5px; /* Centers thumb on the track */
            background-color: var(--accent-primary);
            border-radius: 50%;
            border: 2px solid var(--bg-card); /* Makes the thumb pop */
            box-shadow: var(--shadow-sm);
          }
          
          input[type="range"]::-moz-range-thumb {
            height: 16px;
            width: 16px;
            background-color: var(--accent-primary);
            border-radius: 50%;
            border: 2px solid var(--bg-card);
            box-shadow: var(--shadow-sm);
          }

          input[type="range"]:focus-visible::-webkit-slider-thumb {
            outline: 2px solid var(--accent-primary);
            outline-offset: 2px;
          }

          input[type="range"]:focus-visible::-moz-range-thumb {
            outline: 2px solid var(--accent-primary);
            outline-offset: 2px;
          }
        `}</style>
      <Card className="flex h-full w-80 shrink-0 flex-col" padding="none">
        {/* Tabs only (title removed) */}
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
                <Tile icon={<Calendar size={16} />} label="Create event" onClick={() => setQuickAction('event')} />
                <Tile icon={<Tag size={16} />} label="Add label" onClick={() => setQuickAction('label')} />
              </div>
            </div>

            {/* Separator */}
            <div className="border-border-subtle border-t" />
            
            {/* Related items (combined) */}
            <div>
              <div className="mb-3 flex items-center">
                <Text size="lg" weight="semibold" variant="body" className="asana-text-lg">Related items</Text>
                <Badge variant="secondary" className="ml-2 text-[11px]">
                  {(relatedTasks.length + linkedNotes.length + relatedEvents.length + relatedChats.length + relatedMails.length + relatedProjects.length)}
                </Badge>
              </div>

              <div className="space-y-3">
                {relatedTasks.map(item => (
                  <ListItem
                    key={`task-${item.id}`}
                    leading={<span className="asana-related-leading task"><CheckSquare size={18} /></span>}
                    primary={<Text as="span" size="base" weight="semibold" className="asana-text-base" title={item.title}>{item.title}</Text>}
                    secondary={<span className="asana-chips"><span className="asana-meta-chip is-warning">Pending</span>{item.date && <span className="asana-meta-chip is-danger">{item.date}</span>}</span>}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title={`Task${item.priority ? ` • Priority: ${item.priority}` : ''}${item.date ? ` • ${item.date}` : ''}`}
                  />
                ))}
                {linkedNotes.map(item => (
                  <ListItem
                    key={`note-${item.id}`}
                    leading={<span className="asana-related-leading note"><FileText size={18} /></span>}
                    primary={<Text as="span" size="base" weight="semibold" className="asana-text-base" title={item.title}>{item.title}</Text>}
                    secondary={<span className="asana-chips">{item.date && <span className="asana-meta-chip is-note">{item.date}</span>}</span>}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title={item.excerpt || ''}
                  />
                ))}
                {relatedEvents.map(item => (
                  <ListItem
                    key={`event-${item.id}`}
                    leading={<span className="asana-related-leading event"><CalendarDays size={18} /></span>}
                    primary={<Text as="span" size="base" weight="semibold" className="asana-text-base" title={item.title}>{item.title}</Text>}
                    secondary={item.date ? <span className="asana-chips"><span className="asana-meta-chip is-info">{item.date}</span></span> : undefined}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title={item.date || ''}
                  />
                ))}
                {relatedChats.map(item => (
                  <ListItem
                    key={`chat-${item.id}`}
                    leading={<span className="asana-related-leading"><MessageSquare size={18} /></span>}
                    primary={<Text as="span" size="base" weight="semibold" className="asana-text-base" title={item.title}>{item.title}</Text>}
                    secondary={item.date ? <span className="asana-chips"><span className="asana-meta-chip">{item.date}</span></span> : undefined}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title={item.excerpt || ''}
                  />
                ))}
                {relatedMails.map(item => (
                  <ListItem
                    key={`mail-${item.id}`}
                    leading={<span className="asana-related-leading"><Inbox size={18} /></span>}
                    primary={<Text as="span" size="base" weight="semibold" className="asana-text-base" title={item.title}>{item.title}</Text>}
                    secondary={item.date ? <span className="asana-chips"><span className="asana-meta-chip">{item.date}</span></span> : undefined}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title={item.date || ''}
                  />
                ))}
                {relatedProjects.map(item => (
                  <ListItem
                    key={`project-${item.id}`}
                    leading={<span className="asana-related-leading"><Pin size={18} /></span>}
                    primary={<Text as="span" size="sm" weight="semibold">{item.title}</Text>}
                    interactive={false}
                    className="asana-list-item--card asana-related-row"
                    title="Project"
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settings Tab */}
            <div className="space-y-6">
              
              {/* Model Info */}
              <div className="border-border-default border-b pb-3">
                <Text size="base" variant="tertiary" className="mb-1 asana-text-base">
                  Settings for model
                </Text>
                <Text size="base" weight="semibold" variant="body" className="asana-text-base">
                  {modelName}
                </Text>
              </div>

              {/* System Prompt */}
              <div>
                <Text size="base" weight="semibold" variant="body" className="mb-3 asana-text-base">
                  System prompt
                </Text>
                <div className="space-y-2">
                  <textarea
                    value={currentSessionSettings.systemPrompt}
                    onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)}
                    placeholder="Enter custom instructions..."
                    className="border-border-default focus:ring-accent-primary h-36 w-full resize-vertical rounded-md border bg-surface px-3 py-2 asana-text-base text-primary focus:border-transparent focus:outline-none focus:ring-2"
                    maxLength={2000}
                  />
                  <div className="flex items-center justify-between">
                    <Text size="xs" variant="tertiary">
                      {currentSessionSettings.systemPrompt.length}/2000
                    </Text>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={handleClearPrompt}
                      disabled={!currentSessionSettings.systemPrompt}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              </div>

              {/* Model Behavior */}
              <div>
                <Text size="sm" weight="semibold" variant="body" className="mb-3">
                  Model behavior
                </Text>
                
                {/* Creativity Slider */}
                <div className="mb-4">
                  <div className="mb-2 flex items-center justify-between">
                    <Text size="base" variant="body" className="asana-text-base">Creativity</Text>
                    <Text size="base" variant="secondary" className="asana-text-base">{currentSessionSettings.creativity}</Text>
                  </div>
                  <input
                    type="range"
                    value={currentSessionSettings.creativity}
                    onChange={(e) => handleSettingsChange('creativity', parseFloat(e.target.value))}
                    max={1}
                    min={0}
                    step={0.1}
                    style={{
                      '--value': `${currentSessionSettings.creativity * 100}%`
                    } as React.CSSProperties}
                  />
                </div>

                {/* Max Response */}
                <div>
                  <Text size="base" variant="body" className="mb-2 asana-text-base">Max response</Text>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentSessionSettings.maxTokens}
                      onChange={(e) => handleSettingsChange('maxTokens', parseInt(e.target.value) || 2048)}
                      min={1}
                      max={32000}
                      className="border-border-default focus:ring-accent-primary flex-1 rounded-md border bg-surface px-3 py-2 text-primary focus:border-transparent focus:outline-none focus:ring-2"
                    />
                    <Text size="base" variant="secondary" className="asana-text-base">tokens</Text>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <Text size="base" weight="semibold" variant="body" className="mb-3 asana-text-base">
                  Actions
                </Text>
                
                {/* Action Buttons */}
                <div className="grid grid-cols-1 gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleSaveAsDefault}
                    disabled={!selectedModel}
                    className="justify-center"
                  >
                    Save as default for {currentModel?.name || 'model'}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetAll}
                    className="justify-center"
                  >
                    <RotateCcw size={14} className="mr-2" />
                    Reset session
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleResetModelDefaults}
                    disabled={!selectedModel}
                    className="text-destructive hover:text-destructive justify-center"
                  >
                    Reset model defaults
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>

    {/* Quick Action Centered Modals (Design System) */}
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
              {/* No CTA for label; quick add only */}
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
                console.log('Quick action submitted:', quickAction, qaState);
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
    </>
  );
} 
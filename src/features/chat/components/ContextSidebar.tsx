import React, { useState } from 'react';
import { Card, Heading, Text, Button, Badge } from '../../../components/ui';
import { useChatStore } from '../stores/chatStore';
import { 
  FileText, 
  CheckSquare, 
  Pin, 
  Calendar, 
  ExternalLink,
  PanelRight,
  MessageSquare,
  Inbox,
  Link,
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
      'in-progress': { variant: 'accent' as const, text: 'In Progress' },
      completed: { variant: 'success' as const, text: 'Completed' }
    };
    const config = statusConfig[item.status];
    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  }
  
  if (item.priority) {
    const priorityConfig = {
      low: { variant: 'secondary' as const, text: 'Low' },
      medium: { variant: 'warning' as const, text: 'Medium' },
      high: { variant: 'error' as const, text: 'High' }
    };
    const config = priorityConfig[item.priority];
    return <Badge variant={config.variant} className="text-xs">{config.text}</Badge>;
  }
  
  return null;
};

export function ContextSidebar({ isOpen = false, conversationId, onToggle }: ContextSidebarProps) {
  const [activeTab, setActiveTab] = useState<'context' | 'settings'>('context');
  
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
      <Card className="flex h-full w-16 flex-col bg-sidebar" padding="none">
        <div className="border-border-default flex flex-col items-center border-b p-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show context panel"
            className="text-secondary hover:text-primary"
          >
            <PanelRight size={20} />
          </Button>
        </div>
        
        <div className="flex flex-1 flex-col items-center gap-3 pt-4">
          {/* Context indicators */}
          <div className="flex flex-col items-center gap-2">
            {/* Notes indicator */}
            <div 
              title="Related notes"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-soft"
            >
              <FileText size={14} />
            </div>
            
            {/* Tasks indicator */}
            <div 
              title="Related tasks"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-soft"
            >
              <CheckSquare size={14} />
            </div>
            
            {/* Events indicator */}
            <div 
              title="Related events"
              className="flex size-8 cursor-pointer items-center justify-center rounded-md bg-tertiary text-secondary transition-colors hover:bg-accent-soft"
            >
              <Calendar size={14} />
            </div>
          </div>
          
          {/* Context count indicator */}
          <div className="mt-2 flex flex-col items-center gap-1">
            <div className="flex size-6 items-center justify-center rounded-full bg-accent-primary">
              <Text size="xs" weight="bold" className="text-white">
                {contextData.length}
              </Text>
            </div>
            <Text size="xs" variant="tertiary" className="text-center">
              items
            </Text>
          </div>
        </div>
      </Card>
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
          <Badge variant="secondary" className="ml-2 text-xs">
            {items.length}
          </Badge>
        )}
      </div>
      
      {items.length > 0 ? (
        <div className="space-y-2">
          {items.map(item => (
            <Card
              key={item.id}
              padding="sm"
              className="border-border-default group cursor-pointer border transition-colors hover:bg-surface"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 text-secondary">
                  {getItemIcon(item.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <Text size="sm" weight="medium" className="line-clamp-2">
                      {item.title}
                    </Text>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="size-6 opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <ExternalLink size={12} />
                    </Button>
                  </div>
                  {item.excerpt && (
                    <Text size="xs" variant="tertiary" className="line-clamp-2 mb-2">
                      {item.excerpt}
                    </Text>
                  )}
                  <div className="flex items-center gap-2">
                    {getStatusBadge(item)}
                    <Text variant="tertiary" size="xs">
                      {item.date}
                    </Text>
                    {item.size && (
                      <Text variant="tertiary" size="xs">
                        {item.size}
                      </Text>
                    )}
                  </div>
                </div>
              </div>
            </Card>
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
                  ? 'Related items for this conversation' 
                  : 'Customize chat behavior'}
              </Text>
            </div>
            
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggle}
              title="Hide context panel"
              className="text-secondary hover:text-primary -mt-1"
            >
              <PanelRight size={18} />
            </Button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-border-subtle mt-4">
          <button
            onClick={() => setActiveTab('context')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
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
            className={`flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
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
                <Button variant="ghost" size="sm" className="justify-start">
                  <CheckSquare size={14} className="mr-2" />
                  Create task
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  <FileText size={14} className="mr-2" />
                  Take note
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  <Calendar size={14} className="mr-2" />
                  Schedule
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  <Pin size={14} className="mr-2" />
                  Pin chat
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  <Share2 size={14} className="mr-2" />
                  Share
                </Button>
                <Button variant="ghost" size="sm" className="justify-start">
                  <Download size={14} className="mr-2" />
                  Export
                </Button>
              </div>
            </div>

            {/* Separator */}
            <div className="border-border-subtle border-t" />
            
            {/* Related Tasks */}
            <ContextSection
              title="Related tasks"
              items={relatedTasks}
              icon={<CheckSquare size={14} />}
              emptyMessage="No related tasks yet"
            />

            {/* Linked Notes */}
            <ContextSection
              title="Linked notes"
              items={linkedNotes}
              icon={<FileText size={14} />}
              emptyMessage="No linked notes yet"
            />

            {/* Related Events */}
            <ContextSection
              title="Related events"
              items={relatedEvents}
              icon={<CalendarDays size={14} />}
              emptyMessage="No related events yet"
            />

            {/* Related Chats */}
            <ContextSection
              title="Related chats"
              items={relatedChats}
              icon={<MessageSquare size={14} />}
              emptyMessage="No related chats yet"
            />

            {/* Related Emails */}
            <ContextSection
              title="Related emails"
              items={relatedMails}
              icon={<Inbox size={14} />}
              emptyMessage="No related emails yet"
            />

            {/* Related Projects */}
            <ContextSection
              title="Related projects"
              items={relatedProjects}
              icon={<Pin size={14} />}
              emptyMessage="No related projects yet"
            />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Settings Tab */}
            <div className="space-y-6">
              
              {/* Model Info */}
              <div className="pb-3 border-b border-border-default">
                <Text size="sm" variant="tertiary" className="mb-1">
                  Settings for model
                </Text>
                <Text size="sm" weight="semibold" variant="body">
                  {modelName}
                </Text>
              </div>

              {/* System Prompt */}
              <div>
                <Text size="sm" weight="semibold" variant="body" className="mb-3">
                  System prompt
                </Text>
                <div className="space-y-2">
                  <textarea
                    value={currentSessionSettings.systemPrompt}
                    onChange={(e) => handleSettingsChange('systemPrompt', e.target.value)}
                    placeholder="Enter custom instructions..."
                    className="w-full h-20 px-3 py-2 border border-border-default rounded-md bg-surface text-primary resize-none focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent text-sm"
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
                  <div className="flex items-center justify-between mb-2">
                    <Text size="sm" variant="body">Creativity</Text>
                    <Text size="sm" variant="secondary">{currentSessionSettings.creativity}</Text>
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
                  <Text size="sm" variant="body" className="mb-2">Max response</Text>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={currentSessionSettings.maxTokens}
                      onChange={(e) => handleSettingsChange('maxTokens', parseInt(e.target.value) || 2048)}
                      min={1}
                      max={32000}
                      className="flex-1 px-3 py-2 border border-border-default rounded-md bg-surface text-primary focus:outline-none focus:ring-2 focus:ring-accent-primary focus:border-transparent"
                    />
                    <Text size="sm" variant="secondary">tokens</Text>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div>
                <Text size="sm" weight="semibold" variant="body" className="mb-3">
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
                    className="justify-center text-destructive hover:text-destructive"
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
    </>
  );
} 
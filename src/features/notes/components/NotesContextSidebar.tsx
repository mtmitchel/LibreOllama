import React, { useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Badge } from '../../../components/ui/design-system/Badge';
import { Text, Heading, Input, Textarea } from '../../../components/ui';
import { Tile } from '../../../components/ui/design-system/Tile';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter } from '../../../components/ui/design-system/Dialog';
import { ToggleRow, Select } from '../../../components/ui/design-system';
import { Link as RouterLink } from 'react-router-dom';
import {
  PanelRight,
  FileText,
  Calendar,
  CalendarDays,
  Tag,
  Clock,
  CheckSquare,
  Link,
  Plus,
  MessageSquare,
  Mail,
  Pin,
  Archive,
  Settings,
  RotateCcw,
  Eye
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

interface NotesSettings {
  autoSave: boolean;
  spellCheck: boolean;
  showWordCount: boolean;
  showOutline: boolean;
  fontSize: 'small' | 'medium' | 'large';
  theme: 'light' | 'dark' | 'auto';
}

interface NotesContextSidebarProps {
  isOpen?: boolean;
  noteId?: string;
  onToggle?: () => void;
}

// In real app, this would come from the store/API based on the selected note
const getContextData = (noteId?: string): ContextItem[] => {
  // TODO: Implement real context data fetching based on noteId
  // For now, return empty array until real implementation
  return [];
};

const getItemIcon = (type: ContextItem['type']) => {
  switch (type) {
    case 'note': return <FileText size={14} />;
    case 'task': return <CheckSquare size={14} />;
    case 'project': return <Pin size={14} />;
    case 'message': return <MessageSquare size={14} />;
    case 'event': return <CalendarDays size={14} />;
    case 'chat': return <MessageSquare size={14} />;
    case 'mail': return <Mail size={14} />;
    case 'attachment': return <FileText size={14} />;
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
      'high': { variant: 'danger' as const, label: 'High' }
    };
    const config = priorityConfig[item.priority];
    return <Badge variant={config.variant} className="text-[11px]">{config.label}</Badge>;
  }
  
  return null;
};

export const NotesContextSidebar: React.FC<NotesContextSidebarProps> = ({ 
  isOpen = true,
  noteId,
  onToggle
}) => {
  const [activeTab, setActiveTab] = useState<'context' | 'settings'>('context');
  const [showSettingsDialog, setShowSettingsDialog] = useState(false);
  const [quickAction, setQuickAction] = useState<null | 'task' | 'note' | 'event' | 'label'>(null);
  const [qaState, setQaState] = useState({
    title: '',
    notes: '',
    due: '',
    startTime: '',
    endTime: '',
    label: ''
  });
  const [settings, setSettings] = useState<NotesSettings>({
    autoSave: true,
    spellCheck: true,
    showWordCount: true,
    showOutline: false,
    fontSize: 'medium',
    theme: 'auto'
  });
  
  const contextData = getContextData(noteId);
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
          marginTop: '-24px',
          flexShrink: 0
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
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-secondary)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  return (
    <Card className="flex h-full w-80 shrink-0 flex-col" padding="none">
      {/* Tabs only (title removed) */}
      <div className="border-border-subtle flex border-b p-2 pl-3" style={{ position: 'sticky', top: 0, zIndex: 200, background: 'var(--bg-primary)' }}>
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

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'context' ? (
          <div className="p-4">
            {/* Quick Actions */}
            <div>
              <Text size="lg" weight="semibold" variant="body" className="mb-3 asana-text-lg">
                Quick actions
              </Text>
              <div className="grid grid-cols-2 gap-2">
                <Tile icon={<CheckSquare size={16} />} label="Create task" onClick={() => setQuickAction('task')} />
                <Tile icon={<FileText size={16} />} label="Take note" onClick={() => setQuickAction('note')} />
                <Tile icon={<Calendar size={16} />} label="Schedule" onClick={() => setQuickAction('event')} />
                <Tile icon={<Tag size={16} />} label="Add tag" onClick={() => setQuickAction('label')} />
              </div>
            </div>

            {/* Context Items */}
            {contextData.length > 0 ? (
              <>
                <div className="mb-3 flex items-center">
                  <Text size="lg" weight="semibold" variant="body" className="asana-text-lg">Related items</Text>
                  <Badge variant="secondary" className="ml-2 text-[11px]">
                    {contextData.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {contextData.map((item) => (
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
              </>
            ) : (
              <div className="py-8 text-center">
                <div className="mb-2 text-muted">
                  <FileText size={24} className="mx-auto" />
                </div>
                <Text size="sm" variant="secondary" className="mb-1">
                  No related items
                </Text>
                <Text size="xs" variant="tertiary">
                  Select a note to see related tasks, notes, and attachments
                </Text>
              </div>
            )}
          </div>
        ) : (
          /* Settings Tab */
          <>
            <div className="p-4">
            <div className="space-y-6">
              <div>
                <Text size="base" weight="semibold" variant="body" className="mb-3 asana-text-base">
                  Editor settings
                </Text>
                <div className="space-y-4">
                  <ToggleRow
                    label="Auto-save"
                    description="Automatically save notes as you type"
                    checked={settings.autoSave}
                    onChange={(checked) => setSettings({ ...settings, autoSave: checked })}
                    switchClassName="ring-1 ring-[var(--border-default)]"
                  />

                  <ToggleRow
                    label="Spell check"
                    description="Check spelling as you type"
                    checked={settings.spellCheck}
                    onChange={(checked) => setSettings({ ...settings, spellCheck: checked })}
                    switchClassName="ring-1 ring-[var(--border-default)]"
                  />

                  <ToggleRow
                    label="Show word count"
                    description="Display word count in the editor"
                    checked={settings.showWordCount}
                    onChange={(checked) => setSettings({ ...settings, showWordCount: checked })}
                    switchClassName="ring-1 ring-[var(--border-default)]"
                  />

                  <ToggleRow
                    label="Show outline"
                    description="Display document outline sidebar"
                    checked={settings.showOutline}
                    onChange={(checked) => setSettings({ ...settings, showOutline: checked })}
                    switchClassName="ring-1 ring-[var(--border-default)]"
                  />
                </div>
              </div>

              <div className="border-t border-[var(--border-subtle)] pt-6">
                <Text size="base" weight="semibold" variant="body" className="mb-3 asana-text-base">
                  Appearance
                </Text>
                <div className="space-y-4">
                  <div>
                    <Text size="sm" variant="body" className="mb-2 asana-text-base">Font size</Text>
                    <Select
                      options={[
                        { value: 'small', label: 'Small' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'large', label: 'Large' }
                      ]}
                      value={settings.fontSize}
                      onChange={(val) => setSettings({ ...settings, fontSize: val as any })}
                    />
                  </div>
                  <div>
                    <Text size="sm" variant="body" className="mb-2 asana-text-base">Theme</Text>
                    <Select
                      options={[
                        { value: 'light', label: 'Light' },
                        { value: 'dark', label: 'Dark' },
                        { value: 'auto', label: 'Auto' }
                      ]}
                      value={settings.theme}
                      onChange={(val) => setSettings({ ...settings, theme: val as any })}
                    />
                  </div>
                </div>
              </div>
            </div>
            </div>
          </>
        )}
      </div>

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
    </Card>
  );
}; 
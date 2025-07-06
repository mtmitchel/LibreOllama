import React from 'react';
import { Button, Text, Card, Caption, Badge } from '../../../components/ui';
import { 
  Edit, 
  Inbox, 
  Star, 
  Clock, 
  Send, 
  FileText, 
  Trash2, 
  AlertTriangle,
  Archive,
  ChevronDown,
  ChevronRight,
  Tag,
  Mail,
  PanelLeft
} from 'lucide-react';
import { useMailStore } from '../stores/mailStore';

interface MailSidebarProps {
  isOpen?: boolean;
  onToggle?: () => void;
}

export function MailSidebar({ isOpen = true, onToggle }: MailSidebarProps) {
  const { 
    currentView, 
    setCurrentView, 
    startCompose, 
    getLabels, 
    currentLabel, 
    setCurrentLabel 
  } = useMailStore();

  const labels = getLabels();

  const [labelsExpanded, setLabelsExpanded] = React.useState(true);

  const mainFolders = [
    { id: 'inbox', name: 'Inbox', icon: Inbox, count: 25 },
    { id: 'starred', name: 'Starred', icon: Star },
    { id: 'snoozed', name: 'Snoozed', icon: Clock },
    { id: 'sent', name: 'Sent', icon: Send },
    { id: 'drafts', name: 'Drafts', icon: FileText },
    { id: 'all', name: 'All Mail', icon: Archive },
    { id: 'spam', name: 'Spam', icon: AlertTriangle },
    { id: 'trash', name: 'Trash', icon: Trash2 },
  ];

  const handleFolderClick = (folderId: string) => {
    setCurrentView(folderId as any);
  };

  const handleLabelClick = (labelId: string) => {
    setCurrentLabel(labelId);
  };

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
            title="Show mail folders"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]"
            style={{ marginBottom: 'var(--space-2)' }}
          >
            <Mail size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => startCompose()}
            title="Compose new email"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-ghost)]"
          >
            <Edit size={18} />
          </Button>
        </div>
        
        <div 
          className="flex-1 flex flex-col items-center"
          style={{ 
            paddingTop: 'var(--space-4)',
            gap: 'var(--space-2)'
          }}
        >
          {/* Show indicators for main folders */}
          {mainFolders.slice(0, 4).map(folder => {
            const Icon = folder.icon;
            const isActive = currentView === folder.id;
            
            return (
              <button
                key={folder.id}
                onClick={() => handleFolderClick(folder.id)}
                title={folder.name}
                className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center transition-all hover:scale-105 ${
                  isActive 
                    ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                    : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)]'
                }`}
              >
                <Icon size={14} />
              </button>
            );
          })}
          
          {/* Folder count indicator */}
          <div 
            className="flex flex-col items-center mt-2"
            style={{ 
              gap: 'var(--space-1)',
              marginTop: 'var(--space-2)'
            }}
          >
            <div className="w-6 h-6 bg-[var(--accent-primary)] rounded-full flex items-center justify-center">
              <Text size="xs" weight="bold" className="text-white">
                {mainFolders.length}
              </Text>
            </div>
            <Text size="xs" variant="tertiary" className="text-center">
              Folders
            </Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      className="w-[340px] flex-shrink-0 flex flex-col h-full"
      padding="default"
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between border-b border-[var(--border-default)]"
        style={{ 
          padding: 'var(--space-4)',
          marginBottom: 'var(--space-4)'
        }}
      >
        <div className="flex items-center" style={{ gap: 'var(--space-2)' }}>
          <Mail className="w-5 h-5 text-[var(--text-secondary)]" />
          <Text size="lg" weight="semibold">Mail</Text>
        </div>
        {onToggle && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide mail folders"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <PanelLeft size={18} />
          </Button>
        )}
      </div>

      {/* Compose Button */}
      <div className="mb-[var(--space-4)]">
        <Button
          onClick={() => startCompose()}
          variant="primary"
          className="w-full"
          size="default"
        >
          <Edit size={18} />
          Compose
        </Button>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto pr-[var(--space-1)]">
        {/* Main Folders */}
        <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
          {mainFolders.map((folder) => {
            const Icon = folder.icon;
            const isActive = currentView === folder.id;
            
            return (
              <Card
                key={folder.id}
                padding="none"
                className={`cursor-pointer group relative ${
                  isActive 
                    ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]' 
                    : 'hover:bg-[var(--bg-surface)] border-transparent'
                }`}
                onClick={() => handleFolderClick(folder.id)}
              >
                <div style={{ padding: 'var(--space-3)' }}>
                  <div 
                    className="flex items-center"
                    style={{ gap: 'var(--space-3)' }}
                  >
                    <Icon 
                      size={18} 
                      className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} 
                    />
                    <Text 
                      size="sm" 
                      weight={isActive ? "semibold" : "medium"}
                      variant={isActive ? "body" : "secondary"}
                      className="flex-1 truncate"
                    >
                      {folder.name}
                    </Text>
                    {folder.count && (
                      <Badge variant="secondary" className="text-xs">
                        {folder.count}
                      </Badge>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Labels Section */}
        <div style={{ marginTop: 'var(--space-6)' }}>
          <Card
            padding="none"
            className="cursor-pointer"
            onClick={() => setLabelsExpanded(!labelsExpanded)}
          >
            <div style={{ padding: 'var(--space-3)' }}>
              <div 
                className="flex items-center"
                style={{ gap: 'var(--space-2)' }}
              >
                {labelsExpanded ? (
                  <ChevronDown size={16} className="text-[var(--text-secondary)]" />
                ) : (
                  <ChevronRight size={16} className="text-[var(--text-secondary)]" />
                )}
                <Caption 
                  className="uppercase tracking-wider font-semibold"
                >
                  Labels
                </Caption>
              </div>
            </div>
          </Card>

          {labelsExpanded && (
            <div style={{ marginTop: 'var(--space-2)' }}>
              <div className="flex flex-col" style={{ gap: 'var(--space-1)' }}>
                {labels.slice(0, 8).map((label) => {
                  const isActive = currentLabel === label.id;
                  
                  return (
                    <Card
                      key={label.id}
                      padding="none"
                      className={`cursor-pointer group relative ${
                        isActive 
                          ? 'bg-[var(--accent-soft)] border-[var(--accent-primary)]' 
                          : 'hover:bg-[var(--bg-surface)] border-transparent'
                      }`}
                      onClick={() => handleLabelClick(label.id)}
                    >
                      <div style={{ padding: 'var(--space-3)' }}>
                        <div 
                          className="flex items-center"
                          style={{ gap: 'var(--space-3)' }}
                        >
                          <Tag 
                            size={16} 
                            className={`flex-shrink-0 ${isActive ? 'text-[var(--accent-primary)]' : 'text-[var(--text-secondary)]'}`} 
                          />
                          <Text 
                            size="sm" 
                            weight={isActive ? "semibold" : "medium"}
                            variant={isActive ? "body" : "secondary"}
                            className="flex-1 truncate"
                          >
                            {label.name}
                          </Text>
                          {label.messagesUnread && label.messagesUnread > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {label.messagesUnread}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </Card>
                  );
                })}
                
                {labels.length === 0 && (
                  <div style={{ padding: 'var(--space-3)' }}>
                    <Text size="sm" variant="secondary">
                      No labels yet
                    </Text>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Storage Info */}
      <div style={{ 
        marginTop: 'var(--space-4)',
        padding: 'var(--space-4)',
        borderTop: '1px solid var(--border-default)'
      }}>
        <Text size="xs" variant="secondary" style={{ marginBottom: 'var(--space-2)' }}>
          15 GB of 15 GB used
        </Text>
        <div 
          className="w-full bg-[var(--bg-tertiary)] rounded-full"
          style={{ height: 'var(--space-1)' }}
        >
          <div 
            className="bg-[var(--accent-primary)] h-full rounded-full" 
            style={{ width: '85%' }}
          />
        </div>
      </div>
    </Card>
  );
} 
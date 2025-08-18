import React, { useState } from 'react';
import { Button } from '../../../components/ui/design-system/Button';
import { Card } from '../../../components/ui/design-system/Card';
import { Caption, Text, Heading, Input, EmptyState } from '../../../components/ui';
import { ListItem, SimpleDialog as Dialog } from '../../../components/ui/design-system';
import { ChatConversation } from "../../../core/lib/chatMockData";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { formatConversationTimestamp } from "../utils/formatTimestamp";
import { 
  Plus, Search, Pin, MessagesSquare, PanelLeft, PanelRight, AlertTriangle
} from 'lucide-react';

// TypeScript interfaces provide prop validation - PropTypes not needed in TS projects
interface ConversationListProps {
  conversations: ChatConversation[];
  selectedChatId: string | null;
  searchQuery: string;
  isOpen: boolean;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSearchChange: (query: string) => void;
  onHoverConversation: (conversationId: string | null) => void;
  onTogglePin: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onToggle: () => void;
  onRenameConversation?: (conversationId: string) => void;
  onExportConversation?: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  selectedChatId,
  searchQuery,
  isOpen,
  onSelectChat,
  onNewChat,
  onSearchChange,
  onHoverConversation,
  onTogglePin,
  onDeleteConversation,
  onToggle,
  onRenameConversation,
  onExportConversation,
}: ConversationListProps) {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    conversation: ChatConversation;
    position: { x: number; y: number };
  } | null>(null);
  
  // Dialog states (persisted at this level to survive context menu unmounting)
  const [deleteDialogConversation, setDeleteDialogConversation] = useState<ChatConversation | null>(null);
  const [renameDialogConversation, setRenameDialogConversation] = useState<ChatConversation | null>(null);
  
  // Filter conversations based on search query
  const filteredConversations = conversations.filter(conv => {
    const searchLower = searchQuery?.toLowerCase() || '';
    return (
      conv.title?.toLowerCase().includes(searchLower) ||
      conv.lastMessage?.toLowerCase().includes(searchLower)
    );
  });

  // Separate pinned and recent conversations
  const pinnedConversations = filteredConversations.filter(conv => conv.isPinned);
  const recentConversations = filteredConversations.filter(conv => !conv.isPinned);

  // If sidebar is closed, show slim gutter handle aligned with main nav toggle
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
          title="Show conversations"
          aria-label="Show conversations"
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
            e.currentTarget.style.color = 'var(--text-muted);'
          }}
        >
          <PanelRight size={18} strokeWidth={2} />
        </button>
      </div>
    );
  }

  // TypeScript interface provides type safety for props
  const ConversationCard = ({ conv }: { conv: ChatConversation }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectChat(conv.id);
      }
    };

    const handleContextMenu = (e: React.MouseEvent) => {
      e.preventDefault();
      console.log('🖱️ RIGHT-CLICK CONTEXT MENU triggered for conversation:', conv.id);
      setContextMenu({
        conversation: conv,
        position: { x: e.clientX, y: e.clientY }
      });
    };

    return (
      <div
        key={conv.id}
        className={`group relative cursor-pointer rounded-lg border transition-all hover:bg-hover px-1 py-0.5 ${selectedChatId === conv.id ? 'border-selected bg-selected' : 'border-transparent'}`}
        onKeyDown={handleKeyDown}
      >
        <ListItem
          leading={conv.isPinned ? <Pin className="size-3 text-muted" /> : undefined}
          primary={<span className="truncate asana-text-base" title={conv.title}>{conv.title}</span>}
          onActivate={() => onSelectChat(conv.id)}
          onContextMenu={handleContextMenu}
          onMouseEnter={() => onHoverConversation(conv.id)}
          onMouseLeave={() => onHoverConversation(null)}
          className="px-2 py-2"
          aria-label={`Select conversation: ${conv.title}`}
        />
      </div>
    );
  };

  return (
    <>
      <Card className="flex h-full w-80 flex-col bg-sidebar" padding="none">
      {/* Header */}
      <div className="border-border-default flex shrink-0 items-center justify-between border-b p-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            className="size-8 p-0 text-secondary hover:text-primary"
            title="Hide conversations"
            aria-label="Hide conversations"
          >
            <PanelLeft size={18} strokeWidth={2} />
          </Button>
          <Heading level={3}>Conversations</Heading>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNewChat}
          className="text-secondary hover:text-primary"
        >
          <Plus size={20} />
        </Button>
      </div>

      {/* Search */}
      <div className="shrink-0 p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {filteredConversations.length === 0 ? (
          <EmptyState
            icon="💬"
            title="No conversations found"
            message={searchQuery ? "Try adjusting your search terms" : "Start a new conversation to get started"}
            size="sm"
          />
        ) : (
          <div className="space-y-6">
            {/* Pinned Section */}
            {pinnedConversations.length > 0 && (
              <div className="pb-4">
                <div className="flex items-center gap-2 px-2 py-3">
                  <Pin className="size-3.5 text-muted" />
                  <Caption className="font-medium tracking-wider">Pinned</Caption>
                </div>
                <div className="space-y-1">
                  {pinnedConversations.map(conv => (
                    <ConversationCard key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
            
            {/* Recent Section (header removed) */}
            {recentConversations.length > 0 && (
              <div className="pb-4">
                <div className="space-y-1">
                  {recentConversations.map(conv => (
                    <ConversationCard key={conv.id} conv={conv} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      </Card>

      {/* Context Menu */}
      {contextMenu && (
        <ConversationContextMenu
          conversation={contextMenu.conversation}
          isOpen={true}
          position={contextMenu.position}
          onClose={() => setContextMenu(null)}
          onAction={(action, conversationId) => {
            console.log(`Context menu action: ${action} for conversation: ${conversationId}`);
          }}
          onRename={(conversationId) => {
            // Find the conversation and show rename dialog
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
              setRenameDialogConversation(conv);
              setContextMenu(null);
            }
          }}
          onPin={onTogglePin}
          onUnpin={onTogglePin}
          onDelete={(conversationId) => {
            // Find the conversation and show delete dialog
            const conv = conversations.find(c => c.id === conversationId);
            if (conv) {
              setDeleteDialogConversation(conv);
              setContextMenu(null);
            }
          }}
          onExport={onExportConversation}
        />
      )}

      {/* Delete Confirmation Dialog */}
      {deleteDialogConversation && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setDeleteDialogConversation(null);
          }}
          title="Delete conversation"
          description="This action cannot be undone."
          size="sm"
          footer={(
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() => setDeleteDialogConversation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => {
                  if (deleteDialogConversation) {
                    onDeleteConversation(deleteDialogConversation.id);
                    setDeleteDialogConversation(null);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          )}
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex size-8 items-center justify-center rounded-full bg-error-ghost">
              <AlertTriangle className="size-4 text-error" />
            </div>
            <p className="asana-text-sm text-secondary">
              Are you sure you want to delete "{deleteDialogConversation.title}"? This will permanently remove the conversation and all its messages.
            </p>
          </div>
        </Dialog>
      )}

      {/* Rename Dialog */}
      {renameDialogConversation && (
        <Dialog
          open={true}
          onOpenChange={(open) => {
            if (!open) setRenameDialogConversation(null);
          }}
          title="Rename conversation"
          description="Enter a new name for this conversation"
          size="sm"
          footer={(
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="ghost"
                onClick={() => setRenameDialogConversation(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={() => {
                  if (renameDialogConversation && onRenameConversation) {
                    onRenameConversation(renameDialogConversation.id);
                    setRenameDialogConversation(null);
                  }
                }}
              >
                Rename
              </Button>
            </div>
          )}
        >
          <Input
            defaultValue={renameDialogConversation.title}
            placeholder="Enter conversation name"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter' && onRenameConversation) {
                onRenameConversation(renameDialogConversation.id);
                setRenameDialogConversation(null);
              }
            }}
          />
        </Dialog>
      )}
    </>
  );
}

import React, { useState } from 'react';
import { Caption, Text, Heading, Button, Input, Card, EmptyState } from "../../../components/ui";
import { ChatConversation } from "../../../core/lib/chatMockData";
import { ConversationContextMenu } from "./ConversationContextMenu";
import { formatConversationTimestamp } from "../utils/formatTimestamp";
import { 
  Plus, Search, Pin, MessagesSquare, PanelLeft
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
  onArchiveConversation?: (conversationId: string) => void;
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
  onArchiveConversation,
  onExportConversation,
}: ConversationListProps) {
  // Context menu state
  const [contextMenu, setContextMenu] = useState<{
    conversation: ChatConversation;
    position: { x: number; y: number };
  } | null>(null);
  
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

  // If sidebar is closed, show only the toggle button
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
            <PanelLeft size={20} />
          </Button>
        </div>
      </Card>
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
        className={`
          group relative cursor-pointer rounded-lg border px-3 py-2 transition-all hover:bg-hover
          ${selectedChatId === conv.id ? 'border-selected bg-selected' : 'border-transparent'}
        `}
        onClick={() => onSelectChat(conv.id)}
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onMouseEnter={() => onHoverConversation(conv.id)}
        onMouseLeave={() => onHoverConversation(null)}
        tabIndex={0}
        role="button"
        aria-label={`Select conversation: ${conv.title}`}
      >
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Heading level={4} className="truncate">
                {conv.title}
              </Heading>
              {conv.isPinned && (
                <Pin className="size-3 text-muted" />
              )}
            </div>
            <Text variant="secondary" size="sm" className="mt-1 truncate">
              {conv.lastMessage}
            </Text>
            <Caption className="mt-1 text-xs">
              {formatConversationTimestamp(conv.timestamp)}
            </Caption>
          </div>
        </div>
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
            className="text-secondary hover:text-primary"
          >
            <PanelLeft size={20} />
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
            
            {/* Recent Section */}
            {recentConversations.length > 0 && (
              <div className="pb-4">
                <div className="flex items-center gap-2 px-2 py-3">
                  <MessagesSquare className="size-3.5 text-muted" />
                  <Caption className="font-medium tracking-wider">Recent</Caption>
                </div>
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
          onRename={onRenameConversation}
          onPin={onTogglePin}
          onUnpin={onTogglePin}
          onDelete={onDeleteConversation}
          onArchive={onArchiveConversation}
          onExport={onExportConversation}
        />
      )}
    </>
  );
}

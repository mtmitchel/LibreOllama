import { Caption, Text, Heading, Button, Input, Badge, Card } from "../../../components/ui";
import { ChatConversation } from "../../../core/lib/chatMockData";
import { 
  Plus, Search, Pin, Users, MessagesSquare, Download, Trash2, ChevronDown, PanelLeft
} from 'lucide-react';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedChatId: string | null;
  searchQuery: string;
  hoveredConversationId: string | null;
  isOpen: boolean;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSearchChange: (query: string) => void;
  onHoverConversation: (conversationId: string | null) => void;
  onTogglePin: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
  onToggle: () => void;
}

export function ConversationList({
  conversations,
  selectedChatId,
  searchQuery,
  hoveredConversationId,
  isOpen,
  onSelectChat,
  onNewChat,
  onSearchChange,
  onHoverConversation,
  onTogglePin,
  onDeleteConversation,
  onToggle,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const recentConversations = filteredConversations.filter(c => !c.isPinned);

  // If closed, show only the toggle button
  if (!isOpen) {
    return (
      <Card className="w-16 h-full flex flex-col bg-[var(--bg-secondary)]/30" padding="none">
        <div className="p-[var(--space-3)] border-b border-[var(--border-default)] flex flex-col items-center">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Show conversations"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)] mb-[var(--space-2)]"
          >
            <MessagesSquare size={20} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onNewChat}
            title="New conversation"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--accent-ghost)]"
          >
            <Plus size={18} />
          </Button>
        </div>
        
        <div className="flex-1 flex flex-col items-center pt-[var(--space-4)] gap-[var(--space-2)]">
          {/* Show indicators for recent conversations */}
          {conversations.slice(0, 3).map(conv => (
            <button
              key={conv.id}
              onClick={() => onSelectChat(conv.id)}
              title={conv.title}
              className={`w-8 h-8 rounded-[var(--radius-md)] flex items-center justify-center text-xs font-medium transition-all hover:scale-105 ${
                selectedChatId === conv.id 
                  ? 'bg-[var(--accent-primary)] text-white shadow-sm' 
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--accent-ghost)]'
              }`}
            >
              {conv.title.charAt(0).toUpperCase()}
            </button>
          ))}
        </div>
      </Card>
    );
  }

  const ConversationCard = ({ conv }: { conv: ChatConversation }) => {
    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelectChat(conv.id);
      }
    };

    return (
      <div
        key={conv.id}
        onClick={() => onSelectChat(conv.id)} 
        onMouseEnter={() => onHoverConversation(conv.id)}
        onMouseLeave={() => onHoverConversation(null)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Select conversation: ${conv.title}`}
        className={`relative group cursor-pointer transition-all duration-200 rounded-[var(--radius-lg)] p-[var(--space-3)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:ring-offset-2 focus:ring-offset-[var(--bg-primary)] ${
          selectedChatId === conv.id 
            ? 'bg-[var(--accent-soft)] border-l-4 border-[var(--accent-primary)] shadow-sm' 
            : 'hover:bg-[var(--bg-tertiary)] hover:shadow-sm'
        }`}
      >
        <div className="space-y-[var(--space-1)]">
          <div className="flex items-center justify-between gap-[var(--space-2)]">
            <Text 
              size="sm" 
              weight={selectedChatId === conv.id ? "semibold" : "medium"} 
              className={`line-clamp-1 ${selectedChatId === conv.id ? 'text-[var(--accent-primary)]' : ''}`}
            >
              {conv.title}
            </Text>
          </div>
          {conv.lastMessage && (
            <Text 
              size="xs" 
              variant="secondary" 
              className="line-clamp-2 leading-relaxed"
            >
              {conv.lastMessage}
            </Text>
          )}
          <Caption>{conv.timestamp}</Caption>
        </div>
        
        {/* Hover Actions */}
        {hoveredConversationId === conv.id && (
          <div className="absolute top-[var(--space-2)] right-[var(--space-2)] flex gap-[var(--space-1)] opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }} 
              title={conv.isPinned ? "Unpin" : "Pin"}
              className="p-[var(--space-1-5)] hover:bg-[var(--bg-primary)] rounded-[var(--radius-sm)] transition-colors"
              style={{ 
                width: 'var(--space-7)', 
                height: 'var(--space-7)' 
              }}
            >
              <Pin className={`w-3.5 h-3.5 ${conv.isPinned ? 'text-[var(--accent-primary)] fill-[var(--accent-primary)]' : 'text-[var(--text-muted)]'}`} />
            </Button>
            <Button 
              variant="ghost"
              size="icon"
              onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
              title="Delete"
              className="p-[var(--space-1-5)] hover:bg-[var(--error)]/10 rounded-[var(--radius-sm)] transition-colors group/delete"
              style={{ 
                width: 'var(--space-7)', 
                height: 'var(--space-7)' 
              }}
            >
              <Trash2 className="w-3.5 h-3.5 text-[var(--text-muted)] group-hover/delete:text-[var(--error)]" />
            </Button>
          </div>
        )}
      </div>
    );
  };

  return (
    <Card className="w-[340px] h-full flex flex-col" padding="none">
      {/* Header */}
      <div className="p-[var(--space-4)] flex items-center justify-between flex-shrink-0 border-b border-[var(--border-default)]">
        <div className="flex items-center gap-[var(--space-2)]">
          <MessagesSquare className="w-5 h-5 text-[var(--text-secondary)]" />
          <Heading level={3}>Chats</Heading>
        </div>
        <div className="flex items-center gap-[var(--space-2)]">
          <Button 
            onClick={onNewChat}
            variant="primary"
            size="sm"
            className="gap-[var(--space-1-5)]"
          >
            <Plus size={14} /> 
            <span>New</span>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggle}
            title="Hide conversations"
            className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            <PanelLeft size={18} />
          </Button>
        </div>
      </div>
      
      {/* Search */}
      <div className="px-[var(--space-4)] py-[var(--space-3)] flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-[var(--space-3)] top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)] pointer-events-none" />
          <Input 
            type="search" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-10 pr-[var(--space-3)] pl-10 text-[var(--font-size-sm)]"
          />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto px-[var(--space-3)]">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div className="mb-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-2)] px-[var(--space-2)] py-[var(--space-3)]">
              <Pin className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Caption className="tracking-wider font-medium">Pinned</Caption>
            </div>
            <div className="space-y-[var(--space-1)]">
              {pinnedConversations.map(conv => (
                <ConversationCard key={conv.id} conv={conv} />
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Section */}
        {recentConversations.length > 0 && (
          <div className="pb-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-2)] px-[var(--space-2)] py-[var(--space-3)]">
              <MessagesSquare className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <Caption className="tracking-wider font-medium">Recent</Caption>
            </div>
            <div className="space-y-[var(--space-1)]">
              {recentConversations.map(conv => (
                <ConversationCard key={conv.id} conv={conv} />
              ))}
            </div>
          </div>
        )}
        
        {/* Empty State */}
        {filteredConversations.length === 0 && (
          <div className="text-center py-[var(--space-8)]">
            <Text variant="muted" size="sm">No conversations found</Text>
          </div>
        )}
      </div>
    </Card>
  );
}

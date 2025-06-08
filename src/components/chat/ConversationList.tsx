import { Card } from '../ui';
import { ChatConversation } from '../../lib/chatMockData';
import { 
  Plus, Search, Pin, Users, MessagesSquare, Download, Trash2
} from 'lucide-react';

interface ConversationListProps {
  conversations: ChatConversation[];
  selectedChatId: string | null;
  searchQuery: string;
  hoveredConversationId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
  onSearchChange: (query: string) => void;
  onHoverConversation: (conversationId: string | null) => void;
  onTogglePin: (conversationId: string) => void;
  onDeleteConversation: (conversationId: string) => void;
}

export function ConversationList({
  conversations,
  selectedChatId,
  searchQuery,
  hoveredConversationId,
  onSelectChat,
  onNewChat,
  onSearchChange,
  onHoverConversation,
  onTogglePin,
  onDeleteConversation,
}: ConversationListProps) {
  const filteredConversations = conversations.filter(conv => 
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const pinnedConversations = filteredConversations.filter(c => c.isPinned);
  const recentConversations = filteredConversations.filter(c => !c.isPinned);

  const ConversationCard = ({ conv }: { conv: ChatConversation }) => (
    <Card
      key={conv.id}
      padding="sm"
      onClick={() => onSelectChat(conv.id)} 
      onMouseEnter={() => onHoverConversation(conv.id)}
      onMouseLeave={() => onHoverConversation(null)}
      className={`relative group cursor-pointer transition-all duration-200 ${
        selectedChatId === conv.id 
          ? 'bg-primary text-primary-foreground shadow-primary/25 border border-primary/20' 
          : 'hover:bg-muted/60 border border-transparent hover:border-border/50'
      }`}
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-medium text-sm leading-tight line-clamp-1">{conv.title}</h4>
          {conv.participants > 1 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Users className="w-3 h-3" />
              <span>{conv.participants}</span>
            </div>
          )}
        </div>
        {conv.lastMessage && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{conv.lastMessage}</p>
        )}
        <span className="text-xs text-muted-foreground font-medium">{conv.timestamp}</span>
      </div>
      
      {/* Hover Actions */}
      {hoveredConversationId === conv.id && selectedChatId !== conv.id && (
        <div className="absolute top-2 right-2 flex gap-0.5 p-1 bg-popover/95 backdrop-blur-sm rounded-lg shadow-lg border border-border">
          <button 
            onClick={(e) => { e.stopPropagation(); /* TODO: Export conversation */ }} 
            title="Export conversation"
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Download className="w-3 h-3 text-muted-foreground" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onTogglePin(conv.id); }} 
            title={conv.isPinned ? "Unpin conversation" : "Pin conversation"}
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Pin className={`w-3 h-3 ${conv.isPinned ? 'text-primary fill-primary' : 'text-muted-foreground'}`} />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDeleteConversation(conv.id); }} 
            title="Delete conversation"
            className="p-1.5 hover:bg-muted rounded-md transition-colors"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      )}
    </Card>
  );

  return (
    <Card className="w-80 flex flex-col border-r-2 border-border/30" padding="none">
      {/* Header */}
      <div className="p-5 border-b border-border flex items-center justify-between flex-shrink-0 bg-background/50">
        <h2 className="text-base font-semibold text-foreground">Conversations</h2>
        <button 
          onClick={onNewChat}
          className="flex items-center gap-1.5 px-2.5 py-1.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all duration-200 text-sm font-medium hover:scale-[1.02]"
        >
          <Plus size={13} /> 
          New
        </button>
      </div>
      
      {/* Search */}
      <div className="p-4 flex-shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input 
            type="search" 
            placeholder="Search conversations..." 
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full h-9 py-2 pr-3 pl-10 bg-muted/30 border border-border rounded-lg text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent focus:bg-background transition-all duration-200"
          />
        </div>
      </div>
      
      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned Section */}
        {pinnedConversations.length > 0 && (
          <div className="px-4 pt-2 pb-3 border-b border-border/50">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              <Pin className="w-3 h-3" />
              Pinned
            </div>
            <div className="space-y-1">
              {pinnedConversations.map(conv => (
                <ConversationCard key={conv.id} conv={conv} />
              ))}
            </div>
          </div>
        )}
        
        {/* Recent Section */}
        <div className="px-4 pt-4 pb-2">
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            <MessagesSquare className="w-3 h-3" />
            Recent
          </div>
          <div className="space-y-1">
            {recentConversations.map(conv => (
              <ConversationCard key={conv.id} conv={conv} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

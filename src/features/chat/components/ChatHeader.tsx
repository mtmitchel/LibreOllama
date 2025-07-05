import { ChatConversation } from "../../../core/lib/chatMockData";
import { Button, Heading, Text, Badge } from "../../../components/ui";
import { 
  ChevronDown, Download, MoreHorizontal
} from 'lucide-react';

interface ChatHeaderProps {
  selectedChat: ChatConversation;
}

export function ChatHeader({ selectedChat }: ChatHeaderProps) {
  return (
    <header 
      className="border-b border-[var(--border-default)] flex items-center justify-between flex-shrink-0 bg-[var(--bg-surface)]/50 backdrop-blur-sm"
      style={{ 
        padding: 'var(--space-5) var(--space-6)' 
      }}
    >
      <div className="flex items-center gap-[var(--space-4)]">
        <div className="min-w-0 flex-1">
          <Heading level={4} className="mb-[var(--space-1)]">
            {selectedChat.title}
          </Heading>
          <div className="flex items-center gap-[var(--space-4)]">
            <div className="flex items-center gap-[var(--space-2)]">
              <Text size="sm" variant="secondary">Claude 3.5 Sonnet</Text>
              <ChevronDown size={12} className="text-[var(--text-secondary)]" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-[var(--space-2)]">
        <Button variant="secondary" size="sm" className="flex items-center gap-[var(--space-2)]">
          <Download size={14} />
          Export
        </Button>
        <Button variant="ghost" size="icon" className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
          <MoreHorizontal size={18} />
        </Button>
      </div>
    </header>
  );
}

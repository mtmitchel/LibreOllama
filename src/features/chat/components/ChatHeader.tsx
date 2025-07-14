import React from 'react';
import { Button, Heading, Text } from '../../../components/ui';
import { Download, MoreHorizontal } from 'lucide-react';

interface ChatConversation {
  id: string;
  title: string;
  // Add other properties as needed
}

interface ChatHeaderProps {
  selectedChat: ChatConversation;
}

export function ChatHeader({ selectedChat }: ChatHeaderProps) {
  return (
    <header 
      className="border-border-default bg-surface/50 flex shrink-0 items-center justify-between border-b backdrop-blur-sm"
      style={{ 
        padding: 'var(--space-5) var(--space-6)' 
      }}
    >
      <div className="flex items-center gap-4">
        <div className="min-w-0 flex-1">
          <Heading level={4} className="mb-1">
            {selectedChat.title}
          </Heading>
          <Text variant="secondary" size="sm">
            Conversation
          </Text>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="secondary" size="sm" className="flex items-center gap-2">
          <Download size={14} />
          Export
        </Button>
        <Button variant="ghost" size="icon" className="text-secondary hover:text-primary">
          <MoreHorizontal size={18} />
        </Button>
      </div>
    </header>
  );
}

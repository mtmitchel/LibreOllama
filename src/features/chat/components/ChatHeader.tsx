import React from 'react';
import { Button, Heading, Text } from '../../../components/ui';
import { ModelSelector } from './ModelSelector';

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
        </div>
        
        {/* Model Selector */}
        <ModelSelector />
      </div>
    </header>
  );
}

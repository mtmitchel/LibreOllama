import React, { useRef } from 'react';
import { Button, Input } from '../../../components/ui';
import { Paperclip, Send } from 'lucide-react';

interface ChatInputProps {
  newMessage: string;
  selectedChatId: string | null;
  selectedChatTitle?: string;
  onMessageChange: (message: string) => void;
  onSendMessage: (e: React.FormEvent) => void;
  disabled?: boolean;
}

export function ChatInput({
  newMessage,
  selectedChatId,
  selectedChatTitle,
  onMessageChange,
  onSendMessage,
  disabled = false
}: ChatInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e as any);
    }
  };

  return (
    <footer className="flex-shrink-0 bg-[var(--bg-surface)]/80 backdrop-blur-sm">
      {/* Invisible Container - For Alignment Only */}
      <div className="flex items-center gap-[var(--space-3)] p-[var(--space-4)]">
        {/* Left: Attachment IconButton */}
        <Button 
          variant="ghost" 
          size="icon" 
          type="button" 
          title="Attach files"
          className="flex-shrink-0"
        >
          <Paperclip size={16} />
        </Button>
        
        {/* Center: Standard TextField with Own Styling */}
        <form onSubmit={onSendMessage} className="flex-1">
          <Input 
            ref={inputRef}
            value={newMessage}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onMessageChange(e.target.value)}
            placeholder={`Message ${selectedChatTitle || 'AI'}...`}
            onKeyDown={handleKeyDown}
            disabled={disabled || !selectedChatId}
          />
        </form>
        
        {/* Right: Send IconButton */}
        <Button
          type="button"
          onClick={(e) => onSendMessage(e as any)}
          variant={newMessage.trim() && selectedChatId ? "primary" : "secondary"}
          size="icon"
          disabled={!newMessage.trim() || !selectedChatId || disabled}
          title="Send message (Enter)"
          className="flex-shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </footer>
  );
}

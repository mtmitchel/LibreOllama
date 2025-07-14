import React from 'react';
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSendMessage(e as React.FormEvent);
    }
  };

  return (
    <footer className="bg-surface/80 shrink-0 backdrop-blur-sm">
      {/* Invisible Container - For Alignment Only */}
      <div className="flex items-center gap-3 p-4">
        {/* Left: Attachment IconButton */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="text-secondary hover:text-primary"
          title="Attach file"
        >
          <Paperclip size={16} />
        </Button>

        {/* Center: Input Field */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder={selectedChatId ? `Message ${selectedChatTitle || 'conversation'}...` : 'Select a conversation to start chatting...'}
            value={newMessage}
            onChange={(e) => onMessageChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedChatId || disabled}
            className="border-border-default bg-surface"
          />
        </div>

        {/* Right: Send Button */}
        <Button
          type="button"
          onClick={(e) => onSendMessage(e as React.FormEvent)}
          variant={newMessage.trim() && selectedChatId ? "primary" : "secondary"}
          size="icon"
          disabled={!newMessage.trim() || !selectedChatId || disabled}
          title="Send message (Enter)"
          className="shrink-0"
        >
          <Send size={16} />
        </Button>
      </div>
    </footer>
  );
}
